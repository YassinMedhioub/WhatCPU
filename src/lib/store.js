import create from 'zustand';

export const useAppStore = create(set => ({
    showDetail: false,
    toggleDetail: () => set(state => ({ showDetail: !state.showDetail })),
}));