import { create } from 'zustand';

const usePresenceStore = create((set) => ({
    onlineUsers: {},

    setOnline:  (user) => set((state) => ({ onlineUsers: { ...state.onlineUsers, [user.id]: user } })),
    setOffline: (userId) => set((state) => {
        const updated = { ...state.onlineUsers };
        delete updated[userId];
        return { onlineUsers: updated };
    }),
    setAll: (users) => {
        const map = {};
        users.forEach((u) => { map[u.id] = u; });
        set({ onlineUsers: map });
    },
}));

export default usePresenceStore;
