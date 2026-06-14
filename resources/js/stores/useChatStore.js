import { create } from 'zustand';

const useChatStore = create((set, get) => ({
    messages:     {},
    unreadCounts: {},
    activeUnitId: null,

    setActiveUnit: (unitId) => set({ activeUnitId: unitId }),

    setMessages: (unitId, messages) =>
        set((state) => ({ messages: { ...state.messages, [unitId]: messages } })),

    addMessage: (unitId, message) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [unitId]: [...(state.messages[unitId] || []), message],
            },
        })),

    setUnreadCount: (unitId, count) =>
        set((state) => ({ unreadCounts: { ...state.unreadCounts, [unitId]: count } })),

    decrementUnread: (unitId) =>
        set((state) => ({
            unreadCounts: {
                ...state.unreadCounts,
                [unitId]: Math.max(0, (state.unreadCounts[unitId] || 0) - 1),
            },
        })),
}));

export default useChatStore;
