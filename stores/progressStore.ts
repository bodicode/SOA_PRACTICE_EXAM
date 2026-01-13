import { create } from 'zustand'

interface ProgressData {
    stats: any
    history: any[]
    performance: any[]
}

interface ProgressState {
    data: ProgressData | null
    userId: number | null
    activeCategoryId: number | undefined
    isLoading: boolean
    lastFetched: number

    fetchProgress: (userId: number, categoryId?: number, force?: boolean) => Promise<void>
    reset: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => ({
    data: null,
    userId: null,
    activeCategoryId: undefined,
    isLoading: false,
    lastFetched: 0,

    fetchProgress: async (userId: number, categoryId?: number, force = false) => {
        const { data, userId: storedUserId, activeCategoryId: storedCategoryId, lastFetched, isLoading } = get();

        // Prevent fetching if already loading
        if (isLoading) return;

        // Cache Validation:
        // 1. Time: < 5 mins
        // 2. User: Must match
        // 3. Category: Must match exactly (undefined should match undefined)
        const isFresh = (Date.now() - lastFetched) < 5 * 60 * 1000;
        const isSameCategory = storedCategoryId === categoryId;

        if (!force && userId === storedUserId && isSameCategory && data && isFresh) {
            return;
        }

        set({ isLoading: true, userId, activeCategoryId: categoryId });

        try {
            let url = `/api/progress?userId=${userId}`;
            if (categoryId) url += `&categoryId=${categoryId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch progress');

            const result = await res.json();
            set({
                data: result,
                isLoading: false,
                lastFetched: Date.now()
            });
        } catch (error) {
            console.error(error);
            set({ isLoading: false });
        }
    },

    reset: () => set({ data: null, userId: null, lastFetched: 0 })
}))
