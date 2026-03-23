(function(){

  // ── Helpers ──────────────────────────────────────────────────
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtHM(ts){ const d=new Date(ts); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); }
  function fmtT(ts){
    if(!ts) return '';
    var ms = (ts && typeof ts.toMillis === 'function') ? ts.toMillis() : (typeof ts === 'number' ? ts : 0);
    if(!ms) return '';
    var diff = Date.now() - ms;
    if(diff < 0) return 'Ahora';
    if(diff < 60000) return 'Ahora';
    if(diff < 3600000) return Math.floor(diff/60000)+'m';
    if(diff < 86400000) return Math.floor(diff/3600000)+'h';
    var d = new Date(ms);
    return d.getDate()+'/'+(d.getMonth()+1);
  }

  // ── Estado ───────────────────────────────────────────────────
  var _rf4Tab        = 'chat';
  var _gcUnsub       = null;   // listener chat global
  var _gcMsgs        = [];     // mensajes del chat global en memoria
  var _jugadoresAll  = [];     // lista completa para filtrar
  var _jLoaded       = false;

  // ── Switch de tabs ───────────────────────────────────────────
  window.rf4SwitchTab = function(tab){
    _rf4Tab = tab;
    // Tabs highlight
    ['chat','jugadores','mensajes'].forEach(function(t){
      var btn = document.getElementById('rf4Tab'+t.charAt(0).toUpperCase()+t.slice(1));
      if(btn) btn.classList.toggle('on', t===tab);
    });
    // Paneles
    var pChat = document.getElementById('rf4PanelChat');
    var pJug  = document.getElementById('rf4PanelJugadores');
    var pMsg  = document.getElementById('rf4PanelMensajes');
    if(pChat) pChat.style.display = tab==='chat'      ? 'flex' : 'none';
    if(pJug)  pJug.style.display  = tab==='jugadores' ? 'flex' : 'none';
    if(pMsg)  pMsg.style.display  = tab==='mensajes'  ? 'flex' : 'none';

    if(tab==='chat'      && !_gcUnsub)  initGlobalChat();
    if(tab==='jugadores' && !_jLoaded)  loadJugadores();
    if(tab==='mensajes')                renderMessengerList();
  };

  // ────────────────────────────────────────────────────────────
  // CHAT GLOBAL
  // ────────────────────────────────────────────────────────────
  function getFs(){
    var lib = window._fsLib;
    var db  = window.db;
    if(!lib || !db) return null;
    return lib;
  }

  function initGlobalChat(){
    var fs = getFs();
    if(!fs || !window.db){ setTimeout(initGlobalChat, 800); return; }
    var { onSnapshot, query: fq, collection, orderBy, limit, serverTimestamp: st } = window.firebaseFirestore || {};
    // Usar onSnapshot directamente desde el módulo ES ya que _fsLib no incluye onSnapshot
    // Buscamos en window si fue expuesto, sino hacemos polling
    if(typeof onSnapshot === 'function'){
      _gcUnsub = onSnapshot(
        fq(collection(window.db,'chatGlobal'), orderBy('time','asc'), limit(80)),
        function(snap){
          _gcMsgs = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
          renderGlobalChat();
        },
        function(err){ console.warn('chatGlobal:', err); }
      );
    } else {
      // Fallback: polling cada 5 segundos
      loadGlobalMsgsOnce();
      _gcUnsub = setInterval(loadGlobalMsgsOnce, 5000);
    }
  }

  async function loadGlobalMsgsOnce(){
    var fs = getFs();
    if(!fs || !window.db) return;
    try {
      var snap = await fs.getDocs(fs.query(fs.collection(window.db,'chatGlobal'), fs.orderBy('time','asc'), fs.limit(80)));
      _gcMsgs = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
      renderGlobalChat();
    } catch(e){ console.warn('chatGlobal load:', e); }
  }

  function renderGlobalChat(){
    var el = document.getElementById('globalChatMessages');
    if(!el) return;
    var wasAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    el.innerHTML = _gcMsgs.map(function(m){
      var ts   = m.time && m.time.toMillis ? m.time.toMillis() : (m.time||0);
      var hora = ts ? fmtHM(ts) : '';
      var nick = esc(m.nick || m.userNick || '?');
      var uid  = m.uid || m.userId || '';
      var text = esc(m.text || '');
      var isMine = window.CU && (m.uid === window.CU.id || m.userId === window.CU.id);
      // Colores de nick rotativos por uid
      var colors = ['#2ec4b6','#58a6ff','#f0b90b','#ff7b72','#a371f7','#79c0ff','#56d364'];
      var colorIdx = 0;
      if(uid){ var s=0; for(var i=0;i<uid.length;i++) s+=uid.charCodeAt(i); colorIdx=s%colors.length; }
      var nickColor = isMine ? '#ffd700' : colors[colorIdx];
      // Insignia admin/premium
      var badge = '';
      if(m.role==='admin') badge = '<span style="font-size:.58rem;background:#ff4444;color:#fff;padding:1px 5px;border-radius:3px;margin-right:3px;">ADMIN</span>';
      else if(m.role==='premium') badge = '<span style="font-size:.58rem;background:linear-gradient(90deg,#b8860b,#ffd700);color:#000;padding:1px 5px;border-radius:3px;margin-right:3px;">⭐</span>';

      var isAdmin = window.CU && (window.CU.role === 'admin' || window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com');
      var deleteBtn = isAdmin
        ? '<button onclick="deleteGlobalMsg(\''+m.id+'\')" style="margin-left:6px;background:none;border:none;color:#f85149;font-size:.7rem;cursor:pointer;opacity:.5;padding:0 3px;line-height:1;" title="Borrar">✕</button>'
        : '';

      return '<div class="gchat-line" style="display:flex;align-items:baseline;gap:0;">'
        + '<span class="gchat-nick" style="color:'+nickColor+';" onclick="openUserProfile(\''+uid+'\',\''+nick+'\')">'
          + badge + nick + ':'
        + '</span>'
        + '<span class="gchat-text">'+text+'</span>'
        + (hora ? '<span class="gchat-time">'+hora+'</span>' : '')
        + deleteBtn
        + '</div>';
    }).join('');
    if(wasAtBottom || _gcMsgs.length <= 5){
      el.scrollTop = el.scrollHeight;
    }
  }

  window.deleteGlobalMsg = async function(msgId){
    if(!msgId) return;
    if(!window.CU) return;
    var isAdmin = window.CU.role === 'admin' || window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com';
    if(!isAdmin) return;
    try{
      var { deleteDoc, doc } = window.firebaseFirestore || {};
      if(typeof deleteDoc === 'function'){
        await deleteDoc(doc(window.db, 'chatGlobal', msgId));
      }
    }catch(e){
      if(typeof toast === 'function') toast('Error al borrar: '+(e.message||''), 'err');
    }
  };

  window.sendGlobalMsg = async function(){
    if(!window.CU){ if(typeof toast==='function') toast('Iniciá sesión primero','err'); return; }
    var inp = document.getElementById('globalChatInput');
    if(!inp) return;
    var text = (inp.value||'').trim();
    if(!text) return;
    if(text.length > 250) text = text.slice(0,250);
    inp.value = '';

    // Verificar flood: máx 1 msj cada 2 segundos
    var now = Date.now();
    if(window._lastGcSend && now - window._lastGcSend < 2000){
      if(typeof toast==='function') toast('Enviás muy rápido 😅','warn'); return;
    }
    window._lastGcSend = now;

    var fs = getFs();
    if(!fs || !window.db){ if(typeof toast==='function') toast('Sin conexión','err'); return; }

    // Obtener serverTimestamp
    var { addDoc, collection, serverTimestamp } = window.firebaseFirestore || {};
    if(typeof addDoc === 'function'){
      try {
        await addDoc(collection(window.db,'chatGlobal'), {
          text: text,
          uid: window.CU.id,
          userId: window.CU.id,
          nick: window.CU.nick || 'Anónimo',
          userAv: window.CU.av || '',
          role: window.CU.role || 'novato',
          time: serverTimestamp ? serverTimestamp() : new Date()
        });
        // Auto-limpiar mensajes viejos (mantener últimos 200): no es necesario del lado cliente
      } catch(e){
        if(typeof toast==='function') toast('Error al enviar: '+(e.message||''),'err');
      }
    } else {
      // Fallback con _fsLib (no tiene addDoc pero intentamos igualmente)
      if(typeof toast==='function') toast('Chat global no disponible aún','warn');
    }
  };

  // ────────────────────────────────────────────────────────────
  // JUGADORES
  // ────────────────────────────────────────────────────────────
  async function loadJugadores(){
    _jLoaded = true;
    var el = document.getElementById('rf4JugadoresList');
    if(!el) return;
    el.innerHTML = '<div style="text-align:center;padding:24px;color:#8b949e;font-size:.8rem;">⚙️ Cargando jugadores...</div>';

    var fs = getFs();
    if(!fs || !window.db){ el.innerHTML='<div style="text-align:center;padding:24px;color:#8b949e;font-size:.8rem;">Sin conexión</div>'; return; }

    try {
      // Obtener presencia de los últimos 5 minutos
      var now = Date.now();
      var since5m = new Date(now - 300000); // 5 min
      var since24h = new Date(now - 86400000); // 24h

      var presSnap = await fs.getDocs(fs.query(fs.collection(window.db,'presence'), fs.where('last','>',since24h), fs.limit(200)));
      var presMap = {};
      presSnap.docs.forEach(function(d){
        var ts = d.data().last && d.data().last.toMillis ? d.data().last.toMillis() : 0;
        presMap[d.id] = ts;
      });

      // Obtener datos de usuarios
      var onlineIds = Object.keys(presMap).filter(function(id){ return presMap[id] > now-300000; });
      var allIds    = Object.keys(presMap);

      // Intentamos usar la lista de amigos + presencia para no leer toda la colección users
      var friends = (window.CU && window.CU.friendsList) || [];
      var knownUsers = {};
      friends.forEach(function(f){ knownUsers[f.id] = f; });
      // También usuarios ya en caché de presencia del app
      var cache = window._presenceCache || {};
      Object.values(cache).forEach(function(u){ if(u && u.id) knownUsers[u.id] = u; });

      // Para IDs desconocidos, cargar desde users (en batch de max 20)
      var unknownIds = allIds.filter(function(id){ return !knownUsers[id] && id !== (window.CU&&window.CU.id); }).slice(0,60);
      if(unknownIds.length){
        var chunks = [];
        for(var i=0;i<unknownIds.length;i+=10) chunks.push(unknownIds.slice(i,i+10));
        for(var ci=0;ci<chunks.length;ci++){
          var uSnap = await fs.getDocs(fs.query(fs.collection(window.db,'users'), fs.where('__name__','in',chunks[ci])));
          uSnap.docs.forEach(function(d){ knownUsers[d.id] = Object.assign({id:d.id}, d.data()); });
        }
      }

      // Construir lista
      _jugadoresAll = allIds.map(function(id){
        var u = knownUsers[id] || { id: id, nick: id.slice(0,8)+'…', av: '' };
        var ts = presMap[id] || 0;
        var online = ts > now - 300000;
        return { id: id, nick: u.nick||u.id, av: u.av||'', online: online, ts: ts, role: u.role||'' };
      }).filter(function(u){ return u.id !== (window.CU&&window.CU.id); });

      // Ordenar: online primero, luego por último visto
      _jugadoresAll.sort(function(a,b){
        if(a.online && !b.online) return -1;
        if(!a.online && b.online) return 1;
        return b.ts - a.ts;
      });

      renderJugadores(_jugadoresAll);

      // Contador en header
      var onlineCount = _jugadoresAll.filter(function(u){ return u.online; }).length;
      var countEl = document.getElementById('rf4OnlineCount');
      if(countEl) countEl.textContent = onlineCount+' en línea / '+_jugadoresAll.length+' jugadores';

    } catch(err){
      el.innerHTML='<div style="text-align:center;padding:24px;color:#8b949e;font-size:.8rem;">Error: '+esc(String(err.message||err))+'</div>';
    }
  }

  function renderJugadores(list){
    var el = document.getElementById('rf4JugadoresList');
    if(!el) return;
    if(!list.length){ el.innerHTML='<div style="text-align:center;padding:24px;color:#8b949e;font-size:.8rem;">Sin jugadores encontrados</div>'; return; }

    var onlineList  = list.filter(function(u){ return u.online; });
    var offlineList = list.filter(function(u){ return !u.online; });

    var html = '';
    if(onlineList.length){
      html += '<div style="padding:6px 12px 3px;font-size:.68rem;font-weight:700;color:#31a24c;text-transform:uppercase;letter-spacing:.08em;">● En línea — '+onlineList.length+'</div>';
      html += onlineList.map(playerRow).join('');
    }
    if(offlineList.length){
      html += '<div style="padding:8px 12px 3px;font-size:.68rem;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.08em;">○ Desconectados — '+offlineList.length+'</div>';
      html += offlineList.slice(0,40).map(playerRow).join('');
    }
    el.innerHTML = html;
  }

  function playerRow(u){
    var av = u.av ? '<img src="'+u.av+'" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">'
                  : '<span style="font-size:.8rem;font-weight:700;color:var(--accent);">'+(u.nick||'?')[0].toUpperCase()+'</span>';
    var badge = u.role==='admin' ? ' <span style="font-size:.58rem;background:#ff4444;color:#fff;padding:0 4px;border-radius:3px;">ADMIN</span>'
              : u.role==='premium' ? ' <span style="font-size:.6rem;color:#ffd700;">⭐</span>' : '';
    var dot = u.online
      ? '<div class="rf4-online-dot"></div>'
      : '<div class="rf4-offline-dot"></div>';
    var lastSeen = !u.online && u.ts ? ('<span style="font-size:.65rem;color:#555;">'+fmtT(u.ts)+'</span>') : '';

    return '<div class="rf4-player-row" onclick="openUserProfile(\''+u.id+'\',\''+esc(u.nick)+'\')">'+dot
      +'<div style="width:32px;height:32px;border-radius:50%;background:#21262d;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #30363d;">'+av+'</div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-size:.82rem;font-weight:700;color:#e6edf3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(u.nick)+badge+'</div>'
        +(lastSeen?'<div>'+lastSeen+'</div>':'')
      +'</div>'
      +(window.CU && u.id !== window.CU.id ? '<button onclick="event.stopPropagation();rf4SwitchTab(\'mensajes\');openChatWith(\''+u.id+'\',\''+esc(u.nick)+'\');" style="background:none;border:1px solid #30363d;color:#8b949e;padding:3px 8px;border-radius:4px;font-size:.7rem;cursor:pointer;flex-shrink:0;" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'#30363d\'">💬</button>' : '')
    +'</div>';
  }

  window.rf4FilterJugadores = function(val){
    if(!val){ renderJugadores(_jugadoresAll); return; }
    var q = val.toLowerCase();
    renderJugadores(_jugadoresAll.filter(function(u){ return (u.nick||'').toLowerCase().includes(q); }));
  };

  // ────────────────────────────────────────────────────────────
  // Hook openMessenger para iniciar chat global al abrir
  // ────────────────────────────────────────────────────────────
  var _origOpen = window.openMessenger;
  window.openMessenger = function(){
    if(typeof _origOpen === 'function') _origOpen();
    // Iniciar chat global si no está iniciado
    if(!_gcUnsub && window.db && window._fsLib) initGlobalChat();
    // Actualizar contador online
    updateOnlineCount();
  };

  function updateOnlineCount(){
    if(!window.db || !window._fsLib) return;
    var fs = window._fsLib;
    var now5m = new Date(Date.now()-300000);
    fs.getDocs(fs.query(fs.collection(window.db,'presence'), fs.where('last','>',now5m), fs.limit(200)))
      .then(function(snap){
        var count = snap.size;
        var el = document.getElementById('rf4OnlineCount');
        if(el) el.textContent = count+' en línea';
      }).catch(function(){});
  }

  // Exponer serverTimestamp para que sendGlobalMsg lo use (inyectado desde el módulo)
  // Se asume que window.firebaseFirestore existe si el módulo lo expone
  // Si no, se usa Date como fallback (ya manejado arriba)

  // ── Inicializar tabs al arrancar el messenger ───────────────
  window.addEventListener('DOMContentLoaded', function(){
    setTimeout(function(){
      if(window.db && window._fsLib) initGlobalChat();
    }, 3000);
  });

})();
