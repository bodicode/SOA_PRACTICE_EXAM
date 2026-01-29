'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, History, Loader2 } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { useProgressStore } from '@/stores/progressStore'
import { useTranslations, useFormatter } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ExamSession {
    id: number
    mode: string
    startTime: string
    totalScore: number
    questionCount?: number
    categoryId: number | null
}

const LIMIT = 10;

function HistoryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useUserStore()
    const { fetchHistoryList, historyCache } = useProgressStore()
    const t = useTranslations('progress')
    const format = useFormatter()

    // State
    const [history, setHistory] = useState<ExamSession[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)

    // Derived state from URL (Filters)
    const filterCategory = searchParams.get('categoryId') || 'all'
    const sortOrder = searchParams.get('sort') || 'time_desc'

    // Reset when Filters Change (Reset page to 1)
    useEffect(() => {
        setPage(1)
    }, [filterCategory, sortOrder])

    // Main Data Fetching Effect
    useEffect(() => {
        if (!user || isNaN(Number(user.id))) return;

        let isActive = true;

        const loadData = async () => {
            const params: any = {
                userId: user.id,
                page,
                limit: LIMIT,
                sort: sortOrder
            }

            if (filterCategory !== 'all') {
                params.categoryId = filterCategory;
            }

            // SWR Logic
            const cacheKey = JSON.stringify(params)
            const cachedData = historyCache[cacheKey]

            // 1. Check Cache
            if (cachedData) {
                if (isActive) {
                    setHistory(cachedData.data)
                    setTotalPages(cachedData.meta.totalPages)
                    setLoading(false)
                }
            } else {
                if (isActive) setLoading(true)
            }

            // 2. Fetch Network (If not cached)
            try {
                // If we have cache, we don't force fetch to avoid "jumping" or "lag".
                // We trust the cache for history (unless explicitly refreshed, but history is mostly static).
                const shouldFetch = !cachedData;

                if (shouldFetch) {
                    const data = await fetchHistoryList(params, false)

                    if (isActive && data && data.data) {
                        setHistory(data.data)
                        setTotalPages(data.meta.totalPages)
                    }
                }
            } catch (err) {
                console.error(err)
            } finally {
                if (isActive) setLoading(false)
            }
        }

        loadData();

        return () => { isActive = false }
    }, [page, filterCategory, sortOrder, user, fetchHistoryList]) // Removed historyCache from dep

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const updateParams = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams.toString())
        if (value === 'all' && key === 'categoryId') {
            newParams.delete('categoryId')
        } else {
            newParams.set(key, value)
        }
        router.push(`/progress/history?${newParams.toString()}`)
    }

    const handleFilterChange = (val: string) => updateParams('categoryId', val)
    const handleSortChange = (val: string) => updateParams('sort', val)

    return (
        <div className="min-h-screen bg-background p-6 md:p-10 font-sans text-foreground">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">{t('history.title')}</h1>
                            <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Select value={filterCategory} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('history.filters.allExams')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('history.filters.allExams')}</SelectItem>
                                <SelectItem value="1">{t('history.filters.examP')}</SelectItem>
                                <SelectItem value="2">{t('history.filters.examFM')}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={sortOrder} onValueChange={handleSortChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('history.sort.sortBy')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="time_desc">{t('history.sort.newest')}</SelectItem>
                                <SelectItem value="time_asc">{t('history.sort.oldest')}</SelectItem>
                                <SelectItem value="score_high">{t('history.sort.highScore')}</SelectItem>
                                <SelectItem value="score_low">{t('history.sort.lowScore')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.length > 0 ? history.map((session: ExamSession) => {
                            const total = session.questionCount || 0;
                            const score = Number(session.totalScore || 0);
                            const scale10 = total > 0 ? (score / total) * 10 : 0;
                            const percentage = total > 0 ? (score / total) * 100 : 0;
                            const isPassed = percentage >= 70;

                            return (
                                <Card key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-none shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {session.mode === 'exam' ? `${t('history.examPrefix')} #${session.id}` : `${t('history.practicePrefix')} #${session.id}`}
                                            </h3>
                                            <div className="text-sm text-muted-foreground flex gap-2">
                                                <span>
                                                    {format.dateTime(new Date(session.startTime), { dateStyle: 'medium', timeStyle: 'medium' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left sm:text-right shrink-0">
                                        <div className="text-2xl font-bold font-mono">
                                            {scale10.toFixed(1)}<span className="text-sm text-muted-foreground font-sans">/10</span>
                                        </div>
                                        <div className={`text-xs font-bold uppercase tracking-wider ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                                            {isPassed ? t('history.passStatus') : t('history.failStatus')}
                                        </div>
                                    </div>
                                </Card>
                            )
                        }) : (
                            <div className="text-center py-12 text-muted-foreground">
                                {t('history.empty')}
                            </div>
                        )}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && history.length > 0 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => handlePageChange(page - 1)}
                        >
                            {t('history.pagination.previous')}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {t('history.pagination.page')} {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                        >
                            {t('history.pagination.next')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function HistoryPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
            <HistoryContent />
        </Suspense>
    )
}
