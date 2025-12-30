'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'

export function Navbar() {
    const { user, isLoading, logout } = useUserStore()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.push('/login')
        router.refresh()
    }

    return (
        <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-slate-900/70 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🛡️</span>
                        <span className="text-xl font-bold text-white">SOA Practice</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isLoading ? (
                            <div className="w-24 h-8 bg-white/10 animate-pulse rounded" />
                        ) : user ? (
                            <>
                                <span className="text-white/70 text-sm hidden sm:block">
                                    {user.fullName || user.email}
                                </span>
                                <Link href="/practice">
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                        Luyện thi
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    className="text-white/70 hover:text-white hover:bg-white/10"
                                    onClick={handleLogout}
                                >
                                    Đăng xuất
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-white hover:bg-white/10">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0">
                                        Đăng ký miễn phí
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
