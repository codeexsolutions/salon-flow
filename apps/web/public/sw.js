// Service worker do SalonFlow. Por enquanto só habilita a instalação do app (PWA);
// as notificações push serão tratadas aqui depois. Não guarda nada em cache:
// o app sempre busca a versão mais nova na rede.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
