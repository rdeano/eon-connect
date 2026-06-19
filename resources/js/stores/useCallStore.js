import { create } from 'zustand';

const useCallStore = create((set) => ({
    status: 'idle',       // idle | calling | ringing | active
    room: null,           // LiveKit Room instance
    unitId: null,
    callerName: null,
    token: null,
    livekitUrl: null,
    isMuted: false,

    setRoom:    (room)     => set({ room }),
    setCalling: (unitId)   => set({ status: 'calling', unitId }),
    setActive:  ()         => set({ status: 'active' }),
    setMuted:   (isMuted)  => set({ isMuted }),

    setRinging: (unitId, callerName, token, livekitUrl) =>
        set({ status: 'ringing', unitId, callerName, token, livekitUrl }),

    reset: () => set({
        status: 'idle', room: null, unitId: null,
        callerName: null, token: null, livekitUrl: null, isMuted: false,
    }),
}));

export default useCallStore;
