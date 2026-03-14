// Firebase Messaging Service Worker
// Este archivo debe estar en la raíz del proyecto (mismo nivel que index.html)

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA9oat9dd0S9vlxkg1osH4dW3XhRDGiOiw",
  authDomain: "charlasrf4.firebaseapp.com",
  projectId: "charlasrf4",
  storageBucket: "charlasrf4.firebasestorage.app",
  messagingSenderId: "345019626508",
  appId: "1:345019626508:web:d099ca499acb29eac12a29"
});

const messaging = firebase.messaging();

// Mostrar notificación cuando la app está en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Notificación en background:', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '🏆 Nuevo Trofeo', {
    body: body || 'Alguien publicó un nuevo trofeo en WikiPediaRF4.UY',
    icon: icon || '/og-image.png',
    badge: '/og-image.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      { action: 'ver', title: '🎣 Ver trofeo' },
      { action: 'cerrar', title: 'Cerrar' }
    ]
  });
});

// Click en la notificación — abrir la app
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'cerrar') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes('wikipediarf4.uy') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('https://wikipediarf4.uy/');
    })
  );
});
