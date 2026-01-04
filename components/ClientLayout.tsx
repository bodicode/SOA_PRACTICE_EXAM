'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    // Hide header/footer on /exam routes
    const isExamPage = pathname?.startsWith('/exam')

    if (isExamPage) {
        return <>{children}</>
    }

    return (
        <>
            <Navbar />
            {/* Main content wrapper with top padding to account for fixed navbar */}
            <main className="min-h-screen pt-16">
                {children}
            </main>
            <Footer />
        </>
    )
}
