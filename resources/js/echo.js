import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster:       'reverb',
    key:               import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:            import.meta.env.VITE_REVERB_HOST,
    wsPort:            import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort:           import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS:          false,
    enabledTransports: ['ws'],
    authorizer: (channel) => ({
        authorize: (socketId, callback) => {
            axios.post('/api/broadcasting/auth', {
                socket_id:    socketId,
                channel_name: channel.name,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
            .then((res) => callback(null, res.data))
            .catch((err) => callback(err));
        },
    }),
});

window.Echo = echo;

export default echo;
