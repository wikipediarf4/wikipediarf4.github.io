(function(){

  // Modal container
  function getOrCreateModal(){
    var m = document.getElementById('_rf4EquipoModal');
    if(m) return m;
    m = document.createElement('div');
    m.id = '_rf4EquipoModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    m.onclick = function(e){ if(e.target===m) m.remove(); };
    document.body.appendChild(m);
    return m;
  }

  // Llamado desde el lightbox
  window.leerEquipoLightbox = function(){
    // Try multiple selectors to find the image
    var img = document.getElementById('_igImg') 
           || document.querySelector('#_igImgCol img')
           || document.querySelector('#_igModal img');
    var src = img ? img.src : '';
    if(!src){ 
      alert('No se encontró la imagen');
      return; 
    }
    window.leerEquipoTrofeo('lightbox', src);
  };

  window.leerEquipoTrofeo = async function(tid, imgUrl, isSeleccion){
    if(!imgUrl){ console.error('Sin imagen'); return; }

    // Show modal with loading
    var modal = getOrCreateModal();
    var loadingText = isSeleccion ? 'Traduciendo zona seleccionada...' : 'La IA está leyendo el equipo del trofeo...';
    modal.innerHTML = '<div style="background:#161b22;border:1px solid rgba(46,196,182,.35);border-radius:16px;padding:24px 20px;max-width:420px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.7);">'
      + '<div style="font-size:1.5rem;margin-bottom:10px;">🔍</div>'
      + '<div style="font-family:Orbitron,monospace;font-size:.9rem;font-weight:900;color:#2ec4b6;margin-bottom:6px;">' + (isSeleccion ? 'TRADUCIENDO SELECCIÓN' : 'ANALIZANDO IMAGEN') + '</div>'
      + '<div style="font-size:.78rem;color:#8b949e;margin-bottom:16px;">' + loadingText + '</div>'
      + '<div style="display:flex;justify-content:center;gap:6px;">'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out infinite;"></span>'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out .2s infinite;"></span>'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out .4s infinite;"></span>'
      + '</div></div>';

    try {
      var reqBody;
      if(imgUrl.startsWith('data:')) {
        reqBody = { action: isSeleccion ? 'traducir_seleccion' : 'leer_equipo_base64', imageData: imgUrl };
      } else {
        reqBody = { action: 'leer_equipo', imageUrl: imgUrl };
      }

      var apiRes = await fetch('https://wrf4-ai.synxyes.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      var apiData = await apiRes.json();
      var reply = apiData.reply || 'No se pudo leer el equipo de la imagen.';

      // Format reply
      var formatted = reply
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
        .replace(/\*(.*?)\*/g,'<i>$1</i>')
        .replace(/\n/g,'<br>');

      modal.innerHTML = '<div style="background:#161b22;border:1px solid rgba(46,196,182,.35);border-radius:16px;padding:24px 20px;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.7);max-height:80vh;overflow-y:auto;">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
        + '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2ec4b6,#1a6a64);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🔍</div>'
        + '<div><div style="font-family:Orbitron,monospace;font-size:.85rem;font-weight:900;color:#2ec4b6;">EQUIPO DETECTADO</div>'
        + '<div style="font-size:.7rem;color:#8b949e;">Análisis IA de la imagen</div></div>'
        + '<button onclick="document.getElementById(&quot;_rf4EquipoModal&quot;).remove()" style="margin-left:auto;background:none;border:none;color:#8b949e;font-size:1.1rem;cursor:pointer;padding:4px;">✕</button>'
        + '</div>'
        + '<div style="background:#1c2128;border:1px solid #30363d;border-radius:10px;padding:14px;font-size:.84rem;line-height:1.7;color:#e6edf3;">'
        + formatted
        + '</div>'
        + '<div style="margin-top:12px;font-size:.68rem;color:#8b949e;text-align:center;">Powered by WikiPediaRF4.UY · Gemini Vision</div>'
        + '</div>';

    } catch(e) {
      modal.innerHTML = '<div style="background:#161b22;border:1px solid rgba(248,81,73,.35);border-radius:16px;padding:24px 20px;max-width:400px;width:100%;text-align:center;">'
        + '<div style="font-size:1.5rem;margin-bottom:8px;">⚠️</div>'
        + '<div style="font-size:.85rem;color:#f85149;margin-bottom:12px;">No se pudo analizar la imagen</div>'
        + '<button onclick="document.getElementById(&quot;_rf4EquipoModal&quot;).remove()" style="background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:8px 20px;border-radius:8px;cursor:pointer;font-family:Exo 2,sans-serif;">Cerrar</button>'
        + '</div>';
    }
  };

})();
