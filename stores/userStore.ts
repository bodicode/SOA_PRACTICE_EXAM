import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
    id: string
    email: string
    fullName?: string
    avatarUrl?: string
    role?: string
}

interface UserState {
    user: User | null
    isLoading: boolean
    setUser: (user: User | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            setUser: (user) => set({ user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => set({ user: null, isLoading: false }),
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({ user: state.user }),
        }
    )
)
