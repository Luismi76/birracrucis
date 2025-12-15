import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Cliente de Servidor (para usar en API Routes / Server Actions)
// Singleton para evitar múltiples conexiones en desarrollo
export const pusherServer = globalThis.pusherServer || new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    useTLS: true,
});

if (process.env.NODE_ENV !== 'production') {
    globalThis.pusherServer = pusherServer;
}

// Cliente de Navegador (para usar en React components)
export const pusherClient = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_KEY!,
    {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        // authEndpoint: '/api/pusher/auth', // Descomentar si implementamos canales privados
    }
);
