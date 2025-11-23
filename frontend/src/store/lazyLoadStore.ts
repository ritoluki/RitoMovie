import { create } from 'zustand';

interface LazyLoadState {
    loadedSections: Set<string>;
    loadingSection: string | null;
    markAsLoaded: (sectionId: string) => void;
    setLoadingSection: (sectionId: string | null) => void;
    canLoad: (sectionId: string, previousSectionId?: string) => boolean;
}

export const useLazyLoadStore = create<LazyLoadState>((set, get) => ({
    loadedSections: new Set<string>(),
    loadingSection: null,

    markAsLoaded: (sectionId: string) => {
        set((state) => ({
            loadedSections: new Set(state.loadedSections).add(sectionId),
            loadingSection: null,
        }));
    },

    setLoadingSection: (sectionId: string | null) => {
        set({ loadingSection: sectionId });
    },

    canLoad: (sectionId: string, previousSectionId?: string) => {
        const state = get();

        // Nếu không có section trước, cho phép load (section đầu tiên)
        if (!previousSectionId) {
            return state.loadingSection === null;
        }

        // Chỉ cho phép load nếu:
        // 1. Không có section nào đang load
        // 2. Section trước đã load xong
        return (
            state.loadingSection === null &&
            state.loadedSections.has(previousSectionId)
        );
    },
}));
