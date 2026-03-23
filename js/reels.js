// ===== REELS PAGE =====
let _reelsData = [];
let _reelsLoaded = false;

async function loadReelsPage(){
  const overlay = document.getElementById('reelsOverlay');
  const el = document.getElementById('reelsFeed');
  if(!el) return;

  // Use exact pixel heights — vh units fail inside fixed overlays in some browsers
  const H = window.innerHeight;
  if(overlay){ overlay.style.height = H+'px'; }
  el.style.cssText = 'width:100%;height:'+H+'px;overflow-y:scroll;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;';

  el.innerHTML = '<div style="height:'+H+'px;display:flex;align-items:center;justify-content:center;color:#fff;gap:12px;flex-direction:column;"><div style="font-size:2rem;">⏳</div><div style="font-size:.9rem;opacity:.7;">Cargando reels...</div></div>';
  _reelsLoaded = false;
  _reelsData = [];

  try {
    const snap = await getDocs(query(collection(db,'posts'), orderBy('time','desc'), limit(50)));
    const isVideoPost = p => {
      if(!p.video) return false;
      return extractYtId(p.video) || isTikTok(p.video) || /\.(mp4|webm|mov)/i.test(p.video);
    };
    _reelsData = snap.docs.map(d=>({id:d.id,...d.data()})).filter(isVideoPost);
    const inMem = (_posts||[]).filter(p=>isVideoPost(p)&&!_reelsData.find(r=>r.id===p.id));
    _reelsData = [..._reelsData,...inMem].sort((a,b)=>(b.time?.toMillis?.()??0)-(a.time?.toMillis?.()??0));
    if(window._posts){
      _reelsData.forEach(rp=>{if(!_posts.find(p=>p.id===rp.id))_posts.unshift(rp);});
    }
    _reelsLoaded = true;
    _renderReelsFeed(el, H);
  } catch(e){
    console.error('loadReelsPage error:',e);
    const isVideoPost = p => p.video&&(extractYtId(p.video)||isTikTok(p.video)||/\.(mp4|webm|mov)/i.test(p.video));
    _reelsData = (_posts||[]).filter(isVideoPost);
    _reelsLoaded = true;
    _renderReelsFeed(el, H);
  }
}

async function _reelsHandleClick(e){
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  e.stopPropagation();
  const action = btn.dataset.action;
  const pid = btn.dataset.pid;

  if(action==='profile'){
    const uid = btn.dataset.uid, nick = btn.dataset.nick;
    if(uid) openUserProfile(uid, nick);
    return;
  }
  if(action==='share' && pid){ sharePost(pid); return; }

  if(!pid) return;

  // Ensure post is in _posts cache before calling react/comment
  if(!(_posts||[]).find(p=>p.id===pid)){
    try {
      const snap = await getDoc(doc(db,'posts',pid));
      if(snap.exists()){
        const p = {id:pid,...snap.data()};
        if(!window._posts) window._posts = [];
        _posts.push(p);
      }
    } catch(err){ console.warn('reel fetch err',err); }
  }

  if(action==='like'){
    await doReact(pid,'❤️');
    // Update reel like button visually
    const p = (_posts||[]).find(p=>p.id===pid);
    if(p){
      const likeBtn = document.querySelector('[data-reel-pid="'+pid+'"] [data-action="like"]');
      if(likeBtn){
        const fmtN = n=>n>999?(n/1000).toFixed(1)+'K':(n||'0');
        const total = Object.values(p.reactionCounts||{}).reduce((a,b)=>a+(b||0),0);
        const myRxn = p.reactions?.[window.CU?.id];
        likeBtn.innerHTML = (myRxn||'❤️') + ' ' + fmtN(total||p.likes||0);
        likeBtn.style.color = myRxn ? '#f85149' : '';
      }
    }
  }
  if(action==='comment'){ toggleComments(pid); }
}

function _renderReelsFeed(el, H){
  H = H || window.innerHeight;
  el.style.cssText = 'width:100%;height:'+H+'px;overflow-y:scroll;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;';
  if(!_reelsData.length){
    el.innerHTML = '<div style="height:'+H+'px;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;gap:12px;"><div style="font-size:3rem;">🎬</div><div style="font-size:1rem;font-weight:700;">Sin reels aún</div><div style="font-size:.82rem;opacity:.6;">Publicá un video de YouTube o TikTok</div></div>';
    return;
  }
  el.innerHTML = _reelsData.map(p=>_reelCard(p,H)).join('');
  // Use event delegation — no onclick needed, works even inside fixed overlays
  el.removeEventListener('click', _reelsHandleClick);
  el.addEventListener('click', _reelsHandleClick);
  requestAnimationFrame(()=>{ el.scrollTop=0; });
}

function _reelCard(p, H){
  H = H || window.innerHeight;
  const ytId = extractYtId(p.video||'');
  const ttId = extractTikTokId(p.video||'');
  const isCloudVideo = !ytId && !ttId && p.video;
  const nick = p.userNick||'Usuario';
  const av   = p.userAv||getDefaultAv(p.userGender||'');
  const text = (p.text||'').slice(0,90);
  const likes    = p.likes||0;
  const cmtCount = p.commentCount||0;
  const fmtN = n=>n>999?(n/1000).toFixed(1)+'K':(n||'0');
  const safeNick = nick.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  const pid = p.id;

  const PANEL = 112;
  const videoH = H - PANEL;

  let videoInner='';
  if(ytId){
    videoInner=`<iframe src="https://www.youtube.com/embed/${ytId}?rel=0" frameborder="0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" style="width:100%;height:100%;border:none;display:block;" loading="lazy"></iframe>`;
  } else if(ttId && !isTikTokShortLink(p.video)){
    videoInner=`<iframe src="https://www.tiktok.com/embed/v2/${ttId}" frameborder="0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" style="width:100%;height:100%;border:none;display:block;" loading="lazy"></iframe>`;
  } else if(isTikTok(p.video)){
    videoInner=`<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:#111;"><div style="font-size:3rem;">🎵</div><div style="color:#fff;font-size:.9rem;font-weight:700;">Video de TikTok</div><a href="${p.video}" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#69C9D0,#EE1D52);color:#fff;padding:10px 28px;border-radius:100px;font-weight:800;font-size:.85rem;text-decoration:none;">Ver en TikTok ↗</a></div>`;
  } else if(isCloudVideo){
    videoInner=`<video src="${p.video}" controls playsinline style="width:100%;height:100%;object-fit:contain;display:block;"></video>`;
  }

  const badge = ytId
    ? `<span style="background:#FF0000;color:#fff;font-size:.58rem;font-weight:800;padding:1px 6px;border-radius:100px;flex-shrink:0;">YT</span>`
    : `<span style="background:#010101;color:#69C9D0;font-size:.58rem;font-weight:800;padding:1px 6px;border-radius:100px;border:1px solid #555;flex-shrink:0;">TT</span>`;

  // Use data-pid attribute and event delegation to avoid onclick scope issues
  return `<div data-reel-pid="${pid}" style="width:100%;height:${H}px;flex-shrink:0;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;background:#0d1117;overflow:hidden;">

    <!-- VIDEO — pointer-events isolated -->
    <div style="width:100%;height:${videoH}px;flex-shrink:0;overflow:hidden;background:#000;">
      ${videoInner}
    </div>

    <!-- PANEL INFERIOR — completely separate from iframe, pointer-events:auto garantizado -->
    <div style="width:100%;height:${PANEL}px;flex-shrink:0;background:#161b22;border-top:2px solid #30363d;display:flex;flex-direction:row;align-items:center;padding:0 12px;gap:8px;box-sizing:border-box;position:relative;z-index:10;pointer-events:auto;">

      <!-- Avatar -->
      <img src="${av}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #444;flex-shrink:0;cursor:pointer;" data-action="profile" data-uid="${p.userId||''}" data-nick="${safeNick}">

      <!-- Info -->
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:.78rem;font-weight:800;color:#e6edf3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(nick)}${p.userVerified?' ✅':''} ${badge}</div>
        ${text?`<div style="font-size:.68rem;color:#8b949e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(text)}</div>`:''}
      </div>

      <!-- BOTÓN LIKE -->
      <button data-action="like" data-pid="${pid}"
        style="background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;flex-shrink:0;pointer-events:auto;">
        ❤️ ${fmtN(likes)}
      </button>

      <!-- BOTÓN COMENTAR -->
      <button data-action="comment" data-pid="${pid}"
        style="background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;flex-shrink:0;pointer-events:auto;">
        💬 ${fmtN(cmtCount)}
      </button>

      <!-- BOTÓN COMPARTIR -->
      <button data-action="share" data-pid="${pid}"
        style="background:#21262d;border:1px solid #30363d;color:#e6edf3;padding:8px 12px;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;flex-shrink:0;pointer-events:auto;">
        ↗️
      </button>

    </div>
  </div>`;
}
window.loadReelsPage = loadReelsPage;
function closeReelsOverlay(){
  const overlay = document.getElementById('reelsOverlay');
  if(overlay) overlay.style.display='none';
  document.body.style.overflow='';
  if(window._reelsPrevPage) window.gp(window._reelsPrevPage, true);
}
window.closeReelsOverlay = closeReelsOverlay;

window._unsubTrofeos = window._unsubTrofeos || null;
window._trofeosFeedData = window._trofeosFeedData || [];
let _trofeosFeedData = window._trofeosFeedData;
let _trofeoFeedFilter = 'all';

async function listenTrofeosFeed(){
  // No recargar si ya hay datos frescos (menos de 2 minutos) — pero admin siempre recarga
  const isAdmin = window.CU?.nick === 'ruizgustavo12' || window.CU?.email === 'synxyes@gmail.com' || window.CU?.role === 'admin';
  if(!isAdmin && window._trofeosFeedLastLoad && (Date.now() - window._trofeosFeedLastLoad) < 120000 && window._trofeosFeedData.length){
    renderTrofeosFeed(); return;
  }
  const feedEl = document.getElementById('trofeosFeed');
  if(feedEl) feedEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--muted);">
    <div style="font-size:2rem;margin-bottom:8px;">🏆</div>
    <div>Cargando trofeos aprobados...</div>
  </div>`;
  if(!window.db){
    setTimeout(()=>listenTrofeosFeed(), 1000); return;
  }
  try {
    console.log('[Trofeos] Iniciando carga desde Firestore...');
    const snap = await getDocs(query(collection(db,'trofeosPendientes'), limit(100)));
    console.log('[Trofeos] Documentos recibidos:', snap.docs.length);
    const tsVal = x => x?.toMillis ? x.toMillis() : (typeof x==="number" ? x : (x?.seconds ? x.seconds*1000 : 0));
    const all = snap.docs.map(d=>({id:d.id,...d.data(),_src:'local'}));
    console.log('[Trofeos] Status de cada doc:', all.map(d=>d.status));
    const local = all
      .filter(d => !d.status || d.status === 'approved')
      .sort((a,b) => tsVal(b.createdAt) - tsVal(a.createdAt));
    console.log('[Trofeos] Aprobados:', local.length);
    window._trofeosFeedData = local;
    _trofeosFeedData = local;
    window._trofeosFeedLastLoad = Date.now();
    renderTrofeosFeed();
  } catch(e) {
    console.error('[Trofeos] Error:', e.code, e.message);
    const el = document.getElementById('trofeosFeed');
    if(el) el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted);">
      <div style="font-size:3rem;margin-bottom:12px;">🏆</div>
      <div style="font-size:.95rem;font-weight:700;margin-bottom:6px;">No se pudieron cargar los trofeos</div>
      <div style="font-size:.8rem;margin-bottom:16px;color:var(--red);">${e.code||e.message||'Error desconocido'}</div>
      <button class="btn" onclick="window._trofeosFeedLastLoad=0;listenTrofeosFeed();" style="background:var(--gold);color:#000;font-weight:700;">🔄 Reintentar</button>
    </div>`;
  }
}

function listenTrofeosSidebar(){
  // Trae los últimos 20 y filtra aprobados en JS para evitar índice compuesto
  getDocs(query(collection(db,'trofeosPendientes'), orderBy('createdAt','desc'), limit(20)))
    .then(snap => {
      const items = snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(d => !d.status || d.status === 'approved')
        .slice(0,5);
      renderTrofeoSidebar(items);
      renderHomeTrophyWidget(items[0]||null);
    }).catch(e=>console.warn('trofeosSidebar error:',e));
}

function renderHomeTrophyWidget(t){
  if(!t) return;
  // Solo el banner flotante, el widget estático fue eliminado
  if(!sessionStorage.getItem('_trophyBannerShown')) {
    sessionStorage.setItem('_trophyBannerShown','1');
    showTrophyBanner(t);
  }
}

let _trophyBannerTimer = null;
function showTrophyBanner(t){
  const banner = document.getElementById('trophyBanner');
  if(!banner) return;
  const fish = t.fish||t.especie||'?';
  const weight = t.weight||t.peso||0;
  const nick = t.userNick||t.submittedBy||t.nick||'?';
  const images = t.images||[];
  const imgUrl = images[0]||t.imageUrl||t.img||'';
  const imgEl = document.getElementById('trophyBannerImg');
  const fishEl = document.getElementById('trophyBannerFish');
  const weightEl = document.getElementById('trophyBannerWeight');
  const nickEl = document.getElementById('trophyBannerNick');
  const bar = document.getElementById('trophyBannerBar');
  if(imgEl) imgEl.innerHTML = imgUrl ? `<img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;">` : '🏆';
  if(fishEl) fishEl.textContent = fish;
  if(weightEl) weightEl.textContent = weight ? fmtKg(weight) : '';
  if(nickEl) nickEl.textContent = '👤 ' + nick;
  banner.style.display = 'block';
  // Arrancar barra de progreso
  if(bar){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ bar.style.width='0%'; })); }
  // Cerrar automáticamente a los 30s
  if(_trophyBannerTimer) clearTimeout(_trophyBannerTimer);
  _trophyBannerTimer = setTimeout(()=>closeTrophyBanner(), 6000);
}

function closeTrophyBanner(){
  const banner = document.getElementById('trophyBanner');
  if(!banner) return;
  banner.style.animation = 'trophyBannerOut .35s ease forwards';
  setTimeout(()=>{ banner.style.display='none'; banner.style.animation=''; }, 350);
  if(_trophyBannerTimer){ clearTimeout(_trophyBannerTimer); _trophyBannerTimer=null; }
}
window.closeTrophyBanner = closeTrophyBanner;
window.removeSavedAccount = removeSavedAccount;

function filterTrofeoFeed(filter, btn){
  _trofeoFeedFilter = filter;
  document.querySelectorAll('#trofeoFeedFilters .btn').forEach(b=>{
    b.style.background='var(--bg3)';
    b.style.borderColor='var(--border)';
    b.style.color='var(--muted)';
  });
  if(btn){
    btn.style.background='rgba(255,215,0,.15)';
    btn.style.borderColor='var(--gold)';
    btn.style.color='var(--gold)';
  }
  renderTrofeosFeed();
}


window.filterTrofeoFeed = filterTrofeoFeed;
window.renderShopPage = renderShopPage;
window.renderShopGrid = renderShopGrid;
window.filterShopCat = filterShopCat;
window.toggleEquipItem = toggleEquipItem;
window.bannerFuego = bannerFuego;
window.bannerFlores = bannerFlores;
window.bannerOcean = bannerOcean;
window.bannerAurora = bannerAurora;
window.bannerGalaxy = bannerGalaxy;
window.bannerStorm = bannerStorm;
window.stopBannerAnim = stopBannerAnim;
window.startBannerAnim = startBannerAnim;

function renderTrofeosFeed(){
  const el = document.getElementById('trofeosFeed');
  if(!el) return;
  let data = window._trofeosFeedData || [];
  if(_trofeoFeedFilter === 'mine' && window.CU){
    data = data.filter(t=>t.userId===window.CU.id || (t.userNick||'').toLowerCase()===(window.CU.nick||'').toLowerCase() || (t.submittedBy||'').toLowerCase()===(window.CU.nick||'').toLowerCase());
  }
  if(!data.length){
    el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--muted);">
      <div style="font-size:3rem;margin-bottom:12px;">🏆</div>
      <div style="font-size:.95rem;font-weight:700;margin-bottom:6px;">No hay trofeos aprobados aún</div>
      <div style="font-size:.8rem;">Los trofeos aprobados en <a href="#" onclick="gp('wiki-trofeos')" target="_blank" style="color:var(--accent);">WikiPediaRF4.UY</a> aparecerán aquí automáticamente.</div>
    </div>`;
    return;
  }
  // Inyectar trofeos en el caché _posts para que reacciones/comentarios funcionen
  if(!window._posts) window._posts = [];
  data.forEach(t => {
    const fakeId = 'trofeo_' + (t.id||'');
    if(!window._posts.find(p=>p.id===fakeId)){
      window._posts.unshift({
        id: fakeId,
        userId: t.userId||'',
        userNick: t.userNick||t.submittedBy||t.nick||'Anónimo',
        userAv: t.userPhoto||t.userAv||t.av||'',
        text: `🥇 Trofeo: ${t.fish||t.especie||'?'} · ${t.weight||t.peso?fmtKg(t.weight||t.peso):''}`,
        images: t.images||[t.imageUrl||t.img||''].filter(Boolean),
        reactions: t.reactions||{},
        comments: t.comments||[],
        createdAt: t.createdAt||null,
        _isTrofeo: true,
        _trofeoRef: t.id,
      });
    }
  });
  el.innerHTML = data.map(t=>trofeoFeedCardHTML(t)).join('');
  // Actualizar summaries de reacciones después de renderizar
  data.forEach(t => {
    const fakeId = 'trofeo_' + (t.id||'');
    const p = window._posts.find(x=>x.id===fakeId);
    if(p) setTimeout(()=>{ try{ updateRxnSummary(fakeId); } catch(e){} },0);
  });
}

function trofeoFeedCardHTML(t){
  const fish = esc(t.fish||t.especie||'Desconocido');
  const weight = t.weight||t.peso||0;
  const map = esc(t.map||t.mapa||'');
  const nick = esc(t.userNick||t.submittedBy||t.nick||'Anónimo');
  const userId = t.userId||'';
  const userAv = t.userPhoto||t.userAv||t.av||'';
  const images = t.images||[];
  const imgUrl = images[0]||t.imageUrl||t.img||t.imagen||'';
  const approvedAt = t.createdAt?.toMillis?.() || t.createdAt || Date.now();
  const technique = esc(t.technique||t.tecnica||t.tech||'');
  const bait = esc(t.bait||t.carnada||'');
  const spot = esc(t.spot||t.coords||t.coordenadas||'');
  const description = esc(t.description||t.notes||t.nota||'');
  const notes = esc(t.notes||t.nota||t.description||'');

  const tid = t.id||"";
  const rxnBtnsHtml = `<button class="rxn-btn" onclick="doReact('trofeo_${tid}','🏆');schedHideRxnPop('trofeo_${tid}')" title="Trofeo"><img src="/troff.png" style="width:24px;height:24px;"></button><button class="rxn-btn" onclick="doReact('trofeo_${tid}','⭐');schedHideRxnPop('trofeo_${tid}')" title="Super Trofeo"><img src="/troff_super.png" style="width:24px;height:24px;"></button>`;
  return `<div id="trofeo_${tid}" style="background:var(--bg2);border:1px solid rgba(255,215,0,.25);border-radius:var(--r);margin-bottom:18px;overflow:hidden;transition:border-color .2s;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='rgba(255,215,0,.25)'">
    <!-- Header type banner -->
    <div style="background:linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,215,0,.04));border-bottom:1px solid rgba(255,215,0,.15);padding:8px 14px;display:flex;align-items:center;gap:6px;">
      <span style="font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--gold);">🥇 TROFEO APROBADO</span>
      <span style="font-size:.7rem;color:var(--muted);margin-left:auto;">${fmtT(approvedAt)}</span>
    </div>
    <!-- Post header -->
    <div class="post-header">
      <div class="post-av" style="cursor:pointer;border-color:var(--gold);" onclick="openUserProfile('${userId}','${nick.replace(/'/g,"\\'")}')">
        ${userAv?`<img src="${userAv}">`:(nick[0]||'?').toUpperCase()}
      </div>
      <div class="post-meta" style="cursor:pointer;" onclick="openUserProfile('${userId}','${nick.replace(/'/g,"\\'")}')">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <div class="post-author">${nick}</div>
          <span style="font-size:.62rem;font-weight:700;padding:1px 8px;border-radius:100px;border:1px solid rgba(255,215,0,.4);color:var(--gold);background:rgba(255,215,0,.08);">🥇 Trofeo</span>
        </div>
        <div class="post-time">🌐 ${fmtT(approvedAt)} · WikiPediaRF4.UY</div>
      </div>
      <a href="#" onclick="gp('wiki-trofeos')" target="_blank" style="background:none;border:1px solid rgba(255,215,0,.3);color:var(--gold);padding:4px 10px;border-radius:var(--rs);font-size:.7rem;font-weight:700;cursor:pointer;text-decoration:none;font-family:'Exo 2',sans-serif;">↗ Wiki</a>
    </div>
    <!-- Fish info highlight -->
    <div style="margin:0 14px 12px;background:linear-gradient(135deg,rgba(255,215,0,.1),rgba(255,165,0,.05));border:1px solid rgba(255,215,0,.25);border-radius:var(--r);padding:14px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <div style="font-size:2.4rem;">🏆</div>
      <div style="flex:1;min-width:120px;">
        <div style="font-family:'Orbitron',monospace;font-size:1rem;font-weight:900;color:var(--gold);">${fish}</div>
        ${weight?`<div style="font-size:1.3rem;font-weight:800;color:var(--text);margin-top:2px;">${fmtKg(weight)}</div>`:''}
        ${map?`<div style="font-size:.75rem;color:var(--muted);margin-top:2px;">📍 ${map}</div>`:''}
      </div>
      ${technique?`<div style="font-size:.72rem;background:rgba(0,198,255,.1);color:var(--accent);padding:3px 10px;border-radius:100px;white-space:nowrap;">🎣 ${technique}</div>`:''}
    </div>
    <!-- Images -->
    ${images.length>1
      ? `<div style="display:grid;grid-template-columns:${images.length===2?'1fr 1fr':'1fr 1fr 1fr'};gap:2px;margin-bottom:0;">${images.slice(0,4).map((img,ii)=>`<div style="position:relative;overflow:hidden;display:block;"><img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer;" onclick="(function(){window._postImgsMap=window._postImgsMap||{};window._postImgsMap['trofeo_${tid}']=[${images.map(x=>"'"+x+"'").join(',')}];openImgLightboxById('trofeo_${tid}',${ii});})()" loading="lazy"><div style="position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.5);color:#fff;font-size:.58rem;font-weight:700;padding:2px 7px;border-radius:100px;pointer-events:none;letter-spacing:.03em;border:1px solid rgba(255,255,255,.18);">wikipediarf4.uy</div></div>`).join('')}</div>`
      : imgUrl?`<div style="position:relative;overflow:hidden;"><img src="${imgUrl}" style="width:100%;max-height:440px;object-fit:cover;display:block;cursor:pointer;" onclick="(function(){window._postImgsMap=window._postImgsMap||{};window._postImgsMap['trofeo_${tid}']=['${imgUrl}'];openImgLightbox('${imgUrl}',['${imgUrl}'],'trofeo_${tid}');})()" loading="lazy"><div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,.5);color:#fff;font-size:.68rem;font-weight:700;padding:3px 10px;border-radius:100px;pointer-events:none;letter-spacing:.04em;border:1px solid rgba(255,255,255,.18);">wikipediarf4.uy</div></div>`:''}
    <!-- Details -->
    ${bait||spot?`<div style="padding:10px 14px 4px;display:flex;flex-wrap:wrap;gap:6px;">
      ${bait?`<span style="background:rgba(255,170,0,.08);color:var(--warn);padding:3px 10px;border-radius:100px;font-size:.72rem;">🪱 ${bait}</span>`:''}
      ${spot?`<span style="background:rgba(0,198,255,.08);color:var(--accent);padding:3px 10px;border-radius:100px;font-size:.72rem;">📐 ${spot}</span>`:''}
    </div>`:''}
    ${description?`<div style="padding:4px 14px 12px;font-size:.85rem;color:var(--muted);line-height:1.5;">${description}</div>`:''}
    <!-- Reaction summary -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 14px;border-top:1px solid rgba(255,215,0,.08);">
      <div class="post-rxn-summary" id="rxns_trofeo_${tid}" onclick="openReactionsModal('trofeo_${tid}')" style="min-height:22px;"></div>
      <div style="font-size:.72rem;color:var(--muted);cursor:pointer;" id="trofeo_cmtcount_${tid}"></div>
    </div>
    <!-- Action bar: Reaccionar / Comentar / Compartir -->
    <div style="display:flex;border-top:1px solid rgba(255,215,0,.12);padding:0 4px;">
      <div class="rxn-wrap" style="flex:1;">
        <button class="act-btn" id="trofeoRxnBtn_${tid}"
          onmouseenter="showRxnPop('trofeo_${tid}')"
          onmouseleave="schedHideRxnPop('trofeo_${tid}')"
          onclick="quickReact('trofeo_${tid}')"
          style="width:100%;justify-content:center;gap:6px;">
          <span id="trofeoRxnIcon_${tid}">👍</span> <span id="trofeoRxnLbl_${tid}">Me gusta</span>
        </button>
        <div class="rxn-popup" id="rxnp_trofeo_${tid}"
          onmouseenter="cancelHideRxnPop('trofeo_${tid}')"
          onmouseleave="schedHideRxnPop('trofeo_${tid}')">
          ${rxnBtnsHtml}
        </div>
      </div>
      <button class="act-btn" style="flex:1;justify-content:center;" onclick="toggleComments('trofeo_${tid}')">💬 Comentar</button>
      <button class="act-btn" style="flex:1;justify-content:center;" onclick="sharePost('trofeo_${tid}')">↗️ Compartir</button>
      <button class="act-btn" style="flex:1;justify-content:center;gap:5px;color:#1877F2;" onclick="shareTrofeoFacebook('${tid}','${fish}','${map}',${weight},'${nick}')"
        onmouseover="this.style.background='rgba(24,119,242,.12)'" onmouseout="this.style.background=''">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2" style="flex-shrink:0"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
        <span style="font-size:.78rem;">Facebook</span>
      </button>
    </div>
    <!-- Comments section -->
    <div class="comments-section" id="cmts_trofeo_${tid}"></div>
    <!-- Footer -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-top:1px solid rgba(255,215,0,.08);">
      <div style="font-size:.72rem;color:var(--muted);">Verificado en WikiPediaRF4.UY</div>
      <a href="#" onclick="gp('wiki-trofeos')" target="_blank" style="font-size:.72rem;color:var(--accent);text-decoration:none;font-weight:600;">Ver registro completo ↗</a>
    </div>
  </div>`;
}

function renderTrofeoSidebar(items){
  const els = document.querySelectorAll('#trofeoSidebarList, [id="trofeoSidebarList"]');
  const el = document.getElementById('trofeoSidebarList');
  if(!el) return;
  if(!items||!items.length){
    el.innerHTML='<div style="font-size:.75rem;color:var(--muted);padding:4px;">Sin trofeos aún</div>';
    return;
  }
  const html = items.slice(0,5).map(t=>{
    const fish = esc(t.fish||t.especie||'?');
    const weight = t.weight||t.peso||0;
    const nick = esc(t.userNick||t.submittedBy||t.nick||'?');
    const images = t.images||[];
    const imgUrl = images[0]||t.imageUrl||t.img||t.imagen||'';
    const approvedAt = t.createdAt?.toMillis?.() || t.createdAt || Date.now();
    const tid = t.id||'';
    return `<div style="cursor:pointer;border-radius:var(--r);overflow:hidden;margin-bottom:8px;border:1px solid rgba(255,215,0,.15);background:var(--bg3);transition:border-color .2s;" onclick="gp('trofeos-feed');setTimeout(()=>{const el=document.getElementById('trofeo_${tid}');if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.style.borderColor='var(--gold)';}},400);" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='rgba(255,215,0,.15)'">
      ${imgUrl?`<div style="width:100%;height:90px;overflow:hidden;"><img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;" loading="lazy"></div>`:`<div style="width:100%;height:60px;background:linear-gradient(135deg,rgba(255,215,0,.12),rgba(255,165,0,.06));display:flex;align-items:center;justify-content:center;font-size:2rem;">🏆</div>`}
      <div style="padding:7px 10px;">
        <div style="font-size:.8rem;font-weight:700;color:var(--gold);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fish}${weight?' · '+fmtKg(weight):''}</div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:2px;">${nick} · ${fmtT(approvedAt)}</div>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('[id="trofeoSidebarList"]').forEach(e => e.innerHTML = html);
}

