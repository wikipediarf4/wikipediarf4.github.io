(function(){

  var _faqAll = [];
  var _faqCat = 'todas';

  // ── Helpers ──────────────────────────────────────────────────
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var CAT_LABELS = { carnadas:'🪱 Carnadas', aparejos:'🎣 Aparejos', nivel:'📈 Nivel y Progreso' };

  // ── FAQ estáticas (se muestran instantáneo mientras carga Firestore) ──
  var FAQ_STATIC = [
    // === CARNADAS ===
    { id:'s1', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cuál es la mejor carnada para carpas?',
      respuesta:'Las carpas responden muy bien a las boilies de frutas, maíz cocido y pasta de cacahuate. Para trofeos, probá con boilies de 20mm+ y cebado previo en el spot.' },
    { id:'s2', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Para qué sirve el cebador (groundbait)?',
      respuesta:'El cebador atrae peces al área de pesca y los mantiene activos. Mezclalo con partículas pequeñas como maíz o cañamo. Usá la cantidad justa: demasiado llena los peces y dejan de picar.' },
    { id:'s3', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué diferencia hay entre señuelo de superficie y hundido?',
      respuesta:'Los señuelos de superficie (topwater) imitan insectos o presas en la superficie y son muy efectivos en verano al amanecer. Los hundidos imitan peces pequeños heridos y funcionan mejor en aguas profundas o frías.' },
    { id:'s4', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cómo sé qué carnada usar en cada lago?',
      respuesta:'Consultá la wiki de cada lago en el menú de Mapas. Ahí encontrás qué peces hay y qué carnadas prefieren. También podés revisar los trofeos de la comunidad para ver con qué carnada fueron pescados.' },
    { id:'s5', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Los señuelos artificiales se gastan o rompen?',
      respuesta:'Sí, los señuelos tienen durabilidad. Revisá el inventario para ver el estado. Cuando están muy deteriorados pierden efectividad. Podés repararlos en la tienda o reemplazarlos.' },
    { id:'s6', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cuándo conviene usar cañamo o semillas?',
      respuesta:'El cañamo y las semillas son ideales como cebado secundario o mezcla en el groundbait. Son económicos y atraen bien a carpas, bream y tench. También sirven de carnada directa para peces pequeños.' },
    { id:'s7', cat:'carnadas', estado:'aprobado', userNick:'comunidad', pregunta:'¿Los gusanos funcionan para peces grandes?',
      respuesta:'Los gusanos son efectivos para una gran variedad de peces pero raramente para los trofeos más grandes. Son ideales para subir nivel rápido pescando perch, roach y ruffe. Para trofeos grandes es mejor usar boilies o señuelos específicos.' },

    // === APAREJOS ===
    { id:'s8', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué caña y carrete debo usar al empezar?',
      respuesta:'Al inicio usá caña y carrete de nivel 1-5 que encontrás en la tienda básica. Con ellos podés pescar la mayoría de peces del lago inicial. No gastes dinero en equipos caros hasta nivel 10+.' },
    { id:'s9', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué significa la resistencia (test) del hilo?',
      respuesta:'Es el peso máximo que aguanta el hilo antes de romperse. Si el pez pesa más que el test del hilo, se rompe y perdés el pez y el anzuelo. Siempre usá hilo con test mayor al peso del pez que buscás.' },
    { id:'s10', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Para qué sirve el freno del carrete?',
      respuesta:'El freno (drag) controla cuánta resistencia ofrece el carrete cuando el pez jala. Si está muy apretado el hilo se rompe; muy flojo y el pez escapa. Ajustalo a un 70-80% del test del hilo para una pelea efectiva.' },
    { id:'s11', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cuándo usar flotador vs pesca de fondo?',
      respuesta:'El flotador es ideal para pescar a media agua o superficie, perfecto para ruffe, roach y perch. La pesca de fondo (bottom fishing / feeder) es mejor para carpas, bream y tench que buscan comida en el lecho del lago.' },
    { id:'s12', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué es el leader y para qué sirve?',
      respuesta:'El leader es un trozo de hilo más grueso entre el hilo principal y el anzuelo. Protege de los dientes del pez y del roce con rocas o vegetación. Es obligatorio para peces con dientes como el pike o el perch grande.' },
    { id:'s13', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué diferencia hay entre spinning y feeder?',
      respuesta:'El spinning se usa con señuelos artificiales que se castean y recuperan activamente. El feeder es pesca de fondo con carnada natural y un alimentador que suelta cebo. Son estilos muy distintos y requieren equipos diferentes.' },
    { id:'s14', cat:'aparejos', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cómo mejorar el alcance del lanzamiento?',
      respuesta:'El alcance depende del peso del plomo/señuelo, la potencia de la caña y el nivel del personaje. Usá plomos más pesados para mayor distancia. También mejorá la caña: las de acción rápida lanzan más lejos.' },

    // === NIVEL Y PROGRESO ===
    { id:'s15', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cómo subo de nivel rápido al principio?',
      respuesta:'Pescá muchos peces pequeños con gusanos o maíz. La cantidad de peces da más XP que pocos peces grandes. Completá las misiones del tablón (notice board) del lago: dan mucha XP y monedas al principio.' },
    { id:'s16', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Para qué sirven los puntos de habilidad?',
      respuesta:'Los puntos de habilidad mejoran stats específicos como resistencia, velocidad de lanzamiento, percepción de picadas y más. Distribuílos según tu estilo: si pescás carpas, priorizá resistencia; si hacés spinning, velocidad de recuperación.' },
    { id:'s17', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cuándo puedo ir a un lago nuevo?',
      respuesta:'Los lagos tienen requisito de nivel mínimo. Podés ver cuáles están disponibles en el mapa. En general: Old Burg hasta lvl 10, Belaya hasta lvl 15, Winding Rivulet desde lvl 20. No hay penalidad por ir antes, pero el equipo básico no alcanza.' },
    { id:'s18', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Qué son los trofeos y cómo conseguirlos?',
      respuesta:'Los trofeos son peces que superan el tamaño mínimo de trofeo de cada especie. Para conseguirlos necesitás el equipo adecuado, la carnada correcta, el spot preciso y muchas veces cierta hora del día. Consultá la sección de Trofeos de la wiki.' },
    { id:'s19', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cómo gano dinero (plata) en el juego?',
      respuesta:'Vendé los peces que pescás en la tienda. Los peces grandes valen más. Completar misiones también da buenas recompensas. Evitá gastar en equipos caros hasta nivel 20+. Los peces de noche suelen ser más grandes y valer más.' },
    { id:'s20', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿El clima y la hora del día afectan la pesca?',
      respuesta:'Sí, mucho. El amanecer y el atardecer son los mejores momentos para pescar. La lluvia activa mucho a los peces. El viento fuerte los hace menos activos. Cada especie tiene sus preferencias: consultá la wiki de cada pez para más detalle.' },
    { id:'s21', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Para qué sirve el keep net (red de retención)?',
      respuesta:'El keep net guarda los peces vivos que pescás sin que ocupen inventario. Cuando terminás la sesión, vendés todo de una vez. Es esencial para sesiones largas de grinding de XP o dinero.' },
    { id:'s22', cat:'nivel', estado:'aprobado', userNick:'comunidad', pregunta:'¿Cómo funciona la fatiga del personaje?',
      respuesta:'El personaje se cansa con el tiempo. La fatiga alta reduce la precisión de lanzamiento y la fuerza. Descansá en la carpa/tienda del lago. Algunos alimentos y bebidas reducen la fatiga más rápido.' }
  ];

  // ── Cargar FAQ pública ────────────────────────────────────────
  async function loadFaq(){
    // Mostrar estáticas inmediatamente mientras carga Firestore
    if(!_faqAll.length){ _faqAll = FAQ_STATIC.slice(); faqRender(); }
    if(!window.db || !window._fsLib) return;
    var fs = window._fsLib;
    try {
      var snap = await fs.getDocs(fs.query(
        fs.collection(window.db,'faq'),
        fs.where('estado','==','aprobado'),
        fs.orderBy('cat','asc'),
        fs.orderBy('time','desc')
      ));
      // Si Firestore tiene preguntas, combinar con las estáticas (sin duplicar por id)
      var fromDb = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
      if(fromDb.length){
        var dbIds = fromDb.map(function(f){ return f.id; });
        var staticOnly = FAQ_STATIC.filter(function(f){ return !dbIds.includes(f.id); });
        _faqAll = staticOnly.concat(fromDb);
      } else {
        _faqAll = FAQ_STATIC.slice();
      }
      faqRender();
      // Badge admin
      var pendSnap = await fs.getDocs(fs.query(fs.collection(window.db,'faq'), fs.where('estado','==','pendiente')));
      var badge = document.getElementById('admFaqBadge');
      if(badge && pendSnap.size > 0){ badge.style.display='inline'; badge.textContent=pendSnap.size; }
    } catch(e){ console.log('FAQ load error',e); }
  }

  // ── Render público ────────────────────────────────────────────
  window.faqRender = function(){
    var el = document.getElementById('faqList');
    if(!el) return;
    var q = (document.getElementById('faqSearch')||{}).value||'';
    var list = _faqAll.filter(function(f){
      var matchCat = _faqCat==='todas' || f.cat===_faqCat;
      var matchQ = !q || (f.pregunta||'').toLowerCase().includes(q.toLowerCase()) || (f.respuesta||'').toLowerCase().includes(q.toLowerCase());
      return matchCat && matchQ;
    });
    if(!list.length){ el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);font-size:.85rem;">Sin preguntas en esta categoría aún. ¡Sé el primero en proponer una!</div>'; return; }
    // Agrupar por categoría
    var groups = {};
    list.forEach(function(f){ if(!groups[f.cat]) groups[f.cat]=[]; groups[f.cat].push(f); });
    var html = '';
    Object.keys(groups).forEach(function(cat){
      if(_faqCat==='todas') html+='<div style="font-size:.7rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.07em;margin:12px 0 6px;">'+(CAT_LABELS[cat]||cat)+'</div>';
      groups[cat].forEach(function(f){
        html+='<div class="faq-item" id="faqitem-'+f.id+'" onclick="faqToggle(\''+f.id+'\')">';
        html+='<div class="faq-q"><span style="font-size:.84rem;font-weight:700;color:var(--text);flex:1;">'+esc(f.pregunta)+'</span><span class="faq-chevron">▼</span></div>';
        html+='<div class="faq-a">'+esc(f.respuesta||'Sin respuesta aún.')+'<div style="margin-top:8px;font-size:.65rem;color:#555;">Por '+esc(f.userNick||'comunidad')+'</div></div>';
        html+='</div>';
      });
    });
    el.innerHTML = html;
  };

  window.faqToggle = function(id){
    var el = document.getElementById('faqitem-'+id);
    if(el) el.classList.toggle('open');
  };

  window.faqSetCat = function(cat, btn){
    _faqCat = cat;
    document.querySelectorAll('.faq-cat-btn').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    faqRender();
  };

  window.faqShowProp = function(){
    var box = document.getElementById('faqPropBox');
    var btn = document.getElementById('faqPropBtn');
    if(!window.CU){ toast('Necesitás iniciar sesión para proponer una pregunta','err'); return; }
    if(box) box.style.display='block';
    if(btn) btn.style.display='none';
  };

  window.faqSubmit = async function(){
    if(!window.CU){ toast('Iniciá sesión primero','err'); return; }
    if(!window.db || !window._fsLib){ toast('Sin conexión','err'); return; }
    var q = (document.getElementById('faqPropQ')||{}).value||'';
    var a = (document.getElementById('faqPropA')||{}).value||'';
    var cat = (document.getElementById('faqPropCat')||{}).value||'carnadas';
    if(!q.trim()){ toast('Escribí tu pregunta','err'); return; }
    var fs = window._fsLib;
    try {
      await fs.addDoc(fs.collection(window.db,'faq'),{
        pregunta: q.trim(),
        respuesta: a.trim(),
        cat: cat,
        estado: 'pendiente',
        userId: window.CU.id,
        userNick: window.CU.nick||'',
        time: fs.serverTimestamp ? fs.serverTimestamp() : Date.now()
      });
      toast('✅ ¡Enviado! Tu pregunta fue recibida 🎣','ok');
      document.getElementById('faqPropQ').value='';
      document.getElementById('faqPropA').value='';
      document.getElementById('faqPropBox').style.display='none';
      document.getElementById('faqPropBtn').style.display='block';
      var conf=document.createElement('div');
      conf.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);background:#161b22;border:2px solid #3fb950;border-radius:16px;padding:32px 40px;text-align:center;z-index:9999;box-shadow:0 8px 40px rgba(0,0,0,.7);transition:all .25s;';
      conf.innerHTML='<div style="font-size:2.5rem;margin-bottom:10px;">✅</div><div style="font-family:Orbitron,monospace;font-size:1.1rem;font-weight:900;color:#3fb950;margin-bottom:6px;">¡ENVIADO!</div><div style="font-size:.85rem;color:#8b949e;">Tu pregunta fue enviada.<br>El admin la revisará pronto 🎣</div>';
      document.body.appendChild(conf);
      setTimeout(function(){ conf.style.transform='translate(-50%,-50%) scale(1)'; },10);
      setTimeout(function(){ conf.style.opacity='0'; conf.style.transform='translate(-50%,-50%) scale(0.8)'; setTimeout(function(){ conf.remove(); },300); },2500);
    } catch(e){ toast('Error al enviar','err'); }
  };

  // ── Admin FAQ ─────────────────────────────────────────────────
  var _faqAdminFilter = 'todas';

  window.loadAdminFaq = async function(filtro){
    if(filtro) _faqAdminFilter = filtro;
    var el = document.getElementById('faqAdminList');
    if(!el) return;
    if(!window.db || !window._fsLib){ el.innerHTML='<div style="color:var(--muted);padding:20px;">Sin conexión</div>'; return; }
    el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);">Cargando...</div>';
    var fs = window._fsLib;
    try {
      var q;
      if(_faqAdminFilter==='todas') q=fs.query(fs.collection(window.db,'faq'), fs.orderBy('time','desc'));
      else q=fs.query(fs.collection(window.db,'faq'), fs.where('estado','==',_faqAdminFilter), fs.orderBy('time','desc'));
      var snap = await fs.getDocs(q);
      if(!snap.docs.length){ el.innerHTML='<div style="text-align:center;padding:32px;color:var(--muted);">Sin preguntas</div>'; return; }
      var html='';
      snap.docs.forEach(function(d){
        var f=Object.assign({id:d.id},d.data());
        var estadoColor=f.estado==='aprobado'?'var(--green)':f.estado==='rechazado'?'var(--red)':'var(--warn)';
        html+='<div id="faqAdminItem-'+f.id+'" style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;margin-bottom:8px;">';
        html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">';
        html+='<span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:100px;background:rgba(46,196,182,.1);color:var(--accent);">'+(CAT_LABELS[f.cat]||f.cat)+'</span>';
        html+='<span style="font-size:.65rem;font-weight:700;color:'+estadoColor+';">● '+esc(f.estado||'pendiente')+'</span>';
        html+='<span style="font-size:.65rem;color:var(--muted);margin-left:auto;">Por '+esc(f.userNick||'?')+'</span>';
        html+='<span class="faq-admin-status-badge" style="font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:100px;display:'+(f.estado!=='pendiente'?'inline-block':'none')+';">'+( f.estado==='aprobado'?'✅ APROBADO':f.estado==='rechazado'?'❌ RECHAZADO':'')+' </span>';
        html+='</div>';
        html+='<div style="font-size:.84rem;font-weight:700;color:var(--text);margin-bottom:6px;">'+esc(f.pregunta)+'</div>';
        html+='<textarea id="faqResp-'+f.id+'" rows="2" style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:7px 10px;color:var(--text);font-family:\'Exo 2\',sans-serif;font-size:.78rem;resize:none;outline:none;margin-bottom:8px;box-sizing:border-box;" placeholder="Respuesta...">'+esc(f.respuesta||'')+'</textarea>';
        html+='<div style="display:flex;gap:6px;flex-wrap:wrap;">';
        html+='<button onclick="faqAdminAction(\''+f.id+'\',\'aprobado\')" style="background:rgba(63,185,80,.15);border:1px solid var(--green);color:var(--green);padding:5px 12px;border-radius:var(--rs);font-size:.74rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;font-weight:700;">✅ Aprobar</button>';
        html+='<button onclick="faqAdminAction(\''+f.id+'\',\'rechazado\')" style="background:rgba(248,81,73,.1);border:1px solid var(--red);color:var(--red);padding:5px 12px;border-radius:var(--rs);font-size:.74rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;font-weight:700;">❌ Rechazar</button>';
        html+='<button onclick="faqAdminDelete(\''+f.id+'\')" style="background:var(--bg3);border:1px solid var(--border);color:var(--muted);padding:5px 12px;border-radius:var(--rs);font-size:.74rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;">🗑 Eliminar</button>';
        html+='</div></div>';
      });
      el.innerHTML=html;
    } catch(e){ el.innerHTML='<div style="color:var(--red);padding:20px;">Error: '+esc(String(e.message||e))+'</div>'; }
  };

  window.faqAdminAction = async function(id, estado){
    if(!window.CU){ toast('Necesitás iniciar sesión como admin','err'); return; }
    if(!window.db || !window._fsLib){ toast('Sin conexión a la base de datos','err'); return; }
    var fs = window._fsLib;
    var respEl = document.getElementById('faqResp-'+id);
    var resp = respEl ? respEl.value.trim() : '';
    // Feedback visual inmediato en el ítem
    var itemEl = document.getElementById('faqAdminItem-'+id);
    if(itemEl){
      var badge = itemEl.querySelector('.faq-admin-status-badge');
      if(badge){
        badge.textContent = estado==='aprobado' ? '✅ APROBADO' : '❌ RECHAZADO';
        badge.style.color = estado==='aprobado' ? 'var(--green)' : 'var(--red)';
        badge.style.background = estado==='aprobado' ? 'rgba(63,185,80,.15)' : 'rgba(248,81,73,.1)';
        badge.style.border = '1px solid '+(estado==='aprobado'?'var(--green)':'var(--red)');
        badge.style.display = 'inline-block';
      }
      itemEl.querySelectorAll('button').forEach(function(b){ b.disabled=true; b.style.opacity='.4'; b.style.cursor='default'; });
    }
    try {
      var ref = fs.doc(window.db,'faq',id);
      await fs.updateDoc(ref,{ estado:estado, respuesta:resp, revisadoPor: (window.CU&&window.CU.nick)||'admin' });
      var color = estado==='aprobado' ? '#3fb950' : '#f85149';
      var emoji = estado==='aprobado' ? '✅' : '❌';
      var label = estado==='aprobado' ? '¡APROBADA!' : '¡RECHAZADA!';
      toast(emoji+' Pregunta '+estado, estado==='aprobado'?'ok':'err');
      var conf=document.createElement('div');
      conf.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.8);background:#161b22;border:2px solid '+color+';border-radius:16px;padding:32px 40px;text-align:center;z-index:9999;box-shadow:0 8px 40px rgba(0,0,0,.7);transition:all .25s;';
      conf.innerHTML='<div style="font-size:2.5rem;margin-bottom:10px;">'+emoji+'</div><div style="font-family:Orbitron,monospace;font-size:1.1rem;font-weight:900;color:'+color+';margin-bottom:6px;">'+label+'</div>';
      document.body.appendChild(conf);
      setTimeout(function(){ conf.style.transform='translate(-50%,-50%) scale(1)'; },10);
      setTimeout(function(){ conf.style.opacity='0'; conf.style.transform='translate(-50%,-50%) scale(0.8)'; setTimeout(function(){ conf.remove(); },300); },2000);
      setTimeout(function(){ loadAdminFaq(); loadFaq(); }, 1500);
    } catch(e){
      toast('Error al guardar: '+(e.message||String(e)),'err');
      if(itemEl) itemEl.querySelectorAll('button').forEach(function(b){ b.disabled=false; b.style.opacity='1'; b.style.cursor='pointer'; });
    }
  };

  window.faqAdminDelete = async function(id){
    if(!confirm('¿Eliminar esta pregunta?')) return;
    if(!window.db || !window._fsLib) return;
    var fs = window._fsLib;
    try {
      await fs.deleteDoc(fs.doc(window.db,'faq',id));
      toast('Eliminada','ok');
      loadAdminFaq();
    } catch(e){ toast('Error','err'); }
  };

  // ── Hook gp para cargar FAQ al abrir la página ────────────────
  var _origGp = window.gp;
  window.gp = function(page){
    if(typeof _origGp==='function') _origGp(page);
    if(page==='faq'){
      if(window.db && window._fsLib){
        loadFaq();
      } else {
        // Esperar a que Firebase esté listo con reintentos cortos
        var intentos = 0;
        var retry = setInterval(function(){
          intentos++;
          if(window.db && window._fsLib){
            clearInterval(retry);
            loadFaq();
          } else if(intentos >= 20){
            clearInterval(retry);
          }
        }, 150);
      }
    }
  };

  // Cargar si ya está en la página (sin delay innecesario)
  document.addEventListener('DOMContentLoaded', function(){
    if(window.db && window._fsLib){
      loadFaq();
    } else {
      var intentos = 0;
      var retry = setInterval(function(){
        intentos++;
        if(window.db && window._fsLib){
          clearInterval(retry);
          loadFaq();
        } else if(intentos >= 40){
          clearInterval(retry);
        }
      }, 150);
    }
  });

})();
