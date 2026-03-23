(function(){
  var _selActive = false;
  var _selStart = null;
  var _selEnd = null;
  var _selRect = null;

  window.rf4ToggleSelect = function(){
    _selActive = !_selActive;
    var canvas = document.getElementById('_rf4SelectCanvas');
    var btn = document.getElementById('_rf4SelectBtn');
    var popup = document.getElementById('_rf4TranslatePopup');
    if(!canvas) return;
    if(_selActive){
      canvas.style.display = 'block';
      if(btn) btn.style.background = 'rgba(248,81,73,.85)';
      if(btn) btn.innerHTML = '✕ Cancelar';
      if(popup) popup.style.display = 'none';
      _selStart = null; _selEnd = null; _selRect = null;
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);
    } else {
      rf4CancelSelect();
    }
  };

  window.rf4CancelSelect = function(){
    _selActive = false;
    var canvas = document.getElementById('_rf4SelectCanvas');
    var btn = document.getElementById('_rf4SelectBtn');
    var popup = document.getElementById('_rf4TranslatePopup');
    if(canvas){ canvas.style.display = 'none'; }
    if(btn){ btn.style.background = 'rgba(46,196,182,.85)'; btn.innerHTML = '✂️ Marcar zona'; }
    if(popup){ popup.style.display = 'none'; }
    _selStart = null; _selEnd = null; _selRect = null;
  };

  function getCanvasPos(canvas, e){
    var r = canvas.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function drawSelection(canvas, start, end){
    var ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Overlay oscuro
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Zona seleccionada clara
    var x = Math.min(start.x, end.x);
    var y = Math.min(start.y, end.y);
    var w = Math.abs(end.x - start.x);
    var h = Math.abs(end.y - start.y);
    ctx.clearRect(x, y, w, h);
    // Borde teal
    ctx.strokeStyle = '#2ec4b6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6,3]);
    ctx.strokeRect(x, y, w, h);
    return {x, y, w, h};
  }

  document.addEventListener('mousedown', function(e){
    if(!_selActive) return;
    var canvas = document.getElementById('_rf4SelectCanvas');
    if(!canvas || !canvas.contains(e.target)) return;
    e.preventDefault();
    _selStart = getCanvasPos(canvas, e);
    _selEnd = _selStart;
    var popup = document.getElementById('_rf4TranslatePopup');
    if(popup) popup.style.display = 'none';
  });

  document.addEventListener('mousemove', function(e){
    if(!_selActive || !_selStart) return;
    var canvas = document.getElementById('_rf4SelectCanvas');
    if(!canvas) return;
    _selEnd = getCanvasPos(canvas, e);
    _selRect = drawSelection(canvas, _selStart, _selEnd);
  });

  document.addEventListener('mouseup', function(e){
    if(!_selActive || !_selStart) return;
    var canvas = document.getElementById('_rf4SelectCanvas');
    if(!canvas) return;
    _selEnd = getCanvasPos(canvas, e);
    _selRect = drawSelection(canvas, _selStart, _selEnd);
    if(_selRect && _selRect.w > 10 && _selRect.h > 10){
      var popup = document.getElementById('_rf4TranslatePopup');
      if(popup){
        popup.style.display = 'flex';
        popup.style.left = Math.min(_selRect.x + _selRect.w + 6, window.innerWidth - 220) + 'px';
        popup.style.top = (_selRect.y + _selRect.h/2 - 20) + 'px';
      }
    }
    _selStart = null;
  });

  window.rf4TranslateSelection = function(){
    var canvas = document.getElementById('_rf4SelectCanvas');
    var igImg = document.getElementById('_igImg');
    var igCol = document.getElementById('_igImgCol');
    if(!canvas || !igImg || !_selRect) return;

    try {
      var imgRect = igImg.getBoundingClientRect();
      var colRect = igCol.getBoundingClientRect();

      // Posicion de la seleccion en coordenadas de pantalla
      var screenX = colRect.left + _selRect.x;
      var screenY = colRect.top + _selRect.y;
      var relX = Math.max(0, screenX - imgRect.left);
      var relY = Math.max(0, screenY - imgRect.top);

      // Escala imagen renderizada -> natural
      var scaleX = igImg.naturalWidth / imgRect.width;
      var scaleY = igImg.naturalHeight / imgRect.height;

      var cropX = relX * scaleX;
      var cropY = relY * scaleY;
      var cropW = Math.min(igImg.naturalWidth - cropX, _selRect.w * scaleX);
      var cropH = Math.min(igImg.naturalHeight - cropY, _selRect.h * scaleY);

      // Porcentajes para fallback
      var pctX = Math.round(relX / imgRect.width * 100);
      var pctY = Math.round(relY / imgRect.height * 100);
      var pctW = Math.round(_selRect.w / imgRect.width * 100);
      var pctH = Math.round(_selRect.h / imgRect.height * 100);

      var tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = Math.max(1, Math.round(cropW));
      tmpCanvas.height = Math.max(1, Math.round(cropH));
      var ctx2 = tmpCanvas.getContext('2d');
      ctx2.drawImage(igImg, cropX, cropY, cropW, cropH, 0, 0, tmpCanvas.width, tmpCanvas.height);

      var croppedUrl = '';
      try { croppedUrl = tmpCanvas.toDataURL('image/jpeg', 0.95); } catch(e) { croppedUrl = ''; }

      rf4CancelSelect();

      if(croppedUrl && croppedUrl.length > 1000) {
        window.leerEquipoTrofeo('seleccion', croppedUrl, true);
      } else {
        // CORS fallback: recargar imagen con crossOrigin y reintentar
        var corsImg = new Image();
        corsImg.crossOrigin = 'anonymous';
        corsImg.onload = function(){
          try {
            var tmpC2 = document.createElement('canvas');
            tmpC2.width = Math.max(1, Math.round(cropW));
            tmpC2.height = Math.max(1, Math.round(cropH));
            tmpC2.getContext('2d').drawImage(corsImg, cropX, cropY, cropW, cropH, 0, 0, tmpC2.width, tmpC2.height);
            var url2 = tmpC2.toDataURL('image/jpeg', 0.95);
            window.leerEquipoTrofeo('seleccion', url2, true);
          } catch(e2) {
            window.leerEquipoTrofeoZona(igImg.src, pctX, pctY, pctW, pctH);
          }
        };
        corsImg.onerror = function(){ window.leerEquipoTrofeoZona(igImg.src, pctX, pctY, pctW, pctH); };
        // Agregar timestamp para evitar cache
        corsImg.src = igImg.src + (igImg.src.includes('?') ? '&' : '?') + '_t=' + Date.now();
      }
    } catch(err) {
      rf4CancelSelect();
      window.leerEquipoTrofeoZona(igImg.src, 0, 0, 100, 100);
    }
  };

  window.leerEquipoTrofeoZona = async function(imgUrl, pctX, pctY, pctW, pctH){
    var modal = document.getElementById('_rf4EquipoModal');
    if(!modal){
      modal = document.createElement('div');
      modal.id = '_rf4EquipoModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
      modal.onclick = function(e){ if(e.target===modal) modal.remove(); };
      document.body.appendChild(modal);
    }
    modal.innerHTML = '<div style="background:#161b22;border:1px solid rgba(46,196,182,.35);border-radius:16px;padding:24px 20px;max-width:420px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,.7);">'
      + '<div style="font-size:1.5rem;margin-bottom:10px;">🔍</div>'
      + '<div style="font-family:Orbitron,monospace;font-size:.9rem;font-weight:900;color:#2ec4b6;margin-bottom:6px;">TRADUCIENDO ZONA</div>'
      + '<div style="font-size:.78rem;color:#8b949e;margin-bottom:16px;">Analizando zona marcada...</div>'
      + '<div style="display:flex;justify-content:center;gap:6px;">'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out infinite;"></span>'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out .2s infinite;"></span>'
      + '<span style="width:8px;height:8px;border-radius:50%;background:#2ec4b6;animation:rf4dot 1.2s ease-in-out .4s infinite;"></span>'
      + '</div></div>';
    try {
      var apiRes = await fetch('https://wrf4-ai.synxyes.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'traducir_zona', imageUrl: imgUrl, zona: { x: pctX, y: pctY, w: pctW, h: pctH } })
      });
      var apiData = await apiRes.json();
      var reply = apiData.reply || 'No se pudo traducir.';
      var formatted = reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      modal.innerHTML = '<div style="background:#161b22;border:1px solid rgba(46,196,182,.35);border-radius:16px;padding:24px 20px;max-width:460px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.7);max-height:80vh;overflow-y:auto;">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
        + '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2ec4b6,#1a6a64);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🔍</div>'
        + '<div><div style="font-family:Orbitron,monospace;font-size:.85rem;font-weight:900;color:#2ec4b6;">TRADUCCIÓN</div><div style="font-size:.7rem;color:#8b949e;">Solo español</div></div>'
        + '<button onclick="document.getElementById(&quot;_rf4EquipoModal&quot;).remove()" style="margin-left:auto;background:none;border:none;color:#8b949e;font-size:1.1rem;cursor:pointer;">✕</button>'
        + '</div>'
        + '<div style="background:#1c2128;border:1px solid #30363d;border-radius:10px;padding:14px;font-size:.84rem;line-height:1.7;color:#e6edf3;">' + formatted + '</div>'
        + '<div style="margin-top:10px;font-size:.68rem;color:#8b949e;text-align:center;">WikiPediaRF4.UY</div></div>';
    } catch(e) {
      modal.innerHTML = '<div style="background:#161b22;padding:24px;text-align:center;border-radius:16px;"><div style="color:#f85149;">Error al traducir</div></div>';
    }
  };
})();
