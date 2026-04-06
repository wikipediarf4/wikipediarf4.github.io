// ═══════════════════════════════════════
//  MiLatido — app.js
//  Firebase v9 modular · Tiempo Real
// ═══════════════════════════════════════

import { initializeApp }           from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs,
         updateDoc, deleteDoc, onSnapshot, query, where, orderBy,
         limit, serverTimestamp, increment, arrayUnion, arrayRemove, Timestamp }
                                    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         onAuthStateChanged, signOut, updateProfile }
                                    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, off, serverTimestamp as rtServerTimestamp }
                                    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ── CONFIG ──────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA9oat9dd0S9vlxkg1osH4dW3XhRDGiOiw",
  authDomain: "charlasrf4.firebaseapp.com",
  projectId: "charlasrf4",
  storageBucket: "charlasrf4.firebasestorage.app",
  messagingSenderId: "345019626508",
  appId: "1:345019626508:web:d099ca499acb29eac12a29",
  databaseURL: "https://charlasrf4-default-rtdb.firebaseio.com"
};

const IMGBB_KEY            = '75c60bcb472ab597b1dee463438b18ba';
const CLOUDINARY_CLOUD     = 'da0n5tg3g';
const CLOUDINARY_PRESET    = 'milatido_fotos';
const CLOUDINARY_VIDEO_PRESET = 'milatido_video';

// ── INIT ──────────────────────────────
const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);
const auth  = getAuth(fbApp);
const rtdb  = getDatabase(fbApp);

// ── STATE ─────────────────────────────
let CU           = null;   // current user profile
let currentPage  = 'home';
let chatPeer     = null;
let swipeProfiles = [];
let swipeIdx      = 0;
let confUnsub     = null;
let chatUnsub     = null;
let swipeDragging = false;
let swipeStartX   = 0;
let swipeStartY   = 0;
let swipeDeltaX   = 0;

// ── DEMO PROFILES (fallback) ──────────
const DEMO_PROFILES = [
  { id:'demo1', nick:'Sofía', age:22, city:'Montevideo', bio:'Busco a alguien divertido ✨', avatar:'https://i.pravatar.cc/400?img=47', tags:['Viajes','Música','Café'] },
  { id:'demo2', nick:'Valentina', age:24, city:'Montevideo', bio:'Amo los atardeceres 🌅', avatar:'https://i.pravatar.cc/400?img=49', tags:['Fotografía','Arte','Yoga'] },
  { id:'demo3', nick:'Camila', age:21, city:'Maldonado', bio:'Buscando aventuras nuevas 🎉', avatar:'https://i.pravatar.cc/400?img=45', tags:['Baile','Cocina','Gym'] },
  { id:'demo4', nick:'Lucas', age:26, city:'Montevideo', bio:'Fanático del fútbol ⚽', avatar:'https://i.pravatar.cc/400?img=11', tags:['Deporte','Gaming','Viajes'] },
  { id:'demo5', nick:'Mateo', age:23, city:'Punta del Este', bio:'Músico de alma 🎸', avatar:'https://i.pravatar.cc/400?img=13', tags:['Música','Playa','Amigos'] },
];

// ─────────────────────────────────────
//  UTILS
// ─────────────────────────────────────
function toast(msg, type = 'inf') {
  const ct = document.getElementById('toast-ct');
  const t  = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  ct.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const h = d.getHours().toString().padStart(2,'0');
  const m = d.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}

function fmtAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60)  return 'ahora';
  if (sec < 3600) return Math.floor(sec/60) + 'm';
  if (sec < 86400) return Math.floor(sec/3600) + 'h';
  return Math.floor(sec/86400) + 'd';
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file);
  const r = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method:'POST', body:fd });
  const j = await r.json();
  return j.data?.url || null;
}

async function uploadVideo(file) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_VIDEO_PRESET);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`, { method:'POST', body:fd });
  const j = await r.json();
  return j.secure_url || null;
}

// ─────────────────────────────────────
//  NAVIGATION
// ─────────────────────────────────────
function goPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bn-btn').forEach(b => b.classList.remove('on'));
  const page = document.getElementById(`page-${id}`);
  if (page) page.classList.add('active');
  const btn = document.querySelector(`.bn-btn[data-page="${id}"]`);
  if (btn) btn.classList.add('on');
  currentPage = id;

  // page-specific loaders
  if (id === 'home') loadHome();
  if (id === 'chat') loadChatList();
  if (id === 'miradas') loadMiradas();
  if (id === 'profile') loadProfile();
}

function loadHome() {
  loadStories();
  loadConfessions();
  if (!swipeProfiles.length) loadSwipeProfiles();
}

// ─────────────────────────────────────
//  AUTH
// ─────────────────────────────────────
document.getElementById('auth-login-btn').addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value.trim();
  if (!email || !pass) return toast('Completá los campos','err');
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    toast(e.code === 'auth/user-not-found' ? 'Usuario no encontrado' : 'Error: ' + e.message, 'err');
  }
});

document.getElementById('auth-reg-btn').addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value.trim();
  const pass  = document.getElementById('auth-pass').value.trim();
  const nick  = document.getElementById('auth-nick').value.trim();
  if (!email || !pass || !nick) return toast('Completá todos los campos','err');
  if (pass.length < 6) return toast('La contraseña debe tener al menos 6 caracteres','err');
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: nick });
    await setDoc(doc(db,'milatido_users', cred.user.uid), {
      uid: cred.user.uid,
      nick,
      email,
      avatar: '',
      bio: '',
      age: '',
      city: '',
      tags: [],
      createdAt: serverTimestamp(),
      matches: [],
      likes: [],
    });
    toast('¡Bienvenid@ a MiLatido! 💜','ok');
  } catch(e) {
    toast(e.code === 'auth/email-already-in-use' ? 'Email ya en uso' : e.message, 'err');
  }
});

document.getElementById('auth-switch').addEventListener('click', () => {
  const nickRow = document.getElementById('auth-nick-row');
  const loginBtn = document.getElementById('auth-login-btn');
  const regBtn   = document.getElementById('auth-reg-btn');
  const sw       = document.getElementById('auth-switch');
  if (nickRow.style.display === 'none') {
    nickRow.style.display = 'block';
    loginBtn.style.display = 'none';
    regBtn.style.display   = 'block';
    sw.innerHTML = '¿Ya tenés cuenta? <span>Iniciá sesión</span>';
  } else {
    nickRow.style.display = 'none';
    loginBtn.style.display = 'block';
    regBtn.style.display   = 'none';
    sw.innerHTML = '¿No tenés cuenta? <span>Registrate gratis</span>';
  }
});

onAuthStateChanged(auth, async (user) => {
  const authScreen = document.getElementById('auth-screen');
  const loader     = document.getElementById('loader');

  if (user) {
    // Load user profile
    try {
      const snap = await getDoc(doc(db,'milatido_users', user.uid));
      if (snap.exists()) {
        CU = { ...snap.data(), uid: user.uid };
      } else {
        CU = { uid: user.uid, nick: user.displayName || 'Usuario', avatar: '', bio: '', age:'', city:'', tags:[], matches:[], likes:[] };
      }
    } catch(e) {
      CU = { uid: user.uid, nick: user.displayName || 'Usuario', avatar: '', bio: '', age:'', city:'', tags:[], matches:[], likes:[] };
    }

    // Set online presence
    const presRef = ref(rtdb, `milatido_presence/${user.uid}`);
    set(presRef, { online: true, nick: CU.nick, avatar: CU.avatar || '', lastSeen: rtServerTimestamp() });

    authScreen.classList.remove('show');
    setTimeout(() => { loader.style.display = 'none'; }, 600);
    goPage('home');
  } else {
    CU = null;
    loader.style.display = 'none';
    authScreen.classList.add('show');
  }
});

// ─────────────────────────────────────
//  SWIPE CARDS
// ─────────────────────────────────────
async function loadSwipeProfiles() {
  try {
    const snap = await getDocs(query(collection(db,'milatido_users'), limit(20)));
    swipeProfiles = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.uid !== CU?.uid);
  } catch(e) {
    swipeProfiles = [];
  }
  // Mix with demo profiles if few real users
  if (swipeProfiles.length < 3) {
    swipeProfiles = [...DEMO_PROFILES, ...swipeProfiles];
  }
  swipeIdx = 0;
  renderSwipeCards();
}

function renderSwipeCards() {
  const stack = document.getElementById('swipe-stack');
  const dots  = document.getElementById('swipe-dots');
  stack.innerHTML = '';
  dots.innerHTML  = '';

  const visible = swipeProfiles.slice(swipeIdx, swipeIdx + 3);

  visible.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'swipe-card';
    card.dataset.idx = i;
    card.innerHTML = `
      <img class="card-img" src="${esc(p.avatar||'https://i.pravatar.cc/400?img='+Math.floor(Math.random()*70))}" alt="${esc(p.nick)}" onerror="this.src='https://i.pravatar.cc/400?img=1'">
      <div class="card-gradient"></div>
      <div class="card-glow-left"></div>
      <div class="card-glow-right"></div>
      <div class="stamp-like">💚 ME GUSTA</div>
      <div class="stamp-nope">✕ NOPE</div>
      <div class="card-info">
        <div class="card-name">${esc(p.nick)}${p.age ? ', '+p.age : ''}</div>
        ${p.city ? `<div class="card-location">📍 ${esc(p.city)}</div>` : ''}
        ${p.bio  ? `<div class="card-bio">"${esc(p.bio)}"</div>` : ''}
        <div class="card-tags">${(p.tags||[]).slice(0,4).map(t=>`<span class="card-tag">${esc(t)}</span>`).join('')}</div>
      </div>
    `;
    if (i === 0) attachSwipeEvents(card, p);
    stack.insertBefore(card, stack.firstChild);
  });

  // Dots
  const total = Math.min(swipeProfiles.length, 8);
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === swipeIdx % total ? ' on' : '');
    dots.appendChild(d);
  }
}

function attachSwipeEvents(card, profile) {
  let startX = 0, startY = 0, currentX = 0, isDragging = false;

  const onStart = (e) => {
    isDragging = true;
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    card.classList.add('dragging');
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    currentX = pt.clientX - startX;
    const rot = currentX * 0.08;
    card.style.transform = `translateX(${currentX}px) rotate(${rot}deg)`;
    card.classList.toggle('drag-left',  currentX < -30);
    card.classList.toggle('drag-right', currentX > 30);
  };

  const onEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    card.classList.remove('dragging','drag-left','drag-right');
    card.style.transform = '';

    if (currentX < -80) {
      doSwipe(card, profile, 'left');
    } else if (currentX > 80) {
      doSwipe(card, profile, 'right');
    }
    currentX = 0;
  };

  card.addEventListener('mousedown',  onStart);
  card.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('mousemove',  onMove);
  window.addEventListener('touchmove',  onMove, { passive: false });
  window.addEventListener('mouseup',  onEnd);
  window.addEventListener('touchend', onEnd);
}

function doSwipe(card, profile, direction) {
  card.classList.add(direction === 'left' ? 'go-left' : 'go-right');
  card.style.transform = '';

  if (direction === 'right') {
    handleLike(profile);
  } else {
    toast('Pasaste 👋','inf');
  }

  setTimeout(() => {
    swipeIdx++;
    if (swipeIdx >= swipeProfiles.length) {
      swipeIdx = 0;
    }
    renderSwipeCards();
  }, 450);
}

async function handleLike(profile) {
  toast('❤️ Le diste Me Interesa!','ok');
  if (!CU) return;
  try {
    await updateDoc(doc(db,'milatido_users',CU.uid), { likes: arrayUnion(profile.id) });
    // Check mutual like
    if (profile.likes && profile.likes.includes(CU.uid)) {
      showMatch(profile);
    }
  } catch(e) {}
}

function showMatch(profile) {
  const overlay = document.getElementById('match-overlay');
  document.getElementById('match-av1').src = CU?.avatar || 'https://i.pravatar.cc/100';
  document.getElementById('match-av2').src = profile.avatar || 'https://i.pravatar.cc/100?img=2';
  document.getElementById('match-name').textContent = profile.nick;
  overlay.classList.add('show');
}

document.getElementById('match-close').addEventListener('click', () => {
  document.getElementById('match-overlay').classList.remove('show');
});

document.getElementById('match-chat').addEventListener('click', () => {
  document.getElementById('match-overlay').classList.remove('show');
  // Open chat with matched user
  goPage('chat');
});

// Card action buttons
document.getElementById('btn-interest').addEventListener('click', () => {
  const card = document.querySelector('.swipe-card:last-child');
  if (!card) return;
  const profile = swipeProfiles[swipeIdx];
  if (profile) doSwipe(card, profile, 'right');
});

document.getElementById('btn-nope').addEventListener('click', () => {
  const card = document.querySelector('.swipe-card:last-child');
  if (!card) return;
  const profile = swipeProfiles[swipeIdx];
  if (profile) doSwipe(card, profile, 'left');
});

document.getElementById('btn-chat-now').addEventListener('click', () => {
  if (!CU) return toast('Iniciá sesión primero','err');
  const profile = swipeProfiles[swipeIdx];
  if (profile) openChat(profile);
});

document.getElementById('btn-react-card').addEventListener('click', (e) => {
  const popup = document.getElementById('card-react-popup');
  popup.classList.toggle('open');
  e.stopPropagation();
});

document.querySelectorAll('#card-react-popup .react-em').forEach(em => {
  em.addEventListener('click', (e) => {
    toast(e.target.textContent + ' Reaccionaste!','ok');
    document.getElementById('card-react-popup').classList.remove('open');
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.react-popup').forEach(p => p.classList.remove('open'));
});

// ─────────────────────────────────────
//  STORIES
// ─────────────────────────────────────
function loadStories() {
  const row = document.getElementById('stories-row');
  // Listen for online users (presence)
  const presRef = ref(rtdb, 'milatido_presence');
  onValue(presRef, (snap) => {
    const data = snap.val() || {};
    const online = Object.entries(data)
      .filter(([uid, v]) => v.online && uid !== CU?.uid)
      .slice(0, 10);

    let html = `
      <div class="story-bubble" onclick="openAddStory()">
        <div class="story-ring add-story-ring">
          <div class="add-story-inner">＋</div>
        </div>
        <span class="story-name">Tu historia</span>
      </div>`;

    online.forEach(([uid, v]) => {
      const av = v.avatar || `https://i.pravatar.cc/100?u=${uid}`;
      html += `
        <div class="story-bubble" onclick="viewStory('${uid}','${esc(v.nick)}')">
          <div class="story-ring${v.live ? ' live' : ''}">
            <div class="story-av">
              <img src="${esc(av)}" alt="${esc(v.nick)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'">
            </div>
          </div>
          <span class="story-name">${esc(v.nick)}</span>
        </div>`;
    });

    // Add some demo stories if few online
    if (online.length < 3) {
      DEMO_PROFILES.slice(0, 4).forEach(p => {
        html += `
          <div class="story-bubble">
            <div class="story-ring">
              <div class="story-av">
                <img src="${p.avatar}" alt="${esc(p.nick)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">
              </div>
            </div>
            <span class="story-name">${esc(p.nick)}</span>
          </div>`;
      });
    }

    row.innerHTML = html;
  });
}

window.viewStory = function(uid, nick) {
  toast('📖 Historia de ' + nick,'inf');
};

window.openAddStory = function() {
  if (!CU) return toast('Iniciá sesión','err');
  document.getElementById('story-modal').classList.add('open');
};

document.getElementById('story-modal-close').addEventListener('click', () => {
  document.getElementById('story-modal').classList.remove('open');
});

document.getElementById('story-img-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  toast('Subiendo historia...','inf');
  try {
    const url = await uploadImage(file);
    if (url) {
      await addDoc(collection(db,'milatido_stories'), {
        uid: CU.uid,
        nick: CU.nick,
        avatar: CU.avatar || '',
        imgUrl: url,
        createdAt: serverTimestamp(),
      });
      toast('Historia publicada! 🎉','ok');
      document.getElementById('story-modal').classList.remove('open');
    }
  } catch(e) {
    toast('Error al subir','err');
  }
});

// ─────────────────────────────────────
//  CONFESIONES
// ─────────────────────────────────────
function loadConfessions() {
  const grid = document.getElementById('conf-grid');
  if (confUnsub) confUnsub();

  confUnsub = onSnapshot(
    query(collection(db,'milatido_confessions'), orderBy('createdAt','desc'), limit(20)),
    (snap) => {
      if (snap.empty) {
        grid.innerHTML = `
          <div class="confession-full" style="grid-column:1/-1">
            <div class="empty-state">
              <div class="empty-icon">👻</div>
              <div class="empty-text">Sé el primero en confesar algo anónimamente...</div>
            </div>
          </div>`;
        return;
      }

      grid.innerHTML = snap.docs.map(d => {
        const c = d.data();
        const liked = CU && (c.likedBy||[]).includes(CU.uid);
        return `
          <div class="confession-card" id="conf-${d.id}">
            <div class="conf-author">👻 Alguien:</div>
            <div class="conf-text">"${esc(c.text)}"</div>
            <div class="conf-actions">
              <button class="conf-btn ${liked?'liked':''}" onclick="likeConf('${d.id}',${liked})">
                🔥 ${c.likes||0}
              </button>
              <button class="conf-btn" onclick="openConfComments('${d.id}')">
                💬 ${c.comments||0}
              </button>
            </div>
            <button class="conf-reply-btn" onclick="openReplyAnon('${d.id}')">Responder Anónimo</button>
          </div>`;
      }).join('');
    },
    (e) => { grid.innerHTML = '<div style="padding:16px;color:var(--muted);text-align:center;">Sin confesiones aún 👻</div>'; }
  );
}

window.likeConf = async function(confId, alreadyLiked) {
  if (!CU) return toast('Iniciá sesión para reaccionar','err');
  try {
    const ref2 = doc(db,'milatido_confessions',confId);
    if (alreadyLiked) {
      await updateDoc(ref2, { likes: increment(-1), likedBy: arrayRemove(CU.uid) });
    } else {
      await updateDoc(ref2, { likes: increment(1), likedBy: arrayUnion(CU.uid) });
    }
  } catch(e) {}
};

window.openConfComments = function(confId) {
  toast('Comentarios próximamente 💬','inf');
};

window.openReplyAnon = function(confId) {
  if (!CU) return toast('Iniciá sesión','err');
  document.getElementById('reply-modal').classList.add('open');
  document.getElementById('reply-modal').dataset.confId = confId;
};

document.getElementById('reply-modal-close').addEventListener('click', () => {
  document.getElementById('reply-modal').classList.remove('open');
});

document.getElementById('reply-submit').addEventListener('click', async () => {
  const confId = document.getElementById('reply-modal').dataset.confId;
  const text   = document.getElementById('reply-input').value.trim();
  if (!text) return toast('Escribí algo','err');
  try {
    await addDoc(collection(db,'milatido_confessions',confId,'comments'), {
      text,
      uid: CU.uid,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db,'milatido_confessions',confId), { comments: increment(1) });
    document.getElementById('reply-input').value = '';
    document.getElementById('reply-modal').classList.remove('open');
    toast('Respuesta enviada 👻','ok');
  } catch(e) {
    toast('Error al enviar','err');
  }
});

// New confession
document.getElementById('btn-new-conf').addEventListener('click', () => {
  if (!CU) return toast('Iniciá sesión','err');
  document.getElementById('conf-modal').classList.add('open');
});

document.getElementById('conf-modal-close').addEventListener('click', () => {
  document.getElementById('conf-modal').classList.remove('open');
});

document.getElementById('conf-submit').addEventListener('click', async () => {
  const text = document.getElementById('conf-input').value.trim();
  if (!text || text.length < 5) return toast('Escribí al menos 5 caracteres','err');
  try {
    await addDoc(collection(db,'milatido_confessions'), {
      text,
      likes: 0,
      comments: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    });
    document.getElementById('conf-input').value = '';
    document.getElementById('conf-modal').classList.remove('open');
    toast('Confesión publicada 👻','ok');
  } catch(e) {
    toast('Error al publicar','err');
  }
});

// ─────────────────────────────────────
//  CHAT
// ─────────────────────────────────────
async function loadChatList() {
  if (!CU) return;
  const list = document.getElementById('chat-list');
  list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">Cargando...</div>';

  try {
    const snap = await getDocs(query(
      collection(db,'milatido_chats'),
      where('members','array-contains',CU.uid),
      orderBy('lastAt','desc'),
      limit(30)
    ));

    if (snap.empty) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-text">No tenés chats aún.<br>¡Encontrá a alguien en Descubrir!</div></div>`;
      return;
    }

    list.innerHTML = '';
    for (const d of snap.docs) {
      const c    = d.data();
      const peer = c.members.find(m => m !== CU.uid);
      if (!peer) continue;

      let peerData = { nick: 'Usuario', avatar: '' };
      try {
        const ps = await getDoc(doc(db,'milatido_users',peer));
        if (ps.exists()) peerData = ps.data();
      } catch(e) {}

      const item = document.createElement('div');
      item.className = 'chat-item';
      item.innerHTML = `
        <div class="chat-av">
          ${peerData.avatar ? `<img src="${esc(peerData.avatar)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '👤'}
        </div>
        <div class="chat-online" id="online-${peer}"></div>
        <div class="chat-info">
          <div class="chat-nick">${esc(peerData.nick)}</div>
          <div class="chat-preview">${esc(c.lastMsg || 'Iniciá la conversación...')}</div>
        </div>
        <div class="chat-meta">
          <div class="chat-time">${c.lastAt ? fmtAgo(c.lastAt) : ''}</div>
          ${c.unread && c.unread[CU.uid] > 0 ? `<div class="chat-unread">${c.unread[CU.uid]}</div>` : ''}
        </div>`;
      item.addEventListener('click', () => openChat({ id: peer, ...peerData }));
      list.appendChild(item);

      // Check online status
      const presRef = ref(rtdb, `milatido_presence/${peer}`);
      onValue(presRef, (s) => {
        const dot = document.getElementById(`online-${peer}`);
        if (dot) dot.style.display = s.val()?.online ? 'block' : 'none';
      });
    }
  } catch(e) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div class="empty-text">Tus chats aparecerán aquí</div></div>`;
  }
}

function openChat(peer) {
  chatPeer = peer;
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }

  const win = document.getElementById('chat-window');
  win.classList.add('open');

  document.getElementById('chat-win-name').textContent = peer.nick || 'Usuario';
  const av = document.getElementById('chat-win-av');
  if (peer.avatar) {
    av.innerHTML = `<img src="${esc(peer.avatar)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.innerHTML='👤'">`;
  } else {
    av.textContent = '👤';
  }

  // Check online
  const presRef = ref(rtdb, `milatido_presence/${peer.id||peer.uid}`);
  onValue(presRef, (s) => {
    document.getElementById('chat-win-status').textContent = s.val()?.online ? '● En línea' : 'Desconectado/a';
    document.getElementById('chat-win-status').style.color = s.val()?.online ? '#4ade80' : 'var(--muted)';
  });

  // Load messages realtime
  const chatId = [CU.uid, peer.id||peer.uid].sort().join('_');
  const msgs   = document.getElementById('chat-messages');
  msgs.innerHTML = '';

  chatUnsub = onSnapshot(
    query(collection(db,'milatido_chats',chatId,'messages'), orderBy('createdAt','asc'), limit(100)),
    (snap) => {
      msgs.innerHTML = '';
      snap.docs.forEach(d => {
        const m   = d.data();
        const mine = m.uid === CU.uid;
        const div = document.createElement('div');
        div.className = `msg ${mine ? 'mine' : 'theirs'}`;
        div.innerHTML = `
          <div class="msg-bubble">${esc(m.text)}</div>
          <div class="msg-time">${fmtTime(m.createdAt)}</div>`;
        msgs.appendChild(div);
      });
      msgs.scrollTop = msgs.scrollHeight;
    }
  );

  goPage('chat');
}

document.getElementById('chat-back').addEventListener('click', () => {
  document.getElementById('chat-window').classList.remove('open');
  if (chatUnsub) { chatUnsub(); chatUnsub = null; }
  loadChatList();
});

async function sendMessage() {
  if (!CU || !chatPeer) return;
  const inp  = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';

  const chatId = [CU.uid, chatPeer.id||chatPeer.uid].sort().join('_');
  try {
    // Ensure chat doc exists
    await setDoc(doc(db,'milatido_chats',chatId), {
      members: [CU.uid, chatPeer.id||chatPeer.uid],
      lastMsg: text,
      lastAt: serverTimestamp(),
      unread: { [chatPeer.id||chatPeer.uid]: increment(1) },
    }, { merge: true });

    await addDoc(collection(db,'milatido_chats',chatId,'messages'), {
      text,
      uid: CU.uid,
      nick: CU.nick,
      createdAt: serverTimestamp(),
    });
  } catch(e) {
    toast('Error al enviar','err');
  }
}

document.getElementById('chat-send').addEventListener('click', sendMessage);
document.getElementById('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ─────────────────────────────────────
//  MIRADAS
// ─────────────────────────────────────
async function loadMiradas() {
  const grid = document.getElementById('miradas-grid');
  grid.innerHTML = '';

  try {
    // Visitors who viewed your profile
    if (CU) {
      const snap = await getDocs(query(
        collection(db,'milatido_views'),
        where('targetUid','==',CU.uid),
        orderBy('at','desc'),
        limit(30)
      ));

      if (!snap.empty) {
        for (const d of snap.docs) {
          const v = d.data();
          let userData = { nick: 'Usuario', avatar: '' };
          try {
            const us = await getDoc(doc(db,'milatido_users',v.fromUid));
            if (us.exists()) userData = us.data();
          } catch(e) {}

          const item = document.createElement('div');
          item.className = 'mirada-item';
          item.innerHTML = `
            ${userData.avatar ? `<img src="${esc(userData.avatar)}" alt="${esc(userData.nick)}">` : `<div style="width:100%;height:100%;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:2rem;">👤</div>`}
            <div class="mirada-overlay">
              <div class="mirada-name">${esc(userData.nick)}</div>
            </div>`;
          item.addEventListener('click', () => {
            const profile = { id: v.fromUid, ...userData };
            // Show profile detail
            toast(userData.nick + ' te miró 👀','inf');
          });
          grid.appendChild(item);
        }
        return;
      }
    }

    // Demo grid
    grid.innerHTML = [...DEMO_PROFILES, ...DEMO_PROFILES].map(p => `
      <div class="mirada-item">
        <img src="${p.avatar}" alt="${esc(p.nick)}">
        <div class="mirada-overlay">
          <div class="mirada-name">${esc(p.nick)}</div>
        </div>
      </div>`).join('');

  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1" class="empty-state"><div class="empty-icon">👀</div><div class="empty-text">Las personas que vieron tu perfil aparecerán aquí</div></div>`;
  }
}

// Register profile view
async function registerView(targetUid) {
  if (!CU || !targetUid || targetUid === CU.uid) return;
  try {
    await setDoc(doc(db,'milatido_views',`${targetUid}_${CU.uid}`), {
      targetUid,
      fromUid: CU.uid,
      at: serverTimestamp(),
    });
  } catch(e) {}
}

// ─────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────
function loadProfile() {
  if (!CU) return;

  document.getElementById('prof-name').textContent = CU.nick || 'Tu nombre';
  document.getElementById('prof-bio').textContent  = CU.bio || 'Añadí una bio para que te conozcan mejor...';

  const av = document.getElementById('prof-av');
  if (CU.avatar) {
    av.innerHTML = `<img src="${esc(CU.avatar)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none'">`;
  } else {
    av.textContent = '👤';
  }

  // Load photos
  loadProfilePhotos();
}

async function loadProfilePhotos() {
  if (!CU) return;
  const grid = document.getElementById('prof-photos');
  try {
    const snap = await getDocs(query(
      collection(db,'milatido_photos'),
      where('uid','==',CU.uid),
      orderBy('createdAt','desc'),
      limit(9)
    ));
    if (snap.empty) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:20px;text-align:center;color:var(--muted);">Subí fotos para mostrar en tu perfil</div>`;
    } else {
      grid.innerHTML = snap.docs.map(d => {
        const p = d.data();
        return `<img class="profile-photo" src="${esc(p.url)}" alt="foto" loading="lazy">`;
      }).join('');
    }
  } catch(e) {
    grid.innerHTML = '';
  }
}

document.getElementById('prof-edit-av').addEventListener('click', () => {
  document.getElementById('prof-av-input').click();
});

document.getElementById('prof-av-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !CU) return;
  toast('Subiendo foto...','inf');
  try {
    const url = await uploadImage(file);
    if (url) {
      await updateDoc(doc(db,'milatido_users',CU.uid), { avatar: url });
      CU.avatar = url;
      loadProfile();
      // Update presence
      const presRef = ref(rtdb, `milatido_presence/${CU.uid}`);
      set(presRef, { online: true, nick: CU.nick, avatar: url, lastSeen: rtServerTimestamp() });
      toast('Foto actualizada ✅','ok');
    }
  } catch(e) {
    toast('Error al subir','err');
  }
});

document.getElementById('btn-add-photo').addEventListener('click', () => {
  document.getElementById('prof-photo-input').click();
});

document.getElementById('prof-photo-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !CU) return;
  toast('Subiendo foto...','inf');
  try {
    const url = await uploadImage(file);
    if (url) {
      await addDoc(collection(db,'milatido_photos'), {
        uid: CU.uid,
        url,
        createdAt: serverTimestamp(),
      });
      toast('Foto añadida ✅','ok');
      loadProfilePhotos();
    }
  } catch(e) {
    toast('Error al subir','err');
  }
});

document.getElementById('btn-edit-profile').addEventListener('click', () => {
  document.getElementById('edit-profile-modal').classList.add('open');
  document.getElementById('edit-nick').value = CU?.nick || '';
  document.getElementById('edit-bio').value  = CU?.bio || '';
  document.getElementById('edit-age').value  = CU?.age || '';
  document.getElementById('edit-city').value = CU?.city || '';
  document.getElementById('edit-tags').value = (CU?.tags||[]).join(', ');
});

document.getElementById('edit-modal-close').addEventListener('click', () => {
  document.getElementById('edit-profile-modal').classList.remove('open');
});

document.getElementById('edit-save').addEventListener('click', async () => {
  if (!CU) return;
  const nick = document.getElementById('edit-nick').value.trim();
  const bio  = document.getElementById('edit-bio').value.trim();
  const age  = document.getElementById('edit-age').value.trim();
  const city = document.getElementById('edit-city').value.trim();
  const tags = document.getElementById('edit-tags').value.split(',').map(t=>t.trim()).filter(Boolean);

  if (!nick) return toast('El nombre es obligatorio','err');
  try {
    await updateDoc(doc(db,'milatido_users',CU.uid), { nick, bio, age, city, tags });
    CU = { ...CU, nick, bio, age, city, tags };
    loadProfile();
    document.getElementById('edit-profile-modal').classList.remove('open');
    toast('Perfil actualizado ✅','ok');
  } catch(e) {
    toast('Error al guardar','err');
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  if (!CU) return;
  const presRef = ref(rtdb, `milatido_presence/${CU.uid}`);
  set(presRef, { online: false });
  await signOut(auth);
  toast('Sesión cerrada','inf');
});

// ─────────────────────────────────────
//  EXPLORE (swipe tab within explore)
// ─────────────────────────────────────
function loadExplore() {
  loadSwipeProfiles();
}

// ─────────────────────────────────────
//  BOTTOM NAV
// ─────────────────────────────────────
document.querySelectorAll('.bn-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.dataset.page;
    if (!p) return;
    if (p !== 'home' && p !== 'chat' && !CU) {
      toast('Iniciá sesión para acceder','err');
      return;
    }
    // Close chat window if leaving chat
    if (currentPage === 'chat' && p !== 'chat') {
      document.getElementById('chat-window').classList.remove('open');
    }
    goPage(p);
  });
});

// ─────────────────────────────────────
//  INIT
// ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Auth screen defaults
  document.getElementById('auth-nick-row').style.display = 'none';
  document.getElementById('auth-reg-btn').style.display  = 'none';
});
