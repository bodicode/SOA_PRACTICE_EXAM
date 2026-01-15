'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

// Function to sync user to database
const SYNC_COOLDOWN = 60 * 1000; // 1 minute is enough if persisted

async function syncUserToDatabase() {
    if (typeof window === 'undefined') return null;

    const now = Date.now();
    const lastSyncTime = parseInt(localStorage.getItem('lastSyncTime') || '0', 10);
    const cachedUserStr = localStorage.getItem('cachedUser');

    if (now - lastSyncTime < SYNC_COOLDOWN) {
        // Return cached user if exists and we are skipping sync
        if (cachedUserStr) {
            try {
                return JSON.parse(cachedUserStr);
            } catch (e) {
                console.error('Failed to parse cached user', e);
            }
        }
        return null;
    }

    try {
        const res = await fetch('/api/auth/sync-user', { method: 'POST' })
        if (res.ok) {
            localStorage.setItem('lastSyncTime', now.toString());
            const data = await res.json()
            if (data.user) {
                localStorage.setItem('cachedUser', JSON.stringify(data.user));
            }
            return data.user
        }
    } catch (error) {
        console.error('Failed to sync user:', error)
    }

    // Fallback to cache if sync fails
    if (cachedUserStr) {
        try {
            return JSON.parse(cachedUserStr);
        } catch (e) {
            console.error('Failed to parse cached user', e);
        }
    }

    return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useUserStore()
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        // Get initial session
        const getUser = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Set initial Supabase user
                const currentUser = useUserStore.getState().user
                const initialUser = {
                    id: user.id,
                    email: user.email || '',
                    fullName: (currentUser?.id === user.id && currentUser?.fullName) || user.user_metadata?.full_name,
                    avatarUrl: (currentUser?.id === user.id && currentUser?.avatarUrl) || user.user_metadata?.avatar_url,
                    role: user.user_metadata?.role || 'student',
                }
                setUser(initialUser)

                // Sync and get DB ID
                const dbUser = await syncUserToDatabase()
                if (dbUser && dbUser.id) {
                    setUser({
                        ...initialUser,
                        id: dbUser.id.toString(), // Update to DB ID
                        role: dbUser.role.toLowerCase(),
                        avatarUrl: dbUser.avatarUrl || initialUser.avatarUrl,
                        fullName: dbUser.fullName || initialUser.fullName
                    })
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        }

        getUser()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const initialUser = {
                        id: session.user.id,
                        email: session.user.email || '',
                        fullName: session.user.user_metadata?.full_name,
                        avatarUrl: session.user.user_metadata?.avatar_url,
                        role: session.user.user_metadata?.role || 'student',
                    }
                    setUser(initialUser)

                    // Sync to database on SIGNED_IN or USER_UPDATED
                    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                        const dbUser = await syncUserToDatabase()
                        if (dbUser && dbUser.id) {
                            setUser({
                                ...initialUser,
                                id: dbUser.id.toString(),
                                role: dbUser.role.toLowerCase(),
                                avatarUrl: dbUser.avatarUrl || initialUser.avatarUrl,
                                fullName: dbUser.fullName || initialUser.fullName
                            })
                        }
                    }
                } else {
                    setUser(null)
                    // Clear cache on logout
                    localStorage.removeItem('cachedUser')
                    localStorage.removeItem('lastSyncTime')
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, setUser, setLoading])

    return <>{children}</>
}

