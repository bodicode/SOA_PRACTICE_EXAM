'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function Footer() {
    const t = useTranslations('footer')

    return (
        <footer className="py-12 border-t border-border bg-muted/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="relative w-40 h-16 flex items-center justify-center overflow-hidden">
                            <img
                                src="/logo-light-theme.png"
                                alt="SOA Prep Logo"
                                className="w-full h-full object-contain object-center scale-[2.5] dark:hidden"
                            />
                            <img
                                src="/logo-dark-theme.png"
                                alt="SOA Prep Logo"
                                className="w-full h-full object-contain object-center scale-[2.5] hidden dark:block absolute inset-0"
                            />
                        </div>
                    </div>
                    <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-muted-foreground">
                        <Link href="/support" className="hover:text-blue-600 transition-colors">{t('support')}</Link>
                        <Link href="/exams" className="hover:text-blue-600 transition-colors">{t('exams')}</Link>
                        <Link href="/terms" className="hover:text-blue-600 transition-colors">{t('terms')}</Link>
                        <Link href="/privacy" className="hover:text-blue-600 transition-colors">{t('privacy')}</Link>
                    </nav>
                    <div className="text-sm text-muted-foreground/80">
                        {t('rights')}
                    </div>
                </div>
            </div>
        </footer>
    )
}
