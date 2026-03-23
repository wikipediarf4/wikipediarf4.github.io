// ===== NOTIFICATIONS =====
let _notifs = [];
async function addNotif(text){
  if(!window.CU) return;
  const notif = {text, time:Date.now(), read:false};
  _notifs.unshift(notif);
  // Usar arrayUnion para NO sobreescribir notifs que llegaron de otros usuarios
  try { await updateDoc(doc(db,'users',window.CU.id), {notifs: arrayUnion(notif)}); }
  catch(e){ console.error('addNotif',e); }
  renderNotifs(); updateNotifBadge();
  // NO reproducir sonido en notifs propias (acciones del propio usuario)
}

// ── AUDIO GLOBAL — se desbloquea en el primer click del usuario ──
let _sharedACtx = null;
let _audioUnlocked = false; // solo crear AudioContext tras gesto del usuario

async function _ensureAudio(){
  // No crear AudioContext hasta que el usuario haya interactuado con la página
  if(!_audioUnlocked) return false;
  if(!_sharedACtx || _sharedACtx.state==='closed'){
    try{ _sharedACtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return false; }
  }
  if(_sharedACtx.state==='suspended'){
    try{ await _sharedACtx.resume(); }catch(e){ return false; }
  }
  return _sharedACtx.state==='running';
}
// Desbloquear audio solo tras gesto real del usuario
['click','keydown','touchstart'].forEach(ev=>{
  document.addEventListener(ev, ()=>{
    _audioUnlocked = true;
    _ensureAudio();
  }, {passive:true});
});

async function playNotifSound(){
  try{
    const ok = await _ensureAudio(); if(!ok) return;
    const ctx = _sharedACtx;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.setValueAtTime(880, ctx.currentTime+0.08);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.3);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.3);
  }catch(e){}
}

async function playMsgSound(){
  try{
    const ok = await _ensureAudio(); if(!ok) return;
    const ctx = _sharedACtx;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1100, ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.35);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.35);
  }catch(e){}
}
let _notifTab = 'all';
function switchNotifTab(tab){
  _notifTab = tab;
  const all = document.getElementById('ntab-all');
  const unread = document.getElementById('ntab-unread');
  if(all){ all.style.background = tab==='all'?'var(--accent)':'transparent'; all.style.color = tab==='all'?'#000':'var(--muted)'; }
  if(unread){ unread.style.background = tab==='unread'?'var(--accent)':'transparent'; unread.style.color = tab==='unread'?'#000':'var(--muted)'; }
  renderNotifs();
}
async function markAllNotifsRead(){
  if(!window.CU||!_notifs.length) return;
  // Leer array fresco de Firestore, marcar todo como leído sin pisar notifs nuevas
  try {
    const snap = await getDoc(doc(db,'users',window.CU.id));
    const fresh = snap.exists() ? (snap.data().notifs||[]) : _notifs;
    const updated = fresh.map(n=>({...n, read:true}));
    _notifs = updated;
    await updateDoc(doc(db,'users',window.CU.id),{notifs: updated.slice(0,50)});
  } catch(e){
    _notifs.forEach(n=>n.read=true);
  }
  renderNotifs(); updateNotifBadge();
}

function _notifIcon(n){
  // Retorna {emoji, bg, icon} para el badge sobre el avatar
  if(n.type==='friendRequest') return {bg:'#1877f2', icon:'👥'};
  const t = n.text||'';
  if(t.includes('cumpleaños')||t.includes('🎂')) return {bg:'#e91e63', icon:'🎂'};
  if(t.includes('reaccionó')||t.includes('❤️')||t.includes('😍')) return {bg:'#f02849', icon:'❤️'};
  if(t.includes('comentó')||t.includes('💬')) return {bg:'#1877f2', icon:'💬'};
  if(t.includes('compartió')||t.includes('🔁')) return {bg:'#1877f2', icon:'🔁'};
  if(t.includes('etiquetó')||t.includes('🏷')) return {bg:'#1877f2', icon:'🏷️'};
  if(t.includes('amigo')||t.includes('solicitud')||t.includes('aceptó')) return {bg:'#1877f2', icon:'👥'};
  if(t.includes('spot')||t.includes('📍')) return {bg:'#43a047', icon:'📍'};
  if(t.includes('trofeo')||t.includes('🏆')) return {bg:'#f9a825', icon:'🏆'};
  if(t.includes('verificad')||t.includes('✅')) return {bg:'#ffd700', icon:'✅'};
  if(t.includes('historia')||t.includes('📖')) return {bg:'#9c27b0', icon:'📖'};
  if(t.includes('felicitó')||t.includes('🎉')) return {bg:'#e91e63', icon:'🎉'};
  return {bg:'#1877f2', icon:'🔔'};
}

function renderNotifs(){
  const el = document.getElementById('notifList');
  if(!el) return;
  // Excluir notificaciones de mensajes 💬 — esas van al ícono de chat, no a la campana
  const noMsg = _notifs.filter(n=>!(n.text&&n.text.startsWith('💬')));
  // Ordenar por tiempo DESC (más nuevas primero)
  noMsg.sort((a,b)=>(b.time||0)-(a.time||0));
  const list = _notifTab==='unread' ? noMsg.filter(n=>!n.read) : noMsg;
  if(!list.length){
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--muted);">
      <div style="font-size:2.5rem;margin-bottom:10px;">${_notifTab==='unread'?'✓':'🔔'}</div>
      <div style="font-size:.85rem;">${_notifTab==='unread'?'Todo al día, sin notificaciones sin leer':'Sin notificaciones aún'}</div>
    </div>`;
    el.onclick = null;
    return;
  }

  // Agrupar por hoy / anteriores
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();
  const todayItems = list.filter(n=>(n.time||0)>=todayTs);
  const prevItems  = list.filter(n=>(n.time||0)<todayTs);

  function renderItem(n, i){
    const isRead = !!n.read;
    const {bg, icon} = _notifIcon(n);
    const unreadBg = isRead ? '' : 'rgba(0,198,255,.05)';
    const rowBg = isRead ? '' : 'background:rgba(0,198,255,.05);';

    // Avatar del que generó la notif
    const fromAv = n.fromAv || n.visitorAv || '';
    const avInner = `<img src="${fromAv||getDefaultAv()}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`;

    if(n.type==='friendRequest'){
      const safeNick = (n.fromNick||'').replace(/['"<>&]/g,'');
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;transition:background .15s;${rowBg}cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);"
        onmouseover="this.style.background='var(--bg3)'"
        onmouseout="this.style.background='${unreadBg}'">
        <div style="position:relative;flex-shrink:0;">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--bg3);overflow:hidden;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${avInner}</div>
          <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:.65rem;border:2px solid var(--bg2);">${icon}</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.84rem;line-height:1.4;margin-bottom:6px;color:var(--text);"><strong>${esc(n.fromNick||'')}</strong> <span style="color:var(--muted);">quiere ser tu amigo/a</span></div>
          <div style="font-size:.7rem;color:var(--accent);margin-bottom:10px;">${fmtT(n.time)}</div>
          <div style="display:flex;gap:8px;">
            <button data-action="accept-friend" data-idx="${i}" data-uid="${n.fromId||''}" data-nick="${safeNick}"
              style="flex:1;padding:8px;background:var(--accent);border:none;color:#000;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;">Confirmar</button>
            <button data-action="reject-friend" data-idx="${i}"
              style="flex:1;padding:8px;background:var(--bg4);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;">Eliminar</button>
          </div>
        </div>
        ${!isRead?`<div style="width:8px;height:8px;background:var(--accent);border-radius:50%;flex-shrink:0;margin-top:6px;"></div>`:''}
      </div>`;
    }

    // Notif normal
    const postId = n.postId||'';
    const bdayUid = n.bdayUid||'';
    const storyId = n.storyId||'';
    const clickable = !!(postId || bdayUid || storyId);

    // Vista previa del contenido al que se reaccionó/comentó
    const hasPostPreview = !!(n.postImg || n.postPreviewText) && postId;
    const isReactionNotif = (n.text||'').includes('reaccionó') || (n.text||'').match(/^[👍❤️😂😮😢🔥]/u);

    // Separar el texto en partes: actor + acción (para resaltar el nick)
    let notifTextHtml = '';
    const rawText = n.text||'';
    const nickMatch = rawText.match(/^([^\s]+(?:\s[^\s]+)?)?\s*(.*)/);
    // Intenta extraer emoji + nick del inicio
    const emojiNickMatch = rawText.match(/^([\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F\u20E3\u200D]+)?\s*([\w.\-_À-ÿ]+)\s+(.+)$/u);
    if(emojiNickMatch){
      const [, emo, nick, rest] = emojiNickMatch;
      notifTextHtml = `${emo||''} <strong style="color:var(--text)">${esc(nick)}</strong> <span style="color:var(--muted)">${esc(rest)}</span>`;
    } else {
      notifTextHtml = rawText;
    }

    // Tarjeta de preview del post
    let previewCard = '';
    if(hasPostPreview){
      if(n.postImg){
        previewCard = `<div style="margin-top:8px;display:flex;align-items:stretch;border-radius:10px;overflow:hidden;border:1px solid rgba(46,196,182,.25);background:var(--bg3);">
          <img src="${n.postImg}" style="width:64px;height:64px;object-fit:cover;flex-shrink:0;display:block;" onerror="this.parentElement.style.display='none'">
          ${n.postPreviewText ? `<div style="padding:8px 10px;font-size:.75rem;color:var(--muted);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(n.postPreviewText)}</div>` : '<div style="padding:8px 10px;font-size:.72rem;color:var(--muted);font-style:italic;">Ver publicación</div>'}
        </div>`;
      } else if(n.postPreviewText){
        previewCard = `<div style="margin-top:8px;border-radius:10px;border-left:3px solid ${bg};background:var(--bg3);padding:8px 12px;font-size:.76rem;color:var(--muted);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(n.postPreviewText)}</div>`;
      }
    } else if(storyId){
      previewCard = `<div style="margin-top:8px;border-radius:10px;overflow:hidden;border:1px solid rgba(46,196,182,.25);background:rgba(46,196,182,.06);">
        ${n.storyImg ? `<img src="${n.storyImg}" style="width:100%;max-height:72px;object-fit:cover;display:block;">` : '<div style="width:100%;height:36px;background:linear-gradient(135deg,#0a2a4a,#0077b6);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🎣</div>'}
        <div style="padding:4px 8px;font-size:.65rem;color:var(--accent);font-weight:700;">📖 Ver historia →</div>
      </div>`;
    }

    return `<div data-action="notif-click" data-postid="${postId}" data-bdayuid="${bdayUid}" data-bdaynick="${n.bdayNick||''}" data-storyid="${storyId}"
      style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;transition:background .15s;${rowBg}cursor:${clickable?'pointer':'default'};border-bottom:1px solid rgba(255,255,255,.04);position:relative;"
      onmouseover="this.style.background='var(--bg3)';this.querySelector('.notif-del-btn')&&(this.querySelector('.notif-del-btn').style.opacity='1')"
      onmouseout="this.style.background='${unreadBg}';this.querySelector('.notif-del-btn')&&(this.querySelector('.notif-del-btn').style.opacity='0')">
      ${!isRead ? `<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${bg};border-radius:0 2px 2px 0;"></div>` : ''}
      <div style="position:relative;flex-shrink:0;">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--bg3);overflow:hidden;border:2px solid ${isRead?'var(--border)':bg};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${avInner}</div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:.72rem;border:2px solid var(--bg2);box-shadow:0 1px 4px rgba(0,0,0,.4);">${icon}</div>
      </div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:.83rem;line-height:1.45;color:var(--text);word-break:break-word;">${notifTextHtml}</div>
        ${previewCard}
        <div style="font-size:.7rem;color:${isRead?'var(--muted)':bg};margin-top:5px;font-weight:${isRead?'400':'600'};">${fmtT(n.time)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;margin-left:2px;">
        ${!isRead?`<div style="width:8px;height:8px;background:${bg};border-radius:50%;box-shadow:0 0 6px ${bg}88;flex-shrink:0;"></div>`:'<div style="width:8px;"></div>'}
        <button data-action="delete-notif" data-idx="${i}" onclick="event.stopPropagation()" class="notif-del-btn"
          style="opacity:0;transition:opacity .2s;background:none;border:none;color:var(--muted);font-size:.85rem;cursor:pointer;padding:4px;border-radius:50%;line-height:1;width:24px;height:24px;display:flex;align-items:center;justify-content:center;"
          onmouseover="this.style.color='var(--red)';this.style.background='var(--bg4)'"
          onmouseout="this.style.color='var(--muted)';this.style.background='none'">✕</button>
      </div>
    </div>`;
  }

  let html = '';
  if(todayItems.length){
    html += `<div style="padding:10px 14px 5px;font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Hoy</div>`;
    html += todayItems.map((n,i)=>renderItem(n,i)).join('');
  }
  if(prevItems.length){
    if(todayItems.length) html += `<div style="height:1px;background:var(--border);margin:4px 0;"></div>`;
    html += `<div style="padding:10px 14px 5px;font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Anteriores</div>`;
    html += prevItems.map((n,i)=>renderItem(n, todayItems.length+i)).join('');
  }
  el.innerHTML = html;

  el.onclick = async (e)=>{
    const row = e.target.closest('[data-action]');
    if(!row) return;
    const action = row.dataset.action;
    if(action==='notif-click'){
      if(row.dataset.storyid){ closeNotifDropdown(); openStoryById(row.dataset.storyid); }
      else if(row.dataset.postid){ closeNotifDropdown(); scrollToPost(row.dataset.postid); }
      else if(row.dataset.bdayuid){ closeNotifDropdown(); openUserProfile(row.dataset.bdayuid, row.dataset.bdaynick); }
    } else if(action==='view-profile'){
      closeNotifDropdown(); openUserProfile(row.dataset.uid, row.dataset.nick);
    } else if(action==='accept-friend'){
      row.disabled=true; row.textContent='Aceptando...';
      await acceptFriendRequest(row.dataset.uid, row.dataset.nick, parseInt(row.dataset.idx));
    } else if(action==='reject-friend'){
      await rejectFriendRequest(parseInt(row.dataset.idx));
    } else if(action==='delete-notif'){
      const idx = parseInt(row.dataset.idx);
      const noMsg = _notifs.filter(n=>!(n.text&&n.text.startsWith('💬')));
      noMsg.sort((a,b)=>(b.time||0)-(a.time||0));
      const notifToRemove = noMsg[idx];
      if(notifToRemove){
        // Borrar del array local
        const globalIdx = _notifs.indexOf(notifToRemove);
        if(globalIdx > -1) _notifs.splice(globalIdx, 1);
        // Borrar de Firestore con arrayRemove (no sobreescribe otras notifs)
        if(window.CU){
          updateDoc(doc(db,'users',window.CU.id), {notifs: arrayRemove(notifToRemove)}).catch(()=>{});
        }
        renderNotifs();
        updateNotifBadge();
      }
    }
  };
}

function updateNotifBadge(){
  // Campana: solo likes, comentarios, amigos, reacciones, trofeos, etc — NO mensajes 💬
  const unread = _notifs.filter(n=>{
    if(n.read) return false;
    const t = n.text||'';
    if(t.startsWith('💬')) return false; // mensajes van al badge de chat
    return true;
  }).length;
  const el = document.getElementById('notifDot');
  if(!el) return;
  if(unread > 0){
    el.style.display='flex';
    el.textContent = unread > 10 ? '+10' : String(unread);
  } else {
    el.style.display='none';
  }
  // Badge de mensajes también se actualiza acá para sincronizar
  updateMsgBadge();
}
function updateMsgBadge(){
  const el = document.getElementById('msgBadge');
  if(!el) return;
  const archived = window.CU?.archivedChats || [];
  const deleted  = window.CU?.deletedChats  || [];

  // Contar chats con mensajes no leídos (de los listeners en tiempo real)
  const unread = Object.entries(_chatLastMsgs).filter(([uid, lm])=>{
    if(archived.includes(uid)) return false;
    if(deleted.includes(uid))  return false;
    return !!lm.unread;
  }).length;

  // Contar mensajes individuales no leídos (suma de unreadCount por chat)
  const totalMsgs = Object.entries(_chatLastMsgs).filter(([uid])=>!archived.includes(uid)&&!deleted.includes(uid))
    .reduce((acc,[,lm])=> acc + (lm.unreadCount||0), 0);
  const displayCount = totalMsgs > 0 ? totalMsgs : unread;
  if(displayCount > 0){
    el.style.display='flex';
    el.textContent = displayCount > 99 ? '99+' : String(displayCount);
  } else {
    el.style.display='none';
  }
}

let _notifUnsub = null;
let _notifFirstLoad = true; // Ignorar el primer snapshot (carga inicial)
function listenNotifs(){
  if(!window.CU) return;
  if(_notifUnsub){ _notifUnsub(); _notifUnsub=null; }
  _notifFirstLoad = true;
  _notifUnsub = onSnapshot(doc(db,'users',window.CU.id), snap=>{
    if(!snap.exists()) return;
    const d = snap.data();
    if(window.CU){
      window.CU.archivedChats = d.archivedChats || [];
      window.CU.deletedChats  = d.deletedChats  || [];
      if(d.friendsList) window.CU.friendsList = d.friendsList;
    }
    const newNotifs = d.notifs || [];

    if(_notifFirstLoad){
      // Primera carga: solo cargar las notifs, NO tocar ni sonido ni toast
      _notifFirstLoad = false;
      _notifs = newNotifs;
      renderNotifs(); updateNotifBadge(); updateMsgBadge();
      return;
    }

    // Detección 100% confiable por clave única
    const knownKeys = new Set(
      _notifs.map(n => `${n.time||0}_${n.fromNick||''}_${(n.text||'').slice(0,30)}`)
    );
    const brandNew = newNotifs.filter(n =>
      !knownKeys.has(`${n.time||0}_${n.fromNick||''}_${(n.text||'').slice(0,30)}`)
    );

    _notifs = newNotifs;

    if(brandNew.length > 0){
      const newMsgs    = brandNew.filter(n =>  n.text?.startsWith('💬'));
      const newNonMsgs = brandNew.filter(n => !n.text?.startsWith('💬'));
      if(newMsgs.length > 0){
        // Actualizar _chatLastMsgs INMEDIATAMENTE para que el messenger muestre el badge
        // sin esperar al próximo poll de 8s
        newMsgs.forEach(n => {
          const fromUid = n.fromUid || null;
          const fromNick = n.fromNick || '';
          // Buscar el uid del remitente en friendsList por nick si no viene fromUid
          const senderFriend = (window.CU?.friendsList||[]).find(f =>
            (fromUid && f.id === fromUid) || f.nick === fromNick
          );
          const senderUid = fromUid || senderFriend?.id;
          if(senderUid){
            const existing = _chatLastMsgs[senderUid] || {};
            // Extraer texto del mensaje de la notif (formato: "💬 nick: texto")
            const colonIdx = n.text.indexOf(': ');
            const msgPreview = colonIdx > -1 ? n.text.slice(colonIdx + 2) : n.text;
            _chatLastMsgs[senderUid] = {
              ...existing,
              text: msgPreview,
              time: n.time || Date.now(),
              mine: false,
              unread: true,
              unreadCount: (existing.unreadCount || 0) + 1,
              fromNick: n.fromNick || existing.fromNick || '',
              fromAv: n.fromAv || existing.fromAv || '',
              nick: n.fromNick || existing.nick || ''
            };
          }
        });
        updateMsgBadge();
        // Re-render messenger list si está abierto para mostrar el contacto destacado
        if(_messengerOpen){
          const _ml = document.getElementById('messengerList');
          if(_ml && _ml.style.display !== 'none') _ml.innerHTML = _buildMessengerHTML();
        }
        const latest = newMsgs.sort((a,b)=>(b.time||0)-(a.time||0))[0];
        playMsgSound();
        showNotifToast(latest.text||'Nuevo mensaje');
      }
      if(newNonMsgs.length > 0){
        const latest = newNonMsgs.sort((a,b)=>(b.time||0)-(a.time||0))[0];
        playNotifSound();
        showNotifToast(latest.text||'Nueva notificación');
      }
    }
    renderNotifs(); updateNotifBadge(); updateMsgBadge();
    if(_messengerOpen){
      const _ln_list = document.getElementById('messengerList');
      if(_ln_list && _ln_list.style.display !== 'none'){
        _ln_list.innerHTML = _buildMessengerHTML();
      }
    }
  }, err=>{ console.warn('[listenNotifs] error:', err); });

  // Listener en tiempo real para badge de mensajes
  listenUnreadMsgsBadge();
}

// Badge de mensajes — polling cada 30s en vez de onSnapshot por cada amigo
// (N onSnapshots = N conexiones permanentes → barra de carga constante)
let _unsubMsgBadgeListeners = [];
let _msgBadgePollInterval = null;

function listenUnreadMsgsBadge(){
  // Cancelar listeners anteriores
  _unsubMsgBadgeListeners.forEach(u=>{ if(typeof u==='function') u(); });
  _unsubMsgBadgeListeners = [];
  if(_msgBadgePollInterval){ clearInterval(_msgBadgePollInterval); _msgBadgePollInterval=null; }

  // Correr inmediatamente y luego cada 8 segundos para badge más responsivo
  _pollMsgBadge();
  _msgBadgePollInterval = setInterval(_pollMsgBadge, 8000);
}

async function _pollMsgBadge(){
  const friends = window.CU?.friendsList || [];
  const myId = window.CU?.id;
  if(!myId || !friends.length) return;

  let totalUnread = 0;
  // Revisar todos los amigos para no perder mensajes sin leer
  const toCheck = friends;
  await Promise.all(toCheck.map(async f=>{
    try{
      const chatId = [myId, f.id].sort().join('_');
      const q = query(collection(db,'chats',chatId,'messages'), orderBy('time','desc'), limit(20));
      const snap = await getDocs(q);
      const unreadCount = snap.docs.filter(d=>{
        const m = d.data();
        return m.uid !== myId && !m.read && !(m.deletedFor||{})[myId];
      }).length;
      const visibleDoc = snap.docs.find(d=>!(d.data().deletedFor||{})[myId]);
      const lm = _chatLastMsgs[f.id] || {};
      if(visibleDoc){
        const md = visibleDoc.data();
        _chatLastMsgs[f.id] = {
          ...lm,
          text: md.sharedPostId ? '📤 Publicación compartida' : md.gif ? '🖼️ GIF' : md.audioUrl ? '🎤 Audio' : (md.text||''),
          time: md.time?.toMillis?.()||0,
          mine: md.uid === myId,
          unread: unreadCount > 0,
          unreadCount
        };
      } else {
        _chatLastMsgs[f.id] = {...lm, unread:false, unreadCount:0};
      }
      if(unreadCount > 0) totalUnread += unreadCount;
    }catch(e){}
  }));
  updateMsgBadge();
}

// ===== MESSENGER =====
function renderMessenger(){ if(_messengerOpen) renderMessengerList(); }

// ===== SEARCH =====
let _searchTimeout = null;
function doSearch(val){
  clearTimeout(_searchTimeout);
  const q = val.trim();
  if(!q){ renderFeed(); _closeSearchDrop(); return; }
  _searchTimeout = setTimeout(()=>_runSearch(q), 280);
}

function _closeSearchDrop(){
  const d = document.getElementById('_searchDrop');
  if(d) d.remove();
}

function _searchSection(icon, title, items, renderFn, onVerTodo){
  if(!items.length) return '';
  let h = `
  <div style="padding:14px 16px 6px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <span style="font-size:.82rem;font-weight:900;color:var(--text);letter-spacing:.3px;">${icon} ${title}</span>
      <span onclick="${onVerTodo}" style="font-size:.75rem;font-weight:700;color:var(--accent);cursor:pointer;padding:3px 10px;background:rgba(46,196,182,.1);border-radius:100px;transition:background .15s;" onmouseover="this.style.background='rgba(46,196,182,.2)'" onmouseout="this.style.background='rgba(46,196,182,.1)'">Ver todo →</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px;">`;
  items.forEach(it => { h += renderFn(it); });
  h += `</div></div><div style="height:1px;background:var(--border);margin:0 16px;"></div>`;
  return h;
}

async function _runSearch(q){
  const v = q.toLowerCase();

  let drop = document.getElementById('_searchDrop');
  if(!drop){
    drop = document.createElement('div');
    drop.id = '_searchDrop';
    const bar = document.querySelector('.tb-search');
    if(bar){ bar.style.position='relative'; bar.appendChild(drop); }
  }
  drop.style.cssText = 'position:absolute;top:calc(100% + 8px);left:-60px;width:420px;max-width:95vw;background:var(--bg2);border:1px solid var(--border);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.55);z-index:9999;max-height:560px;overflow-y:auto;';
  drop.innerHTML = `<div style="padding:18px 16px;color:var(--muted);font-size:.82rem;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;"><span style="animation:spin 1s linear infinite;display:inline-block;">⏳</span> Buscando <strong style="color:var(--text)">"${esc(q)}"</strong>...</div>`;

  setTimeout(()=>{
    const handler=(e)=>{ if(!drop.contains(e.target)&&e.target.id!=='searchInput'){ _closeSearchDrop(); document.removeEventListener('click',handler); } };
    document.addEventListener('click', handler);
  }, 100);

  try {
    const R = { users:[], posts:[], groups:[], torneos:[], trofeos:[] };

    // Posts en memoria
    R.posts = _posts.filter(p=>{
      const s = [(p.text||''),(p.fish||''),(p.userNick||''),(p.map||''),(p.location||'')].join(' ').toLowerCase();
      return s.includes(v);
    }).slice(0,3);

    // Usuarios - buscar por nickLower con where() para evitar leer toda la coleccion
    try {
      // Busqueda por prefijo: nickLower >= v && nickLower < v + ''
      const uSnap = await getDocs(query(
        collection(db,'users'),
        where('nickLower','>=',v),
        where('nickLower','<=',v+''),
        limit(8)
      ));
      R.users = uSnap.docs.map(d=>({id:d.id,...d.data()})).slice(0,4);
    } catch(e){}

    // Grupos
    try {
      const gSnap = await getDocs(query(collection(db,'groups'), limit(100)));
      R.groups = gSnap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(g=>[(g.name||''),(g.desc||''),(g.cat||'')].join(' ').toLowerCase().includes(v))
        .slice(0,3);
    } catch(e){}

    // Torneos
    try {
      const tSnap = await getDocs(query(collection(db,'torneos'), limit(100)));
      R.torneos = tSnap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(t=>[(t.name||''),(t.desc||'')].join(' ').toLowerCase().includes(v))
        .slice(0,3);
    } catch(e){}

    // Trofeos aprobados
    try {
      const trSnap = await getDocs(query(collection(db,'trofeosPendientes'), where('status','==','approved'), limit(200)));
      R.trofeos = trSnap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(t=>[(t.fish||''),(t.map||''),(t.nick||''),(t.note||t.notes||'')].join(' ').toLowerCase().includes(v))
        .sort((a,b)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0))
        .slice(0,4);
    } catch(e){}

    const total = R.users.length+R.posts.length+R.groups.length+R.torneos.length+R.trofeos.length;

    if(!total){
      drop.innerHTML = `
        <div style="padding:32px 20px;text-align:center;">
          <div style="font-size:2rem;margin-bottom:10px;">🎣</div>
          <div style="font-size:.9rem;font-weight:700;color:var(--text);margin-bottom:4px;">Sin resultados para "${esc(q)}"</div>
          <div style="font-size:.78rem;color:var(--muted);">Intentá con otra palabra clave</div>
        </div>`;
      return;
    }

    let html = `<div style="padding:12px 16px 8px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:.78rem;color:var(--muted);">Resultados de búsqueda · <strong style="color:var(--text)">${total}</strong></span>
      <span onclick="document.getElementById('searchInput').value='';_closeSearchDrop();renderFeed();" style="font-size:1rem;cursor:pointer;color:var(--muted);padding:2px 6px;" title="Cerrar">✕</span>
    </div>`;

    // ── TROFEOS RECIENTES ──
    html += _searchSection('🥇','Trofeos Recientes', R.trofeos, t=>`
      <div onclick="_closeSearchDrop();gp('trofeos-feed');listenTrofeosFeed();setTimeout(()=>{const el=document.getElementById('trofeo_${t.id}');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.outline='2px solid var(--gold)';setTimeout(()=>{if(el)el.style.outline='';},2200);}},650);"
        style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .13s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg3);border:1px solid rgba(255,215,0,.25);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">
          ${t.img?`<img src="${t.img}" style="width:100%;height:100%;object-fit:cover;">`:`🐟`}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:.88rem;font-weight:800;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(t.fish||'Pez sin nombre')}</div>
          <div style="font-size:.75rem;color:var(--gold);font-weight:700;">${t.weight?t.weight+' kg':''} ${t.length?'· '+t.length+' cm':''}</div>
          <div style="font-size:.72rem;color:var(--muted);">👤 ${esc(t.nick||'')}${t.map?' · 📍'+esc(t.map):''}</div>
        </div>
        <span style="font-size:.65rem;background:rgba(255,215,0,.12);color:var(--gold);padding:2px 7px;border-radius:100px;white-space:nowrap;flex-shrink:0;">Trofeo</span>
      </div>`, `_closeSearchDrop();gp('trofeos-feed');listenTrofeosFeed();`);

    // ── PERSONAS ──
    html += _searchSection('👤','Personas', R.users, u=>`
      <div onclick="_closeSearchDrop();openUserProfile('${u.id}','${(u.nick||'').replace(/'/g,"\\'").replace(/"/g,'\\"')}');"
        style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .13s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <div style="position:relative;flex-shrink:0;">
          <img src="${u.av||getDefaultAv(u.gender||'')}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border);">
          ${u.verified?`<span style="position:absolute;bottom:-2px;right:-2px;font-size:.7rem;">✅</span>`:''}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:.88rem;font-weight:800;color:var(--text);">${esc(u.nick||'')} ${getCountryFlag(u.country)||''}</div>
          <div style="font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.bio?esc(u.bio.slice(0,55)):esc(u.email||'')}</div>
        </div>
        <span style="font-size:.65rem;background:rgba(46,196,182,.1);color:var(--accent);padding:2px 7px;border-radius:100px;white-space:nowrap;flex-shrink:0;">Perfil</span>
      </div>`, `_closeSearchDrop();gp('amigos');`);

    // ── PUBLICACIONES ──
    html += _searchSection('📝','Publicaciones', R.posts, p=>{
      const thumb = (p.images&&p.images[0])||p.image||'';
      const preview = (p.text||'').slice(0,72)+(p.text&&p.text.length>72?'…':'');
      return `
      <div onclick="_closeSearchDrop();gp('home');setTimeout(()=>{const el=document.querySelector('[data-pid=\\'${p.id}\\']');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.outline='2px solid var(--accent)';setTimeout(()=>{if(el)el.style.outline='';},2000);}},400);"
        style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .13s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">
          ${thumb?`<img src="${thumb}" style="width:100%;height:100%;object-fit:cover;">`:`📝`}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:.82rem;font-weight:700;color:var(--text);">${esc(p.userNick||'')}${p.fish?' · 🐟 '+esc(p.fish):''}</div>
          <div style="font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(preview)||'(sin texto)'}</div>
        </div>
        <span style="font-size:.65rem;background:rgba(139,148,158,.12);color:var(--muted);padding:2px 7px;border-radius:100px;white-space:nowrap;flex-shrink:0;">Post</span>
      </div>`;
    }, `_closeSearchDrop();gp('home');`);

    // ── GRUPOS ──
    html += _searchSection('🎣','Grupos', R.groups, g=>`
      <div onclick="_closeSearchDrop();gp('grupos');"
        style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .13s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
          ${g.img?`<img src="${g.img}" style="width:100%;height:100%;object-fit:cover;">`:`🎣`}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:.88rem;font-weight:800;color:var(--text);">${esc(g.name||'')}</div>
          <div style="font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.memberCount?g.memberCount+' miembros · ':''} ${esc((g.desc||'').slice(0,50))}</div>
        </div>
        <span style="font-size:.65rem;background:rgba(46,196,182,.1);color:var(--accent);padding:2px 7px;border-radius:100px;flex-shrink:0;">Grupo</span>
      </div>`, `_closeSearchDrop();gp('grupos');`);

    // ── TORNEOS ──
    html += _searchSection('🏆','Torneos', R.torneos, t=>`
      <div onclick="_closeSearchDrop();gp('torneos');"
        style="display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .13s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <div style="width:48px;height:48px;border-radius:8px;overflow:hidden;flex-shrink:0;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
          ${t.images&&t.images[0]?`<img src="${t.images[0]}" style="width:100%;height:100%;object-fit:cover;">`:`🏆`}
        </div>
        <div style="min-width:0;flex:1;">
          <div style="font-size:.88rem;font-weight:800;color:var(--text);">${esc(t.name||'')}</div>
          <div style="font-size:.72rem;color:var(--muted);">${esc((t.desc||'').slice(0,55))}</div>
        </div>
        <span style="font-size:.65rem;background:rgba(255,215,0,.1);color:var(--gold);padding:2px 7px;border-radius:100px;flex-shrink:0;">Torneo</span>
      </div>`, `_closeSearchDrop();gp('torneos');`);

    drop.innerHTML = html;
  } catch(e){
    drop.innerHTML = `<div style="padding:20px;color:var(--red);font-size:.82rem;text-align:center;">⚠️ Error al buscar: ${e.message}</div>`;
  }
}
window._closeSearchDrop = _closeSearchDrop;

// ===== SHARE =====

// ===== LIGHTBOX =====
// ===== GALERÍA ESTILO INSTAGRAM =====
let _galImages = [];
let _galIdx = 0;
let _galPostId = null;
let _galUnsub = null;

function openImgLightboxById(postId, startIdx){
  var imgs = (window._postImgsMap && window._postImgsMap[postId]) || [];
  // Also check _posts array in memory
  if(!imgs.length){
    var fromMem = (_posts||[]).find(function(p){return p.id===postId;});
    if(fromMem && fromMem.images && fromMem.images.length) imgs = fromMem.images;
  }
  if(imgs.length){
    if(window._postImgsMap) window._postImgsMap[postId] = imgs;
    openImgLightbox(imgs[startIdx] || imgs[0], imgs, postId);
    return;
  }
  // Fallback: fetch from Firestore for old posts not in memory
  getDoc(doc(db,'posts',postId)).then(function(snap){
    if(!snap.exists()) return;
    var data = snap.data();
    var fetched = data.images || (data.image ? [data.image] : []);
    if(!fetched.length) return;
    if(window._postImgsMap) window._postImgsMap[postId] = fetched;
    openImgLightbox(fetched[startIdx] || fetched[0], fetched, postId);
  }).catch(function(){});
}
window.openImgLightboxById = openImgLightboxById;

// ===== DEFAULT AVATAR BY GENDER =====
function getDefaultAv(gender){
  const isFem = gender === 'Femenino';
  const col = isFem ? '#e06ba8' : '#2ec4b6';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#21262d"/><circle cx="20" cy="15" r="8" fill="${col}"/><ellipse cx="20" cy="38" rx="13" ry="10" fill="${col}"/></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}
function userAv(av, gender){
  return av || getDefaultAv(gender);
}
window.getDefaultAv = getDefaultAv;
window.userAv = userAv;

// ── Handler global: si una imagen de avatar falla, mostrar avatar por defecto ──
document.addEventListener('error', function(e){
  const img = e.target;
  if(img.tagName !== 'IMG') return;
  // Si ya es el fallback, no volver a intentar (evitar loop)
  if(img.dataset.fbErr) return;
  img.dataset.fbErr = '1';
  // Detectar si es una imagen de avatar (dentro de sl-av, post-av, profile-av-big, upAv, comment-item, navAv, etc.)
  const isAv = img.closest('.sl-av,.post-av,.profile-av-big,#upAv,#profAvBig,.comment-item,#navAv,[class*="-av"]');
  if(isAv){
    img.src = getDefaultAv();
    img.style.opacity = '0.5';
  }
}, true);

// ===== USER INFO CACHE (para comentarios sin nick/av) =====
window._userInfoCache = {};
window._userInfoPending = {};

async function _fetchUserInfo(uid){
  if(!uid) return null;
  if(window._userInfoCache[uid]) return window._userInfoCache[uid];
  if(window._userInfoPending[uid]) return window._userInfoPending[uid];
  window._userInfoPending[uid] = getDoc(doc(db,'users',uid)).then(snap=>{
    if(snap.exists()){
      const d = snap.data();
      window._userInfoCache[uid] = {nick: d.nick||'?', av: d.av||'', gender: d.gender||''};
    } else {
      window._userInfoCache[uid] = {nick:'?', av:'', gender:''};
    }
    delete window._userInfoPending[uid];
    return window._userInfoCache[uid];
  }).catch(()=>{ delete window._userInfoPending[uid]; return null; });
  return window._userInfoPending[uid];
}

// Enriquece comentarios sin nick/av desde Firebase y re-renderiza si hace falta
async function _enrichComments(pid, comments, rerenderFn){
  const missing = comments.filter(c => c.userId && (!c.nick || c.nick === '?' || !c.av));
  if(!missing.length) return;
  // Pre-populate from friends list
  const friends = window.CU?.friendsList || [];
  friends.forEach(f=>{ if(f.id && !window._userInfoCache[f.id]) window._userInfoCache[f.id]={nick:f.nick||'',av:f.av||'',gender:f.gender||''}; });
  // Also add own user
  if(window.CU) window._userInfoCache[window.CU.id]={nick:window.CU.nick||'',av:window.CU.av||'',gender:window.CU.gender||''};

  const uids = [...new Set(missing.map(c=>c.userId).filter(Boolean))];
  await Promise.all(uids.map(uid => _fetchUserInfo(uid)));
  let changed = false;
  comments.forEach(c=>{
    if(c.userId){
      const info = window._userInfoCache[c.userId];
      if(info){
        if(!c.nick || c.nick==='?'){ c.nick = info.nick; changed=true; }
        if(!c.av){ c.av = info.av; changed=true; }
        if(!c.gender){ c.gender = info.gender; }
      }
    }
  });
  if(changed && rerenderFn) rerenderFn();
}


function openImgLightbox(src, allImgs, postId){
  _galImages = Array.isArray(allImgs) && allImgs.length ? allImgs : (src ? [src] : []);
  _galIdx = _galImages.indexOf(src);
  if(_galIdx < 0) _galIdx = 0;
  // Auto-resolve postId from global profile image map if not provided
  if(!postId && src && window._upImgPostMap && window._upImgPostMap[src]){
    postId = window._upImgPostMap[src];
  }
  _galPostId = postId || null;

  const old = document.getElementById('_igModal');
  if(old){ old.remove(); if(_galUnsub){_galUnsub();_galUnsub=null;} }

  const post = _galPostId ? (_posts||[]).find(p=>p.id===_galPostId) : null;
  const cu = window.CU;
  const avHtml = cu ? `<img src="${cu.av||getDefaultAv(cu.gender||'')}" style="width:100%;height:100%;object-fit:cover;" onerror="if(!this.dataset.e){this.dataset.e=1;this.src=getDefaultAv();}">` : '';
  const postAvHtml = post ? `<img src="${post.userAv||getDefaultAv()}" style="width:100%;height:100%;object-fit:cover;" onerror="if(!this.dataset.e){this.dataset.e=1;this.src=getDefaultAv();}">` : '';
  const RXNS = [{e:'👍',l:'Me gusta'},{e:'❤️',l:'Me encanta'},{e:'😂',l:'Me divierte'},{e:'😮',l:'Me asombra'},{e:'😢',l:'Me entristece'},{e:'😡',l:'Me enoja'},{e:'🎣',l:'Pescador'}];

  const modal = document.createElement('div');
  modal.id = '_igModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99000;background:#000;display:flex;flex-direction:column;animation:_igFadeIn .15s ease;';

  modal.innerHTML = `
  <style>
    @keyframes _igFadeIn{from{opacity:0}to{opacity:1}}
    #_igComments::-webkit-scrollbar{width:5px;}
    #_igComments::-webkit-scrollbar-thumb{background:#444;border-radius:4px;}
    .ig-act-btn{flex:1;background:none;border:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 4px;border-radius:8px;cursor:pointer;font-size:.88rem;font-weight:700;color:#8b949e;transition:background .15s;}
    .ig-act-btn:hover{background:#1c2128;}
    #_igRxnPop{display:none;position:fixed;background:#1c2128;border:1px solid #30363d;border-radius:100px;padding:8px 10px;flex-direction:row;align-items:center;gap:3px;box-shadow:0 8px 28px rgba(0,0,0,.7);white-space:nowrap;z-index:999999;}
    #_igGifPicker{display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:320px;max-height:320px;background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;z-index:999999;box-shadow:0 8px 32px rgba(0,0,0,.6);}
    @media(max-width:768px){
      #_igMainRow{flex-direction:column!important;}
      #_igSidebar{width:100%!important;max-height:45vh!important;border-left:none!important;border-top:1px solid #3e4042!important;}
      #_igImgCol{flex:none!important;height:55vh!important;}
    }
  </style>

  <!-- REACTION POPUP (fixed, fuera del overflow) -->
  <div id="_igRxnPop"
    onmouseenter="this.style.display='flex'" onmouseleave="this.style.display='none'">
    ${RXNS.map(r=>`<button onclick="igReact('${r.e}');document.getElementById('_igRxnPop').style.display='none'" title="${r.l}"
      style="background:none;border:none;font-size:1.6rem;cursor:pointer;padding:4px;border-radius:50%;transition:transform .12s;"
      onmouseover="this.style.transform='scale(1.5) translateY(-5px)'" onmouseout="this.style.transform='scale(1)'">${r.e}</button>`).join('')}
  </div>

  <!-- GIF PICKER (fixed) -->
  <div id="_igGifPicker">
    <div style="padding:8px;border-bottom:1px solid #30363d;display:flex;gap:6px;align-items:center;">
      <input id="_igGifSearch" placeholder="Buscar GIF..." style="flex:1;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:6px 10px;color:#e6edf3;font-size:.82rem;font-family:'Exo 2',sans-serif;outline:none;"
        oninput="igSearchGif(this.value)">
      <button onclick="document.getElementById('_igGifPicker').style.display='none'" style="background:none;border:none;color:#8b949e;font-size:1.1rem;cursor:pointer;">✕</button>
    </div>
    <div id="_igGifGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:6px;overflow-y:auto;max-height:260px;"></div>
  </div>

  <!-- TOP BAR -->
  <div style="display:flex;align-items:center;padding:8px 12px;flex-shrink:0;background:#242526;border-bottom:1px solid #3e4042;">
    <button onclick="document.getElementById('_igModal').remove();if(window._galUnsub){window._galUnsub();window._galUnsub=null;}"
      style="background:rgba(255,255,255,.12);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">✕</button>
    ${post ? `
    <div style="display:flex;align-items:center;gap:10px;flex:1;">
      <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:#3e4042;flex-shrink:0;">${postAvHtml}</div>
      <div>
        <div style="font-weight:700;font-size:.92rem;color:#e4e6eb;">${esc(post.userNick||'')}</div>
        <div style="font-size:.72rem;color:#b0b3b8;">${post.time?fmtT(post.time):''}</div>
      </div>
    </div>` : `<div style="flex:1;color:#e4e6eb;font-weight:700;">Foto</div>`}
    <div style="display:flex;gap:6px;margin-left:auto;">
      ${_galPostId?`<button onclick="igDownload()" title="Descargar" style="background:rgba(255,255,255,.12);border:none;color:#e4e6eb;width:36px;height:36px;border-radius:50%;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">⬇️</button>`:''}
      ${_galPostId&&window.CU?`<button onclick="igReport()" title="Reportar" style="background:rgba(255,255,255,.12);border:none;color:#e4e6eb;width:36px;height:36px;border-radius:50%;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">⚠️</button>`:''}
      <button id="_igLeerEquipoBtn" onclick="window.leerEquipoLightbox()" title="Leer equipo con IA" style="background:rgba(46,196,182,.2);border:1px solid rgba(46,196,182,.5);color:#2ec4b6;padding:4px 12px;border-radius:100px;font-size:.78rem;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:4px;">🔍 Leer equipo</button>
    </div>
  </div>

  <!-- MAIN -->
  <div id="_igMainRow" style="display:flex;flex:1;min-height:0;">

    <!-- IMAGE -->
    <div id="_igImgCol" style="flex:1;min-width:0;background:#000;display:flex;align-items:center;justify-content:center;position:relative;">
      <img id="_igImg" src="${_galImages[_galIdx]||''}" crossorigin="anonymous" style="max-width:100%;max-height:100%;object-fit:contain;display:block;user-select:none;transition:opacity .12s;" oncontextmenu="rf4ContextMenu(event)">
      <canvas id="_rf4SelectCanvas" style="position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;display:none;z-index:10;"></canvas>
      <button id="_rf4SelectBtn" onclick="rf4ToggleSelect()" title="Marcar zona para traducir" style="position:absolute;top:10px;left:10px;z-index:20;background:rgba(46,196,182,.85);border:none;color:#0d1117;padding:6px 12px;border-radius:100px;font-size:.75rem;font-weight:800;cursor:pointer;font-family:Exo 2,sans-serif;display:flex;align-items:center;gap:5px;">✂️ Marcar zona</button>
      <div id="_rf4TranslatePopup" style="display:none;position:absolute;z-index:30;background:#161b22;border:1px solid rgba(46,196,182,.5);border-radius:10px;padding:6px;box-shadow:0 4px 20px rgba(0,0,0,.7);">
        <button onclick="rf4TranslateSelection()" style="background:linear-gradient(135deg,#2ec4b6,#1a8a82);border:none;color:#0d1117;padding:7px 14px;border-radius:8px;font-size:.78rem;font-weight:800;cursor:pointer;font-family:Exo 2,sans-serif;">🔍 Traducir selección</button>
        <button onclick="rf4CancelSelect()" style="background:none;border:none;color:#8b949e;padding:7px 8px;cursor:pointer;font-size:.8rem;">✕</button>
      </div>
      ${_galImages.length>1?`
        <button onclick="igNav(-1)" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">‹</button>
        <button onclick="igNav(1)"  style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">›</button>
        <div id="_igCounter" style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;font-size:.78rem;font-weight:700;padding:3px 10px;border-radius:100px;">${_galIdx+1} / ${_galImages.length}</div>
        <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:5px;" id="_igDots">
          ${_galImages.map((_,i)=>`<div onclick="igNavTo(${i})" style="width:7px;height:7px;border-radius:50%;cursor:pointer;background:${i===_galIdx?'#fff':'rgba(255,255,255,.35)'};transition:background .2s;"></div>`).join('')}
        </div>
      `:''}
    </div>

    <!-- SIDEBAR -->
    <div id="_igSidebar" style="width:340px;flex-shrink:0;display:flex;flex-direction:column;background:#161b22;border-left:1px solid #3e4042;max-height:100%;overflow:hidden;">

      <!-- Reactions bar -->
      <div style="padding:10px 14px 0;flex-shrink:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #30363d;">
          <div id="_igRxnSummary" style="display:flex;align-items:center;gap:4px;font-size:.82rem;color:#8b949e;"></div>
          <div id="_igCmtCount" style="font-size:.82rem;color:#8b949e;cursor:pointer;" onclick="document.getElementById('_igComments').scrollTop=99999"></div>
        </div>
        <!-- Action buttons -->
        <div style="display:flex;border-bottom:1px solid #30363d;padding:2px 0;gap:2px;">
          <!-- Me gusta con popup FIXED -->
          <div style="position:relative;flex:1;">
            <button class="ig-act-btn" id="_igMyRxnBtn" onclick="igReact('👍')"
              onmouseenter="igShowRxnPop(this)" onmouseleave="igHideRxnPop()">
              <span id="_igMyRxnIcon">👍</span> <span id="_igMyRxnLabel">Me gusta</span>
            </button>
          </div>
          <button class="ig-act-btn" onclick="document.getElementById('_igCmtInp').focus()">💬 Comentar</button>
          <button class="ig-act-btn" id="_igLeerEquipoBtn2" onclick="window.leerEquipoLightbox()" style="color:#2ec4b6;font-weight:800;" title="La IA lee el equipo de la imagen">🔍 Leer equipo</button>
          ${_galPostId?`<button class="ig-act-btn" onclick="igShare()">↗ Compartir</button>`:''}
          ${_galPostId?`<button class="ig-act-btn" onclick="(function(){var u=encodeURIComponent(location.origin+location.pathname+'?p='+_galPostId);window.open('https://www.facebook.com/sharer/sharer.php?u='+u,'_blank','width=640,height=460,resizable=yes');})()" style="color:#1877F2;gap:5px;"><svg viewBox='0 0 24 24' width='15' height='15' fill='#1877F2'><path d='M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z'/></svg> Facebook</button>`:''}
        </div>
      </div>

      <!-- Comments -->
      <div id="_igComments" style="flex:1;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px;">
        <div style="text-align:center;padding:20px;color:#8b949e;font-size:.82rem;">Cargando...</div>
      </div>

      <!-- Comment input -->
      <div style="padding:8px 12px 10px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;border-top:1px solid #30363d;position:relative;">
        <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#21262d;flex-shrink:0;">${avHtml}</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
          <!-- Sticker picker del lightbox -->
          <div id="_igStkPick" class="stk-picker" style="bottom:70px;left:50px;right:12px;top:auto;">
            <div style="display:flex;align-items:center;padding:7px 10px;border-bottom:1px solid #30363d;gap:6px;">
              <input id="_igStkSearch" class="stk-search" placeholder="🔍 Buscar sticker..."
                oninput="igSearchSticker(this.value)" style="flex:1;">
              <button onclick="document.getElementById('_igStkPick').classList.remove('open')" style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;">✕</button>
            </div>
            <div class="stk-cats" id="_igStkCats"></div>
            <div id="_igStkContent"></div>
          </div>
          <div style="display:flex;align-items:center;background:#0d1117;border-radius:20px;border:1px solid #30363d;">
            <button onclick="igToggleGifPicker()" title="GIF" style="background:none;border:none;color:#8b949e;font-size:.75rem;font-weight:800;cursor:pointer;padding:6px 8px;border-radius:20px 0 0 20px;transition:color .15s;flex-shrink:0;" onmouseover="this.style.color='#2ec4b6'" onmouseout="this.style.color='#8b949e'">GIF</button>
            <button onclick="igToggleStkPicker()" title="Stickers" style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;padding:4px 6px;transition:color .15s;flex-shrink:0;" onmouseover="this.style.color='#2ec4b6'" onmouseout="this.style.color='#8b949e'">🎭</button>
            <input id="_igCmtInp" placeholder="Escribe un comentario..."
              style="flex:1;background:transparent;border:none;padding:9px 8px;color:#e6edf3;font-size:.88rem;font-family:'Exo 2',sans-serif;outline:none;"
              onkeypress="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();igSubmitComment();}">
            <button onclick="igSubmitComment()" style="background:none;border:none;color:#1877f2;font-size:1rem;cursor:pointer;padding:4px 10px;opacity:.6;transition:opacity .15s;flex-shrink:0;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.6'">➤</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  // Close on backdrop click
  modal.addEventListener('click', e=>{ if(e.target===modal){ modal.remove(); if(_galUnsub){_galUnsub();_galUnsub=null;} } });
  // Keyboard nav
  const _kh = e=>{
    if(e.key==='Escape'){ modal.remove(); if(_galUnsub){_galUnsub();_galUnsub=null;} }
    if(e.key==='ArrowRight') igNav(1);
    if(e.key==='ArrowLeft')  igNav(-1);
  };
  document.addEventListener('keydown', _kh);
  modal._kh = _kh;
  // Touch swipe
  let _tsX=null;
  modal.addEventListener('touchstart',e=>{_tsX=e.touches[0].clientX;},{passive:true});
  modal.addEventListener('touchend',e=>{
    if(_tsX===null) return;
    const dx=e.changedTouches[0].clientX-_tsX;
    if(Math.abs(dx)>40) igNav(dx<0?1:-1);
    _tsX=null;
  });

  document.body.appendChild(modal);

  // ── ZOOM con scroll + pinch (touch) ──
  (function(){
    var imgEl = document.getElementById('_igImg');
    var imgCol = document.getElementById('_igImgCol');
    if(!imgEl || !imgCol) return;

    var scale = 1, posX = 0, posY = 0;
    var isDragging = false, dragStartX = 0, dragStartY = 0, dragOriginX = 0, dragOriginY = 0;

    function applyTransform(){
      imgEl.style.transform = 'translate('+posX+'px,'+posY+'px) scale('+scale+')';
      imgEl.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
    }

    function clampPos(){
      if(scale <= 1){ posX = 0; posY = 0; return; }
      var cw = imgCol.clientWidth, ch = imgCol.clientHeight;
      var iw = imgEl.naturalWidth || imgEl.clientWidth;
      var ih = imgEl.naturalHeight || imgEl.clientHeight;
      // Calcular tamaño renderizado de la imagen
      var rendW = Math.min(iw, cw), rendH = Math.min(ih, ch);
      var maxX = Math.max(0, (rendW * scale - cw) / 2);
      var maxY = Math.max(0, (rendH * scale - ch) / 2);
      posX = Math.max(-maxX, Math.min(maxX, posX));
      posY = Math.max(-maxY, Math.min(maxY, posY));
    }

    // Zoom con rueda del mouse
    imgCol.addEventListener('wheel', function(e){
      e.preventDefault();
      var delta = e.deltaY < 0 ? 0.15 : -0.15;
      scale = Math.min(5, Math.max(1, scale + delta));
      if(scale === 1){ posX = 0; posY = 0; }
      clampPos();
      applyTransform();
    }, { passive: false });

    // Drag para mover imagen con zoom
    imgEl.addEventListener('mousedown', function(e){
      if(scale <= 1) return;
      e.preventDefault();
      isDragging = true;
      dragStartX = e.clientX; dragStartY = e.clientY;
      dragOriginX = posX; dragOriginY = posY;
      applyTransform();
    });
    document.addEventListener('mousemove', function(e){
      if(!isDragging) return;
      posX = dragOriginX + (e.clientX - dragStartX);
      posY = dragOriginY + (e.clientY - dragStartY);
      clampPos();
      applyTransform();
    });
    document.addEventListener('mouseup', function(){
      if(isDragging){ isDragging = false; applyTransform(); }
    });

    // Doble clic para toggle zoom
    imgEl.addEventListener('dblclick', function(e){
      if(scale > 1){ scale = 1; posX = 0; posY = 0; }
      else { scale = 2.5; }
      applyTransform();
    });

    // Pinch zoom en mobile
    var _pinchDist = null;
    var _pinchScale = 1;
    imgCol.addEventListener('touchstart', function(e){
      if(e.touches.length === 2){
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        _pinchDist = Math.sqrt(dx*dx + dy*dy);
        _pinchScale = scale;
        e.preventDefault();
      }
    }, { passive: false });
    imgCol.addEventListener('touchmove', function(e){
      if(e.touches.length === 2 && _pinchDist){
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var newDist = Math.sqrt(dx*dx + dy*dy);
        scale = Math.min(5, Math.max(1, _pinchScale * (newDist / _pinchDist)));
        if(scale === 1){ posX = 0; posY = 0; }
        clampPos();
        applyTransform();
        e.preventDefault();
      }
    }, { passive: false });
    imgCol.addEventListener('touchend', function(e){
      if(e.touches.length < 2) _pinchDist = null;
    });

    // Reset zoom al cambiar de imagen
    var origNavTo = window.igNavTo;
    window.igNavTo = function(i){
      scale = 1; posX = 0; posY = 0;
      if(origNavTo) origNavTo(i);
      setTimeout(function(){
        imgEl = document.getElementById('_igImg');
        if(imgEl){ imgEl.style.transform = ''; imgEl.style.cursor = 'default'; }
      }, 80);
    };

    // Mostrar hint de zoom
    var hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;bottom:54px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#fff;font-size:.7rem;padding:4px 12px;border-radius:100px;pointer-events:none;opacity:1;transition:opacity 1s;z-index:10;white-space:nowrap;';
    hint.textContent = '🔍 Scroll o pellizca para hacer zoom · Doble clic para zoom rápido';
    imgCol.appendChild(hint);
    setTimeout(function(){ hint.style.opacity = '0'; }, 2800);
    setTimeout(function(){ if(hint.parentNode) hint.parentNode.removeChild(hint); }, 4000);

    imgEl.style.transformOrigin = 'center center';
    imgEl.style.transition = 'transform .08s ease';
  })();

  if(_galPostId){
    igLoadPostData(_galPostId, _galIdx);
  } else {
    document.getElementById('_igComments').innerHTML='<div style="text-align:center;padding:28px;color:#8b949e;font-size:.82rem;">Sin comentarios</div>';
  }
}

function igNav(dir){
  _galIdx = (_galIdx + dir + _galImages.length) % _galImages.length;
  igNavTo(_galIdx);
}
function igNavTo(i){
  _galIdx = i;
  const img = document.getElementById('_igImg');
  if(img) img.crossOrigin = 'anonymous';
  if(img){ img.style.opacity='0'; setTimeout(()=>{ img.src=_galImages[i]; img.style.opacity='1'; },110); }
  document.querySelectorAll('#_igDots div').forEach((d,j)=>{ d.style.background=j===i?'#fff':'rgba(255,255,255,.35)'; });
  const counter = document.getElementById('_igCounter');
  if(counter) counter.textContent=(i+1)+' / '+_galImages.length;
  // Reload reactions/comments for this specific image index
  if(_galPostId) igLoadPostData(_galPostId, i);
}

// Load post data - reactions and comments scoped to image index
async function igLoadPostData(pid, imgIdx){
  if(_galUnsub){ _galUnsub(); _galUnsub=null; }
  const isTrofeo = pid.startsWith('trofeo_');
  const realId = isTrofeo ? pid.replace('trofeo_','') : pid;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';
  const pRef = doc(db, colName, realId);
  _galUnsub = onSnapshot(pRef, snap=>{
    if(!snap.exists()) return;
    const p = {id:pid,...snap.data()};
    // Update local cache
    const cached = (_posts||[]).find(x=>x.id===pid);
    if(cached){ Object.assign(cached, p); } else { (_posts||[]).push(p); }
    // Reactions: scoped per image if multiple images, else use post-level
    const hasMultiple = _galImages.length > 1;
    const rxns   = hasMultiple ? (p[`imgReactions_${imgIdx}`]||{}) : (p.reactions||{});
    const counts = hasMultiple ? (p[`imgReactionCounts_${imgIdx}`]||{}) : (p.reactionCounts||{});
    igRenderReactions(rxns, counts);
    igRenderComments(p.comments||[], imgIdx);
  });
}

function igRenderReactions(reactions, counts){
  const cu = window.CU;
  const myRxn = cu ? (reactions[cu.id]||'') : '';
  const total = Object.values(reactions).filter(Boolean).length;
  const myIcon = document.getElementById('_igMyRxnIcon');
  const myLabel = document.getElementById('_igMyRxnLabel');
  const myBtn = document.getElementById('_igMyRxnBtn');
  if(myIcon) myIcon.textContent = myRxn||'👍';
  if(myLabel) myLabel.textContent = myRxn ? 'Me gusta' : 'Me gusta';
  if(myBtn) myBtn.style.color = myRxn ? 'var(--accent)' : '#8b949e';
  const topRxns = Object.entries(counts||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([e])=>e).join('');
  const summary = document.getElementById('_igRxnSummary');
  if(summary) summary.innerHTML = total>0 ? `<span style="font-size:1rem;">${topRxns}</span> <span>${total}</span>` : '';
}

function igRenderComments(comments, imgIdx){
  const el = document.getElementById('_igComments');
  if(!el) return;
  const cmtCount = document.getElementById('_igCmtCount');
  if(cmtCount) cmtCount.textContent = comments.length>0 ? comments.length+' comentario'+(comments.length!==1?'s':'') : '';
  if(!comments.length){
    el.innerHTML='<div style="text-align:center;padding:28px;color:#8b949e;font-size:.82rem;">Sin comentarios. ¡Sé el primero! 🎣</div>';
    return;
  }
  const cu = window.CU;
  const post = _galPostId ? (_posts||[]).find(p=>p.id===_galPostId) : null;
  const RXN = ['👍','❤️','😂','😮','😢','🔥'];

  function buildRow(c, ci){
    const avSrc = c.av||getDefaultAv(c.gender||'');
    const isAuthor = post && post.userId===c.userId;
    const isMine   = cu && c.userId===cu.id;
    const isOwner  = cu && post && post.userId===cu.id;
    const canEdit  = isMine;
    const canDel   = isMine||isOwner;
    const myRxn    = cu ? ((c.userReactions||{})[cu.id]||'') : '';
    const rMap     = c.reactions||{};
    const rTotal   = Object.values(rMap).reduce((a,b)=>a+b,0);
    const rTop     = Object.entries(rMap).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join('');
    const nick     = c.nick||'?';
    const safeN    = nick.replace(/'/g,"\\'");
    const uid      = c.userId||'';
    const menuId   = '_igCmtMenu_'+ci;
    const popId    = '_igCmtRxnPop_'+ci;
    const rxnBtns  = RXN.map(em=>
      `<button onclick="igReactCmt(${ci},'${em}')" title="${em}"
        style="background:none;border:none;font-size:1.2rem;cursor:pointer;padding:3px;border-radius:50%;transition:transform .12s;"
        onmouseover="this.style.transform='scale(1.4) translateY(-4px)'"
        onmouseout="this.style.transform='scale(1)'">${em}</button>`
    ).join('');

    return `<div id="_igCmt_${ci}" style="display:flex;gap:8px;align-items:flex-start;">
      <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#21262d;flex-shrink:0;cursor:pointer;" onclick="openUserProfile('${uid}','${safeN}')">
        <img src="${avSrc}" style="width:100%;height:100%;object-fit:cover;" onerror="if(!this.dataset.e){this.dataset.e=1;this.src=getDefaultAv();}">
      </div>
      <div style="flex:1;min-width:0;">
        <div style="position:relative;display:inline-block;max-width:calc(100% - 34px);">
          <div style="background:#0d1117;border-radius:18px;padding:8px 12px;">
            <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;flex-wrap:wrap;">
              <span style="font-weight:700;font-size:.82rem;color:#e6edf3;cursor:pointer;" onclick="openUserProfile('${uid}','${safeN}')">${esc(nick)}</span>
              ${isAuthor?'<span style="font-size:.62rem;color:var(--accent);font-weight:700;background:rgba(0,198,255,.12);border-radius:4px;padding:1px 5px;">Autor</span>':''}
            </div>
            ${c.gif
              ? `<img src="${c.gif}" style="max-width:200px;border-radius:10px;display:block;margin-top:4px;" loading="lazy">`
              : `<span style="font-size:.88rem;color:#e6edf3;line-height:1.45;word-break:break-word;">${esc(c.text||'')}${c.edited?' <span style="font-size:.62rem;color:#8b949e;">(editado)</span>':''}</span>`
            }
          </div>
          ${(canEdit||canDel||!isMine)?`<div style="position:absolute;top:-2px;right:-30px;">
            <button onclick="const m=document.getElementById('${menuId}');m.style.display=m.style.display==='block'?'none':'block'"
              style="background:rgba(255,255,255,.08);border:none;color:#8b949e;width:24px;height:24px;border-radius:50%;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">⋯</button>
            <div id="${menuId}" style="display:none;position:absolute;right:0;top:28px;background:#161b22;border:1px solid #30363d;border-radius:8px;min-width:130px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.4);overflow:hidden;">
              ${canEdit?`<button onclick="document.getElementById('${menuId}').style.display='none';igEditCmt(${ci})"
                style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#e6edf3;padding:9px 13px;cursor:pointer;font-size:.82rem;font-family:'Exo 2',sans-serif;"
                onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">✏️ Editar</button>`:''}
              ${canDel?`<button onclick="document.getElementById('${menuId}').style.display='none';igDelCmt(${ci})"
                style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#f55;padding:9px 13px;cursor:pointer;font-size:.82rem;font-family:'Exo 2',sans-serif;"
                onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">🗑 Eliminar</button>`:''}
              ${!isMine?`<button onclick="document.getElementById('${menuId}').style.display='none';toast('Comentario reportado ✅','ok')"
                style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#fa0;padding:9px 13px;cursor:pointer;font-size:.82rem;font-family:'Exo 2',sans-serif;"
                onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">⚠️ Reportar</button>`:''}
            </div>
          </div>`:''}
        </div>
        ${rTotal>0?`<div style="display:inline-flex;align-items:center;gap:2px;background:#0d1117;border:1px solid #30363d;border-radius:100px;padding:2px 6px;font-size:.7rem;margin-top:2px;">${rTop} <span style="color:#8b949e;">${rTotal}</span></div>`:''}
        <div style="display:flex;align-items:center;gap:8px;padding:3px 4px 0;flex-wrap:wrap;">
          <span style="font-size:.7rem;color:#8b949e;">${c.time?fmtT(c.time):''}</span>
          <div style="position:relative;">
            <button onclick="igQuickRxnCmt(${ci})"
              style="font-size:.75rem;font-weight:700;color:${myRxn?'var(--accent)':'#8b949e'};background:none;border:none;cursor:pointer;padding:0;transition:color .15s;"
              onmouseenter="document.getElementById('${popId}').style.display='flex'"
              onmouseleave="setTimeout(()=>{const p=document.getElementById('${popId}');if(p&&!p.matches(':hover'))p.style.display='none'},280)">
              ${myRxn?myRxn+' ':''}Me gusta
            </button>
            <div id="${popId}" style="display:none;position:absolute;bottom:calc(100%+4px);left:0;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:5px 7px;flex-direction:row;align-items:center;gap:2px;box-shadow:0 4px 16px rgba(0,0,0,.4);white-space:nowrap;z-index:9999;"
              onmouseenter="this.style.display='flex'" onmouseleave="this.style.display='none'">
              ${rxnBtns}
            </div>
          </div>
          <button onclick="igReplyCmt('${safeN}')"
            style="font-size:.75rem;font-weight:700;color:#8b949e;background:none;border:none;cursor:pointer;padding:0;transition:color .15s;"
            onmouseover="this.style.color='#e6edf3'" onmouseout="this.style.color='#8b949e'">Responder</button>
        </div>
      </div>
    </div>`;
  }

  el.innerHTML = comments.map((c,ci)=>buildRow(c,ci)).join('');
  el.scrollTop = el.scrollHeight;
}

async function igReact(emoji){
  if(!_galPostId){ toast('Sin post asociado','inf'); return; }
  if(!window.CU){ toast('Iniciá sesión para reaccionar','err'); return; }
  const hasMultiple = _galImages.length > 1;
  const isTrofeo = _galPostId.startsWith('trofeo_');
  const realId = isTrofeo ? _galPostId.replace('trofeo_','') : _galPostId;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';
  if(!hasMultiple){
    // Post-level reaction (single image)
    await doReact(_galPostId, emoji);
    return;
  }
  // Per-image reaction
  const idx = _galIdx;
  const rxnField = `imgReactions_${idx}`;
  const cntField = `imgReactionCounts_${idx}`;
  let p = (_posts||[]).find(p=>p.id===_galPostId);
  if(!p){ try{ const s=await getDoc(doc(db, colName, realId)); if(s.exists()){p={id:_galPostId,...s.data()};(_posts||[]).push(p);} }catch(e){return;} }
  const rxns = {...(p[rxnField]||{})};
  const cnts = {...(p[cntField]||{})};
  const prev = rxns[window.CU.id]||'';
  if(prev){ cnts[prev]=Math.max(0,(cnts[prev]||1)-1); }
  if(prev===emoji){ delete rxns[window.CU.id]; }
  else { rxns[window.CU.id]=emoji; cnts[emoji]=(cnts[emoji]||0)+1; }
  p[rxnField]=rxns; p[cntField]=cnts;
  await updateDoc(doc(db, colName, realId),{[rxnField]:rxns,[cntField]:cnts});
}

async function igReactCmt(ci, em){
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  if(!_galPostId) return;
  let p = (_posts||[]).find(p=>p.id===_galPostId);
  if(!p){ try{ const s=await getDoc(doc(db,'posts',_galPostId)); if(s.exists()){p={id:s.id,...s.data()};(_posts||[]).push(p);} }catch(e){return;} }
  const newCmts = [...(p.comments||[])];
  const c = {...(newCmts[ci]||{})};
  const uRxns = {...(c.userReactions||{})};
  const rCounts = {...(c.reactions||{})};
  const prev = uRxns[window.CU.id]||'';
  if(prev){ rCounts[prev]=Math.max(0,(rCounts[prev]||1)-1); }
  if(prev===em){ delete uRxns[window.CU.id]; } else { uRxns[window.CU.id]=em; rCounts[em]=(rCounts[em]||0)+1; }
  c.userReactions=uRxns; c.reactions=rCounts;
  newCmts[ci]=c; p.comments=newCmts;
  await updateDoc(doc(db,'posts',_galPostId),{comments:newCmts});
}

function igQuickRxnCmt(ci){
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  const p = (_posts||[]).find(p=>p.id===_galPostId); if(!p) return;
  const c = (p.comments||[])[ci]; if(!c) return;
  const prev = ((c.userReactions||{})[window.CU.id]||'');
  igReactCmt(ci, prev||'👍');
}

async function igEditCmt(ci){
  if(!window.CU) return;
  const p = (_posts||[]).find(p=>p.id===_galPostId); if(!p) return;
  const c = (p.comments||[])[ci]; if(!c||c.userId!==window.CU.id){ toast('Solo podés editar tus comentarios','err'); return; }
  const newText = prompt('Editar comentario:', c.text||'');
  if(newText===null||!newText.trim()) return;
  const newCmts=[...(p.comments||[])];
  newCmts[ci]={...c,text:newText.trim(),edited:true};
  p.comments=newCmts;
  await updateDoc(doc(db,'posts',_galPostId),{comments:newCmts});
}

async function igDelCmt(ci){
  if(!window.CU) return;
  const p = (_posts||[]).find(p=>p.id===_galPostId); if(!p) return;
  const c = (p.comments||[])[ci]; if(!c) return;
  if(c.userId!==window.CU.id && p.userId!==window.CU.id){ toast('Sin permiso','err'); return; }
  if(!confirm('¿Eliminar este comentario?')) return;
  const newCmts=(p.comments||[]).filter((_,i)=>i!==ci);
  p.comments=newCmts;
  await updateDoc(doc(db,'posts',_galPostId),{comments:newCmts});
}

function igReplyCmt(nick){
  const inp=document.getElementById('_igCmtInp');
  if(inp){ inp.value='@'+nick+' '; inp.focus(); }
}

async function igSubmitComment(){
  if(!_galPostId) return;
  if(!window.CU){ toast('Iniciá sesión para comentar','err'); return; }
  const inp=document.getElementById('_igCmtInp');
  const txt=inp?inp.value.trim():'';
  if(!txt) return;
  const isTrofeo = _galPostId.startsWith('trofeo_');
  const realId = isTrofeo ? _galPostId.replace('trofeo_','') : _galPostId;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';
  let p=(_posts||[]).find(p=>p.id===_galPostId);
  if(!p){ try{ const s=await getDoc(doc(db, colName, realId)); if(s.exists()){p={id:_galPostId,...s.data()};(_posts||[]).push(p);} }catch(e){} }
  if(!p){ toast('No se pudo cargar el post','err'); return; }
  const nc=[...(p.comments||[]),{userId:window.CU.id,nick:window.CU.nick,av:window.CU.av||'',gender:window.CU.gender||'',text:txt,time:Date.now()}];
  p.comments=nc;
  await updateDoc(doc(db, colName, realId),{comments:nc});
  if(p.userId&&p.userId!==window.CU.id) sendNotifToUserWithPost(p.userId,`💬 ${window.CU.nick} comentó tu foto: "${txt.slice(0,40)}"`,_galPostId);
  if(inp) inp.value='';
}

async function igShare(){
  if(!_galPostId){ toast('Sin post para compartir','inf'); return; }
  await sharePost(_galPostId);
}
function igDownload(){
  const src=_galImages[_galIdx];
  const a=document.createElement('a');
  a.href=src; a.download='foto_rf4latam.jpg'; a.target='_blank';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function igReport(){
  if(!_galPostId){ toast('Sin post para reportar','inf'); return; }
  const post = (_posts||[]).find(p=>p.id===_galPostId);
  const nick = post?.userNick || '';
  document.getElementById('_igModal')?.remove();
  if(window._galUnsub){ window._galUnsub(); window._galUnsub=null; }
  reportPost(_galPostId, nick);
}
// ── Reaction popup posicionado con fixed (evita overflow:hidden del sidebar) ──
let _igRxnPopTimer = null;
function igShowRxnPop(btn){
  clearTimeout(_igRxnPopTimer);
  const pop = document.getElementById('_igRxnPop');
  if(!pop) return;
  const r = btn.getBoundingClientRect();
  pop.style.left = r.left + 'px';
  pop.style.top = (r.top - 72) + 'px';
  pop.style.display = 'flex';
}
function igHideRxnPop(){
  _igRxnPopTimer = setTimeout(()=>{
    const pop = document.getElementById('_igRxnPop');
    if(pop && !pop.matches(':hover')) pop.style.display = 'none';
  }, 300);
}

// ── GIF picker en lightbox ──
let _igGifDebounce = null;
function igToggleGifPicker(){
  const p = document.getElementById('_igGifPicker');
  if(!p) return;
  if(p.style.display === 'flex'){
    p.style.display = 'none';
    return;
  }
  // Posicionar sobre el input
  const inp = document.getElementById('_igCmtInp');
  if(inp){
    const r = inp.getBoundingClientRect();
    p.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    p.style.left = Math.max(8, r.left - 40) + 'px';
    p.style.transform = 'none';
  }
  p.style.display = 'flex';
  p.style.flexDirection = 'column';
  igSearchGif('');
  setTimeout(()=>{ const s=document.getElementById('_igGifSearch'); if(s) s.focus(); },50);
}

async function igSearchGif(q){
  clearTimeout(_igGifDebounce);
  _igGifDebounce = setTimeout(async ()=>{
    const grid = document.getElementById('_igGifGrid');
    if(!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;font-size:.8rem;">⏳ Buscando...</div>';
    try {
      const query = q.trim() || 'fishing';
      const url = `https://api.tenor.com/v2/search?q=${encodeURIComponent(query)}&key=AIzaSyAyimkuYQYF_FXVALexPmHA5a7li72Bkr0&limit=15&media_filter=gif`;
      const r = await fetch(url);
      const data = await r.json();
      const results = data.results || [];
      if(!results.length){ grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;font-size:.8rem;">Sin resultados</div>'; return; }
      window._igGifs = results.map(g=> g.media_formats?.gif?.url || g.media_formats?.tinygif?.url || '').filter(Boolean);
      grid.innerHTML = window._igGifs.map((url,i)=>
        `<img src="${url}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer;border-radius:4px;transition:opacity .15s;"
          onclick="igSendGifComment(window._igGifs[${i}])"
          onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'"
          loading="lazy">`
      ).join('');
    } catch(e){
      const grid2 = document.getElementById('_igGifGrid');
      if(grid2) grid2.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:16px;color:#f55;font-size:.8rem;">Error cargando GIFs</div>';
    }
  }, q ? 500 : 0);
}

async function igSendGifComment(gifUrl){
  if(!_galPostId){ toast('Sin post asociado','inf'); return; }
  if(!window.CU){ toast('Iniciá sesión para comentar','err'); return; }
  document.getElementById('_igGifPicker').style.display='none';
  const isTrofeo = _galPostId.startsWith('trofeo_');
  const realId = isTrofeo ? _galPostId.replace('trofeo_','') : _galPostId;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';
  let p = (_posts||[]).find(p=>p.id===_galPostId);
  if(!p){ try{ const s=await getDoc(doc(db, colName, realId)); if(s.exists()){p={id:_galPostId,...s.data()};(_posts||[]).push(p);} }catch(e){} }
  if(!p){ toast('No se pudo cargar el post','err'); return; }
  const nc = [...(p.comments||[]), {userId:window.CU.id, nick:window.CU.nick, av:window.CU.av||'', gender:window.CU.gender||'', gif:gifUrl, text:'', time:Date.now()}];
  p.comments = nc;
  await updateDoc(doc(db, colName, realId), {comments:nc});
}

window.igShowRxnPop=igShowRxnPop; window.igHideRxnPop=igHideRxnPop;
window.igToggleGifPicker=igToggleGifPicker; window.igSearchGif=igSearchGif; window.igSendGifComment=igSendGifComment;

// ── Sticker picker del lightbox ──
function igToggleStkPicker(){
  const p = document.getElementById('_igStkPick');
  if(!p) return;
  // Cerrar GIF picker si está abierto
  const gp = document.getElementById('_igGifPicker');
  if(gp) gp.style.display='none';
  const isOpen = p.classList.contains('open');
  if(isOpen){ p.classList.remove('open'); return; }
  p.classList.add('open');
  // Renderizar categorías si no están
  const catsEl = document.getElementById('_igStkCats');
  if(catsEl && !catsEl.children.length){
    catsEl.innerHTML = '';
    STK_CATS.forEach(c=>{
      const btn = document.createElement('button');
      btn.className = 'stk-cat-btn';
      btn.style.background = c.color;
      btn.innerHTML = '<span style="font-size:1.3rem;">'+c.emoji+'</span>'+c.label;
      btn.addEventListener('click', ()=>igLoadStkCat(c.q, c.label));
      catsEl.appendChild(btn);
    });
  }
  setTimeout(()=>{ const s=document.getElementById('_igStkSearch'); if(s) s.focus(); },100);
}

async function igLoadStkCat(query, label){
  const contentEl = document.getElementById('_igStkContent');
  if(!contentEl) return;
  contentEl.innerHTML = '';
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;padding:4px 8px;border-bottom:1px solid #30363d;';
  const back = document.createElement('button');
  back.className = 'stk-back'; back.textContent = '← Volver';
  back.addEventListener('click', ()=>{ contentEl.innerHTML=''; });
  const title = document.createElement('span');
  title.style.cssText = 'font-size:.82rem;font-weight:700;color:#e6edf3;flex:1;text-align:center;';
  title.textContent = label;
  header.appendChild(back); header.appendChild(title);
  contentEl.appendChild(header);
  const grid = document.createElement('div');
  grid.className = 'stk-grid';
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8b949e;font-size:.82rem;">⏳ Cargando...</div>';
  contentEl.appendChild(grid);
  try {
    const res = await fetch('https://api.giphy.com/v1/stickers/search?api_key='+STK_API_KEY+'&limit=15&rating=g&q='+encodeURIComponent(query));
    const data = await res.json();
    _igRenderStickers(data.data, grid);
  } catch(e){ grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:12px;color:#8b949e;">Error cargando</div>'; }
}

function _igRenderStickers(stickers, grid){
  if(!stickers||!stickers.length){ grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;">Sin resultados</div>'; return; }
  grid.innerHTML='';
  stickers.forEach(s=>{
    const url=(s.images?.fixed_height_small?.url)||(s.images?.original?.url)||'';
    const orig=(s.images?.original?.url)||url;
    const item=document.createElement('div'); item.className='stk-item';
    const img=document.createElement('img'); img.src=url; img.loading='lazy'; img.alt='sticker';
    item.appendChild(img);
    item.addEventListener('click',()=>igSendSticker(orig));
    grid.appendChild(item);
  });
}

let _igStkDebounce=null;
function igSearchSticker(q){
  clearTimeout(_igStkDebounce);
  const contentEl=document.getElementById('_igStkContent');
  if(!q.trim()){ if(contentEl) contentEl.innerHTML=''; return; }
  _igStkDebounce=setTimeout(async()=>{
    if(!contentEl) return;
    contentEl.innerHTML='';
    const header=document.createElement('div');
    header.style.cssText='display:flex;align-items:center;padding:4px 8px;border-bottom:1px solid #30363d;';
    const back=document.createElement('button'); back.className='stk-back'; back.textContent='← Volver';
    back.addEventListener('click',()=>{ contentEl.innerHTML=''; const s=document.getElementById('_igStkSearch'); if(s) s.value=''; });
    const title=document.createElement('span'); title.style.cssText='font-size:.82rem;font-weight:700;color:#e6edf3;flex:1;text-align:center;'; title.textContent=q;
    header.appendChild(back); header.appendChild(title); contentEl.appendChild(header);
    const grid=document.createElement('div'); grid.className='stk-grid';
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8b949e;">🔍 Buscando...</div>';
    contentEl.appendChild(grid);
    try {
      const res=await fetch('https://api.giphy.com/v1/stickers/search?api_key='+STK_API_KEY+'&limit=15&rating=g&q='+encodeURIComponent(q));
      const data=await res.json();
      _igRenderStickers(data.data,grid);
    } catch(e){}
  },400);
}

async function igSendSticker(gifUrl){
  if(!_galPostId){ toast('Sin post asociado','inf'); return; }
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  document.getElementById('_igStkPick')?.classList.remove('open');
  const isTrofeo=_galPostId.startsWith('trofeo_');
  const realId=isTrofeo?_galPostId.replace('trofeo_',''):_galPostId;
  const colName=isTrofeo?'trofeosPendientes':'posts';
  let p=(_posts||[]).find(p=>p.id===_galPostId);
  if(!p){ try{ const s=await getDoc(doc(db,colName,realId)); if(s.exists()){p={id:_galPostId,...s.data()};(_posts||[]).push(p);} }catch(e){} }
  if(!p){ toast('No se pudo cargar el post','err'); return; }
  const nc=[...(p.comments||[]),{userId:window.CU.id,nick:window.CU.nick,av:window.CU.av||'',gender:window.CU.gender||'',gif:gifUrl,sticker:true,text:'',time:Date.now()}];
  p.comments=nc;
  await updateDoc(doc(db,colName,realId),{comments:nc});
  // Notif al dueño del post
  if(p.userId && p.userId !== window.CU.id){
    sendNotifToUserWithPost(p.userId, `🎭 ${window.CU.nick} comentó con un sticker`, _galPostId);
  }
}
window.igToggleStkPicker=igToggleStkPicker; window.igLoadStkCat=igLoadStkCat; window.igSearchSticker=igSearchSticker; window.igSendSticker=igSendSticker;
window.igNav=igNav; window.igNavTo=igNavTo; window.igReact=igReact;
window.igReactCmt=igReactCmt; window.igQuickRxnCmt=igQuickRxnCmt;
window.igEditCmt=igEditCmt; window.igDelCmt=igDelCmt; window.igReplyCmt=igReplyCmt;
window.igSubmitComment=igSubmitComment; window.igShare=igShare; window.igDownload=igDownload; window.igReport=igReport;
window.openImgLightbox=openImgLightbox;
window.openImgLightboxById=openImgLightboxById;

// ===== REPORT =====
function reportPost(pid, userNick){
  if(!window.CU){ toast('Inicia sesión para reportar','err'); return; }
  document.getElementById('reportPostId').value = pid;
  document.getElementById('reportUser').value = userNick;
  document.getElementById('reportReason').value = '';
  document.getElementById('reportDesc').value = '';
  document.getElementById('reportErr').textContent = '';
  om('mReport');
}

async function submitReport(){
  const pid = document.getElementById('reportPostId').value;
  const reason = document.getElementById('reportReason').value;
  const desc = document.getElementById('reportDesc').value.trim();
  const reportedUser = document.getElementById('reportUser').value;
  if(!reason){ document.getElementById('reportErr').textContent='Seleccioná un motivo'; return; }
  await addDoc(collection(db, 'reports'), {
    postId: pid,
    reportedUser,
    reportedBy: window.CU.nick,
    reportedById: window.CU.id,
    reason,
    desc,
    time: serverTimestamp(),
    status: 'pendiente'
  });
  cm('mReport');
  toast('Reporte enviado al administrador ✅','ok');
}
