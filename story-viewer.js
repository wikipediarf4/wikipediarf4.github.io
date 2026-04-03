// story-viewer.js - MiLatido
// Módulo de stories de la red social
(function () {
  // Este módulo se inicializa cuando se navega a la sección de stories
  var _origGp = window.gp;
  window.gp = function (page) {
    if (typeof _origGp === 'function') _origGp(page);
  };
})();
