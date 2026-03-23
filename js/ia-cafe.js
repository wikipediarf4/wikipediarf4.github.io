(function(){

  window.cafeAbrirLectorIA = function(){
    if(!window.CU){ alert('Tenés que estar logueado para publicar pedidos.'); return; }
    var m = document.getElementById('cafeIAModal');
    if(m){ m.style.display = 'flex'; }
    // Pre-seleccionar el mapa activo
    var sel = document.getElementById('cafeIAMapSelect');
    if(sel && typeof _cafeMap !== 'undefined'){
      sel.value = _cafeMap;
      if(!sel.value) sel.selectedIndex = 0;
    }
    cafeIAReset();
  };

  window.cafeIAReset = function(){
    var dz  = document.getElementById('cafeIADropZone');
    var pr  = document.getElementById('cafeIAPreview');
    var ld  = document.getElementById('cafeIALoading');
    var rs  = document.getElementById('cafeIAResult');
    var er  = document.getElementById('cafeIAError');
    var inp = document.getElementById('cafeIAInput');
    if(dz)  dz.style.display  = 'block';
    if(pr)  pr.style.display  = 'none';
    if(ld)  ld.style.display  = 'none';
    if(rs)  rs.style.display  = 'none';
    if(er)  er.style.display  = 'none';
    if(inp) inp.value = '';
  };

  // Pedidos detectados por IA (pendientes de confirmar)
  window._cafeIAPedidosPendientes = [];

  window.cafeLeerImagenIA = async function(input){
    if(!input.files || !input.files[0]) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = async function(e){
      var dataUrl = e.target.result;
      var dz   = document.getElementById('cafeIADropZone');
      var pr   = document.getElementById('cafeIAPreview');
      var pimg = document.getElementById('cafeIAPreviewImg');
      var ld   = document.getElementById('cafeIALoading');
      var rs   = document.getElementById('cafeIAResult');
      var er   = document.getElementById('cafeIAError');
      var bar  = document.getElementById('cafeIAPublishBar');

      if(dz)   dz.style.display  = 'none';
      if(pr)   pr.style.display  = 'block';
      if(pimg) pimg.src = dataUrl;
      if(ld)   ld.style.display  = 'block';
      if(rs)   rs.style.display  = 'none';
      if(er)   er.style.display  = 'none';
      if(bar)  bar.style.display = 'none';
      window._cafeIAPedidosPendientes = [];

      try {
        var res = await fetch('https://wrf4-ai.synxyes.workers.dev', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leer_cafe_base64', imageData: dataUrl })
        });
        var data = await res.json();
        var reply = (data.reply || '').trim();

        var parsed = null;
        try {
          var clean = reply.replace(/```json|```/g,'').trim();
          parsed = JSON.parse(clean);
        } catch(pe) { parsed = null; }

        if(ld) ld.style.display = 'none';
        var rt = document.getElementById('cafeIAResultText');

        if(parsed && parsed.pedidos && parsed.pedidos.length > 0){
          var sel = document.getElementById('cafeIAMapSelect');
          var mapa = (sel && sel.value) ? sel.value : (typeof _cafeMap !== 'undefined' ? _cafeMap : 'Ladoga Lake');
          window._cafeIAPedidosPendientes = parsed.pedidos.filter(function(p){ return p.pez; });
          window._cafeIAMapaDestino = mapa;

          var html = '<div style="color:#2ec4b6;font-weight:700;font-size:.88rem;margin-bottom:10px;">🤖 La IA detectó '+window._cafeIAPedidosPendientes.length+' pedido'+(window._cafeIAPedidosPendientes.length!==1?'s':'')+'. Revisá y publicá:</div>';

          window._cafeIAPedidosPendientes.forEach(function(p, i){
            var fishData = (typeof FISH_DB !== 'undefined' ? FISH_DB : []).find(function(f){ return f.n && f.n.toLowerCase() === p.pez.toLowerCase(); }) || {};
            var pesoDisplay = p.peso_kg ? (p.peso_kg < 1 ? Math.round(p.peso_kg*1000)+'g' : p.peso_kg+'kg') : '—';
            html += '<div style="background:#1c2128;border:1px solid #30363d;border-radius:8px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">'
              + (fishData.img ? '<img src="'+fishData.img+'" style="width:38px;height:28px;object-fit:contain;flex-shrink:0;" onerror="this.style.display=\'none\'">' : '<span style="font-size:1.4rem;">🐟</span>')
              + '<div style="flex:1;min-width:0;">'
              + '<div style="font-weight:700;font-size:.85rem;color:#e6edf3;">'+p.pez+'</div>'
              + '<div style="font-size:.72rem;color:#8b949e;">⚖️ '+pesoDisplay+' &nbsp;📦 '+(p.cantidad||1)+' pcs &nbsp;💰 '+(p.recompensa||0)+' &nbsp;⏰ '+(p.tiempo_horas||48)+'h</div>'
              + '</div>'
              + '<input type="checkbox" checked data-idx="'+i+'" style="width:18px;height:18px;accent-color:#ff8c00;cursor:pointer;" title="Incluir este pedido">'
              + '</div>';
          });

          if(rt) rt.innerHTML = html;
          if(rs) rs.style.display = 'block';
          if(bar) { bar.style.display = 'flex'; }

        } else {
          if(rt) rt.innerHTML = '<div style="color:#f85149;font-weight:700;margin-bottom:8px;">⚠️ La IA no pudo detectar pedidos estructurados en esta imagen.</div>'
            + '<div style="font-size:.75rem;color:#8b949e;">Intentá con una captura más clara del panel de pedidos del Café.</div>';
          if(rs) rs.style.display = 'block';
          if(bar) bar.style.display = 'none';
        }

      } catch(e) {
        if(ld) ld.style.display = 'none';
        if(er){ er.style.display = 'block'; er.textContent = 'Error: ' + e.message; }
      }
    };
    reader.readAsDataURL(file);
  };

  window.cafeIAPublicarTodos = async function(){
    var btn = document.getElementById('cafeIAPublishBtn');
    var er  = document.getElementById('cafeIAError');
    var rt  = document.getElementById('cafeIAResultText');
    var bar = document.getElementById('cafeIAPublishBar');

    var pendientes = window._cafeIAPedidosPendientes || [];
    if(!pendientes.length){ return; }

    // Obtener los que están marcados con checkbox
    var checkboxes = document.querySelectorAll('#cafeIAResultText input[type=checkbox]');
    var seleccionados = pendientes.filter(function(_, i){
      var cb = checkboxes[i];
      return cb ? cb.checked : true;
    });

    if(!seleccionados.length){
      if(er){ er.style.display='block'; er.textContent='Seleccioná al menos un pedido.'; }
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Publicando...';
    if(er) er.style.display = 'none';

    var { collection, addDoc } = window._fsImports || {};
    if(!collection){
      if(er){ er.style.display='block'; er.textContent='Firestore no disponible.'; }
      btn.disabled = false; btn.textContent = '🚀 Publicar todos los pedidos';
      return;
    }

    var mapa = window._cafeIAMapaDestino || (typeof _cafeMap !== 'undefined' ? _cafeMap : 'Ladoga Lake');
    var nick = window.CU ? (window.CU.nick || window.CU.id) : 'IA';
    var now  = Date.now();
    var publicados = 0;
    var errores = 0;

    for(var i = 0; i < seleccionados.length; i++){
      var p = seleccionados[i];
      if(!p.pez) continue;
      var gameH  = parseFloat(p.tiempo_horas) || 48;
      var realMs = (gameH / 24) * 3600 * 1000;
      var expAt  = new Date(now + realMs).toISOString().slice(0,19)+'Z';
      var addAt  = new Date(now).toISOString().slice(0,19)+'Z';
      var fishData = (typeof FISH_DB !== 'undefined' ? FISH_DB : []).find(function(f){ return f.n && f.n.toLowerCase() === p.pez.toLowerCase(); }) || {};
      try {
        await addDoc(collection(window.db, 'cafe_pedidos'), {
          map:        mapa,
          fish:       p.pez,
          fishImg:    fishData.img || '',
          weight:     parseFloat(p.peso_kg) || 0,
          qty:        parseInt(p.cantidad)  || 1,
          reward:     parseFloat(p.recompensa) || 0,
          addedAt:    addAt,
          expiresAt:  expAt,
          reportedBy: nick,
          reportedAt: addAt,
          viaIA:      true
        });
        publicados++;
      } catch(fe){ errores++; }
    }

    // Mostrar confirmación final
    var html = '<div style="color:#3fb950;font-weight:700;font-size:1rem;text-align:center;padding:12px 0;">✅ '+publicados+' pedido'+(publicados!==1?'s':'')+' publicado'+(publicados!==1?'s':'')+' exitosamente!</div>';
    if(errores) html += '<div style="color:#f85149;font-size:.75rem;text-align:center;">⚠️ '+errores+' no se pudieron publicar</div>';
    if(rt) rt.innerHTML = html;
    if(bar) bar.style.display = 'none';
    window._cafeIAPedidosPendientes = [];

    setTimeout(function(){
      var m = document.getElementById('cafeIAModal');
      if(m) m.style.display = 'none';
      cafeIAReset();
    }, 2500);
  };

})();
