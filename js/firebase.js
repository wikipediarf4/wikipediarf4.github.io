// ===== FIREBASE SETUP (modular ESM — sin eval, compatible con CSP) =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, increment, where, deleteField, Timestamp, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyA9oat9dd0S9vlxkg1osH4dW3XhRDGiOiw",
  authDomain: "charlasrf4.firebaseapp.com",
  projectId: "charlasrf4",
  storageBucket: "charlasrf4.firebasestorage.app",
  messagingSenderId: "345019626508",
  appId: "1:345019626508:web:d099ca499acb29eac12a29"
};
const app = initializeApp(firebaseConfig);

// ===== PUSH NOTIFICATIONS (FCM) =====
let _messaging = null;
try { _messaging = getMessaging(app); } catch(e) {}

// VAPID key publica — generala en Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BAqXiAE3JEYzG07fbtjywuXMM4887gnisTQnS6C14PXIVhUHXnc6JmPGb_C_VITzqnWYNm0lBpyVdcPDqFya83o';

// Registrar service worker y pedir permiso
async function initPushNotifications() {
  if (!('Notification' in window) || !_messaging) return;
  try {
    // Registrar SW
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[FCM] Service worker registrado');

    // Escuchar mensajes cuando la app está abierta
    onMessage(_messaging, (payload) => {
      const { title, body } = payload.notification || {};
      toast('🏆 ' + (body || title || 'Nuevo trofeo publicado'), 'ok');
    });

    // Si ya tiene permiso, obtener token
    if (Notification.permission === 'granted') {
      await _saveFCMToken(reg);
    }
  } catch(e) {
    console.warn('[FCM] Error iniciando push:', e);
  }
}

// Guardar token FCM del usuario en Firestore
async function _saveFCMToken(swReg) {
  if (!window.CU || !_messaging) return;
  try {
    const token = await getToken(_messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (token) {
      await setDoc(doc(db, 'fcmTokens', window.CU.id), {
        token, userId: window.CU.id, nick: window.CU.nick || '?',
        updatedAt: new Date()
      }, { merge: true });
      console.log('[FCM] Token guardado');
    }
  } catch(e) {
    console.warn('[FCM] Error guardando token:', e);
  }
}

// Pedir permiso al usuario (llamar cuando haga click en algo, no automático)
window.requestPushPermission = async function() {
  if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones', 'err'); return; }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (reg) await _saveFCMToken(reg);
    toast('🔔 Notificaciones activadas', 'ok');
  } else {
    toast('Notificaciones bloqueadas', 'err');
  }
};

// Notificar a todos los suscriptores cuando se publica un trofeo
async function _notifyNewTrophy(fish, weight, nick, imageUrl) {
  try {
    // Guardar notificacion pendiente en Firestore — un Cloud Function o el propio cliente la procesa
    await addDoc(collection(db, 'pushQueue'), {
      type: 'newTrophy',
      title: '🏆 Nuevo trofeo publicado',
      body: nick + ' atrapó ' + fish + (weight ? ' de ' + (Number(weight)>=1 ? Number(weight).toFixed(3)+' kg' : Math.round(Number(weight)*1000)+' g') : ''),
      imageUrl: imageUrl || '',
      createdAt: new Date()
    });
  } catch(e) {}
}
const storage = getStorage(app);

const auth = getAuth(app);
// Set persistence immediately
(async()=>{ try{ await setPersistence(auth, browserLocalPersistence); }catch(e){} })();
const db = getFirestore(app);
window.db = db;
window._fsImports = { collection, query, where, orderBy, onSnapshot, addDoc };
// Exponer funciones Firestore para módulos externos (cebos, chat global, etc.)
window._fsLib = { getDocs, query, collection, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc };
window.firebaseFirestore = { getDocs, query, collection, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc };

// ===== STATE =====
window.CU = null;
// ── HELPER: detectar si un usuario es admin ──
function isAdminUser(u){
  if(!u) return false;
  return u.role==='admin' || u.nick==='ruizgustavo12' || u.email==='synxyes@gmail.com';
}
function isAdminUid(uid){
  // Check against known admin uid or loaded profile data
  if(!uid) return false;
  const friends = window.CU?.friendsList || [];
  const f = friends.find(f=>f.id===uid);
  if(f && isAdminUser(f)) return true;
  return false;
}

let _posts = [];
let _stories = [];
let _svIdx = 0;
let _storyEmojiPick = '';
let _postImgData = null;
let _storyImgData = null;
let _rxnTimers = {};
let _unsubPosts = null;
let _unsubStories = null;

const REACTIONS = [
  {emoji:'👍', label:'Me gusta', color:'#2078f4'},
  {emoji:'❤️', label:'Me encanta', color:'#f33e58'},
  {emoji:'😂', label:'Me divierte', color:'#f7b125'},
  {emoji:'😮', label:'Me asombra', color:'#f7b125'},
  {emoji:'😢', label:'Me entristece', color:'#f7b125'},
  {emoji:'😡', label:'Me enoja', color:'#e9710f'},
];
const REACTION_EMOJIS = REACTIONS.map(r=>r.emoji);
const FISH_EMOJIS = {'Pike':'🐟','Catfish':'🦈','Bream':'🐡','Perch':'🐠','Carp':'🐟','Trout':'🐟','Salmon':'🐟','Burbot':'🐟','Ruffe':'🐟','Tench':'🐟'};

function save(k,v){try{localStorage.setItem('crf4_'+k,JSON.stringify(v));}catch(e){}}
function load(k,def){try{const v=localStorage.getItem('crf4_'+k);return v?JSON.parse(v):def;}catch(e){return def;}}

// ===== UPLOAD IMAGE TO IMGBB =====
// ── Cloudinary config ──
const CLOUDINARY_CLOUD = 'da0n5tg3g';
const CLOUDINARY_PRESET = 'wikipediarf4';
const CLOUDINARY_VIDEO_PRESET = 'wikipediarf4_video';

async function uploadImage(fileOrBase64, folder) {
  // Convertir a blob si es base64 o URL
  let blob;
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
    const res = await fetch(fileOrBase64);
    blob = await res.blob();
  } else if (typeof fileOrBase64 === 'string') {
    const res = await fetch(fileOrBase64);
    blob = await res.blob();
  } else {
    blob = fileOrBase64;
  }

  // Comprimir si es imagen y pesa más de 800KB
  if (blob.type.startsWith('image/') && blob.size > 800000) {
    blob = await _compressImage(blob, 1200, 0.82);
  }

  // Agregar marca de agua si es imagen de trofeo
  if (blob.type.startsWith('image/') && folder && folder.includes('trofeo')) {
    blob = await _addWatermark(blob);
  }

  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', 'rf4/' + (folder || 'general'));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Error subiendo imagen a Cloudinary');
  return data.secure_url;
}

// Agregar marca de agua www.wikipediarf4.uy
function _addWatermark(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Dibujar imagen original
      ctx.drawImage(img, 0, 0);

      // Configurar marca de agua — letras más grandes y brillantes
      const text = 'www.wikipediarf4.uy';
      const fontSize = Math.max(20, Math.round(img.width * 0.042));
      ctx.font = `bold ${fontSize}px Exo 2, Arial, sans-serif`;

      const padding = Math.round(fontSize * 0.55);
      const textWidth = ctx.measureText(text).width;
      const boxW = textWidth + padding * 2;
      const boxH = fontSize + padding * 1.3;
      const x = img.width - boxW - 14;
      const y = img.height - boxH - 14;

      // Fondo semitransparente con borde teal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(46,196,182,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 8);
      ctx.stroke();

      const textX = x + padding;
      const textY = y + boxH - padding * 0.65;

      // Sombra
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Gradiente de colores brillantes: teal → dorado → teal
      const grad = ctx.createLinearGradient(textX, 0, textX + textWidth, 0);
      grad.addColorStop(0,   '#2ec4b6');
      grad.addColorStop(0.4, '#ffffff');
      grad.addColorStop(0.7, '#ffd700');
      grad.addColorStop(1,   '#2ec4b6');

      ctx.fillStyle = grad;
      ctx.fillText(text, textX, textY);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      canvas.toBlob(b => resolve(b || blob), 'image/jpeg', 0.93);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
    img.src = url;
  });
}

// Comprimir imagen antes de subir
function _compressImage(blob, maxW, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => resolve(b || blob), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob); };
    img.src = url;
  });
}

// Upload video to Cloudinary
async function uploadVideo(file, folder) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_VIDEO_PRESET);
  formData.append('folder', 'rf4/' + (folder || 'videos'));
  formData.append('resource_type', 'video');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if(!data.secure_url) throw new Error(data.error?.message || 'Error subiendo video');
  return data.secure_url;
}

// ===== REALTIME LISTENERS =====

// Caché de usuarios verificados — se actualiza en tiempo real
window._verifUsers = {};
window._usersShop = {}; // cache shopEquipped
let _usersLastFetch = 0;
async function listenVerifiedUsers(){
  // Solo recargar si pasaron más de 5 minutos
  if(Date.now() - _usersLastFetch < 1800000 && Object.keys(window._verifUsers||{}).length > 0) return; // Cache 30 min
  try {
    const snap = await getDocs(query(collection(db,'users'), limit(500)));
    window._verifUsers = {};
    window._usersShop = {};
    snap.docs.forEach(d => {
      const data = d.data();
      if(data.verified === true) window._verifUsers[d.id] = true;
      window._usersShop[d.id] = data.shopEquipped || {};
    });
    _usersLastFetch = Date.now();
  } catch(e){ console.warn('listenVerifiedUsers error:', e); }
}

let _postsUnsub = null;
let _postsRetryTimer = null;
function listenPosts() {
  if(_postsUnsub){ _postsUnsub(); _postsUnsub = null; }
  if(_postsRetryTimer){ clearTimeout(_postsRetryTimer); _postsRetryTimer = null; }

  const feedEl = document.getElementById('feedPosts');
  if(feedEl && feedEl.innerHTML.includes('Cargando feed')){
    feedEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:.85rem;">⏳ Conectando...</div>';
  }

  _postsUnsub = onSnapshot(
    query(collection(db, 'posts'), orderBy('time', 'desc'), limit(50)),
    { includeMetadataChanges: false },
    snap => {
      // Solo procesar cambios reales, ignorar metadata (pending writes, cache)
      if(snap.metadata.fromCache) return;
      _posts = snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().time?.toMillis?.() || Date.now() }));
      const activePage = document.querySelector('.page.active');
      const pageId = activePage ? activePage.id : '';
      if(pageId === 'page-profile'){ renderProfileFeed(); }
      else if(pageId === 'page-casitrofeo'){ renderMapPosts(); }
      else {
        const feedEl = document.getElementById('feedPosts');
        if(feedEl && _posts.length){
          const banner = feedEl.querySelector('[data-popular-banner]');
          if(banner) banner.remove();
        }
        renderFeed();
      }
    },
    err => {
      console.warn('listenPosts error:', err);
      // Fallback: intentar getDocs sin orderBy (evita error de índice faltante)
      getDocs(query(collection(db, 'posts'), orderBy('time','desc'), limit(50))).then(snap => {
        _posts = snap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().time?.toMillis?.() || Date.now() }))
          .sort((a,b) => b.time - a.time).slice(0, 50);
        renderFeed();
      }).catch(e2 => {
        console.error('listenPosts fallback error:', e2);
        const el2 = document.getElementById('feedPosts');
        if(el2) el2.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:.85rem;">⚠️ Error al cargar el feed.<br><button onclick="listenPosts()" style="margin-top:12px;background:var(--accent);color:#000;border:none;border-radius:8px;padding:8px 20px;font-size:.82rem;font-weight:700;cursor:pointer;">🔄 Reintentar</button></div>';
      });
      // Reintentar el listener en 15 segundos
      _postsRetryTimer = setTimeout(()=>{ listenPosts(); }, 15000);
    }
  );
}









let _storiesUnsub = null;
function listenStories() {
  if(_storiesUnsub){ _storiesUnsub(); _storiesUnsub = null; }
  _storiesUnsub = onSnapshot(
    query(collection(db, 'stories'), orderBy('time', 'desc'), limit(80)),
    { includeMetadataChanges: false },
    snap => {
      const now = Date.now();
      const expiredIds = [];
      _stories = snap.docs.filter(d => {
        const raw = d.data().time;
        const t = raw?.toMillis ? raw.toMillis() : (typeof raw === 'number' ? raw : 0);
        const ttl = d.data().userVerified ? 172800000 : 86400000; // 48h verificados, 24h el resto
        // t===0 = serverTimestamp pendiente (historia recién publicada) — incluir siempre
        if(t === 0) return true;
        if((now - t) > ttl){ expiredIds.push(d.id); return false; }
        return true;
      }).map(d => {
        const raw = d.data().time;
        const t = raw?.toMillis ? raw.toMillis() : (typeof raw === 'number' ? raw : Date.now());
        return { id: d.id, ...d.data(), time: t };
      });
      // Intentar borrar las expiradas (solo funciona si el usuario es el dueño o admin)
      if(!snap.metadata.hasPendingWrites){
        expiredIds.forEach(id => {
          deleteDoc(doc(db, 'stories', id)).catch(()=>{}); // silencioso si no hay permisos
        });
      }
      renderStories();
    },
    err => { console.warn('listenStories error:', err); }
  );
}

// ===== INIT =====
function init(){
  // Mostrar splash 2 segundos
  setTimeout(()=>{
    const s = document.getElementById('splash');
    if(s){ s.classList.add('hide'); setTimeout(()=>s.remove(), 500); }
  }, 2000);
  // Cargar cuentas guardadas en pantalla de login
  loadSavedAccounts();

  // Persistence is set via top-level IIFE below

  // Safety timeout — if Firebase takes too long, show login anyway
  const _splashTimeout = setTimeout(()=>{
    const splash = document.getElementById('splashScreen');
    if(splash && splash.style.display !== 'none'){
      splash.style.display = 'none';
      document.getElementById('mAuth').style.display = 'block';
      setTimeout(loadAuthTrofeos, 1000);
    }
  }, 4000);

  // Escuchar estado de auth
  onAuthStateChanged(auth, async user => {
    clearTimeout(_splashTimeout);
    const splash = document.getElementById('splashScreen');
    const hideSplash = () => { if(splash) splash.style.display = 'none'; };
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          window.CU = {id: user.uid, ...snap.data()};
          // ── Chequear vencimiento de premium automático ──
          if(window.CU.role === 'premium' && window.CU.premiumReason === 'auto_5trofeos' && window.CU.premiumExpiry){
            const expiry = new Date(window.CU.premiumExpiry);
            if(new Date() > expiry){
              // Vencido: revocar premium y mostrar mensaje
              try{
                await updateDoc(doc(db,'users',user.uid),{ role:'pescador', premiumExpired: true });
                window.CU.role = 'pescador';
                setTimeout(function(){
                  toast('⭐ Tu Premium de 15 días venció. ¡Suscribite por $1/mes para seguir disfrutando los beneficios!','inf');
                  setTimeout(openPremiumModal, 2500);
                }, 2000);
              }catch(e){ console.warn('Expiry check error:',e); }
            }
          }
          if(window._userInfoCache) window._userInfoCache[user.uid] = {nick: window.CU.nick||'', av: window.CU.av||'', gender: window.CU.gender||'', country: window.CU.country||''};
          document.getElementById('mAuth').style.display = 'none';
          hideSplash();
          if(!window.CU.country){
            window._pendingGoogleOnboard = false;
            const cpModal = document.getElementById('mCountryPick');
            if(cpModal){ cpModal.style.display='flex'; }
          } else {
            onLogin();
          }
        } else {
          hideSplash();
          document.getElementById('mAuth').style.display = 'block';
        }
      } catch(e) {
        console.error('Auth error:', e);
        hideSplash();
        document.getElementById('mAuth').style.display = 'block';
      }
    } else {
      window.CU = null;
      hideSplash();
      document.getElementById('mAuth').style.display = 'block';
      setTimeout(loadAuthTrofeos, 1000);
    }
  });
}

// ===== CARGA TROFEOS EN PANTALLA DE LOGIN =====
// Opcion 3: lee solo 1 documento (config/lastTrophy) en vez de toda la coleccion
function loadAuthTrofeos(){
  const el = document.getElementById('authTrofeosList');
  if(!el) return;
  getDoc(doc(db,'config','lastTrophy')).then(snap => {
    if(!snap.exists()){
      el.innerHTML='<div style="font-size:.75rem;color:#8b949e;text-align:center;padding:8px;">Sin trofeos aun</div>';
      return;
    }
    const t = snap.data();
    const img = t.imageUrl||'';
    const fish = (t.fish||'?').substring(0,28);
    const kg = t.weight||0;
    const map = (t.map||'').substring(0,22);
    const nick = (t.nick||'Anonimo').substring(0,20);
    let w = '';
    if(kg){
      const n = Number(kg);
      w = n >= 1 ? (n.toFixed(3)+' kg') : (Math.round(n*1000)+' g');
    }
    el.innerHTML = `<div style="display:flex;align-items:center;gap:12px;background:rgba(255,215,0,.07);border:1px solid rgba(255,215,0,.25);border-radius:12px;padding:10px 14px;">
      ${img
        ? `<img src="${img}" style="width:72px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;border:1.5px solid rgba(255,215,0,.3);" onerror="this.style.display='none'">`
        : `<div style="width:72px;height:72px;border-radius:10px;background:rgba(255,215,0,.1);display:flex;align-items:center;justify-content:center;font-size:2.2rem;flex-shrink:0;">&#x1F41F;</div>`}
      <div style="min-width:0;flex:1;">
        <div style="font-family:'Orbitron',monospace;font-size:.82rem;font-weight:900;color:var(--gold,#d4a017);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">&#x1F947; ${fish}</div>
        ${w?`<div style="font-size:1rem;font-weight:800;color:#e6edf3;margin-top:2px;">${w}</div>`:''}
        <div style="font-size:.7rem;color:#8b949e;margin-top:3px;">${map?'&#x1F4CD; '+map+' &middot; ':''}<span style="color:var(--accent,#2ec4b6);">@${nick}</span></div>
      </div>
    </div>`;
  }).catch(e=>{
    console.error('loadAuthTrofeos:', e);
    el.innerHTML='';
  });
}
// ===== DEMO DATA =====
// ===== UTILS =====
function toast(msg, type='inf'){
  const ct = document.getElementById('toastCt');
  if(!ct) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = type==='ok'?'✅':type==='err'?'❌':'ℹ️';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  ct.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='all .3s'; setTimeout(()=>t.remove(),300); }, 3000);
}

function fmtT(ts){
  if(!ts) return '';
  // Manejar Firestore Timestamp o número
  const ms = ts?.toMillis ? ts.toMillis() : (typeof ts === 'number' ? ts : 0);
  if(!ms) return '';
  const d = new Date(ms), now = Date.now(), diff = now - d.getTime();
  if(diff < 0) return 'Ahora';
  if(diff < 60000) return 'Ahora';
  if(diff < 3600000) return Math.floor(diff/60000)+'m';
  if(diff < 86400000) return Math.floor(diff/3600000)+'h';
  return '';
}

function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function fmtKg(w){ var n=parseFloat(w)||0; return n>=1 ? n.toFixed(3)+' kg' : Math.round(n*1000)+' g'; }

function renderCommentText(text){
  if(!text) return '';
  const escaped = esc(text);
  return escaped.replace(/@(\w{2,30})/g, (match, nick)=>{
    return '<span style="color:var(--accent);font-weight:700;cursor:pointer;" onclick="searchMentionedUser(\'' + nick + '\')">' + '@' + nick + '</span>';
  });
}

async function searchMentionedUser(nick){
  if(!nick) return;
  try {
    const snap = await getDocs(query(collection(db,'users'), where('nickLower','==',nick.toLowerCase()), limit(1)));
    const user = snap.docs.length ? {id:snap.docs[0].id,...snap.docs[0].data()} : null;
    if(user) openUserProfile(user.id, user.nick);
    else toast('@'+nick+' no encontrado','err');
  } catch(e){ toast('Error buscando usuario','err'); }
}

function showNotifToast(text){
  const ct = document.getElementById('toastCt');
  if(!ct) return;
  const isMsg = text?.startsWith('💬');
  const t = document.createElement('div');
  t.className='toast ok';
  t.style.cssText='display:flex;gap:8px;align-items:center;max-width:300px;cursor:pointer;';
  t.innerHTML=(isMsg?'<span>💬</span>':'<span>🔔</span>')+'<span style="font-size:.82rem;flex:1;">'+text.slice(0,80)+'</span>';
  t.onclick=()=>{
    t.remove();
    if(isMsg){
      openMessenger();
    } else {
      openNotifDropdown();
    }
  };
  ct.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(()=>t.remove(),400); },4000);
}

function getDemoFriends(){
  // Returns real friends from CU data
  return window.CU?.friendsList || [];
}

// ===== GOOGLE LOGIN =====
async function doGoogleLogin(){
  const errEl = document.getElementById('lErr');
  errEl.textContent = ''; errEl.style.display = 'none';
  try {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if(!userSnap.exists()){
      const nick = (user.displayName?.replace(/\s+/g,'') || 'User' + Date.now().toString().slice(-4));
      const newUser = {
        nick, nickLower: nick.toLowerCase(),
        email: user.email,
        av: user.photoURL || '',
        cover: '', bio: '', country: '',
        favFish: '', favMap: '',
        social_yt: '', social_dc: '',
        joined: new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}),
        posts: 0, friends: 0, likes: 0,
        createdAt: serverTimestamp()
      };
      await setDoc(userRef, newUser);
      window.CU = { id: user.uid, ...newUser };
      document.getElementById('mAuth').style.display = 'none';
      window._pendingGoogleOnboard = true;
      const cpModal = document.getElementById('mCountryPick');
      if(cpModal){ cpModal.style.display='flex'; }
      return;
    } else {
      window.CU = { id: user.uid, ...userSnap.data() };
    }
    if(!window.CU.country){
      document.getElementById('mAuth').style.display = 'none';
      window._pendingGoogleOnboard = false;
      const cpModal = document.getElementById('mCountryPick');
      if(cpModal){ cpModal.style.display='flex'; }
      return;
    }
    document.getElementById('mAuth').style.display = 'none';
    onLogin();
    toast('¡Bienvenido ' + window.CU.nick + '! 🎣', 'ok');
  } catch(e) {
    if(e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return;
    errEl.style.display = 'block';
    errEl.textContent = e.message;
  }
}

// ===== FACEBOOK LOGIN =====
// ===== CONFIRMAR PAÍS =====
window.confirmCountryPick = async function(){
  const sel = document.getElementById('cpCountrySelect');
  const errEl = document.getElementById('cpErr');
  const country = sel ? sel.value.trim() : '';
  if(!country){ if(errEl){ errEl.style.display='block'; } return; }
  if(errEl) errEl.style.display='none';
  try {
    if(window.CU?.id){
      const { doc: _doc, updateDoc: _upd } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      await _upd(_doc(db,'users',window.CU.id), { country });
      window.CU.country = country;
    }
    const cpModal = document.getElementById('mCountryPick');
    if(cpModal) cpModal.style.display='none';
    onLogin();
    toast('¡Bienvenido ' + window.CU.nick + '! 🎣', 'ok');
  } catch(e){
    if(window.CU) window.CU.country = country;
    const cpModal = document.getElementById('mCountryPick');
    if(cpModal) cpModal.style.display='none';
    onLogin();
    toast('¡Bienvenido ' + window.CU.nick + '! 🎣', 'ok');
  }
};

// ===== AUTH =====
async function doLogin(){
  let input = document.getElementById('lEmail').value.trim();
  const pw = document.getElementById('lPass').value;
  const errEl = document.getElementById('lErr');
  const btn = document.getElementById('loginBtn');
  errEl.textContent = ''; errEl.style.display='none';
  if(!input||!pw){ errEl.textContent='Completa todos los campos'; errEl.style.display='block'; return; }

  if(btn){ btn.disabled=true; btn.textContent='Iniciando...'; }

  // If input doesn't look like an email, treat it as a nick — look up the email
  if(!input.includes('@')){
    try {
      const nickLower = input.toLowerCase();
      let found = null;
      try {
        const q = await getDocs(query(collection(db,'users'), where('nickLower','==',nickLower)));
        if(q && !q.empty) found = q.docs[0];
      } catch(e2){ console.warn('nickLower query error:', e2); }
      if(!found){
        try {
          const q2 = await getDocs(query(collection(db,'users'), where('nick','==',input)));
          if(q2 && !q2.empty) found = q2.docs[0];
        } catch(e3){ console.warn('nick query error:', e3); }
      }
      if(!found){
        // Last resort: scan users (only if small collection)
        try {
          const all = await getDocs(query(collection(db,'users'), limit(300)));
          found = all.docs.find(d => {
            const n = d.data().nick||'';
            const nl = d.data().nickLower||'';
            return n===input || nl===nickLower || n.toLowerCase()===nickLower;
          });
        } catch(e4){ console.warn('scan error:', e4); }
      }
      if(!found){
        errEl.textContent = 'Nick no encontrado. Probá con tu email.';
        errEl.style.display='block';
        if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión'; }
        return;
      }
      input = found.data().email;
      if(!input){
        errEl.textContent = 'No se pudo obtener el email de este nick';
        errEl.style.display='block';
        if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión'; }
        return;
      }
    } catch(e){
      errEl.textContent = 'Error de conexión. Reintentá.';
      errEl.style.display='block';
      if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión'; }
      return;
    }
  }

  try {
    // Apply persistence based on checkbox
    const remember = document.getElementById('rememberMe')?.checked !== false;
    await setPersistence(auth, browserLocalPersistence);
    const cred = await signInWithEmailAndPassword(auth, input, pw);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if(!snap.exists()){
      errEl.textContent = 'Cuenta no encontrada en la base de datos.';
      if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión'; }
      return;
    }
    window.CU = {id: cred.user.uid, ...snap.data()};
    saveAccountLocally(input, window.CU.nick, pw, window.CU.av||'');
    document.getElementById('mAuth').style.display='none';
    onLogin();
    toast('¡Bienvenido '+window.CU.nick+'! 🎣','ok');
  } catch(e) {
    let msg = 'Error: ' + (e.code || e.message || 'desconocido');
    if(e.code === 'auth/invalid-email') msg = 'Email inválido';
    else if(e.code === 'auth/user-not-found') msg = 'Usuario no encontrado. Verificá el email.';
    else if(e.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
    else if(e.code === 'auth/invalid-credential') msg = 'Email o contraseña incorrectos. Verificá bien los datos.';
    else if(e.code === 'auth/invalid-login-credentials') msg = 'Email o contraseña incorrectos. Verificá bien los datos o usá ¿Olvidaste tu contraseña?';
    else if(e.code === 'auth/user-disabled') msg = 'Esta cuenta fue deshabilitada.';
    else if(e.code === 'auth/too-many-requests') msg = 'Demasiados intentos. Esperá unos minutos.';
    else if(e.code === 'auth/network-request-failed') msg = 'Error de red. Verificá tu conexión.';
    else if(e.code === 'auth/operation-not-allowed') msg = '⚠️ Login con email no está habilitado en Firebase. Activalo en Firebase Console → Authentication → Sign-in methods.';
    else if(e.code === 'auth/configuration-not-found') msg = '⚠️ Firebase no está configurado para email/contraseña. Activalo en Firebase Console.';
    errEl.textContent = msg;
    errEl.style.display='block';
    console.error('Login error:', e.code, e.message);
    if(btn){ btn.disabled=false; btn.textContent='Iniciar sesión'; }
  }
}

async function doReg(){
  const nick = document.getElementById('rNick').value.trim();
  const em = document.getElementById('rEmail').value.trim();
  const pw = document.getElementById('rPass').value;
  const country = document.getElementById('rCountry').value;
  const rErrEl=document.getElementById('rErr'); rErrEl.textContent=''; rErrEl.style.display='none';
  if(!nick||!em||!pw){ document.getElementById('rErr').textContent='Completa los campos obligatorios'; return; }
  if(pw.length<6){ document.getElementById('rErr').textContent='Mínimo 6 caracteres'; return; }
  if(!document.getElementById('acceptTerms')?.checked){ document.getElementById('rErr').textContent='Debés aceptar los Términos y Condiciones'; return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, em, pw);
    window.CU = {id:cred.user.uid, nick, nickLower:nick.toLowerCase(), email:em, country, av:'', cover:'', bio:'', favFish:'', favMap:'', social_yt:'', social_dc:'', joined:new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}), posts:0, friends:0, likes:0};
    await setDoc(doc(db, 'users', cred.user.uid), window.CU);
    document.getElementById('mAuth').style.display='none';
    onLogin(); toast('¡Bienvenido '+nick+'! 🎣','ok');
  } catch(e) {
    document.getElementById('rErr').textContent = e.code === 'auth/email-already-in-use' ? 'Email ya registrado' : e.message;
  }
}

function onLogin(){
  // Mostrar sección Tienda si es admin
  if(typeof tiendaCheckAdmin === 'function') setTimeout(tiendaCheckAdmin, 200);
  // Iniciar push notifications
  setTimeout(async () => {
    await initPushNotifications();
    // Actualizar texto del menú si ya tiene permiso
    if (Notification.permission === 'granted') {
      const btn = document.getElementById('pushNotifMenuItem');
      if (btn) btn.innerHTML = '🔔 Notificaciones activadas ✓';
    }
  }, 2000);
  updateNavUI();
  listenVerifiedUsers().then(()=>{ listenPosts(); listenStories(); }).catch(()=>{ listenPosts(); listenStories(); });
  // Borrar historias propias vencidas al iniciar sesión
  setTimeout(async ()=>{
    if(!window.CU?.id) return;
    try {
      const snap = await getDocs(query(collection(db,'stories'), where('userId','==',window.CU.id)));
      const now = Date.now();
      snap.docs.forEach(d => {
        const raw = d.data().time;
        const t = raw?.toMillis ? raw.toMillis() : (typeof raw === 'number' ? raw : 0);
        const ttl = d.data().userVerified ? 172800000 : 86400000;
        if(t && (now - t) > ttl) deleteDoc(doc(db,'stories',d.id)).catch(()=>{});
      });
    } catch(e){}
  }, 3000);
  startPresence().then(()=>{ if(typeof updatePresenceActivity==='function') updatePresenceActivity('home'); });
  listenNotifs();
  listenTrofeosSidebar();
  loadAds();
  // Inicializar anuncios AdSense para usuarios no-premium
  setTimeout(function(){ window.loadAdsIfNeeded && window.loadAdsIfNeeded(); }, 1500);
  loadPezSemana();
  loadXPLevels();
  loadShopEquipped();
  // Update wiki trofeos auth-dependent UI
  const wkPub = document.getElementById('wkNbPublish');
  if(wkPub) wkPub.style.display = '';
  if(window.CU && (window.CU.nick===WK_ADMIN||window.CU.role==='admin')) {
    const wkAdm = document.getElementById('wkNbAdmin');
    if(wkAdm) wkAdm.style.display = '';
  }
  // Update "Crear historia" card with user photo
  const storyPhoto = document.getElementById('storyAddPhoto');
  const storyPhotoInner = document.getElementById('storyAddPhotoInner');
  if(storyPhoto && window.CU){
    if(window.CU.av){
      storyPhoto.innerHTML = `<img src="${window.CU.av}" style="width:100%;height:100%;object-fit:cover;">`;
    } else if(storyPhotoInner){
      storyPhotoInner.textContent = (window.CU.nick||'?')[0].toUpperCase();
      storyPhotoInner.style.opacity = '0.7';
      storyPhotoInner.style.fontSize = '3.5rem';
      storyPhotoInner.style.fontWeight = '800';
    }
  }
  checkFriendsBirthdays();
  if(typeof window._checkChangelog === 'function') window._checkChangelog();
  if(typeof _updatePostBoxPlaceholder === 'function') _updatePostBoxPlaceholder();
  loadRealFriends().then(()=>{
    renderProfile();
    renderSidebarFriends();
    renderSuggestedUsers();
    renderNewFishers();
    listenLive();
    renderSuggestedPosts();
    renderFriendSpotsInHome();
    checkDailyStreak();
    // Cargar recuerdos
    if(typeof loadMemories === 'function') setTimeout(loadMemories, 1500);
  });
  loadSavedAccounts();
  // Navigate to initial URL route after login
  const _initPath = window._initialPath || window.location.pathname;
  window._initialPath = null;
  window._initialRoute = null;
  if (_initPath && _initPath !== '/' && _initPath !== '/home') {
    setTimeout(() => {
      // Handle /<nick> -> user profile (URL legacy sin /u/)
      if (!_initPath.startsWith('/u/') && !_initPath.startsWith('/mensajes') && !_initPath.startsWith('/notif') && ROUTES[_initPath] === undefined && _initPath.length > 1 && !_initPath.includes('.')) {
        const nickSlugLegacy = _initPath.slice(1);
        window.gp('userprofile', false);
        getDocs(query(collection(db,'users'), limit(300))).then(snap => {
          const found = snap.docs.find(d => {
            const n = (d.data().nick||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
            return n === nickSlugLegacy;
          });
          if(found){ 
            _loadUserProfilePage(found.id, found.data().nick||nickSlugLegacy);
            // Actualizar URL a formato correcto
            history.replaceState({page:'userprofile',uid:found.id,nick:found.data().nick}, '', '/u/'+nickSlugLegacy);
          } else {
            window.gp('home', false);
          }
        }).catch(()=>{ window.gp('home', false); });
        return;
      }
      // Handle /u/nick -> user profile
      if (_initPath.startsWith('/u/')) {
        const nickSlug = _initPath.slice(3);
        window.gp('userprofile', false);
        // Try to find user by nick slug from Firestore
        getDocs(query(collection(db,'users'), limit(300))).then(snap => {
          const found = snap.docs.find(d => {
            const n = (d.data().nick||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
            return n === nickSlug;
          });
          if (found) _loadUserProfilePage(found.id, found.data().nick||nickSlug);
        }).catch(()=>{});
        return;
      }
      // Handle /mensajes/nick -> open chat
      if (_initPath.startsWith('/mensajes/')) {
        om('mMessenger');
        renderMessengerList();
        return;
      }
      // Handle /mensajes -> open messenger
      if (_initPath === '/mensajes') {
        om('mMessenger');
        renderMessengerList();
        return;
      }
      // Handle /notificaciones -> open notif dropdown
      if (_initPath === '/notificaciones') {
        openNotifDropdown();
        return;
      }
      // Handle standard page routes
      const pageId = ROUTES[_initPath];
      if (pageId && pageId !== 'home') window.gp(pageId, false);
    }, 600);
  }
}

async function loadRealFriends(){
  if(!window.CU) return;
  const friendIds = window.CU.friends || [];
  if(!friendIds.length){ window.CU.friendsList = []; renderSidebarFriends(); return; }
  try {
    const snaps = await Promise.all(friendIds.map(id=>getDoc(doc(db,'users',id))));
    window.CU.friendsList = snaps.filter(s=>s.exists()).map(s=>({id:s.id,...s.data()}));
  } catch(e){ window.CU.friendsList = []; }
  renderSidebarFriends();
  renderSuggestedUsers();
  renderNewFishers();
  renderSuggestedPosts();
  // ✅ Relanzar listeners de badge de mensajes con la lista actualizada de amigos
  if(typeof listenUnreadMsgsBadge === 'function') listenUnreadMsgsBadge();
}

function updateNavUI(){
  // Show footer when logged in
  const footer = document.getElementById('siteFooter');
  if(footer) footer.style.display='block';
  if(!window.CU) return;
  const av = `<img src="${window.CU.av||getDefaultAv(window.CU.gender||'')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  document.getElementById('navAv').innerHTML = av;
  document.getElementById('slAv').innerHTML = av;
  document.getElementById('slName').textContent = window.CU.nick;
  document.getElementById('pbAv').innerHTML = av;
  if(document.getElementById('pbAv2')) document.getElementById('pbAv2').innerHTML = av;
  document.getElementById('cpAv').innerHTML = av;
  document.getElementById('cpName').textContent = window.CU.nick;
  // User menu
  document.getElementById('userMenuNick').textContent = window.CU.nick;
  document.getElementById('userMenuEmail').textContent = window.CU.email||'';
  // Admin button — visible solo para ruizgustavo12
  const isAdmin = window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com';
  const adminNavBtn = document.getElementById('adminNavBtn');
  const userMenuAdmin = document.getElementById('userMenuAdmin');
  const shopNavBtn = document.getElementById('shopNavBtn');
  if(adminNavBtn) adminNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if(userMenuAdmin) userMenuAdmin.style.display = isAdmin ? 'flex' : 'none';
  if(shopNavBtn) shopNavBtn.style.display = 'inline-flex'; // visible para todos
}

function renderShopPage(){
  // Re-render the shop grid into the standalone page
  renderShopGrid();
}

function showReg(){ document.getElementById('authForm').style.display='none'; document.getElementById('regForm').style.display='block'; }
function showLogin(){ document.getElementById('authForm').style.display='block'; document.getElementById('regForm').style.display='none'; }
function showTerms(){
  document.getElementById('mTerms').style.display='block';
  document.getElementById('mTerms').scrollTop=0;
}
function closeTerms(){
  document.getElementById('mTerms').style.display='none';
}
function acceptTermsAndRegister(){
  const cb = document.getElementById('acceptTerms');
  if(cb) cb.checked = true;
  closeTerms();
  showReg();
}

// ===== PAGES =====

// ===== URL ROUTER =====
const ROUTES = {
  '/': 'home',
  '/home': 'home',
  '/': 'home',
  '': 'home',
  '/home': 'home',
  '/amigos': 'amigos',
  '/tienda': 'shop',
  '/trofeos-resientes': 'trofeos-feed',
  '/reels': 'reels',
  '/galeria': 'galeria',
  '/videos': 'videos',
  '/skill': 'skill',
  '/spots': 'spots',
  '/torneos': 'torneos',
  '/ranking-semanal': 'ranking-semanal',
  '/perfil': 'profile',
  '/peso-del-trofeo': 'peso-del-trofeo',

  '/parches': 'parches',
  '/soporte': 'soporte',
  '/casitrofeo': 'casitrofeo',
  '/mensajes': 'mensajes',
  '/notificaciones': 'notificaciones',
  '/pez-semanal': 'pez-semanal',
  '/publicar-trofeos': 'wiki-trofeos',
  '/privacidad': 'privacidad',
};

// Map page IDs to clean URLs
const PAGE_TO_URL = {
  'home':          '/',
  'amigos':        '/amigos',
  'shop':          '/tienda',
  'trofeos-feed':  '/trofeos-resientes',
  'compartir-spot': '/compartir-spot',
  'reels':          '/reels',
  'galeria':       '/galeria',
  'videos':        '/videos',
  'skill':         '/skill',
  'spots':         '/spots',
  'torneos':       '/torneos',
  'ranking-semanal': '/ranking-semanal',
  'profile':       '/perfil',
  'peso-del-trofeo': '/peso-del-trofeo',

  'parches':       '/parches',
  'soporte':       '/soporte',
  'casitrofeo':    '/casitrofeo',
  'mensajes':      '/mensajes',
  'notificaciones':'/notificaciones',
  'pez-semanal':   '/pez-semanal',
  'admin':         '/admin',
  'grupos':        '/grupos',
  'wiki-trofeos':  '/publicar-trofeos',
};

function navigateTo(id, pushState = true) {
  if (!pushState) return;
  const url = PAGE_TO_URL[id];
  if (url) {
    history.pushState({ page: id }, '', url);
  }
}

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  const path = window.location.pathname;
  // Close overlays if navigating away
  if(path !== '/mensajes' && !path.startsWith('/mensajes/')) {
    const msg = document.getElementById('mMessenger');
    if(msg && msg.classList.contains('open')) msg.classList.remove('open');
  }
  if(path !== '/notificaciones') {
    const nd = document.getElementById('mNotif');
    if(nd) nd.style.display = 'none';
  }
  // Handle user profile URLs
  if(path.startsWith('/u/')) {
    const nickSlug = path.slice('/u/'.length);
    // Try to find user by nick slug
    if(window.CU) {
      window.gp('userprofile', false);
      // Try to load from state
      if(e.state && e.state.uid) {
        _loadUserProfilePage(e.state.uid, e.state.nick||nickSlug);
      }
    }
    return;
  }
  if(path.startsWith('/mensajes/')) {
    const msgEl = document.getElementById('mMessenger');
    if(msgEl) { om('mMessenger'); renderMessengerList(); }
    if(e.state && e.state.chatUid) openChatWith(e.state.chatUid, e.state.chatNick||'');
    return;
  }
  if(path === '/mensajes') {
    const msgEl = document.getElementById('mMessenger');
    if(msgEl) { om('mMessenger'); renderMessengerList(); }
    return;
  }
  if(path === '/notificaciones') {
    openNotifDropdown();
    return;
  }
  // Intentar como perfil de usuario (URL legacy sin /u/)
  const pageId = ROUTES[path];
  if(pageId){
    window.gp(pageId, false);
  } else if(path.length > 1 && !path.includes('.')){
    // Path desconocido sin extension = probablemente perfil usuario legacy
    const nickSlug = path.slice(1);
    if(window.CU && e.state && e.state.uid){
      window.gp('userprofile', false);
      _loadUserProfilePage(e.state.uid, e.state.nick||nickSlug);
    } else {
      window.gp('home', false);
    }
  } else {
    window.gp('home', false);
  }
});

// On page load, navigate to the correct page based on URL
window.addEventListener('DOMContentLoaded', () => {
  // Recuperar ruta guardada por 404.html (GitHub Pages SPA trick)
  const rParam = new URLSearchParams(window.location.search).get('r');
  if (rParam) {
    const redirectPath = decodeURIComponent(rParam);
    if (redirectPath !== '/' && redirectPath !== '/home') {
      history.replaceState(null, '', redirectPath);
    }
  } else {
    const redirectPath = sessionStorage.getItem('__rf4_redirect');
    if (redirectPath) {
      sessionStorage.removeItem('__rf4_redirect');
      if (redirectPath !== '/' && redirectPath !== '/home') {
        history.replaceState(null, '', redirectPath);
      }
    }
  }

  const path = window.location.pathname;
  // Save full path for after login (handles /u/nick, /mensajes/nick, etc.)
  if (path && path !== '/' && path !== '/home' && path !== '/') {
    window._initialPath = path;
  }
  const pageId = ROUTES[path];
  if (pageId && pageId !== 'home') {
    window._initialRoute = pageId;
  }
  // Always start with comments closed on page load (like Facebook)
  document.querySelectorAll('.comments-section').forEach(function(c){ c.classList.remove('open'); });
});
window.navigateTo = navigateTo;
// ===== END URL ROUTER =====

// ===== FACEBOOK SHARE DEEP LINK HANDLER =====
// Cuando FB abre la URL con ?p=ID o ?t=ID, carga el post/trofeo directamente
(function(){
  var params = new URLSearchParams(window.location.search);
  var postId = params.get('p');
  var trofeoId = params.get('t');
  if(!postId && !trofeoId) return;

  // Limpiar el param de la URL sin recargar
  try {
    var cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState(null,'', cleanUrl);
  } catch(e){}

  // Esperar a que Firebase cargue el usuario y los posts
  function _tryOpenFBLink(tries){
    if(tries <= 0) return;
    if(postId){
      if(typeof scrollToPost === 'function'){
        gp && gp('home');
        setTimeout(function(){ scrollToPost(postId); }, 600);
        return;
      }
    }
    if(trofeoId){
      if(typeof gp === 'function'){
        gp('trofeos-feed');
        setTimeout(function(){
          var el = document.getElementById('trofeo_'+trofeoId);
          if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.boxShadow='0 0 0 3px #ffd700'; setTimeout(function(){el.style.boxShadow='';},2500); }
        }, 1200);
        return;
      }
    }
    setTimeout(function(){ _tryOpenFBLink(tries-1); }, 700);
  }

  // Guardar para abrirlo después del login de Firebase
  window._fbDeepLink = { postId: postId, trofeoId: trofeoId };
  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){ _tryOpenFBLink(8); }, 1500);
  });
})();
// ===== FIN FACEBOOK SHARE DEEP LINK HANDLER =====

window.gp = (id, pushState = true) => {
  // Al salir del perfil ajeno: detener sus partículas y restaurar las del usuario propio
  const currentPage = document.querySelector('.page.active');
  if(currentPage && currentPage.id === 'page-userprofile' && id !== 'userprofile'){
    _stopShopParticles();
    if(_equippedItems?.efecto) setTimeout(()=>_startShopParticles(_equippedItems.efecto), 100);
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+id);
  if(!pg) return;
  pg.classList.add('active');
  window.scrollTo(0,0);
  navigateTo(id, pushState);
  if(id==='profile') renderProfile();
  if(id==='admin') { loadAdminData(); loadPezSemana(); loadSoporteBadge(); }
  // Show video button in posts only for verified users
  const pvBtn = document.getElementById('postVideoBtn');
  if(pvBtn) pvBtn.style.display = window.CU?.verified ? 'flex' : 'none';
  if(id==='spots'){ loadSpots(); loadFriendSpots(); }
  if(id==='casitrofeo') renderMapPosts();
  if(id==='compartir-spot') {
    spLoadData().then(()=>{ spRenderHome(); });
    // Mostrar botón publicar y admin si aplica
    const isAdmin = window.CU?.nick === 'ruizgustavo12' || window.CU?.email === 'synxyes@gmail.com' || window.CU?.role === 'admin';
    const spPub = document.getElementById('spNbPublish');
    const spAdm = document.getElementById('spNbAdmin');
    const spPubBtn = document.getElementById('spPubBtn');
    if(spPub) spPub.style.display = window.CU ? 'inline-flex' : 'none';
    if(spAdm) spAdm.style.display = isAdmin ? 'inline-flex' : 'none';
    if(spPubBtn) spPubBtn.style.display = window.CU ? '' : 'none';
  }
  if(id==='trofeos-feed') {
    listenTrofeosFeed();
    document.getElementById('trofeoFeedBadge').style.display='inline-flex';
  }
  if(id==='reels') {
    const prevPg = document.querySelector('.page.active');
    window._reelsPrevPage = prevPg && prevPg.id !== 'page-reels' ? prevPg.id.replace('page-','') : 'home';
    const overlay = document.getElementById('reelsOverlay');
    if(overlay){ overlay.style.display='block'; document.body.style.overflow='hidden'; }
    loadReelsPage();
    return;
  }
  if(id==='peso-del-trofeo') { renderTrofeos(FISH_DB); }
  if(id==='shop') { loadShopDiscount(); }
  if(id==='publica-trofeo') {
    const frame = document.getElementById('wikiTrofeoFrame');
    if(frame && !frame.dataset.loaded) {
      frame.dataset.loaded = '1';
      frame._wikiTimer = setTimeout(() => { wikiFrameError(); }, 7000);
    } else if(frame && frame.dataset.loaded) {
      frame.style.display='block';
      document.getElementById('wikiTrofeoFallback').style.display='none';
      frame.src = frame.src;
    }
  }
  if(id==='parches') loadParches();
  if(id==='soporte') initSoportePage();
  if(id==='torneos') loadTorneos();
  if(id==='ranking-semanal') loadRankingSemanal();
  if(id==='userprofile') {} // cargado desde _loadUserProfilePage
  if(id==='wiki-trofeos') {
    // Cargar wiki de trofeos al entrar
    if(typeof wkInit === 'function') wkInit();
  }
  // Actualizar actividad en presencia Firebase
  if(typeof updatePresenceActivity === 'function') updatePresenceActivity(id);
};
function setNav(el){ document.querySelectorAll('.tb-nav-btn').forEach(b=>b.classList.remove('on')); el.classList.add('on'); }
window.setNav = setNav;

