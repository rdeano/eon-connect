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

    incrementUnread: (unitId) =>
        set((state) => ({
            unreadCounts: {
                ...state.unreadCounts,
                [unitId]: (state.unreadCounts[unitId] || 0) + 1,
            },
        })),

    markUnitMessagesRead: (unitId, receiverId) =>
        set((state) => ({
            messages: {
                ...state.messages,
                [unitId]: (state.messages[unitId] || []).map((m) =>
                    m.receiver_id === receiverId ? { ...m, status: 'read' } : m
                ),
            },
            unreadCounts: { ...state.unreadCounts, [unitId]: 0 },
        })),
}));

export default useChatStore;
