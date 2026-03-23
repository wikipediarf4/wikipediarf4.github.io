(function(){
  'use strict';

  var WORKER_URL = 'https://wrf4-ai.synxyes.workers.dev';
  var _ytUploading = false;

  // Toast seguro — usa el global si existe, si no usa alert
  function _toast(msg, type){
    if(typeof window.toast === 'function') window.toast(msg, type||'inf');
    else if(type === 'err') alert(msg);
  }

  // ── Bloquear/desbloquear botón Publicar ─────────────────
  function _lockPublish(lock){
    _ytUploading = lock;
    var btn = document.querySelector('#mCreatePost .btn-p');
    if(!btn) return;
    if(lock){
      btn.disabled = true;
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
      btn.textContent = '⏳ Subiendo video...';
    } else {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
      btn.textContent = 'Publicar';
    }
  }

  // ── Toggle link input ────────────────────────────────────
  window.ytToggleLink = function(){
    var box = document.getElementById('ytLinkBox');
    if(box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
  };

  // ── Mensaje de estado ────────────────────────────────────
  function _setStatusMsg(msg, color){
    var el = document.getElementById('_ytStatusMsg');
    if(!el) return;
    el.textContent = msg;
    el.style.color = color || 'var(--muted)';
    if(color === 'var(--green)'){
      el.style.background = 'rgba(63,185,80,.08)';
      el.style.borderColor = 'rgba(63,185,80,.3)';
    } else if(color === 'var(--red)'){
      el.style.background = 'rgba(248,81,73,.08)';
      el.style.borderColor = 'rgba(248,81,73,.3)';
    } else {
      el.style.background = 'rgba(255,170,0,.08)';
      el.style.borderColor = 'rgba(255,170,0,.25)';
    }
  }

  // ── Vista previa local inmediata ─────────────────────────
  function _showLocalPreview(file){
    var statusEl = document.getElementById('ytUploadStatus');
    if(!statusEl) return;
    var sizeMB = (file.size / (1024*1024)).toFixed(1);
    var localUrl = URL.createObjectURL(file);
    statusEl.style.display = 'block';
    statusEl.innerHTML =
      '<div style="margin-bottom:6px;font-size:.78rem;color:var(--accent);font-weight:700;">📁 ' + file.name + ' (' + sizeMB + ' MB)</div>'
      + '<video src="' + localUrl + '" controls style="width:100%;max-height:200px;border-radius:var(--rs);background:#000;display:block;" preload="metadata"></video>'
      + '<div id="_ytStatusMsg" style="margin-top:6px;font-size:.76rem;padding:6px 10px;background:rgba(255,170,0,.08);border:1px solid rgba(255,170,0,.25);border-radius:6px;color:var(--warn);">⏳ Subiendo a YouTube... no cierres esta ventana</div>';
  }

  // ── Iniciar subida ───────────────────────────────────────
  window.ytSubirVideo = function(){
    if(!window.CU){ alert('Tenés que estar logueado.'); return; }
    if(_ytUploading){ _toast('Ya hay un video subiendo, esperá','inf'); return; }

    var inp = document.getElementById('_ytFileInput');
    if(!inp) return;
    inp.value = '';

    inp.onchange = function(){
      if(!inp.files || !inp.files[0]) return;
      var file = inp.files[0];
      // Sin límite de tamaño — upload resumible directo a YouTube
      _showLocalPreview(file);
      _lockPublish(true);
      _ytUpload(file);
    };
    inp.click();
  };

  // ── Subir via Worker ─────────────────────────────────────
  async function _ytUpload(file){
    try{
      _setStatusMsg('⏳ Subiendo a YouTube via servidor...', 'var(--warn)');

      var resp = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'X-Action':     'yt_upload',
          'X-File-Type':  file.type,
          'X-File-Size':  String(file.size),
          'X-User-Nick':  window.CU.nick || window.CU.id,
          'Content-Type': file.type
        },
        body: file
      });

      var data = await resp.json();
      if(data.error) throw new Error(data.error);
      if(!data.videoId) throw new Error('No se obtuvo ID del video');

      var ytLink = data.videoUrl;

      // Guardar URL en el input del post
      var ytInp = document.getElementById('ytUrlInput');
      if(ytInp){
        var linkBox = document.getElementById('ytLinkBox');
        if(linkBox) linkBox.style.display = 'block';
        ytInp.value = ytLink;
      }

      // Guardar en Firestore como pendiente
      try{
        var fi = window._fsLib || {};
        if(fi.addDoc && fi.collection && window.db){
          await fi.addDoc(fi.collection(window.db,'videoPendientes'),{
            videoId:     data.videoId,
            videoUrl:    ytLink,
            userId:      window.CU.id,
            userNick:    window.CU.nick || window.CU.id,
            userAv:      window.CU.av || '',
            status:      'pending',
            submittedAt: new Date().toISOString()
          });
        }
      }catch(fe){ console.warn('videoPendientes:', fe); }

      window._ytUploadedThisSession = true;
      _lockPublish(false);
      _setStatusMsg('✅ Video listo! Podés publicar — quedará pendiente de aprobación', 'var(--green)');
      _toast('✅ Video subido — ahora hacé click en Publicar','ok');

    }catch(e){
      _setStatusMsg('❌ Error: ' + e.message, 'var(--red)');
      _toast('Error al subir: ' + e.message, 'err');
      _lockPublish(false);
    }
  }

})();
