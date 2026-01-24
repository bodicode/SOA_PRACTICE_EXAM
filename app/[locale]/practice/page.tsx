import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCachedCategories } from '@/lib/categories'
import { getTranslations } from 'next-intl/server'
import ExamCategoryList from './exam-category-list'

export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-static'

async function CategoryListLoader() {
    const categories = await getCachedCategories()
    return <ExamCategoryList categories={categories} />
}

export default async function PracticePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'practice' })
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-[#003366] mb-8">
                    {t('title')}
                </h1>

                {/* Notice Box */}
                <div className="bg-gray-100 border-l-4 border-[#003366] p-6 mb-8">
                    <p className="text-gray-700 leading-relaxed">
                        {t('notice')}
                    </p>
                </div>

                {/* Group Study Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-12 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                            {t('groupStudy.title')}
                        </h2>
                        <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                            {t('groupStudy.description')}
                        </p>
                        <Link href="/practice/group">
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold border-0">
                                {t('groupStudy.button')}
                            </Button>
                        </Link>
                    </div>
                    {/* Decorative background circle */}
                    <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-10 right-20 w-32 h-32 bg-indigo-500/30 rounded-full blur-xl"></div>
                </div>

                {/* Description */}
                <div className="prose prose-lg max-w-none mb-12">
                    <p className="text-gray-700 leading-relaxed mb-4">
                        {t('description.p1')}
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        {t('description.p2')}
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        {t('description.p3')}
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        {t('description.p4')} <a href="mailto:29.hoang.10@gmail.com" className="text-[#0066cc] hover:underline">
                            29.hoang.10@gmail.com</a>.
                    </p>
                </div>

                {/* Exam Categories */}
                <h2 className="text-2xl font-bold text-[#003366] mb-6">
                    {t('chooseExam')}
                </h2>

                <Suspense fallback={<div className="text-center py-12">{t('loading')}</div>}>
                    <CategoryListLoader />
                </Suspense>

                {/* Reporting Errors Box */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-[#003366] mb-2">{t('reportError.title')}</h3>
                    <p className="text-gray-700 text-sm">
                        {t('reportError.content')} {' '}
                        <a href="mailto:errors@soapractice.vn" className="text-[#0066cc] hover:underline">
                            29.hoang.10@gmail.com
                        </a>.
                    </p>
                </div>
            </main>
        </div>
    )
}
