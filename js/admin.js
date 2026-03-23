// ===== ADMIN =====
// ===== ADMIN TAB SWITCHER =====
function swAdminTab(el, tabId){
  document.querySelectorAll('.adm-tab').forEach(t=>t.classList.remove('adm-on'));
  el.classList.add('adm-on');
  ['admt-reports','admt-posts','admt-users','admt-verif','admt-site','admt-parches','admt-torneos','admt-grupos','admt-ads','admt-live','admt-pezdelsemana','admt-xplevels','admt-insignias','admt-soporte','admt-faq']
    .forEach(id=>{ const e=document.getElementById(id); if(e) e.style.display='none'; });
  const tab = document.getElementById(tabId);
  if(tab) tab.style.display='block';
  if(tabId==='admt-parches') loadAdminPatches();
  if(tabId==='admt-torneos') loadAdminTorneos();
  if(tabId==='admt-grupos') loadAdminGrupos();
  if(tabId==='admt-users') loadAdminUsers();
  if(tabId==='admt-verif') loadVerifRequests();
  if(tabId==='admt-site') loadSiteConfig();
  if(tabId==='admt-ads') loadAdminAds();
  if(tabId==='admt-live') loadAdminLive();
  if(tabId==='admt-soporte') loadSoporteTickets();
  if(tabId==='admt-faq') loadAdminFaq();
}

async function loadAdminData(){
  if(!window.CU || (window.CU.nick !== 'ruizgustavo12' && window.CU.email !== 'synxyes@gmail.com')) return;

  // config/stats: leer contadores desde 1 documento en vez de colecciones completas
  try{
    const statsSnap = await getDoc(doc(db,'config','stats'));
    if(statsSnap.exists()){
      const st = statsSnap.data();
      if(document.getElementById('adminStatPosts')) document.getElementById('adminStatPosts').textContent = st.totalPosts||'—';
      if(document.getElementById('adminStatUsers')) document.getElementById('adminStatUsers').textContent = st.totalUsers||'—';
      if(document.getElementById('adminStatGroups')) document.getElementById('adminStatGroups').textContent = st.totalGroups||'—';
    }
  }catch(e){}

  // Reports y posts siguen leyendose para mostrar la lista (necesario)
  const [postsSnap, reportsSnap, storiesSnap] = await Promise.all([
    getDocs(query(collection(db,'posts'), orderBy('time','desc'), limit(100))),
    getDocs(query(collection(db,'reports'), limit(200))),
    getDocs(query(collection(db,'stories'), limit(50))),
  ]);
  if(document.getElementById('adminStatReports')) document.getElementById('adminStatReports').textContent = reportsSnap.size;
  if(document.getElementById('adminStatStories')) document.getElementById('adminStatStories').textContent = storiesSnap.size;

  const posts = postsSnap.docs.map(d=>({id:d.id,...d.data()}));
  const reports = reportsSnap.docs.map(d=>({id:d.id,...d.data(),time:d.data().time?.toMillis?.()||Date.now()}));
  reports.sort((a,b)=>b.time-a.time);

  document.getElementById('adminReportsList').innerHTML = reports.length ? reports.map(r=>{
    const rPost = posts.find(p=>p.id===r.postId);
    const postPreview = rPost ? `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--rs);padding:10px;margin-top:8px;display:flex;gap:10px;align-items:flex-start;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--bg4);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0;">${(rPost.userNick||'?')[0]}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.78rem;font-weight:700;margin-bottom:3px;">${esc(rPost.userNick||'')} <span style="color:var(--muted);font-weight:400;">${fmtT(rPost.time?.toMillis?.()|| Date.now())}</span></div>
          ${rPost.text?`<div style="font-size:.78rem;color:var(--muted);margin-bottom:4px;">${esc(rPost.text.slice(0,120))}</div>`:''}
          ${rPost.images&&rPost.images[0]?`<img src="${rPost.images[0]}" style="max-width:100%;max-height:120px;border-radius:6px;object-fit:cover;" loading="lazy">`:''}
          ${rPost.fish?`<div style="font-size:.72rem;color:var(--accent);margin-top:3px;">🎣 ${rPost.fish}${rPost.weight?' · '+fmtKg(rPost.weight):''}</div>`:''}
        </div>
      </div>` : `<div style="font-size:.75rem;color:var(--muted);margin-top:6px;padding:8px;background:var(--bg3);border-radius:var(--rs);">Post no encontrado (puede haber sido eliminado)</div>`;
    return `<div style="padding:14px;border-bottom:1px solid var(--border);">
      <div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;margin-bottom:6px;">
        <span style="background:rgba(255,68,68,.1);color:var(--red);padding:2px 8px;border-radius:100px;font-size:.72rem;font-weight:700;">${r.reason}</span>
        <span style="font-size:.72rem;color:var(--muted);">${fmtT(r.time)}</span>
        <span style="background:${r.status==='pendiente'?'rgba(255,170,0,.1)':'rgba(0,230,118,.1)'};color:${r.status==='pendiente'?'var(--warn)':'var(--green)'};padding:2px 8px;border-radius:100px;font-size:.68rem;font-weight:700;">${r.status}</span>
      </div>
      <div style="font-size:.83rem;">Reportado por: <strong>${r.reportedBy}</strong> · Usuario: <strong>${r.reportedUser}</strong></div>
      ${r.desc?`<div style="font-size:.78rem;margin-top:4px;background:var(--bg3);padding:6px 10px;border-radius:6px;">"${r.desc}"</div>`:''}
      ${postPreview}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        ${rPost?`<button onclick="deleteAdminPost('${r.postId}','${r.id}')" style="background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.3);color:var(--red);padding:5px 12px;border-radius:var(--rs);font-size:.75rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;">🗑 Borrar post</button>`:''}
        <button onclick="resolveReport('${r.id}')" style="background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.3);color:var(--green);padding:5px 12px;border-radius:var(--rs);font-size:.75rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;">✓ Resolver</button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:30px;color:var(--muted);">✅ Sin reportes pendientes</div>';

  const sortedPosts = posts.sort((a,b)=>(b.time?.toMillis?.()||0)-(a.time?.toMillis?.()||0));
  document.getElementById('adminPostsList').innerHTML = sortedPosts.length ? sortedPosts.map(p=>`
    <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:center;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:.85rem;font-weight:700;">${esc(p.userNick||'')} <span style="color:var(--muted);font-weight:400;font-size:.75rem;">${fmtT(p.time?.toMillis?.()|| Date.now())}</span></div>
        <div style="font-size:.78rem;color:var(--muted);margin-top:2px;">${(p.text||'Sin texto').slice(0,80)}</div>
        ${p.images&&p.images[0]?`<img src="${p.images[0]}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;margin-top:4px;" loading="lazy">`:''}
      </div>
      <button onclick="deleteAdminPost('${p.id}',null)" style="background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.3);color:var(--red);padding:5px 10px;border-radius:var(--rs);font-size:.72rem;cursor:pointer;font-family:\'Exo 2\',sans-serif;flex-shrink:0;">🗑</button>
    </div>`).join('') : '<div style="text-align:center;padding:30px;color:var(--muted);">Sin publicaciones</div>';
}

async function loadAdminUsers(){
  const el = document.getElementById('adminUsersList');
  el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);">⏳ Cargando...</div>';
  const snap = await getDocs(query(collection(db,'users'), limit(300)));
  const users = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.nick||'').localeCompare(b.nick||''));
  el.innerHTML = users.length ? `
    <div style="display:flex;gap:8px;padding:8px 0 12px;align-items:center;">
      <input id="adminUserSearch" oninput="filterAdminUsers()" placeholder="🔍 Buscar por nick o email..." style="flex:1;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:var(--rs);padding:7px 12px;font-family:'Exo 2',sans-serif;font-size:.82rem;outline:none;">
      <span style="font-size:.72rem;color:var(--muted);">${users.length} usuarios</span>
    </div>
    <div id="adminUsersTable">
    ${users.map(u=>`
    <div class="adm-user-row" data-nick="${esc((u.nick||'').toLowerCase())}" data-email="${esc((u.email||'').toLowerCase())}" style="padding:10px 8px;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:center;transition:background .15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0;overflow:hidden;">
        <img src="${u.av||getDefaultAv(u.gender||'')}" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:.85rem;font-weight:700;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
          ${esc(u.nick||'?')}
          ${u.nick==='ruizgustavo12'?'<span style="font-size:.6rem;background:rgba(255,68,68,.1);color:var(--red);padding:1px 6px;border-radius:100px;">ADMIN</span>':''}
          
          ${getCountryFlag(u.country)?`<span style="font-size:.8rem;">${getCountryFlag(u.country)}</span>`:''}
        </div>
        <div style="font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.email||'')}${u.country?' · '+esc(u.country):''}</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0;">
        ${!u.verified?`<button onclick="adminApproveVerif('${u.id}','${(u.nick||'').replace(/'/g,"\\'")}','${u.id}')" title="Verificar" style="background:rgba(255,215,0,.07);border:1px solid rgba(255,215,0,.25);color:gold;padding:5px 8px;border-radius:var(--rs);font-size:.72rem;cursor:pointer;font-family:'Exo 2',sans-serif;">✅</button>`:''}
        <button onclick="adminEditUser('${u.id}')" title="Editar usuario" style="background:rgba(46,196,182,.08);border:1px solid rgba(46,196,182,.3);color:var(--accent);padding:5px 10px;border-radius:var(--rs);font-size:.72rem;cursor:pointer;font-family:'Exo 2',sans-serif;font-weight:700;">✏️ Editar</button>
        <button onclick="adminDeleteUser('${u.id}','${esc(u.nick||'?')}')" title="Eliminar usuario" style="background:rgba(255,68,68,.07);border:1px solid rgba(255,68,68,.25);color:var(--red);padding:5px 10px;border-radius:var(--rs);font-size:.72rem;cursor:pointer;font-family:'Exo 2',sans-serif;font-weight:700;">🗑️ Eliminar</button>
      </div>
    </div>`).join('')}
    </div>` : '<div style="text-align:center;padding:30px;color:var(--muted);">Sin usuarios</div>';
}

window.filterAdminUsers = function(){
  const q = (document.getElementById('adminUserSearch')?.value||'').toLowerCase().trim();
  document.querySelectorAll('.adm-user-row').forEach(row=>{
    const nick = row.dataset.nick||'';
    const email = row.dataset.email||'';
    row.style.display = (!q || nick.includes(q) || email.includes(q)) ? '' : 'none';
  });
};

// ── Editar usuario desde admin ──
window.adminEditUser = async function(uid){
  const snap = await getDoc(doc(db,'users',uid));
  if(!snap.exists()){ toast('Usuario no encontrado','err'); return; }
  const u = snap.data();
  const old = document.getElementById('_admEditModal');
  if(old) old.remove();
  const m = document.createElement('div');
  m.id = '_admEditModal';
  m.style.cssText = 'position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--border);border-radius:14px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;padding:24px;animation:mIn .2s ease;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <span style="font-family:'Orbitron',monospace;font-size:.95rem;font-weight:900;color:var(--accent);">✏️ Editar Usuario</span>
        <button onclick="document.getElementById('_admEditModal').remove()" style="background:var(--bg3);border:1px solid var(--border);color:var(--muted);width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:.85rem;">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding:10px;background:var(--bg3);border-radius:var(--r);">
        <img src="${u.av||getDefaultAv(u.gender||'')}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--border);">
        <div><div style="font-size:.88rem;font-weight:700;">${esc(u.nick||'')}</div><div style="font-size:.72rem;color:var(--muted);">${esc(u.email||'')}</div></div>
      </div>
      <div class="fg"><label class="fl">Nick</label><input class="fi" id="_aeNick" value="${esc(u.nick||'')}"></div>
      <div class="fg"><label class="fl">Bio</label><textarea class="fi" id="_aeBio" style="min-height:60px;">${esc(u.bio||'')}</textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="fg"><label class="fl">País</label>
          <select class="fi" id="_aeCountry">
            <option value="">Sin especificar</option>
            ${['🇦🇷 Argentina','🇲🇽 México','🇪🇸 España','🇨🇴 Colombia','🇨🇱 Chile','🇵🇪 Perú','🇻🇪 Venezuela','🇺🇾 Uruguay','🇧🇷 Brasil','🇧🇴 Bolivia','🇵🇾 Paraguay','🇪🇨 Ecuador','🇷🇺 Rusia','🇺🇸 Estados Unidos','🇩🇪 Alemania','🇫🇷 Francia','🇮🇹 Italia','🇵🇹 Portugal','🌍 Otro'].map(c=>`<option value="${c}"${u.country===c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="fg"><label class="fl">Ciudad</label><input class="fi" id="_aeCity" value="${esc(u.city||'')}"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div class="fg"><label class="fl">Rol</label>
          <select class="fi" id="_aeRole">
            <option value=""${!u.role?' selected':''}>Usuario</option>
            <option value="admin"${u.role==='admin'?' selected':''}>Admin</option>
            <option value="mod"${u.role==='mod'?' selected':''}>Moderador</option>
          </select>
        </div>
        <div class="fg"><label class="fl">Verificado</label>
          <select class="fi" id="_aeVerif">
            <option value="0"${!u.verified?' selected':''}>No</option>
            <option value="1"${u.verified?' selected':''}>Sí ✅</option>
          </select>
        </div>
      </div>
      <div class="fg"><label class="fl">XP</label><input class="fi" type="number" id="_aeXp" value="${u.xp||0}" min="0"></div>
      <div id="_aeErr" style="color:var(--red);font-size:.78rem;margin-bottom:8px;display:none;"></div>
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button onclick="document.getElementById('_admEditModal').remove()" style="flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:var(--rs);font-family:'Exo 2',sans-serif;font-size:.85rem;cursor:pointer;">Cancelar</button>
        <button onclick="adminSaveUser('${uid}')" style="flex:2;padding:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#000;border:none;border-radius:var(--rs);font-family:'Exo 2',sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;">💾 Guardar cambios</button>
      </div>
    </div>`;
  m.addEventListener('click', e=>{ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
};

window.adminSaveUser = async function(uid){
  const nick = document.getElementById('_aeNick')?.value.trim();
  const bio  = document.getElementById('_aeBio')?.value.trim();
  const country = document.getElementById('_aeCountry')?.value;
  const city = document.getElementById('_aeCity')?.value.trim();
  const role = document.getElementById('_aeRole')?.value;
  const verified = document.getElementById('_aeVerif')?.value === '1';
  const xp = parseInt(document.getElementById('_aeXp')?.value)||0;
  const errEl = document.getElementById('_aeErr');
  if(!nick){ errEl.textContent='El nick no puede estar vacío'; errEl.style.display='block'; return; }
  try {
    await updateDoc(doc(db,'users',uid), { nick, nickLower:nick.toLowerCase(), bio, country, city, role, verified, xp });
    document.getElementById('_admEditModal')?.remove();
    toast(`✅ Usuario ${nick} actualizado`,'ok');
    loadAdminUsers();
  } catch(e){ errEl.textContent='Error: '+e.message; errEl.style.display='block'; }
};

// ── Eliminar usuario desde admin ──
window.adminDeleteUser = async function(uid, nick){
  const old = document.getElementById('_admDelModal');
  if(old) old.remove();
  const m = document.createElement('div');
  m.id = '_admDelModal';
  m.style.cssText = 'position:fixed;inset:0;z-index:10010;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;';
  m.innerHTML = `
    <div style="background:var(--bg2);border:1px solid rgba(255,68,68,.3);border-radius:14px;width:100%;max-width:380px;padding:28px;animation:mIn .2s ease;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:10px;">⚠️</div>
      <div style="font-family:'Orbitron',monospace;font-size:.95rem;font-weight:900;color:var(--red);margin-bottom:8px;">Eliminar Usuario</div>
      <div style="font-size:.85rem;color:var(--muted);margin-bottom:20px;">¿Estás seguro que querés eliminar a <strong style="color:var(--text);">${esc(nick)}</strong>?<br><span style="font-size:.75rem;color:var(--red);">Esta acción no se puede deshacer. Se eliminará el perfil de Firestore.</span></div>
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('_admDelModal').remove()" style="flex:1;padding:10px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:var(--rs);font-family:'Exo 2',sans-serif;font-size:.85rem;cursor:pointer;font-weight:700;">Cancelar</button>
        <button onclick="adminConfirmDelete('${uid}','${esc(nick)}')" style="flex:1;padding:10px;background:var(--red);color:#fff;border:none;border-radius:var(--rs);font-family:'Exo 2',sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;">🗑️ Eliminar</button>
      </div>
    </div>`;
  m.addEventListener('click', e=>{ if(e.target===m) m.remove(); });
  document.body.appendChild(m);
};

window.adminConfirmDelete = async function(uid, nick){
  try {
    await deleteDoc(doc(db,'users',uid));
    document.getElementById('_admDelModal')?.remove();
    toast(`🗑️ Usuario ${nick} eliminado`,'ok');
    loadAdminUsers();
  } catch(e){ toast('Error al eliminar: '+e.message,'err'); }
};

async function banUser(uid, nick){
  if(!confirm(`¿Banear a ${nick}?`)) return;
  await deleteDoc(doc(db,'users',uid));
  toast(`Usuario ${nick} eliminado`,'ok');
  loadAdminData();
}

async function deleteAdminPost(postId, reportId){
  if(!confirm('¿Borrar esta publicación?')) return;
  try {
    await deleteDoc(doc(db,'posts',postId));
    if(reportId) await updateDoc(doc(db,'reports',reportId),{status:'resuelto'});
    toast('Publicación eliminada ✅','ok');
    loadAdminData();
  } catch(e){ toast('Error al eliminar','err'); }
}

async function resolveReport(reportId){
  await updateDoc(doc(db,'reports',reportId),{status:'resuelto'});
  toast('Reporte resuelto ✅','ok');
  loadAdminData();
}

let _adminMediaFiles = {};
function previewAdminMedia(input, previewId, max=5){
  const files = Array.from(input.files).slice(0,max);
  _adminMediaFiles[previewId] = files;
  const prev = document.getElementById(previewId);
  if(!prev) return;
  prev.innerHTML = files.map(f=>{
    const url = URL.createObjectURL(f);
    return `<div style="position:relative;width:70px;height:70px;border-radius:var(--rs);overflow:hidden;"><img src="${url}" style="width:100%;height:100%;object-fit:cover;"></div>`;
  }).join('');
}

async function loadSiteConfig(){
  try {
    const snap = await getDoc(doc(db,'config','site'));
    if(snap.exists()){
      const d = snap.data();
      if(d.siteName) document.getElementById('cfgSiteName').value = d.siteName;
      if(d.slogan) document.getElementById('cfgSlogan').value = d.slogan;
      if(d.announcement) document.getElementById('cfgAnnouncement').value = d.announcement;
      if(d.announcementType) document.getElementById('cfgAnnouncementType').value = d.announcementType;
      if(d.shopDiscountEnd){
        // Convert stored ISO string to datetime-local format
        const dt = new Date(d.shopDiscountEnd);
        const pad = n=>String(n).padStart(2,'0');
        const local = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        document.getElementById('cfgShopDiscountEnd').value = local;
      }
    }
  } catch(e){}
}

async function saveSiteConfig(){
  const shopDiscountRaw = document.getElementById('cfgShopDiscountEnd')?.value;
  const cfg = {
    siteName: document.getElementById('cfgSiteName').value.trim(),
    slogan: document.getElementById('cfgSlogan').value.trim(),
    announcement: document.getElementById('cfgAnnouncement').value.trim(),
    announcementType: document.getElementById('cfgAnnouncementType').value,
    shopDiscountEnd: shopDiscountRaw ? new Date(shopDiscountRaw).toISOString() : '',
  };
  await setDoc(doc(db,'config','site'), cfg, {merge:true});
  toast('Configuración guardada ✅','ok');
  if(cfg.announcement) showAnnouncement(cfg);
}

// ===== SHOP DISCOUNT COUNTDOWN =====
let _shopCountdownTimer = null;
function startShopCountdown(isoEnd){
  const banner = document.getElementById('shopDiscountBanner');
  const labelEl = document.getElementById('shopDiscountEndLabel');
  if(!banner) return;
  if(_shopCountdownTimer) clearInterval(_shopCountdownTimer);
  if(!isoEnd){ banner.style.display='none'; return; }
  const end = new Date(isoEnd);
  if(isNaN(end.getTime())){ banner.style.display='none'; return; }
  if(labelEl){
    const opts={day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'};
    labelEl.textContent = '📅 Vence: ' + end.toLocaleString('es-AR', opts);
  }
  const totalDuration = 30 * 24 * 3600000;
  function tick(){
    const now = new Date();
    const diff = end - now;
    const dEl=document.getElementById('_cdDays');
    const hEl=document.getElementById('_cdHours');
    const mEl=document.getElementById('_cdMins');
    const sEl=document.getElementById('_cdSecs');
    const bar=document.getElementById('_cdProgressBar');
    const pad=n=>String(Math.floor(n)).padStart(2,'0');
    if(diff<=0){
      if(dEl)dEl.textContent='00'; if(hEl)hEl.textContent='00';
      if(mEl)mEl.textContent='00'; if(sEl)sEl.textContent='00';
      if(bar)bar.style.width='0%';
      clearInterval(_shopCountdownTimer);
      banner.style.display='none';
      return;
    }
    const d=Math.floor(diff/86400000);
    const h=Math.floor((diff%86400000)/3600000);
    const m=Math.floor((diff%3600000)/60000);
    const s=Math.floor((diff%60000)/1000);
    if(dEl)dEl.textContent=pad(d);
    if(hEl)hEl.textContent=pad(h);
    if(mEl)mEl.textContent=pad(m);
    if(sEl)sEl.textContent=pad(s);
    if(bar){
      const pct=Math.min(100,Math.max(0,(diff/totalDuration)*100));
      bar.style.width=pct+'%';
      if(pct<15)bar.style.background='linear-gradient(90deg,#ff0000,#ff4500)';
      else if(pct<40)bar.style.background='linear-gradient(90deg,#ff8c00,#ff4500)';
      else bar.style.background='linear-gradient(90deg,#ffd700,#ff4500)';
    }
    if(sEl){sEl.style.transition='transform .15s';sEl.style.transform='scale(1.2)';setTimeout(()=>{if(sEl)sEl.style.transform='scale(1)';},150);}
  }
  banner.style.display='block';
  tick();
  _shopCountdownTimer=setInterval(tick,1000);
}
window.startShopCountdown = startShopCountdown;

// Load shop discount on shop page open
function loadShopDiscount(){
  getDoc(doc(db,'config','site')).then(snap=>{
    if(snap.exists() && snap.data().shopDiscountEnd){
      startShopCountdown(snap.data().shopDiscountEnd);
    }
  }).catch(()=>{});
}
window.loadShopDiscount = loadShopDiscount;

function showAnnouncement(cfg){
  let ann = document.getElementById('globalAnnouncement');
  if(!ann){ ann = document.createElement('div'); ann.id='globalAnnouncement'; document.body.appendChild(ann); }
  const colors={info:'rgba(0,198,255,.1)',warn:'rgba(255,170,0,.1)',ok:'rgba(0,230,118,.1)'};
  const tc={info:'var(--accent)',warn:'var(--warn)',ok:'var(--green)'};
  const t=cfg.announcementType||'info';
  ann.style.cssText=`position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:500;max-width:600px;width:90%;padding:12px 18px;border-radius:var(--r);border:1px solid ${tc[t]};background:${colors[t]};color:${tc[t]};font-size:.85rem;display:flex;align-items:center;gap:10px;`;
  ann.innerHTML=`<span style="flex:1">${cfg.announcement}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:1rem;">✕</button>`;
}

async function submitPatch(){
  if(!window.CU) return;
  const title = document.getElementById('patchTitle').value.trim();
  const desc = document.getElementById('patchDesc').value.trim();
  const type = document.getElementById('patchType').value;
  if(!title||!desc){ toast('Completá título y descripción','err'); return; }
  toast('Publicando parche...','inf');
  const imgs = _adminMediaFiles['patchImgPrev']||[];
  const imageUrls = [];
  for(const f of imgs) imageUrls.push(await uploadImage(f,'patches'));
  await addDoc(collection(db,'patches'),{title,desc,type,images:imageUrls,author:window.CU.nick,time:serverTimestamp()});
  document.getElementById('patchTitle').value='';
  document.getElementById('patchDesc').value='';
  document.getElementById('patchImgPrev').innerHTML='';
  _adminMediaFiles['patchImgPrev']=[];
  toast('Parche publicado ✅','ok');
  loadAdminPatches();
}

async function loadSoporteBadge(){
  try {
    const snap = await getDocs(query(collection(db,'soporte'), where('leido','==',false)));
    const count = snap.size;
    const badge = document.getElementById('admSoporteBadge');
    if(badge){ badge.style.display = count>0?'inline':'none'; badge.textContent=count; }
  } catch(e){}
}

async function loadAdminPatches(){
  try {
    const snap = await getDocs(query(collection(db,'patches'),orderBy('time','desc'),limit(50)));
    const items = snap.docs.map(d=>({id:d.id,...d.data()}));
    const el = document.getElementById('adminPatchesList');
    if(el) el.innerHTML = items.length ? items.map(p=>patchCardHTML(p,true)).join('') : '<div style="text-align:center;padding:20px;color:var(--muted);">Sin parches aún</div>';
  } catch(e){ console.error(e); }
}

// ═══════════════════════════════════════════════
// PANEL DE SOPORTE TÉCNICO — Admin
// ═══════════════════════════════════════════════
let _soporteTickets = [];
let _soporteFilter = 'todos';

async function loadSoporteTickets(){
  const el = document.getElementById('soporteTicketsList');
  if(!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">⏳ Cargando tickets...</div>';
  try {
    const snap = await getDocs(query(collection(db,'soporte'), orderBy('time','desc'), limit(100)));
    _soporteTickets = snap.docs.map(d=>({id:d.id,...d.data(), _ts: d.data().time?.toMillis?.()|| Date.now()}));
    // Actualizar badge con pendientes
    const pendientes = _soporteTickets.filter(t=>!t.leido).length;
    const badge = document.getElementById('admSoporteBadge');
    if(badge){
      badge.style.display = pendientes > 0 ? 'inline' : 'none';
      badge.textContent = pendientes;
    }
    renderSoporteTickets();
  } catch(e){
    console.error('loadSoporteTickets:', e);
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--red);">Error al cargar tickets: '+e.message+'</div>';
  }
}

function filterSoporteBy(f){
  _soporteFilter = f;
  document.querySelectorAll('[id^="sfbtn-"]').forEach(b=>b.classList.remove('active'));
  const btn = document.getElementById('sfbtn-'+f);
  if(btn) btn.classList.add('active');
  renderSoporteTickets();
}

function filterSoporteTickets(){
  renderSoporteTickets();
}

function renderSoporteTickets(){
  const el = document.getElementById('soporteTicketsList');
  if(!el) return;
  const q = (document.getElementById('soporteSearch')?.value||'').toLowerCase().trim();
  let list = _soporteTickets;
  if(_soporteFilter === 'pendiente') list = list.filter(t=>!t.leido);
  if(_soporteFilter === 'leido')     list = list.filter(t=>!!t.leido);
  if(q) list = list.filter(t=>
    (t.nick||'').toLowerCase().includes(q) ||
    (t.desc||'').toLowerCase().includes(q) ||
    (t.tipo||'').toLowerCase().includes(q)
  );
  if(!list.length){
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);">'+
      '<div style="font-size:2rem;margin-bottom:8px;">📭</div>'+
      '<div style="font-size:.85rem;">Sin tickets que mostrar</div></div>';
    return;
  }
  el.innerHTML = list.map(t=>soporteTicketHTML(t)).join('');
}

function soporteTicketHTML(t){
  const fecha = t._ts ? new Date(t._ts).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
  const estadoBg  = t.leido ? 'rgba(46,196,182,.1)'  : 'rgba(255,107,53,.1)';
  const estadoBrd = t.leido ? 'rgba(46,196,182,.35)' : 'rgba(255,107,53,.35)';
  const estadoClr = t.leido ? 'var(--accent)'        : '#ff6b35';
  const estadoTxt = t.leido ? '✅ Revisado'           : '🔴 Pendiente';
  const avLetter  = (t.nick||'?')[0].toUpperCase();
  const avSrc     = t.av ? `<img src="${t.av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${avLetter}'">` : avLetter;

  return `<div id="st_${t.id}" style="background:var(--bg2);border:1px solid ${t.leido?'var(--border)':'rgba(255,107,53,.3)'};border-radius:var(--r);padding:16px 18px;margin-bottom:10px;transition:border .2s;">
    <!-- Cabecera -->
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
      <div style="width:42px;height:42px;border-radius:50%;background:var(--bg3);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:var(--accent);flex-shrink:0;overflow:hidden;">${avSrc}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:2px;">
          <span style="font-weight:800;font-size:.9rem;cursor:pointer;color:var(--text);" onclick="openUserProfile('${t.uid||''}','${(t.nick||'').replace(/'/g,"\\'")}')">@${esc(t.nick||'?')}</span>
          <span style="font-size:.68rem;padding:2px 8px;border-radius:100px;background:${estadoBg};border:1px solid ${estadoBrd};color:${estadoClr};font-weight:700;">${estadoTxt}</span>
        </div>
        <div style="font-size:.72rem;color:var(--muted);">${fecha} · ${esc(t.dispositivo||'Dispositivo no especificado')}</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        ${!t.leido ? `<button onclick="marcarSoporteLeido('${t.id}')" title="Marcar como revisado"
          style="background:rgba(46,196,182,.1);border:1px solid rgba(46,196,182,.3);color:var(--accent);padding:5px 10px;border-radius:var(--rs);font-size:.75rem;cursor:pointer;font-family:'Exo 2',sans-serif;font-weight:700;transition:opacity .15s;"
          onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">✅ Marcar revisado</button>` : ''}
        <button onclick="responderSoporte('${t.id}','${(t.uid||'').replace(/'/g,"\\'")}','${(t.nick||'').replace(/'/g,"\\'")}','${(t.tipo||'').replace(/'/g,"\\'").replace(/"/g,'\\"')}')" title="Responder por chat"
          style="background:rgba(0,198,255,.1);border:1px solid rgba(0,198,255,.3);color:var(--accent);padding:5px 10px;border-radius:var(--rs);font-size:.75rem;cursor:pointer;font-family:'Exo 2',sans-serif;font-weight:700;transition:opacity .15s;"
          onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">💬 Responder</button>
        <button onclick="eliminarSoporteTicket('${t.id}')" title="Eliminar ticket"
          style="background:rgba(255,68,68,.08);border:1px solid rgba(255,68,68,.2);color:var(--red);padding:5px 8px;border-radius:var(--rs);font-size:.75rem;cursor:pointer;font-family:'Exo 2',sans-serif;transition:opacity .15s;"
          onmouseover="this.style.opacity='.75'" onmouseout="this.style.opacity='1'">🗑</button>
      </div>
    </div>
    <!-- Tipo -->
    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.2);border-radius:100px;padding:3px 12px;font-size:.75rem;font-weight:700;color:#ff6b35;margin-bottom:10px;">
      🆘 ${esc(t.tipo||'Sin tipo')}
    </div>
    <!-- Descripción -->
    <div style="background:var(--bg3);border-radius:var(--rs);padding:12px 14px;font-size:.85rem;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;">${esc(t.desc||'Sin descripción')}</div>
  </div>`;
}

async function marcarSoporteLeido(ticketId){
  try {
    await updateDoc(doc(db,'soporte',ticketId), {leido: true});
    const t = _soporteTickets.find(x=>x.id===ticketId);
    if(t) t.leido = true;
    // Actualizar badge
    const pendientes = _soporteTickets.filter(x=>!x.leido).length;
    const badge = document.getElementById('admSoporteBadge');
    if(badge){ badge.style.display = pendientes>0?'inline':'none'; badge.textContent=pendientes; }
    // Re-render solo el ticket
    const el = document.getElementById('st_'+ticketId);
    if(el && t) el.outerHTML = soporteTicketHTML(t);
    else renderSoporteTickets();
    toast('Ticket marcado como revisado ✅','ok');
  } catch(e){ toast('Error: '+e.message,'err'); }
}

async function eliminarSoporteTicket(ticketId){
  if(!confirm('¿Eliminar este ticket de soporte?')) return;
  try {
    await deleteDoc(doc(db,'soporte',ticketId));
    _soporteTickets = _soporteTickets.filter(x=>x.id!==ticketId);
    renderSoporteTickets();
    toast('Ticket eliminado','ok');
  } catch(e){ toast('Error: '+e.message,'err'); }
}

function responderSoporte(ticketId, uid, nick, tipo){
  // Abre el chat con el usuario y envía un mensaje inicial de contexto
  if(!uid){ toast('No se puede responder: usuario desconocido','err'); return; }
  // Navegar al chat y precargar el mensaje
  openMessenger();
  setTimeout(()=>{
    openChat(uid, nick);
    setTimeout(()=>{
      const inp = document.getElementById('chatInput');
      if(inp){
        inp.value = `Hola @${nick}, te contactamos por tu ticket de soporte: "${tipo}". `;
        inp.focus();
      }
    }, 400);
  }, 300);
  // Marcar como leído al responder
  marcarSoporteLeido(ticketId);
}


