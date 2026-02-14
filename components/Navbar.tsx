'use client'

import { Link } from '@/navigation'
import Image from 'next/image'
import { useRouter, usePathname } from '@/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { LogOut, Languages, Menu, X } from 'lucide-react'
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
import { ModeToggle } from './ui/mode-toggle'

export function Navbar() {
    const { user, isLoading, logout } = useUserStore()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()
    const t = useTranslations('nav')
    const [supabase] = useState(() => createClient())
    const [isOpen, setIsOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY

            if (currentScrollY > lastScrollY && currentScrollY > 100) {

                setIsVisible(false)
            } else {
                setIsVisible(true)
            }

            setLastScrollY(currentScrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileMenuOpen])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        setMobileMenuOpen(false)
        router.push('/login')
        router.refresh()
    }

    const switchLocale = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale })
    }

    const navLinks = user ? [
        { href: '/practice' as const, label: t('practice') },
        { href: '/leaderboard' as const, label: t('leaderboard') },
        { href: '/progress' as const, label: t('progress') },
        { href: '/community' as const, label: t('community') },
        { href: '/flashcards' as const, label: 'Flashcards' },
        { href: '/donate' as const, label: `❤ ${t('donate')}` },
    ] : []

    return (
        <>
            <header
                className={`sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="relative w-40 h-16 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                                    <Image
                                        src="/logo-light-theme.png"
                                        alt="SOA Prep Logo"
                                        width={160}
                                        height={64}
                                        priority
                                        className="w-full h-full object-contain object-center scale-[2.5] dark:hidden"
                                    />
                                    <Image
                                        src="/logo-dark-theme.png"
                                        alt="SOA Prep Logo"
                                        width={160}
                                        height={64}
                                        priority
                                        className="w-full h-full object-contain object-center scale-[2.5] hidden dark:block absolute inset-0"
                                    />
                                </div>
                            </Link>
                            {/* Desktop nav */}
                            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                                {navLinks.map(link => (
                                    <Link key={link.href} href={link.href} className={`hover:text-blue-600 transition-colors ${link.href === '/donate' ? 'hover:text-pink-500' : ''}`}>
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className="flex items-center gap-3">
                            <ModeToggle />
                            {/* Language Switcher */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                        <Languages className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => switchLocale('vi')} className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-5 h-4 overflow-hidden rounded-[2px] shadow-sm">
                                                <Image src="/vn.svg" alt="VN" fill className="object-cover" />
                                            </div>
                                            <span>Tiếng Việt</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => switchLocale('en')} className="cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-5 h-4 overflow-hidden rounded-[2px] shadow-sm">
                                                <Image src="/gb.svg" alt="UK" fill className="object-cover" />
                                            </div>
                                            <span>English</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            {isLoading ? (
                                <div className="w-24 h-9 bg-muted animate-pulse rounded-full" />
                            ) : user ? (
                                <div className="flex items-center gap-2">
                                    {/* User dropdown - desktop */}
                                    <div
                                        className="relative py-2 hidden md:block"
                                        onMouseEnter={() => setIsOpen(true)}
                                        onMouseLeave={() => setIsOpen(false)}
                                    >
                                        <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="relative h-10 w-auto p-0 hover:bg-transparent px-2 gap-2 rounded-full">
                                                    <div className="text-sm font-medium text-foreground hidden sm:block">
                                                        {user.fullName || user.email?.split('@')[0]}
                                                    </div>
                                                    <Avatar className="h-9 w-9 border border-border shadow-sm transition-transform hover:scale-105 relative bg-muted">
                                                        <AvatarFallback className="bg-muted text-foreground font-bold flex items-center justify-center w-full h-full">
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
                                    {/* Hamburger - mobile only */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 md:hidden"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    >
                                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="hidden sm:block">
                                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                                            {t('login')}
                                        </Button>
                                    </Link>
                                    <Link href="/register" className="hidden sm:block">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-6 transition-transform hover:scale-105">
                                            {t('register')}
                                        </Button>
                                    </Link>
                                    {/* Hamburger for non-logged-in mobile */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 sm:hidden"
                                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    >
                                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    {/* Drawer */}
                    <nav className="absolute top-20 left-0 right-0 bg-background border-b border-border shadow-xl max-h-[calc(100vh-5rem)] overflow-y-auto">
                        <div className="px-4 py-4 space-y-1">
                            {user ? (
                                <>
                                    {/* User info */}
                                    <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-muted/50">
                                        <Avatar className="h-10 w-10 border border-border shadow-sm bg-muted">
                                            <AvatarFallback className="bg-muted text-foreground font-bold">
                                                {user.fullName ? user.fullName[0].toUpperCase() : user.email?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                            {user.avatarUrl && (
                                                <Image
                                                    src={user.avatarUrl}
                                                    alt="User Avatar"
                                                    fill
                                                    sizes="40px"
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            )}
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{user.fullName || 'User'}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Nav links */}
                                    {navLinks.map(link => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}

                                    <div className="border-t border-border my-2" />

                                    <Link
                                        href="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                    >
                                        {t('profile')}
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        {t('logout')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                    >
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href="/register"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 text-center transition-colors"
                                    >
                                        {t('register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </>
    )
}
