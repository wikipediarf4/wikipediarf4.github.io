// ===== POSTS =====
async function _loadMostViewedPosts(el){
  el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);font-size:.85rem;">⏳ Cargando publicaciones populares...</div>';
  try {
    let snap;
    try { snap = await getDocs(query(collection(db,'posts'), orderBy('likes','desc'), limit(30))); }
    catch(e){ snap = await getDocs(query(collection(db,'posts'), limit(30))); }
    if(snap.empty){
      el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--muted);font-size:.88rem;">🎣 No hay publicaciones aún.<br><span style="font-size:.78rem;opacity:.7;">¡Sé el primero en compartir tu pesca!</span></div>';
      return;
    }
    const posts = snap.docs.map(d=>({id:d.id,...d.data(),time:d.data().time?.toMillis?.()||Date.now()}));
    posts.sort((a,b)=>{
      const scoreA=(a.likes||0)+(a.commentCount||0)+Object.values(a.reactions||{}).reduce((s,v)=>s+(Array.isArray(v)?v.length:0),0);
      const scoreB=(b.likes||0)+(b.commentCount||0)+Object.values(b.reactions||{}).reduce((s,v)=>s+(Array.isArray(v)?v.length:0),0);
      return scoreB-scoreA;
    });
    posts.forEach(p=>{ if(!_posts.find(x=>x.id===p.id)) _posts.push(p); });
    el.innerHTML = `<div data-popular-banner style="display:flex;align-items:center;gap:8px;padding:10px 4px 6px;margin-bottom:4px;border-bottom:1px solid var(--border);"><span style="font-size:1.1rem;">🔥</span><span style="font-size:.78rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;">Publicaciones más populares</span></div>${posts.map(p=>postHTML(p)).join('')}`;
  } catch(e){
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">⚠️ Error al cargar.</div>';
  }
}

function renderFeed(){
  const el = document.getElementById('feedPosts');
  if(!el) return;
  window._postImgsMap = window._postImgsMap || {};
  _posts.forEach(p=>{ if(p.images&&p.images.length) window._postImgsMap[p.id]=p.images; });

  // Verificar si ya hay posts reales en el DOM (no el placeholder de carga)
  const hasRealPosts = _posts.some(p=>document.getElementById('post_'+p.id));
  if(!hasRealPosts){
    if(!_posts.length){
      _loadMostViewedPosts(el);
      return;
    }
    const isPremium = window.CU && window.CU.role === 'premium';
    const adHTML = isPremium ? '' : `<div class="adsense-unit ad-between-posts" style="margin:12px 0;text-align:center;min-height:0;">
      <ins class="adsbygoogle" style="display:block"
           data-ad-client="ca-pub-6245611726363291"
           data-ad-slot="8227722498"
           data-ad-format="fluid"
           data-ad-layout-key="-fb+5w+4e-db+86"></ins>
    </div>`;
    let html = '';
    _posts.forEach((p, i) => {
      html += postHTML(p);
      if(!isPremium && (i + 1) % 5 === 0) html += adHTML;
    });
    el.innerHTML = html;
    // Inicializar los ads insertados
    if(!isPremium) {
      try {
        el.querySelectorAll('.adsbygoogle:not([data-adsbygoogle-status])').forEach(function(){
          (adsbygoogle = window.adsbygoogle || []).push({});
        });
      } catch(e) {}
    }
    el.querySelectorAll('.comments-section').forEach(function(c){ c.classList.remove('open'); });
    return;
  }

  _posts.forEach(p=>{
    const existing = document.getElementById('post_'+p.id);
    if(!existing){
      // Post nuevo — insertar al principio
      const tmp = document.createElement('div');
      tmp.innerHTML = postHTML(p);
      const newEl = tmp.firstElementChild;
      if(newEl) el.insertBefore(newEl, el.firstChild);
      return;
    }
    // Solo actualizar stats y actions (reacciones, contador comentarios)
    const tmp = document.createElement('div');
    tmp.innerHTML = postHTML(p);
    const newPost = tmp.firstElementChild;

    const oldStats = existing.querySelector('.post-stats');
    const newStats = newPost.querySelector('.post-stats');
    if(oldStats && newStats && oldStats.outerHTML !== newStats.outerHTML)
      oldStats.replaceWith(newStats.cloneNode(true));

    const oldAct = existing.querySelector('.post-actions');
    const newAct = newPost.querySelector('.post-actions');
    if(oldAct && newAct && oldAct.outerHTML !== newAct.outerHTML)
      oldAct.replaceWith(newAct.cloneNode(true));

    // Actualizar comentarios SOLO si no hay modal abierto y no hay input activo
    const modalOpen = !!document.getElementById('_cmtModal_'+p.id);
    const inputFocused = document.activeElement && document.activeElement.id === 'cinp_'+p.id;
    const cmtSectionOpen = existing.querySelector('.comments-section.open');
    if(!modalOpen && !inputFocused && !cmtSectionOpen){
      const oldCmts = existing.querySelector('.comments-section');
      const newCmts = newPost.querySelector('.comments-section');
      if(oldCmts && newCmts && oldCmts.innerHTML !== newCmts.innerHTML){
        const wasOpen = oldCmts.classList.contains('open');
        const newCmtsClone = newCmts.cloneNode(true);
        if(wasOpen) newCmtsClone.classList.add('open');
        oldCmts.replaceWith(newCmtsClone);
      }
    }
  });

  // Eliminar posts que ya no existen
  Array.from(el.children).forEach(child=>{
    const pid = child.id?.replace('post_','');
    if(pid && !_posts.find(p=>p.id===pid)) child.remove();
  });
}

function renderProfileFeed(){
  const el = document.getElementById('profileFeed');
  if(!el||!window.CU) return;
  // Siempre ir a Firestore para mostrar todos los posts actualizados
  getDocs(query(collection(db,'posts'), where('userId','==',window.CU.id))).then(snap=>{
    const fetched = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
      const ta = a.time?.toMillis?.() || a.time || 0;
      const tb = b.time?.toMillis?.() || b.time || 0;
      return tb - ta;
    });
    // Merge into _posts so reactions/comments work
    fetched.forEach(p=>{ const idx=_posts.findIndex(x=>x.id===p.id); if(idx>=0) _posts[idx]=p; else _posts.unshift(p); });
    _renderProfileFeedHTML(el, fetched);
  }).catch(e=>{
    console.warn('renderProfileFeed error:', e);
    // Fallback al cache
    const mine = _posts.filter(p=>p.userId===window.CU.id);
    _renderProfileFeedHTML(el, mine);
  });
}

function _renderProfileFeedHTML(el, mine){
  // Actualizar contadores con datos reales de Firestore
  document.getElementById('profPostCount').textContent = mine.length;
  const totalLikesReal = mine.reduce((s,p)=>{
    const rxnTotal = Object.values(p.reactionCounts||{}).reduce((a,b)=>a+(b||0),0);
    return s + (rxnTotal || p.likes || 0);
  }, 0);
  const profLikeEl = document.getElementById('profLikeCount');
  if(profLikeEl) profLikeEl.textContent = totalLikesReal;
  // Actualizar badges con datos reales
  const lvlMap = {Principiante:'🐟 Principiante',Intermedio:'🎣 Intermedio',Avanzado:'⭐ Avanzado',Experto:'🏆 Experto',Profesional:'👑 Profesional'};
  const profLevelEl = document.getElementById('profLevel');
  if(profLevelEl) profLevelEl.textContent = lvlMap[window.CU?.experience] || (mine.length>=10?'🏆 Experto':mine.length>=5?'⭐ Activo':mine.length>=1?'🎣 Pescador':'🐟 Novato');
  const profBadgesEl = document.getElementById('profBadges');
  if(profBadgesEl){
    const badges = [];
    if(mine.length>=1) badges.push('<span class="badge badge-green">🎣 Pescador</span>');
    if(mine.length>=5) badges.push('<span class="badge badge-blue">⭐ Activo</span>');
    if(totalLikesReal>=10) badges.push('<span class="badge badge-gold">🏆 Popular</span>');
    if(window.CU?.experience==='Experto'||window.CU?.experience==='Profesional') badges.push('<span class="badge badge-gold">👑 Pro</span>');
    profBadgesEl.innerHTML = ''; // badges ocultos
  }
  // Actualizar galería de fotos con datos reales
  const allImgs = mine.flatMap(p=>p.images||[]).filter(Boolean);
  const profPhotoGrid = document.getElementById('profPhotoGrid');
  if(profPhotoGrid){
    window._profAllImgs = allImgs.slice(0,9);
    profPhotoGrid.innerHTML = allImgs.slice(0,9).map((img,idx)=>`<img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openImgLightbox(window._profAllImgs[${idx}],window._profAllImgs)">`).join('') || '<div style="color:var(--muted);font-size:.8rem;grid-column:1/-1;padding:8px">Sin fotos aún</div>';
  }
  const profileGalleryGrid = document.getElementById('profileGalleryGrid');
  if(profileGalleryGrid){
    window._profGalleryImgs = allImgs;
    profileGalleryGrid.innerHTML = allImgs.map((img,idx)=>`<img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer;border-radius:2px;" onclick="openImgLightbox(window._profGalleryImgs[${idx}],window._profGalleryImgs)">`).join('') || '<div style="color:var(--muted);font-size:.8rem;grid-column:1/-1;padding:8px">Sin fotos aún</div>';
  }

  const scrollY = window.scrollY;
  let pinnedH='';
  if(window.CU?.verified&&window.CU.pinnedPostId){
    const pp=mine.find(p=>p.id===window.CU.pinnedPostId);
    if(pp) pinnedH=`<div style='margin-bottom:6px;'><span class='pinned-label'>📌 Post fijado</span>${postHTML(pp)}</div>`;
  }
  const rest=mine.filter(p=>p.id!==window.CU?.pinnedPostId);

  // Si no hay posts propios en el DOM todavía → render completo
  const hasOwnPosts = rest.some(p=>document.getElementById('post_'+p.id));
  if(!hasOwnPosts){
    el.innerHTML = pinnedH+(rest.length?rest.map(p=>postHTML(p)).join(''):(!pinnedH?`<div style="text-align:center;padding:40px;color:var(--muted)">Sin publicaciones aún. ¡Comparte tu primera pesca!</div>`:''));
    window.scrollTo(0, scrollY);
    return;
  }

  // Smart update: solo reemplazar stats/actions/comments
  rest.forEach(p=>{
    const existing = document.getElementById('post_'+p.id);
    if(!existing){
      // Post nuevo — insertar al principio
      const tmp0 = document.createElement('div');
      tmp0.innerHTML = postHTML(p);
      el.insertBefore(tmp0.firstElementChild, el.firstChild);
      return;
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = postHTML(p);
    const newPost = tmp.firstElementChild;
    const oldStats = existing.querySelector('.post-stats');
    const newStats = newPost.querySelector('.post-stats');
    if(oldStats && newStats && oldStats.outerHTML !== newStats.outerHTML)
      oldStats.replaceWith(newStats.cloneNode(true));
    const oldAct = existing.querySelector('.post-actions');
    const newAct = newPost.querySelector('.post-actions');
    if(oldAct && newAct && oldAct.outerHTML !== newAct.outerHTML)
      oldAct.replaceWith(newAct.cloneNode(true));
    const modalOpen = !!document.getElementById('_cmtModal_'+p.id);
    const inputFocused = document.activeElement && document.activeElement.id === 'cinp_'+p.id;
    if(!modalOpen && !inputFocused){
      const oldCmts = existing.querySelector('.comments-section');
      const newCmts = newPost.querySelector('.comments-section');
      if(oldCmts && newCmts && oldCmts.innerHTML !== newCmts.innerHTML){
        const wasOpen = oldCmts.classList.contains('open');
        const newCmtsClone = newCmts.cloneNode(true);
        // Only re-open if it was manually opened by user (not auto-opened)
        if(wasOpen) newCmtsClone.classList.add('open');
        oldCmts.replaceWith(newCmtsClone);
      }
    }
  });
}

function postHTML(p){
  const myRxn = window.CU ? (p.reactions?.[window.CU.id]||null) : null;
  const totalRxn = Object.values(p.reactionCounts||{}).reduce((a,b)=>a+b,0);
  const topRxn = Object.entries(p.reactionCounts||{}).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([e])=>e).join('');
  const rxnBtns = REACTIONS.map(r=>`<button class="rxn-btn" onclick="doReact('${p.id}','${r.emoji}')" title="${r.label}" style="position:relative;">${r.emoji}<span style="position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:.58rem;white-space:nowrap;padding:2px 6px;border-radius:4px;pointer-events:none;opacity:0;transition:opacity .15s;" class="rxn-tooltip">${r.label}</span></button>`).join('');
  const fishTag = p.fish ? `<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,198,255,.08);border:1px solid rgba(0,198,255,.2);border-radius:100px;padding:4px 12px;font-size:.78rem;margin-bottom:10px;margin-left:14px"><span>🎣</span><strong>${p.fish}</strong>${p.weight?` · ${fmtKg(p.weight)}`:''} ${p.map?`· ${p.map}`:''} ${p.tech?`· ${p.tech}`:''}</div>` : '';
  // Store images globally for lightbox
  window._postImgsMap = window._postImgsMap || {};
  if(p.images&&p.images.length) window._postImgsMap[p.id] = p.images;
  // Build image grid - Facebook style layout
  var imgHTML = '';
  if(p.images && p.images.length) {
    var imgs = p.images;
    var n = imgs.length;
    var pid = p.id;
    function _imgCell(img, ii, h, extraStyle) {
      var isLastOverlay = ii===3 && n>4;
      var overlayMore = n - 4;
      return '<div style="position:relative;overflow:hidden;cursor:pointer;height:'+h+';'+(extraStyle||'')+'\'" onclick="(function(){window._postImgsMap=window._postImgsMap||{};window._postImgsMap[\''+pid+'\']=['+imgs.map(function(x){return'\''+x+'\''}).join(',')+'];openImgLightboxById(\''+pid+'\','+ii+');})()">'
        + '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;display:block;transition:opacity .18s;" onmouseover="this.style.opacity=\'.82\'" onmouseout="this.style.opacity=\'1\'" loading="lazy">'
        + (isLastOverlay ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-size:2rem;font-weight:700;">+'+overlayMore+'</div>' : '')
        + '</div>';
    }
    var grid = '';
    if(n===1){
      grid = '<div style="display:grid;grid-template-columns:1fr;gap:3px;">'+_imgCell(imgs[0],0,'420px','')+'</div>';
    } else if(n===2){
      grid = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">'+_imgCell(imgs[0],0,'300px','')+_imgCell(imgs[1],1,'300px','')+'</div>';
    } else if(n===3){
      grid = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">'
        + _imgCell(imgs[0],0,'400px','grid-row:span 2;')
        + _imgCell(imgs[1],1,'197px','')
        + _imgCell(imgs[2],2,'197px','')
        +'</div>';
    } else {
      // 4 or more: 2x2 grid, last cell shows +N overlay
      grid = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">'
        + _imgCell(imgs[0],0,'220px','')
        + _imgCell(imgs[1],1,'220px','')
        + _imgCell(imgs[2],2,'220px','')
        + _imgCell(imgs[3],3,'220px','')
        +'</div>';
    }
    imgHTML = '<div style="margin-bottom:10px;border-radius:10px;overflow:hidden;">'+grid+'</div>';
  }
  let videoHTML = '';
  if(p.video){
    const _isAdmin = window.CU && (window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com' || window.CU.role === 'admin');
    const _isPending = p.videoStatus === 'pending';
    // Si el video está pendiente y no soy admin, no mostrar nada
    if(_isPending && !_isAdmin){
      videoHTML = ''; // oculto para usuarios normales
    } else {
      const ytId = extractYtId(p.video);
      const ttId = extractTikTokId(p.video);
      if(ytId){
        const _pendingBanner = _isPending ? `
          <div style="background:rgba(255,170,0,.12);border:1px solid rgba(255,170,0,.4);border-radius:var(--rs);padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div>
              <div style="font-size:.8rem;font-weight:800;color:#f0a500;">⏳ Video pendiente de aprobación</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:2px;">Subido por <strong>${esc(p.userNick)}</strong> — solo vos ves esto</div>
            </div>
            <div style="display:flex;gap:8px;">
              <button onclick="adminAprobarVideo('${p.id}','${ytId}')" style="background:linear-gradient(135deg,#238636,#2ea043);border:none;border-radius:6px;color:#fff;padding:7px 16px;font-family:'Exo 2',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;">✅ Aprobar</button>
              <button onclick="adminRechazarVideo('${p.id}','${ytId}')" style="background:rgba(248,81,73,.15);border:1px solid rgba(248,81,73,.4);border-radius:6px;color:#f85149;padding:7px 16px;font-family:'Exo 2',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;">❌ Rechazar</button>
            </div>
          </div>` : '';
        videoHTML = `${_pendingBanner}<div style="width:100%;aspect-ratio:16/9;border-radius:var(--rs);overflow:hidden;margin-bottom:10px;background:#000;">
          <iframe src="https://www.youtube.com/embed/${ytId}?rel=0" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style="width:100%;height:100%;display:block;border:none;" loading="lazy"></iframe>
        </div>`;
      } else if(ttId){
        videoHTML = `<div style="display:flex;justify-content:center;margin-bottom:10px;">
          <div style="width:100%;max-width:340px;aspect-ratio:9/16;border-radius:var(--rs);overflow:hidden;background:#000;">
            <iframe src="https://www.tiktok.com/embed/v2/${ttId}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style="width:100%;height:100%;display:block;border:none;" loading="lazy"></iframe>
          </div>
        </div>`;
      } else {
        videoHTML = `<video src="${p.video}" controls style="width:100%;border-radius:var(--rs);margin-bottom:10px;max-height:320px;display:block;"></video>`;
      }
    }
  }
  const sharedHTML = p.sharedFrom ? (function(){
    // Use snapshot first (always available), then live post as override
    const snap = p.sharedSnapshot || {};
    const orig = p.sharedPostId ? _posts.find(op=>op.id===p.sharedPostId) : null;
    // Prefer snapshot data - it was saved at share time, always reliable
    const origText = snap.text || (orig ? orig.text : '');
    const snapImg = snap.images && snap.images[0] ? snap.images[0] : '';
    const liveImg = orig ? (orig.images&&orig.images[0]||'') : '';
    const origImg = liveImg || snapImg;
    const origNick = snap.userNick || (orig ? orig.userNick : p.sharedFrom) || p.sharedFrom;
    const origAv = snap.userAv || (orig ? orig.userAv : '');
    const origAvLetter = (origNick||'?')[0].toUpperCase();
    const origAvHTML = origAv ? '<img src="'+origAv+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">' : origAvLetter;
    const origVideo = snap.video || (orig ? orig.video : '') || '';
    const origYtId = origVideo ? extractYtId(origVideo) : '';
    let sharedMediaHTML = '';
    if(origYtId){
      sharedMediaHTML = '<div style="width:100%;aspect-ratio:16/9;border-top:1px solid var(--border);overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/'+origYtId+'?rel=0" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="width:100%;height:100%;display:block;border:none;" loading="lazy"></iframe></div>';
    } else if(origImg){
      sharedMediaHTML = '<img src="'+origImg+'" style="width:100%;max-height:260px;object-fit:contain;background:var(--bg3);display:block;border-top:1px solid var(--border);" loading="lazy">';
    }
    const _sharedClick = p.sharedPostId ? ' onclick="scrollToPost(\'' + p.sharedPostId + '\')" style="margin:0 14px 10px;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;background:var(--bg3);cursor:pointer;"' : ' style="margin:0 14px 10px;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;background:var(--bg3);"';
    return '<div'+_sharedClick+'>'      +'<div style="display:flex;align-items:center;gap:8px;padding:10px 12px 8px;">'        +'<div style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.78rem;color:var(--accent);background:var(--bg4);flex-shrink:0;">'+origAvHTML+'</div>'        +'<div style="flex:1;min-width:0;">'          +'<div style="font-size:.84rem;font-weight:700;color:var(--text);">'+esc(origNick||'')+'</div>'          +(origText ? '<div style="font-size:.78rem;color:var(--muted);margin-top:1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">'+esc(origText)+'</div>' : '')        +'</div>'        +(p.sharedPostId ? '<div style="font-size:.72rem;color:var(--accent);flex-shrink:0;padding-left:6px;">Ver →</div>' : '')      +'</div>'      +sharedMediaHTML      +(!origText && !origImg && !origYtId ? '<div style="padding:10px 12px;font-size:.78rem;color:var(--muted);">📸 Publicación compartida</div>' : '')    +'</div>';
  })() : '';
  // Detectar URL en el texto si no hay link guardado
  const _postUrl = (p.link?.url) || (p.text&&(p.text.match(/https?:\/\/[^\s]+/)||[])[0]) || '';
  const linkHTML = (function(){
    var lnk = p.link || null;
    if(!lnk && !_postUrl) return '';
    if(!lnk && _postUrl){
      // URL en texto sin preview guardado — mostrar card con preview dinámico
      var uid2 = 'lprev_'+p.id;
      // Cargar preview asíncrono si no está en caché
      if(!window._linkPreviewCache) window._linkPreviewCache = {};
      if(!window._linkPreviewCache[_postUrl]){
        window._linkPreviewCache[_postUrl] = 'loading';
        (async function(){
          try {
            const resp = await fetch('https://api.allorigins.win/get?url='+encodeURIComponent(_postUrl));
            const json = await resp.json();
            const tmp2 = document.createElement('div');
            tmp2.innerHTML = json.contents||'';
            function gm2(k){ return (tmp2.querySelector('meta[property="'+k+'"]')||tmp2.querySelector('meta[name="'+k+'"]')||{getAttribute:()=>''}).getAttribute('content')||''; }
            const title2 = gm2('og:title')||(tmp2.querySelector('title')||{}).textContent||_postUrl;
            const desc2 = gm2('og:description')||gm2('description')||'';
            const img2 = gm2('og:image')||'';
            let site2=''; try{ site2=new URL(_postUrl).hostname; }catch(e){}
            window._linkPreviewCache[_postUrl] = {url:_postUrl,title:title2,desc:desc2,img:img2,site:site2};
            // Actualizar el DOM si el elemento todavía existe
            const el2 = document.getElementById(uid2);
            if(el2) el2.outerHTML = _buildLinkCard(window._linkPreviewCache[_postUrl]);
          } catch(e){
            // Falló el fetch — guardar card básica con el dominio
            let fb=''; try{ fb=new URL(_postUrl).hostname; }catch(e2){}
            window._linkPreviewCache[_postUrl] = {url:_postUrl, title:fb||_postUrl, desc:'', img:'', site:fb};
            const el2b = document.getElementById(uid2);
            if(el2b) el2b.outerHTML = _buildLinkCard(window._linkPreviewCache[_postUrl]);
          }
        })();
      }
      var cached = window._linkPreviewCache[_postUrl];
      // Si ya falló y tenemos card básica, mostrarla
      if(cached && cached !== 'loading') return _buildLinkCard(cached);
      // Skeleton mientras carga
      var disp2=_postUrl; try{disp2=new URL(_postUrl).hostname;}catch(e){}
      return '<div id="'+uid2+'" style="margin:0 0 10px;"><a href="'+esc(_postUrl)+'" target="_blank" rel="noopener" style="display:block;text-decoration:none;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg3);padding:12px 14px;">'
        +'<div style="font-size:.75rem;color:var(--accent);margin-bottom:6px;font-weight:700;">🔗 '+esc(disp2)+'</div>'
        +'<div style="height:12px;background:var(--border);border-radius:4px;width:60%;margin-bottom:6px;"></div>'
        +'<div style="height:10px;background:var(--border);border-radius:4px;width:80%;"></div>'
        +'</a></div>';
    }
    return _buildLinkCard(lnk);
  })();
  const isMyPost = window.CU && p.userId === window.CU.id;
  const CMT_RXNS=['👍','❤️','😂','😮','😢','🔥'];
  // Separate top-level comments from replies
  const allCmts = p.comments||[];

  // Enrich comments that are missing nick/av (comments saved before fix)
  if(typeof _enrichComments === 'function'){
    _enrichComments(p.id, allCmts, () => {
      // Re-render just the comments section if it's open
      const cmtsEl = document.getElementById('cmts_'+p.id);
      if(cmtsEl && cmtsEl.classList.contains('open')){
        const listEl = cmtsEl.querySelector('.cmt-list');
        if(listEl){
          // Rebuild only the list HTML
          const rebuilt = allCmts.map(function(c2,ci2){
            if(c2.replyTo) return '';
            const av2 = c2.av ? '<img src="'+c2.av+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
                               : '<img src="'+getDefaultAv(c2.gender||'')+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            return '<div class="comment-item"><div class="sl-av" style="width:32px;height:32px;font-size:.75rem;flex-shrink:0;">'+av2+'</div>'
              +'<div style="flex:1;min-width:0;"><div class="comment-bubble">'
              +'<span class="comment-author">'+(c2.nick||'?')+'</span>'
              +(c2.gif?'<img src="'+c2.gif+'" style="max-width:180px;border-radius:8px;margin-top:4px;display:block;" loading="lazy">'
                      :'<span class="comment-text"> '+renderCommentText(c2.text||'')+'</span>')
              +'</div></div></div>';
          }).join('');
          listEl.innerHTML = rebuilt;
        }
      }
    });
  }

  // Build HTML: for each top-level comment, then its replies indented below
  const cmtsHTML = allCmts.map(function(c,ci){
    if(c.replyTo) return ''; // replies rendered inline below their parent

    const isMine = window.CU && c.userId===window.CU.id;
    const canDel = window.CU && (c.userId===window.CU.id || p.userId===window.CU.id);
    const cRxns = c.reactions||{};
    const cRxnTotal = Object.values(cRxns).reduce((a,b)=>a+b,0);
    const cTopRxn = Object.entries(cRxns).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join('');
    const myRxnC = window.CU ? ((c.userReactions||{})[window.CU.id]||'') : '';
    const timeStr = c.time ? fmtT(c.time) : '';
    let menuBtns = '';
    if(isMine) menuBtns += '<button onclick="editCmt(event,\''+p.id+'\','+ci+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--text);padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">✏️ Editar</button>';
    if(canDel) menuBtns += '<button onclick="delCmt(event,\''+p.id+'\','+ci+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#f55;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">🗑 Eliminar</button>';
    menuBtns += '<button onclick="toast(\'Comentario reportado\',\'ok\')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#fa0;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">⚠️ Reportar</button>';
    const rxnBtnsHtml = CMT_RXNS.map(em=>'<button onclick="reactCmt(event,\''+p.id+'\','+ci+',\''+em+'\')" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:3px;border-radius:50%;transition:transform .13s;" onmouseover="this.style.transform=\'scale(1.4) translateY(-4px)\'" onmouseout="this.style.transform=\'scale(1)\'">'+em+'</button>').join('');
    return '<div class="comment-item">'
      +'<div class="sl-av" style="width:32px;height:32px;font-size:.75rem;flex-shrink:0;cursor:pointer;" onclick="openUserProfile(\''+c.userId+'\',\''+esc(c.nick)+'\')">'+((c.av?'<img src="'+c.av+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">':'<img src="'+getDefaultAv(c.gender||'')+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'))+'</div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="position:relative;display:inline-block;max-width:100%;">'
          +'<div class="comment-bubble">'
            +'<span class="comment-author" style="cursor:pointer;" onclick="openUserProfile(\''+c.userId+'\',\''+esc(c.nick)+'\')">'+(c.nick||'?')+'</span>'
            +(c.gif?'<img src="'+c.gif+'" style="max-width:180px;border-radius:8px;margin-top:4px;display:block;" loading="lazy">'  :'<span class="comment-text"> '+renderCommentText(c.text)+(c.edited?' <span style="font-size:.63rem;color:#8b949e;">(editado)</span>':'')+'</span>')
          +'</div>'
          +'<div class="cmt-menu-wrap" style="position:absolute;top:-6px;right:-32px;">'
            +'<button class="cmt-dots-btn">⋯</button>'
            +'<div class="cmt-menu-dropdown">'+menuBtns+'</div>'
          +'</div>'
        +'</div>'
        +(cRxnTotal>0?'<div style="display:inline-flex;align-items:center;gap:2px;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:2px 5px;font-size:.72rem;margin-top:2px;box-shadow:0 1px 3px rgba(0,0,0,.1);">'+cTopRxn+' <span style="color:#8b949e;">'+cRxnTotal+'</span></div>':'')
        +'<div class="cmt-meta">'
          +'<span class="cmt-meta-time">'+timeStr+'</span>'
          +'<div class="cmt-rxn-wrap">'
            +'<button class="cmt-like-btn'+(myRxnC?' active':'')+'" onclick="quickCmtRxn(event,\''+p.id+'\','+ci+')">'
            +(myRxnC?myRxnC+' Me gusta':'Me gusta')
            +'</button>'
            +'<div class="cmt-rxn-popup">'+rxnBtnsHtml+'</div>'
          +'</div>'
          +'<button onclick="replyCmt(event,\''+p.id+'\',\''+esc(c.nick)+'\')" class="cmt-reply-btn">Responder</button>'
        +'</div>'
          +(cRxnTotal>0?'<span style="font-size:.72rem;background:var(--bg3);border-radius:100px;padding:1px 6px;color:var(--muted);">'+cTopRxn+' '+cRxnTotal+'</span>':'')
        +'</div>'
      +'</div>'
    +'</div>'
    // Replies collapsed block
    + (function(){
        const replies = allCmts.filter(function(r2){ return r2.replyTo && c.nick && r2.replyTo.toLowerCase()===c.nick.toLowerCase() && allCmts.indexOf(r2)>ci; });
        if(!replies.length) return '';
        const rid = 'replies_'+p.id+'_'+ci;
        function replyHTML(r2){
          const rMine = window.CU && r2.userId===window.CU.id;
          const rCanDel = window.CU && (r2.userId===window.CU.id || p.userId===window.CU.id);
          const r2Rxns = r2.reactions||{};
          const r2RxnTotal = Object.values(r2Rxns).reduce((a,b)=>a+b,0);
          const r2TopRxn = Object.entries(r2Rxns).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join('');
          const myR2Rxn = window.CU ? ((r2.userReactions||{})[window.CU.id]||'') : '';
          const r2Idx = allCmts.indexOf(r2);
          let r2Menu = '';
          if(rMine) r2Menu += '<button onclick="editCmt(event,\''+p.id+'\','+r2Idx+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--text);padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">✏️ Editar</button>';
          if(rCanDel) r2Menu += '<button onclick="delCmt(event,\''+p.id+'\','+r2Idx+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#f55;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">🗑 Eliminar</button>';
          r2Menu += '<button onclick="toast(\'Comentario reportado\',\'ok\')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#fa0;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">⚠️ Reportar</button>';
          const r2RxnBtns = CMT_RXNS.map(em=>'<button onclick="reactCmt(event,\''+p.id+'\','+r2Idx+',\''+em+'\')" style="background:none;border:none;font-size:1.2rem;cursor:pointer;padding:3px;border-radius:50%;transition:transform .13s;" onmouseover="this.style.transform=\'scale(1.4) translateY(-4px)\'" onmouseout="this.style.transform=\'scale(1)\'">'+em+'</button>').join('');
          const avHTML = '<img src="'+(r2.av||getDefaultAv(r2.gender||''))+('" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">');
          return '<div class="comment-item" style="display:flex;align-items:flex-start;margin-top:4px;margin-bottom:4px;">'
            +'<div class="sl-av" style="width:28px;height:28px;font-size:.68rem;flex-shrink:0;cursor:pointer;margin-top:2px;" onclick="openUserProfile(\''+r2.userId+'\',\''+esc(r2.nick)+'\')">'+avHTML+'</div>'
            +'<div style="flex:1;min-width:0;">'
              +'<div class="comment-bubble" style="margin-bottom:3px;">'
                +'<div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-bottom:2px;">'
                  +'<div class="comment-author" style="cursor:pointer;font-size:.74rem;" onclick="openUserProfile(\''+r2.userId+'\',\''+esc(r2.nick)+'\')">'+esc(r2.nick||'?')+'</div>'
                  +'<div class="cmt-menu-wrap"><button class="cmt-dots-btn">⋯</button><div class="cmt-menu-dropdown">'+r2Menu+'</div></div>'
                +'</div>'
                +'<div class="comment-text" style="font-size:.81rem;">'+renderCommentText(r2.text)+(r2.edited?' <span style="font-size:.6rem;color:var(--muted);">(editado)</span>':'')+'</div>'
              +'</div>'
              +'<div style="display:flex;align-items:center;gap:8px;padding:0 4px 2px;flex-wrap:wrap;">'
                +'<span style="font-size:.66rem;color:var(--muted);">'+(r2.time?fmtT(r2.time):'')+'</span>'
                +'<button onclick="replyCmt(event,\''+p.id+'\',\''+esc(c.nick)+'\')" class="cmt-reply-btn" style="font-size:.7rem;">Responder</button>'
                +'<div class="cmt-rxn-wrap">'
                  +'<button onclick="quickCmtRxn(event,\''+p.id+'\','+r2Idx+')" style="background:none;border:none;font-size:.72rem;font-weight:700;cursor:pointer;padding:2px 5px;border-radius:100px;color:'+(myR2Rxn?'var(--accent)':'var(--muted)')+';">'+(myR2Rxn?myR2Rxn+' ':'')+' Me gusta</button>'
                  +'<div class="cmt-rxn-popup">'+r2RxnBtns+'</div>'
                +'</div>'
                +(r2RxnTotal>0?'<span style="font-size:.68rem;background:var(--bg3);border-radius:100px;padding:1px 5px;color:var(--muted);">'+r2TopRxn+' '+r2RxnTotal+'</span>':'')
              +'</div>'
            +'</div>'
          +'</div>';
        }
        const repliesHTML = replies.slice(0,30).map(replyHTML).join('');
        const label = replies.length === 1 ? '1 respuesta' : replies.length+' respuestas';
        return '<div style="margin-left:44px;margin-top:2px;">'
          +'<button onclick="toggleReplies(\''+rid+'\')" id="btn_'+rid+'" style="background:none;border:none;color:#1877f2;font-size:.82rem;font-weight:700;cursor:pointer;padding:6px 0;">↩ '+label+'</button>'
          +'<div id="'+rid+'" style="display:none;margin-top:4px;">'+repliesHTML+'</div>'
          +'</div>';
      })()

    }).join('');
  // Verificar estado en tiempo real desde el caché de usuarios verificados
  const isVerif = false;
  const _isMyPost = window.CU && p.userId === window.CU.id;
  // Leer shopEquipped del autor desde el cache global _usersShop (tiempo real, visible para TODOS)
  const _authorShop = (window._usersShop && window._usersShop[p.userId]) || {};
  const _postColorId = _authorShop.postcolor || null;
  const _postTheme = _postColorId ? (SHOP_ITEMS.find(i=>i.id===_postColorId)?.theme || '') : '';
  const _postBadge = _authorShop.badge ? (SHOP_ITEMS.find(i=>i.id===_authorShop.badge)?.preview || '') : '';
  const _postTitulo = _authorShop.titulo ? (()=>{ const t=SHOP_ITEMS.find(i=>i.id===_authorShop.titulo); return t ? t.emoji+' '+t.name : ''; })() : '';
  const _postMarcoClass = _authorShop.marco ? (SHOP_ITEMS.find(i=>i.id===_authorShop.marco)?.effect || '') : '';
  return `<div class="post${isVerif?' post-verified':''}${_postTheme?' '+_postTheme:''}" id="post_${p.id}">
    ${isVerif?`<div class="verif-post-tag">✅ VERIFICADO</div>`:''}
    <div class="post-header" style="position:relative;">
      <div class="${isVerif?'post-av-wrap':''} ${_postMarcoClass}" style="display:inline-block;border-radius:50%;position:relative;">
        <div class="post-av" style="cursor:pointer;" data-uid="${p.userId}" data-nick="${esc(p.userNick)}" data-av="${p.userAv||''}" onclick="showAvatarPopup(event,this.dataset.uid,this.dataset.nick,this.dataset.av)"><img src="${p.userAv||getDefaultAv(p.userGender||'')}" onerror="if(!this.dataset.e){this.dataset.e=1;this.src=getDefaultAv();}" style="width:100%;height:100%;object-fit:cover;"></div>
      </div>
      <div class="post-meta" style="cursor:pointer" onclick="openUserProfile('${p.userId}','${esc(p.userNick)}')">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <div class="post-author">${(()=>{ const _isAdm = p.userNick==='ruizgustavo12'||p.userRole==='admin'; return _isAdm ? `<span class="admin-name">${esc(p.userNick)}</span><span class="admin-crown">👑</span>` : esc(p.userNick); })()}${_postBadge?' <span style="font-size:1rem;" title="Badge">'+_postBadge+'</span>':''}${p.feeling?` <span style="font-weight:400;font-size:.85rem;">está ${p.feeling.emoji} <span style="color:var(--muted);">me siento ${p.feeling.label}.</span></span>`:''}</div>
          ${_postTitulo?`<span style="font-size:.6rem;font-weight:800;color:var(--muted);background:rgba(0,0,0,.06);border-radius:100px;padding:1px 8px;letter-spacing:.04em;">${esc(_postTitulo)}</span>`:''}
          ${(()=>{ const plvl=getLevel(p.userXp||0); return `<span style="font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:100px;border:1px solid;color:${plvl.color};border-color:${plvl.border};background:${plvl.border.replace(/[\d.]+\)$/,'.08)')};">${plvl.name}</span>`; })()}
        </div>
        <div class="post-time">🌐 ${fmtT(p.time)}${p.feeling?` · <span style="font-size:.78rem;">${p.feeling.emoji} <span style="color:var(--muted);">me siento ${p.feeling.label}</span></span>`:''}</div>
      </div>
      <div style="position:relative;">
        <button class="post-menu" onclick="togglePostMenu('${p.id}', event, '${p.userId}')" style="font-size:1.3rem;line-height:1;">⋯</button>
        <div id="pmenu_${p.id}" data-owner="${p.userId}" style="display:none;position:absolute;right:0;top:100%;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);min-width:150px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.5);overflow:hidden;">
          ${!p.sharedFrom ? `<button onclick="togglePostMenu('${p.id}', event); _openEditPostSafe('${p.id}')" data-owner-only="true" data-edit-pid="${p.id}" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--text);padding:12px 16px;cursor:pointer;font-size:.88rem;text-align:left;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='none'">✏️ Editar</button>` : ''}
          ${window.CU?.verified&&p.userId===window.CU?.id?`<button onclick="togglePostMenu('${p.id}',event);${p.id===window.CU?.pinnedPostId?'unpinPost()':"pinPost('${p.id}')"};" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:gold;padding:12px 16px;cursor:pointer;font-size:.88rem;text-align:left;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='none'">${p.id===window.CU?.pinnedPostId?'📌 Desfijar':'📌 Fijar en perfil'}</button>`:''}
          <button onclick="togglePostMenu('${p.id}', event); deleteMyPost('${p.id}')" data-owner-only="true" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--red);padding:12px 16px;cursor:pointer;font-size:.88rem;text-align:left;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='none'">🗑 Eliminar</button>
          <button onclick="togglePostMenu('${p.id}', event); reportPost('${p.id}','${esc(p.userNick)}')" data-other-only="true" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:var(--warn);padding:12px 16px;cursor:pointer;font-size:.88rem;text-align:left;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='none'">⚠️ Reportar</button>
        </div>
      </div>
    </div>
    ${sharedHTML}
    ${!p.sharedFrom ? linkHTML : ''}
    ${!p.sharedFrom && p.text?`<div class="post-text">${renderCommentText(p.text)}</div>`:''}
    ${p.taggedPeople&&p.taggedPeople.length?`<div style="font-size:.8rem;color:var(--muted);padding:2px 14px 8px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">👥 Con: ${p.taggedPeople.map(u=>`<span onclick="openUserProfile('${u.id}','${esc(u.nick)}')" style="color:var(--accent);font-weight:700;cursor:pointer;">@${esc(u.nick)}</span>`).join(', ')}</div>`:''}
    ${!p.sharedFrom ? fishTag : ''}
    ${(()=>{
    if(p.profileAction==='cover' && p.images&&p.images[0]){
      var _imgs = p.images; var _pid = p.id;
      var _imgsJson = _imgs.map(function(x){return "'"+x+"'"}).join(',');
      return `<div style="margin:0 0 10px;border-radius:var(--rs);overflow:hidden;position:relative;background:#0d1117;cursor:pointer;" onclick="(function(){window._postImgsMap=window._postImgsMap||{};window._postImgsMap['${p.id}']=[${p.images.map(x=>"'"+x+"'").join(',')}];openImgLightboxById('${p.id}',0);})()"><img src="${p.images[0]}" style="width:100%;max-height:340px;object-fit:cover;display:block;transition:opacity .2s;" onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'" loading="lazy"><div style="position:absolute;bottom:8px;left:10px;background:rgba(0,0,0,.55);color:#fff;font-size:.72rem;padding:3px 10px;border-radius:100px;backdrop-filter:blur(6px);">📷 Nueva foto de portada</div></div>`;
    }
    if(p.profileAction==='avatar' && p.images&&p.images[0]){
      return `<div style="margin:0 0 10px;display:flex;justify-content:center;"><div style="width:140px;height:140px;border-radius:50%;overflow:hidden;border:4px solid var(--accent);box-shadow:0 0 20px rgba(0,198,255,.3);cursor:pointer;" onclick="(function(){window._postImgsMap=window._postImgsMap||{};window._postImgsMap['${p.id}']=[${p.images.map(x=>"'"+x+"'").join(',')}];openImgLightboxById('${p.id}',0);})()"><img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy"></div></div>`;
    }
    return !p.sharedFrom ? imgHTML : '';
  })()}
    ${videoHTML}
    <div class="post-stats">
      <div class="post-rxn-summary" id="rxns_${p.id}" onclick="openReactionsModal('${p.id}')" style="${totalRxn>0?'cursor:pointer':'cursor:default'}">
        <span style="display:flex;gap:2px;align-items:center;">
          ${topRxn?`<span style="background:var(--bg3);border-radius:100px;padding:2px 8px;font-size:.82rem;">${topRxn}</span>`:''}
          ${totalRxn>0?`<span style="font-size:.78rem;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${buildRxnLabel(p)}</span>`:''}
        </span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <div style="font-size:.78rem;color:var(--muted);cursor:pointer" onclick="toggleComments('${p.id}')">${(p.comments||[]).length>0?(p.comments||[]).length+' comentarios':''}</div>
        ${(p.shares||0)>0?`<div style="font-size:.78rem;color:var(--muted);">${p.shares} ${p.shares===1?'vez compartido':'veces compartido'}</div>`:''}
      </div>
    </div>
    <div class="post-actions">
      <div class="rxn-wrap" onmouseenter="showRxnPop('${p.id}')" onmouseleave="schedHideRxnPop('${p.id}')">
        <button class="post-action-btn ${myRxn?'active':''}" id="rxnt_${p.id}" onclick="quickReact('${p.id}')" style="${myRxn?`color:${REACTIONS.find(r=>r.emoji===myRxn)?.color||'var(--accent)'}`:''}">${myRxn||'👍'} <span style="font-size:.82rem;">${myRxn ? (REACTIONS.find(r=>r.emoji===myRxn)?.label||'Me gusta') : 'Me gusta'}</span></button>
        <div class="rxn-popup" id="rxnp_${p.id}" onmouseenter="cancelHideRxnPop('${p.id}')" onmouseleave="schedHideRxnPop('${p.id}')">${rxnBtns}</div>
      </div>
      <button class="post-action-btn" onclick="toggleComments('${p.id}')">💬 <span style="font-size:.82rem;">Comentar</span></button>
      <button class="post-action-btn" onclick="sharePost('${p.id}')">🔁 <span style="font-size:.82rem;">Compartir</span></button>
      <button class="post-action-btn" onclick="(function(){var u=encodeURIComponent(location.origin+location.pathname+'?p=${p.id}');window.open('https://www.facebook.com/sharer/sharer.php?u='+u,'_blank','width=640,height=460,resizable=yes');})();" title="Compartir en Facebook" style="color:#1877F2;gap:5px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
        <span style="font-size:.82rem;">Facebook</span>
      </button>
    </div>
    <div class="comments-section" id="cmts_${p.id}">
      <div class="cmt-list" id="cmt-list_${p.id}">${cmtsHTML}</div>
      <div class="comment-input-row">
        <div class="sl-av" style="width:36px;height:36px;font-size:.8rem;flex-shrink:0;">${window.CU?.av?'<img src="'+window.CU.av+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">':window.CU?.nick?.[0]||'?'}</div>
        <div style="position:relative;flex:1;display:flex;align-items:center;background:#0d1117;border-radius:20px;padding:0 8px 0 0;">
          <input class="comment-input" placeholder="Escribe un comentario..." id="cinp_${p.id}" 
            onkeypress="if(event.key==='Enter'){event.preventDefault();submitComment('${p.id}');}"
            oninput="handleMentionInput(this,'${p.id}')" style="flex:1;background:transparent;border:none;padding:9px 12px;">
          <button onclick="openEmojiPicker(event,'cinp_${p.id}')" style="background:none;border:none;font-size:1rem;cursor:pointer;padding:4px;color:#8b949e;" title="Emoji">😊</button>
          <label style="background:none;border:none;font-size:1rem;cursor:pointer;padding:4px;color:#8b949e;display:flex;align-items:center;" title="Imagen">
            🖼️<input type="file" accept="image/*" style="display:none;" onchange="submitCommentImg(this,'${p.id}')">
          </label>
          <button onclick="toggleStickerPicker('stkpick_${p.id}','cinp_${p.id}')" style="background:none;border:none;font-size:1rem;cursor:pointer;padding:4px;color:#8b949e;" title="Stickers">🎭</button>
          <button onclick="toggleGifPicker('gifpick_${p.id}','cinp_${p.id}')" style="background:none;border:none;font-size:.6rem;font-weight:900;cursor:pointer;padding:3px 5px;color:#8b949e;border:1px solid #65676b;border-radius:4px;line-height:1;" title="GIF">GIF</button>
          <div class="gif-picker" id="gifpick_${p.id}" style="bottom:calc(100% + 4px);">
            <div class="gif-search"><input type="text" placeholder="Buscar GIF..." oninput="searchGifs(this.value,'gifpick_${p.id}','cinp_${p.id}')"><button onclick="closeGifPicker('gifpick_${p.id}')" style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;">✕</button></div>
            <div class="gif-grid" id="gifgrid_${p.id}"></div>
            <div class="gif-powered">Powered by GIPHY</div>
          </div>
          <div class="stk-picker" id="stkpick_${p.id}">
            <div class="stk-search">
              <span style="font-size:1rem;">🔍</span>
              <input type="text" placeholder="Buscar" id="stksearch_${p.id}" oninput="searchStickers(this.value,'stkpick_${p.id}','cinp_${p.id}')">
              <button onclick="closeStickerPicker('stkpick_${p.id}')" style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;padding:2px;">✕</button>
            </div>
            <div id="stkcontent_${p.id}">
              <div class="stk-cats" id="stkcats_${p.id}"></div>
            </div>
          </div>
          <div id="mention_${p.id}" style="display:none;position:absolute;bottom:calc(100% + 4px);left:0;background:#161b22;border:1px solid #30363d;border-radius:8px;min-width:180px;max-height:180px;overflow-y:auto;z-index:500;box-shadow:0 4px 16px rgba(0,0,0,.2);"></div>
        </div>
      </div>
    </div>
  </div>`;
}

// ── Link preview helpers ──
let _linkDebounceTimer = null;
function toggleLinkInput(){
  const row = document.getElementById('linkInputRow');
  if(!row) return;
  row.style.display = row.style.display === 'none' ? 'block' : 'none';
  if(row.style.display === 'block') document.getElementById('postLinkInput').focus();
}
function clearPostLink(){
  const inp = document.getElementById('postLinkInput');
  const box = document.getElementById('linkPreviewBox');
  if(inp) inp.value = '';
  if(box){ box.style.display='none'; box.innerHTML=''; }
  window._pendingLinkData = null;
}
function debounceLinkPreview(val){
  clearTimeout(_linkDebounceTimer);
  if(!val.trim()){ clearPostLink(); return; }
  _linkDebounceTimer = setTimeout(()=>fetchLinkPreview(val.trim()), 700);
}

let _autoLinkUrl='', _autoLinkTmr=null;
function _autoLinkDetect(txt){
  const m=(txt.match(/https?:\/\/[^\s]+/)||[])[0]||'';
  if(m && m!==_autoLinkUrl){ _autoLinkUrl=m; clearTimeout(_autoLinkTmr); _autoLinkTmr=setTimeout(function(){ fetchLinkPreview(m); },900); }
  else if(!m && _autoLinkUrl){ _autoLinkUrl=''; clearPostLink(); }
}
function _buildLinkCard(lnk){
  if(!lnk||!lnk.url) return '';
  var disp=lnk.url; try{disp=new URL(lnk.url).hostname+(new URL(lnk.url).pathname.length>1?new URL(lnk.url).pathname:'');}catch(e){}
  if(disp.length>55) disp=disp.slice(0,55)+'...';
  var imgPart=lnk.img?'<img src="'+esc(lnk.img)+'" style="width:100%;max-height:240px;object-fit:cover;display:block;" loading="lazy" onerror="this.remove()">':'';
  var sitePart=lnk.site?'<div style="font-size:.63rem;color:var(--accent);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;font-weight:700;">'+esc(lnk.site)+'</div>':'';
  var descPart=lnk.desc?'<div style="font-size:.78rem;color:var(--muted);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:3px;">'+esc(lnk.desc)+'</div>':'';
  return '<div style="margin:0 0 10px;">'
    +'<a href="'+esc(lnk.url)+'" target="_blank" rel="noopener" style="display:block;text-decoration:none;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg3);transition:opacity .15s;" onmouseover="this.style.opacity=\'0.85\'" onmouseout="this.style.opacity=\'1\'">'
    +imgPart
    +'<div style="padding:10px 14px 12px;">'+sitePart
    +'<div style="font-size:.88rem;font-weight:700;color:var(--text);line-height:1.35;">'+esc(lnk.title||lnk.url)+'</div>'
    +descPart
    +'<div style="font-size:.7rem;color:var(--muted);margin-top:6px;">🔗 '+esc(disp)+'</div>'
    +'</div></a></div>';
}

async function fetchLinkPreview(url){
  if(!url) return;
  if(!url.startsWith('http')) url = 'https://' + url;
  const box = document.getElementById('linkPreviewBox');
  if(!box) return;
  box.style.display = 'block';
  box.innerHTML = '<div style="color:var(--muted);font-size:.8rem;padding:10px;text-align:center;">⏳ Cargando...</div>';
  try {
    const resp = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(url));
    const json = await resp.json();
    const tmp = document.createElement('div');
    tmp.innerHTML = json.contents || '';
    function gm(k){ return (tmp.querySelector('meta[property="'+k+'"]') || tmp.querySelector('meta[name="'+k+'"]') || {getAttribute:function(){return '';}}).getAttribute('content') || ''; }
    const title = gm('og:title') || (tmp.querySelector('title')||{}).textContent || url;
    const desc = gm('og:description') || gm('description') || '';
    const img = gm('og:image') || '';
    let site = gm('og:site_name'); try{ if(!site) site=new URL(url).hostname; }catch(e2){site='';}
    window._pendingLinkData = {url,title,desc,img,site};
    let disp=url; try{disp=new URL(url).hostname+(new URL(url).pathname.length>1?new URL(url).pathname:'');}catch(e3){}
    if(disp.length>60) disp=disp.slice(0,60)+'...';
    box.innerHTML='';
    const wrap = document.createElement('div');
    wrap.style.cssText='border:1px solid var(--border);border-radius:var(--rs);overflow:hidden;background:var(--bg3);';
    if(img){ const im=document.createElement('img'); im.src=img; im.style.cssText='width:100%;max-height:220px;object-fit:cover;display:block;'; im.onerror=function(){this.remove();}; wrap.appendChild(im); }
    const info=document.createElement('div'); info.style.cssText='padding:10px 12px;';
    const sSite=document.createElement('div'); sSite.style.cssText='font-size:.63rem;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;'; sSite.textContent=site.toUpperCase(); info.appendChild(sSite);
    const sTitle=document.createElement('div'); sTitle.style.cssText='font-size:.88rem;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:3px;'; sTitle.textContent=title; info.appendChild(sTitle);
    if(desc){ const sDesc=document.createElement('div'); sDesc.style.cssText='font-size:.78rem;color:var(--muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;'; sDesc.textContent=desc; info.appendChild(sDesc); }
    const link=document.createElement('a'); link.href=url; link.target='_blank'; link.rel='noopener'; link.style.cssText='display:block;text-decoration:none;color:var(--accent);font-size:.78rem;padding:4px 12px 8px;';link.textContent=disp;
    wrap.appendChild(info); wrap.appendChild(link); box.appendChild(wrap);
  } catch(e){
    box.innerHTML='<div style="color:var(--muted);font-size:.78rem;padding:10px;text-align:center;">No se pudo cargar la vista previa.</div>';
    window._pendingLinkData={url,title:url,desc:'',img:'',site:''};
  }
}

async function submitPost(){
  if(!window.CU){ toast('Inicia sesión primero','err'); return; }
  const text = document.getElementById('postText').value.trim();
  const fish = document.getElementById('tagFish').value.trim();
  const weight = parseFloat(document.getElementById('tagWeight').value)||0;
  const map = document.getElementById('tagMap').value;
  const tech = document.getElementById('tagTech').value;
  const linkUrl = document.getElementById('postLinkInput')?.value.trim()||'';
  const videoUrl0 = document.getElementById('ytUrlInput')?.value.trim() || '';
  if(!text && !fish && !_postMediaFiles.length && !linkUrl && !videoUrl0){ toast('Escribe algo o agrega un video para publicar','err'); return; }

  toast('Publicando...','inf');
  if(window.CU?.verified) launchGoldConfetti();
  const mediaUrls = [];
  let uploadedVideoUrl = videoUrl0;
  for(const m of _postMediaFiles){
    if(m.type==='image') mediaUrls.push(await uploadImage(m.file,'posts'));
    else if(m.type==='video'){
      if(!window.CU?.verified){ toast('Solo verificados pueden subir videos','err'); return; }
      uploadedVideoUrl = await uploadVideo(m.file,'posts');
    }
  }
  const videoUrl = uploadedVideoUrl;

  const postMentionEl = document.getElementById('mention_postText');
  if(postMentionEl) postMentionEl.style.display='none';

  // Detectar URL en texto si no se usó el input de link
  const _textUrl = (!linkUrl && text) ? (text.match(/https?:\/\/[^\s]+/)||[])[0]||'' : '';
  const _finalLinkUrl = linkUrl || _textUrl;
  const linkData = _finalLinkUrl
    ? (window._pendingLinkData?.url === _finalLinkUrl ? window._pendingLinkData : { url:_finalLinkUrl, title:_finalLinkUrl, desc:'', img:'', site:'' })
    : null;
  const newPostRef = await addDoc(collection(db,'posts'),{
    userId:window.CU.id, userNick:window.CU.nick, userAv:window.CU.av||'', userXp:window.CU.xp||0, userVerified:window.CU.verified||false,
    text, fish, weight, map, tech,
    images: mediaUrls,
    video: videoUrl,
    videoStatus: (videoUrl && videoUrl.includes('youtube.com') && window._ytUploadedThisSession) ? 'pending' : null,
    link: linkData,
    feeling: window._selectedFeeling || null,
    taggedPeople: (window._taggedPeople||[]).map(u=>({id:u.id,nick:u.nick,av:u.av||''})),
    time: serverTimestamp(),
    likes:0, comments:[], reactions:{}, reactionCounts:{}
  });
  window._ytUploadedThisSession = false;

  // config/stats: incrementar totalPosts
  try{ await setDoc(doc(db,'config','stats'),{totalPosts: increment(1)},{merge:true}); }catch(e){}

  // Notificar a personas etiquetadas desde el modal
  if(window._taggedPeople && window._taggedPeople.length){
    for(const u of window._taggedPeople){
      if(u.id !== window.CU.id){
        sendNotifToUserWithPost(u.id, `🏷️ ${window.CU.nick} te etiquetó en una publicación${text?`: "${text.slice(0,50)}"`:'.'}`, newPostRef.id);
      }
    }
  }

  // Notificar a usuarios etiquetados con @
  const postMentions = text.match(/@([\w\d_]+)/g);
  if(postMentions){
    try {
      const notified = new Set();
      for(const m of postMentions){
        const nick = m.slice(1).toLowerCase();
        const _uSnap = await getDocs(query(collection(db,'users'), where('nickLower','==',nick), limit(1)));
        const user = _uSnap.docs.length ? {id:_uSnap.docs[0].id,..._uSnap.docs[0].data()} : null;
        if(user && user.id !== window.CU.id && !notified.has(user.id)){
          notified.add(user.id);
          sendNotifToUserWithPost(user.id, `🏷️ ${window.CU.nick} te etiquetó en una publicación: "${text.slice(0,50)}"`, newPostRef.id);
        }
      }
    } catch(e){}
  }

  _postMediaFiles = [];
  document.getElementById('postText').value='';
  document.getElementById('tagFish').value='';
  document.getElementById('tagWeight').value='';
  document.getElementById('tagMap').value='';
  document.getElementById('tagTech').value='';
  document.getElementById('fishTagRow').style.display='none';
  clearYtInput();
  clearPostLink();
  document.getElementById('postMediaPreview').style.display='none';
  document.getElementById('linkInputRow').style.display='none';
  window.clearFeeling && window.clearFeeling();
  window._taggedPeople = [];
  const tagRow = document.getElementById('taggedPeopleRow');
  const tagChips = document.getElementById('taggedPeopleChips');
  if(tagRow) tagRow.style.display='none';
  if(tagChips) tagChips.innerHTML='';
  cm('mCreatePost');
  addNotif('📝 Publicaste una nueva captura'+(fish?`: ${fish} ${weight?fmtKg(weight):''}`:''));
  addXP(10,'publicación');
  toast('¡Publicado! 🎣 +10 XP','ok');
}

// ── Emoji Picker ──
const EMOJI_LIST = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙',
  '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒',
  '🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵',
  '🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧',
  '😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈',
  '👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀',
  '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️',
  '👍','👎','✊','👊','🤛','🤜','👏','🙌','🤲','🙏','✍️','💪','🦾','🦿','🦵','🦶','👂','🦻',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝',
  '🎣','🐟','🐠','🐡','🦈','🎏','🏆','🥇','🥈','🥉','🏅','🎯','🎮','⚽','🏀','🎾','🎱','🏊',
  '🌊','🏞️','🌅','🌄','🌈','⭐','🌟','💫','✨','🌙','☀️','🌤️','⛅','🌦️','🌧️','⛈️','🌩️',
  '🍕','🍔','🍟','🌭','🍿','🧂','🥓','🥚','🍳','🥞','🧇','🥐','🍞','🥖','🥨','🧀','🥗',
  '🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧃','🥤','🧋','☕','🍵','🫖','🍶','🥛','🍼',
  '🔥','💥','🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏠','🚗','✈️','🚀','💻','📱','📸','🎵'
];
let _emojiTarget = null;
let _emojiPickerOpen = false;

function openEmojiPicker(e, targetId){
  if(e) e.stopPropagation();
  const wrap = document.getElementById('emojiPickerWrap');
  if(!wrap) return;
  
  if(_emojiPickerOpen && _emojiTarget===targetId){
    wrap.style.display='none'; _emojiPickerOpen=false; return;
  }
  _emojiTarget = targetId;
  _emojiPickerOpen = true;
  
  // Build grid if empty
  const grid = document.getElementById('emojiPickerGrid');
  if(grid && !grid.children.length){
    grid.innerHTML = EMOJI_LIST.map(em=>'<button onmousedown="insertEmojiChar(\''+em+'\')" style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:4px;border-radius:6px;transition:background .1s;line-height:1;" onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'none\'">'+em+'</button>').join('');
  }
  
  // Position near button
  const btn = e ? e.currentTarget || e.target : null;
  if(btn){
    const rect = btn.getBoundingClientRect();
    const pickerH = 220;
    const top = rect.top - pickerH - 8 < 0 ? rect.bottom + 4 : rect.top - pickerH - 4;
    wrap.style.left = Math.min(rect.left, window.innerWidth - 290) + 'px';
    wrap.style.top = top + 'px';
  }
  wrap.style.display='block';
  
  const closeP = function(ev){
    if(!wrap.contains(ev.target) && ev.target!==btn){
      wrap.style.display='none'; _emojiPickerOpen=false;
      document.removeEventListener('mousedown',closeP);
    }
  };
  setTimeout(()=>document.addEventListener('mousedown',closeP), 50);
}

function insertEmojiChar(em){
  const el = document.getElementById(_emojiTarget);
  if(!el) return;
  const start = el.selectionStart||0;
  const end = el.selectionEnd||0;
  el.value = el.value.slice(0,start) + em + el.value.slice(end);
  el.focus();
  el.selectionStart = el.selectionEnd = start + em.length;
  // Trigger oninput handlers
  el.dispatchEvent(new Event('input', {bubbles:true}));
  // Don't close picker — user may want multiple emojis
}

function insertEmoji(){ document.getElementById('postText').value += ' 🎣'; }
function insertFishTag(){ document.getElementById('fishTagRow').style.display = document.getElementById('fishTagRow').style.display==='none'?'block':'none'; }

// ── Etiquetar Personas ─────────────────────────────────────────────────────
window._taggedPeople = []; // [{id, nick, av}]

window.openTagPeopleModal = function(){
  cm('mCreatePost');
  renderTagPeopleSelected();
  searchTagPeople('');
  const si = document.getElementById('tagPeopleSearch');
  if(si){ si.value=''; si.focus(); }
  om('mTagPeople');
};

window.searchTagPeople = async function(q){
  const el = document.getElementById('tagPeopleList');
  if(!el) return;
  el.innerHTML = `<div style="padding:12px 4px;font-size:.78rem;color:var(--muted);">Buscando...</div>`;
  try {
    const snap = await getDocs(query(collection(db,'users'), limit(150)));
    let users = snap.docs.map(d=>({id:d.id,...d.data()}))
      .filter(u => u.id !== window.CU?.id);
    if(q.trim()) users = users.filter(u=>(u.nick||'').toLowerCase().includes(q.toLowerCase()));
    users = users.slice(0, 30);
    if(!users.length){ el.innerHTML=`<div style="padding:20px;text-align:center;color:var(--muted);font-size:.85rem;">Sin resultados</div>`; return; }
    const taggedIds = new Set(window._taggedPeople.map(u=>u.id));
    el.innerHTML = users.map(u=>{
      const tagged = taggedIds.has(u.id);
      return `<div onclick="toggleTagPerson('${u.id}','${(u.nick||'').replace(/'/g,"\\'")}','${u.av||''}')"
        style="display:flex;align-items:center;gap:10px;padding:10px 6px;border-radius:8px;cursor:pointer;transition:background .15s;"
        onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <img src="${u.av||getDefaultAv(u.gender||'')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.src=getDefaultAv()">
        <div style="flex:1;min-width:0;">
          <div style="font-size:.88rem;font-weight:700;color:var(--text);">${esc(u.nick||'')}</div>
          ${u.country?`<div style="font-size:.72rem;color:var(--muted);">${u.country}</div>`:''}
        </div>
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${tagged?'var(--accent)':'var(--border)'};background:${tagged?'var(--accent)':'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:.15s;">
          ${tagged?'<span style="color:#fff;font-size:.7rem;font-weight:900;">✓</span>':''}
        </div>
      </div>`;
    }).join('');
  } catch(e){ el.innerHTML=`<div style="padding:12px;color:var(--muted);font-size:.78rem;">Error al buscar</div>`; }
};

window.toggleTagPerson = function(id, nick, av){
  const idx = window._taggedPeople.findIndex(u=>u.id===id);
  if(idx>=0) window._taggedPeople.splice(idx,1);
  else window._taggedPeople.push({id, nick, av});
  renderTagPeopleSelected();
  const si = document.getElementById('tagPeopleSearch');
  searchTagPeople(si ? si.value : '');
};

function renderTagPeopleSelected(){
  const el = document.getElementById('tagPeopleSelected');
  if(!el) return;
  if(!window._taggedPeople.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display='flex';
  el.innerHTML = window._taggedPeople.map(u=>`
    <div style="display:inline-flex;align-items:center;gap:5px;background:rgba(0,120,255,.15);border:1px solid rgba(0,120,255,.3);border-radius:100px;padding:4px 10px 4px 6px;">
      <img src="${u.av||getDefaultAv()}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;" onerror="this.src=getDefaultAv()">
      <span style="font-size:.78rem;font-weight:700;color:var(--accent);">@${esc(u.nick)}</span>
      <span onclick="toggleTagPerson('${u.id}','${u.nick.replace(/'/g,"\\'")}','${u.av||''}')" style="cursor:pointer;color:var(--muted);font-size:.75rem;margin-left:2px;">✕</span>
    </div>`).join('');
}

window.applyTaggedPeople = function(){
  cm('mTagPeople');
  om('mCreatePost');
  // Mostrar chips en el post modal
  const row = document.getElementById('taggedPeopleRow');
  const chips = document.getElementById('taggedPeopleChips');
  if(!row || !chips) return;
  if(!window._taggedPeople.length){ row.style.display='none'; chips.innerHTML=''; return; }
  row.style.display='flex';
  chips.innerHTML = window._taggedPeople.map(u=>`
    <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,120,255,.12);border:1px solid rgba(0,120,255,.25);border-radius:100px;padding:3px 9px 3px 5px;">
      <img src="${u.av||getDefaultAv()}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;" onerror="this.src=getDefaultAv()">
      <span style="font-size:.75rem;font-weight:700;color:var(--accent);">@${esc(u.nick)}</span>
      <span onclick="removeTaggedPerson('${u.id}')" style="cursor:pointer;color:var(--muted);font-size:.7rem;margin-left:2px;">✕</span>
    </div>`).join('');
};

window.removeTaggedPerson = function(id){
  window._taggedPeople = window._taggedPeople.filter(u=>u.id!==id);
  window.applyTaggedPeople();
  if(!window._taggedPeople.length){
    const row = document.getElementById('taggedPeopleRow');
    if(row) row.style.display='none';
  }
};
const _FEELINGS = {
  sentimientos: [
    {e:'😊',l:'feliz'},{e:'😇',l:'bendecido'},{e:'🥰',l:'amado'},{e:'😢',l:'triste'},
    {e:'😍',l:'encantador'},{e:'🙏',l:'agradecido'},{e:'😃',l:'entusiasmado'},{e:'😍',l:'enamorado'},
    {e:'😜',l:'loco'},{e:'😌',l:'complacido'},{e:'😄',l:'dichoso'},{e:'😁',l:'fantástico'},
    {e:'🤡',l:'bobo'},{e:'🎉',l:'festivo'},{e:'😎',l:'genial'},{e:'🤩',l:'asombrado'},
    {e:'😤',l:'orgulloso'},{e:'😔',l:'melancólico'},{e:'🥳',l:'celebrando'},{e:'😴',l:'cansado'},
    {e:'🤔',l:'pensativo'},{e:'😡',l:'enojado'},{e:'😰',l:'nervioso'},{e:'🤗',l:'agradable'},
    {e:'😂',l:'gracioso'},{e:'🥺',l:'nostálgico'},{e:'😑',l:'aburrido'},{e:'🤭',l:'avergonzado'},
  ],
  actividades: [
    {e:'🎣',l:'pescando'},{e:'🏃',l:'corriendo'},{e:'🍕',l:'comiendo'},{e:'🎮',l:'jugando'},
    {e:'📚',l:'estudiando'},{e:'✈️',l:'viajando'},{e:'🏋️',l:'entrenando'},{e:'🎵',l:'escuchando música'},
    {e:'🎬',l:'viendo una película'},{e:'😴',l:'durmiendo'},{e:'🍺',l:'tomando algo'},{e:'🏊',l:'nadando'},
    {e:'🚴',l:'pedaleando'},{e:'🧘',l:'meditando'},{e:'👨‍🍳',l:'cocinando'},{e:'📸',l:'sacando fotos'},
    {e:'🎤',l:'cantando'},{e:'🌿',l:'en la naturaleza'},{e:'🐟',l:'con mi pesca'},{e:'🏕️',l:'acampando'},
    {e:'🚣',l:'remando'},{e:'☀️',l:'disfrutando el sol'},{e:'🌙',l:'en una noche tranquila'},{e:'🤝',l:'con amigos'},
  ]
};
let _feelingTab = 'sentimientos';
window._selectedFeeling = null;

window.openFeelingModal = function(){
  _feelingTab = 'sentimientos';
  window._selectedFeeling = null;
  renderFeelingList('');
  const si = document.getElementById('feelingSearch');
  if(si) si.value = '';
  switchFeelingTab('sentimientos');
  om('mFeeling');
};

window.switchFeelingTab = function(tab){
  _feelingTab = tab;
  const ts = document.getElementById('feelingTabSent');
  const ta = document.getElementById('feelingTabAct');
  if(ts && ta){
    ts.style.borderBottomColor = tab==='sentimientos' ? 'var(--accent)' : 'transparent';
    ts.style.color = tab==='sentimientos' ? 'var(--accent)' : 'var(--muted)';
    ta.style.borderBottomColor = tab==='actividades' ? 'var(--accent)' : 'transparent';
    ta.style.color = tab==='actividades' ? 'var(--accent)' : 'var(--muted)';
  }
  const si = document.getElementById('feelingSearch');
  renderFeelingList(si ? si.value : '');
};

window.filterFeelings = function(q){ renderFeelingList(q); };

function renderFeelingList(q){
  const el = document.getElementById('feelingList');
  if(!el) return;
  const items = _FEELINGS[_feelingTab] || [];
  const filtered = q.trim() ? items.filter(f=>f.l.includes(q.toLowerCase())) : items;
  if(!filtered.length){ el.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:.85rem;">Sin resultados</div>`; return; }
  const cols = [];
  const half = Math.ceil(filtered.length/2);
  const left = filtered.slice(0,half);
  const right = filtered.slice(half);
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;">`;
  const maxLen = Math.max(left.length, right.length);
  for(let i=0;i<maxLen;i++){
    [left[i], right[i]].forEach(f=>{
      if(!f){ html += `<div></div>`; return; }
      html += `<div onclick="selectFeeling('${f.e}','${f.l}')" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
        <span style="font-size:1.4rem;flex-shrink:0;">${f.e}</span>
        <span style="font-size:.88rem;color:var(--text);">${f.l}</span>
      </div>`;
    });
  }
  html += `</div>`;
  el.innerHTML = html;
}

window.selectFeeling = function(emoji, label){
  window._selectedFeeling = {emoji, label};
  cm('mFeeling');
  // Mostrar en el header del post
  const tag = document.getElementById('cpFeelingTag');
  const emojiEl = document.getElementById('cpFeelingEmoji');
  const labelEl = document.getElementById('cpFeelingLabel');
  if(tag && emojiEl && labelEl){
    emojiEl.textContent = emoji;
    labelEl.textContent = 'me siento ' + label + '.';
    tag.style.display = 'inline-flex';
  }
  // Asegurar que el modal de post esté abierto
  if(!document.getElementById('mCreatePost')?.classList.contains('open')) om('mCreatePost');
};

window.clearFeeling = function(){
  window._selectedFeeling = null;
  const tag = document.getElementById('cpFeelingTag');
  if(tag) tag.style.display = 'none';
};
function focusPostTextAndAt(){
  const inp = document.getElementById('postText');
  if(!inp) return;
  inp.focus();
  const val = inp.value;
  if(!val.endsWith('@') && !val.endsWith(' ')) inp.value = val + ' @';
  else if(!val.endsWith('@')) inp.value = val + '@';
  handlePostMentionInput(inp);
}

let _postMentionTimer = null;
async function handlePostMentionInput(inp){
  const val = inp.value;
  const atIdx = val.lastIndexOf('@');
  const mentionEl = document.getElementById('mention_postText');
  if(!mentionEl) return;
  if(atIdx === -1 || val.slice(atIdx+1).includes(' ')){
    mentionEl.style.display='none'; return;
  }
  const query_str = val.slice(atIdx+1).toLowerCase();
  if(!query_str){ mentionEl.style.display='none'; return; }
  clearTimeout(_postMentionTimer);
  _postMentionTimer = setTimeout(async ()=>{
    try {
      const snap = await getDocs(query(collection(db,'users'), where('nickLower','>=',query_str), where('nickLower','<=',query_str+''), limit(6)));
      const users = snap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.id!==window.CU?.id);
      if(!users.length){ mentionEl.style.display='none'; return; }
      mentionEl.innerHTML = users.map(u=>{
        const safeNick = (u.nick||'').replace(/"/g,'&quot;');
        return `<div data-nick="${safeNick}" style="padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.83rem;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">`+
          `<div style="width:28px;height:28px;border-radius:50%;background:var(--accent);color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.78rem;overflow:hidden;flex-shrink:0;">`+
          `<img src="${u.av||getDefaultAv(u.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`+
          `</div><span>@${esc(u.nick||'')}</span></div>`;
      }).join('');
      mentionEl.onclick = (ev)=>{
        const row = ev.target.closest('[data-nick]');
        if(row && row.dataset.nick) insertPostMention(row.dataset.nick);
      };
      mentionEl.style.display='block';
    } catch(e){ mentionEl.style.display='none'; }
  }, 250);
}

function insertPostMention(nick){
  const inp = document.getElementById('postText');
  const mentionEl = document.getElementById('mention_postText');
  if(!inp) return;
  const val = inp.value;
  const atIdx = val.lastIndexOf('@');
  inp.value = val.slice(0, atIdx) + '@' + nick + ' ';
  inp.focus();
  if(mentionEl) mentionEl.style.display='none';
}

// ===== REACTIONS =====
const _rxnPops = {};
function showRxnPop(id){ cancelHideRxnPop(id); document.getElementById('rxnp_'+id)?.classList.add('show'); }
function schedHideRxnPop(id){ _rxnPops[id]=setTimeout(()=>{ document.getElementById('rxnp_'+id)?.classList.remove('show'); },800); }
function cancelHideRxnPop(id){ if(_rxnPops[id]){clearTimeout(_rxnPops[id]);delete _rxnPops[id];} }

async function doReact(pid, emoji){
  if(!window.CU){ toast('Inicia sesión para reaccionar','err'); return; }
  // Determine Firestore collection
  const isTrofeo = pid.startsWith('trofeo_');
  const realId = isTrofeo ? pid.replace('trofeo_','') : pid;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';

  let p = _posts.find(p=>p.id===pid);
  if(!p){
    try {
      const snap = await getDoc(doc(db, colName, realId));
      if(!snap.exists()){ toast('Publicación no encontrada','err'); return; }
      p = {id:pid,...snap.data()};
      _posts.push(p);
    } catch(e){ toast('Error al cargar publicación','err'); return; }
  }
  const prev = p.reactions?.[window.CU.id] || null;
  const updates = {};
  if(prev){ updates[`reactionCounts.${prev}`] = increment(-1); }
  if(prev === emoji){ updates[`reactions.${window.CU.id}`] = ''; }
  else {
    updates[`reactions.${window.CU.id}`] = emoji;
    updates[`reactionCounts.${emoji}`] = increment(1);
    if(emoji && !prev) addXP(1,'reacción');
    if(p.userId && p.userId !== window.CU.id && !prev){
      const preview = (p.text||'').slice(0,80) + ((p.text||'').length>80?'...':'');
      const postImg = (p.images&&p.images[0]) || p.imgUrl || null;
      const msg = `${emoji} ${window.CU.nick} reaccionó a tu publicación`;
      sendNotifToUserWithPost(p.userId, msg, pid, {
        postImg,
        postPreviewText: preview || null
      });
    }
  }
  document.getElementById('rxnp_'+pid)?.classList.remove('show');
  // Optimistic UI
  if(!p.reactions) p.reactions = {};
  if(!p.reactionCounts) p.reactionCounts = {};
  if(prev){ p.reactionCounts[prev] = Math.max(0,(p.reactionCounts[prev]||1)-1); }
  if(prev === emoji){ delete p.reactions[window.CU.id]; }
  else { p.reactions[window.CU.id] = emoji; p.reactionCounts[emoji] = (p.reactionCounts[emoji]||0)+1; }

  const myNewRxn = prev===emoji ? null : emoji;
  const rxnDef = REACTIONS?.find(r=>r.emoji===myNewRxn);

  // Update reaction button — normal posts
  const rxnBtn = document.getElementById('rxnt_'+pid);
  if(rxnBtn){
    rxnBtn.innerHTML = (myNewRxn||'👍') + ' <span style="font-size:.82rem;">' + (rxnDef?.label||'Me gusta') + '</span>';
    rxnBtn.style.color = myNewRxn ? (rxnDef?.color||'var(--accent)') : '';
    rxnBtn.classList.toggle('active', !!myNewRxn);
  }
  // Update reaction button — trofeo cards
  const trofeoRxnIcon = document.getElementById('trofeoRxnIcon_'+realId);
  const trofeoRxnLbl = document.getElementById('trofeoRxnLbl_'+realId);
  if(trofeoRxnIcon) trofeoRxnIcon.textContent = myNewRxn||'👍';
  if(trofeoRxnLbl){ trofeoRxnLbl.textContent = rxnDef?.label||'Me gusta'; trofeoRxnLbl.closest('button').style.color = myNewRxn ? (rxnDef?.color||'var(--accent)') : ''; }

  // Update reaction summary
  const rxnSummary = document.getElementById('rxns_'+pid);
  if(rxnSummary){
    const total = Object.values(p.reactionCounts).reduce((a,b)=>a+(b||0),0);
    const top = Object.entries(p.reactionCounts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([e])=>e).join('');
    rxnSummary.innerHTML = total>0 ? `<span style="background:var(--bg3);border-radius:100px;padding:2px 8px;font-size:.82rem;">${top}</span><span style="font-size:.78rem;color:var(--muted);"> ${total}</span>` : '';
  }
  // Update modal reaction button if open
  const modalRxnBtn = document.getElementById('_modalRxnBtn_'+pid);
  if(modalRxnBtn){
    const rxnDef2 = REACTIONS?.find(r=>r.emoji===myNewRxn);
    modalRxnBtn.innerHTML = (myNewRxn||'👍') + ' Me gusta';
    modalRxnBtn.style.color = myNewRxn ? (rxnDef2?.color||'var(--accent)') : '#65676b';
  }
  try {
    await updateDoc(doc(db, colName, realId), updates);
  } catch(e){
    console.error('doReact error:', e);
    toast('Error al reaccionar — intenta de nuevo','err');
    if(prev === emoji){ p.reactions[window.CU.id] = prev; }
    else { delete p.reactions[window.CU.id]; }
  }
}
function quickReact(pid){ if(!window.CU){toast('Inicia sesión','err');return;} doReact(pid,'👍'); }

// ===== COMMENTS =====
async function toggleComments(pid){
  const el = document.getElementById('cmts_'+pid);
  if(el){
    const wasOpen = el.classList.contains('open');
    el.classList.toggle('open');
    if(!wasOpen){
      // Opening: render comments fresh from _posts cache
      const p = (_posts||[]).find(p=>p.id===pid);
      if(p) _reRenderInlineCmts(pid, p, p.comments||[]);
      setTimeout(()=>{ document.getElementById('cinp_'+pid)?.focus(); }, 50);
    }
    return;
  }

  // Fallback: modal (solo si no hay sección inline en el DOM)
  let post = (_posts||[]).find(p=>p.id===pid);
  if(!post){
    // Post no está en memoria (ej: viene de Reels) — cargar de Firestore
    try {
      const snap = await getDoc(doc(db,'posts',pid));
      if(!snap.exists()){ toast('Publicación no encontrada','err'); return; }
      post = {id:pid,...snap.data()};
      if(window._posts) _posts.push(post);
    } catch(e){ toast('Error al cargar comentarios','err'); return; }
  }

  const existing = document.getElementById('_cmtModal_'+pid);
  if(existing){ existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = '_cmtModal_'+pid;
  modal.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;';

  function _buildCmtHtml(cmts){
    if(!cmts.length) return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 20px;gap:8px;">
        <div style="width:60px;height:60px;opacity:.3;">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
            <rect x="8" y="4" width="24" height="32" rx="2" fill="#bcc0c4"/>
            <rect x="8" y="4" width="24" height="32" rx="2" fill="#bcc0c4"/>
            <path d="M26 4l6 6h-6V4z" fill="#8a8d91"/>
            <rect x="12" y="16" width="14" height="2" rx="1" fill="#fff"/>
            <rect x="12" y="21" width="10" height="2" rx="1" fill="#fff"/>
            <rect x="12" y="26" width="12" height="2" rx="1" fill="#fff"/>
            <rect x="14" y="30" width="20" height="14" rx="2" fill="#1877f2"/>
            <path d="M18 37l4 4 8-8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div style="font-weight:700;font-size:.95rem;color:#e6edf3;">Todavía no hay comentarios</div>
        <div style="font-size:.82rem;color:#8b949e;">Sé la primera persona en comentar.</div>
      </div>`;

    const CMT_RXNS_M=['👍','❤️','😂','😮','😢','🔥'];
    return cmts.map((c,ci)=>{
      const av = `<img src="${c.av||getDefaultAv(c.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`;
      const isAuthor = post.userId === c.userId;
      const isVerified = c.verified || false;
      const isMine = window.CU && c.userId === window.CU.id;
      const isPostOwner = window.CU && post.userId === window.CU.id;
      const canEdit = isMine;
      const canDel = isMine || isPostOwner || window.CU?.admin;
      const myRxnM = window.CU ? ((c.userReactions||{})[window.CU.id]||'') : '';
      const cRxnsM = c.reactions||{};
      const cRxnTotalM = Object.values(cRxnsM).reduce((a,b)=>a+b,0);
      const cTopRxnM = Object.entries(cRxnsM).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join('');
      const nameColor = isVerified ? '#f5a623' : isAuthor ? '#1877f2' : '#e6edf3';
      const verifiedBadge = '';
      const isAdminCmt = c.nick==='ruizgustavo12' || c.role==='admin';
      const adminNameHtml = isAdminCmt
        ? `<span class="admin-name" style="font-size:.82rem;">${esc(c.nick||'')}</span><span class="admin-crown" style="font-size:.72rem;">👑</span>`
        : `<span style="color:${nameColor};">${esc(c.nick||'')}</span>`;
      const rxnPopupId = `_mrxnp_${pid}_${ci}`;
      const rxnBtnsM = CMT_RXNS_M.map(em=>`<button onclick="reactCmt(event,'${pid}',${ci},'${em}');document.getElementById('${rxnPopupId}').style.display='none';" style="background:none;border:none;font-size:1.4rem;cursor:pointer;padding:3px;border-radius:50%;transition:transform .12s;" onmouseover="this.style.transform='scale(1.5) translateY(-4px)'" onmouseout="this.style.transform='scale(1)'">${em}</button>`).join('');

      const menuId = `_cmtmenu_${pid}_${ci}`;
      const menuHtml = (canEdit||canDel) ? `
        <div style="position:relative;margin-left:4px;flex-shrink:0;">
          <button onclick="var m=document.getElementById('${menuId}');m.style.display=m.style.display==='block'?'none':'block';event.stopPropagation();"
            style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;opacity:0;transition:opacity .15s;"
            onmouseover="this.style.background='#21262d';this.style.opacity='1'" onmouseout="this.style.background='none'" class="_cmtdotsbtn_">···</button>
          <div id="${menuId}" style="display:none;position:absolute;right:0;top:100%;background:#161b22;border:1px solid #30363d;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.4);min-width:160px;z-index:9999;overflow:hidden;">
            ${canEdit?`<button onclick="document.getElementById('${menuId}').style.display='none';_editModalCmt('${pid}',${ci})"
              style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;padding:10px 14px;font-size:.88rem;color:#e6edf3;cursor:pointer;font-family:'Exo 2',sans-serif;"
              onmouseover="this.style.background='#1c2128'" onmouseout="this.style.background='none'">
              <span style="font-size:1rem;">✏️</span> Editar
            </button>`:''}
            ${canDel?`<button onclick="document.getElementById('${menuId}').style.display='none';_delModalCmt('${pid}',${ci})"
              style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;padding:10px 14px;font-size:.88rem;color:#e41e3f;cursor:pointer;font-family:'Exo 2',sans-serif;"
              onmouseover="this.style.background='#1c2128'" onmouseout="this.style.background='none'">
              <span style="font-size:1rem;">🗑️</span> Eliminar
            </button>`:''}
          </div>
        </div>` : '';

      const isReply = !!c.replyTo;
      return `<div id="_cmtrow_${pid}_${ci}" style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;${isReply?'margin-left:44px;':''}" onmouseenter="var b=this.querySelector('._cmtdotsbtn_');if(b)b.style.opacity='1'" onmouseleave="var b=this.querySelector('._cmtdotsbtn_');if(b)b.style.opacity='0'">
        <div style="width:${isReply?'30px':'36px'};height:${isReply?'30px':'36px'};border-radius:50%;overflow:hidden;background:#21262d;flex-shrink:0;cursor:pointer;" onclick="openUserProfile('${c.userId||''}','${esc(c.nick||'')}')">${av}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:flex-start;gap:4px;">
            <div style="background:#21262d;border-radius:18px;padding:8px 12px;display:inline-block;max-width:calc(100% - 40px);position:relative;">
              <div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;">
                <span style="font-weight:700;font-size:.82rem;cursor:pointer;" onclick="openUserProfile('${c.userId||''}','${esc(c.nick||'')}')">${adminNameHtml}${verifiedBadge}</span>
                ${isAuthor?'<span style="font-size:.6rem;color:#1877f2;font-weight:700;background:rgba(24,119,242,.15);border-radius:4px;padding:1px 5px;">Autor</span>':''}
              </div>
              ${c.gif ? `<img src="${c.gif}" style="max-width:180px;border-radius:8px;margin-top:4px;display:block;" loading="lazy">` : `<span style="font-size:.88rem;color:#e6edf3;line-height:1.45;word-break:break-word;">${esc(c.text||'')}${c.edited?'<span style="font-size:.65rem;color:#8b949e;margin-left:4px;">(editado)</span>':''}</span>`}
              ${cRxnTotalM>0?`<div style="position:absolute;bottom:-10px;right:8px;display:flex;align-items:center;gap:2px;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:1px 5px;font-size:.72rem;cursor:pointer;" onclick="event.stopPropagation()">${cTopRxnM} <span style="color:#8b949e;">${cRxnTotalM}</span></div>`:''}
            </div>
            ${menuHtml}
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:${cRxnTotalM>0?'14px':'4px'} 4px 2px;flex-wrap:wrap;">
            <span style="font-size:.72rem;color:#8b949e;">${c.time?fmtT(c.time):''}</span>
            <div style="position:relative;">
              <button id="_mlikebtn_${pid}_${ci}" style="background:none;border:none;font-size:.75rem;font-weight:700;color:${myRxnM?'#1877f2':'#8b949e'};cursor:pointer;padding:0;transition:color .15s;"
                onclick="quickCmtRxn(event,'${pid}',${ci})"
                onmouseenter="clearTimeout(window['_mrxnhide_${pid}_${ci}']);var p=document.getElementById('${rxnPopupId}');if(p)p.style.display='flex';"
                onmouseleave="window['_mrxnhide_${pid}_${ci}']=setTimeout(function(){var p=document.getElementById('${rxnPopupId}');if(p)p.style.display='none';},400)">${myRxnM?myRxnM+' Me gusta':'👍 Me gusta'}</button>
              <div id="${rxnPopupId}" style="display:none;position:absolute;bottom:calc(100% + 6px);left:0;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:5px 8px;align-items:center;gap:2px;box-shadow:0 4px 20px rgba(0,0,0,.5);white-space:nowrap;z-index:9999;flex-direction:row;"
                onmouseenter="clearTimeout(window['_mrxnhide_${pid}_${ci}'])"
                onmouseleave="window['_mrxnhide_${pid}_${ci}']=setTimeout(function(){var p=document.getElementById('${rxnPopupId}');if(p)p.style.display='none';},200)">
                ${rxnBtnsM}
              </div>
            </div>
            <button style="background:none;border:none;font-size:.75rem;font-weight:700;color:#8b949e;cursor:pointer;padding:0;transition:color .15s;" onmouseover="this.style.color='#e6edf3'" onmouseout="this.style.color='#8b949e'" onclick="document.getElementById('_cmtModalInp_${pid}').value='@${esc(c.nick||'')} ';document.getElementById('_cmtModalInp_${pid}').focus()">Responder</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  const avHtml = window.CU ? `<img src="${window.CU.av||getDefaultAv(window.CU.gender||'')}" style="width:100%;height:100%;object-fit:cover;">` : '';
  const rxnCounts = post.reactionCounts||{};
  const topRxns = Object.entries(rxnCounts).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([e])=>e).join('');
  const totalRxns = Object.values(rxnCounts).reduce((a,b)=>a+(b||0),0);
  const cmts = post.comments||[];

  modal.innerHTML = `
  <style>
    #_cmtModalBox_${pid} * { box-sizing:border-box; }
    @keyframes _cmtFadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  </style>
  <div id="_cmtModalBox_${pid}" style="background:#161b22;border-radius:12px;width:520px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.3);animation:_cmtFadeIn .18s ease;">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:center;padding:14px 16px;border-bottom:1px solid #30363d;position:relative;flex-shrink:0;">
      <span style="font-weight:700;font-size:1rem;color:#e6edf3;">Publicación de ${esc(post.userNick||'')}</span>
      <button onclick="document.getElementById('_cmtModal_${pid}').remove()"
        style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:#21262d;border:none;color:#e6edf3;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;">✕</button>
    </div>

    <!-- Image preview if exists -->
    ${post.images&&post.images.length?`<div style="cursor:pointer;max-height:180px;overflow:hidden;flex-shrink:0;" onclick="document.getElementById('_cmtModal_${pid}').remove();openImgLightboxById('${pid}',0)"><img src="${post.images[0]}" style="width:100%;object-fit:cover;max-height:180px;display:block;"></div>`:''}

    <!-- Reaction + share counts -->
    ${(totalRxns>0||cmts.length>0)?`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 16px;flex-shrink:0;">
      ${totalRxns>0?`<div style="display:flex;align-items:center;gap:4px;font-size:.85rem;color:#8b949e;cursor:pointer;"><span style="font-size:1rem;">${topRxns}</span>${totalRxns}</div>`:'<div></div>'}
      ${cmts.length>0?`<div id="_cmtModalCount_${pid}" style="font-size:.85rem;color:#8b949e;cursor:pointer;">${cmts.length} comentario${cmts.length!==1?'s':''}</div>`:'<div id="_cmtModalCount_'+pid+'"></div>'}
    </div>`:''}

    <!-- Action buttons -->
    <div style="display:flex;border-top:1px solid #30363d;border-bottom:1px solid #30363d;flex-shrink:0;">
      <div style="flex:1;position:relative;">
        <button id="_modalRxnBtn_${pid}" onclick="doReact('${pid}','👍')" 
          onmouseenter="showRxnPop('_modal_${pid}')" onmouseleave="schedHideRxnPop('_modal_${pid}')"
          style="width:100%;background:none;border:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 4px;border-radius:0;cursor:pointer;font-size:.88rem;font-weight:700;color:#8b949e;" 
          onmouseover="this.style.background='#1c2128'" onmouseout="this.style.background='none'">👍 Me gusta</button>
        <div class="rxn-popup" id="rxnp__modal_${pid}" 
          onmouseenter="cancelHideRxnPop('_modal_${pid}')" onmouseleave="schedHideRxnPop('_modal_${pid}')"
          style="bottom:100%;top:auto;left:50%;transform:translateX(-50%);">
          ${rxnBtns}
        </div>
      </div>
      <button onclick="document.getElementById('_cmtModalInp_${pid}').focus()" style="flex:1;background:none;border:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 4px;cursor:pointer;font-size:.88rem;font-weight:700;color:#8b949e;" onmouseover="this.style.background='#1c2128'" onmouseout="this.style.background='none'">💬 Comentar</button>
      <button onclick="sharePost('${pid}')" style="flex:1;background:none;border:none;display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 4px;cursor:pointer;font-size:.88rem;font-weight:700;color:#8b949e;" onmouseover="this.style.background='#1c2128'" onmouseout="this.style.background='none'">↗ Compartir</button>
      <button onclick="(function(){var u=encodeURIComponent(location.origin+location.pathname+'?p=${pid}');window.open('https://www.facebook.com/sharer/sharer.php?u='+u,'_blank','width=640,height=460,resizable=yes');})();" style="flex:1;background:none;border:none;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 4px;cursor:pointer;font-size:.88rem;font-weight:700;color:#1877F2;" onmouseover="this.style.background='rgba(24,119,242,.1)'" onmouseout="this.style.background='none'" title="Compartir en Facebook">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
        Facebook
      </button>
    </div>

    <!-- Comments list -->
    <div id="_cmtModalList_${pid}" style="flex:1;overflow-y:auto;padding:12px 14px;min-height:80px;">
      ${_buildCmtHtml(cmts)}
    </div>

    <!-- Comment input -->
    <div style="padding:8px 12px 10px;display:flex;gap:8px;align-items:center;flex-shrink:0;border-top:1px solid #30363d;">
      <div style="width:36px;height:36px;border-radius:50%;overflow:hidden;background:#21262d;flex-shrink:0;">${avHtml}</div>
      <div style="flex:1;display:flex;align-items:center;background:#0d1117;border-radius:20px;gap:2px;padding-right:6px;">
        <input id="_cmtModalInp_${pid}" placeholder="Escribe un comentario..."
          style="flex:1;background:transparent;border:none;padding:9px 14px;color:#e6edf3;font-size:.88rem;font-family:'Exo 2',sans-serif;outline:none;"
          onkeypress="if(event.key==='Enter'){event.preventDefault();_submitModalCmt('${pid}');}">
        <button onclick="openEmojiPicker(event,'_cmtModalInp_${pid}')" title="Emoji"
          style="background:none;border:none;font-size:1.1rem;cursor:pointer;padding:4px 5px;border-radius:50%;line-height:1;transition:background .15s;"
          onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">😊</button>
        <button onclick="toggleStickerPicker('_modalstkpick_${pid}','_cmtModalInp_${pid}')" title="Stickers"
          style="background:none;border:none;font-size:1.1rem;cursor:pointer;padding:4px 5px;border-radius:50%;line-height:1;transition:background .15s;"
          onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">🎭</button>
        <div class="stk-picker" id="_modalstkpick_${pid}" style="bottom:calc(100% + 4px);left:auto;right:0;">
          <div class="stk-search">
            <span style="font-size:1rem;">🔍</span>
            <input type="text" placeholder="Buscar" id="_modalstksearch_${pid}" oninput="searchStickers(this.value,'_modalstkpick_${pid}','_cmtModalInp_${pid}')">
            <button onclick="closeStickerPicker('_modalstkpick_${pid}')" style="background:none;border:none;color:#8b949e;font-size:1rem;cursor:pointer;padding:2px;">✕</button>
          </div>
          <div id="_modalstkcontent_${pid}">
            <div class="stk-cats" id="_modalstkcats_${pid}"></div>
          </div>
        </div>
        <button onclick="_cmtOpenGif('${pid}')" title="GIF"
          style="background:none;border:none;font-size:.65rem;font-weight:900;cursor:pointer;padding:3px 5px;border-radius:6px;color:#1877f2;line-height:1;transition:background .15s;"
          onmouseover="this.style.background='#21262d'" onmouseout="this.style.background='none'">GIF</button>
        <button onclick="_submitModalCmt('${pid}')"
          style="background:none;border:none;color:#1877f2;font-size:1.1rem;cursor:pointer;padding:4px 6px;opacity:.5;transition:opacity .15s;"
          onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='.5'">➤</button>
      </div>
    </div>
  </div>`;

  // Store _buildCmtHtml on modal so _submitModalCmt can use it
  modal._buildCmtHtml = _buildCmtHtml;

  // Close menu when clicking outside
  modal.addEventListener('click', e=>{
    document.querySelectorAll('[id^="_cmtmenu_"]').forEach(m=>m.style.display='none');
    if(e.target===modal) modal.remove();
  });
  document.addEventListener('keydown', function _esc(e){ if(e.key==='Escape'){ modal.remove(); document.removeEventListener('keydown',_esc); }});
  document.body.appendChild(modal);
  setTimeout(()=>{ const inp=document.getElementById('_cmtModalInp_'+pid); if(inp) inp.focus(); }, 100);
}

function _editModalCmt(pid, ci){
  const post = (_posts||[]).find(p=>p.id===pid);
  if(!post||!post.comments||!post.comments[ci]) return;
  const c = post.comments[ci];
  const newText = prompt('Editar comentario:', c.text||'');
  if(newText===null || newText.trim()==='' || newText.trim()===c.text) return;
  const pRef = doc(db,'posts',pid);
  getDoc(pRef).then(snap=>{
    if(!snap.exists()) return;
    const cmts = snap.data().comments||[];
    if(cmts[ci]){ cmts[ci].text = newText.trim(); cmts[ci].edited = true; }
    updateDoc(pRef,{comments:cmts}).then(()=>{
      // Update local cache
      if(post.comments[ci]) { post.comments[ci].text = newText.trim(); post.comments[ci].edited = true; }
      // Refresh list in modal WITHOUT closing
      const listEl = document.getElementById('_cmtModalList_'+pid);
      const modal = document.getElementById('_cmtModal_'+pid);
      if(listEl && modal && modal._buildCmtHtml) listEl.innerHTML = modal._buildCmtHtml(post.comments);
      toast('Comentario editado ✅','ok');
    });
  });
}

async function _delModalCmt(pid, ci){
  if(!confirm('¿Eliminar este comentario?')) return;
  const pRef = doc(db,'posts',pid);
  const snap = await getDoc(pRef);
  if(!snap.exists()) return;
  const cmts = (snap.data().comments||[]).filter((_,i)=>i!==ci);
  await updateDoc(pRef,{comments:cmts});
  // Update local cache
  const post = (_posts||[]).find(p=>p.id===pid);
  if(post) post.comments = cmts;
  // Refresh list in modal WITHOUT closing
  const listEl = document.getElementById('_cmtModalList_'+pid);
  const modal = document.getElementById('_cmtModal_'+pid);
  if(listEl && modal && modal._buildCmtHtml) listEl.innerHTML = modal._buildCmtHtml(cmts);
  const countEl = document.getElementById('_cmtModalCount_'+pid);
  if(countEl) countEl.textContent = cmts.length + ' comentario' + (cmts.length!==1?'s':'');
  toast('Comentario eliminado','ok');
}


function _cmtOpenGif(pid){
  // Abre el GIF picker y cuando se selecciona uno lo envía como comentario con imagen
  const existing = document.getElementById('_cmtGifPicker_'+pid);
  if(existing){ existing.remove(); return; }
  const inp = document.getElementById('_cmtModalInp_'+pid);
  const wrap = document.createElement('div');
  wrap.id = '_cmtGifPicker_'+pid;
  wrap.style.cssText = 'padding:8px 12px;border-top:1px solid #30363d;background:#161b22;';
  wrap.innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <input id="_cmtGifSearch_${pid}" placeholder="Buscar GIF..." 
        style="flex:1;padding:7px 12px;border:1px solid #30363d;border-radius:20px;font-size:.82rem;outline:none;font-family:'Exo 2',sans-serif;"
        oninput="searchCmtGifs('${pid}')" onkeypress="if(event.key==='Enter')searchCmtGifs('${pid}')">
      <button onclick="document.getElementById('_cmtGifPicker_${pid}').remove()" 
        style="background:#21262d;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:.9rem;">✕</button>
    </div>
    <div id="_cmtGifResults_${pid}" style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-height:180px;overflow-y:auto;">
      <div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;font-size:.82rem;">Escribí algo para buscar GIFs 🎬</div>
    </div>`;
  // Insert before comment input area
  const inputArea = inp?.closest('div')?.parentElement;
  if(inputArea) inputArea.parentElement.insertBefore(wrap, inputArea);
  document.getElementById('_cmtGifSearch_'+pid)?.focus();
}

async function searchCmtGifs(pid){
  const q = document.getElementById('_cmtGifSearch_'+pid)?.value.trim();
  const res = document.getElementById('_cmtGifResults_'+pid);
  if(!res) return;
  if(!q){ res.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:#8b949e;font-size:.82rem;">Escribí algo para buscar GIFs 🎬</div>'; return; }
  res.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:10px;color:#8b949e;font-size:.8rem;">Buscando...</div>';
  try {
    const r = await fetch(`https://api.tenor.com/v2/search?q=${encodeURIComponent(q)}&key=AIzaSyAyimkuYQYF_FXVALexPmHA5a7li72Bkr0&limit=12&media_filter=gif`);
    const data = await r.json();
    if(!data.results?.length){ res.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:10px;color:#8b949e;font-size:.8rem;">Sin resultados</div>'; return; }
    res.innerHTML = data.results.map(g=>{
      const url = g.media_formats?.gif?.url || g.media_formats?.tinygif?.url || '';
      const preview = g.media_formats?.tinygif?.url || url;
      return `<img src="${preview}" data-full="${url}" style="width:100%;border-radius:6px;cursor:pointer;object-fit:cover;aspect-ratio:1;" 
        onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='1'"
        onclick="sendCmtGif('${pid}','${url}')">`;
    }).join('');
  } catch(e){ res.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:10px;color:#8b949e;font-size:.8rem;">Error al buscar</div>'; }
}

async function sendCmtGif(pid, gifUrl){
  if(!window.CU){ toast('Inicia sesión','err'); return; }
  document.getElementById('_cmtGifPicker_'+pid)?.remove();
  try {
    const pRef = doc(db,'posts',pid);
    const snap = await getDoc(pRef);
    if(!snap.exists()) return;
    const p = snap.data();
    const newC = {userId:window.CU.id, nick:window.CU.nick, av:window.CU.av||'', verified:window.CU.verified||false, text:'', gif:gifUrl, time:Date.now()};
    const newComments = [...(p.comments||[]), newC];
    await updateDoc(pRef,{comments:newComments});
    const localPost = (_posts||[]).find(lp=>lp.id===pid);
    if(localPost) localPost.comments = newComments;
    // Notif al dueño del post
    if(p.userId && p.userId !== window.CU.id){
      sendNotifToUserWithPost(p.userId, `🖼️ ${window.CU.nick} comentó con un GIF`, pid);
    }
    const listEl = document.getElementById('_cmtModalList_'+pid);
    const modal = document.getElementById('_cmtModal_'+pid);
    if(listEl && modal && modal._buildCmtHtml){ listEl.innerHTML = modal._buildCmtHtml(newComments); listEl.scrollTop = listEl.scrollHeight; }
    const countEl = document.getElementById('_cmtModalCount_'+pid);
    if(countEl) countEl.textContent = newComments.length + ' comentario' + (newComments.length!==1?'s':'');
  } catch(e){ toast('Error al enviar GIF','err'); }
}

async function _submitModalCmt(pid){
  const inp = document.getElementById('_cmtModalInp_'+pid);
  if(!inp) return;
  const txt = inp.value.trim();
  if(!txt){ inp.focus(); return; }
  if(!window.CU){ toast('Inicia sesión para comentar','err'); return; }
  inp.value = '';
  inp.disabled = true;
  try {
    const pRef = doc(db,'posts',pid);
    const snap = await getDoc(pRef);
    if(!snap.exists()){ inp.disabled=false; return; }
    const p = snap.data();
    const newC = {userId:window.CU.id, nick:window.CU.nick, av:window.CU.av||'', verified:window.CU.verified||false, text:txt, time:Date.now()};
    const newComments = [...(p.comments||[]), newC];
    await updateDoc(pRef,{comments:newComments});
    // Update local cache
    const localPost = (_posts||[]).find(lp=>lp.id===pid);
    if(localPost) localPost.comments = newComments;
    // Refresh comment list IN the modal without closing it
    const listEl = document.getElementById('_cmtModalList_'+pid);
    if(listEl){
      // rebuild with updated comments
      const modal = document.getElementById('_cmtModal_'+pid);
      if(modal && modal._buildCmtHtml) listEl.innerHTML = modal._buildCmtHtml(newComments);
      listEl.scrollTop = listEl.scrollHeight;
    }
    // Update comment count in modal header
    const countEl = document.getElementById('_cmtModalCount_'+pid);
    if(countEl) countEl.textContent = newComments.length + ' comentario' + (newComments.length!==1?'s':'');
    if(p.userId && p.userId !== window.CU.id) sendNotifToUserWithPost(p.userId, '💬 ' + window.CU.nick + ' comentó tu publicación', pid);
    addXP(3,'comentario');
  } catch(e){ console.error(e); toast('Error al comentar','err'); }
  inp.disabled = false;
  inp.focus();
}

// ── Comment menu/edit/delete/reactions ──
let _cmtMenuId = null;
// Comment menu hover functions
const _cmtMenuHide = {};
function showCmtMenu(pid, ci){
  const id = 'cmtmenu_'+pid+'_'+ci;
  clearTimeout(_cmtMenuHide[id]);
  document.querySelectorAll('[id^="cmtmenu_"]').forEach(m=>{ if(m.id!==id) m.style.display='none'; });
  const el = document.getElementById(id);
  if(el) el.style.display='block';
}
function hideCmtMenu(pid, ci){
  const id = 'cmtmenu_'+pid+'_'+ci;
  _cmtMenuHide[id] = setTimeout(function(){
    const el = document.getElementById(id);
    if(el) el.style.display='none';
  }, 200);
}
function toggleCmtMenu(e, pid, ci){ showCmtMenu(pid, ci); }
// ═══════════════════════════════════════════════════════
// RENDER INLINE COMMENTS — fuente única de verdad
// ═══════════════════════════════════════════════════════
function _reRenderInlineCmts(pid, p, cmts){
  const cmtsEl = document.getElementById('cmts_'+pid);
  if(!cmtsEl) return;
  let listEl = cmtsEl.querySelector('.cmt-list');
  if(!listEl){
    // Si no hay .cmt-list todavía, créalo antes del comment-input-row
    listEl = document.createElement('div');
    listEl.className = 'cmt-list';
    const inputRow = cmtsEl.querySelector('.comment-input-row');
    if(inputRow) cmtsEl.insertBefore(listEl, inputRow);
    else cmtsEl.appendChild(listEl);
  }

  const inp = document.getElementById('cinp_'+pid);
  const savedVal = inp ? inp.value : '';
  const allC = cmts||[];
  const RXN = ['👍','❤️','😂','😮','😢','🔥'];

  function _safenick(n){ return (n||'').replace(/'/g,"\\'"); }

  function buildCmtRow(c, ci, isReply){
    const cu = window.CU;
    const isMine  = cu && c.userId === cu.id;
    const isOwner = cu && p.userId  === cu.id;
    const canEdit = isMine;
    const canDel  = isMine || isOwner || cu?.admin;
    const myRxn   = cu ? ((c.userReactions||{})[cu.id]||'') : '';
    const rMap    = c.reactions||{};
    const rTotal  = Object.values(rMap).reduce((a,b)=>a+b,0);
    const rTop    = Object.entries(rMap).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join('');
    const t       = c.time ? fmtT(c.time) : '';
    const avSrc   = c.av||getDefaultAv(c.gender||'');
    const nick    = c.nick||'?';
    const safeN   = _safenick(nick);
    const uid     = c.userId||'';
    const sz      = isReply ? '28' : '32';

    // Reaction emoji buttons
    const rxnBtns = RXN.map(em=>
      '<button onclick="reactCmt(event,\''+pid+'\','+ci+',\''+em+'\')" '
      +'style="background:none;border:none;font-size:1.3rem;cursor:pointer;padding:3px;border-radius:50%;transition:transform .13s;" '
      +'onmouseover="this.style.transform=\'scale(1.4) translateY(-4px)\'" '
      +'onmouseout="this.style.transform=\'scale(1)\'">'+em+'</button>'
    ).join('');

    // Menu buttons
    let menu = '';
    if(canEdit) menu += '<button onclick="editCmt(event,\''+pid+'\','+ci+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:var(--text);padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">✏️ Editar</button>';
    if(canDel)  menu += '<button onclick="delCmt(event,\''+pid+'\','+ci+')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#f55;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">🗑 Eliminar</button>';
    menu += '<button onclick="toast(\'Reportado\',\'ok\')" style="display:flex;align-items:center;gap:8px;width:100%;background:none;border:none;color:#fa0;padding:10px 14px;cursor:pointer;font-size:.85rem;white-space:nowrap;">⚠️ Reportar</button>';

    const bodyHtml = c.gif
      ? '<img src="'+c.gif+'" style="max-width:180px;border-radius:8px;margin-top:4px;display:block;" loading="lazy">'
      : '<span class="comment-text"> '+renderCommentText(c.text||'')+(c.edited?' <span style="font-size:.63rem;color:#8b949e;">(editado)</span>':'')+'</span>';

    return '<div class="comment-item" style="'+(isReply?'margin-left:40px;':'')+'">'
      +'<div class="sl-av" style="width:'+sz+'px;height:'+sz+'px;font-size:.75rem;flex-shrink:0;cursor:pointer;" onclick="openUserProfile(\''+uid+'\',\''+safeN+'\')">'
        +'<img src="'+avSrc+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="if(!this.dataset.e){this.dataset.e=1;this.src=getDefaultAv();}">'
      +'</div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="position:relative;display:inline-block;max-width:100%;">'
          +'<div class="comment-bubble">'
            +'<span class="comment-author" style="cursor:pointer;" onclick="openUserProfile(\''+uid+'\',\''+safeN+'\')">'+nick+'</span>'
            +bodyHtml
          +'</div>'
          +'<div class="cmt-menu-wrap" style="position:absolute;top:-6px;right:-32px;">'
            +'<button class="cmt-dots-btn">⋯</button>'
            +'<div class="cmt-menu-dropdown">'+menu+'</div>'
          +'</div>'
        +'</div>'
        +(rTotal>0?'<div style="display:inline-flex;align-items:center;gap:2px;background:#161b22;border:1px solid #30363d;border-radius:100px;padding:2px 5px;font-size:.72rem;margin-top:2px;">'+rTop+' <span style="color:#8b949e;">'+rTotal+'</span></div>':'')
        +'<div class="cmt-meta">'
          +'<span class="cmt-meta-time">'+t+'</span>'
          +'<div class="cmt-rxn-wrap">'
            +'<button class="cmt-like-btn'+(myRxn?' active':'')+'" onclick="quickCmtRxn(event,\''+pid+'\','+ci+')">'+(myRxn?myRxn+' Me gusta':'Me gusta')+'</button>'
            +'<div class="cmt-rxn-popup">'+rxnBtns+'</div>'
          +'</div>'
          +'<button onclick="replyCmt(event,\''+pid+'\',\''+safeN+'\')" class="cmt-reply-btn">Responder</button>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  // Build all comment rows — top-level + collapsible replies
  let html = '';
  allC.forEach(function(c, ci){
    if(c.replyTo) return; // rendered under parent
    html += buildCmtRow(c, ci, false);
    // Find replies for this comment
    const replies = allC.filter(function(r, ri){
      return r.replyTo && c.nick && r.replyTo.toLowerCase() === (c.nick||'').toLowerCase() && ri > ci;
    });
    if(replies.length){
      const rid = 'replies_'+pid+'_'+ci;
      const label = replies.length === 1 ? '1 respuesta' : replies.length+' respuestas';
      let rHtml = '';
      replies.forEach(function(r2){
        const r2i = allC.indexOf(r2);
        rHtml += buildCmtRow(r2, r2i, true);
      });
      html += '<div style="margin-left:40px;margin-top:2px;">'
        +'<button onclick="toggleReplies(\''+rid+'\')" id="btn_'+rid+'" style="background:none;border:none;color:#1877f2;font-size:.82rem;font-weight:700;cursor:pointer;padding:6px 0;">↩ '+label+'</button>'
        +'<div id="'+rid+'" style="display:none;margin-top:4px;">'+rHtml+'</div>'
        +'</div>';
    }
  });

  if(!html){
    html = '<div style="text-align:center;padding:16px 0;color:var(--muted);font-size:.85rem;">Sé el primero en comentar 🎣</div>';
  }

  listEl.innerHTML = html;
  if(inp) inp.value = savedVal;

  // Actualizar contador
  const cntEl = document.querySelector('#post_'+pid+' .post-stats [onclick*="toggleComments"]');
  if(cntEl){ const cnt = allC.length; cntEl.textContent = cnt > 0 ? cnt+' comentario'+(cnt!==1?'s':'') : ''; }
}

async function editCmt(e, pid, ci){
  if(e) e.stopPropagation();
  document.querySelectorAll('[id^="cmtmenu_"]').forEach(m=>{ m.style.display='none'; });
  const p = _posts.find(p=>p.id===pid); if(!p) return;
  const c = (p.comments||[])[ci]; if(!c) return;
  if(!window.CU || c.userId!==window.CU.id){ toast('Sin permiso','err'); return; }
  const newText = prompt('Editar comentario:', c.text);
  if(newText===null || newText.trim()===c.text) return;
  const newCmts = [...(p.comments||[])];
  newCmts[ci] = {...c, text:newText.trim(), edited:true};
  await updateDoc(doc(db,'posts',pid),{comments:newCmts});
  p.comments = newCmts;
  _reRenderInlineCmts(pid, p, newCmts);
  toast('Comentario editado ✅','ok');
}
async function delCmt(e, pid, ci){
  if(e) e.stopPropagation();
  document.querySelectorAll('[id^="cmtmenu_"]').forEach(m=>{ m.style.display='none'; });
  const p = _posts.find(p=>p.id===pid); if(!p) return;
  const c = (p.comments||[])[ci]; if(!c) return;
  if(!window.CU || (c.userId!==window.CU.id && p.userId!==window.CU.id)){ toast('Sin permiso','err'); return; }
  if(!confirm('¿Eliminar este comentario?')) return;
  const newCmts = (p.comments||[]).filter((_,i)=>i!==ci);
  await updateDoc(doc(db,'posts',pid),{comments:newCmts});
  p.comments = newCmts;
  _reRenderInlineCmts(pid, p, newCmts);
  toast('Comentario eliminado','ok');
}
let _cmtRxnHide = {};
function showCmtRxnPop(pid, ci){
  const id='crxnp_'+pid+'_'+ci;
  clearTimeout(_cmtRxnHide[id]);
  document.querySelectorAll('[id^="crxnp_"]').forEach(function(p){ if(p.id!==id) p.style.display='none'; });
  document.querySelectorAll('[id^="cmtmenu_"]').forEach(function(m){ m.style.display='none'; });
  const el=document.getElementById(id);
  if(el){ el.style.display='flex'; }
}
function hideCmtRxnPop(pid, ci){
  const id='crxnp_'+pid+'_'+ci;
  _cmtRxnHide[id]=setTimeout(()=>{ const el=document.getElementById(id); if(el) el.style.display='none'; },300);
}
function cancelHideCmtRxn(pid, ci){ clearTimeout(_cmtRxnHide['crxnp_'+pid+'_'+ci]); }
async function reactCmt(e, pid, ci, em){
  if(e) e.stopPropagation();
  if(!window.CU){ toast('Iniciá sesión','err'); return; }
  let p = _posts.find(p=>p.id===pid);
  if(!p){
    try {
      const snap = await getDoc(doc(db,'posts',pid));
      if(!snap.exists()) return;
      p = {id:snap.id,...snap.data()};
      _posts.push(p);
    } catch(e){ return; }
  }
  const newCmts = [...(p.comments||[])];
  const c = {...(newCmts[ci]||{})};
  const uRxns = {...(c.userReactions||{})};
  const rCounts = {...(c.reactions||{})};
  const prev = uRxns[window.CU.id];
  if(prev){ rCounts[prev]=Math.max(0,(rCounts[prev]||1)-1); }
  if(prev===em){ delete uRxns[window.CU.id]; }
  else { uRxns[window.CU.id]=em; rCounts[em]=(rCounts[em]||0)+1; }
  c.userReactions=uRxns; c.reactions=rCounts;
  newCmts[ci]=c;
  // Optimistic UI: update _posts locally so renderFeed doesn't jump
  p.comments = newCmts;
  await updateDoc(doc(db,'posts',pid),{comments:newCmts});
  _reRenderInlineCmts(pid, p, newCmts);
}
function quickCmtRxn(e, pid, ci){
  if(e) e.stopPropagation();
  const p=_posts.find(p=>p.id===pid); if(!p) return;
  const c=(p.comments||[])[ci]; if(!c) return;
  const prev=window.CU?((c.userReactions||{})[window.CU.id]||''):'';
  reactCmt(null,pid,ci,prev||'👍');
}
function toggleReplies(rid){
  const el = document.getElementById(rid);
  const btn = document.getElementById('btn_'+rid);
  if(!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if(btn){
    const txt = btn.textContent;
    // Toggle arrow direction
    btn.textContent = txt.replace(/^[↩↪]/, open ? '↩' : '↪');
  }
}
function replyCmt(e, pid, nick){
  if(e) e.stopPropagation();
  const inp = document.getElementById('cinp_'+pid);
  if(!inp) return;
  // Open comments section if closed
  const cmts = document.getElementById('cmts_'+pid);
  if(cmts && !cmts.classList.contains('open')) cmts.classList.add('open');
  // Set @mention in input
  const mention = '@'+nick+' ';
  inp.value = mention;
  inp.focus();
  // Move cursor to end
  inp.setSelectionRange(mention.length, mention.length);
  // Scroll input into view
  inp.scrollIntoView({behavior:'smooth', block:'nearest'});
}

async function submitCommentImg(input, pid){
  if(!window.CU){ toast('Inicia sesión para comentar','err'); return; }
  const file = input.files[0];
  if(!file) return;
  input.value = '';
  toast('Subiendo imagen...','inf');
  try {
    const imgUrl = await uploadImage(file, 'comments');
    let p = _posts.find(p=>p.id===pid);
    if(!p){
      const snap = await getDoc(doc(db,'posts',pid));
      if(!snap.exists()){ toast('Post no encontrado','err'); return; }
      p = {id:snap.id,...snap.data()};
      _posts.push(p);
    }
    const newC = {userId:window.CU.id, nick:window.CU.nick, av:window.CU.av||'', verified:window.CU.verified||false, text:'', gif:imgUrl, time:Date.now()};
    const newComments = [...(p.comments||[]), newC];
    await updateDoc(doc(db,'posts',pid), {comments: newComments});
    p.comments = newComments;
    if(p.userId && p.userId !== window.CU.id){
      sendNotifToUserWithPost(p.userId, `🖼️ ${window.CU.nick} comentó con una imagen`, p.id);
    }
    addXP(3,'comentario');
    const cmtsEl = document.getElementById('cmts_'+pid);
    if(cmtsEl){
      cmtsEl.classList.add('open');
      // Re-render comments section
      const inp = document.getElementById('cinp_'+pid);
      if(inp && inp.parentElement && inp.parentElement.parentElement){
        const cmtList = cmtsEl.querySelector('.cmt-list');
        if(cmtList){
          const newCmtDiv = document.createElement('div');
          newCmtDiv.innerHTML = `<div style="display:flex;gap:8px;padding:6px 0;">
            <div style="width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:var(--accent);">
              ${window.CU.av?'<img src="'+window.CU.av+'" style="width:100%;height:100%;object-fit:cover;">':window.CU.nick[0]}
            </div>
            <div><div style="font-size:.82rem;font-weight:700;">${esc(window.CU.nick)}</div>
            <img src="${imgUrl}" style="max-width:200px;border-radius:8px;margin-top:4px;display:block;" loading="lazy"></div>
          </div>`;
          cmtList.appendChild(newCmtDiv.firstElementChild);
        }
      }
    }
    toast('Imagen enviada 🖼️','ok');
  } catch(e){
    console.error('submitCommentImg error:',e);
    toast('Error al subir imagen','err');
  }
}
window.submitCommentImg = submitCommentImg;

async function submitComment(pid){
  if(!window.CU){ toast('Inicia sesión para comentar','err'); return; }
  const inp = document.getElementById('cinp_'+pid);
  if(!inp) return;
  const txt = inp.value.trim(); if(!txt) return;
  const mentionEl = document.getElementById('mention_'+pid);
  if(mentionEl) mentionEl.style.display='none';
  inp.disabled = true;
  const savedTxt = txt;
  // Determine collection
  const isTrofeo = pid.startsWith('trofeo_');
  const realId = isTrofeo ? pid.replace('trofeo_','') : pid;
  const colName = isTrofeo ? 'trofeosPendientes' : 'posts';
  try {
    let p = _posts.find(p=>p.id===pid);
    if(!p){
      const snap = await getDoc(doc(db, colName, realId));
      if(!snap.exists()){ toast('Post no encontrado','err'); inp.disabled=false; return; }
      p = {id:pid,...snap.data()};
      _posts.push(p);
    }
    const replyToNick = txt.startsWith('@') ? (txt.match(/^@(\S+)/)||[])[1]||'' : '';
    const newC = {userId:window.CU.id,nick:window.CU.nick,av:window.CU.av||'',verified:window.CU.verified||false,text:txt,time:Date.now(),replyTo:replyToNick};
    const newComments = [...(p.comments||[]), newC];
    await updateDoc(doc(db, colName, realId), {comments: newComments});
    p.comments = newComments;
    inp.value='';
    if(p.userId && p.userId !== window.CU.id){
      sendNotifToUserWithPost(p.userId, `💬 ${window.CU.nick} comentó: "${txt.slice(0,40)}"`, pid);
    }
    const mentions = txt.match(/@([\w\d_]+)/g);
    if(mentions){
      try {
        const notified = new Set();
        for(const m of mentions){
          const nick = m.slice(1).toLowerCase();
          const _uSnap = await getDocs(query(collection(db,'users'), where('nickLower','==',nick), limit(1)));
          const user = _uSnap.docs.length ? {id:_uSnap.docs[0].id,..._uSnap.docs[0].data()} : null;
          if(user && user.id !== window.CU.id && !notified.has(user.id)){
            notified.add(user.id);
            const isReply = txt.startsWith('@'+nick);
            const notifTxt = isReply
              ? `↩️ ${window.CU.nick} respondió tu comentario: "${txt.slice(0,50)}"`
              : `🏷️ ${window.CU.nick} te mencionó en un comentario: "${txt.slice(0,50)}"`;
            sendNotifToUserWithPost(user.id, notifTxt, pid);
          }
        }
      } catch(e){}
    }
    addXP(3,'comentario');
    const cmtsEl = document.getElementById('cmts_'+pid);
    if(cmtsEl){
      if(!cmtsEl.classList.contains('open')) cmtsEl.classList.add('open');
      _reRenderInlineCmts(pid, p, newComments);
      const listEl2 = cmtsEl.querySelector('.cmt-list');
      if(listEl2) listEl2.scrollTop = listEl2.scrollHeight;
    }
    const modalEl = document.getElementById('_cmtModal_'+pid);
    if(modalEl && modalEl._buildCmtHtml){
      const listEl = document.getElementById('_cmtModalList_'+pid);
      if(listEl){ listEl.innerHTML = modalEl._buildCmtHtml(newComments); listEl.scrollTop = listEl.scrollHeight; }
      const countEl = document.getElementById('_cmtModalCount_'+pid);
      if(countEl) countEl.textContent = newComments.length + ' comentario' + (newComments.length!==1?'s':'');
    }
  } catch(e){
    console.error('submitComment error:', e);
    toast('Error al comentar — intenta de nuevo','err');
    inp.value = savedTxt;
  }
  inp.disabled = false;
  inp.focus();
}

// Mention autocomplete
let _mentionTimer = null;
async function handleMentionInput(inp, pid){
  const val = inp.value;
  const atIdx = val.lastIndexOf('@');
  const mentionEl = document.getElementById('mention_'+pid);
  if(!mentionEl) return;
  if(atIdx === -1 || val.slice(atIdx+1).includes(' ')){
    mentionEl.style.display='none'; return;
  }
  const query_str = val.slice(atIdx+1).toLowerCase();
  clearTimeout(_mentionTimer);
  _mentionTimer = setTimeout(async ()=>{
    try {
      const snap = await getDocs(query(collection(db,'users'), where('nickLower','>=',query_str), where('nickLower','<=',query_str+''), limit(6)));
      const users = snap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.id!==window.CU?.id);
      if(!users.length){ mentionEl.style.display='none'; return; }
      mentionEl.innerHTML = users.map(u=>{
        const safeNick = (u.nick||'').replace(/"/g,'&quot;');
        return `<div data-nick="${safeNick}" style="padding:8px 12px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:.83rem;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">`+
          `<div style="width:28px;height:28px;border-radius:50%;background:var(--accent);color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.78rem;overflow:hidden;flex-shrink:0;">`+
          `<img src="${u.av||getDefaultAv(u.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`+
          `</div><span>@${esc(u.nick||'')}</span></div>`;
      }).join('');
      // Use event delegation — no inline onclick with quotes
      mentionEl.onclick = (ev)=>{
        const row = ev.target.closest('[data-nick]');
        if(row && row.dataset.nick) insertMention(pid, row.dataset.nick);
      };
      mentionEl.style.display='block';
    } catch(e){ mentionEl.style.display='none'; }
  }, 250);
}

function insertMention(pid, nick){
  const inp = document.getElementById('cinp_'+pid);
  const mentionEl = document.getElementById('mention_'+pid);
  if(!inp) return;
  const val = inp.value;
  const atIdx = val.lastIndexOf('@');
  inp.value = val.slice(0, atIdx) + '@' + nick + ' ';
  inp.focus();
  if(mentionEl) mentionEl.style.display='none';
}

