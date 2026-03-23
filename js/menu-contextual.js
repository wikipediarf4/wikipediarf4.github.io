(function(){
  var _ctxImgSrc = '';
  var _ctxScale = 1, _ctxPosX = 0, _ctxPosY = 0;

  // Interceptar variables de zoom del lightbox
  window._rf4ZoomState = { scale: 1, posX: 0, posY: 0 };

  window.rf4ContextMenu = function(e){
    e.preventDefault();
    var menu = document.getElementById('_rf4CtxMenu');
    if(!menu) return;
    // Posicionar menú
    var x = e.clientX, y = e.clientY;
    menu.style.display = 'block';
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 120) + 'px';
    // Guardar src
    _ctxImgSrc = e.target.src || '';
    // Guardar estado zoom
    var igImg = document.getElementById('_igImg');
    if(igImg){
      var t = igImg.style.transform || '';
      var scMatch = t.match(/scale\(([\d.]+)\)/);
      var txMatch = t.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      _ctxScale = scMatch ? parseFloat(scMatch[1]) : 1;
      _ctxPosX = txMatch ? parseFloat(txMatch[1]) : 0;
      _ctxPosY = txMatch ? parseFloat(txMatch[2]) : 0;
    }
  };

  // Cerrar menú al click fuera
  document.addEventListener('click', function(e){
    var menu = document.getElementById('_rf4CtxMenu');
    if(menu && !menu.contains(e.target)) menu.style.display = 'none';
  });

  window.rf4CtxLeerCompleta = function(){
    document.getElementById('_rf4CtxMenu').style.display = 'none';
    if(!_ctxImgSrc){ alert('No se encontró la imagen'); return; }
    window.leerEquipoTrofeo('ctx', _ctxImgSrc);
  };

  window.rf4CtxLeerZoom = function(){
    document.getElementById('_rf4CtxMenu').style.display = 'none';
    var igImg = document.getElementById('_igImg');
    var igCol = document.getElementById('_igImgCol');
    if(!igImg || !igCol){ alert('No se encontró la imagen'); return; }

    // Si no hay zoom, leer imagen completa
    if(_ctxScale <= 1.05){
      window.leerEquipoTrofeo('ctx', igImg.src);
      return;
    }

    // Capturar zona visible usando canvas
    try {
      var natW = igImg.naturalWidth;
      var natH = igImg.naturalHeight;
      var colW = igCol.clientWidth;
      var colH = igCol.clientHeight;

      // Calcular tamaño renderizado
      var ratio = Math.min(colW / natW, colH / natH);
      var rendW = natW * ratio;
      var rendH = natH * ratio;

      // Offset del centro
      var offX = (colW - rendW) / 2;
      var offY = (colH - rendH) / 2;

      // Con zoom y pan, la zona visible en coordenadas de imagen
      var visW = colW / _ctxScale;
      var visH = colH / _ctxScale;
      var centerX = (colW / 2 - _ctxPosX) / _ctxScale;
      var centerY = (colH / 2 - _ctxPosY) / _ctxScale;

      // Convertir a coordenadas de imagen natural
      var imgX = ((centerX - offX) / rendW) * natW;
      var imgY = ((centerY - offY) / rendH) * natH;
      var imgW = (visW / rendW) * natW;
      var imgH = (visH / rendH) * natH;

      // Clamp
      imgX = Math.max(0, imgX - imgW/2);
      imgY = Math.max(0, imgY - imgH/2);
      imgW = Math.min(natW - imgX, imgW);
      imgH = Math.min(natH - imgY, imgH);

      var canvas = document.createElement('canvas');
      canvas.width = Math.round(imgW);
      canvas.height = Math.round(imgH);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(igImg, imgX, imgY, imgW, imgH, 0, 0, canvas.width, canvas.height);
      var croppedUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Convertir a blob y mandar al Worker como base64 embebida
      window.leerEquipoTrofeo('ctx_zoom', croppedUrl);
    } catch(err) {
      // Fallback: imagen completa
      window.leerEquipoTrofeo('ctx', igImg.src);
    }
  };
})();
