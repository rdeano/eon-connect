import { create } from 'zustand';

const useCallStore = create((set) => ({
    status: 'idle',       // idle | calling | ringing | active
    direction: null,      // 'inbound' | 'outbound'
    room: null,           // LiveKit Room instance
    unitId: null,
    callerName: null,     // inbound: who called us
    calleeName: null,     // outbound: who we called
    token: null,
    livekitUrl: null,
    isMuted: false,
    remoteJoined: false,

    setRoom:         (room)                     => set({ room }),
    setCalling:      (unitId, calleeName)        => set({ status: 'calling', direction: 'outbound', unitId, calleeName }),
    setActive:       ()                          => set({ status: 'active' }),
    setMuted:        (isMuted)                  => set({ isMuted }),
    setRemoteJoined: ()                          => set({ remoteJoined: true }),

    setRinging: (unitId, callerName, token, livekitUrl) =>
        set({ status: 'ringing', direction: 'inbound', unitId, callerName, token, livekitUrl }),

    reset: () => set({
        status: 'idle', direction: null, room: null, unitId: null,
        callerName: null, calleeName: null, token: null, livekitUrl: null,
        isMuted: false, remoteJoined: false,
    }),
}));

export default useCallStore;
