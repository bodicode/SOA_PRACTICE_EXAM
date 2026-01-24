'use client'

import Link from 'next/link'
import Image from 'next/image'
// import { useRouter, usePathname } from 'next/navigation' // Removed standard hooks
import { useRouter, usePathname } from '@/navigation' // Use next-intl hooks
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut, Languages } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Navbar() {
    const { user, isLoading, logout } = useUserStore()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const t = useTranslations('nav')
    const [supabase] = useState(() => createClient())
    const [isOpen, setIsOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down & past threshold
                setIsVisible(false)
            } else {
                // Scrolling up
                setIsVisible(true)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.push('/login')
        router.refresh()
    }

    const switchLocale = (newLocale: string) => {
        // next-intl router handles the path and prefix automatically
        router.replace(pathname, { locale: newLocale })
    }

    return (
        <header
            className={`sticky top-0 z-50 w-full border-b border-gray-100 bg-white transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-40 h-16 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="SOA Prep Logo"
                                    width={160}
                                    height={64}
                                    priority
                                    className="w-full h-full object-contain object-center scale-[2.5]"
                                />
                            </div>
                        </Link>
                        {user && (
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                                <Link href="/practice" className="hover:text-blue-600 transition-colors">
                                    {t('practice')}
                                </Link>
                                <Link href="/leaderboard" className="hover:text-blue-600 transition-colors">
                                    {t('leaderboard')}
                                </Link>
                                <Link href="/progress" className="hover:text-blue-600 transition-colors">
                                    {t('progress')}
                                </Link>
                            </nav>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language Switcher */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                    <Languages className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => switchLocale('vi')} className="cursor-pointer">
                                    🇻🇳 Tiếng Việt
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => switchLocale('en')} className="cursor-pointer">
                                    🇬🇧 English
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {isLoading ? (
                            <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-full" />
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative py-2"
                                    onMouseEnter={() => setIsOpen(true)}
                                    onMouseLeave={() => setIsOpen(false)}
                                >
                                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-10 w-auto p-0 hover:bg-transparent px-2 gap-2 rounded-full">
                                                <div className="text-sm font-medium text-gray-700 hidden sm:block">
                                                    {user.fullName || user.email?.split('@')[0]}
                                                </div>
                                                <Avatar className="h-9 w-9 border border-gray-200 shadow-sm transition-transform hover:scale-105 relative bg-blue-100">
                                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-bold flex items-center justify-center w-full h-full">
                                                        {user.fullName ? user.fullName[0].toUpperCase() : user.email?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                    {user.avatarUrl && (
                                                        <Image
                                                            src={user.avatarUrl}
                                                            alt="User Avatar"
                                                            fill
                                                            sizes="36px"
                                                            className="object-cover transition-opacity duration-300"
                                                            priority
                                                            unoptimized
                                                        />
                                                    )}
                                                </Avatar>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56" align="end" forceMount>
                                            <DropdownMenuLabel className="font-normal">
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{user.fullName || "User"}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <Link href="/profile" className="w-full cursor-pointer">
                                                <DropdownMenuItem className="cursor-pointer">
                                                    {t('profile')}
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href="/progress" className="w-full cursor-pointer">
                                                <DropdownMenuItem className="cursor-pointer">
                                                    {t('progress')}
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>{t('logout')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                                        {t('login')}
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-6 transition-transform hover:scale-105">
                                        {t('register')}
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
