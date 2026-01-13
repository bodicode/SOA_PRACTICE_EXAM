import { create } from 'zustand'

interface ProgressData {
    stats: any
    history: any[]
    performance: any[]
}

interface ProgressState {
    cache: Record<string, ProgressData>
    loadingKeys: Record<string, boolean>

    userId: number | null

    fetchProgress: (userId: number, categoryId?: number, force?: boolean) => Promise<void>
    getData: (categoryId?: number) => ProgressData | null
    isLoading: (categoryId?: number) => boolean
    reset: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    cache: {},
    loadingKeys: {},
    userId: null,

    fetchProgress: async (userId: number, categoryId?: number, force = false) => {
        const { userId: storedUserId } = get();
        const cacheKey = categoryId !== undefined ? categoryId.toString() : 'all';

        // Reset cache if user changes
        if (storedUserId !== userId) {
            set({ userId, cache: {}, loadingKeys: {} });
        }

        // Check cache (fresh)
        if (!force && get().cache[cacheKey]) {
            return;
        }

        // Check active loading
        if (get().loadingKeys[cacheKey]) return;

        set(state => ({
            loadingKeys: { ...state.loadingKeys, [cacheKey]: true },
            userId
        }));

        try {
            let url = `/api/progress?userId=${userId}`;
            if (categoryId) url += `&categoryId=${categoryId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch progress');

            const result = await res.json();

            set(state => ({
                cache: { ...state.cache, [cacheKey]: result },
                loadingKeys: { ...state.loadingKeys, [cacheKey]: false }
            }));
        } catch (error) {
            console.error(error);
            set(state => ({
                loadingKeys: { ...state.loadingKeys, [cacheKey]: false }
            }));
        }
    },

    getData: (categoryId?: number) => {
        const key = categoryId !== undefined ? categoryId.toString() : 'all';
        return get().cache[key] || null;
    },

    isLoading: (categoryId?: number) => {
        const key = categoryId !== undefined ? categoryId.toString() : 'all';
        return !!get().loadingKeys[key];
    },

    reset: () => set({ cache: {}, userId: null, loadingKeys: {} })
}))
