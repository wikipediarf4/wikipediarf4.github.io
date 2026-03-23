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

