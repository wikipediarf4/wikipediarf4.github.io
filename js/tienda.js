(function(){
  'use strict';

  var _tiendaItems       = [];
  var _tiendaIADataMulti = [];

  function _isAdmin(){
    return window.CU && (
      window.CU.role === 'admin' ||
      window.CU.nick === 'ruizgustavo12' ||
      window.CU.email === 'synxyes@gmail.com'
    );
  }

  function tiendaCheckAdmin(){
    var btn = document.getElementById('slTiendaBtn');
    if(btn) btn.style.display = _isAdmin() ? 'flex' : 'none';
  }
  setInterval(tiendaCheckAdmin, 1200);

  // ── Cargar desde Firestore ───────────────────────────────
  function tiendaLoad(){
    if(!window.db){ setTimeout(tiendaLoad, 800); return; }
    try{
      var fi = window._fsImports || {};
      if(!fi.collection){ setTimeout(tiendaLoad, 800); return; }
      var q = fi.query(fi.collection(window.db,'tienda_items'), fi.orderBy('nombre','asc'));
      fi.onSnapshot(q, function(snap){
        _tiendaItems = snap.docs.map(function(d){ return Object.assign({_id:d.id}, d.data()); });
        tiendaRender();
      });
    }catch(e){ setTimeout(tiendaLoad,1000); }
  }

  // ── Render con agrupado por nombre + desplegable ─────────
  window.tiendaRender = function(){
    var list  = document.getElementById('tiendaList');
    if(!list) return;
    var q     = (document.getElementById('tiendaSearch')?.value||'').toLowerCase().trim();
    var tipo  = document.getElementById('tiendaFilter')?.value||'';
    var admin = _isAdmin();

    var items = _tiendaItems.filter(function(it){
      var mq = !q || (it.nombre||'').toLowerCase().includes(q) || (it.tipo||'').toLowerCase().includes(q);
      var mt = !tipo || it.tipo === tipo;
      return mq && mt;
    });

    if(!items.length){
      list.innerHTML = '<div class="tienda-empty">No hay ítems.<br><span style="font-size:.74rem;">Usá 📸 Agregar con IA</span></div>';
      return;
    }

    // Agrupar por nombre
    var groups = {};
    items.forEach(function(it){
      var k = (it.nombre||'Sin nombre').trim();
      if(!groups[k]) groups[k] = [];
      groups[k].push(it);
    });

    var html = '<div class="tienda-grid">';
    Object.keys(groups).forEach(function(nombre){
      var grupo = groups[nombre];
      var it    = grupo[0];
      html += _tiendaCardHTML(nombre, grupo, it, admin);
    });
    html += '</div>';
    list.innerHTML = html;
  };

  function _tiendaCardHTML(nombre, grupo, it, admin){
    var imgHtml = it.imagen
      ? '<img src="'+it.imagen+'" style="max-width:85%;max-height:110px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.7));" onerror="this.style.opacity=.1">'
      : '<span style="font-size:3rem;opacity:.2;">🎣</span>';

    var precio = '';
    var statsHtml = '';
    if(it.stats){
      Object.entries(it.stats).forEach(function(e){
        if((e[0]||'').toLowerCase().includes('precio')){
          precio = '<div class="tienda-precio" style="color:#ffd700;font-weight:700;font-size:.88rem;margin:5px 0 3px;">₴ '+e[1]+'</div>';
        } else {
          statsHtml += '<div><span style="color:#8b949e;font-size:.7rem;">'+e[0]+':</span> <b style="color:#e6edf3;font-size:.7rem;">'+e[1]+'</b></div>';
        }
      });
    }

    // Selector variantes si hay más de 1
    var selector = '';
    if(grupo.length > 1){
      var idsJson = JSON.stringify(grupo.map(function(g){ return g._id; }));
      selector = '<select onchange="tiendaSelectVariant(this,'+idsJson.replace(/"/g,'&quot;')+')" '
        +'style="width:100%;background:#21262d;border:1px solid #30363d;border-radius:5px;color:#e6edf3;'
        +'padding:4px 8px;font-size:.72rem;font-family:Exo 2,sans-serif;margin-bottom:6px;outline:none;">';
      grupo.forEach(function(g,i){
        var lbl = g.descripcion || g.tipo || ('Variante '+(i+1));
        selector += '<option value="'+g._id+'">'+lbl+'</option>';
      });
      selector += '</select>';
    }

    var delBtn = admin
      ? '<button class="tienda-card-del" onclick="tiendaDelete(\''+it._id+'\',this)">🗑 Borrar</button>'
      : '';

    return '<div class="tienda-card" data-tid="'+it._id+'">'
      +'<div class="tienda-card-img">'+imgHtml+'</div>'
      +'<div class="tienda-card-body">'
      +'<div class="tienda-card-type">'+it.tipo+'</div>'
      +'<div class="tienda-card-name">'+nombre+'</div>'
      +selector
      +precio
      +'<div class="tienda-card-stats">'+statsHtml+'</div>'
      +delBtn
      +'</div></div>';
  }

  // ── Cambiar variante desplegable ─────────────────────────
  window.tiendaSelectVariant = function(sel, ids){
    var id = sel.value;
    var it = _tiendaItems.find(function(x){ return x._id === id; });
    if(!it) return;
    var card = sel.closest('.tienda-card');
    if(!card) return;

    var imgDiv = card.querySelector('.tienda-card-img');
    if(imgDiv) imgDiv.innerHTML = it.imagen
      ? '<img src="'+it.imagen+'" style="max-width:85%;max-height:110px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.7));">'
      : '<span style="font-size:3rem;opacity:.2;">🎣</span>';

    var precio = ''; var statsHtml = '';
    if(it.stats){
      Object.entries(it.stats).forEach(function(e){
        if((e[0]||'').toLowerCase().includes('precio'))
          precio = '<div class="tienda-precio" style="color:#ffd700;font-weight:700;font-size:.88rem;margin:5px 0 3px;">₴ '+e[1]+'</div>';
        else
          statsHtml += '<div><span style="color:#8b949e;font-size:.7rem;">'+e[0]+':</span> <b style="color:#e6edf3;font-size:.7rem;">'+e[1]+'</b></div>';
      });
    }
    var pEl = card.querySelector('.tienda-precio');
    if(pEl) pEl.outerHTML = precio;
    var sEl = card.querySelector('.tienda-card-stats');
    if(sEl) sEl.innerHTML = statsHtml;

    var delEl = card.querySelector('.tienda-card-del');
    if(_isAdmin()){
      if(!delEl){
        var b = document.createElement('button');
        b.className = 'tienda-card-del'; b.textContent = '🗑 Borrar';
        b.onclick = function(){ tiendaDelete(id,b); };
        card.querySelector('.tienda-card-body').appendChild(b);
      } else { delEl.onclick = function(){ tiendaDelete(id,delEl); }; }
    }
    card.dataset.tid = id;
  };

  // ── Borrar ───────────────────────────────────────────────
  window.tiendaDelete = async function(docId, btn){
    if(!_isAdmin()){ alert('Solo admins.'); return; }
    if(!confirm('¿Borrar este ítem?')) return;
    btn.disabled = true; btn.textContent = '⏳...';
    try{
      var lib = window._fsLib || {};
      if(!lib.deleteDoc) throw new Error('Firestore no disponible');
      await lib.deleteDoc(lib.doc(window.db,'tienda_items',docId));
    }catch(e){
      alert('Error: '+e.message);
      btn.disabled = false; btn.textContent = '🗑 Borrar';
    }
  };

  // ── Abrir modal IA ───────────────────────────────────────
  window.tiendaAbrirIA = function(){
    if(!window.CU){ alert('Tenés que estar logueado.'); return; }
    if(!_isAdmin()){ alert('Solo admins.'); return; }
    var m = document.getElementById('tiendaIAModal');
    if(m){ m.style.display = 'flex'; }
    window.tiendaIAReset();
  };

  window.tiendaIAReset = function(){
    _tiendaIADataMulti = [];
    ['tiendaIALoading','tiendaIAResult','tiendaIAError'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });
    var dz = document.getElementById('tiendaIADropZone');
    if(dz) dz.style.display = 'block';
    var pv = document.getElementById('tiendaIAPreviews');
    if(pv){ pv.style.display = 'none'; pv.innerHTML = ''; }
    var inp = document.getElementById('tiendaIAFileInput');
    if(inp) inp.value = '';
    var pb = document.getElementById('tiendaIAPublishBtn');
    if(pb){ pb.style.display = ''; pb.disabled = false; pb.textContent = '🚀 Agregar a la Tienda'; }
  };

  // ── Comprimir imagen a thumbnail base64 ──────────────────
  function comprimirImagen(dataUrl, maxW, maxH, quality){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = function(){
        var ratio = Math.min(maxW/img.width, maxH/img.height, 1);
        var w = Math.round(img.width * ratio);
        var h = Math.round(img.height * ratio);
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality || 0.7));
      };
      img.onerror = function(){ resolve(''); };
      img.src = dataUrl;
    });
  }

  // ── Recortar lado izquierdo (imagen del carrete) ─────────
  function recortarCarrete(dataUrl){
    return new Promise(function(resolve){
      var img = new Image();
      img.onload = function(){
        // El carrete ocupa aprox el 35% izquierdo de la pantalla
        var cropW = Math.round(img.width * 0.38);
        var cropH = img.height;
        var canvas = document.createElement('canvas');
        var targetW = 200; var targetH = Math.round(cropH * (targetW/cropW));
        canvas.width = targetW; canvas.height = targetH;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cropW, cropH, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = function(){ resolve(''); };
      img.src = dataUrl;
    });
  }

  // ── Leer con IA ──────────────────────────────────────────
  window.tiendaLeerIA = async function(input){
    if(!input.files || !input.files.length) return;
    var files = Array.from(input.files).slice(0,5);
    var tipo  = document.getElementById('tiendaIATipo')?.value || 'Carrete';

    var pvBox = document.getElementById('tiendaIAPreviews');
    if(pvBox){
      pvBox.style.display = 'flex'; pvBox.innerHTML = '';
      files.forEach(function(f){
        pvBox.innerHTML += '<img src="'+URL.createObjectURL(f)+'" style="height:60px;width:auto;border-radius:6px;border:1px solid #30363d;object-fit:cover;">';
      });
    }
    document.getElementById('tiendaIADropZone').style.display = 'none';
    document.getElementById('tiendaIALoading').style.display  = 'block';
    document.getElementById('tiendaIAResult').style.display   = 'none';
    document.getElementById('tiendaIAError').style.display    = 'none';

    _tiendaIADataMulti = [];
    var errores = 0;

    for(var i = 0; i < files.length; i++){
      var pb = document.getElementById('tiendaIAProgressBar');
      var lt = document.getElementById('tiendaIALoadingText');
      if(pb) pb.style.width = Math.round(i/files.length*100)+'%';
      if(lt) lt.textContent = '🤖 Procesando imagen '+(i+1)+' de '+files.length+'...';

      try{
        // Leer archivo
        var dataUrl = await new Promise(function(res,rej){
          var r = new FileReader();
          r.onload = function(ev){ res(ev.target.result); };
          r.onerror = rej;
          r.readAsDataURL(files[i]);
        });

        // Comprimir para enviar a la IA (más rápido)
        var dataUrlComprimido = await comprimirImagen(dataUrl, 1200, 900, 0.85);

        // Recortar el carrete del lado izquierdo para la imagen de la tarjeta
        var imagenCarrete = await recortarCarrete(dataUrl);
        // Comprimir thumbnail a ~150x120 máximo
        var thumbnail = await comprimirImagen(imagenCarrete, 150, 120, 0.72);

        // Enviar a la IA
        var resp = await fetch('https://wrf4-ai.synxyes.workers.dev',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            action: 'leer_cafe_base64',
            imageData: dataUrlComprimido,
            forcePrompt: 'Sos un asistente de Russian Fishing 4. Analizá esta imagen de la tienda del juego. Para CADA ítem visible en el lado DERECHO de la imagen extraé sus datos. Respondé ÚNICAMENTE con un array JSON sin texto extra ni markdown. Cada objeto debe tener: nombre (texto exacto), tipo ("'+tipo+'"), descripcion (variante o descripcion corta), stats con los campos: Precio, Tamaño, Relacion_equipo, Arrastre_maximo, Prueba (si aparece). Ejemplo: [{"nombre":"Winner Trolling 10","tipo":"'+tipo+'","descripcion":"Tamaño 10","stats":{"Precio":"349,80","Tamaño":"10","Relacion_equipo":"5,1:1","Arrastre_maximo":"5,5 kg"}}]. Si hay varias variantes del mismo carrete (ej: Trolling 10, Trolling 20) ponelas TODAS en el array.'
          })
        });
        var data  = await resp.json();
        var reply = (data.reply||'').trim();

        var parsed = null;
        try{
          var clean = reply.replace(/```json|```/g,'').trim();
          var arrM  = clean.match(/\[[\s\S]*\]/);
          var objM  = clean.match(/\{[\s\S]*\}/);
          if(arrM){ parsed = JSON.parse(arrM[0]); if(!Array.isArray(parsed)) parsed=[parsed]; }
          else if(objM){ parsed = [JSON.parse(objM[0])]; }
        }catch(pe){ parsed = null; }

        if(parsed && parsed.length){
          // Si hay múltiples variantes del mismo carrete, asignamos el thumbnail a la primera
          // y las demás comparten la misma imagen
          parsed.forEach(function(it, pidx){
            if(it && it.nombre){
              _tiendaIADataMulti.push(Object.assign(
                {tipo:tipo, imagen: pidx===0 ? thumbnail : thumbnail, descripcion:''},
                it
              ));
            }
          });
        } else if(reply && reply.length > 5){
          var rls = reply.split('\n').filter(Boolean);
          var nombre = rls[0].replace(/[*#_\d\.\-:]/g,'').trim() || ('Ítem '+(i+1));
          var stats = {};
          rls.slice(1).forEach(function(l){
            var m = l.match(/^[\*\-]?\s*([^:]+):\s*(.+)/);
            if(m) stats[m[1].replace(/[*_]/g,'').trim()] = m[2].replace(/[*_]/g,'').trim();
          });
          _tiendaIADataMulti.push({nombre:nombre,tipo:tipo,imagen:thumbnail,descripcion:'',stats:stats});
        } else { errores++; }

      }catch(err){ errores++; }
    }

    if(document.getElementById('tiendaIAProgressBar'))
      document.getElementById('tiendaIAProgressBar').style.width = '100%';
    document.getElementById('tiendaIALoading').style.display = 'none';

    var rt = document.getElementById('tiendaIAResultText');
    if(!_tiendaIADataMulti.length){
      rt.innerHTML = '<div style="color:#f85149;font-weight:700;">⚠️ La IA no pudo leer ningún ítem. Probá con la captura del carrete individual (clic en el carrete en la tienda).</div>';
      document.getElementById('tiendaIAResult').style.display = 'block';
      document.getElementById('tiendaIAPublishBtn').style.display = 'none';
      return;
    }

    var html = '<div style="color:#ffd700;font-weight:700;font-size:.88rem;margin-bottom:10px;">✅ '
      +_tiendaIADataMulti.length+' ítem'+(_tiendaIADataMulti.length!==1?'s':'')+' detectado'
      +(_tiendaIADataMulti.length!==1?'s':'')
      +(errores?' <span style="color:#f85149;font-size:.75rem;">('+errores+' sin leer)</span>':'')+'</div>';

    _tiendaIADataMulti.forEach(function(it,idx){
      var sHtml = '';
      if(it.stats) Object.entries(it.stats).forEach(function(e){
        if((e[0]||'').toLowerCase().includes('precio'))
          sHtml += '<span style="color:#ffd700;font-weight:700;margin-right:8px;">₴ '+e[1]+'</span>';
        else
          sHtml += '<span style="margin-right:8px;font-size:.68rem;">'+e[0]+': <b>'+e[1]+'</b></span>';
      });
      html += '<div style="background:#1c2128;border:1px solid #30363d;border-radius:10px;padding:12px;margin-bottom:10px;display:flex;align-items:center;gap:12px;">'
        +(it.imagen
          ? '<img src="'+it.imagen+'" style="width:56px;height:56px;object-fit:contain;flex-shrink:0;border-radius:6px;background:#161b22;border:1px solid #30363d;">'
          : '<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0;">🎣</div>')
        +'<div style="flex:1;min-width:0;">'
        +'<div style="font-weight:700;font-size:.88rem;color:#ffd700;margin-bottom:2px;">'+it.nombre+'</div>'
        +'<div style="font-size:.7rem;color:#2ec4b6;margin-bottom:4px;">'+it.tipo+(it.descripcion?' · '+it.descripcion:'')+'</div>'
        +'<div style="font-size:.72rem;color:#8b949e;flex-wrap:wrap;display:flex;gap:4px;">'+sHtml+'</div>'
        +'</div>'
        +'<input type="checkbox" checked data-img-check="'+idx+'" style="width:18px;height:18px;accent-color:#ffd700;cursor:pointer;flex-shrink:0;">'
        +'</div>';
    });

    rt.innerHTML = html;
    document.getElementById('tiendaIAResult').style.display = 'block';
    document.getElementById('tiendaIAPublishBtn').style.display = '';
  };

  // ── Publicar ─────────────────────────────────────────────
  window.tiendaIAPublicar = async function(){
    if(!_tiendaIADataMulti.length) return;
    var btn = document.getElementById('tiendaIAPublishBtn');
    btn.disabled = true; btn.textContent = '⏳ Guardando...';

    var checks = document.querySelectorAll('#tiendaIAResultText input[data-img-check]');
    var seleccionados = _tiendaIADataMulti.filter(function(_,i){ return checks[i] ? checks[i].checked : true; });

    if(!seleccionados.length){
      alert('Seleccioná al menos un ítem.');
      btn.disabled = false; btn.textContent = '🚀 Agregar a la Tienda';
      return;
    }

    try{
      var fi = window._fsImports || {};
      if(!fi.addDoc) throw new Error('Firestore no disponible');
      var addedAt = new Date().toISOString().slice(0,19)+'Z';
      var nick    = window.CU.nick || window.CU.id;
      var ok = 0;
      for(var i=0;i<seleccionados.length;i++){
        var it = seleccionados[i];
        try{
          await fi.addDoc(fi.collection(window.db,'tienda_items'),{
            nombre:      it.nombre      || '',
            tipo:        it.tipo        || 'Carrete',
            imagen:      it.imagen      || '',
            descripcion: it.descripcion || '',
            stats:       it.stats       || {},
            addedBy:     nick,
            addedAt:     addedAt
          });
          ok++;
        }catch(fe){}
      }
      var rt = document.getElementById('tiendaIAResultText');
      if(rt) rt.innerHTML = '<div style="color:#3fb950;font-weight:700;text-align:center;padding:16px;font-size:1rem;">✅ '+ok+' ítem'+(ok!==1?'s':'')+' guardado'+(ok!==1?'s':'')+' en la Tienda!</div>';
      var pb2 = document.getElementById('tiendaIAPublishBtn');
      if(pb2) pb2.style.display = 'none';
      setTimeout(function(){
        document.getElementById('tiendaIAModal').style.display = 'none';
        window.tiendaIAReset();
      }, 2000);
    }catch(e){
      alert('Error: '+e.message);
      btn.disabled = false; btn.textContent = '🚀 Agregar a la Tienda';
    }
  };

  // ── Init ─────────────────────────────────────────────────
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', tiendaLoad);
  } else {
    tiendaLoad();
  }

})();
