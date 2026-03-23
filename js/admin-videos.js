(function(){
  'use strict';

  // ── Aprobar video ────────────────────────────────────────
  window.adminAprobarVideo = async function(postId, ytId){
    const _isAdmin = window.CU && (window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com' || window.CU.role === 'admin');
    if(!_isAdmin){ toast('Sin permisos','err'); return; }
    if(!confirm('¿Aprobar este video? Quedará visible para todos los usuarios.')) return;

    try{
      var fi = window._fsLib || {};
      if(!fi.updateDoc || !fi.doc || !window.db) throw new Error('Firestore no disponible');

      // 1. Marcar el post como aprobado
      await fi.updateDoc(fi.doc(window.db,'posts',postId),{
        videoStatus: 'approved'
      });

      // 2. Actualizar registro en videoPendientes si existe
      try{
        const snap = await fi.getDocs(fi.query(
          fi.collection(window.db,'videoPendientes'),
          fi.where('videoId','==',ytId),
          fi.limit(1)
        ));
        if(!snap.empty){
          await fi.updateDoc(snap.docs[0].ref,{ status:'approved', approvedAt: new Date().toISOString() });
        }
      }catch(e2){}

      toast('✅ Video aprobado — ahora es visible para todos','ok');

      // Re-renderizar el post en el feed
      const postEl = document.getElementById('post_'+postId);
      if(postEl && typeof _posts !== 'undefined'){
        const pp = _posts.find(x=>x.id===postId);
        if(pp){
          pp.videoStatus = 'approved';
          const tmp = document.createElement('div');
          tmp.innerHTML = postHTML(pp);
          postEl.replaceWith(tmp.firstElementChild);
        }
      }
    }catch(e){
      toast('Error al aprobar: '+e.message,'err');
    }
  };

  // ── Rechazar video ───────────────────────────────────────
  window.adminRechazarVideo = async function(postId, ytId){
    const _isAdmin = window.CU && (window.CU.nick === 'ruizgustavo12' || window.CU.email === 'synxyes@gmail.com' || window.CU.role === 'admin');
    if(!_isAdmin){ toast('Sin permisos','err'); return; }
    if(!confirm('¿Rechazar y eliminar este video del post? El video en YouTube quedará sin listar.')) return;

    try{
      var fi = window._fsLib || {};
      if(!fi.updateDoc || !fi.doc || !window.db) throw new Error('Firestore no disponible');

      // 1. Quitar el video del post y marcar rechazado
      await fi.updateDoc(fi.doc(window.db,'posts',postId),{
        video: null,
        videoStatus: 'rejected'
      });

      // 2. Actualizar videoPendientes
      try{
        const snap = await fi.getDocs(fi.query(
          fi.collection(window.db,'videoPendientes'),
          fi.where('videoId','==',ytId),
          fi.limit(1)
        ));
        if(!snap.empty){
          await fi.updateDoc(snap.docs[0].ref,{ status:'rejected', rejectedAt: new Date().toISOString() });
        }
      }catch(e2){}

      toast('❌ Video rechazado y removido del post','inf');

      // Re-renderizar el post
      const postEl = document.getElementById('post_'+postId);
      if(postEl && typeof _posts !== 'undefined'){
        const pp = _posts.find(x=>x.id===postId);
        if(pp){
          pp.video = null;
          pp.videoStatus = 'rejected';
          const tmp = document.createElement('div');
          tmp.innerHTML = postHTML(pp);
          postEl.replaceWith(tmp.firstElementChild);
        }
      }
    }catch(e){
      toast('Error al rechazar: '+e.message,'err');
    }
  };

})();
