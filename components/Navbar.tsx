'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
    const { user, isLoading, logout } = useUserStore()
    const router = useRouter()
    const supabase = createClient()
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        logout()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                                <span className="text-white text-lg font-bold">S</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 tracking-tight">SOA Prep</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                            <Link href="/exams" className="hover:text-blue-600 transition-colors">
                                Danh Mục Đề Thi
                            </Link>
                            <Link href="/progress" className="hover:text-blue-600 transition-colors">
                                Tiến độ học tập
                            </Link>
                            <Link href="/pricing" className="hover:text-blue-600 transition-colors">
                                Bảng Giá
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading ? (
                            <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-full" />
                        ) : user ? (
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative py-2" // Add padding to bridge gap for hover
                                    onMouseEnter={() => setIsOpen(true)}
                                    onMouseLeave={() => setIsOpen(false)}
                                >
                                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-700 hidden sm:block whitespace-nowrap">
                                                        {user.fullName || user.email?.split('@')[0]}
                                                    </span>
                                                </div>
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
                                                    Hồ sơ cá nhân
                                                </DropdownMenuItem>
                                            </Link>
                                            <Link href="/progress" className="w-full cursor-pointer">
                                                <DropdownMenuItem className="cursor-pointer">
                                                    Tiến độ học tập
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                <span>Đăng xuất</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                                        Đăng Nhập
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-6 transition-transform hover:scale-105">
                                        Đăng Ký
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
