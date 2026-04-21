/* ══════════════════════════════════════════════
   NEBULA — Red Social | app.js
   Firebase Auth + Realtime Database
   ══════════════════════════════════════════════ */

// ── FIREBASE CONFIG ──
const firebaseConfig = {
  apiKey: "AIzaSyA9oat9dd0S9vlxkg1osH4dW3XhRDGiOiw",
  authDomain: "charlasrf4.firebaseapp.com",
  databaseURL: "https://charlasrf4-default-rtdb.firebaseio.com",
  projectId: "charlasrf4",
  storageBucket: "charlasrf4.firebasestorage.app",
  messagingSenderId: "345019626508",
  appId: "1:345019626508:web:d099ca499acb29eac12a29"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.database();

// ── CLOUDINARY CONFIG ──
// Agrega aquí tus cuentas. Los upload_preset deben ser "Unsigned" en tu dashboard.
const CLOUDINARY_ACCOUNTS = [
  {
    cloud_name:    "mi_cuenta_principal",  // ← reemplaza
    upload_preset: "nebula_unsigned",       // ← reemplaza
    folder:        "nebula/posts",
  },
  {
    cloud_name:    "mi_cuenta_backup_1",   // ← reemplaza
    upload_preset: "nebula_unsigned_2",    // ← reemplaza
    folder:        "nebula/posts",
  },
  {
    cloud_name:    "mi_cuenta_backup_2",   // ← reemplaza
    upload_preset: "nebula_unsigned_3",    // ← reemplaza
    folder:        "nebula/posts",
  },
];
const CLOUDINARY_TIMEOUT_MS  = 15000;
const CLOUDINARY_STORAGE_KEY = "nebula_cloudinary_preferred";

function _cloudinaryGetOrdered() {
  const preferred = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
  if (!preferred) return [...CLOUDINARY_ACCOUNTS];
  return [...CLOUDINARY_ACCOUNTS].sort((a, b) =>
    a.cloud_name === preferred ? -1 : b.cloud_name === preferred ? 1 : 0
  );
}
function _cloudinarySavePreferred(cloud_name) {
  localStorage.setItem(CLOUDINARY_STORAGE_KEY, cloud_name);
}
function _cloudinaryUploadUrl(cloud_name, file) {
  const type = file.type.startsWith("video/") ? "video" : "image";
  return `https://api.cloudinary.com/v1_1/${cloud_name}/${type}/upload`;
}
function _cloudinaryFormatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  return (b / 1048576).toFixed(1) + " MB";
}

// Sube a UNA cuenta usando XHR (soporta progreso nativo)
function _cloudinaryUploadOne(file, account, onProgress) {
  return new Promise((resolve, reject) => {
    const { cloud_name, upload_preset, folder } = account;
    const url = _cloudinaryUploadUrl(cloud_name, file);
    const fd  = new FormData();
    fd.append("file",           file);
    fd.append("upload_preset",  upload_preset);
    if (folder) fd.append("folder", folder);

    const xhr = new XMLHttpRequest();

    const timer = setTimeout(() => {
      xhr.abort();
      reject(new Error(`Timeout (${CLOUDINARY_TIMEOUT_MS / 1000}s) en "${cloud_name}"`));
    }, CLOUDINARY_TIMEOUT_MS);

    if (typeof onProgress === "function") {
      xhr.upload.addEventListener("progress", e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      clearTimeout(timer);
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Respuesta inválida de " + cloud_name)); }
      } else {
        let msg = `Error ${xhr.status} en "${cloud_name}"`;
        try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => { clearTimeout(timer); reject(new Error(`Red caída en "${cloud_name}"`)); };
    xhr.onabort = () => { clearTimeout(timer); reject(new Error(`Cancelado: "${cloud_name}"`)); };

    xhr.open("POST", url);
    xhr.send(fd);
  });
}

// Función principal: intenta cada cuenta en orden, con fallback automático
async function subirConFallback(file, { onProgress, onAttempt } = {}) {
  const accounts = _cloudinaryGetOrdered();
  const errors   = [];

  console.groupCollapsed(`[Nebula ✦] Subiendo: ${file.name} (${_cloudinaryFormatBytes(file.size)})`);
  console.log("Tipo:", file.type);
  console.log("Orden de cuentas:", accounts.map(a => a.cloud_name));

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    console.log(`\n⬆ Intento ${i + 1}/${accounts.length} → "${account.cloud_name}"`);
    if (typeof onAttempt === "function") {
      onAttempt({ cloud_name: account.cloud_name, attempt: i + 1, total: accounts.length });
    }
    try {
      const result = await _cloudinaryUploadOne(file, account, onProgress);
      _cloudinarySavePreferred(account.cloud_name);
      console.log(`✅ Éxito en "${account.cloud_name}" → ${result.secure_url}`);
      console.groupEnd();
      return { ...result, _usedAccount: account.cloud_name };
    } catch (err) {
      console.warn(`❌ Falló "${account.cloud_name}": ${err.message}`);
      errors.push({ cloud_name: account.cloud_name, error: err.message });
      if (typeof onProgress === "function" && i < accounts.length - 1) onProgress(0);
    }
  }

  console.error("🚫 Todas las cuentas fallaron:", errors);
  console.groupEnd();
  throw new Error(
    "No se pudo subir el archivo. Todos los servicios fallaron:\n" +
    errors.map(e => `• ${e.cloud_name}: ${e.error}`).join("\n")
  );
}

// ── ESTADO GLOBAL ──
let currentUser      = null;
let activeChatUserId = null;
let reactionTargetPostId = null;
let msgReactionTarget    = null;
let replyingToMsg        = null;
let chatListeners        = {};
let feedUnsubscribe      = null;

/* ══ HELPERS ══ */
const $  = id => document.getElementById(id);
const ts = ()  => firebase.database.ServerValue.TIMESTAMP;

function formatTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff/60000), hours = Math.floor(diff/3600000), days = Math.floor(diff/86400000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return mins + 'm';
  if (hours < 24) return hours + 'h';
  return days + 'd';
}
function getChatKey(a,b) { return [a,b].sort().join('__'); }
function showToast(msg, emoji='✦') {
  const t=$('toast'); t.textContent=emoji+' '+msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}
function getInitials(n) { return n ? n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?'; }
function escapeHtml(t) { return t ? t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }
function hideLoading() {
  const e = $('loading-overlay');
  if (!e) return;
  e.style.opacity = '0';
  e.style.pointerEvents = 'none';
  setTimeout(() => { if(e.parentNode) e.parentNode.removeChild(e); }, 450);
}

// Safety timeout: si Firebase tarda más de 6s, muestra el login igual
setTimeout(() => {
  if ($('loading-overlay')) {
    hideLoading();
    if (!$('app-screen').classList.contains('active')) {
      $('auth-screen').classList.add('active');
    }
  }
}, 6000);
function closeModal(id) { $(id).classList.remove('open'); }
function closeAllContextMenus() {
  document.querySelectorAll('.msg-context-menu,.post-context-menu').forEach(e=>e.remove());
  $('reactions-popup').classList.remove('visible');
  $('msg-reactions-popup').classList.remove('visible');
}

/* ══ AUTH ══ */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',(i===0&&tab==='login')||(i===1&&tab==='register')));
  $('login-form').classList.toggle('active',tab==='login');
  $('register-form').classList.toggle('active',tab==='register');
}

async function doLogin() {
  const email=$('login-user').value.trim(), pass=$('login-pass').value;
  const errEl=$('login-error');
  if(!email||!pass){showErr(errEl,'Completa todos los campos');return;}
  try { await auth.signInWithEmailAndPassword(email,pass); }
  catch(e){ showErr(errEl,getFriendlyError(e.code)); }
}

async function doRegister() {
  const name=$('reg-name').value.trim(), username=$('reg-user').value.trim().replace(/^@/,''),
        email=$('reg-email').value.trim(), pass=$('reg-pass').value;
  if(!name||!username||!email||!pass){showToast('Completa todos los campos','⚠️');return;}
  if(pass.length<6){showToast('Contraseña mínimo 6 caracteres','⚠️');return;}
  const snap=await db.ref('usernames').child(username.toLowerCase()).get();
  if(snap.exists()){showToast('Ese usuario ya está en uso','❌');return;}
  try {
    const cred=await auth.createUserWithEmailAndPassword(email,pass);
    const uid=cred.user.uid;
    const colors=['#7c5cfc','#4ade80','#f59e0b','#f43f5e','#38bdf8','#e879f9'];
    const color=colors[Math.floor(Math.random()*colors.length)];
    const profile={uid,name,username:'@'+username,email,bio:'',location:'',color,
      following:{},followers:{},joinDate:new Date().toISOString().split('T')[0],createdAt:ts()};
    await db.ref('users/'+uid).set(profile);
    await db.ref('usernames/'+username.toLowerCase()).set(uid);
  } catch(e){ showToast(getFriendlyError(e.code),'❌'); }
}

async function doLogout() {
  Object.values(chatListeners).forEach(f=>f&&f());
  if(feedUnsubscribe)feedUnsubscribe();
  await auth.signOut();
  location.reload();
}

function showErr(el,msg) {
  if(!el){showToast(msg,'❌');return;}
  el.textContent=msg; el.style.display='block';
  setTimeout(()=>el.style.display='none',4000);
}
function getFriendlyError(code) {
  const m={'auth/user-not-found':'No existe cuenta con ese email','auth/wrong-password':'Contraseña incorrecta',
    'auth/invalid-email':'Email no válido','auth/email-already-in-use':'Email ya registrado',
    'auth/invalid-credential':'Credenciales incorrectas','auth/too-many-requests':'Demasiados intentos'};
  return m[code]||'Error de autenticación';
}

auth.onAuthStateChanged(async(firebaseUser)=>{
  if(firebaseUser){
    const snap=await db.ref('users/'+firebaseUser.uid).get();
    if(snap.exists()){currentUser={uid:firebaseUser.uid,...snap.val()};showApp();}
    else hideLoading();
  } else { hideLoading(); $('auth-screen').classList.add('active'); }
});

function showApp() {
  $('auth-screen').classList.remove('active');
  const app=$('app-screen'); app.classList.add('active'); app.style.display='flex';
  hideLoading(); initApp();
}

/* ══ APP INIT ══ */
function initApp() {
  updateSidebarUser(); renderFeed(); renderTrending(); renderSuggestions();
  renderChatList(); renderNotifications(); renderExplore('');
  document.addEventListener('click',handleGlobalClick);
}

function updateSidebarUser() {
  const av=$('sidebar-avatar');
  av.style.background='linear-gradient(135deg,'+currentUser.color+','+currentUser.color+'88)';
  av.textContent=getInitials(currentUser.name);
  $('sidebar-name').textContent=currentUser.name.split(' ')[0];
  $('sidebar-handle').textContent=currentUser.username;
  const ca=$('composer-avatar');
  if(ca){ca.style.background=av.style.background;ca.textContent=av.textContent;}
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  $('view-'+viewName).classList.add('active');
  document.querySelector('[data-view="'+viewName+'"]')?.classList.add('active');
  if(viewName==='notifications'){$('notif-badge').style.display='none';markNotifsRead();}
}

/* ══ FEED ══ */
function renderFeed() {
  const el=$('feed-list');
  el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:32px;animation:pulse-glow 2s infinite">✦</div>Cargando órbita...</div>';
  const ref=db.ref('posts').orderByChild('timestamp').limitToLast(50);
  if(feedUnsubscribe)feedUnsubscribe();
  const handler=ref.on('value',snap=>{
    const posts=[];
    snap.forEach(c=>posts.push({id:c.key,...c.val()}));
    posts.reverse();
    const following=currentUser.following?Object.keys(currentUser.following):[];
    const visible=posts.filter(p=>{const a=p.sharedBy||p.authorId;return a===currentUser.uid||following.includes(a);});
    el.innerHTML='';
    if(visible.length===0){
      el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">🌌</div><p>El universo está vacío por aquí.</p><p style="font-size:12px;margin-top:6px">Sigue a otros viajeros para ver sus publicaciones.</p></div>';
      return;
    }
    visible.forEach(p=>el.appendChild(renderPostCard(p)));
  });
  feedUnsubscribe=()=>ref.off('value',handler);
}

function renderPostCard(post) {
  const card=document.createElement('div');
  card.className='post-card'; card.dataset.postId=post.id;
  const ac=post.authorColor||'#7c5cfc', an=post.authorName||'Usuario', ah=post.authorHandle||'@usuario';
  const reactions=post.reactions||{};
  const total=Object.values(reactions).reduce((s,v)=>s+Object.keys(v||{}).length,0);
  const topR=getTopReaction(reactions);
  const userR=Object.values(reactions).some(v=>v&&v[currentUser.uid]);
  const isOwn=post.authorId===currentUser.uid;
  const shares=post.shares?Object.keys(post.shares).length:0;
  const comments=post.commentCount||0;

  let html='';
  if(post.sharedBy){
    html+='<div class="shared-banner"><i class="fa-solid fa-retweet"></i> <span onclick="showProfile(\''+post.sharedBy+'\')" style="cursor:pointer;font-weight:600;color:var(--text)">'+escapeHtml(post.sharerName||'')+'</span> compartió esto</div>';
  }
  html+='<div class="post-header">'
    +'<div class="avatar-md" style="background:linear-gradient(135deg,'+ac+','+ac+'88);cursor:pointer" onclick="showProfile(\''+post.authorId+'\')">'+getInitials(an)+'</div>'
    +'<div class="post-user-info"><div class="post-user-name" onclick="showProfile(\''+post.authorId+'\')">'+escapeHtml(an)+'</div>'
    +'<div class="post-user-handle">'+escapeHtml(ah)+' · '+formatTime(post.timestamp)+'</div></div>'
    +'<button class="post-menu-btn" onclick="togglePostMenu(event,\''+post.id+'\',\''+isOwn+'\')"><i class="fa-solid fa-ellipsis"></i></button></div>'
    +'<div class="post-body">'
    +(post.text?'<p class="post-text">'+escapeHtml(post.text)+'</p>':'')
    +(post.mediaUrl?'<div class="post-media">'+(post.mediaType==='image'?'<img src="'+post.mediaUrl+'" alt="media" loading="lazy"/>'
      :'<video src="'+post.mediaUrl+'" controls></video>')+'</div>':'')
    +'</div>'
    +'<div class="post-actions">'
    +'<button class="action-btn '+(userR?'reacted':'')+'" onclick="showReactionPicker(event,\''+post.id+'\')">'
    +'<span>'+(topR||'🌟')+'</span>'+(total>0?'<span class="action-count">'+total+'</span>':'')
    +'<span style="font-size:11px;color:var(--text3)">Reaccionar</span></button>'
    +'<button class="action-btn" onclick="toggleComments(\''+post.id+'\')">'
    +'<i class="fa-regular fa-comment"></i>'+(comments>0?'<span class="action-count">'+comments+'</span>':'')
    +'<span style="font-size:11px;color:var(--text3)">Comentar</span></button>'
    +'<button class="action-btn" onclick="sharePost(\''+post.id+'\')">'
    +'<i class="fa-solid fa-retweet"></i>'+(shares>0?'<span class="action-count">'+shares+'</span>':'')
    +'<span style="font-size:11px;color:var(--text3)">Compartir</span></button></div>'
    +'<div class="comments-section" id="comments-'+post.id+'">'
    +'<div class="comment-composer">'
    +'<div class="avatar-sm" style="background:linear-gradient(135deg,'+currentUser.color+','+currentUser.color+'88)">'+getInitials(currentUser.name)+'</div>'
    +'<div class="comment-input-area"><textarea class="comment-bubble-input" placeholder="Escribe tu pensamiento..." id="comment-input-'+post.id+'" rows="1" onkeydown="handleCommentKey(event,\''+post.id+'\',null)"></textarea></div>'
    +'<button class="comment-send-btn" onclick="submitComment(\''+post.id+'\',null)"><i class="fa-solid fa-paper-plane" style="font-size:14px"></i></button></div>'
    +'<div class="comments-list" id="comments-list-'+post.id+'"></div></div>';
  card.innerHTML=html; return card;
}

function getTopReaction(reactions) {
  const map={supernova:'🌟',quantum:'⚛️',warp:'🌀',eclipse:'🌑',pulsar:'💫'};
  let top=null,max=0;
  Object.entries(reactions||{}).forEach(([k,v])=>{const c=Object.keys(v||{}).length;if(c>max){max=c;top=map[k];}});
  return top;
}

/* ══ REACTIONS ══ */
function showReactionPicker(event,postId) {
  event.stopPropagation(); reactionTargetPostId=postId;
  const popup=$('reactions-popup'),rect=event.currentTarget.getBoundingClientRect();
  popup.style.left=Math.min(rect.left,window.innerWidth-340)+'px';
  popup.style.top=(rect.top-100)+'px'; popup.classList.add('visible');
}

async function applyReaction(btn) {
  const reaction=btn.dataset.reaction, postId=reactionTargetPostId;
  $('reactions-popup').classList.remove('visible');
  if(!postId) return;
  const uid=currentUser.uid, ref=db.ref('posts/'+postId+'/reactions');
  const snap=await ref.get(); const cur=snap.val()||{};
  const updates={};
  ['supernova','quantum','warp','eclipse','pulsar'].forEach(r=>{if(cur[r]&&cur[r][uid])updates[r+'/'+uid]=null;});
  const wasSet=cur[reaction]&&cur[reaction][uid];
  if(!wasSet)updates[reaction+'/'+uid]=true;
  await ref.update(updates); reactionTargetPostId=null;
}

/* ══ COMMENTS ══ */
function toggleComments(postId) {
  const section=$('comments-'+postId);
  const isOpen=section.classList.toggle('open');
  if(!isOpen)return;
  const listEl=$('comments-list-'+postId);
  listEl.innerHTML='<div style="padding:12px 16px;color:var(--text3);font-size:13px">Cargando...</div>';
  db.ref('comments/'+postId).orderByChild('timestamp').on('value',snap=>{
    listEl.innerHTML='';
    const roots=[],replies=[];
    snap.forEach(c=>{const d={id:c.key,...c.val()};d.parentId?replies.push(d):roots.push(d);});
    if(roots.length===0){listEl.innerHTML='<div style="padding:12px 16px;color:var(--text3);font-size:12px;text-align:center">Sé el primero en comentar ✦</div>';}
    roots.forEach(c=>{
      listEl.insertAdjacentHTML('beforeend',renderCommentHtml(c,postId,false));
      replies.filter(r=>r.parentId===c.id).forEach(r=>listEl.insertAdjacentHTML('beforeend',renderCommentHtml(r,postId,true)));
    });
  });
}

function renderCommentHtml(c,postId,isReply) {
  const color=c.authorColor||'#7c5cfc';
  return '<div class="comment-item '+(isReply?'reply-item':'')+'" id="'+c.id+'">'
    +'<div class="avatar-sm" style="background:linear-gradient(135deg,'+color+','+color+'88);cursor:pointer" onclick="showProfile(\''+c.authorId+'\')">'+getInitials(c.authorName)+'</div>'
    +'<div class="comment-bubble"><div class="comment-header">'
    +'<span class="comment-author" onclick="showProfile(\''+c.authorId+'\')">'+escapeHtml(c.authorName)+'</span>'
    +'<span class="comment-ts">'+formatTime(c.timestamp)+'</span></div>'
    +'<div class="comment-text">'+escapeHtml(c.text)+'</div>'
    +'<div class="comment-actions">'
    +(!isReply?'<button class="comment-action" onclick="openReplyInput(\''+postId+'\',\''+c.id+'\')">Responder</button>':'')
    +'</div>'
    +(!isReply?'<div id="reply-composer-'+c.id+'" style="display:none;margin-top:10px"><div style="display:flex;gap:8px;align-items:flex-end">'
      +'<textarea class="comment-bubble-input" id="reply-input-'+c.id+'" placeholder="Responder a '+escapeHtml(c.authorName)+'..." rows="1" onkeydown="handleCommentKey(event,\''+postId+'\',\''+c.id+'\')"></textarea>'
      +'<button class="comment-send-btn" onclick="submitComment(\''+postId+'\',\''+c.id+'\')"><i class="fa-solid fa-paper-plane" style="font-size:12px"></i></button></div></div>':'')
    +'</div></div>';
}

function openReplyInput(postId,commentId) {
  const div=$('reply-composer-'+commentId);
  if(div){div.style.display=div.style.display==='none'?'block':'none';
  const input=$('reply-input-'+commentId);if(input&&div.style.display==='block')input.focus();}
}

function handleCommentKey(event,postId,parentId) {
  if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitComment(postId,parentId);}
}

async function submitComment(postId,parentId) {
  const inputId=parentId?'reply-input-'+parentId:'comment-input-'+postId;
  const input=$(inputId); if(!input)return;
  const text=input.value.trim(); if(!text)return;
  input.value='';
  const ref=db.ref('comments/'+postId).push();
  await ref.set({postId,authorId:currentUser.uid,authorName:currentUser.name,authorColor:currentUser.color,text,timestamp:ts(),parentId:parentId||null});
  await db.ref('posts/'+postId+'/commentCount').transaction(v=>(v||0)+1);
  showToast('Comentario enviado','💬');
}

/* ══ SHARE ══ */
async function sharePost(postId) {
  const snap=await db.ref('posts/'+postId).get(); if(!snap.exists())return;
  const post=snap.val();
  if(post.authorId===currentUser.uid){showToast('No puedes compartir tu propia publicación','⚠️');return;}
  const sharedSnap=await db.ref('posts/'+postId+'/shares/'+currentUser.uid).get();
  if(sharedSnap.exists()){showToast('Ya compartiste esta publicación','⚠️');return;}
  const newRef=db.ref('posts').push();
  await newRef.set({authorId:post.authorId,authorName:post.authorName,authorHandle:post.authorHandle,authorColor:post.authorColor,
    text:post.text,mediaUrl:post.mediaUrl||null,mediaType:post.mediaType||null,
    sharedBy:currentUser.uid,sharerName:currentUser.name,originalPostId:postId,
    reactions:{supernova:{},quantum:{},warp:{},eclipse:{},pulsar:{}},shares:{},commentCount:0,timestamp:ts()});
  await db.ref('posts/'+postId+'/shares/'+currentUser.uid).set(true);
  showToast('¡Publicación compartida!','🔁');
}

/* ══ POST MENU ══ */
function togglePostMenu(event,postId,isOwn) {
  event.stopPropagation(); closeAllContextMenus();
  const menu=document.createElement('div'); menu.className='msg-context-menu post-context-menu';
  const rect=event.currentTarget.getBoundingClientRect();
  menu.style.position='fixed'; menu.style.top=(rect.bottom+4)+'px';
  menu.style.left=Math.min(rect.left-140,window.innerWidth-180)+'px';
  let items='<div class="ctx-item" onclick="sharePost(\''+postId+'\');closeAllContextMenus()"><i class="fa-solid fa-retweet"></i> Compartir</div>';
  if(isOwn==='true')items+='<div class="ctx-item danger" onclick="deletePost(\''+postId+'\')"><i class="fa-solid fa-trash"></i> Eliminar</div>';
  menu.innerHTML=items; document.body.appendChild(menu);
}

async function deletePost(postId) {
  closeAllContextMenus();
  await db.ref('posts/'+postId).remove();
  await db.ref('comments/'+postId).remove();
  showToast('Publicación eliminada','🗑️');
}

/* ══ COMPOSER ══ */
function openComposer(type) {
  $('modal-composer').classList.add('open');
  const av=$('composer-modal-avatar');
  av.style.background='linear-gradient(135deg,'+currentUser.color+','+currentUser.color+'88)';
  av.textContent=getInitials(currentUser.name);
  $('post-text').value=''; $('char-count').textContent='0';
  $('media-preview').innerHTML=''; $('file-input').value='';
  _selectedFile = null;
  delete $('media-preview').dataset.src; delete $('media-preview').dataset.type;
  $('post-text').oninput=function(){$('char-count').textContent=this.value.length;$('char-count').style.color=this.value.length>450?'var(--red)':'var(--text3)';};
  if(type==='image'){$('file-input').accept='image/*';$('file-input').click();}
  else if(type==='video'){$('file-input').accept='video/*';$('file-input').click();}
}

// Archivo seleccionado actualmente en el composer
let _selectedFile = null;

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  _selectedFile = file; // guardamos el File real para subirlo a Cloudinary

  const preview  = $('media-preview');
  const localUrl = URL.createObjectURL(file);

  if (file.type.startsWith('image/')) {
    preview.innerHTML = '<img src="' + localUrl + '" style="max-height:200px;width:100%;object-fit:cover;border-radius:10px"/>';
    preview.dataset.type = 'image';
  } else if (file.type.startsWith('video/')) {
    preview.innerHTML = '<video src="' + localUrl + '" controls style="width:100%;max-height:200px;border-radius:10px"></video>';
    preview.dataset.type = 'video';
  }
  preview.dataset.src = localUrl; // solo para detectar si hay media pendiente
}

async function publishPost() {
  const text    = $('post-text').value.trim();
  const preview = $('media-preview');

  if (!text && !preview.dataset.src) {
    showToast('Escribe algo antes de lanzar', '⚠️');
    return;
  }

  const btn = document.querySelector('#modal-composer .btn-primary');
  btn.disabled = true;

  let mediaUrl  = null;
  let mediaType = preview.dataset.type || null;

  // ── Subida a Cloudinary con fallback ──
  if (_selectedFile) {
    // Barra de progreso (HTML en el modal: <div id="upload-progress-wrap"> ... </div>)
    const progressWrap = $('upload-progress-wrap');
    const progressFill = $('upload-progress-fill');
    const progressText = $('upload-progress-text');

    if (progressWrap) progressWrap.style.display = 'flex';
    btn.textContent = 'Subiendo... 0%';

    try {
      const result = await subirConFallback(_selectedFile, {
        onProgress: (percent) => {
          btn.textContent = `Subiendo... ${percent}%`;
          if (progressFill) progressFill.style.width = percent + '%';
          if (progressText) progressText.textContent  = percent + '%';
        },
        onAttempt: ({ cloud_name, attempt, total }) => {
          if (attempt > 1) showToast(`Reintentando con cuenta ${attempt}/${total}...`, '🔄');
        },
      });
      mediaUrl  = result.secure_url;
      mediaType = result.resource_type === 'video' ? 'video' : 'image';
    } catch (err) {
      if (progressWrap) progressWrap.style.display = 'none';
      btn.disabled = false;
      btn.textContent = 'Lanzar al universo ✦';
      showToast('Error al subir: ' + err.message.split('\n')[0], '❌');
      return;
    }

    if (progressWrap) progressWrap.style.display = 'none';
    _selectedFile = null;
  }

  // ── Guardar post en Firebase ──
  btn.textContent = 'Publicando...';
  const ref = db.ref('posts').push();
  await ref.set({
    authorId:    currentUser.uid,
    authorName:  currentUser.name,
    authorHandle:currentUser.username,
    authorColor: currentUser.color,
    text,
    mediaUrl:    mediaUrl,
    mediaType:   mediaType,
    sharedBy:    null,
    reactions:   { supernova:{}, quantum:{}, warp:{}, eclipse:{}, pulsar:{} },
    shares:      {},
    commentCount: 0,
    timestamp:   ts(),
  });

  btn.disabled = false;
  btn.textContent = 'Lanzar al universo ✦';
  closeModal('modal-composer');
  showToast('¡Publicación lanzada al universo!', '🚀');
}

/* ══ TRENDING & SUGGESTIONS ══ */
function renderTrending() {
  const trends=[{tag:'#SupernovaCode',count:'12.4K'},{tag:'#QuantumDesign',count:'8.1K'},
    {tag:'#WarpThinking',count:'5.7K'},{tag:'#NebulaCultura',count:'4.2K'},{tag:'#PulsarDev',count:'3.9K'}];
  $('trending-list').innerHTML=trends.map((t,i)=>'<div class="trending-item"><span class="trending-num">'+(i+1)+'</span><div><div class="trending-tag">'+t.tag+'</div><div class="trending-count">'+t.count+' orbitas</div></div></div>').join('');
}

async function renderSuggestions() {
  const el=$('suggestions-list');
  const snap=await db.ref('users').limitToFirst(20).get();
  if(!snap.exists()){el.innerHTML='';return;}
  const following=currentUser.following?Object.keys(currentUser.following):[];
  const suggestions=[];
  snap.forEach(c=>{const u={id:c.key,...c.val()};if((u.uid||u.id)!==currentUser.uid&&!following.includes(u.uid||u.id))suggestions.push(u);});
  el.innerHTML=suggestions.slice(0,4).map(u=>{const uid=u.uid||u.id;return '<div class="suggestion-item"><div class="avatar-sm" style="background:linear-gradient(135deg,'+(u.color||'#7c5cfc')+','+(u.color||'#7c5cfc')+'88);cursor:pointer" onclick="showProfile(\''+uid+'\')">'+getInitials(u.name)+'</div><div class="suggestion-info"><div class="suggestion-name" onclick="showProfile(\''+uid+'\')">'+escapeHtml(u.name)+'</div><div class="suggestion-handle">'+escapeHtml(u.username)+'</div></div><button class="follow-btn" onclick="toggleFollow(\''+uid+'\')">+ Seguir</button></div>';}).join('');
}

async function toggleFollow(userId) {
  const uid=currentUser.uid, isF=currentUser.following&&currentUser.following[userId];
  if(isF){
    await db.ref('users/'+uid+'/following/'+userId).remove();
    await db.ref('users/'+userId+'/followers/'+uid).remove();
    if(currentUser.following)delete currentUser.following[userId];
    showToast('Dejaste de seguir a este viajero','👋');
  } else {
    await db.ref('users/'+uid+'/following/'+userId).set(true);
    await db.ref('users/'+userId+'/followers/'+uid).set(true);
    if(!currentUser.following)currentUser.following={};
    currentUser.following[userId]=true;
    const pSnap=await db.ref('users/'+userId).get();
    await db.ref('notifications/'+userId).push({type:'follow',fromId:uid,fromName:currentUser.name,fromColor:currentUser.color,timestamp:ts(),read:false});
    showToast('¡Ahora sigues a este viajero!','✦');
  }
  renderSuggestions(); renderFeed();
}

/* ══ EXPLORE ══ */
function doSearch(query){renderExplore(query);}

async function renderExplore(query) {
  const el=$('explore-results');
  el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3)">Buscando...</div>';
  const snap=await db.ref('users').get(); const q=query.toLowerCase().trim(); const results=[];
  snap.forEach(c=>{const u={id:c.key,...c.val()};if((u.uid||u.id)===currentUser.uid)return;
    if(!q||u.name?.toLowerCase().includes(q)||u.username?.toLowerCase().includes(q)||u.bio?.toLowerCase().includes(q))results.push(u);});
  if(results.length===0){el.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">🔭</div><p>No encontramos viajeros.</p></div>';return;}
  const following=currentUser.following?Object.keys(currentUser.following):[];
  el.innerHTML=results.map(u=>{const uid=u.uid||u.id,isF=following.includes(uid);
    return '<div class="user-result-card" onclick="showProfile(\''+uid+'\')">'
      +'<div class="avatar-lg" style="background:linear-gradient(135deg,'+(u.color||'#7c5cfc')+','+(u.color||'#7c5cfc')+'88)">'+getInitials(u.name)+'</div>'
      +'<div class="user-result-info"><div class="user-result-name">'+escapeHtml(u.name)+'</div>'
      +'<div class="user-result-handle">'+escapeHtml(u.username)+'</div>'
      +'<div class="user-result-bio">'+escapeHtml(u.bio||'Sin bio todavía...')+'</div></div>'
      +'<button class="follow-btn '+(isF?'following':'')+'" onclick="event.stopPropagation();toggleFollow(\''+uid+'\').then(()=>renderExplore(\''+q+'\'))">'+(isF?'✓ Siguiendo':'+ Seguir')+'</button></div>';
  }).join('');
}

/* ══ PROFILE ══ */
async function showProfile(userId) {
  showView('profile');
  const el=$('profile-content');
  el.innerHTML='<div style="text-align:center;padding:60px;color:var(--text3)"><div style="font-size:32px;animation:pulse-glow 2s infinite">✦</div>Cargando perfil...</div>';
  const snap=await db.ref('users/'+userId).get();
  if(!snap.exists()){el.innerHTML='<p style="padding:40px;color:var(--text3)">Usuario no encontrado.</p>';return;}
  const user={uid:snap.key,...snap.val()};
  const isOwn=user.uid===currentUser.uid;
  const following=currentUser.following?Object.keys(currentUser.following):[];
  const isFollowing=following.includes(userId);
  const followerCount=user.followers?Object.keys(user.followers).length:0;
  const followingCount=user.following?Object.keys(user.following).length:0;

  el.innerHTML='<div class="profile-cover"><div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 60%,'+(user.color||'#7c5cfc')+'33,transparent 70%)"></div><div class="cover-decoration"><span class="cover-stars">✦ ✦ ✦ ✦</span></div></div>'
    +'<div style="position:relative;background:var(--bg2)">'
    +'<div class="profile-header-bar">'
    +'<div class="avatar-xl" style="background:linear-gradient(135deg,'+(user.color||'#7c5cfc')+','+(user.color||'#7c5cfc')+'88)">'+getInitials(user.name)+'</div>'
    +'<div style="display:flex;gap:10px;padding-bottom:12px;align-items:center">'
    +(isOwn?'<button class="edit-profile-btn" onclick="openEditProfile()"><i class="fa-solid fa-pencil"></i> Editar perfil</button>'
      :'<button class="msg-user-btn" onclick="openChatWith(\''+userId+'\')"><i class="fa-solid fa-message"></i> Mensaje</button>'
      +'<button class="follow-action-btn '+(isFollowing?'following-state':'')+'" onclick="toggleFollow(\''+userId+'\').then(()=>showProfile(\''+userId+'\'))">'+
      (isFollowing?'✓ Siguiendo':'+ Seguir')+'</button>')
    +'</div></div>'
    +'<div class="profile-info-section">'
    +'<div class="profile-name">'+escapeHtml(user.name)+'</div>'
    +'<div class="profile-handle">'+escapeHtml(user.username)+'</div>'
    +'<div class="profile-bio">'+(user.bio?escapeHtml(user.bio):'<span style="color:var(--text3)">Sin bio todavía...</span>')+'</div>'
    +'<div class="profile-meta">'+(user.location?'<div class="profile-meta-item"><i class="fa-solid fa-location-dot"></i>'+escapeHtml(user.location)+'</div>':'')
    +'<div class="profile-meta-item"><i class="fa-solid fa-star"></i>Desde '+(user.joinDate||'2024')+'</div></div>'
    +'<div class="profile-stats"><div class="stat-item"><div class="stat-num" id="profile-post-count">...</div><div class="stat-label">Publicaciones</div></div>'
    +'<div class="stat-item"><div class="stat-num">'+followingCount+'</div><div class="stat-label">Siguiendo</div></div>'
    +'<div class="stat-item"><div class="stat-num">'+followerCount+'</div><div class="stat-label">Seguidores</div></div></div></div>'
    +'<div class="profile-tabs"><button class="profile-tab active">Publicaciones</button></div>'
    +'<div class="profile-posts" id="profile-posts-list"><div style="text-align:center;padding:24px;color:var(--text3)">Cargando...</div></div></div>';

  const postsEl=$('profile-posts-list');
  db.ref('posts').orderByChild('authorId').equalTo(userId).on('value',snap=>{
    postsEl.innerHTML=''; const posts=[];
    snap.forEach(c=>posts.push({id:c.key,...c.val()})); posts.sort((a,b)=>b.timestamp-a.timestamp);
    const countEl=$('profile-post-count'); if(countEl)countEl.textContent=posts.length;
    if(posts.length===0){postsEl.innerHTML='<div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:40px;margin-bottom:12px">🌌</div>Aún no hay publicaciones.</div>';return;}
    posts.forEach(p=>postsEl.appendChild(renderPostCard(p)));
  });
}

function showMyProfile(){showProfile(currentUser.uid);showView('profile');}

function openEditProfile() {
  $('edit-name').value=currentUser.name||''; $('edit-bio').value=currentUser.bio||'';
  $('edit-location').value=currentUser.location||''; $('edit-color').value=currentUser.color||'#7c5cfc';
  $('modal-edit-profile').classList.add('open');
}

async function saveProfile() {
  const name=$('edit-name').value.trim()||currentUser.name;
  const bio=$('edit-bio').value.trim(), location=$('edit-location').value.trim(), color=$('edit-color').value;
  await db.ref('users/'+currentUser.uid).update({name,bio,location,color});
  currentUser={...currentUser,name,bio,location,color};
  closeModal('modal-edit-profile'); updateSidebarUser(); showMyProfile(); showToast('¡Perfil actualizado!','✦');
}

/* ══ CHAT ══ */
async function renderChatList() {
  const el=$('chat-list');
  const snap=await db.ref('users').get(); const allUsers=[];
  snap.forEach(c=>{if(c.key!==currentUser.uid)allUsers.push({id:c.key,...c.val()});});
  const convSnap=await db.ref('chats').get();
  if(!convSnap.exists()){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">No hay mensajes todavía.</div>';return;}
  const myChats=[];
  convSnap.forEach(c=>{
    if(c.key.includes(currentUser.uid)){
      const msgs=[]; c.child('messages').forEach(m=>msgs.push(m.val()));
      const partnerId=c.key.split('__').find(p=>p!==currentUser.uid);
      const partner=allUsers.find(u=>(u.uid||u.id)===partnerId);
      if(partner&&msgs.length>0)myChats.push({key:c.key,partner,msgs});
    }
  });
  if(myChats.length===0){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">No hay mensajes.<br>¡Inicia una conversación!</div>';return;}
  el.innerHTML=myChats.map(ch=>{
    const last=ch.msgs[ch.msgs.length-1], uid=ch.partner.uid||ch.partner.id, isAct=activeChatUserId===uid;
    return '<div class="chat-list-item '+(isAct?'active':'')+'" onclick="openChatWith(\''+uid+'\')">'
      +'<div class="avatar-md" style="background:linear-gradient(135deg,'+(ch.partner.color||'#7c5cfc')+','+(ch.partner.color||'#7c5cfc')+'88)">'+getInitials(ch.partner.name)+'</div>'
      +'<div class="chat-item-info"><div class="chat-item-header"><span class="chat-item-name">'+escapeHtml(ch.partner.name)+'</span>'
      +'<span class="chat-item-time">'+(last?formatTime(last.timestamp):'')+'</span></div>'
      +'<div class="chat-item-preview">'+(last?escapeHtml((last.deleted?'Mensaje eliminado':(last.senderId===currentUser.uid?'Tú: ':'')+last.text).slice(0,40)):'')+'</div></div></div>';
  }).join('');
}

async function openChatWith(userId) {
  const snap=await db.ref('users/'+userId).get(); if(!snap.exists())return;
  const partner={uid:snap.key,...snap.val()};
  activeChatUserId=userId; showView('chat'); renderChatList(); renderChatWindow(partner);
}

function renderChatWindow(partner) {
  const win=$('chat-window');
  win.innerHTML='<div class="chat-win-header">'
    +'<div class="avatar-md" style="background:linear-gradient(135deg,'+(partner.color||'#7c5cfc')+','+(partner.color||'#7c5cfc')+'88);cursor:pointer" onclick="showProfile(\''+partner.uid+'\')">'+getInitials(partner.name)+'</div>'
    +'<div class="chat-win-user"><div class="chat-win-name">'+escapeHtml(partner.name)+'</div><div class="chat-win-status">● En órbita</div></div>'
    +'<button class="icon-btn" onclick="showProfile(\''+partner.uid+'\')"><i class="fa-solid fa-user"></i></button></div>'
    +'<div class="messages-area" id="messages-area"></div>'
    +'<div class="msg-input-area"><div id="reply-preview-container"></div>'
    +'<div class="msg-input-row">'
    +'<textarea class="msg-input-box" id="msg-input-box" placeholder="Enviar mensaje a '+escapeHtml(partner.name)+'..." rows="1"'
    +' onkeydown="handleMsgKey(event,\''+partner.uid+'\')" oninput="this.style.height=\'auto\';this.style.height=this.scrollHeight+\'px\'"></textarea>'
    +'<button class="msg-send-btn" onclick="sendMessage(\''+partner.uid+'\')"><i class="fa-solid fa-paper-plane"></i></button></div></div>';

  const chatKey=getChatKey(currentUser.uid,partner.uid), area=$('messages-area');
  const ref=db.ref('chats/'+chatKey+'/messages').orderByChild('timestamp');
  if(chatListeners[chatKey])chatListeners[chatKey]();
  const handler=ref.on('value',snap=>{
    const msgs=[]; snap.forEach(c=>msgs.push({id:c.key,...c.val()}));
    msgs.filter(m=>m.senderId!==currentUser.uid&&m.status!=='read').forEach(m=>db.ref('chats/'+chatKey+'/messages/'+m.id+'/status').set('read'));
    const wasAtBottom=area.scrollHeight-area.scrollTop-area.clientHeight<80;
    renderMessages(msgs,area,partner.uid,chatKey);
    if(wasAtBottom||msgs.length<=2)area.scrollTop=area.scrollHeight;
  });
  chatListeners[chatKey]=()=>ref.off('value',handler);
}

function renderMessages(msgs,container,partnerId,chatKey) {
  container.innerHTML='';
  if(msgs.length===0){container.innerHTML='<div style="text-align:center;color:var(--text3);font-size:13px;padding:30px"><div style="font-size:36px;margin-bottom:10px">🌟</div>Inicio de la conversación</div>';return;}
  const rmap={supernova:'🌟',quantum:'⚛️',warp:'🌀',eclipse:'🌑',pulsar:'💫'};
  msgs.forEach(msg=>{
    if(msg.deleted)return;
    const isOwn=msg.senderId===currentUser.uid, group=document.createElement('div');
    group.className='msg-group '+(isOwn?'own':'');
    let replyHtml='';
    if(msg.replyTo){const orig=msgs.find(m=>m.id===msg.replyTo);if(orig&&!orig.deleted)replyHtml='<div class="msg-reply-preview"><strong>'+(orig.senderId===currentUser.uid?'Tú':escapeHtml(orig.senderName||''))+'</strong>: '+escapeHtml(orig.text.slice(0,60))+'</div>';}
    const statusHtml=isOwn?(msg.status==='read'?'<span class="msg-status read">✓✓</span>':'<span class="msg-status">✓'+(msg.status==='delivered'?'✓':'')+'</span>'):'';
    group.innerHTML='<div class="msg-wrapper"><div class="msg-bubble '+(isOwn?'outgoing':'incoming')+'" id="'+msg.id+'" oncontextmenu="showMsgCtxMenu(event,\''+msg.id+'\',\''+chatKey+'\','+isOwn+')">'+replyHtml+'<div>'+escapeHtml(msg.text)+'</div>'+(msg.reaction?'<div class="msg-reaction-display">'+(rmap[msg.reaction]||'')+'</div>':'')+'</div></div><div class="msg-meta"><span>'+formatTime(msg.timestamp)+'</span>'+statusHtml+'</div>';
    container.appendChild(group);
  });
}

async function sendMessage(partnerId) {
  const input=$('msg-input-box'), text=input.value.trim(); if(!text)return;
  const chatKey=getChatKey(currentUser.uid,partnerId);
  const ref=db.ref('chats/'+chatKey+'/messages').push();
  await ref.set({senderId:currentUser.uid,senderName:currentUser.name,text,timestamp:ts(),status:'sent',reaction:null,replyTo:replyingToMsg||null,deleted:false});
  setTimeout(()=>ref.update({status:'delivered'}),700);
  setTimeout(()=>ref.update({status:'read'}),2200);
  input.value=''; input.style.height='auto';
  replyingToMsg=null; $('reply-preview-container').innerHTML=''; renderChatList();
}

function handleMsgKey(event,partnerId){if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMessage(partnerId);}}

function showMsgCtxMenu(event,msgId,chatKey,isOwn) {
  event.preventDefault(); event.stopPropagation(); closeAllContextMenus();
  const menu=document.createElement('div'); menu.className='msg-context-menu'; menu.id='active-msg-menu';
  menu.style.top=event.clientY+'px'; menu.style.left=Math.min(event.clientX,window.innerWidth-170)+'px';
  let items='<div class="ctx-item" onclick="replyToMsg(\''+msgId+'\',\''+chatKey+'\')"><i class="fa-solid fa-reply"></i> Responder</div>'
    +'<div class="ctx-item" onclick="reactToMsg(event,\''+msgId+'\',\''+chatKey+'\')"><i class="fa-solid fa-face-smile"></i> Reaccionar</div>';
  if(isOwn)items+='<div class="ctx-item" onclick="editMsg(\''+msgId+'\',\''+chatKey+'\')"><i class="fa-solid fa-pencil"></i> Editar</div>'
    +'<div class="ctx-item danger" onclick="deleteMsg(\''+msgId+'\',\''+chatKey+'\')"><i class="fa-solid fa-trash"></i> Eliminar</div>';
  menu.innerHTML=items; document.body.appendChild(menu);
}

async function replyToMsg(msgId,chatKey) {
  closeAllContextMenus();
  const snap=await db.ref('chats/'+chatKey+'/messages/'+msgId).get(); if(!snap.exists())return;
  const msg=snap.val(); replyingToMsg=msgId;
  $('reply-preview-container').innerHTML='<div class="reply-preview-bar"><span><strong>'+(msg.senderId===currentUser.uid?'Tú':escapeHtml(msg.senderName||''))+'</strong>: '+escapeHtml(msg.text.slice(0,60))+'</span><span class="reply-cancel" onclick="cancelReply()">✕</span></div>';
  $('msg-input-box').focus();
}

function cancelReply(){replyingToMsg=null;$('reply-preview-container').innerHTML='';}

function reactToMsg(event,msgId,chatKey) {
  closeAllContextMenus(); msgReactionTarget={msgId,chatKey};
  const popup=$('msg-reactions-popup');
  popup.style.top=(event.clientY-70)+'px'; popup.style.left=Math.min(event.clientX,window.innerWidth-270)+'px';
  popup.classList.add('visible');
}

async function applyMsgReaction(btn) {
  if(!msgReactionTarget)return;
  const {msgId,chatKey}=msgReactionTarget;
  const ref=db.ref('chats/'+chatKey+'/messages/'+msgId);
  const snap=await ref.get(), cur=snap.val()?.reaction;
  await ref.update({reaction:cur===btn.dataset.reaction?null:btn.dataset.reaction});
  $('msg-reactions-popup').classList.remove('visible'); msgReactionTarget=null;
}

async function editMsg(msgId,chatKey) {
  closeAllContextMenus();
  const snap=await db.ref('chats/'+chatKey+'/messages/'+msgId).get(); if(!snap.exists())return;
  const newText=prompt('Editar mensaje:',snap.val().text);
  if(newText!==null&&newText.trim()){await db.ref('chats/'+chatKey+'/messages/'+msgId).update({text:newText.trim()+' ✏️'});showToast('Mensaje editado','✏️');}
}

async function deleteMsg(msgId,chatKey) {
  closeAllContextMenus();
  await db.ref('chats/'+chatKey+'/messages/'+msgId).update({deleted:true,text:''});
  showToast('Mensaje eliminado','🗑️'); renderChatList();
}

function openNewChatModal(){$('modal-new-chat').classList.add('open');$('new-chat-search').value='';searchForChat('');}

async function searchForChat(query) {
  const el=$('new-chat-results'), snap=await db.ref('users').get(), q=query.toLowerCase(); const results=[];
  snap.forEach(c=>{const u={id:c.key,...c.val()};if((u.uid||u.id)===currentUser.uid)return;if(!q||u.name?.toLowerCase().includes(q)||u.username?.toLowerCase().includes(q))results.push(u);});
  el.innerHTML=results.slice(0,8).map(u=>{const uid=u.uid||u.id;return '<div class="user-result-card" onclick="closeModal(\'modal-new-chat\');openChatWith(\''+uid+'\')">'
    +'<div class="avatar-sm" style="background:linear-gradient(135deg,'+(u.color||'#7c5cfc')+','+(u.color||'#7c5cfc')+'88)">'+getInitials(u.name)+'</div>'
    +'<div class="user-result-info"><div class="user-result-name">'+escapeHtml(u.name)+'</div><div class="user-result-handle">'+escapeHtml(u.username)+'</div></div></div>';}).join('');
}

/* ══ NOTIFICATIONS ══ */
async function renderNotifications() {
  const el=$('notif-list');
  const snap=await db.ref('notifications/'+currentUser.uid).orderByChild('timestamp').limitToLast(30).get();
  if(!snap.exists()){el.innerHTML='<div style="padding:40px;text-align:center;color:var(--text3)">Sin señales todavía ✦</div>';return;}
  const notifs=[]; snap.forEach(c=>notifs.push({id:c.key,...c.val()})); notifs.reverse();
  const icons={reaction:'🌟',comment:'💬',follow:'👤',share:'🔁',mention:'@'};
  el.innerHTML=notifs.map(n=>{
    const text=n.type==='follow'?'<strong>'+escapeHtml(n.fromName)+'</strong> comenzó a seguirte'
      :n.type==='reaction'?'<strong>'+escapeHtml(n.fromName)+'</strong> reaccionó a tu publicación'
      :n.type==='comment'?'<strong>'+escapeHtml(n.fromName)+'</strong> comentó tu publicación'
      :n.type==='share'?'<strong>'+escapeHtml(n.fromName)+'</strong> compartió tu publicación'
      :'<strong>'+escapeHtml(n.fromName||'')+'</strong> te mencionó';
    return '<div class="notif-item '+(n.read?'':'unread')+'" onclick="handleNotifClick(\''+n.id+'\',\''+(n.fromId||'+')+'\')">'
      +'<div class="avatar-sm" style="background:linear-gradient(135deg,'+(n.fromColor||'#7c5cfc')+','+(n.fromColor||'#7c5cfc')+'88)">'+getInitials(n.fromName||'?')+'</div>'
      +'<div class="notif-text"><div>'+text+'</div><div class="notif-time">'+formatTime(n.timestamp)+'</div></div>'
      +'<div class="notif-icon">'+(icons[n.type]||'✦')+'</div></div>';
  }).join('');
}

async function markNotifsRead() {
  const snap=await db.ref('notifications/'+currentUser.uid).orderByChild('read').equalTo(false).get();
  const updates={}; snap.forEach(c=>{updates[c.key+'/read']=true;});
  if(Object.keys(updates).length>0)await db.ref('notifications/'+currentUser.uid).update(updates);
}

function handleNotifClick(notifId,fromId) {
  db.ref('notifications/'+currentUser.uid+'/'+notifId).update({read:true});
  if(fromId&&fromId!=='+')showProfile(fromId);
}

/* ══ GLOBAL ══ */
function handleGlobalClick(event) {
  if(!$('reactions-popup').contains(event.target))$('reactions-popup').classList.remove('visible');
  if(!$('msg-reactions-popup').contains(event.target))$('msg-reactions-popup').classList.remove('visible');
  if(!event.target.closest('.msg-context-menu')&&!event.target.closest('.post-context-menu'))closeAllContextMenus();
  document.querySelectorAll('.modal-overlay.open').forEach(o=>{if(event.target===o)o.classList.remove('open');});
}

document.addEventListener('DOMContentLoaded',()=>{
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeAllContextMenus();document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));}
  });
  ['login-user','login-pass'].forEach(id=>{const el=$(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});});
});
