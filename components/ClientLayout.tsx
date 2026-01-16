'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

import { Toaster } from 'react-hot-toast';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Hide header/footer on /exam, /login, /register routes, and /admin routes
    const shouldHideLayout = pathname?.startsWith('/exam') || pathname?.startsWith('/practice/room') || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password'

    return (
        <>
            <Toaster position="top-center" />
            {shouldHideLayout ? (
                children
            ) : (
                <>
                    <Navbar />
                    <main className="min-h-screen">
                        {children}
                    </main>
                    <Footer />
                </>
            )}
        </>
    )
}
