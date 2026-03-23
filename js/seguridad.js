(function(){
  'use strict';

  // ── 1. BLOQUEAR CLIC DERECHO ──────────────────────────────────────────────
  document.addEventListener('contextmenu', function(e){
    e.preventDefault();
    return false;
  });

  // ── 2. BLOQUEAR ATAJOS DE TECLADO PELIGROSOS ─────────────────────────────
  document.addEventListener('keydown', function(e){
    var k = e.key || e.keyCode;
    // F12
    if(k === 'F12' || k === 123){ e.preventDefault(); return false; }
    // Ctrl+U (ver fuente), Ctrl+S (guardar), Ctrl+Shift+I/J/C (devtools)
    if(e.ctrlKey && (
      k === 'u' || k === 'U' ||
      k === 's' || k === 'S' ||
      ((e.shiftKey) && (k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'c' || k === 'C'))
    )){ e.preventDefault(); return false; }
    // Ctrl+A (seleccionar todo)
    if(e.ctrlKey && (k === 'a' || k === 'A')){ e.preventDefault(); return false; }
  });

  // ── 3. DESHABILITAR SELECCIÓN Y COPIA DE TEXTO ───────────────────────────
  document.addEventListener('selectstart', function(e){ e.preventDefault(); return false; });
  document.addEventListener('copy',        function(e){ e.preventDefault(); return false; });
  document.addEventListener('cut',         function(e){ e.preventDefault(); return false; });
  document.addEventListener('dragstart',   function(e){ e.preventDefault(); return false; });

  // CSS para deshabilitar selección visual
  var selStyle = document.createElement('style');
  selStyle.textContent = '*{-webkit-user-select:none!important;-moz-user-select:none!important;-ms-user-select:none!important;user-select:none!important;}input,textarea{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important;}';
  document.head.appendChild(selStyle);

  // ── 4. DETECTAR DEVTOOLS ABIERTO ─────────────────────────────────────────
  var _devOpen = false;
  var _devMsg  = null;

  function _showDevWarning(){
    if(_devMsg) return;
    _devMsg = document.createElement('div');
    _devMsg.id = '_rf4SecMsg';
    _devMsg.style.cssText = [
      'position:fixed','inset:0','background:rgba(13,17,23,.97)',
      'z-index:999999','display:flex','flex-direction:column',
      'align-items:center','justify-content:center','gap:16px',
      'font-family:Orbitron,monospace'
    ].join(';');
    _devMsg.innerHTML = ''
      + '<div style="font-size:2.5rem;">🔒</div>'
      + '<div style="color:#f85149;font-size:1rem;font-weight:900;letter-spacing:2px;">ACCESO RESTRINGIDO</div>'
      + '<div style="color:#8b949e;font-size:.78rem;text-align:center;max-width:320px;font-family:Exo 2,sans-serif;line-height:1.6;">'
      + 'Las herramientas de desarrollador están deshabilitadas en este sitio.<br>Por favor cerrá DevTools para continuar.'
      + '</div>'
      + '<div style="color:#2ec4b6;font-size:.65rem;letter-spacing:1px;">WikiPediaRF4.UY</div>';
    document.body.appendChild(_devMsg);
  }

  function _hideDevWarning(){
    if(_devMsg){ _devMsg.remove(); _devMsg = null; }
  }

  // Método 1: diferencia de tamaño de ventana
  function _checkBySize(){
    var threshold = 160;
    var widthDiff  = window.outerWidth  - window.innerWidth;
    var heightDiff = window.outerHeight - window.innerHeight;
    return widthDiff > threshold || heightDiff > threshold;
  }

  // Método 2: truco con toString de función (solo Chromium)
  var _devToolsOpen = false;
  (function _devTrick(){
    var _x = { toString: function(){ _devToolsOpen = true; return ''; } };
    // Este console.log activa el toString si devtools está abierto
    // Solo se ejecuta silenciosamente
    try{ console.log('%c', _x); }catch(e){}
  })();

  setInterval(function(){
    var open = _checkBySize() || _devToolsOpen;
    _devToolsOpen = false; // reset para próxima vuelta
    if(open && !_devOpen){
      _devOpen = true;
      _showDevWarning();
    } else if(!open && _devOpen){
      _devOpen = false;
      _hideDevWarning();
    }
  }, 1000);

  // ── 5. ANTI-SCRAPING / HONEYPOT ──────────────────────────────────────────
  // Trampas invisibles: bots que sigan links ocultos quedan registrados
  window.addEventListener('DOMContentLoaded', function(){
    var trap = document.createElement('div');
    trap.setAttribute('aria-hidden','true');
    trap.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
    trap.innerHTML = ''
      + '<a href="/trap-login" class="hp-link" tabindex="-1">Admin Login</a>'
      + '<a href="/trap-api" class="hp-link" tabindex="-1">API Endpoint</a>'
      + '<a href="/trap-data" class="hp-link" tabindex="-1">User Data</a>'
      + '<input type="text" name="username" class="hp-input" tabindex="-1" autocomplete="off">'
      + '<input type="password" name="password" class="hp-input" tabindex="-1" autocomplete="off">';
    document.body.appendChild(trap);

    // Si un bot completa el honeypot, lo registramos y redirigimos
    trap.querySelectorAll('.hp-input').forEach(function(inp){
      inp.addEventListener('change', function(){
        // Bot detectado: registrar y confundir
        try{
          fetch('https://wrf4-ai.synxyes.workers.dev', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ action:'bot_detected', ua: navigator.userAgent, ts: Date.now() })
          }).catch(function(){});
        }catch(e){}
        window.location.href = '/';
      });
    });

    trap.querySelectorAll('.hp-link').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        window.location.href = '/';
      });
    });
  });

  // ── 6. PROTECCIÓN EXTRA: deshabilitar arrastrar imágenes ─────────────────
  window.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('img').forEach(function(img){
      img.setAttribute('draggable','false');
      img.addEventListener('dragstart', function(e){ e.preventDefault(); });
    });
    // Observer para imágenes cargadas dinámicamente
    var obs = new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(n.nodeType===1){
            if(n.tagName==='IMG'){ n.setAttribute('draggable','false'); }
            n.querySelectorAll && n.querySelectorAll('img').forEach(function(i){ i.setAttribute('draggable','false'); });
          }
        });
      });
    });
    obs.observe(document.body, { childList:true, subtree:true });
  });

})();
