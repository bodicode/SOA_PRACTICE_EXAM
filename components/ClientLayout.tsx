'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Hide header/footer on /exam, /login, /register routes, and /admin routes
    const shouldHideLayout = pathname?.startsWith('/exam') || pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/register'

    if (shouldHideLayout) {
        return <>{children}</>
    }

    return (
        <>
            <Navbar />
            {/* Main content wrapper with top padding to account for fixed navbar */}
            <main className="min-h-screen">
                {children}
            </main>
            <Footer />
        </>
    )
}
