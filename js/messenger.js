// ===== MESSENGER / CHAT =====
let _messengerOpen = false;
let _chatUserId = null;
let _chatUserNick = null;
let _unsubChat = null;

const msgSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhS0pikrmnj2BKSl+YtcObcmJnirjWx6d5YmFsm8fbtYZnX2OBsNvTsYdeWmN+rt7cvZBrX2Nzptrfv5dxZmZ3n9ncvJp4a2d1l9bav5t7bGh1kM3Vu5l7bGh1jcTRuZl6bGh4jcHQupd7bWh3i7zOuZZ8bml3ibnNuJZ9bmh4iLbMt5V/b2l4hrPLtpSBcGp4hK/KtZOCcGp4g6zJtJODcWt5ga/KtZODcWt5gbDKtpSFcmt7grHLt5WGc2x7g7LMuJaHdG19hLPNuZeJdm5+hbTOupiKd2+AhrXPu5mLd3CBh7bQvJqMe3OEh7fRvZuNfHSFiLjSvpyOfXWGibnTv52PfnaHirrVwJ6QgHiJi7vWwZ+RgXmLjLzXwqCSgniLjLzXwqCSgniKi7vWwZ+QgXiJirrUwJ+QgHeIibfPu5uLfHSGiLjRwJiMdW9+hbXNupuLdm+DhLTNu5mKdW1/hbPMuZaJdGx9g7LLuJSIcmx6ga/It5KHcGl4f6vFs5GHcGl4fqnEs5CHcGt4fbHGtZGHcGt4fLbHtZGGb2x4e7bHtZGFbmt4e7nIt5GFbmt3er3KuZKFbmt3er3KuZKFbmx4er7Lt5OGb214fMLMupSIcG55f8bPvZWJcW96gcnRwJaKcm57gs7Uw5mMdHB9g9LYxpqNdXF+hdPZx5uPd3OAh9fbypyQeHSBidrdy56Se3aEjt3gzp+UfHiGkN/i0KGXfnqIkuDj0qKYf3uKk+Hk06OZgHyLlOLl1KSagX2Mlefm1qWbgn6OmOnm2aadfn+RmersoriggIOUrvDx0KWkg4SWr/Px0qakg4SYsPTy06elg4SZsfXz1KilhIWbsvb01ainhoabtff12ainhoectvf32KuoiIidtvj32aypioqeve'+
'YAbABAAAA');

// playMsgSound definido arriba

function openMessenger(){
  _messengerOpen = true;
  om('mMessenger');
  renderMessengerList();
  // no pushState
  // Marcar notifs 💬 como leídas al abrir el messenger — leer fresco para no pisar notifs nuevas
  if(window.CU){
    getDoc(doc(db,'users',window.CU.id)).then(snap=>{
      if(!snap.exists()) return;
      const fresh = snap.data().notifs || [];
      let changed = false;
      const updated = fresh.map(n=>{
        if(n.text?.startsWith('💬') && !n.read){ changed=true; return {...n, read:true}; }
        return n;
      });
      if(changed){
        _notifs = updated;
        updateDoc(doc(db,'users',window.CU.id),{notifs:updated.slice(0,50)}).catch(()=>{});
        updateMsgBadge();
        updateNotifBadge();
      }
    }).catch(()=>{});
  }
  updateMsgBadge(); // siempre actualizar al abrir
}
// Keep toggleMessenger as alias for backward compat
function toggleMessenger(){ openMessenger(); }

function closeMessenger(){
  _messengerOpen = false;
  const el = document.getElementById('mMessenger');
  if(el) el.classList.remove('open');
  document.getElementById('chatBubbleMin').style.display='none';
  // Cancelar listeners al cerrar
  if(_unsubChat){ _unsubChat(); _unsubChat=null; }
  if(_presenceUnsub){ _presenceUnsub(); _presenceUnsub=null; }
  _chatUserId = null;
}

function minimizeMessenger(){
  const el = document.getElementById('mMessenger');
  if(el) el.classList.remove('open');
  const bubble = document.getElementById('chatBubbleMin');
  bubble.style.display='block';
  // Copy position from messenger
  if(el){
    bubble.style.bottom = el.style.bottom || '24px';
    bubble.style.right = el.style.right || '24px';
    bubble.style.left = el.style.left || 'auto';
    bubble.style.top = el.style.top || 'auto';
  }
  // Show avatar of chat user inside bubble
  const av = document.getElementById('chatBubbleAvatar');
  if(av && _chatUserId){
    const cachedAv = window._chatUserAvCache && window._chatUserAvCache[_chatUserId];
    const nick = _chatUserNick || '?';
    if(cachedAv){
      av.innerHTML = `<img src="${cachedAv}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      av.innerHTML = `<span style="font-size:1.2rem;font-weight:700;">${nick[0].toUpperCase()}</span>`;
    }
  }
}

function maximizeMessenger(){
  document.getElementById('chatBubbleMin').style.display='none';
  const el = document.getElementById('mMessenger');
  if(el) el.classList.add('open');
}

// ===== DRAG logic for floating chat =====
(function initChatDrag(){
  let dragging=false, startX, startY, startRight, startBottom;
  function getEl(){ return document.getElementById('mMessenger'); }
  function onDown(e){
    const el = getEl(); if(!el) return;
    dragging=true;
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    const rect = el.getBoundingClientRect();
    startRight = window.innerWidth - rect.right;
    startBottom = window.innerHeight - rect.bottom;
    el.style.transition='none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, {passive:false});
    document.addEventListener('touchend', onUp);
  }
  function onMove(e){
    if(!dragging) return;
    e.preventDefault();
    const el = getEl(); if(!el) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    let newRight = startRight - dx;
    let newBottom = startBottom - dy;
    // Clamp to viewport
    newRight = Math.max(0, Math.min(window.innerWidth - 60, newRight));
    newBottom = Math.max(0, Math.min(window.innerHeight - 60, newBottom));
    el.style.right = newRight + 'px';
    el.style.bottom = newBottom + 'px';
    el.style.left = 'auto';
    el.style.top = 'auto';
  }
  function onUp(){
    dragging=false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const handle = document.getElementById('chatDragHandle');
    if(handle){
      handle.addEventListener('mousedown', onDown);
      handle.addEventListener('touchstart', onDown, {passive:false});
    }
  });
})();

// ===== DRAG for minimized bubble =====
(function initBubbleDrag(){
  let dragging=false, startX, startY, startRight, startBottom, moved=false;
  const getEl = ()=>document.getElementById('chatBubbleMin');
  function onDown(e){
    if(e.target.closest('[onclick*="closeMessenger"]')) return; // don't drag on X
    dragging=true; moved=false;
    const touch = e.touches ? e.touches[0] : e;
    startX=touch.clientX; startY=touch.clientY;
    const el=getEl(); if(!el) return;
    const rect=el.getBoundingClientRect();
    startRight=window.innerWidth-rect.right;
    startBottom=window.innerHeight-rect.bottom;
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchmove',onMove,{passive:false});
    document.addEventListener('touchend',onUp);
  }
  function onMove(e){
    if(!dragging) return;
    e.preventDefault();
    const touch=e.touches?e.touches[0]:e;
    const dx=touch.clientX-startX, dy=touch.clientY-startY;
    if(Math.abs(dx)>4||Math.abs(dy)>4) moved=true;
    const el=getEl(); if(!el) return;
    let nr=Math.max(0,Math.min(window.innerWidth-60,startRight-dx));
    let nb=Math.max(0,Math.min(window.innerHeight-60,startBottom-dy));
    el.style.right=nr+'px'; el.style.bottom=nb+'px';
    el.style.left='auto'; el.style.top='auto';
  }
  function onUp(){
    dragging=false;
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onUp);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const el=getEl();
    if(el){
      el.addEventListener('mousedown',onDown);
      el.addEventListener('touchstart',onDown,{passive:false});
    }
  });
})();

let _presenceUnsub = null;

// Chat tab state
let _currentChatTab = 'all';
let _chatLastMsgs = {};

// Cache de IDs online para renderizar sin esperar evento de presencia
let _messengerOnlineIds = new Set();
let _messengerListUnsub = null;  // listener de presencia SOLO para la lista, separado del chat

// Renderiza la lista del messenger con los datos actuales (sin esperar presencia)
function _buildMessengerHTML(){
  const friends    = window.CU?.friendsList  || [];
  const archived   = window.CU?.archivedChats || [];
  const deletedChats = window.CU?.deletedChats || [];
  const onlineIds  = _messengerOnlineIds;

  // Incluir también contactos no-amigos que tengan mensajes no leídos (ej: admin)
  const friendIds = new Set(friends.map(f=>f.id));
  const extraContacts = Object.entries(_chatLastMsgs)
    .filter(([uid, lm]) => !friendIds.has(uid) && lm?.unread && !archived.includes(uid) && !deletedChats.includes(uid))
    .map(([uid, lm]) => ({
      id: uid,
      nick: lm.fromNick || lm.nick || uid,
      av: lm.fromAv || lm.av || ''
    }));
  const allContacts = [...friends, ...extraContacts];

  // Badge "No leídos"
  const unreadCount = allContacts.filter(f=>!archived.includes(f.id) && _chatLastMsgs[f.id]?.unread).length;
  const badge = document.getElementById('unreadChatBadge');
  if(badge){
    badge.style.display = unreadCount>0 ? 'inline-block' : 'none';
    badge.textContent = unreadCount;
  }

  let showFriends;
  if(_currentChatTab === 'archived'){
    showFriends = allContacts.filter(f=>archived.includes(f.id) && !deletedChats.includes(f.id));
  } else if(_currentChatTab === 'unread'){
    showFriends = allContacts.filter(f=>!archived.includes(f.id) && !deletedChats.includes(f.id) && _chatLastMsgs[f.id]?.unread);
  } else {
    // Tab "Todos": mostrar amigos + no-amigos con mensajes no leídos
    showFriends = allContacts.filter(f=>{
      if(archived.includes(f.id)) return false;
      if(deletedChats.includes(f.id)) return !!_chatLastMsgs[f.id];
      // No-amigos solo se muestran si tienen mensajes
      if(!friendIds.has(f.id)) return !!_chatLastMsgs[f.id];
      return true;
    });
  }

  showFriends = [...showFriends].sort((a,b)=>{
    const ta = _chatLastMsgs[a.id]?.time||0;
    const tb = _chatLastMsgs[b.id]?.time||0;
    return tb - ta;
  });

  let html = '';
  html += `<div style="padding:8px 10px 6px;"><div style="background:var(--bg4);border-radius:20px;display:flex;align-items:center;gap:6px;padding:7px 12px;"><span style="color:var(--muted);font-size:.85rem;">🔍</span><input id="chatSearchInput" placeholder="Buscar chat" style="background:none;border:none;outline:none;color:var(--text);font-size:.82rem;flex:1;font-family:'Exo 2',sans-serif;" oninput="filterChatSearch(this.value)"></div></div>`;

  if(showFriends.length === 0){
    const msgs = {archived:'📦 Sin chats archivados', unread:'✓ Sin mensajes sin leer', all:'Sin contactos aún'};
    html += `<div style="text-align:center;padding:32px 16px;color:var(--muted);font-size:.82rem;">${msgs[_currentChatTab]||msgs.all}</div>`;
  } else {
    html += showFriends.map(f=>{
      const isOnline  = onlineIds.has(f.id);
      const safeNick  = (f.nick||'').replace(/['"<>&]/g,'');
      const lm        = _chatLastMsgs[f.id];
      const lastTxt   = lm ? (lm.mine ? 'Tú: '+lm.text : lm.text) : (isOnline ? '● En línea' : '');
      const lastTime  = lm?.time ? fmtT(lm.time) : '';
      const hasUnread = !!lm?.unread;
      const uCount    = lm?.unreadCount || 0;
      const isArch    = archived.includes(f.id);
      const avInner   = f.av
        ? `<img src="${f.av}" style="width:100%;height:100%;object-fit:cover;">`
        : `<span style="font-size:1.1rem;font-weight:800;color:var(--accent);">${(f.nick||'?')[0].toUpperCase()}</span>`;
      // Hora y fecha del último mensaje
      const lmTs = lm?.time || 0;
      const lmDate = lmTs ? new Date(lmTs) : null;
      const now2 = Date.now();
      const isToday = lmDate && (now2 - lmTs < 86400000) && new Date().getDate() === lmDate.getDate();
      const isThisYear = lmDate && lmDate.getFullYear() === new Date().getFullYear();
      const lmFmt = !lmDate ? '' : isToday
        ? lmDate.getHours().toString().padStart(2,'0')+':'+lmDate.getMinutes().toString().padStart(2,'0')
        : isThisYear
          ? lmDate.getDate()+'/'+(lmDate.getMonth()+1)
          : lmDate.getDate()+'/'+(lmDate.getMonth()+1)+'/'+lmDate.getFullYear();
      // Tick leído
      const tickHtml = (lm?.mine && !hasUnread && lm?.text)
        ? `<span style="color:var(--accent);font-size:.7rem;margin-right:2px;">✓✓</span>`
        : (lm?.mine && lm?.text)
          ? `<span style="color:var(--muted);font-size:.7rem;margin-right:2px;">✓</span>`
          : '';
      return `<div data-chatuid="${f.id}" data-chatnick="${safeNick}" data-searchname="${(f.nick||'').toLowerCase()}" style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;margin:1px 4px;transition:background .15s;position:relative;${hasUnread?'background:rgba(0,198,255,.07);animation:unreadPulse 2s ease-in-out infinite;':''}" onmouseover="this.style.background='var(--bg3)';this.querySelector('.cgear').style.opacity='1'" onmouseout="this.style.background='${hasUnread?'rgba(0,198,255,.07)':'transparent'}';this.querySelector('.cgear').style.opacity='0'">
          <div style="position:relative;flex-shrink:0;cursor:pointer;" onclick="openChatWith('${f.id}','${safeNick}');event.stopPropagation();">
            <div style="width:46px;height:46px;border-radius:${hasUnread?'50%':'50%'};background:var(--bg3);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:700;${hasUnread?'border:2px solid var(--accent);':'border:2px solid transparent;'}">${avInner}</div>
            ${isOnline?'<div style="position:absolute;bottom:0;right:0;width:12px;height:12px;background:#31a24c;border-radius:50%;border:2px solid var(--bg2);"></div>':''}
          </div>
          <div style="flex:1;min-width:0;cursor:pointer;" onclick="openChatWith('${f.id}','${safeNick}');event.stopPropagation();">
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:4px;margin-bottom:1px;">
              <div style="font-size:.86rem;font-weight:${hasUnread?'800':'600'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(f.nick)}</div>
              <div style="font-size:.64rem;color:${hasUnread?'var(--accent)':'var(--muted)'};white-space:nowrap;flex-shrink:0;">${lmFmt}</div>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <div style="font-size:.74rem;color:${hasUnread?'var(--text)':'var(--muted)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;font-weight:${hasUnread?'600':'400'};">${tickHtml}${esc(lastTxt)}</div>
              ${hasUnread?`<div style="min-width:16px;height:16px;background:var(--accent);border-radius:100px;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:800;color:#000;padding:0 3px;flex-shrink:0;">${uCount > 9 ? '9+' : (uCount||'')}</div>`:''}
            </div>
          </div>
          <button class="cgear" onclick="openChatMenu(event,'${f.id}','${safeNick}',${hasUnread},${isArch})" style="opacity:0;transition:opacity .15s;background:var(--bg3);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:.82rem;" onmouseover="this.style.background='var(--bg4)'" onmouseout="this.style.background='var(--bg3)'" title="Opciones">⚙️</button>
        </div>`;
    }).join('');
  }
  return html;
}

function renderMessengerList(){
  const list = document.getElementById('messengerList');
  if(!list) return;

  // Render inmediato con datos que ya tenemos
  list.innerHTML = _buildMessengerHTML();
  if(!window._chatUserAvCache) window._chatUserAvCache = {};
  (window.CU?.friendsList||[]).forEach(f=>{ if(f.av) window._chatUserAvCache[f.id]=f.av; });

  // Polling cada 2 minutos en vez de onSnapshot continuo para presencia del messenger
  if(_messengerListUnsub){ clearInterval(_messengerListUnsub); _messengerListUnsub=null; }
  async function _refreshMessengerPresence(){
    try {
      const snap = await getDocs(query(collection(db,'presence'), limit(200)));
      const now = Date.now();
      _messengerOnlineIds = new Set(
        snap.docs
          .map(d=>({id:d.id, ts:d.data().last?.toMillis?.()||0}))
          .filter(u=>u.id!==window.CU?.id && now-u.ts<180000)
          .map(u=>u.id)
      );
    } catch(e){}
    // Actualizar último mensaje de cada amigo (solo si no se cargó antes)
    const friends = window.CU?.friendsList || [];
    const myId = window.CU?.id;
    if(!myId) return;
    await Promise.all(friends.map(async f=>{
      if(_chatLastMsgs[f.id]) return; // Ya cargado, no releer
      try {
        const chatId = [myId, f.id].sort().join('_');
        const q = query(collection(db,'chats',chatId,'messages'), orderBy('time','desc'), limit(20));
        const s = await getDocs(q);
        const visible = s.docs.find(d=>!(d.data().deletedFor||{})[myId]);
        if(visible){
          const d = visible.data();
          const unreadCount = s.docs.filter(d2=>{ const m=d2.data(); return m.uid!==myId && !m.read && !(m.deletedFor||{})[myId]; }).length;
          _chatLastMsgs[f.id] = {
            text: d.text||d.gif?'GIF':'',
            time: d.time?.toMillis?.()||0,
            mine: d.uid===myId,
            unread: unreadCount > 0,
            unreadCount
          };
        } else {
          if(!_chatLastMsgs[f.id]) _chatLastMsgs[f.id] = { text:'', time:0, mine:false, unread:false, unreadCount:0 };
        }
      } catch(e){}
    }));
    const list2 = document.getElementById('messengerList');
    if(list2 && list2.style.display !== 'none'){
      list2.innerHTML = _buildMessengerHTML();
      (window.CU?.friendsList||[]).forEach(f=>{ if(f.av && window._chatUserAvCache) window._chatUserAvCache[f.id]=f.av; });
    }
    updateMsgBadge();
  }
  _refreshMessengerPresence();
  _messengerListUnsub = setInterval(_refreshMessengerPresence, 120000);
}



function openChatWith(uid, nick){
  if(!uid||!window.CU){ toast('Iniciá sesión primero','err'); return; }
  // Si ya estamos en este chat, no hacer nada
  if(_chatUserId === uid) return;
  tryApplyChatGold(uid);

  // Cerrar pickers abiertos del chat anterior
  const stkPicker = document.getElementById('chatStickerPicker');
  if(stkPicker) stkPicker.style.display = 'none';
  const gifPicker = document.getElementById('chatGifPicker');
  if(gifPicker) gifPicker.style.display = 'none';
  // Limpiar input
  const inp = document.getElementById('chatInput');
  if(inp) inp.value = '';

  _chatUserId = uid;
  _chatUserNick = nick;
  // Marcar notifs de mensajes de este usuario como leídas
  if(nick) markChatNotifsRead(nick);

  // Update URL con hash para evitar 404
  const safeNickUrl = (nick||'usuario').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  history.pushState({ page: 'mensajes', chatUid: uid, chatNick: nick }, '', window.location.pathname + '#chat');

  // Make sure messenger modal is open
  om('mMessenger');

  const list = document.getElementById('messengerList');
  const chatWin = document.getElementById('chatWindow');
  if(list) list.style.display='none';
  if(chatWin){
    chatWin.style.display='flex';
    chatWin.style.flexDirection='column';
    // Try to find avatar from friends list or online users
  const chatAv = window._chatUserAvCache && window._chatUserAvCache[uid] ? window._chatUserAvCache[uid] : '';
  const avHtml = chatAv
    ? `<img src="${chatAv}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--accent);flex-shrink:0;cursor:pointer;" onclick="cm('mMessenger');openUserProfile('${uid}','${esc(nick)}')">`
    : `<div style="width:36px;height:36px;border-radius:50%;background:var(--accent);color:#000;font-weight:700;font-size:.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;" onclick="cm('mMessenger');openUserProfile('${uid}','${esc(nick)}')">${(nick||'?')[0].toUpperCase()}</div>`;
  chatWin.innerHTML = `
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:#161b22;flex-shrink:0;">
        <button onclick="backToMessengerList()" style="background:none;border:none;color:#0084ff;font-size:1.3rem;cursor:pointer;padding:0 4px;line-height:1;">‹</button>
        <div style="position:relative;flex-shrink:0;">
          ${avHtml}
          <div id="chatAvOnlineDot" style="position:absolute;bottom:0;right:0;width:10px;height:10px;border-radius:50%;background:#31a24c;border:2px solid #161b22;display:none;"></div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.9rem;font-weight:700;color:#e6edf3;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" onclick="cm('mMessenger');openUserProfile('${uid}','${esc(nick)}')">${esc(nick)}</div>
          <div style="font-size:.7rem;" id="chatOnlineStatus">•</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button title="Ver perfil" onclick="cm('mMessenger');openUserProfile('${uid}','${esc(nick)}')" style="background:none;border:none;color:#0084ff;font-size:1.1rem;cursor:pointer;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .15s;" onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">ⓘ</button>
        </div>
      </div>
      <div id="chatMessages" style="flex:1;overflow-y:auto;padding:12px 10px;display:flex;flex-direction:column;gap:2px;min-height:0;background:#0d1117;"></div>`;
  }
  const inputRow = document.getElementById('chatInputRow');
  if(inputRow) inputRow.style.display='flex';

  if(_unsubChat){ _unsubChat(); _unsubChat=null; }
  if(_presenceUnsub){ _presenceUnsub(); _presenceUnsub=null; }
  // Listen to the chat user's presence
  if(uid){
    _presenceUnsub = onSnapshot(doc(db,'presence',uid), snap=>{
      const statusEl = document.getElementById('chatOnlineStatus');
      if(!statusEl) return;
      const typingEl = document.getElementById('chatTypingStatus');
      if(snap.exists()){
        const d = snap.data();
        const now = Date.now();
        const isOnline = d.last?.toMillis ? (now - d.last.toMillis() < 120000) : false;
        const isTyping = d.typingTo === window.CU?.id && (now - (d.typingAt?.toMillis?.() || 0) < 5000);
        if(isTyping){
          statusEl.style.color='var(--accent)';
          statusEl.textContent='✍️ escribiendo...';
        } else if(isOnline){
          statusEl.style.color='var(--green)';
          statusEl.textContent='● En línea';
        } else {
          statusEl.style.color='var(--muted)';
          statusEl.textContent='○ Desconectado';
        }
      } else {
        statusEl.style.color='var(--muted)';
        statusEl.textContent='○ Desconectado';
      }
    });
  }

  const chatId = [window.CU.id, uid].sort().join('_');
  _unsubChat = onSnapshot(
    query(collection(db,'chats',chatId,'messages'), orderBy('time','asc')),
    snap=>{
      const el = document.getElementById('chatMessages');
      if(!el) return;
      const msgs = snap.docs.map(d=>({id:d.id,...d.data()}));
      // Mark incoming messages as read with timestamp
      msgs.forEach(m=>{
        if(m.uid !== window.CU.id && !m.read){
          const msgRef = doc(db,'chats',chatId,'messages',m.id);
          updateDoc(msgRef,{read:true, readAt: Date.now()}).catch(()=>{});
        }
      });
      const CHAT_RXNS = window.CU?.verified ? ['👍','❤️','😂','😮','😢','🔥','🎣','🏅','🎖️','👑'] : ['👍','❤️','😂','😮','😢','🔥','🎣'];
      el.innerHTML = msgs.length
        ? msgs.map(m=>{
            const mine = m.uid === window.CU.id;
            const time = m.time?.toMillis ? fmtT(m.time.toMillis()) : '';
            // Exact time HH:MM
            const exactTime = (()=>{
              const ms = m.time?.toMillis ? m.time.toMillis() : (typeof m.time === 'number' ? m.time : 0);
              if(!ms) return '';
              const d = new Date(ms);
              return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
            })();
            // Read status for my messages
            const readLabel = (()=>{
              if(!mine) return '';
              if(m.read && m.readAt){
                const d = new Date(m.readAt);
                const h = d.getHours().toString().padStart(2,'0');
                const min = d.getMinutes().toString().padStart(2,'0');
                return `<span style="color:var(--accent);font-size:.62rem;">✓✓ Leído ${h}:${min}</span>`;
              }
              if(m.read) return `<span style="color:var(--accent);font-size:.62rem;">✓✓ Leído</span>`;
              return `<span style="color:var(--muted);font-size:.62rem;">✓ Enviado</span>`;
            })();
            const isStoryComment = m.storyComment;
            const storyImg = m.storyImg || '';
            const msgRxns = m.reactions || {};
            const rxnEntries = Object.entries(msgRxns).filter(([,v])=>v);
            const msgRxnTotal = rxnEntries.length;
            const msgTopRxns = rxnEntries.slice(0,3).map(([,v])=>v).join('');
            const myMsgRxn = window.CU ? (msgRxns[window.CU.id]||'') : '';
            const rxnBtns = CHAT_RXNS.map(em=>`<button onclick="reactChatMsg('${chatId}','${m.id}','${em}')" style="background:${myMsgRxn===em?'rgba(0,198,255,.2)':'none'};border:none;font-size:1.25rem;cursor:pointer;padding:3px 5px;border-radius:50%;transition:transform .12s;" onmouseover="this.style.transform='scale(1.5) translateY(-4px)'" onmouseout="this.style.transform='scale(1)'">${em}</button>`).join('');
            // Story messages get a special card layout — clickeable para abrir la historia
            const _sId = m.storyId || '';
            const _sUid = m.storyUserId || '';
            const storyCard = isStoryComment ? `
              <div onclick="${_sId ? `openStoryById('${_sId}','${_sUid}')` : ''}" style="max-width:82%;border-radius:14px;overflow:hidden;border:1px solid rgba(0,198,255,.35);background:rgba(0,198,255,.07);margin-bottom:2px;${_sId?'cursor:pointer;':''}transition:opacity .15s;" ${_sId?'onmouseover="this.style.opacity=\'0.82\'" onmouseout="this.style.opacity=\'1\'"':''}>
                ${storyImg ? `<img src="${storyImg}" style="width:100%;max-height:160px;object-fit:cover;display:block;border-bottom:1px solid rgba(0,198,255,.2);">` : '<div style="width:100%;height:80px;background:linear-gradient(135deg,#0a2a4a,#0077b6);display:flex;align-items:center;justify-content:center;font-size:2rem;">🎣</div>'}
                <div style="padding:10px 12px;">
                  <div style="font-size:.68rem;color:var(--accent);font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">📖 Historia ${_sId?'· <span style=\"color:rgba(0,198,255,.7)\">Toca para ver →</span>':''}</div>
                  ${m.storyText ? `<div style="font-size:.75rem;color:var(--muted);font-style:italic;margin-bottom:6px;padding:4px 8px;background:rgba(0,0,0,.2);border-radius:6px;border-left:2px solid var(--accent);">"${esc(m.storyText)}"</div>` : ''}
                  <div style="font-size:.84rem;color:var(--text);line-height:1.5;word-break:break-word;">${esc(m.text)}</div>
                </div>
              </div>` : '';
            // Vista previa de post compartido
            const sharedPostCard = m.sharedPostId ? `
              <div onclick="scrollToPost('${m.sharedPostId}')" style="max-width:260px;border:1px solid rgba(0,198,255,.3);border-radius:14px;overflow:hidden;background:${mine?'rgba(0,100,200,.25)':'rgba(0,198,255,.07)'};cursor:pointer;margin-bottom:2px;transition:opacity .15s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
                ${m.sharedPostImg ? `<img src="${m.sharedPostImg}" style="width:100%;max-height:120px;object-fit:cover;display:block;">` : ''}
                <div style="padding:8px 10px;">
                  <div style="font-size:.68rem;color:var(--accent);font-weight:700;margin-bottom:3px;">📤 Publicación compartida</div>
                  <div style="font-size:.78rem;font-weight:700;color:${mine?'#fff':'var(--text)'};margin-bottom:2px;">${esc(m.sharedPostNick||'')}</div>
                  ${m.sharedPostText ? `<div style="font-size:.73rem;color:${mine?'rgba(255,255,255,.75)':'var(--muted)'};line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(m.sharedPostText)}</div>` : ''}
                  <div style="font-size:.65rem;color:var(--accent);margin-top:4px;">Toca para ver →</div>
                </div>
              </div>
              ${m.text ? `<div style="max-width:220px;padding:6px 12px;border-radius:${mine?'16px 16px 4px 16px':'16px 16px 16px 4px'};background:${mine?'#0084ff':'#f0f0f0'};color:${mine?'#fff':'#050505'};font-size:.84rem;line-height:1.5;word-break:break-word;display:inline-block;margin-top:2px;">${esc(m.text)}</div>` : ''}
            ` : '';
            const msgContent = m.sharedPostId ? '' : m.gif
              ? `<img src="${m.gif}" style="max-width:200px;border-radius:10px;display:block;" loading="lazy">`
              : m.audioUrl
              ? `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:${mine?'16px 16px 4px 16px':'16px 16px 16px 4px'};background:${mine?'#0084ff':'#f0f0f0'};max-width:220px;">
                  <button onclick="toggleVoicePlay(this,'${m.audioUrl}')" style="background:rgba(255,255,255,.25);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:1rem;">▶</button>
                  <div style="flex:1;">
                    <div style="height:3px;background:rgba(255,255,255,.3);border-radius:2px;margin-bottom:4px;position:relative;">
                      <div class="voice-progress" style="height:100%;width:0%;background:${mine?'#fff':'var(--accent)'};border-radius:2px;transition:width .2s;"></div>
                    </div>
                    <span style="font-size:.65rem;color:${mine?'rgba(255,255,255,.85)':'#65676b'};">🎤 ${m.audioDuration ? Math.floor(m.audioDuration/60)+':'+(m.audioDuration%60).toString().padStart(2,'0') : 'Audio'}</span>
                  </div>
                </div>`
              : `<div style="max-width:220px;min-width:0;padding:8px 12px;border-radius:${mine?'16px 16px 4px 16px':'16px 16px 16px 4px'};background:${mine?'#0084ff':'#21262d'};color:${mine?'#ffffff':'#e6edf3'};font-size:.84rem;line-height:1.5;word-break:break-word;display:inline-block;">${esc(m.text)}</div>`;
            const normalBubble = !isStoryComment ? `
              <div style="position:relative;" onmouseenter="showMsgRxnBar('${m.id}')" onmouseleave="hideMsgRxnBar('${m.id}')">
                <div id="mrxnbar_${m.id}" style="display:none;position:absolute;${mine?'right:0':'left:0'};bottom:calc(100% + 4px);background:rgba(12,22,34,.98);border:1px solid rgba(255,255,255,.13);border-radius:100px;padding:4px 8px;align-items:center;gap:2px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,.8);white-space:nowrap;" onmouseenter="keepMsgRxnBar('${m.id}')" onmouseleave="hideMsgRxnBar('${m.id}')">${rxnBtns}</div>
                ${sharedPostCard}
                ${msgContent}
                ${msgRxnTotal>0?`<div onclick="reactChatMsg('${chatId}','${m.id}','')" style="position:absolute;${mine?'left:-8px':'right:-8px'};bottom:-12px;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:1px 7px;font-size:.75rem;cursor:pointer;white-space:nowrap;">${msgTopRxns} ${msgRxnTotal}</div>`:''}
              </div>` : '';
            return `<div style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};gap:1px;margin-bottom:${msgRxnTotal>0?'14px':'2px'};" onclick="toggleMsgTime('msgtime_${m.id}')">
              ${!mine ? `<div style="display:flex;align-items:flex-end;gap:6px;">
                <div style="width:24px;height:24px;border-radius:50%;overflow:hidden;background:#21262d;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#0084ff;">
                  ${m.av ? `<img src="${m.av}" style="width:100%;height:100%;object-fit:cover;">` : (m.nick||'?')[0].toUpperCase()}
                </div>
                <div>
                  ${storyCard}
                  ${normalBubble}
                </div>
              </div>` : `<div>${storyCard}${normalBubble}</div>`}
              <div id="msgtime_${m.id}" style="display:none;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};gap:1px;padding:0 ${mine?'4px':'34px'};">
                <span style="font-size:.65rem;color:#8b949e;">${exactTime}</span>
                ${readLabel}
              </div>
            </div>`;
          }).join('')
        : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.8rem;">Empezá la conversación 👋</div>';
      el.scrollTop = el.scrollHeight;
    }
  );
}

// ===== PHOTO MODAL (profile/cover photo with reactions & comments) =====
let _photoModalType = null;
let _photoModalUserId = null;
let _photoModalUnsub = null;
const PHOTO_REACTIONS = ['👍','❤️','😍','😮','😢','🔥','🎣'];


function openPhotoModalUser(type){
  let imgSrc = '';
  if(type === 'avatar'){
    const img = document.querySelector('#upAv img');
    if(!img){ toast('Este usuario no tiene foto de perfil','inf'); return; }
    imgSrc = img.src;
  } else {
    const img = document.querySelector('#upCoverInner img');
    if(!img){ toast('Este usuario no tiene foto de portada','inf'); return; }
    imgSrc = img.src;
  }
  // Abrir visor simple
  _openSimpleLightbox(imgSrc, type==='avatar' ? '📷 Foto de perfil' : '🖼️ Foto de portada');
}

function _openSimpleLightbox(src, title){
  // Remover visor anterior si existe
  const old = document.getElementById('_simpleLightbox');
  if(old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = '_simpleLightbox';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;animation:fadeIn .2s ease;';
  overlay.innerHTML = `
    <div style="position:absolute;top:16px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:10px;">
      <span style="color:#fff;font-size:.9rem;font-weight:600;opacity:.8;">${title||''}</span>
    </div>
    <button onclick="event.stopPropagation();document.getElementById('_simpleLightbox').remove()" 
      style="position:absolute;top:12px;right:16px;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
    <img src="${src}" style="max-width:92vw;max-height:85vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,.6);pointer-events:none;">
  `;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}


function openPhotoModal(type){
  if(!window.CU){ toast('Iniciá sesión primero','err'); return; }
  let imgSrc = '';
  if(type==='avatar'){
    const img = document.querySelector('#profAvBig img');
    if(!img){ toast('Sin foto de perfil cargada','inf'); return; }
    imgSrc = img.src;
    _openSimpleLightbox(imgSrc, '📷 Tu foto de perfil');
    return;
  } else {
    const img = document.querySelector('#profCoverInner img') || document.querySelector('#profCover img');
    if(img){
      imgSrc = img.src;
    } else {
      // Cover está como backgroundImage en profCover (caso propio)
      const profCover = document.getElementById('profCover');
      const bg = profCover ? profCover.style.backgroundImage : '';
      const match = bg && bg.match(/url\(["']?([^"')]+)["']?\)/);
      if(match) imgSrc = match[1];
    }
    if(!imgSrc){ toast('Sin foto de portada cargada','inf'); return; }
    _openSimpleLightbox(imgSrc, '🖼️ Tu foto de portada');
    return;
  }

  _photoModalType = type;
  _photoModalUserId = window.CU.id;
  document.getElementById('photoModalImg').src = imgSrc;
  document.getElementById('photoModalTitle').textContent = type==='avatar' ? '📷 Foto de perfil' : '🖼 Foto de portada';

  const uavEl = document.getElementById('photoModalUserAv');
  if(window.CU.av) uavEl.innerHTML = `<img src="${window.CU.av}" style="width:100%;height:100%;object-fit:cover;">`;
  else uavEl.textContent = (window.CU.nick||'?')[0].toUpperCase();

  om('mPhotoModal');
  loadPhotoModalData(type, window.CU.id);
}

function getPhotoDocId(type, userId){ return `photo_${type}_${userId}`; }

function loadPhotoModalData(type, userId){
  if(_photoModalUnsub){ _photoModalUnsub(); _photoModalUnsub=null; }
  const ref = doc(db,'photoReactions', getPhotoDocId(type, userId));
  _photoModalUnsub = onSnapshot(ref, snap=>{
    const data = snap.exists() ? snap.data() : {};
    renderPhotoReactions(data.reactions||{});
    renderPhotoComments(data.comments||[]);
  });
}

function renderPhotoReactions(reactions){
  const bar = document.getElementById('photoModalRxnBar');
  const countEl = document.getElementById('photoModalRxnCount');
  if(!bar) return;
  const myRxn = window.CU ? (reactions[window.CU.id]||'') : '';
  const total = Object.values(reactions).filter(Boolean).length;
  const counts = {};
  Object.values(reactions).forEach(e=>{ if(e) counts[e]=(counts[e]||0)+1; });
  bar.innerHTML = PHOTO_REACTIONS.map(em=>{
    const cnt = counts[em]||0;
    const active = myRxn===em;
    return `<button onclick="photoDoReact('${em}')" title="${em}"
      style="background:${active?'rgba(24,119,242,.18)':'none'};border:${active?'1px solid var(--accent)':'1px solid transparent'};
      border-radius:100px;padding:5px 10px;cursor:pointer;font-size:.95rem;display:flex;align-items:center;gap:4px;transition:all .15s;"
      onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='${active?'rgba(24,119,242,.18)':'none'}'">
      ${em}${cnt>0?`<span style="font-size:.7rem;color:var(--muted);font-weight:600;">${cnt}</span>`:''}
    </button>`;
  }).join('');
  countEl.textContent = total>0 ? total+' '+(total===1?'reacción':'reacciones') : '';
}

function renderPhotoComments(comments){
  const el = document.getElementById('photoModalComments');
  if(!el) return;
  if(!comments.length){
    el.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.8rem;padding:16px;">Sin comentarios aún 💬</div>';
    return;
  }
  el.innerHTML = comments.map(c=>{
    const time = c.time ? fmtT(typeof c.time==='number'?c.time:Date.now()) : '';
    const av = `<img src="${c.av||getDefaultAv(c.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`;
    return `<div style="display:flex;gap:8px;align-items:flex-start;">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;overflow:hidden;flex-shrink:0;">${av}</div>
      <div style="flex:1;">
        <div style="background:var(--bg3);border-radius:12px;padding:8px 12px;display:inline-block;max-width:95%;">
          <div style="font-size:.75rem;font-weight:700;color:var(--accent);margin-bottom:2px;">${esc(c.nick||'')}</div>
          <div style="font-size:.83rem;line-height:1.45;word-break:break-word;">${esc(c.text||'')}</div>
        </div>
        <div style="font-size:.65rem;color:var(--muted);padding:2px 6px;">${time}</div>
      </div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

async function photoDoReact(emoji){
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  const ref = doc(db,'photoReactions',getPhotoDocId(_photoModalType, _photoModalUserId));
  try {
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const reactions = {...(data.reactions||{})};
    if(reactions[window.CU.id]===emoji) delete reactions[window.CU.id];
    else reactions[window.CU.id]=emoji;
    await setDoc(ref, {...data, reactions}, {merge:true});
  } catch(e){ toast('Error al reaccionar','err'); }
}

async function submitPhotoComment(){
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  const input = document.getElementById('photoModalInput');
  const text = input?.value?.trim();
  if(!text) return;
  input.value='';
  const ref = doc(db,'photoReactions',getPhotoDocId(_photoModalType, _photoModalUserId));
  try {
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    const comments = [...(data.comments||[])];
    comments.push({ uid:window.CU.id, nick:window.CU.nick||'', av:window.CU.av||'', text, time:Date.now() });
    await setDoc(ref, {...data, comments}, {merge:true});
  } catch(e){ toast('Error al comentar','err'); }
}

function backToMessengerList(){
  // Cerrar pickers
  const stkPicker = document.getElementById('chatStickerPicker');
  if(stkPicker) stkPicker.style.display = 'none';
  const gifPicker = document.getElementById('chatGifPicker');
  if(gifPicker) gifPicker.style.display = 'none';
  // Limpiar input
  const inp = document.getElementById('chatInput');
  if(inp) inp.value = '';

  if(_unsubChat){ _unsubChat(); _unsubChat=null; }
  if(_presenceUnsub){ _presenceUnsub(); _presenceUnsub=null; }
  _chatUserId = null;
  _chatUserNick = null;
  const chatWin = document.getElementById('chatWindow');
  const list = document.getElementById('messengerList');
  const inputRow = document.getElementById('chatInputRow');
  if(chatWin){ chatWin.style.display='none'; chatWin.innerHTML=''; }
  if(list) list.style.display='block';
  if(inputRow) inputRow.style.display='none';
  if(list) list.innerHTML = _buildMessengerHTML();
  renderMessengerList();
}

// ===== CHAT MESSAGE REACTIONS =====
const _msgRxnHide = {};
function showMsgRxnBar(msgId){
  clearTimeout(_msgRxnHide[msgId]);
  document.querySelectorAll('[id^="mrxnbar_"]').forEach(function(b){ if(b.id!=='mrxnbar_'+msgId) b.style.display='none'; });
  const bar = document.getElementById('mrxnbar_'+msgId);
  if(bar){ bar.style.display='flex'; }
}
function hideMsgRxnBar(msgId){
  _msgRxnHide[msgId] = setTimeout(function(){
    const bar = document.getElementById('mrxnbar_'+msgId);
    if(bar) bar.style.display='none';
  }, 600);
}
function keepMsgRxnBar(msgId){
  clearTimeout(_msgRxnHide[msgId]);
}
async function reactChatMsg(chatId, msgId, emoji){
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  const msgRef = doc(db,'chats',chatId,'messages',msgId);
  try {
    const snap = await getDoc(msgRef);
    if(!snap.exists()) return;
    const data = snap.data();
    const rxns = Object.assign({}, data.reactions||{});
    const prev = rxns[window.CU.id]||'';
    if(!emoji || prev===emoji){ delete rxns[window.CU.id]; }
    else {
      rxns[window.CU.id] = emoji;
      // ✅ Notificar al autor del mensaje si no soy yo
      if(data.uid && data.uid !== window.CU.id){
        await sendNotifToUser(data.uid, `💬 ${emoji} ${window.CU.nick} reaccionó a tu mensaje`);
      }
    }
    await updateDoc(msgRef, {reactions: rxns});
    const bar = document.getElementById('mrxnbar_'+msgId);
    if(bar) bar.style.display='none';
  } catch(err){ console.error('reactChatMsg error',err); }
}

let _typingTimer = null;

// ── Chat Stickers ──
window.toggleChatStickerPicker = function(){
  const p = document.getElementById('chatStickerPicker');
  if(!p) return;
  const isOpen = p.style.display === 'flex';
  p.style.display = isOpen ? 'none' : 'flex';
  if(!isOpen) loadChatStickers('fishing');
};

async function loadChatStickers(q){
  const grid = document.getElementById('chatStickerGrid');
  if(!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;font-size:.75rem;">Cargando...</div>';
  try {
    const res = await fetch(`https://api.giphy.com/v1/stickers/search?api_key=${STK_API_KEY}&limit=16&rating=g&q=${encodeURIComponent(q||'fishing')}`);
    const data = await res.json();
    renderChatStickers(data.data || []);
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:12px;color:#f85149;font-size:.75rem;">Error al cargar</div>';
  }
}

function renderChatStickers(stickers){
  const grid = document.getElementById('chatStickerGrid');
  if(!grid) return;
  if(!stickers.length){ grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:12px;color:#8b949e;font-size:.75rem;">Sin resultados</div>'; return; }
  grid.innerHTML = '';
  stickers.forEach(s => {
    const url = s.images?.fixed_height_small?.url || s.images?.fixed_height?.url || '';
    if(!url) return;
    const img = document.createElement('img');
    img.src = url; img.loading = 'lazy';
    img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;cursor:pointer;border-radius:8px;padding:2px;transition:background .15s;';
    img.onmouseover = () => img.style.background = '#21262d';
    img.onmouseout = () => img.style.background = 'none';
    img.onclick = () => {
      document.getElementById('chatStickerPicker').style.display = 'none';
      sendChatSticker(url);
    };
    grid.appendChild(img);
  });
}

window.searchChatStickers = function(q){
  clearTimeout(window._chatStkTimer);
  window._chatStkTimer = setTimeout(() => loadChatStickers(q||'fishing'), 400);
};

async function sendChatSticker(gifUrl){
  if(!window.CU || !_chatUserId) return;
  const chatId = [window.CU.id, _chatUserId].sort().join('_');
  try {
    await addDoc(collection(db,'chats',chatId,'messages'),{
      uid: window.CU.id, nick: window.CU.nick, av: window.CU.av||'',
      gif: gifUrl, sticker: true, text: '', time: serverTimestamp()
    });
    sendNotifToUser(_chatUserId, `💬 ${window.CU.nick}: 🎭 Sticker`).catch(()=>{});
  } catch(e){ toast('Error al enviar sticker','err'); }
}

// ── Chat Foto (1 sola) ──
window.sendChatPhoto = async function(input){
  const file = input.files[0];
  input.value = '';
  if(!file) return;
  if(!file.type.startsWith('image/')){ toast('Solo se permiten imágenes','err'); return; }
  if(file.size > 5*1024*1024){ toast('La imagen no puede superar 5MB','err'); return; }
  if(!window.CU || !_chatUserId){ toast('Error: no hay conversación activa','err'); return; }
  toast('📷 Subiendo imagen...','ok');
  try {
    // Subir a Cloudinary igual que el resto del sitio
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    fd.append('folder', 'chat');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method:'POST', body:fd });
    const data = await res.json();
    const imgUrl = data.secure_url;
    if(!imgUrl) throw new Error('Sin URL');
    const chatId = [window.CU.id, _chatUserId].sort().join('_');
    await addDoc(collection(db,'chats',chatId,'messages'),{
      uid: window.CU.id, nick: window.CU.nick, av: window.CU.av||'',
      gif: imgUrl, text: '', time: serverTimestamp()
    });
    sendNotifToUser(_chatUserId, `💬 ${window.CU.nick}: 📷 Foto`).catch(()=>{});
  } catch(e){ toast('Error al enviar la foto: '+e.message,'err'); }
};

function setChatTyping(){
  if(!window.CU || !_chatUserId) return;
  clearTimeout(_typingTimer);
  try{ setDoc(doc(db,'presence',window.CU.id),{typingTo:_chatUserId,typingAt:serverTimestamp()},{merge:true}); }catch(e){}
  _typingTimer = setTimeout(function(){
    try{ setDoc(doc(db,'presence',window.CU.id),{typingTo:'',typingAt:serverTimestamp()},{merge:true}); }catch(e){}
  }, 4000);
}
// Marcar notifs 💬 de un remitente específico como leídas
function markChatNotifsRead(nick){
  if(!window.CU) return;
  // Limpiar badge de _chatLastMsgs por uid (si está disponible)
  if(_chatUserId && _chatLastMsgs[_chatUserId]){
    _chatLastMsgs[_chatUserId].unread = false;
    _chatLastMsgs[_chatUserId].unreadCount = 0;
  }
  // También marcar notifs locales como leídas por nick (compatibilidad)
  let changed = false;
  _notifs.forEach(n=>{
    if(!n.read && n.text?.startsWith('💬')){
      // Marcar todas las notifs de mensajes de este uid o nick como leídas
      const matchUid = n.fromUid && n.fromUid === _chatUserId;
      const matchNick = nick && n.text.includes(nick+':');
      if(matchUid || matchNick){ n.read=true; changed=true; }
    }
  });
  if(changed){
    // Leer array fresco de Firestore antes de escribir para no pisar notifs nuevas
    getDoc(doc(db,'users',window.CU.id)).then(snap=>{
      if(!snap.exists()) return;
      const fresh = snap.data().notifs || [];
      // Marcar como leídas las notifs de mensajes de este uid/nick en el array fresco
      const updated = fresh.map(n=>{
        if(!n.read && n.text?.startsWith('💬')){
          const matchUid = n.fromUid && n.fromUid === _chatUserId;
          const matchNick = n.fromNick && n.fromNick === _chatUserNick;
          if(matchUid || matchNick) return {...n, read:true};
        }
        return n;
      });
      updateDoc(doc(db,'users',window.CU.id),{notifs: updated.slice(0,50)}).catch(()=>{});
    }).catch(()=>{});
  }
  updateMsgBadge();
  updateNotifBadge();
}

let _chatSending = false; // Evitar envíos duplicados
async function sendChatMsg(gifUrl){
  if(!window.CU){ toast('Iniciá sesión primero','err'); return; }
  if(_chatSending) return; // Bloqueo anti-doble envío
  const inp = document.getElementById('chatInput');
  if(!inp) return;
  const text = gifUrl || inp.value.trim();
  if(!text || !_chatUserId) return;
  _chatSending = true;
  const sendBtn = document.getElementById('chatSendBtn');
  if(sendBtn) sendBtn.disabled = true;
  inp.value='';
  try{ setDoc(doc(db,'presence',window.CU.id),{typingTo:'',typingAt:serverTimestamp()},{merge:true}); }catch(e2){}
  const chatId = [window.CU.id, _chatUserId].sort().join('_');
  const msgData = { uid: window.CU.id, nick: window.CU.nick, time: serverTimestamp() };
  if(gifUrl){ msgData.gif = gifUrl; msgData.text = ''; }
  else { msgData.text = text; }
  try {
    await addDoc(collection(db,'chats',chatId,'messages'), msgData);
    // Notif desacoplada: NO bloqueamos el envío si falla la notif
    const previewText = gifUrl ? '🖼️ GIF' : text.slice(0,60);
    sendNotifToUser(_chatUserId, `💬 ${window.CU.nick}: ${previewText}`).catch(()=>{});
    // Actualizar badge local inmediatamente sin esperar el poll de 30s
    if(_chatLastMsgs[_chatUserId]) {
      _chatLastMsgs[_chatUserId].mine = true;
    }
  } catch(e){ toast('Error al enviar mensaje','err'); inp.value=text; }
  finally {
    _chatSending = false;
    if(sendBtn) sendBtn.disabled = false;
  }
}

// ===== MSG TIME TOGGLE =====
function toggleMsgTime(id){
  const el = document.getElementById(id);
  if(!el) return;
  const isOpen = el.style.display === 'flex';
  // Close all other open time labels
  document.querySelectorAll('[id^="msgtime_"]').forEach(e=>e.style.display='none');
  if(!isOpen) el.style.display='flex';
}

// ===== VOICE MESSAGES =====
let _mediaRecorder = null;
let _audioChunks = [];
let _voiceTimerInterval = null;
let _voiceSeconds = 0;
let _voiceAnalyser = null;
let _voiceAudioCtx = null;
let _voiceStream = null;

function toggleVoiceBtn(){
  const inp = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const micBtn = document.getElementById('voiceMsgBtn');
  if(!inp || !sendBtn || !micBtn) return;
  if(inp.value.trim().length > 0){
    sendBtn.style.display='flex'; sendBtn.style.alignItems='center'; sendBtn.style.justifyContent='center';
    micBtn.style.display='none';
  } else {
    sendBtn.style.display='none';
    micBtn.style.display='block';
  }
}

async function toggleVoiceRecord(){
  if(!window.CU?.verified){
    toast('🎤 Mensajes de voz solo para usuarios ✅ Verificados','err');
    return;
  }
  if(_mediaRecorder && _mediaRecorder.state === 'recording'){
    stopAndSendVoice();
  } else {
    await startVoiceRecord();
  }
}

async function startVoiceRecord(){
  if(!window.CU){ toast('Iniciá sesión primero','err'); return; }
  if(!_chatUserId){ toast('Abrí un chat primero','err'); return; }
  try {
    _voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch(e){
    toast('Permiso de micrófono denegado','err'); return;
  }
  // Setup analyser for wave bar
  _voiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = _voiceAudioCtx.createMediaStreamSource(_voiceStream);
  _voiceAnalyser = _voiceAudioCtx.createAnalyser();
  _voiceAnalyser.fftSize = 64;
  source.connect(_voiceAnalyser);

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

  _audioChunks = [];
  _mediaRecorder = new MediaRecorder(_voiceStream, { mimeType });
  _mediaRecorder.ondataavailable = e => { if(e.data.size>0) _audioChunks.push(e.data); };
  _mediaRecorder.start(100);

  // Show recording UI
  const inputEl = document.getElementById('chatInput');
  const micBtn = document.getElementById('voiceMsgBtn');
  const sendBtn = document.getElementById('chatSendBtn');
  const bar = document.getElementById('voiceRecordingBar');
  if(inputEl) inputEl.style.display='none';
  if(micBtn) micBtn.style.display='none';
  if(sendBtn) sendBtn.style.display='none';
  if(bar){ bar.style.display='flex'; }

  // Timer
  _voiceSeconds = 0;
  updateVoiceTimer();
  _voiceTimerInterval = setInterval(()=>{
    _voiceSeconds++;
    updateVoiceTimer();
    if(_voiceSeconds >= 60){ stopAndSendVoice(); } // max 60s
  }, 1000);

  // Wave animation
  animateVoiceWave();

  // Mic button glow
  const btn = document.getElementById('voiceMsgBtn');
  if(btn){ btn.style.color='var(--red)'; }
}

function updateVoiceTimer(){
  const el = document.getElementById('voiceTimer');
  if(el){
    const m = Math.floor(_voiceSeconds/60);
    const s = (_voiceSeconds%60).toString().padStart(2,'0');
    el.textContent = m+':'+s;
  }
}

function animateVoiceWave(){
  if(!_voiceAnalyser || !_mediaRecorder || _mediaRecorder.state !== 'recording') return;
  const data = new Uint8Array(_voiceAnalyser.frequencyBinCount);
  _voiceAnalyser.getByteFrequencyData(data);
  const avg = data.reduce((a,b)=>a+b,0)/data.length;
  const pct = Math.min(100, (avg/128)*100);
  const wave = document.getElementById('voiceWave');
  if(wave) wave.style.width = pct+'%';
  requestAnimationFrame(animateVoiceWave);
}

function cancelVoiceRecord(){
  if(_mediaRecorder && _mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
  _voiceStream?.getTracks().forEach(t=>t.stop());
  clearInterval(_voiceTimerInterval);
  if(_voiceAudioCtx) _voiceAudioCtx.close().catch(()=>{});
  _mediaRecorder=null; _audioChunks=[]; _voiceStream=null; _voiceAudioCtx=null;
  resetVoiceUI();
  toast('Grabación cancelada','inf');
}

function resetVoiceUI(){
  const inputEl = document.getElementById('chatInput');
  const micBtn = document.getElementById('voiceMsgBtn');
  const bar = document.getElementById('voiceRecordingBar');
  const sendBtn = document.getElementById('chatSendBtn');
  if(inputEl){ inputEl.style.display=''; }
  if(micBtn){ micBtn.style.display='block'; micBtn.style.color='var(--muted)'; }
  if(bar){ bar.style.display='none'; }
  if(sendBtn){ sendBtn.style.display='none'; }
}

async function stopAndSendVoice(){
  if(!_mediaRecorder || _mediaRecorder.state === 'inactive') return;
  clearInterval(_voiceTimerInterval);

  // Detener grabación y esperar que termine
  await new Promise(resolve=>{
    _mediaRecorder.onstop = resolve;
    if(_mediaRecorder.state !== 'inactive') _mediaRecorder.stop();
    else resolve();
  });
  _voiceStream?.getTracks().forEach(t=>t.stop());
  if(_voiceAudioCtx){ try{ await _voiceAudioCtx.close(); }catch(e){} }

  const mimeType = _mediaRecorder.mimeType || 'audio/webm';
  const chunks = [..._audioChunks]; // copia antes de limpiar
  const duration = _voiceSeconds;
  _mediaRecorder=null; _audioChunks=[]; _voiceStream=null; _voiceAudioCtx=null;

  const blob = new Blob(chunks, { type: mimeType });
  console.log('[Voice] blob size:', blob.size, 'type:', mimeType, 'duration:', duration);

  if(blob.size < 300){ toast('Grabación muy corta','err'); resetVoiceUI(); return; }

  resetVoiceUI();
  toast('Enviando audio...','inf');

  try {
    if(!window.CU || !_chatUserId){
      toast('Error: sesión no válida','err'); return;
    }

    // Subir a Cloudinary (resource_type=video acepta audio también)
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    const formData = new FormData();
    formData.append('file', blob, 'voice_' + Date.now() + '.' + ext);
    formData.append('upload_preset', 'charlasrf4_audio');

    const res = await fetch('https://api.cloudinary.com/v1_1/da0n5tg3g/video/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    console.log('[Voice] Cloudinary:', data);

    if(!data.secure_url) throw new Error(data.error?.message || 'Upload falló');

    const chatId = [window.CU.id, _chatUserId].sort().join('_');
    await addDoc(collection(db,'chats',chatId,'messages'),{
      uid: window.CU.id,
      nick: window.CU.nick,
      audioUrl: data.secure_url,
      audioDuration: duration,
      text: '',
      time: serverTimestamp()
    });
    toast('Audio enviado 🎤','ok');
  } catch(e){
    console.error('[Voice] Error:', e);
    toast('Error al enviar audio: ' + e.message,'err');
  }
}

function toggleVoicePlay(btn, url){
  // Stop any other playing audio
  if(window._playingAudio && window._playingAudio !== btn._audio){
    window._playingAudio.pause();
    window._playingAudio._btn && (window._playingAudio._btn.textContent='▶');
  }
  if(!btn._audio){
    btn._audio = new Audio(url);
    btn._audio._btn = btn;
    btn._audio.ontimeupdate = ()=>{
      const pct = btn._audio.duration ? (btn._audio.currentTime/btn._audio.duration)*100 : 0;
      const bar = btn.closest('div').querySelector('.voice-progress');
      if(bar) bar.style.width = pct+'%';
    };
    btn._audio.onended = ()=>{ btn.textContent='▶'; window._playingAudio=null; };
  }
  if(btn._audio.paused){
    btn._audio.play();
    btn.textContent='⏸';
    window._playingAudio = btn._audio;
  } else {
    btn._audio.pause();
    btn.textContent='▶';
  }
}


// ===== STICKER PICKER (Facebook style) =====
const STK_CATS = [
  {label:'Feliz',     emoji:'🥳', color:'#f5a623', q:'happy cartoon sticker'},
  {label:'Enamorado', emoji:'😍', color:'#e91e8c', q:'love heart sticker'},
  {label:'Triste',    emoji:'😢', color:'#7b8fa1', q:'sad crying sticker'},
  {label:'Comiendo',  emoji:'🍕', color:'#f4511e', q:'eating food sticker'},
  {label:'Celebrando',emoji:'🎉', color:'#8e24aa', q:'celebration party sticker'},
  {label:'Activo',    emoji:'⚡', color:'#43a047', q:'sports active energy sticker'},
  {label:'Trabajando',emoji:'💼', color:'#5e6c84', q:'working office sticker'},
  {label:'Soñoliento',emoji:'😴', color:'#546e7a', q:'sleepy tired sticker'},
  {label:'Enojado',   emoji:'😠', color:'#e53935', q:'angry mad sticker'},
  {label:'Confundido',emoji:'😕', color:'#8d6e63', q:'confused thinking sticker'},
];
const STK_API_KEY = '6JhiiqPRlv7emFmLUm5z9Q9palmKtLq6';

function toggleStickerPicker(pickerId, targetId){
  document.querySelectorAll('.gif-picker.open').forEach(function(p){ p.classList.remove('open'); });
  const picker = document.getElementById(pickerId);
  if(!picker) return;
  const isOpen = picker.classList.contains('open');
  document.querySelectorAll('.stk-picker.open').forEach(function(p){ p.classList.remove('open'); });
  if(!isOpen){
    picker.classList.add('open');
    picker.dataset.target = targetId;
    const postId = pickerId.replace('stkpick_','');
    const catsEl = document.getElementById('stkcats_'+postId);
    if(catsEl && !catsEl.children.length) _renderStkCats(catsEl, pickerId, targetId);
    const inp = document.getElementById('stksearch_'+postId);
    if(inp) setTimeout(function(){ inp.focus(); }, 100);
  }
}

function _renderStkCats(catsEl, pickerId, targetId){
  catsEl.innerHTML = '';
  STK_CATS.forEach(function(c){
    const btn = document.createElement('button');
    btn.className = 'stk-cat-btn';
    btn.style.background = c.color;
    btn.innerHTML = '<span style="font-size:1.3rem;">' + c.emoji + '</span>' + c.label;
    btn.addEventListener('click', function(){ loadStickerCat(c.q, pickerId, targetId, c.label); });
    catsEl.appendChild(btn);
  });
}

function closeStickerPicker(pickerId){
  const picker = document.getElementById(pickerId);
  if(picker) picker.classList.remove('open');
}

function _makeStkHeader(pickerId, label){
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;align-items:center;padding:4px 8px;border-bottom:1px solid #30363d;';
  const backBtn = document.createElement('button');
  backBtn.className = 'stk-back';
  backBtn.textContent = '← Volver';
  backBtn.addEventListener('click', function(){ resetStickerCats(pickerId); });
  const title = document.createElement('span');
  title.style.cssText = 'font-size:.82rem;font-weight:700;color:#e6edf3;flex:1;text-align:center;';
  title.textContent = label;
  div.appendChild(backBtn);
  div.appendChild(title);
  return div;
}

let _stkDebounce = null;
async function loadStickerCat(query, pickerId, targetId, label){
  const postId = pickerId.replace('stkpick_','');
  const contentEl = document.getElementById('stkcontent_'+postId);
  if(!contentEl) return;
  contentEl.innerHTML = '';
  contentEl.appendChild(_makeStkHeader(pickerId, label));
  const grid = document.createElement('div');
  grid.className = 'stk-grid';
  grid.id = 'stkgrid_'+postId;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8b949e;font-size:.82rem;">⏳ Cargando...</div>';
  contentEl.appendChild(grid);
  try {
    const res = await fetch('https://api.giphy.com/v1/stickers/search?api_key=' + STK_API_KEY + '&limit=15&rating=g&q=' + encodeURIComponent(query));
    const data = await res.json();
    renderStickerResults(data.data, postId, pickerId, targetId);
  } catch(e){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:12px;color:#8b949e;">Error cargando</div>';
  }
}

async function searchStickers(query, pickerId, targetId){
  clearTimeout(_stkDebounce);
  const postId = pickerId.replace('stkpick_','');
  if(!query.trim()){ resetStickerCats(pickerId); return; }
  _stkDebounce = setTimeout(async function(){
    const contentEl = document.getElementById('stkcontent_'+postId);
    if(!contentEl) return;
    contentEl.innerHTML = '';
    contentEl.appendChild(_makeStkHeader(pickerId, query));
    const grid = document.createElement('div');
    grid.className = 'stk-grid';
    grid.id = 'stkgrid_'+postId;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#8b949e;">🔍 Buscando...</div>';
    contentEl.appendChild(grid);
    try {
      const res = await fetch('https://api.giphy.com/v1/stickers/search?api_key=' + STK_API_KEY + '&limit=15&rating=g&q=' + encodeURIComponent(query));
      const data = await res.json();
      renderStickerResults(data.data, postId, pickerId, targetId);
    } catch(e){}
  }, 400);
}

function renderStickerResults(stickers, postId, pickerId, targetId){
  const grid = document.getElementById('stkgrid_'+postId);
  if(!grid) return;
  if(!stickers || !stickers.length){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;">Sin resultados</div>';
    return;
  }
  grid.innerHTML = '';
  stickers.forEach(function(s){
    const url = (s.images && s.images.fixed_height_small && s.images.fixed_height_small.url) || (s.images && s.images.original && s.images.original.url) || '';
    const orig = (s.images && s.images.original && s.images.original.url) || url;
    const item = document.createElement('div');
    item.className = 'stk-item';
    const img = document.createElement('img');
    img.src = url;
    img.loading = 'lazy';
    img.alt = 'sticker';
    item.appendChild(img);
    item.addEventListener('click', function(){ sendSticker(orig, pickerId, targetId); });
    grid.appendChild(item);
  });
}

function resetStickerCats(pickerId){
  const postId = pickerId.replace('stkpick_','');
  const contentEl = document.getElementById('stkcontent_'+postId);
  const inp = document.getElementById('stksearch_'+postId);
  if(inp) inp.value = '';
  if(contentEl){
    contentEl.innerHTML = '<div class="stk-cats" id="stkcats_'+postId+'"></div>';
    const catsEl = document.getElementById('stkcats_'+postId);
    const picker = document.getElementById(pickerId);
    const tgt = picker ? picker.dataset.target : '';
    if(catsEl) _renderStkCats(catsEl, pickerId, tgt);
  }
}

function sendSticker(gifUrl, pickerId, targetId){
  closeStickerPicker(pickerId);
  if(targetId === 'chatInput'){
    sendChatMsg(gifUrl);
  } else if(targetId.startsWith('_cmtModalInp_')){
    // Sticker desde modal de comentarios
    const pid = targetId.replace('_cmtModalInp_','');
    sendCmtGif(pid, gifUrl);
  } else {
    submitCommentGif(gifUrl, targetId.replace('cinp_',''));
  }
}

