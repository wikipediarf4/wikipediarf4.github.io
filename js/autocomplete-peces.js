(function(){
  'use strict';

  // IDs de todos los campos de pez
  var FISH_INPUT_IDS = ['tagFish','epFish','pszFish','wkPF','spPFish','spotFish'];

  var _activeDrop = null;
  var _activeInput = null;
  var _activeIdx = -1;

  function getFishDB(){
    return (typeof FISH_DB !== 'undefined' ? FISH_DB : (window.FISH_DB || []));
  }

  function closeDrop(){
    if(_activeDrop){ _activeDrop.remove(); _activeDrop = null; }
    _activeInput = null;
    _activeIdx = -1;
  }

  function highlight(q, text){
    if(!q) return text;
    var re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
    return text.replace(re,'<mark style="background:rgba(46,196,182,.22);color:#2ec4b6;border-radius:2px;">$1</mark>');
  }

  function openDrop(input, matches){
    closeDrop();
    if(!matches.length) return;

    var wrap = input.closest('._rf4FishWrap') || input.parentElement;
    var drop = document.createElement('div');
    drop.className = '_rf4FishDrop';

    matches.forEach(function(f, i){
      var item = document.createElement('div');
      item.className = '_rf4FishItem';
      item.dataset.idx = i;
      var q = input.value.trim();
      item.innerHTML = '<img src="'+f.img+'" alt="" onerror="this.style.display=\'none\'">'
        + '<span class="_rf4FishItemName">'+highlight(q, f.n)+'</span>'
        + '<span class="_rf4FishItemHint">'+f.t+'</span>';
      item.addEventListener('mousedown', function(e){
        e.preventDefault();
        input.value = f.n;
        input.dispatchEvent(new Event('input', {bubbles:true}));
        closeDrop();
      });
      drop.appendChild(item);
    });

    // Posicionar justo debajo del input
    if(input.closest('._rf4FishWrap')){
      wrap.appendChild(drop);
    } else {
      // Crear wrapper si no existe
      var parent = input.parentNode;
      var wrapDiv = document.createElement('div');
      wrapDiv.className = '_rf4FishWrap';
      wrapDiv.style.cssText = 'position:relative;';
      parent.insertBefore(wrapDiv, input);
      wrapDiv.appendChild(input);
      wrapDiv.appendChild(drop);
    }

    _activeDrop = drop;
    _activeInput = input;
    _activeIdx = -1;
  }

  function doSearch(input){
    var q = input.value.trim().toLowerCase();
    if(q.length < 1){ closeDrop(); return; }
    var db = getFishDB();
    var results = db.filter(function(f){
      return f.n && f.n.toLowerCase().indexOf(q) !== -1;
    }).slice(0, 12);
    openDrop(input, results);
  }

  function navigateDrop(e){
    if(!_activeDrop) return;
    var items = _activeDrop.querySelectorAll('._rf4FishItem');
    if(!items.length) return;
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      _activeIdx = Math.min(_activeIdx + 1, items.length - 1);
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      _activeIdx = Math.max(_activeIdx - 1, 0);
    } else if(e.key === 'Enter' && _activeIdx >= 0){
      e.preventDefault();
      items[_activeIdx].dispatchEvent(new MouseEvent('mousedown'));
      return;
    } else if(e.key === 'Escape'){
      closeDrop(); return;
    } else { return; }
    items.forEach(function(it){ it.classList.remove('_rf4FishActive'); });
    if(_activeIdx >= 0){ items[_activeIdx].classList.add('_rf4FishActive'); items[_activeIdx].scrollIntoView({block:'nearest'}); }
  }

  function attachToInput(input){
    if(input._rf4AutocompleteAttached) return;
    input._rf4AutocompleteAttached = true;
    input.setAttribute('autocomplete','off');

    input.addEventListener('input', function(){ doSearch(input); });
    input.addEventListener('focus', function(){ if(input.value.trim()) doSearch(input); });
    input.addEventListener('keydown', navigateDrop);
    input.addEventListener('blur', function(){ setTimeout(closeDrop, 160); });
  }

  function attachAll(){
    FISH_INPUT_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(el) attachToInput(el);
    });
  }

  // Adjuntar cuando el DOM esté listo
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attachAll);
  } else {
    attachAll();
  }

  // También adjuntar si los inputs aparecen dinámicamente (modales)
  var _obs = new MutationObserver(function(){
    FISH_INPUT_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(el && !el._rf4AutocompleteAttached) attachToInput(el);
    });
    // También buscar el input dinámico _weF
    var we = document.getElementById('_weF');
    if(we && !we._rf4AutocompleteAttached) attachToInput(we);
  });
  _obs.observe(document.body, {childList:true, subtree:true});

  // Cerrar al hacer clic fuera
  document.addEventListener('mousedown', function(e){
    if(_activeDrop && !_activeDrop.contains(e.target) && e.target !== _activeInput){
      closeDrop();
    }
  });

})();
