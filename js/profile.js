// ===== PROFILE =====
function renderProfile(){
  if(!window.CU) return;
  // Resetear tabs al estado inicial (Publicaciones activo)
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
  const firstTab = document.querySelector('.ptab');
  if(firstTab) firstTab.classList.add('on');
  const ids = ['ptAbout','ptGallery','ptFriends','ptShop'];
  ids.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  const feedEl = document.getElementById('profileFeed');
  const postBox = document.getElementById('profilePostBox');
  const leftCol = document.getElementById('profileLeftCol');
  if(feedEl) feedEl.style.display='block';
  if(postBox) postBox.style.display='block';
  if(leftCol) leftCol.style.display='block';
  const avEl = document.getElementById('profAvBig');
  avEl.innerHTML = `<img src="${CU.av||getDefaultAv(CU.gender||'')}" style="pointer-events:none;width:100%;height:100%;object-fit:cover;">`;
  // Asignar clicks para ver foto grande
  avEl.onclick = () => openPhotoModal('avatar');
  const profCoverEl = document.getElementById('profCover');
  if(profCoverEl) profCoverEl.onclick = () => openPhotoModal('cover');
  const isVerified = !!CU.verified;

  // ── COVER especial verificado ──
  const cover = document.getElementById('profCover');
  const canvas = document.getElementById('verifParticles');
  const seal = document.getElementById('verifSeal');
  if(false){
    cover.classList.add('verif-cover-active');
    if(canvas){ canvas.style.display='block'; _startVerifParticles(canvas); }
    if(seal) seal.style.display='block';
  } else {
    cover.classList.remove('verif-cover-active');
    if(canvas){ canvas.style.display='none'; _stopVerifParticles(); }
    if(seal) seal.style.display='none';
  }

  // ── AVATAR ring animado ──
  const avWrapEl = document.querySelector('.profile-av-wrap');
  if(avWrapEl){
    avWrapEl.classList.remove('verif-av-ring');
  }
  avEl.classList.remove('verified-ring');

  // ── NOMBRE dorado animado ──
  const nameEl = document.getElementById('profName');
  nameEl.textContent = window.CU.nick;
  const isPremiumUser = window.CU.role === 'premium' || (window.CU.badges||[]).includes('premium');
  nameEl.classList.remove('verif-name-gold');
  if(isPremiumUser){ nameEl.classList.add('premium-name'); } else { nameEl.classList.remove('premium-name'); }

  // ── BADGE ──
  const badge = document.getElementById('profVerifiedBadge');
  if(badge) badge.style.display = 'none';

  // ── BADGE PREMIUM ──
  let _profPremBadge = document.getElementById('_profPremiumBadge');
  if(isPremiumUser){
    if(!_profPremBadge){
      _profPremBadge = document.createElement('span');
      _profPremBadge.id = '_profPremiumBadge';
      _profPremBadge.className = 'premium-badge-inline';
      _profPremBadge.style.marginTop = '6px';
      _profPremBadge.innerHTML = '⭐ Perfil Premium';
      nameEl.insertAdjacentElement('afterend', _profPremBadge);
    }
  } else {
    if(_profPremBadge) _profPremBadge.remove();
  }

  // ── BANNER PREMIUM ──
  let verifBanner = document.getElementById('verifProfileBanner');
  if(false){
    if(!verifBanner){
      verifBanner = document.createElement('div');
      verifBanner.id = 'verifProfileBanner';
      verifBanner.className = 'verif-banner';
      verifBanner.innerHTML = `<span style="font-size:.75rem;">✨</span><span style="font-size:.72rem;font-weight:800;color:gold;letter-spacing:.05em;">CUENTA VERIFICADA</span><span style="font-size:.75rem;">✨</span>`;
      nameEl.closest('div').insertAdjacentElement('afterend', verifBanner);
    }
    verifBanner.style.display='flex';
  } else {
    if(verifBanner) verifBanner.style.display='none';
  }

  // ── BOTÓN VERIFICACIÓN ──
  const verifBtn = document.getElementById('profVerifBtn');
  if(verifBtn) verifBtn.style.display='none';
  document.getElementById('profBioEl').textContent = window.CU.bio||'';
  // Exclusivos verificados
  const _ab=document.getElementById('btnAnonMode'); if(_ab) _ab.style.display='none'; // Modo anónimo desactivado
  if(isVerified){ loadProfileVisitors(); } else { const _vc=document.getElementById('profVisitorsCard'); if(_vc)_vc.style.display='none'; }

  // Helper to show/hide optional rows
  function setInfoField(rowId, elId, val, href){
    const row = document.getElementById(rowId);
    const el = document.getElementById(elId);
    if(!row||!el) return;
    if(val){ row.style.display='flex'; el.textContent=val; if(href){ el.href=href; el.target='_blank'; } }
    else { row.style.display='none'; }
  }

  setInfoField('profFavFishRow','profFavFish', window.CU.favFish);
  setInfoField('profFavMapRow','profFavMap', window.CU.favMap);
  setInfoField('profTechRow','profTech', window.CU.favTech);
  setInfoField('profExpRow','profExp', window.CU.experience);
  document.getElementById('profCountry').textContent = window.CU.country ? (getCountryFlag(window.CU.country) + ' ' + window.CU.country).trim() : 'No especificado';
  // Email propio: siempre visible (es el dueño), mostrar enmascarado con etiqueta de privacidad
  const _myEmail = (auth.currentUser && auth.currentUser.email) || window.CU.email || '';
  const _emailPriv = window.CU.emailPrivacy || 'only';
  const _privLabel = {all:'🌐 Todos',friends:'👥 Amigos',only:'🔒 Solo yo'}[_emailPriv]||'🔒 Solo yo';
  if(_myEmail){
    const emailRow = document.getElementById('profEmailRow');
    const emailEl = document.getElementById('profEmailEl');
    if(emailRow) emailRow.style.display='flex';
    if(emailEl) emailEl.innerHTML = maskEmail(_myEmail) + ` <span style="font-size:.65rem;color:var(--muted);margin-left:6px;background:var(--bg3);padding:1px 6px;border-radius:100px;">${_privLabel}</span>`;
  } else {
    const emailRow = document.getElementById('profEmailRow');
    if(emailRow) emailRow.style.display='none';
  }
  setInfoField('profCityRow','profCity', window.CU.city);
  setInfoField('profAgeRow','profAge', window.CU.age);
  setInfoField('profGenderRow','profGender', window.CU.gender);
  document.getElementById('profJoined').textContent = window.CU.joined||new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});

  // Social links
  // Facebook — usuario → link
  if(window.CU.social_fb){ const u=window.CU.social_fb; document.getElementById('profFBRow').style.display='flex'; const a=document.getElementById('profFB'); a.textContent=u; a.href='https://facebook.com/'+u; }
  else { document.getElementById('profFBRow').style.display='none'; }
  // Instagram — usuario → link
  if(window.CU.social_ig){ const u=window.CU.social_ig; document.getElementById('profIGRow').style.display='flex'; const a=document.getElementById('profIG'); a.textContent='@'+u; a.href='https://instagram.com/'+u; }
  else { document.getElementById('profIGRow').style.display='none'; }
  // TikTok — usuario → link
  if(window.CU.social_tt){ const u=window.CU.social_tt; document.getElementById('profTTRow').style.display='flex'; const a=document.getElementById('profTT'); a.textContent='@'+u; a.href='https://tiktok.com/@'+u; }
  else { document.getElementById('profTTRow').style.display='none'; }
  // Discord — solo usuario, sin link
  setInfoField('profDCRow','profDC', window.CU.social_dc);
  // YouTube — URL directa
  if(window.CU.social_yt){ document.getElementById('profYTRow').style.display='flex'; document.getElementById('profYT').textContent=window.CU.social_yt.replace(/https?:\/\/(www\.)?/,''); document.getElementById('profYT').href=window.CU.social_yt; }
  else { document.getElementById('profYTRow').style.display='none'; }
  // Twitch — URL directa
  if(window.CU.social_tw){ document.getElementById('profTWRow').style.display='flex'; document.getElementById('profTW').textContent=window.CU.social_tw.replace(/https?:\/\/(www\.)?/,''); document.getElementById('profTW').href=window.CU.social_tw; }
  else { document.getElementById('profTWRow').style.display='none'; }

  // Level based on experience
  const lvlMap = {Principiante:'🐟 Principiante',Intermedio:'🎣 Intermedio',Avanzado:'⭐ Avanzado',Experto:'🏆 Experto',Profesional:'👑 Profesional'};
  const mine = _posts.filter(p=>p.userId===window.CU.id);
  document.getElementById('profLevel').textContent = lvlMap[window.CU.experience] || (mine.length>=10?'🏆 Experto':mine.length>=5?'⭐ Activo':mine.length>=1?'🎣 Pescador':'🐟 Novato');

  // Contar total de reacciones (reactionCounts incluye todos los emojis; p.likes es legacy y puede ser 0)
  const totalLikes = mine.reduce((s,p)=>{
    const rxnTotal = Object.values(p.reactionCounts||{}).reduce((a,b)=>a+(b||0),0);
    return s + (rxnTotal || p.likes || 0);
  }, 0);
  // Solo actualizar contadores de posts/likes desde cache si ya hay datos; si no, _renderProfileFeedHTML los actualizará con datos reales de Firestore
  if(mine.length > 0){
    document.getElementById('profPostCount').textContent = mine.length;
    document.getElementById('profLikeCount').textContent = totalLikes;
  }
  document.getElementById('profFriendCount').textContent = getDemoFriends().length;
  // Badges
  const badges = [];
  if(mine.length>=1) badges.push('<span class="badge badge-green">🎣 Pescador</span>');
  if(mine.length>=5) badges.push('<span class="badge badge-blue">⭐ Activo</span>');
  if(totalLikes>=10) badges.push('<span class="badge badge-gold">🏆 Popular</span>');
  if(window.CU.experience==='Experto'||window.CU.experience==='Profesional') badges.push('<span class="badge badge-gold">👑 Pro</span>');
  document.getElementById('profBadges').innerHTML = badges.join(' ');
  // Photo grid — solo actualizar si ya hay posts en cache; si no, _renderProfileFeedHTML lo hará con datos reales de Firestore
  if(mine.length > 0){
    const allImgs = mine.flatMap(p=>p.images||[]).filter(Boolean);
    const _profImgsStr = JSON.stringify(allImgs.slice(0,9));
    document.getElementById('profPhotoGrid').innerHTML = allImgs.slice(0,9).map(img=>`<img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openImgLightbox('${img}',${_profImgsStr})">`).join('') || '<div style="color:var(--muted);font-size:.8rem;grid-column:1/-1;padding:8px">Sin fotos aún</div>';
  }
  // Friends grid - real friends
  const friends = getDemoFriends();
  document.getElementById('profFriendCount').textContent = friends.length;
  const friendsGrid = document.getElementById('profFriendsGrid');
  if(friends.length === 0){
    friendsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--muted);font-size:.82rem;">Sin amigos aún. ¡Conectate con otros pescadores!</div>';
  } else {
    friendsGrid.innerHTML = friends.slice(0,9).map(f=>`
      <div style="text-align:center;position:relative;">
        <div onclick="openUserProfile('${f.id}','${(f.nick||'').replace(/'/g,"\\'")}')" style="cursor:pointer;">
          <div style="width:100%;aspect-ratio:1;border-radius:var(--rs);background:var(--bg3);border:1px solid var(--border);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;color:var(--accent);margin-bottom:4px">
            ${`<img src="${f.av||getDefaultAv(f.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`}
          </div>
          <div style="font-size:.68rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.nick}</div>
        </div>
        <button onclick="event.stopPropagation();removeFriend('${f.id}','${(f.nick||'').replace(/'/g,"\\'")}')" title="Eliminar amigo" style="margin-top:3px;width:100%;padding:2px 0;background:transparent;border:1px solid rgba(248,81,73,.35);border-radius:var(--rs);color:var(--red);font-size:.6rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;transition:all .18s;" onmouseover="this.style.background='rgba(248,81,73,.12)'" onmouseout="this.style.background='transparent'">✕ Eliminar</button>
      </div>`).join('');
  }
  renderXPUI();
  // Mostrar pestaña tienda solo para admin
  const shopTab = document.getElementById('ptShopTab');
  if(shopTab) shopTab.style.display = 'block'; // visible para todos
  // Cover
  if(window.CU.cover){ document.getElementById('profCover').style.backgroundImage=`url(${window.CU.cover})`; document.getElementById('profCover').style.backgroundSize='cover'; document.getElementById('profCoverInner').style.display='none'; }
  // Cargar fotos y stats directamente desde Firestore (no depender del cache _posts)
  _loadProfileSidebarFromFirestore();
  renderProfileFeed();
}

function _loadProfileSidebarFromFirestore(){
  if(!window.CU) return;
  getDocs(query(collection(db,'posts'), where('userId','==',window.CU.id))).then(snap=>{
    const posts = snap.docs.map(d=>({id:d.id,...d.data()}));
    // Stats
    document.getElementById('profPostCount').textContent = posts.length;
    const totalLikes = posts.reduce((s,p)=>{
      return s + Object.values(p.reactionCounts||{}).reduce((a,b)=>a+(b||0),0) || s + (p.likes||0);
    },0);
    const profLikeEl = document.getElementById('profLikeCount');
    if(profLikeEl) profLikeEl.textContent = totalLikes;
    // Level y badges
    const lvlMap = {Principiante:'🐟 Principiante',Intermedio:'🎣 Intermedio',Avanzado:'⭐ Avanzado',Experto:'🏆 Experto',Profesional:'👑 Profesional'};
    const profLevelEl = document.getElementById('profLevel');
    if(profLevelEl) profLevelEl.textContent = lvlMap[window.CU.experience] || (posts.length>=10?'🏆 Experto':posts.length>=5?'⭐ Activo':posts.length>=1?'🎣 Pescador':'🐟 Novato');
    const profBadgesEl = document.getElementById('profBadges');
    if(profBadgesEl){
      const badges=[];
      if(posts.length>=1) badges.push('<span class="badge badge-green">🎣 Pescador</span>');
      if(posts.length>=5) badges.push('<span class="badge badge-blue">⭐ Activo</span>');
      if(totalLikes>=10) badges.push('<span class="badge badge-gold">🏆 Popular</span>');
      if(window.CU.experience==='Experto'||window.CU.experience==='Profesional') badges.push('<span class="badge badge-gold">👑 Pro</span>');
      profBadgesEl.innerHTML = badges.join(' ');
    }
    // Galería miniatura (columna izquierda)
    const allImgs = posts.flatMap(p=>p.images||[]).filter(Boolean);
    const profPhotoGrid = document.getElementById('profPhotoGrid');
    if(profPhotoGrid){
      window._profAllImgs = allImgs.slice(0,9);
      profPhotoGrid.innerHTML = allImgs.slice(0,9).map((img,idx)=>
        `<img src="${img}" style="width:100%;aspect-ratio:1;object-fit:cover;cursor:pointer" onclick="openImgLightbox(window._profAllImgs[${idx}],window._profAllImgs)">`
      ).join('') || '<div style="color:var(--muted);font-size:.8rem;grid-column:1/-1;padding:8px">Sin fotos aún</div>';
    }
  }).catch(e=>console.warn('_loadProfileSidebarFromFirestore error:',e));
}

async function saveProfile(){
  if(!window.CU) return;

  // --- Nick change: 90-day cooldown ---
  const newNick = document.getElementById('epNick').value.trim() || window.CU.nick;
  const oldNick = window.CU.nick || '';
  const nickChanged = newNick && newNick !== oldNick;
  if(nickChanged){
    const last = window.CU.nickLastChanged ? new Date(window.CU.nickLastChanged) : null;
    const daysSince = last ? (Date.now() - last.getTime()) / (1000*60*60*24) : 999;
    if(daysSince < 90){
      const daysLeft = Math.ceil(90 - daysSince);
      toast(`No podés cambiar el nick por ${daysLeft} días más. Contactá a ruizgustavo12 para cambios urgentes.`,'err');
      document.getElementById('epNick').value = oldNick;
      return;
    }
    window.CU.nick = newNick;
    window.CU.nickLastChanged = new Date().toISOString();
  }

  window.CU.bio = document.getElementById('epBio').value.trim();
  window.CU.favFish = document.getElementById('epFish').value.trim();
  window.CU.favMap = document.getElementById('epMap').value;
  window.CU.country = document.getElementById('epCountry').value;
  // Guardar privacidad del email
  const privChecked = document.querySelector('input[name="epEmailPrivacy"]:checked');
  window.CU.emailPrivacy = privChecked ? privChecked.value : 'only';
  window.CU.city = document.getElementById('epCity').value.trim();
  window.CU.birthdate = document.getElementById('epBirthdate').value || '';
  if(window.CU.birthdate){
    const bd=new Date(window.CU.birthdate);
    window.CU.birthdayMMDD = (bd.getMonth()+1).toString().padStart(2,'0')+'-'+bd.getDate().toString().padStart(2,'0');
    window.CU.age = Math.floor((Date.now()-bd.getTime())/(365.25*24*3600*1000)).toString();
  }
  window.CU.gender = document.getElementById('epGender').value;
  window.CU.favTech = document.getElementById('epTech').value;
  window.CU.experience = document.getElementById('epExp').value;
  window.CU.social_yt = document.getElementById('epYT').value.trim();
  window.CU.social_dc = document.getElementById('epDC').value.trim();
  window.CU.social_tw = document.getElementById('epTW').value.trim();
  window.CU.social_fb = (document.getElementById('epFB').value.trim()).replace(/^@/,'').replace(/^https?:\/\/(www\.)?facebook\.com\/?/,'').replace(/\/$/,'');
  window.CU.social_ig = (document.getElementById('epIG').value.trim()).replace(/^@/,'').replace(/^https?:\/\/(www\.)?instagram\.com\/?/,'').replace(/\/$/,'');
  window.CU.social_tt = (document.getElementById('epTT').value.trim()).replace(/^@/,'').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/,'').replace(/\/$/,'');
  await updateDoc(doc(db, 'users', window.CU.id), window.CU);
  cm('mEditProfile'); updateNavUI(); renderProfile();
  toast('Perfil actualizado ✅','ok');
}

function openEditProfile(){
  if(!window.CU) return;
  // Nick field: check 90-day cooldown
  const nickEl = document.getElementById('epNick');
  const nickMsgEl = document.getElementById('epNickMsg');
  nickEl.value = window.CU.nick||'';
  const last = window.CU.nickLastChanged ? new Date(window.CU.nickLastChanged) : null;
  const daysSince = last ? (Date.now()-last.getTime())/(1000*60*60*24) : 999;
  if(daysSince < 90){
    const daysLeft = Math.ceil(90-daysSince);
    const hoursLeft = Math.ceil((90*24*60*60*1000 - (Date.now()-last.getTime()))/(1000*60*60));
    nickEl.readOnly = true;
    nickEl.style.opacity = '.6';
    nickEl.style.cursor = 'default';
    nickMsgEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(255,100,0,.08);border:1px solid rgba(255,100,0,.2);border-radius:8px;padding:8px 12px;">
        <span style="font-size:1.4rem;">⏳</span>
        <div>
          <div style="font-size:.78rem;font-weight:700;color:#ff7043;">Nick bloqueado por cooldown</div>
          <div style="font-size:.72rem;color:var(--muted);margin-top:2px;">Disponible en <span style="font-weight:900;color:#ff7043;font-size:.85rem;">${daysLeft} días</span> (${hoursLeft}h)</div>
          <div style="font-size:.65rem;color:var(--muted);margin-top:2px;">Cambio urgente: contactá a <strong>ruizgustavo12</strong></div>
        </div>
      </div>`;
    nickMsgEl.style.display = 'block';
  } else {
    nickEl.readOnly = false;
    nickEl.style.opacity = '';
    nickEl.style.cursor = '';
    if(last){
      nickMsgEl.innerHTML = '✅ Podés cambiar tu nick (último cambio hace más de 90 días).';
      nickMsgEl.style.color = 'var(--green)';
      nickMsgEl.style.display = 'block';
    } else {
      nickMsgEl.style.display = 'none';
    }
  }

  document.getElementById('epBio').value = window.CU.bio||'';
  document.getElementById('epFish').value = window.CU.favFish||'';
  document.getElementById('epMap').value = window.CU.favMap||'';
  document.getElementById('epCountry').value = window.CU.country||'';
  // Email: mostrar enmascarado
  const realEmail = (auth.currentUser && auth.currentUser.email) || window.CU.email || '';
  const maskedEl = document.getElementById('epEmailMasked');
  if(maskedEl) maskedEl.textContent = maskEmail(realEmail);
  // Cancelar form si estaba abierto
  cancelEmailChange && cancelEmailChange();
  // Privacidad email
  const priv = window.CU.emailPrivacy || 'only';
  const privRadios = document.querySelectorAll('input[name="epEmailPrivacy"]');
  privRadios.forEach(r=>{ r.checked = (r.value === priv); });
  document.getElementById('epCity').value = window.CU.city||'';
  document.getElementById('epBirthdate').value = window.CU.birthdate||'';
  // Auto-calc age from birthdate
  if(window.CU.birthdate){
    const bd=new Date(window.CU.birthdate);
    document.getElementById('epAge').value = Math.floor((Date.now()-bd.getTime())/(365.25*24*3600*1000));
  } else {
    document.getElementById('epAge').value = window.CU.age||'';
  }
  document.getElementById('epGender').value = window.CU.gender||'';
  document.getElementById('epTech').value = window.CU.favTech||'';
  document.getElementById('epExp').value = window.CU.experience||'';
  document.getElementById('epYT').value = window.CU.social_yt||'';
  document.getElementById('epDC').value = window.CU.social_dc||'';
  document.getElementById('epTW').value = window.CU.social_tw||'';
  document.getElementById('epFB').value = window.CU.social_fb||'';
  document.getElementById('epIG').value = window.CU.social_ig||'';
  document.getElementById('epTT').value = window.CU.social_tt||'';
  om('mEditProfile');
  setTimeout(setupBioLimit,50);
}

function calcAgeFromBirthdate(){
  const bd = document.getElementById('epBirthdate').value;
  const ageEl = document.getElementById('epAge');
  if(bd){
    const age = Math.floor((Date.now()-new Date(bd).getTime())/(365.25*24*3600*1000));
    ageEl.value = age > 0 && age < 120 ? age : '';
  } else {
    ageEl.value = '';
  }
}

async function changeCover(input){
  const f = input.files[0]; if(!f) return;
  toast('Subiendo portada...','inf');
  const url = await uploadImage(f, 'covers');
  window.CU.cover = url;
  await updateDoc(doc(db, 'users', window.CU.id), {cover: url});
  // Publicar post automático
  try {
    await addDoc(collection(db,'posts'),{
      userId: window.CU.id,
      userNick: window.CU.nick,
      userAv: window.CU.av||'',
      userXp: window.CU.xp||0,
      userVerified: window.CU.verified||false,
      text: `📸 ${window.CU.nick} actualizó su foto de portada.`,
      images: [url],
      profileAction: 'cover',
      fish:'', weight:0, map:'', tech:'',
      video:'', link:null,
      time: serverTimestamp(),
      likes:0, comments:[], reactions:{}, reactionCounts:{}
    });
  } catch(e){ console.warn('cover post err',e); }
  renderProfile(); toast('Portada actualizada ✅','ok');
}
async function changeAvatar(input){
  const f = input.files[0]; if(!f) return;
  toast('Subiendo foto...','inf');
  const url = await uploadImage(f, 'avatars');
  window.CU.av = url;
  await updateDoc(doc(db, 'users', window.CU.id), {av: url});
  // Update "Crear historia" card
  const sp = document.getElementById('storyAddPhoto');
  if(sp) sp.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;">`;
  // Publicar post automático
  try {
    await addDoc(collection(db,'posts'),{
      userId: window.CU.id,
      userNick: window.CU.nick,
      userAv: url,
      userXp: window.CU.xp||0,
      userVerified: window.CU.verified||false,
      text: `🖼️ ${window.CU.nick} actualizó su foto de perfil.`,
      images: [url],
      profileAction: 'avatar',
      fish:'', weight:0, map:'', tech:'',
      video:'', link:null,
      time: serverTimestamp(),
      likes:0, comments:[], reactions:{}, reactionCounts:{}
    });
  } catch(e){ console.warn('avatar post err',e); }
  updateNavUI(); renderProfile(); toast('Foto actualizada ✅','ok');
}

// ===== TABS =====
function swPTab(el, tabId){
  document.querySelectorAll('.ptab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  const aboutEl = document.getElementById('ptAbout');
  const galleryEl = document.getElementById('ptGallery');
  const friendsEl = document.getElementById('ptFriends');
  const shopEl = document.getElementById('ptShop');
  const feedEl = document.getElementById('profileFeed');
  const postBox = document.getElementById('profilePostBox');
  const leftCol = document.getElementById('profileLeftCol');
  if(aboutEl) aboutEl.style.display = tabId==='ptAbout' ? 'block' : 'none';
  if(galleryEl) galleryEl.style.display = tabId==='ptGallery' ? 'block' : 'none';
  if(friendsEl) friendsEl.style.display = tabId==='ptFriends' ? 'block' : 'none';
  if(shopEl) shopEl.style.display = tabId==='ptShop' ? 'block' : 'none';
  if(feedEl) feedEl.style.display = tabId==='ptPosts' ? 'block' : 'none';
  if(postBox) postBox.style.display = tabId==='ptPosts' ? 'block' : 'none';
  if(leftCol) leftCol.style.display = (tabId==='ptAbout' || tabId==='ptFriends') ? 'none' : 'block';
  if(tabId==='ptPosts') renderProfileFeed();
  if(tabId==='ptGallery') renderGallery();
  if(tabId==='ptFriends') renderProfileFriendsList();
  if(tabId==='ptShop'){ loadShopEquipped().then(()=>renderShopGrid()); loadShopDiscount(); }
}

// ===== TIENDA DE ÍTEMS DE PERFIL (admin only) =====
const SHOP_ITEMS = [
  // ── MARCOS ──
  { id:'marco_oro',      cat:'marco',  name:'Marco Dorado',       preview:'🟡', emoji:'⭕', price:500,  desc:'Borde dorado clásico animado',          effect:'ring-gold' },
  { id:'marco_fuego',    cat:'marco',  name:'Marco de Fuego',     preview:'🔥', emoji:'🔥', price:800,  desc:'Llamas pulsantes alrededor de tu foto',  effect:'ring-fire' },
  { id:'marco_hielo',    cat:'marco',  name:'Marco Glacial',      preview:'❄️', emoji:'💠', price:800,  desc:'Resplandor helado en tu avatar',          effect:'ring-ice' },
  { id:'marco_pesca',    cat:'marco',  name:'Marco Pescador',     preview:'🎣', emoji:'🎣', price:300,  desc:'Marco verde temático de pesca',           effect:'ring-fish' },
  { id:'marco_legend',   cat:'marco',  name:'Marco Leyenda',      preview:'👑', emoji:'✨', price:1500, desc:'El marco más exclusivo de RF4 Latam',     effect:'ring-legend', exclusive:true },
  { id:'marco_neon',     cat:'marco',  name:'Marco Neón',         preview:'💜', emoji:'💜', price:700,  desc:'Neón violeta vibrante',                  effect:'ring-neon' },
  { id:'marco_galaxia',  cat:'marco',  name:'Marco Galaxia',      preview:'🌌', emoji:'🌌', price:1000, desc:'Cosmos girando en tu avatar',            effect:'ring-galaxy', exclusive:true },
  { id:'marco_rojo',     cat:'marco',  name:'Marco Rojo Fuerte',  preview:'🔴', emoji:'🔴', price:400,  desc:'Rojo intenso, se destaca en el feed',    effect:'ring-red' },
  { id:'marco_arcoiris', cat:'marco',  name:'Marco Arcoíris',     preview:'🌈', emoji:'🌈', price:900,  desc:'Colores cambiantes continuamente',        effect:'ring-rainbow', exclusive:true },
  { id:'marco_platino',  cat:'marco',  name:'Marco Platino',      preview:'⚪', emoji:'⚪', price:1200, desc:'Plata brillante premium',                effect:'ring-platinum', exclusive:true },
  // ── BADGES ──
  { id:'badge_shark',    cat:'badge',  name:'Tiburón',            preview:'🦈', emoji:'🦈', price:400,  desc:'Badge de tiburón junto a tu nombre' },
  { id:'badge_trophy',   cat:'badge',  name:'Campeón',            preview:'🏆', emoji:'🏆', price:600,  desc:'Badge de trofeo dorado' },
  { id:'badge_king',     cat:'badge',  name:'Rey del Río',        preview:'👑', emoji:'👑', price:900,  desc:'Badge exclusivo de realeza', exclusive:true },
  { id:'badge_rf4',      cat:'badge',  name:'RF4 OG',             preview:'🎮', emoji:'🎮', price:350,  desc:'Badge de jugador original de RF4' },
  { id:'badge_latam',    cat:'badge',  name:'Latino Power',       preview:'🌎', emoji:'🌎', price:300,  desc:'Badge de orgullo latinoamericano' },
  { id:'badge_dragon',   cat:'badge',  name:'Dragón',             preview:'🐉', emoji:'🐉', price:800,  desc:'Badge de dragón legendario', exclusive:true },
  { id:'badge_ninja',    cat:'badge',  name:'Ninja',              preview:'🥷', emoji:'🥷', price:500,  desc:'Badge sigilo total' },
  { id:'badge_wolf',     cat:'badge',  name:'Lobo Solitario',     preview:'🐺', emoji:'🐺', price:450,  desc:'Para los que pescan solos y ganan' },
  { id:'badge_alien',    cat:'badge',  name:'Visitante',          preview:'👽', emoji:'👽', price:350,  desc:'Badge raro y misterioso' },
  { id:'badge_fire',     cat:'badge',  name:'En Llamas',          preview:'🔥', emoji:'🔥', price:400,  desc:'Racha imparable' },
  { id:'badge_dolar',    cat:'badge',  name:'Tiburón del Mercado',preview:'💰', emoji:'💰', price:700,  desc:'El que vende los mejores peces' },
  // ── EFECTOS ──
  { id:'efecto_confetti',  cat:'efecto', name:'Confetti',         preview:'🎊', emoji:'🎊', price:700,  desc:'Lluvia de confetti en tu perfil' },
  { id:'efecto_stars',     cat:'efecto', name:'Estrellas',        preview:'⭐', emoji:'💫', price:500,  desc:'Estrellas flotantes animadas' },
  { id:'efecto_aurora',    cat:'efecto', name:'Aurora Boreal',    preview:'🌌', emoji:'🌈', price:1200, desc:'Partículas de aurora en tu perfil', exclusive:true },
  { id:'efecto_peces',     cat:'efecto', name:'Lluvia de Peces',  preview:'🐟', emoji:'🐠', price:600,  desc:'Pecesitos flotando en tu perfil' },
  { id:'efecto_nieve',     cat:'efecto', name:'Nieve',            preview:'❄️', emoji:'🌨', price:550,  desc:'Nieve cayendo sobre tu perfil' },
  { id:'efecto_burbujas',  cat:'efecto', name:'Burbujas',         preview:'🫧', emoji:'🫧', price:400,  desc:'Burbujas acuáticas subiendo' },
  { id:'efecto_lightning', cat:'efecto', name:'Rayos',            preview:'⚡', emoji:'⚡', price:800,  desc:'Rayos eléctricos en tu perfil', exclusive:true },
  { id:'efecto_hojas',     cat:'efecto', name:'Hojas Otoñales',   preview:'🍂', emoji:'🍁', price:450,  desc:'Hojas cayendo suavemente' },
  { id:'efecto_dragones',  cat:'efecto', name:'Dragones',         preview:'🐉', emoji:'🐉', price:2500, desc:'Dragones volando alrededor de tu perfil', exclusive:true, soloVerificado:true },
  // ── TÍTULOS ──
  { id:'titulo_jefe',     cat:'titulo', name:'El Jefe',           preview:'😎', emoji:'😎', price:800,  desc:'Título "El Jefe" bajo tu nombre' },
  { id:'titulo_legend',   cat:'titulo', name:'Leyenda Viva',      preview:'⚡', emoji:'⚡', price:1200, desc:'Título dorado animado', exclusive:true },
  { id:'titulo_maestro',  cat:'titulo', name:'Maestro Pescador',  preview:'🎓', emoji:'🎣', price:600,  desc:'Título clásico de maestro' },
  { id:'titulo_capitan',  cat:'titulo', name:'Capitán',           preview:'⚓', emoji:'⚓', price:400,  desc:'Capitán de la red social' },
  { id:'titulo_sombra',   cat:'titulo', name:'La Sombra',         preview:'🌑', emoji:'🌑', price:700,  desc:'Misterioso y temido' },
  { id:'titulo_bestia',   cat:'titulo', name:'La Bestia',         preview:'🦁', emoji:'🦁', price:900,  desc:'Domina las aguas', exclusive:true },
  { id:'titulo_rookie',   cat:'titulo', name:'Rookie Imparable',  preview:'🚀', emoji:'🚀', price:300,  desc:'Nuevo pero letal' },
  { id:'titulo_ghost',    cat:'titulo', name:'El Fantasma',       preview:'👻', emoji:'👻', price:500,  desc:'Aparece, pesca y desaparece' },
  // ── COLORES DE PUBLICACIÓN ──
  { id:'post_ocean',    cat:'postcolor', name:'Océano Profundo',   preview:'🌊', emoji:'🌊', price:600,  desc:'Fondo azul oscuro marino en tus posts',   theme:'post-theme-ocean' },
  { id:'post_fuego',    cat:'postcolor', name:'Fuego Ardiente',    preview:'🔥', emoji:'🔥', price:700,  desc:'Fondo rojo/naranja llameante',             theme:'post-theme-fuego' },
  { id:'post_galaxia',  cat:'postcolor', name:'Galaxia',           preview:'🌌', emoji:'🌌', price:900,  desc:'Fondo púrpura espacial', exclusive:true,  theme:'post-theme-galaxia' },
  { id:'post_bosque',   cat:'postcolor', name:'Bosque Oscuro',     preview:'🌲', emoji:'🌲', price:500,  desc:'Fondo verde selva profunda',              theme:'post-theme-bosque' },
  { id:'post_oro',      cat:'postcolor', name:'Oro Negro',         preview:'👑', emoji:'💛', price:1000, desc:'Fondo negro con borde dorado', exclusive:true, theme:'post-theme-oro' },
  { id:'post_neon',     cat:'postcolor', name:'Neón Violeta',      preview:'💜', emoji:'💜', price:800,  desc:'Fondo oscuro con brillo neón',            theme:'post-theme-neon' },
  { id:'post_hielo',    cat:'postcolor', name:'Hielo Ártico',      preview:'❄️', emoji:'💎', price:650,  desc:'Fondo azul hielo translúcido',            theme:'post-theme-hielo' },
  { id:'post_rosa',     cat:'postcolor', name:'Rosa Oscuro',       preview:'🌸', emoji:'🌸', price:550,  desc:'Fondo rosa profundo',                     theme:'post-theme-rosa' },
  { id:'post_carbon',   cat:'postcolor', name:'Carbono',           preview:'⚫', emoji:'⚫', price:400,  desc:'Gris oscuro premium minimalista',         theme:'post-theme-carbon' },
  { id:'post_sunset',   cat:'postcolor', name:'Atardecer',         preview:'🌅', emoji:'🌅', price:700,  desc:'Fondo sunset naranja cálido',             theme:'post-theme-sunset' },
  // ── EFECTOS FOTO DE PERFIL (solo verificados) ──
  { id:'avfx_niebla',   cat:'avfx', name:'Niebla Mágica',      preview:'🌫️', emoji:'🌫️', price:1800, desc:'Niebla etérea que envuelve tu foto de perfil',        effect:'avfx-niebla',   soloVerificado:true, exclusive:true },
  { id:'avfx_remolino', cat:'avfx', name:'Remolino Infinito',   preview:'🌀', emoji:'🌀', price:2000, desc:'Tu foto gira suavemente en un remolino hipnótico',     effect:'avfx-remolino', soloVerificado:true, exclusive:true },
  { id:'avfx_prisma',   cat:'avfx', name:'Prisma Arcoíris',     preview:'🌈', emoji:'🌈', price:1600, desc:'Todos los colores del arcoíris pasan por tu foto',     effect:'avfx-prisma',   soloVerificado:true, exclusive:true },
  { id:'avfx_sombra',   cat:'avfx', name:'Aura Oscura',         preview:'💜', emoji:'💜', price:1500, desc:'Aura violeta pulsante de poder oscuro',                effect:'avfx-sombra',   soloVerificado:true, exclusive:true },
  { id:'avfx_oro',      cat:'avfx', name:'Toque Dorado',        preview:'✨', emoji:'✨', price:2200, desc:'Tu foto brilla con destellos de oro puro',             effect:'avfx-oro',      soloVerificado:true, exclusive:true },
  { id:'avfx_glitch',   cat:'avfx', name:'Glitch Cibernético',  preview:'⚡', emoji:'⚡', price:1700, desc:'Efecto glitch digital que distorsiona tu foto',        effect:'avfx-glitch',   soloVerificado:true, exclusive:true },
  { id:'avfx_cristal',  cat:'avfx', name:'Cristal de Agua',     preview:'💎', emoji:'💎', price:1900, desc:'Brillo de cristal de agua sobre tu foto de perfil',   effect:'avfx-cristal',  soloVerificado:true, exclusive:true },
  // ── BANNERS ANIMADOS DE PORTADA ──
  { id:'banner_fuego',  cat:'banner', name:'Fuego Vivo',         preview:'🔥', emoji:'🔥', price:1200, desc:'Llamas y brasas animadas en tu portada',    exclusive:false, bannerFn:'bannerFuego'  },
  { id:'banner_flores', cat:'banner', name:'Pétalo Oscuro',      preview:'🌸', emoji:'🌸', price:1000, desc:'Pétalos violetas flotando en la oscuridad', exclusive:false, bannerFn:'bannerFlores' },
  { id:'banner_ocean',  cat:'banner', name:'Océano Profundo',    preview:'🌊', emoji:'💧', price:900,  desc:'Burbujas y olas en el abismo',              exclusive:false, bannerFn:'bannerOcean'  },
  { id:'banner_aurora', cat:'banner', name:'Aurora Boreal',      preview:'🌌', emoji:'🌠', price:1100, desc:'Luces polares danzando en el cielo',         exclusive:true,  bannerFn:'bannerAurora' },
  { id:'banner_galaxy', cat:'banner', name:'Galaxia',            preview:'⭐', emoji:'✨', price:1300, desc:'Miles de estrellas y nebulosas',             exclusive:true,  bannerFn:'bannerGalaxy' },
  { id:'banner_storm',  cat:'banner', name:'Tormenta Eléctrica', preview:'⚡', emoji:'⚡', price:1400, desc:'Rayos y tormenta en tu portada',             exclusive:true,  bannerFn:'bannerStorm'  },
  // ── TEMAS DE PERFIL (estilo Discord) ──
  { id:'tema_admin',    cat:'tema', name:'Fuego del Admin',     preview:'👑', emoji:'👑', price:0,    desc:'Borde giratorio rojo→naranja→dorado, nombre con fuego animado, corona con rebote y glow pulsante', temaCSS:'tema-admin-fire',    exclusive:true, soloAdmin:true },
  { id:'tema_aries',    cat:'tema', name:'Aries en Llamas',     preview:'♈', emoji:'♈', price:2000, desc:'Borde rojo escarlata pulsante, fondo oscuro rojo, nombre con gradiente carmesí animado',           temaCSS:'tema-aries',         exclusive:true },
  { id:'tema_galaxy',   cat:'tema', name:'Galaxia Oscura',      preview:'🌌', emoji:'🌌', price:1800, desc:'Borde cósmico con nebulosas, partículas de estrellas, nombre con efecto estelar',                 temaCSS:'tema-galaxy-dark',   exclusive:true },
  { id:'tema_neon',     cat:'tema', name:'Neón Ciberpunk',      preview:'🟣', emoji:'💜', price:1500, desc:'Borde neón violeta eléctrico parpadeante, fondo oscuro, nombre con glow violeta/cian',            temaCSS:'tema-neon-cyber',    exclusive:false },
  { id:'tema_ocean',    cat:'tema', name:'Abismo del Océano',   preview:'🌊', emoji:'🌊', price:1200, desc:'Borde azul profundo con olas animadas, nombre con shimmer acuático',                              temaCSS:'tema-ocean-abyss',   exclusive:false },
  { id:'tema_gold',     cat:'tema', name:'Oro Puro',            preview:'✨', emoji:'💛', price:1600, desc:'Borde dorado brillante rotativo, nombre con gradiente oro-platino, badge premium',                 temaCSS:'tema-gold-pure',     exclusive:true },
  { id:'tema_shadow',   cat:'tema', name:'Sombra Oscura',       preview:'🌑', emoji:'🌑', price:1000, desc:'Borde morado oscuro sutil, nombre con degradado sombrío misterioso',                              temaCSS:'tema-shadow-dark',   exclusive:false },
  { id:'tema_ice',      cat:'tema', name:'Glaciar',             preview:'❄️', emoji:'❄️', price:1100, desc:'Borde hielo cristalino, nombre con glow helado, partículas de nieve animadas',                   temaCSS:'tema-ice-glacier',   exclusive:false },
  // ── TEMAS ACUÁTICOS RF4 ──
  { id:'tema_poseidon', cat:'tema', name:'Poseidón',            preview:'🔱', emoji:'🔱', price:2200, desc:'Tridente y corona marina SVG sobre el avatar, borde azul profundo, olas animadas en el banner', temaCSS:'tema-poseidon', exclusive:true },
  { id:'tema_sirena',   cat:'tema', name:'Sirena',              preview:'🧜', emoji:'🧜', price:1900, desc:'Cola de sirena y conchas SVG sobre el avatar, borde rosa/cian, gradiente mágico', temaCSS:'tema-sirena', exclusive:true },
  { id:'tema_pulpo',    cat:'tema', name:'Pulpo Gigante',       preview:'🐙', emoji:'🐙', price:2000, desc:'8 tentáculos SVG rodeando el avatar, borde violeta pulsante, tinta en el banner', temaCSS:'tema-pulpo', exclusive:true },
  { id:'tema_ballena',  cat:'tema', name:'Ballena Azul',        preview:'🐋', emoji:'🐋', price:1800, desc:'Silueta de ballena azul SVG con puntos bioluminiscentes, borde suave profundo', temaCSS:'tema-ballena', exclusive:false },
  { id:'tema_pirana',   cat:'tema', name:'Piraña Asesina',      preview:'🦈', emoji:'🦷', price:1700, desc:'Mandíbulas abiertas con dientes SVG, borde rojo agresivo, salpicaduras en banner', temaCSS:'tema-pirana', exclusive:true },
  { id:'tema_catfish',  cat:'tema', name:'Catfish Gigante',     preview:'🐟', emoji:'🎣', price:1500, desc:'Bigotes del siluro en SVG rodeando el avatar, borde marrón terroso', temaCSS:'tema-catfish', exclusive:false },
  { id:'tema_kraken',   cat:'tema', name:'Kraken',              preview:'🦑', emoji:'🦑', price:2500, desc:'Kraken completo SVG con 8 tentáculos y ojos, borde violeta eléctrico. El más épico', temaCSS:'tema-kraken', exclusive:true },
  { id:'tema_tiburon',  cat:'tema', name:'Tiburón Blanco',      preview:'🦈', emoji:'🦈', price:2000, desc:'Aletas y dientes SVG, borde gris metálico, mandíbulas asomando por los lados', temaCSS:'tema-tiburon', exclusive:true },
  { id:'tema_dragon',   cat:'tema', name:'Dragón de Fuego',     preview:'🐉', emoji:'🐉', price:2800, desc:'Dragón completo SVG con alas, cuernos y fuego por la boca, borde naranja ígnea', temaCSS:'tema-dragon', exclusive:true },
  { id:'tema_lobo',     cat:'tema', name:'Lobo Alfa',           preview:'🐺', emoji:'🐺', price:1600, desc:'Cara de lobo SVG con orejas y luna, ojos amarillos, borde gris plateado nocturno', temaCSS:'tema-lobo', exclusive:false },
];

// Efectos de partículas activos
let _shopParticleInterval = null;
let _bannerAnimFrame = null; // RAF para banners animados

// ── BANNER ENGINE (Canvas 2D) ──
function stopBannerAnim(){
  if(_bannerAnimFrame){ cancelAnimationFrame(_bannerAnimFrame); _bannerAnimFrame=null; }
  const cv = document.getElementById('profileBannerCanvas');
  if(cv){ cv.style.display='none'; const ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); }
  // Restaurar fondo del cover
  const cover = document.getElementById('profCover');
  if(cover) cover.style.background='';
}

function startBannerAnim(fnName){
  stopBannerAnim();
  const cv = document.getElementById('profileBannerCanvas');
  if(!cv) return;
  const cover = document.getElementById('profCover');
  cv.style.display='block';
  // Resize canvas to match element
  function resize(){ cv.width=cv.offsetWidth||cover?.offsetWidth||800; cv.height=cv.offsetHeight||cover?.offsetHeight||300; }
  resize();
  window[fnName](cv, resize);
}

function bannerFuego(cv, resize){
  const ctx = cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#0a0000,#2d0800,#4a1000)';
  // partículas de fuego
  const particles = Array.from({length:120},()=>mkFireParticle(cv));
  // brasas
  const embers = Array.from({length:40},()=>mkEmber(cv));
  function mkFireParticle(c){
    return { x:Math.random()*c.width, y:c.height+Math.random()*60,
      size:3+Math.random()*18, speed:0.8+Math.random()*2.5,
      wobble:Math.random()*Math.PI*2, wobbleSpeed:0.03+Math.random()*.05,
      alpha:0.6+Math.random()*.4,
      hue: 10+Math.random()*30 // rojo a naranja
    };
  }
  function mkEmber(c){ return { x:Math.random()*c.width, y:c.height+Math.random()*40, size:1+Math.random()*3, speed:1+Math.random()*3, vx:(Math.random()-.5)*1.5, alpha:Math.random() }; }
  function draw(){
    resize(); ctx.clearRect(0,0,cv.width,cv.height);
    // llamas
    particles.forEach(p=>{
      p.y -= p.speed; p.wobble += p.wobbleSpeed; p.x += Math.sin(p.wobble)*1.2;
      p.size *= .995; p.alpha -= .003;
      if(p.y < -p.size || p.alpha<=0){ Object.assign(p, mkFireParticle(cv)); p.y=cv.height+10; }
      const prog = 1-(p.y/cv.height);
      const grd = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
      grd.addColorStop(0, `hsla(${p.hue+prog*20},100%,70%,${p.alpha})`);
      grd.addColorStop(.5,`hsla(${p.hue},100%,50%,${p.alpha*.7})`);
      grd.addColorStop(1, `hsla(${p.hue-10},100%,30%,0)`);
      ctx.beginPath(); ctx.fillStyle=grd; ctx.ellipse(p.x,p.y,p.size*.5,p.size,0,0,Math.PI*2); ctx.fill();
    });
    // brasas flotantes
    embers.forEach(e=>{
      e.y -= e.speed; e.x += e.vx; e.alpha -= .008;
      if(e.y<-10||e.alpha<=0){ Object.assign(e,mkEmber(cv)); e.y=cv.height; }
      ctx.beginPath(); ctx.fillStyle=`rgba(255,${100+Math.random()*100},0,${e.alpha})`; ctx.arc(e.x,e.y,e.size,0,Math.PI*2); ctx.fill();
    });
    _bannerAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function bannerFlores(cv, resize){
  const ctx = cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#0d0018,#1e0042,#2d0060)';
  const petals = Array.from({length:80},()=>mkPetal(cv));
  const particles = Array.from({length:40},()=>mkSparkle(cv));
  function mkPetal(c){ return { x:Math.random()*c.width, y:c.height+Math.random()*100, size:6+Math.random()*16, speed:.4+Math.random()*1.4, vx:(Math.random()-.5)*1, rot:Math.random()*Math.PI*2, rotSpeed:.02+Math.random()*.04, alpha:.7+Math.random()*.3, hue:270+Math.random()*60 }; }
  function mkSparkle(c){ return { x:Math.random()*c.width, y:Math.random()*c.height, size:1+Math.random()*2, twinkle:Math.random()*Math.PI*2, speed:.02+Math.random()*.04 }; }
  function drawPetal(x,y,size,rot,alpha,hue){
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.globalAlpha=alpha;
    const g = ctx.createRadialGradient(0,0,0,0,0,size);
    g.addColorStop(0,`hsla(${hue},100%,80%,.9)`);
    g.addColorStop(.6,`hsla(${hue-20},90%,60%,.6)`);
    g.addColorStop(1,`hsla(${hue-30},80%,40%,0)`);
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.ellipse(0,-size*.5,size*.4,size*.9,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(size*.4,0,size*.4,size*.9,Math.PI/3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-size*.4,0,size*.4,size*.9,-Math.PI/3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  function draw(){
    resize(); ctx.clearRect(0,0,cv.width,cv.height);
    // estrellas de fondo
    particles.forEach(s=>{
      s.twinkle+=s.speed; const a=.3+.6*((Math.sin(s.twinkle)+1)/2);
      ctx.beginPath(); ctx.fillStyle=`rgba(200,160,255,${a})`; ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();
    });
    // pétalos
    petals.forEach(p=>{
      p.y-=p.speed; p.x+=p.vx+Math.sin(p.rot)*.5; p.rot+=p.rotSpeed; p.alpha-=.002;
      if(p.y<-p.size*2||p.alpha<=0){ Object.assign(p,mkPetal(cv)); p.y=cv.height+20; }
      drawPetal(p.x,p.y,p.size,p.rot,p.alpha,p.hue);
    });
    _bannerAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function bannerOcean(cv, resize){
  const ctx=cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#00050f,#001530,#002050)';
  const bubbles=Array.from({length:60},()=>mkBubble(cv));
  let t=0;
  function mkBubble(c){ return {x:Math.random()*c.width, y:c.height+Math.random()*50, r:2+Math.random()*12, speed:.3+Math.random()*1, vx:(Math.random()-.5)*.8, alpha:.4+Math.random()*.5}; }
  function draw(){
    t+=.01; resize(); ctx.clearRect(0,0,cv.width,cv.height);
    // olas
    for(let w=0;w<3;w++){
      ctx.beginPath(); ctx.moveTo(0,cv.height);
      for(let x=0;x<=cv.width;x+=10){
        const y=cv.height*.7+Math.sin(x*.02+t+w*2)*15+Math.sin(x*.04-t*.7+w)*8;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(cv.width,cv.height); ctx.closePath();
      ctx.fillStyle=`rgba(0,100,200,${.08+w*.04})`; ctx.fill();
    }
    // burbujas
    bubbles.forEach(b=>{
      b.y-=b.speed; b.x+=b.vx+Math.sin(t+b.r)*.3; b.alpha-=.0015;
      if(b.y<-b.r*2||b.alpha<=0){ Object.assign(b,mkBubble(cv)); b.y=cv.height; }
      ctx.beginPath(); ctx.strokeStyle=`rgba(100,200,255,${b.alpha})`; ctx.lineWidth=1.5;
      ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle=`rgba(150,220,255,${b.alpha*.2})`; ctx.fill();
    });
    _bannerAnimFrame=requestAnimationFrame(draw);
  }
  draw();
}

function bannerAurora(cv, resize){
  const ctx=cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#000508,#001010,#001a15)';
  const stars=Array.from({length:80},()=>({x:Math.random()*800,y:Math.random()*300,r:Math.random()*1.5,t:Math.random()*Math.PI*2}));
  let t=0;
  function draw(){
    t+=.008; resize();
    // actualiza posiciones estrella
    stars.forEach(s=>{ s.x=(s.x/800)*cv.width; s.y=(s.y/300)*cv.height; });
    ctx.clearRect(0,0,cv.width,cv.height);
    // estrellas
    stars.forEach(s=>{ s.t+=.02; const a=.3+.6*((Math.sin(s.t)+1)/2); ctx.beginPath(); ctx.fillStyle=`rgba(200,255,240,${a})`; ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); });
    // cortinas de aurora
    const cols=['rgba(0,255,150','rgba(0,200,255','rgba(100,0,255','rgba(0,255,100'];
    for(let i=0;i<4;i++){
      ctx.save(); ctx.globalAlpha=.15+Math.sin(t+i)*0.07;
      const grd=ctx.createLinearGradient(0,0,0,cv.height);
      grd.addColorStop(0,`${cols[i%cols.length]},0)`);
      grd.addColorStop(.3,`${cols[i%cols.length]},.6)`);
      grd.addColorStop(1,`${cols[(i+1)%cols.length]},0)`);
      ctx.fillStyle=grd;
      ctx.beginPath();
      const xBase=(i/4)*cv.width+Math.sin(t*.5+i)*60;
      const ww=cv.width*.35;
      ctx.moveTo(xBase,0);
      for(let y=0;y<=cv.height;y+=5){
        ctx.lineTo(xBase+Math.sin(y*.02+t+i)*40+ww*(y/cv.height),y);
      }
      ctx.lineTo(xBase+ww,cv.height); ctx.lineTo(xBase,0); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    _bannerAnimFrame=requestAnimationFrame(draw);
  }
  draw();
}

function bannerGalaxy(cv, resize){
  const ctx=cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#000005,#050010,#0a0020)';
  const stars=Array.from({length:200},()=>({x:Math.random(),y:Math.random(),r:.5+Math.random()*2,t:Math.random()*Math.PI*2,speed:.01+Math.random()*.04,col:[`255,255,255`,`200,200,255`,`255,220,180`,`180,220,255`][Math.floor(Math.random()*4)]}));
  const nebula=Array.from({length:8},()=>({x:Math.random(),y:Math.random(),r:40+Math.random()*80,hue:200+Math.random()*160,t:Math.random()*Math.PI*2}));
  let t=0;
  function draw(){
    t+=.005; resize(); ctx.clearRect(0,0,cv.width,cv.height);
    // nebulosas
    nebula.forEach(n=>{ n.t+=.003; const g=ctx.createRadialGradient(n.x*cv.width,n.y*cv.height,0,n.x*cv.width,n.y*cv.height,n.r*(1+Math.sin(n.t)*.1)); g.addColorStop(0,`hsla(${n.hue},100%,60%,.12)`); g.addColorStop(1,`hsla(${n.hue},80%,40%,0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x*cv.width,n.y*cv.height,n.r*1.5,0,Math.PI*2); ctx.fill(); });
    // estrellas
    stars.forEach(s=>{ s.t+=s.speed; const a=.4+.6*((Math.sin(s.t)+1)/2); ctx.beginPath(); ctx.fillStyle=`rgba(${s.col},${a})`; ctx.arc(s.x*cv.width,s.y*cv.height,s.r*(a*.5+.5),0,Math.PI*2); ctx.fill(); });
    _bannerAnimFrame=requestAnimationFrame(draw);
  }
  draw();
}

function bannerStorm(cv, resize){
  const ctx=cv.getContext('2d');
  if(document.getElementById('profCover')) document.getElementById('profCover').style.background='linear-gradient(180deg,#050507,#0a0a10,#101018)';
  const drops=Array.from({length:120},()=>mkDrop(cv));
  let t=0, lightningT=0, lightningAlpha=0;
  function mkDrop(c){ return {x:Math.random()*c.width, y:Math.random()*c.height, speed:4+Math.random()*8, len:8+Math.random()*20, alpha:.2+Math.random()*.5}; }
  function drawLightning(x,y,x2,y2,depth){
    if(depth<=0) return; const mx=(x+x2)/2+(Math.random()-.5)*60; const my=(y+y2)/2+(Math.random()-.5)*20;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(mx,my); ctx.lineTo(x2,y2);
    ctx.strokeStyle=`rgba(200,220,255,${lightningAlpha})`; ctx.lineWidth=depth*.5; ctx.stroke();
    drawLightning(x,y,mx,my,depth-1); drawLightning(mx,my,x2,y2,depth-1);
  }
  function draw(){
    t+=1; lightningT--; resize(); ctx.clearRect(0,0,cv.width,cv.height);
    // lluvia
    ctx.strokeStyle='rgba(150,180,255,.4)'; ctx.lineWidth=1;
    drops.forEach(d=>{
      d.y+=d.speed; if(d.y>cv.height){ Object.assign(d,mkDrop(cv)); d.y=-d.len; }
      ctx.beginPath(); ctx.globalAlpha=d.alpha; ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-2,d.y+d.len); ctx.stroke();
    });
    ctx.globalAlpha=1;
    // rayos aleatorios
    if(lightningT<=0){ lightningAlpha=.6+Math.random()*.4; lightningT=80+Math.random()*200; drawLightning(Math.random()*cv.width,0,Math.random()*cv.width,cv.height*.6,4); }
    _bannerAnimFrame=requestAnimationFrame(draw);
  }
  draw();
}
let _shopFilter = 'all';
let _equippedItems = {}; // { marco: 'marco_oro', badge: 'badge_shark', ... }

function filterShopCat(btn, cat){
  document.querySelectorAll('.shop-cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  _shopFilter = cat;
  renderShopGrid();
}

function renderShopGrid(){
  const grid = document.getElementById('shopItemsGrid');
  const gridProfile = document.getElementById('shopItemsGridProfile');
  if(!grid && !gridProfile) return;
  const items = _shopFilter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i=>i.cat===_shopFilter);
  const CAT_LABEL = {marco:'🖼 Marco',badge:'🏅 Badge',efecto:'✨ Efecto',titulo:'📛 Título',postcolor:'🎨 Color de Post',banner:'🖼 Banner Animado',tema:'🎭 Tema de Perfil'};
  const _shopHTML = items.map(item => {
    const isEquipped = _equippedItems[item.cat] === item.id;
    const postPreview = item.cat==='postcolor' ? `<div class="${item.theme}" style="border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:.63rem;color:#ddd;line-height:1.5;text-align:left;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;"><div style="width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0;"></div><span style="font-weight:700;">ruizgustavo12</span></div><div>🎣 ¡Gran pesca hoy!</div></div>` : '';
    const bannerPreview = item.cat==='banner' ? `<div style="width:100%;height:60px;border-radius:8px;margin-bottom:8px;overflow:hidden;position:relative;background:${item.id==='banner_fuego'?'linear-gradient(180deg,#0a0000,#2d0800)':item.id==='banner_flores'?'linear-gradient(180deg,#0d0018,#2d0060)':item.id==='banner_ocean'?'linear-gradient(180deg,#00050f,#002050)':item.id==='banner_aurora'?'linear-gradient(180deg,#000508,#001a15)':item.id==='banner_galaxy'?'linear-gradient(180deg,#000005,#0a0020)':'linear-gradient(180deg,#050507,#101018)'};display:flex;align-items:center;justify-content:center;font-size:1.8rem;">${item.preview}</div>` : '';
    const temaPreview = item.cat==='tema' ? (()=>{
      const bgMap = {
        'tema_admin':    'linear-gradient(135deg,#1a0300,#2d0800)',
        'tema_aries':    'linear-gradient(135deg,#0d0000,#300008)',
        'tema_galaxy':   'linear-gradient(135deg,#020008,#0a0025)',
        'tema_neon':     'linear-gradient(135deg,#040008,#0a001e)',
        'tema_ocean':    'linear-gradient(135deg,#000510,#001a40)',
        'tema_gold':     'linear-gradient(135deg,#0a0800,#1a1200)',
        'tema_shadow':   'linear-gradient(135deg,#050005,#100010)',
        'tema_ice':      'linear-gradient(135deg,#000d14,#002030)',
        'tema_poseidon': 'linear-gradient(135deg,#000a14,#002244)',
        'tema_sirena':   'linear-gradient(135deg,#000814,#001e3c)',
        'tema_pulpo':    'linear-gradient(135deg,#050005,#120020)',
        'tema_ballena':  'linear-gradient(135deg,#000308,#001030)',
        'tema_pirana':   'linear-gradient(135deg,#0d0000,#250000)',
        'tema_catfish':  'linear-gradient(135deg,#080500,#1a1000)',
        'tema_kraken':   'linear-gradient(135deg,#020008,#080025)',
        'tema_tiburon':  'linear-gradient(135deg,#050810,#0d1428)',
        'tema_dragon':   'linear-gradient(135deg,#0d0200,#2d0800)',
        'tema_lobo':     'linear-gradient(135deg,#050508,#0f0f18)',
      };
      const ringMap = {
        'tema_admin':    'box-shadow:0 0 0 3px rgba(255,180,0,.9),0 0 12px rgba(255,80,0,.7);',
        'tema_aries':    'box-shadow:0 0 0 3px #ff1744,0 0 12px rgba(255,23,68,.7);',
        'tema_galaxy':   'box-shadow:0 0 0 3px #b388ff,0 0 12px rgba(179,136,255,.6);',
        'tema_neon':     'box-shadow:0 0 0 3px #e040fb,0 0 12px rgba(0,229,255,.6);',
        'tema_ocean':    'box-shadow:0 0 0 3px #00b4d8,0 0 12px rgba(0,180,216,.6);',
        'tema_gold':     'box-shadow:0 0 0 3px #ffd700,0 0 14px rgba(255,215,0,.7);',
        'tema_shadow':   'box-shadow:0 0 0 3px #9c27b0,0 0 12px rgba(156,39,176,.6);',
        'tema_ice':      'box-shadow:0 0 0 3px #80deea,0 0 12px rgba(128,222,234,.6);',
        'tema_poseidon': 'box-shadow:0 0 0 3px #00cfff,0 0 14px rgba(0,207,255,.8);',
        'tema_sirena':   'box-shadow:0 0 0 3px #e91e8c,0 0 12px rgba(233,30,140,.6);',
        'tema_pulpo':    'box-shadow:0 0 0 4px #e040fb,0 0 14px rgba(224,64,251,.8);',
        'tema_ballena':  'box-shadow:0 0 0 2px #0288d1,0 0 16px rgba(79,195,247,.5);',
        'tema_pirana':   'box-shadow:0 0 0 4px #f44336,0 0 14px rgba(244,67,54,.9);',
        'tema_catfish':  'box-shadow:0 0 0 3px #795548,0 0 12px rgba(121,85,72,.6);',
        'tema_kraken':   'box-shadow:0 0 0 4px #7c4dff,0 0 16px rgba(124,77,255,.8);',
        'tema_tiburon':  'box-shadow:0 0 0 3px #546e7a,0 0 12px rgba(84,110,122,.6);',
        'tema_dragon':   'box-shadow:0 0 0 4px #ff6f00,0 0 16px rgba(255,111,0,.9);',
        'tema_lobo':     'box-shadow:0 0 0 3px #9e9e9e,0 0 12px rgba(245,245,245,.4);',
      };
      const textMap = {
        'tema_admin':    'background:linear-gradient(90deg,#ff4500,#ffd700,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_aries':    'background:linear-gradient(90deg,#ff1744,#ff6b35);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_galaxy':   'background:linear-gradient(90deg,#b388ff,#00e5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_neon':     'background:linear-gradient(90deg,#e040fb,#00e5ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_ocean':    'background:linear-gradient(90deg,#00b4d8,#90e0ef);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_gold':     'background:linear-gradient(90deg,#ffd700,#fffde7,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_shadow':   'background:linear-gradient(90deg,#ce93d8,#9c27b0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_ice':      'background:linear-gradient(90deg,#e0f7fa,#80deea);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_poseidon': 'background:linear-gradient(90deg,#00cfff,#7fffff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_sirena':   'background:linear-gradient(90deg,#e91e8c,#00bcd4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_pulpo':    'background:linear-gradient(90deg,#e040fb,#7b1fa2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_ballena':  'background:linear-gradient(90deg,#0288d1,#4fc3f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_pirana':   'background:linear-gradient(90deg,#f44336,#ff8a80);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_catfish':  'background:linear-gradient(90deg,#795548,#d7ccc8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_kraken':   'background:linear-gradient(90deg,#7c4dff,#e040fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_tiburon':  'background:linear-gradient(90deg,#546e7a,#eceff1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_dragon':   'background:linear-gradient(90deg,#ff6f00,#ffca28);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
        'tema_lobo':     'background:linear-gradient(90deg,#9e9e9e,#f5f5f5);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;',
      };
      const bg = bgMap[item.id]||'linear-gradient(135deg,#111,#222)';
      const ring = ringMap[item.id]||'';
      const txt = textMap[item.id]||'color:#fff;';
      return `<div style="width:100%;height:70px;border-radius:10px;margin-bottom:8px;overflow:hidden;position:relative;background:${bg};display:flex;align-items:center;justify-content:center;gap:8px;padding:0 8px;">
        <div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0;${ring}"></div>
        <div style="font-size:.78rem;font-weight:800;font-family:'Exo 2',sans-serif;${txt}">${item.id==='tema_admin'?'ruizgustavo12':'ruizgustav…'}</div>
        ${item.id==='tema_admin'?'<span style="font-size:.8rem;filter:drop-shadow(0 0 4px gold);">👑</span>':''}
      </div>`;
    })() : '';
    return `
    <div class="shop-item${isEquipped?' equipped':''}${item.soloVerificado&&!window.CU?.verified?' shop-item-locked':''}" id="sitem_${item.id}">
      ${isEquipped ? '<div class="shop-item-equipped-badge">✓ ACTIVO</div>' : ''}
      ${item.exclusive ? '<div style="position:absolute;top:6px;left:6px;background:linear-gradient(135deg,gold,#ff8c00);color:#000;font-size:.5rem;font-weight:900;border-radius:100px;padding:2px 6px;">✦ EXCL.</div>' : ''}
      ${item.soloVerificado ? '<div style="position:absolute;top:6px;left:6px;background:linear-gradient(135deg,#00c6ff,#0072ff);color:#fff;font-size:.5rem;font-weight:900;border-radius:100px;padding:2px 6px;">✅ SOLO VERIFICADOS</div>' : ''}
      ${postPreview}
      ${bannerPreview}
      ${temaPreview}
      ${!item.theme && !item.bannerFn && !item.temaCSS ? `<span style="font-size:2.2rem;display:block;margin-bottom:6px;">${item.preview}</span>` : ''}
      <div class="shop-item-name">${item.name}</div>
      <div class="shop-item-type">${CAT_LABEL[item.cat]||item.cat}</div>
      <div style="font-size:.62rem;color:var(--muted);margin-bottom:8px;line-height:1.35;">${item.desc}</div>
      <div class="shop-item-price" style="text-decoration:line-through;color:var(--muted);font-size:.63rem;">🪙 ${item.price.toLocaleString()} coins</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin:3px 0 4px;">
        <span style="background:linear-gradient(135deg,#00c853,#00e676);color:#000;font-size:.65rem;font-weight:900;padding:2px 8px;border-radius:100px;">✦ GRATIS</span>
        <span style="font-size:.58rem;color:var(--muted);">30 días</span>
      </div>
      ${item.soloAdmin && !(window.CU?.nick==='ruizgustavo12'||window.CU?.role==='admin')
        ? `<button class="shop-item-btn" style="background:rgba(255,180,0,.1);border:1px solid rgba(255,180,0,.3);color:#ffd700;" onclick="toast('👑 Este tema es exclusivo para administradores','err')">👑 Solo Admins</button>`
        : item.soloVerificado && !window.CU?.verified
        ? `<button class="shop-item-btn" style="background:rgba(0,114,255,.12);border:1px solid rgba(0,114,255,.3);color:#0072ff;" onclick="toast('🔒 Este efecto es solo para usuarios verificados ✅','err')">🔒 Solo Verificados</button>`
        : `<button class="shop-item-btn ${isEquipped?'unequip':'equip'}" onclick="toggleEquipItem('${item.id}')">${isEquipped ? '✕ Desequipar' : '▶ Equipar'}</button>`
      }
    </div>`;
  }).join('');
  if(grid) grid.innerHTML = _shopHTML;
  if(gridProfile) gridProfile.innerHTML = _shopHTML;
}

async function toggleEquipItem(itemId){
  const item = SHOP_ITEMS.find(i=>i.id===itemId);
  if(!item) return;
  const alreadyEquipped = _equippedItems[item.cat] === itemId;

  if(alreadyEquipped){
    delete _equippedItems[item.cat];
    toast(`${item.emoji} "${item.name}" desequipado`, 'inf');
  } else {
    _equippedItems[item.cat] = itemId;
    toast(`${item.emoji} "${item.name}" ¡equipado!`, 'ok');
  }

  // Save to Firestore — usar updateDoc con deleteField() para borrar correctamente
  try {
    const firestoreUpdate = {};
    if(alreadyEquipped){
      // deleteField() borra el campo correctamente en Firestore (setDoc merge NO borra)
      firestoreUpdate[`shopEquipped.${item.cat}`] = deleteField();
    } else {
      firestoreUpdate[`shopEquipped.${item.cat}`] = itemId;
    }
    await updateDoc(doc(db,'users',window.CU.id), firestoreUpdate);
    window.CU.shopEquipped = { ..._equippedItems };
    // Sincronizar cache _usersShop con el estado actual
    if(window._usersShop) window._usersShop[window.CU.id] = { ..._equippedItems };
  } catch(e){ console.warn('shop save error',e); }

  renderShopGrid();
  applyShopEffects();
}



function applyShopEffects(){
  // ── MARCO en avatar ──
  const avWrap = document.querySelector('.profile-av-wrap');
  if(avWrap){
    avWrap.classList.remove('ring-gold','ring-fire','ring-ice','ring-fish','ring-legend',
      'ring-neon','ring-galaxy','ring-red','ring-rainbow','ring-platinum',
      'avfx-niebla','avfx-remolino','avfx-prisma','avfx-sombra','avfx-oro','avfx-glitch','avfx-cristal');
    const marco = _equippedItems.marco;
    if(marco){ const it=SHOP_ITEMS.find(i=>i.id===marco); if(it?.effect) avWrap.classList.add(it.effect); }
    // ── AVFX en foto de perfil ──
    const avfx = _equippedItems.avfx;
    if(avfx){ const it=SHOP_ITEMS.find(i=>i.id===avfx); if(it?.effect) avWrap.classList.add(it.effect); }
  }

  // ── TÍTULO bajo el nombre ──
  let titleEl = document.getElementById('shopTitleDisplay');
  const tituloId = _equippedItems.titulo;
  if(tituloId){
    const tItem = SHOP_ITEMS.find(i=>i.id===tituloId);
    if(tItem){
      if(!titleEl){
        titleEl = document.createElement('div');
        titleEl.id = 'shopTitleDisplay';
        const bioEl = document.getElementById('profBioEl');
        if(bioEl) bioEl.insertAdjacentElement('beforebegin', titleEl);
      }
      const isLegend = tituloId==='titulo_legend';
      titleEl.style.cssText=`font-size:.72rem;font-weight:800;letter-spacing:.08em;margin:3px 0 5px;text-align:center;${isLegend?'background:linear-gradient(135deg,gold,#ff8c00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:goldShimmer 2s ease-in-out infinite alternate;':'color:var(--muted);'}`;
      titleEl.textContent = `${tItem.emoji} ${tItem.name.toUpperCase()}`;
    }
  } else {
    if(titleEl) titleEl.remove();
  }

  // ── BADGE junto al nombre ──
  let badgeShopEl = document.getElementById('shopBadgeDisplay');
  const badgeId = _equippedItems.badge;
  if(badgeId){
    const bItem = SHOP_ITEMS.find(i=>i.id===badgeId);
    if(bItem){
      if(!badgeShopEl){
        badgeShopEl = document.createElement('span');
        badgeShopEl.id = 'shopBadgeDisplay';
        badgeShopEl.style.cssText='font-size:1.2rem;cursor:default;';
        const nameContainer = document.getElementById('profName')?.parentElement;
        if(nameContainer) nameContainer.appendChild(badgeShopEl);
      }
      badgeShopEl.textContent = bItem.preview;
      badgeShopEl.title = bItem.name;
    }
  } else {
    if(badgeShopEl) badgeShopEl.remove();
  }

  // ── EFECTOS de partículas ──
  _stopShopParticles();
  const efectoId = _equippedItems.efecto;
  if(efectoId) _startShopParticles(efectoId);

  // ── BANNER ANIMADO ──
  const bannerId = _equippedItems.banner;
  stopBannerAnim();
  if(bannerId){
    const bItem = SHOP_ITEMS.find(i=>i.id===bannerId);
    if(bItem?.bannerFn && typeof window[bItem.bannerFn]==='function'){
      // pequeño delay para que el DOM esté listo
      setTimeout(()=>startBannerAnim(bItem.bannerFn), 100);
    }
  }

  // ── TEMAS DE PERFIL ──
  const ALL_TEMA_CLASSES = [
    'tema-admin-fire-active','tema-aries-active','tema-galaxy-dark-active',
    'tema-neon-cyber-active','tema-ocean-abyss-active','tema-gold-pure-active',
    'tema-shadow-dark-active','tema-ice-glacier-active',
    'tema-poseidon-active','tema-sirena-active','tema-pulpo-active',
    'tema-ballena-active','tema-pirana-active','tema-catfish-active',
    'tema-kraken-active','tema-tiburon-active','tema-dragon-active','tema-lobo-active'
  ];
  const profPage = document.getElementById('page-profile');
  if(profPage){
    profPage.classList.remove(...ALL_TEMA_CLASSES);
    const temaId = _equippedItems.tema;
    if(temaId){
      const tItem = SHOP_ITEMS.find(i=>i.id===temaId);
      if(tItem?.temaCSS) profPage.classList.add(tItem.temaCSS+'-active');
    }
  }
}

function _stopShopParticles(){
  if(_shopParticleInterval){ clearInterval(_shopParticleInterval); _shopParticleInterval=null; }
  document.querySelectorAll('.shop-particle').forEach(p=>p.remove());
  // Detener dragones
  if(window._dragonAnimId){ cancelAnimationFrame(window._dragonAnimId); window._dragonAnimId=null; }
  const dc = document.getElementById('dragonCanvas');
  if(dc) dc.remove();
}

function _startDragonEffect(){
  const existing = document.getElementById('dragonCanvas');
  if(existing) existing.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'dragonCanvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);

  // Obtener posición del avatar del perfil
  const getAvatarCenter = () => {
    const av = document.querySelector('.profile-av-wrap img') || document.querySelector('.profile-av-wrap');
    if(av){
      const r = av.getBoundingClientRect();
      return { x: r.left + r.width/2, y: r.top + r.height/2, r: Math.max(r.width, r.height)/2 + 30 };
    }
    return { x: window.innerWidth/2, y: window.innerHeight/2 - 50, r: 80 };
  };

  const DRAGON_EMOJI = '🐉';
  const NUM_DRAGONS = 3;
  const dragons = Array.from({length: NUM_DRAGONS}, (_, i) => ({
    angle: (i / NUM_DRAGONS) * Math.PI * 2,
    speed: 0.008 + Math.random() * 0.004,
    orbitR: 90 + i * 18,
    size: 22 + i * 4,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.03 + Math.random() * 0.02,
    trail: []
  }));

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const center = getAvatarCenter();

    dragons.forEach(d => {
      d.angle += d.speed;
      d.wobble += d.wobbleSpeed;

      const x = center.x + Math.cos(d.angle) * (d.orbitR + Math.sin(d.wobble) * 10);
      const y = center.y + Math.sin(d.angle) * (d.orbitR * 0.45 + Math.sin(d.wobble) * 6);

      // Trazar trail de fuego
      d.trail.push({x, y, a: 1});
      if(d.trail.length > 12) d.trail.shift();
      d.trail.forEach((pt, i) => {
        const alpha = (i / d.trail.length) * 0.5;
        const size = (i / d.trail.length) * d.size * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${size}px serif`;
        ctx.fillText('🔥', pt.x - size/2, pt.y + size/2);
        ctx.restore();
      });

      // Dragón
      ctx.save();
      ctx.font = `${d.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Flip según dirección
      if(Math.cos(d.angle) < 0){
        ctx.scale(-1, 1);
        ctx.fillText(DRAGON_EMOJI, -x, y);
      } else {
        ctx.fillText(DRAGON_EMOJI, x, y);
      }
      ctx.restore();
    });

    window._dragonAnimId = requestAnimationFrame(draw);
  };
  draw();
}

function _startShopParticles(efectoId){
  if(efectoId === 'efecto_dragones'){
    _startDragonEffect();
    return;
  }
  const PARTICLES = {
    efecto_confetti:  ['🎊','🎉','🎈','✨','🎀'],
    efecto_stars:     ['⭐','💫','✨','🌟','⚡'],
    efecto_peces:     ['🐟','🐠','🐡','🎣','🦈'],
    efecto_nieve:     ['❄️','🌨','⛄','💎','🔵'],
    efecto_burbujas:  ['🫧','💧','🔵','⚪'],
    efecto_lightning: ['⚡','🌩','💥','🔱'],
    efecto_hojas:     ['🍂','🍁','🌿','🍃'],
    efecto_aurora:    ['🌈','💜','💙','🟣','✨'],
  };
  const emojis = PARTICLES[efectoId] || ['✨'];
  _shopParticleInterval = setInterval(()=>{
    const p = document.createElement('div');
    p.className = 'shop-particle';
    p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    p.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-30px;font-size:${14+Math.random()*14}px;pointer-events:none;z-index:9999;animation:shopParticleFall ${2+Math.random()*3}s linear forwards;opacity:.85;`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 5500);
  }, 700);
}

async function loadShopEquipped(){
  if(!window.CU?.id) return;
  try {
    const snap = await getDoc(doc(db,'users',window.CU.id));
    if(snap.exists()){
      const data = snap.data();
      // Usar shopEquipped de Firestore — si el campo no existe o es undefined, usar {}
      // Nunca usar valor local anterior para evitar que ítems desequipados reaparezcan
      _equippedItems = (data.shopEquipped !== undefined) ? data.shopEquipped : {};
      window.CU.shopEquipped = { ..._equippedItems };
      // Sincronizar cache global
      if(window._usersShop) window._usersShop[window.CU.id] = { ..._equippedItems };
    } else {
      _equippedItems = {};
      window.CU.shopEquipped = {};
      if(window._usersShop) window._usersShop[window.CU.id] = {};
    }
  } catch(e){
    console.warn('loadShopEquipped error', e);
    _equippedItems = {};
  }
  applyShopEffects();
}

// ===== PROFILE FRIENDS LIST =====
async function renderProfileFriendsList(userId) {
  const listEl = document.getElementById('ptFriendsList');
  const emptyEl = document.getElementById('ptFriendsEmpty');
  if(!listEl) return;
  // If viewing own profile
  const uid = userId || window.CU?.id;
  if(!uid) return;
  listEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted);">Cargando...</div>';
  try {
    const snap = await getDoc(doc(db,'users',uid));
    const userData = snap.exists() ? snap.data() : {};
    const friendIds = userData.friends || [];
    if(!friendIds.length){
      listEl.innerHTML = '';
      if(emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if(emptyEl) emptyEl.style.display = 'none';
    const friendSnaps = await Promise.all(friendIds.map(fid => getDoc(doc(db,'users',fid))));
    const myFriends = window.CU?.friends || [];
    listEl.innerHTML = friendSnaps.filter(s=>s.exists()).map(s => {
      const f = s.data();
      const fid = s.id;
      const isMe = window.CU?.id === fid;
      const alreadyFriend = myFriends.includes(fid);
      const lvl = getLevel(f.xp||0);
      const isOwnProfile = uid === window.CU?.id;
      const addBtn = (!isMe && !alreadyFriend)
        ? `<button onclick="sendFriendRequest('${fid}','${(f.nick||'').replace(/'/g,"\'")}','profile')" style="margin-top:6px;width:100%;padding:5px;background:var(--accent);border:none;border-radius:var(--rs);color:#000;font-size:.72rem;font-weight:700;cursor:pointer;">+ Agregar</button>`
        : (alreadyFriend && !isMe && isOwnProfile)
          ? `<button onclick="event.stopPropagation();removeFriend('${fid}','${(f.nick||'').replace(/'/g,"\'")}');this.closest('[data-fid]').remove();" data-rmv="${fid}" style="margin-top:6px;width:100%;padding:4px;background:transparent;border:1px solid rgba(248,81,73,.35);border-radius:var(--rs);color:var(--red);font-size:.68rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;transition:all .18s;" onmouseover="this.style.background='rgba(248,81,73,.12)'" onmouseout="this.style.background='transparent'">✕ Eliminar amigo</button>`
          : alreadyFriend && !isMe ? `<div style="margin-top:6px;font-size:.7rem;color:var(--green);text-align:center;font-weight:700;">✓ Amigos</div>` : '';
      return `<div data-fid="${fid}" onclick="openUserProfile('${fid}','${(f.nick||'').replace(/'/g,"\'")}');event.stopPropagation();" style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:12px;text-align:center;cursor:pointer;transition:border-color .2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--bg4);border:2px solid var(--accent);margin:0 auto 8px;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;">
          ${`<img src="${f.av||getDefaultAv(f.gender||'')}" style="width:100%;height:100%;object-fit:cover;">`}
        </div>
        <div style="font-size:.8rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(f.nick||'?')}</div>
        <div style="display:inline-block;font-size:.6rem;font-weight:700;padding:1px 7px;border-radius:100px;border:1px solid;color:${lvl.color};border-color:${lvl.border};background:${lvl.border.replace(/[\d.]+\)$/,'.1)')};margin-top:3px;">${lvl.name}</div>
        ${addBtn}
      </div>`;
    }).join('');
  } catch(e) {
    listEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--muted);">Error cargando amigos</div>';
  }
}

// ===== CONTACTS =====
// ===== NOTIFICATIONS =====
let _notifs = [];
async function addNotif(text){
  if(!window.CU) return;
  const notif = {text, time:Date.now(), read:false};
  _notifs.unshift(notif);
  // Usar arrayUnion para NO sobreescribir notifs que llegaron de otros usuarios
  try { await updateDoc(doc(db,'users',window.CU.id), {notifs: arrayUnion(notif)}); }
  catch(e){ console.error('addNotif',e); }
  renderNotifs(); updateNotifBadge();
  // NO reproducir sonido en notifs propias (acciones del propio usuario)
}

// ── AUDIO GLOBAL — se desbloquea en el primer click del usuario ──
let _sharedACtx = null;
let _audioUnlocked = false; // solo crear AudioContext tras gesto del usuario

async function _ensureAudio(){
  // No crear AudioContext hasta que el usuario haya interactuado con la página
  if(!_audioUnlocked) return false;
  if(!_sharedACtx || _sharedACtx.state==='closed'){
    try{ _sharedACtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return false; }
  }
  if(_sharedACtx.state==='suspended'){
    try{ await _sharedACtx.resume(); }catch(e){ return false; }
  }
  return _sharedACtx.state==='running';
}
// Desbloquear audio solo tras gesto real del usuario
['click','keydown','touchstart'].forEach(ev=>{
  document.addEventListener(ev, ()=>{
    _audioUnlocked = true;
    _ensureAudio();
  }, {passive:true});
});

async function playNotifSound(){
  try{
    const ok = await _ensureAudio(); if(!ok) return;
    const ctx = _sharedACtx;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.setValueAtTime(880, ctx.currentTime+0.08);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.3);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.3);
  }catch(e){}
}

async function playMsgSound(){
  try{
    const ok = await _ensureAudio(); if(!ok) return;
    const ctx = _sharedACtx;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type='sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1100, ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.28, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.35);
    o.start(ctx.currentTime); o.stop(ctx.currentTime+0.35);
  }catch(e){}
}
let _notifTab = 'all';
function switchNotifTab(tab){
  _notifTab = tab;
  const all = document.getElementById('ntab-all');
  const unread = document.getElementById('ntab-unread');
  if(all){ all.style.background = tab==='all'?'var(--accent)':'transparent'; all.style.color = tab==='all'?'#000':'var(--muted)'; }
  if(unread){ unread.style.background = tab==='unread'?'var(--accent)':'transparent'; unread.style.color = tab==='unread'?'#000':'var(--muted)'; }
  renderNotifs();
}
async function markAllNotifsRead(){
  if(!window.CU||!_notifs.length) return;
  // Leer array fresco de Firestore, marcar todo como leído sin pisar notifs nuevas
  try {
    const snap = await getDoc(doc(db,'users',window.CU.id));
    const fresh = snap.exists() ? (snap.data().notifs||[]) : _notifs;
    const updated = fresh.map(n=>({...n, read:true}));
    _notifs = updated;
    await updateDoc(doc(db,'users',window.CU.id),{notifs: updated.slice(0,50)});
  } catch(e){
    _notifs.forEach(n=>n.read=true);
  }
  renderNotifs(); updateNotifBadge();
}

function _notifIcon(n){
  // Retorna {emoji, bg, icon} para el badge sobre el avatar
  if(n.type==='friendRequest') return {bg:'#1877f2', icon:'👥'};
  const t = n.text||'';
  if(t.includes('cumpleaños')||t.includes('🎂')) return {bg:'#e91e63', icon:'🎂'};
  if(t.includes('reaccionó')||t.includes('❤️')||t.includes('😍')) return {bg:'#f02849', icon:'❤️'};
  if(t.includes('comentó')||t.includes('💬')) return {bg:'#1877f2', icon:'💬'};
  if(t.includes('compartió')||t.includes('🔁')) return {bg:'#1877f2', icon:'🔁'};
  if(t.includes('etiquetó')||t.includes('🏷')) return {bg:'#1877f2', icon:'🏷️'};
  if(t.includes('amigo')||t.includes('solicitud')||t.includes('aceptó')) return {bg:'#1877f2', icon:'👥'};
  if(t.includes('spot')||t.includes('📍')) return {bg:'#43a047', icon:'📍'};
  if(t.includes('trofeo')||t.includes('🏆')) return {bg:'#f9a825', icon:'🏆'};
  if(t.includes('verificad')||t.includes('✅')) return {bg:'#ffd700', icon:'✅'};
  if(t.includes('historia')||t.includes('📖')) return {bg:'#9c27b0', icon:'📖'};
  if(t.includes('felicitó')||t.includes('🎉')) return {bg:'#e91e63', icon:'🎉'};
  return {bg:'#1877f2', icon:'🔔'};
}

function renderNotifs(){
  const el = document.getElementById('notifList');
  if(!el) return;
  // Excluir notificaciones de mensajes 💬 — esas van al ícono de chat, no a la campana
  const noMsg = _notifs.filter(n=>!(n.text&&n.text.startsWith('💬')));
  // Ordenar por tiempo DESC (más nuevas primero)
  noMsg.sort((a,b)=>(b.time||0)-(a.time||0));
  const list = _notifTab==='unread' ? noMsg.filter(n=>!n.read) : noMsg;
  if(!list.length){
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--muted);">
      <div style="font-size:2.5rem;margin-bottom:10px;">${_notifTab==='unread'?'✓':'🔔'}</div>
      <div style="font-size:.85rem;">${_notifTab==='unread'?'Todo al día, sin notificaciones sin leer':'Sin notificaciones aún'}</div>
    </div>`;
    el.onclick = null;
    return;
  }

  // Agrupar por hoy / anteriores
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();
  const todayItems = list.filter(n=>(n.time||0)>=todayTs);
  const prevItems  = list.filter(n=>(n.time||0)<todayTs);

  function renderItem(n, i){
    const isRead = !!n.read;
    const {bg, icon} = _notifIcon(n);
    const unreadBg = isRead ? '' : 'rgba(0,198,255,.05)';
    const rowBg = isRead ? '' : 'background:rgba(0,198,255,.05);';

    // Avatar del que generó la notif
    const fromAv = n.fromAv || n.visitorAv || '';
    const avInner = `<img src="${fromAv||getDefaultAv()}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`;

    if(n.type==='friendRequest'){
      const safeNick = (n.fromNick||'').replace(/['"<>&]/g,'');
      return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;transition:background .15s;${rowBg}cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04);"
        onmouseover="this.style.background='var(--bg3)'"
        onmouseout="this.style.background='${unreadBg}'">
        <div style="position:relative;flex-shrink:0;">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--bg3);overflow:hidden;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${avInner}</div>
          <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:.65rem;border:2px solid var(--bg2);">${icon}</div>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.84rem;line-height:1.4;margin-bottom:6px;color:var(--text);"><strong>${esc(n.fromNick||'')}</strong> <span style="color:var(--muted);">quiere ser tu amigo/a</span></div>
          <div style="font-size:.7rem;color:var(--accent);margin-bottom:10px;">${fmtT(n.time)}</div>
          <div style="display:flex;gap:8px;">
            <button data-action="accept-friend" data-idx="${i}" data-uid="${n.fromId||''}" data-nick="${safeNick}"
              style="flex:1;padding:8px;background:var(--accent);border:none;color:#000;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;">Confirmar</button>
            <button data-action="reject-friend" data-idx="${i}"
              style="flex:1;padding:8px;background:var(--bg4);border:1px solid var(--border);color:var(--text);border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:'Exo 2',sans-serif;">Eliminar</button>
          </div>
        </div>
        ${!isRead?`<div style="width:8px;height:8px;background:var(--accent);border-radius:50%;flex-shrink:0;margin-top:6px;"></div>`:''}
      </div>`;
    }

    // Notif normal
    const postId = n.postId||'';
    const bdayUid = n.bdayUid||'';
    const storyId = n.storyId||'';
    const clickable = !!(postId || bdayUid || storyId);

    // Vista previa del contenido al que se reaccionó/comentó
    const hasPostPreview = !!(n.postImg || n.postPreviewText) && postId;
    const isReactionNotif = (n.text||'').includes('reaccionó') || (n.text||'').match(/^[👍❤️😂😮😢🔥]/u);

    // Separar el texto en partes: actor + acción (para resaltar el nick)
    let notifTextHtml = '';
    const rawText = n.text||'';
    const nickMatch = rawText.match(/^([^\s]+(?:\s[^\s]+)?)?\s*(.*)/);
    // Intenta extraer emoji + nick del inicio
    const emojiNickMatch = rawText.match(/^([\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F\u20E3\u200D]+)?\s*([\w.\-_À-ÿ]+)\s+(.+)$/u);
    if(emojiNickMatch){
      const [, emo, nick, rest] = emojiNickMatch;
      notifTextHtml = `${emo||''} <strong style="color:var(--text)">${esc(nick)}</strong> <span style="color:var(--muted)">${esc(rest)}</span>`;
    } else {
      notifTextHtml = rawText;
    }

    // Tarjeta de preview del post
    let previewCard = '';
    if(hasPostPreview){
      if(n.postImg){
        previewCard = `<div style="margin-top:8px;display:flex;align-items:stretch;border-radius:10px;overflow:hidden;border:1px solid rgba(46,196,182,.25);background:var(--bg3);">
          <img src="${n.postImg}" style="width:64px;height:64px;object-fit:cover;flex-shrink:0;display:block;" onerror="this.parentElement.style.display='none'">
          ${n.postPreviewText ? `<div style="padding:8px 10px;font-size:.75rem;color:var(--muted);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(n.postPreviewText)}</div>` : '<div style="padding:8px 10px;font-size:.72rem;color:var(--muted);font-style:italic;">Ver publicación</div>'}
        </div>`;
      } else if(n.postPreviewText){
        previewCard = `<div style="margin-top:8px;border-radius:10px;border-left:3px solid ${bg};background:var(--bg3);padding:8px 12px;font-size:.76rem;color:var(--muted);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(n.postPreviewText)}</div>`;
      }
    } else if(storyId){
      previewCard = `<div style="margin-top:8px;border-radius:10px;overflow:hidden;border:1px solid rgba(46,196,182,.25);background:rgba(46,196,182,.06);">
        ${n.storyImg ? `<img src="${n.storyImg}" style="width:100%;max-height:72px;object-fit:cover;display:block;">` : '<div style="width:100%;height:36px;background:linear-gradient(135deg,#0a2a4a,#0077b6);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🎣</div>'}
        <div style="padding:4px 8px;font-size:.65rem;color:var(--accent);font-weight:700;">📖 Ver historia →</div>
      </div>`;
    }

    return `<div data-action="notif-click" data-postid="${postId}" data-bdayuid="${bdayUid}" data-bdaynick="${n.bdayNick||''}" data-storyid="${storyId}"
      style="display:flex;align-items:flex-start;gap:10px;padding:12px 14px;transition:background .15s;${rowBg}cursor:${clickable?'pointer':'default'};border-bottom:1px solid rgba(255,255,255,.04);position:relative;"
      onmouseover="this.style.background='var(--bg3)';this.querySelector('.notif-del-btn')&&(this.querySelector('.notif-del-btn').style.opacity='1')"
      onmouseout="this.style.background='${unreadBg}';this.querySelector('.notif-del-btn')&&(this.querySelector('.notif-del-btn').style.opacity='0')">
      ${!isRead ? `<div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${bg};border-radius:0 2px 2px 0;"></div>` : ''}
      <div style="position:relative;flex-shrink:0;">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--bg3);overflow:hidden;border:2px solid ${isRead?'var(--border)':bg};display:flex;align-items:center;justify-content:center;font-size:1.1rem;">${avInner}</div>
        <div style="position:absolute;bottom:-2px;right:-2px;width:20px;height:20px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:.72rem;border:2px solid var(--bg2);box-shadow:0 1px 4px rgba(0,0,0,.4);">${icon}</div>
      </div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:.83rem;line-height:1.45;color:var(--text);word-break:break-word;">${notifTextHtml}</div>
        ${previewCard}
        <div style="font-size:.7rem;color:${isRead?'var(--muted)':bg};margin-top:5px;font-weight:${isRead?'400':'600'};">${fmtT(n.time)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;margin-left:2px;">
        ${!isRead?`<div style="width:8px;height:8px;background:${bg};border-radius:50%;box-shadow:0 0 6px ${bg}88;flex-shrink:0;"></div>`:'<div style="width:8px;"></div>'}
        <button data-action="delete-notif" data-idx="${i}" onclick="event.stopPropagation()" class="notif-del-btn"
          style="opacity:0;transition:opacity .2s;background:none;border:none;color:var(--muted);font-size:.85rem;cursor:pointer;padding:4px;border-radius:50%;line-height:1;width:24px;height:24px;display:flex;align-items:center;justify-content:center;"
          onmouseover="this.style.color='var(--red)';this.style.background='var(--bg4)'"
          onmouseout="this.style.color='var(--muted)';this.style.background='none'">✕</button>
      </div>
    </div>`;
  }

  let html = '';
  if(todayItems.length){
    html += `<div style="padding:10px 14px 5px;font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Hoy</div>`;
    html += todayItems.map((n,i)=>renderItem(n,i)).join('');
  }
  if(prevItems.length){
    if(todayItems.length) html += `<div style="height:1px;background:var(--border);margin:4px 0;"></div>`;
    html += `<div style="padding:10px 14px 5px;font-size:.72rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;">Anteriores</div>`;
    html += prevItems.map((n,i)=>renderItem(n, todayItems.length+i)).join('');
  }
  el.innerHTML = html;

  el.onclick = async (e)=>{
    const row = e.target.closest('[data-action]');
    if(!row) return;
    const action = row.dataset.action;
    if(action==='notif-click'){
      if(row.dataset.storyid){ closeNotifDropdown(); openStoryById(row.dataset.storyid); }
      else if(row.dataset.postid){ closeNotifDropdown(); scrollToPost(row.dataset.postid); }
      else if(row.dataset.bdayuid){ closeNotifDropdown(); openUserProfile(row.dataset.bdayuid, row.dataset.bdaynick); }
    } else if(action==='view-profile'){
      closeNotifDropdown(); openUserProfile(row.dataset.uid, row.dataset.nick);
    } else if(action==='accept-friend'){
      row.disabled=true; row.textContent='Aceptando...';
      await acceptFriendRequest(row.dataset.uid, row.dataset.nick, parseInt(row.dataset.idx));
    } else if(action==='reject-friend'){
      await rejectFriendRequest(parseInt(row.dataset.idx));
    } else if(action==='delete-notif'){
      const idx = parseInt(row.dataset.idx);
      const noMsg = _notifs.filter(n=>!(n.text&&n.text.startsWith('💬')));
      noMsg.sort((a,b)=>(b.time||0)-(a.time||0));
      const notifToRemove = noMsg[idx];
      if(notifToRemove){
        // Borrar del array local
        const globalIdx = _notifs.indexOf(notifToRemove);
        if(globalIdx > -1) _notifs.splice(globalIdx, 1);
        // Borrar de Firestore con arrayRemove (no sobreescribe otras notifs)
        if(window.CU){
          updateDoc(doc(db,'users',window.CU.id), {notifs: arrayRemove(notifToRemove)}).catch(()=>{});
        }
        renderNotifs();
        updateNotifBadge();
      }
    }
  };
}

function updateNotifBadge(){
  // Campana: solo likes, comentarios, amigos, reacciones, trofeos, etc — NO mensajes 💬
  const unread = _notifs.filter(n=>{
    if(n.read) return false;
    const t = n.text||'';
    if(t.startsWith('💬')) return false; // mensajes van al badge de chat
    return true;
  }).length;
  const el = document.getElementById('notifDot');
  if(!el) return;
  if(unread > 0){
    el.style.display='flex';
    el.textContent = unread > 10 ? '+10' : String(unread);
  } else {
    el.style.display='none';
  }
  // Badge de mensajes también se actualiza acá para sincronizar
  updateMsgBadge();
}
function updateMsgBadge(){
  const el = document.getElementById('msgBadge');
  if(!el) return;
  const archived = window.CU?.archivedChats || [];
  const deleted  = window.CU?.deletedChats  || [];

  // Contar chats con mensajes no leídos (de los listeners en tiempo real)
  const unread = Object.entries(_chatLastMsgs).filter(([uid, lm])=>{
    if(archived.includes(uid)) return false;
    if(deleted.includes(uid))  return false;
    return !!lm.unread;
  }).length;

  // Contar mensajes individuales no leídos (suma de unreadCount por chat)
  const totalMsgs = Object.entries(_chatLastMsgs).filter(([uid])=>!archived.includes(uid)&&!deleted.includes(uid))
    .reduce((acc,[,lm])=> acc + (lm.unreadCount||0), 0);
  const displayCount = totalMsgs > 0 ? totalMsgs : unread;
  if(displayCount > 0){
    el.style.display='flex';
    el.textContent = displayCount > 99 ? '99+' : String(displayCount);
  } else {
    el.style.display='none';
  }
}

let _notifUnsub = null;
let _notifFirstLoad = true; // Ignorar el primer snapshot (carga inicial)
function listenNotifs(){
  if(!window.CU) return;
  if(_notifUnsub){ _notifUnsub(); _notifUnsub=null; }
  _notifFirstLoad = true;
  _notifUnsub = onSnapshot(doc(db,'users',window.CU.id), snap=>{
    if(!snap.exists()) return;
    const d = snap.data();
    if(window.CU){
      window.CU.archivedChats = d.archivedChats || [];
      window.CU.deletedChats  = d.deletedChats  || [];
      if(d.friendsList) window.CU.friendsList = d.friendsList;
    }
    const newNotifs = d.notifs || [];

    if(_notifFirstLoad){
      // Primera carga: solo cargar las notifs, NO tocar ni sonido ni toast
      _notifFirstLoad = false;
      _notifs = newNotifs;
      renderNotifs(); updateNotifBadge(); updateMsgBadge();
      return;
    }

    // Detección 100% confiable por clave única
    const knownKeys = new Set(
      _notifs.map(n => `${n.time||0}_${n.fromNick||''}_${(n.text||'').slice(0,30)}`)
    );
    const brandNew = newNotifs.filter(n =>
      !knownKeys.has(`${n.time||0}_${n.fromNick||''}_${(n.text||'').slice(0,30)}`)
    );

    _notifs = newNotifs;

    if(brandNew.length > 0){
      const newMsgs    = brandNew.filter(n =>  n.text?.startsWith('💬'));
      const newNonMsgs = brandNew.filter(n => !n.text?.startsWith('💬'));
      if(newMsgs.length > 0){
        // Actualizar _chatLastMsgs INMEDIATAMENTE para que el messenger muestre el badge
        // sin esperar al próximo poll de 8s
        newMsgs.forEach(n => {
          const fromUid = n.fromUid || null;
          const fromNick = n.fromNick || '';
          // Buscar el uid del remitente en friendsList por nick si no viene fromUid
          const senderFriend = (window.CU?.friendsList||[]).find(f =>
            (fromUid && f.id === fromUid) || f.nick === fromNick
          );
          const senderUid = fromUid || senderFriend?.id;
          if(senderUid){
            const existing = _chatLastMsgs[senderUid] || {};
            // Extraer texto del mensaje de la notif (formato: "💬 nick: texto")
            const colonIdx = n.text.indexOf(': ');
            const msgPreview = colonIdx > -1 ? n.text.slice(colonIdx + 2) : n.text;
            _chatLastMsgs[senderUid] = {
              ...existing,
              text: msgPreview,
              time: n.time || Date.now(),
              mine: false,
              unread: true,
              unreadCount: (existing.unreadCount || 0) + 1,
              fromNick: n.fromNick || existing.fromNick || '',
              fromAv: n.fromAv || existing.fromAv || '',
              nick: n.fromNick || existing.nick || ''
            };
          }
        });
        updateMsgBadge();
        // Re-render messenger list si está abierto para mostrar el contacto destacado
        if(_messengerOpen){
          const _ml = document.getElementById('messengerList');
          if(_ml && _ml.style.display !== 'none') _ml.innerHTML = _buildMessengerHTML();
        }
        const latest = newMsgs.sort((a,b)=>(b.time||0)-(a.time||0))[0];
        playMsgSound();
        showNotifToast(latest.text||'Nuevo mensaje');
      }
      if(newNonMsgs.length > 0){
        const latest = newNonMsgs.sort((a,b)=>(b.time||0)-(a.time||0))[0];
        playNotifSound();
        showNotifToast(latest.text||'Nueva notificación');
      }
    }
    renderNotifs(); updateNotifBadge(); updateMsgBadge();
    if(_messengerOpen){
      const _ln_list = document.getElementById('messengerList');
      if(_ln_list && _ln_list.style.display !== 'none'){
        _ln_list.innerHTML = _buildMessengerHTML();
      }
    }
  }, err=>{ console.warn('[listenNotifs] error:', err); });

  // Listener en tiempo real para badge de mensajes
  listenUnreadMsgsBadge();
}

// Badge de mensajes — polling cada 30s en vez de onSnapshot por cada amigo
// (N onSnapshots = N conexiones permanentes → barra de carga constante)
let _unsubMsgBadgeListeners = [];
let _msgBadgePollInterval = null;

function listenUnreadMsgsBadge(){
  // Cancelar listeners anteriores
  _unsubMsgBadgeListeners.forEach(u=>{ if(typeof u==='function') u(); });
  _unsubMsgBadgeListeners = [];
  if(_msgBadgePollInterval){ clearInterval(_msgBadgePollInterval); _msgBadgePollInterval=null; }

  // Correr inmediatamente y luego cada 8 segundos para badge más responsivo
  _pollMsgBadge();
  _msgBadgePollInterval = setInterval(_pollMsgBadge, 8000);
}

async function _pollMsgBadge(){
  const friends = window.CU?.friendsList || [];
  const myId = window.CU?.id;
  if(!myId || !friends.length) return;

  let totalUnread = 0;
  // Revisar todos los amigos para no perder mensajes sin leer
  const toCheck = friends;
  await Promise.all(toCheck.map(async f=>{
    try{
      const chatId = [myId, f.id].sort().join('_');
      const q = query(collection(db,'chats',chatId,'messages'), orderBy('time','desc'), limit(20));
      const snap = await getDocs(q);
      const unreadCount = snap.docs.filter(d=>{
        const m = d.data();
        return m.uid !== myId && !m.read && !(m.deletedFor||{})[myId];
      }).length;
      const visibleDoc = snap.docs.find(d=>!(d.data().deletedFor||{})[myId]);
      const lm = _chatLastMsgs[f.id] || {};
      if(visibleDoc){
        const md = visibleDoc.data();
        _chatLastMsgs[f.id] = {
          ...lm,
          text: md.sharedPostId ? '📤 Publicación compartida' : md.gif ? '🖼️ GIF' : md.audioUrl ? '🎤 Audio' : (md.text||''),
          time: md.time?.toMillis?.()||0,
          mine: md.uid === myId,
          unread: unreadCount > 0,
          unreadCount
        };
      } else {
        _chatLastMsgs[f.id] = {...lm, unread:false, unreadCount:0};
      }
      if(unreadCount > 0) totalUnread += unreadCount;
    }catch(e){}
  }));
  updateMsgBadge();
}

