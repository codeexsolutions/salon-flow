// Service worker do SalonFlow: instalação do app (PWA) e notificações push.
// Não guarda nada em cache: o app sempre busca a versão mais nova na rede.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// Push enviado pela API: { titulo, corpo, url, tag }.
self.addEventListener('push', (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { corpo: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(dados.titulo || 'SalonFlow', {
      body: dados.corpo || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: dados.tag,
      data: { url: dados.url || '/' },
    }),
  );
});

// Tocar na notificação: foca uma aba do app (se houver) na página certa.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((abas) => {
      for (const aba of abas) {
        if (new URL(aba.url).origin === self.location.origin && 'focus' in aba) {
          return aba.navigate(destino).then((a) => (a || aba).focus());
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
