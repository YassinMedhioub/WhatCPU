import { create } from 'zustand';
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    setChatId: (newChatId) => set({ chatId: newChatId }),
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    blockedUsers: [],

    changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;
        const isCurrentUserBlocked = user.blocked.includes(currentUser.id);
        const isReceiverBlocked = currentUser.blocked.includes(user.id);

        set({
            chatId,
            user,
            isCurrentUserBlocked,
            isReceiverBlocked,
        });
    },

    resetChat: () => set({
        chatId: null,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
        blockedUsers: [],
    }),

    changeBlock: () => {
        set((state) => ({
            isReceiverBlocked: !state.isReceiverBlocked,
        }));
    },

    toggleBlockForUser: (userId) => set((state) => {
        const isBlocked = state.blockedUsers.includes(userId);

        return {
            blockedUsers: isBlocked
                ? state.blockedUsers.filter((id) => id !== userId)
                : [...state.blockedUsers, userId],
            isReceiverBlocked: !isBlocked,
        };
    }),
    setBlockedUsers: (blockedUsers) => set({ blockedUsers }),
}));

