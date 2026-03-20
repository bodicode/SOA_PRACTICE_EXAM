import { create } from 'zustand'

interface ProgressData {
    stats: any
    history: any[]
    performance: any[]
}

interface HistoryResponse {
    data: any[]
    meta: any
}

interface ProgressState {
    cache: Record<string, ProgressData>
    historyCache: Record<string, HistoryResponse> // New cache for history list
    loadingKeys: Record<string, boolean>

    userId: number | null

    fetchProgress: (userId: number, categoryId?: number, force?: boolean) => Promise<void>
    fetchHistoryList: (params: any, force?: boolean) => Promise<HistoryResponse | null> // Updated signature
    getData: (categoryId?: number) => ProgressData | null
    isLoading: (categoryId?: number) => boolean
    reset: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    cache: {},
    historyCache: {},
    loadingKeys: {},
    userId: null,

    fetchProgress: async (userId: number, categoryId?: number, force = false) => {
        const cacheKey = categoryId !== undefined ? categoryId.toString() : 'all';

        // Reset cache if user changes - only reset without triggering fetch conflicts
        const { userId: storedUserId } = get();
        if (storedUserId !== null && storedUserId !== userId) {
            set({ userId, cache: {}, historyCache: {}, loadingKeys: {} });
        } else if (storedUserId === null) {
            set({ userId });
        }

        // Check cache (fresh)
        if (!force && get().cache[cacheKey]) {
            return;
        }

        // Check active loading - avoid duplicate requests
        if (get().loadingKeys[cacheKey]) return;

        // Mark as loading BEFORE async work to prevent race conditions
        set(state => ({
            loadingKeys: { ...state.loadingKeys, [cacheKey]: true },
        }));

        try {
            let url = `/api/progress?userId=${userId}&t=${Date.now()}`;
            if (categoryId !== undefined) url += `&categoryId=${categoryId}`;

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

    fetchHistoryList: async (params: any, force = false) => {
        const { userId } = params;
        const { userId: storedUserId } = get();

        // Construct a unique cache key for this specific view
        // keys: userId-page-limit-sort-categoryId
        const cacheKey = JSON.stringify(params);

        if (storedUserId !== userId) {
            set({ userId, cache: {}, historyCache: {}, loadingKeys: {} });
        }

        if (!force && get().historyCache[cacheKey]) {
            return get().historyCache[cacheKey];
        }

        try {
            const queryParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                queryParams.set(key, params[key]);
            });
            // Add timestamp only to request, not to cache key
            queryParams.set('_t', Date.now().toString());

            const res = await fetch(`/api/progress/history?${queryParams.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch history list');

            const result = await res.json();

            set(state => ({
                historyCache: { ...state.historyCache, [cacheKey]: result }
            }));

            return result;
        } catch (error) {
            console.error(error);
            return null;
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

    reset: () => set({ cache: {}, historyCache: {}, userId: null, loadingKeys: {} })
}))
