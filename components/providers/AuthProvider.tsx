'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

// Function to sync user to database
async function syncUserToDatabase() {
    try {
        const res = await fetch('/api/auth/sync-user', { method: 'POST' })
        if (res.ok) {
            const data = await res.json()
            return data.user
        }
    } catch (error) {
        console.error('Failed to sync user:', error)
    }
    return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useUserStore()
    const supabase = createClient()

    useEffect(() => {
        // Get initial session
        const getUser = async () => {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Set initial Supabase user
                const initialUser = {
                    id: user.id,
                    email: user.email || '',
                    fullName: user.user_metadata?.full_name,
                    avatarUrl: user.user_metadata?.avatar_url,
                    role: user.user_metadata?.role || 'student',
                }
                setUser(initialUser)

                // Sync and get DB ID
                const dbUser = await syncUserToDatabase()
                if (dbUser && dbUser.id) {
                    setUser({
                        ...initialUser,
                        id: dbUser.id.toString(), // Update to DB ID
                        role: dbUser.role.toLowerCase()
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
                                role: dbUser.role.toLowerCase()
                            })
                        }
                    }
                } else {
                    setUser(null)
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, setUser, setLoading])

    return <>{children}</>
}

