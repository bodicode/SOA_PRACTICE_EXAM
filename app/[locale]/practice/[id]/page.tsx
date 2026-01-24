'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { examService, Category } from '@/services/exam.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, BookOpen, AlertCircle, PlayCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ExamModeSelectionPage() {
    const t = useTranslations('examSelection')
    const params = useParams()
    const router = useRouter()
    const categoryId = parseInt(params.id as string)

    const [category, setCategory] = useState<Category | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [questionCount, setQuestionCount] = useState<number>(10)
    const [timeLimit, setTimeLimit] = useState<number>(15)

    // Range Selection State
    const [rangeMode, setRangeMode] = useState(false)
    const [rangeStart, setRangeStart] = useState<number | string>(1)
    const [rangeEnd, setRangeEnd] = useState<number | string>(50) // Default max placeholder

    useEffect(() => {
        const fetchCategory = async () => {
            if (isNaN(categoryId)) return
            try {
                // Ideally backend provides an endpoint to get a single category
                // For now, fetching all and finding one (optimization needed in future)
                const categories = await examService.getCategories()
                const found = categories.find(c => c.id === categoryId)
                setCategory(found || null)
            } catch (error) {
                console.error('Failed to fetch category', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCategory()
    }, [categoryId])

    const startPractice = () => {
        if (!category) return

        let url = `/exam/${category.id}?mode=practice&limit=${timeLimit}&count=${questionCount}`

        if (rangeMode) {
            // Ensure valid numbers when starting
            const start = rangeStart === '' ? 1 : Number(rangeStart)
            const end = rangeEnd === '' ? (category.questionsCount || 50) : Number(rangeEnd)
            url += `&start=${start}&end=${end}`
        }

        router.push(url)
    }

    const startMockExam = () => {
        if (!category) return
        // Standard exam: 3 hours (180 mins), 30 questions (default standard)
        router.push(`/exam/${category.id}?mode=exam`)
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">{t('loading')}</div>
    if (!category) return <div className="min-h-screen flex items-center justify-center">{t('notFound')}</div>

    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/practice" className="text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-2">
                    {t('back')}
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{category.name}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>

                <Tabs defaultValue="practice" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-muted border border-border rounded-xl">
                        <TabsTrigger
                            value="practice"
                            className="flex flex-col gap-2 py-4 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent rounded-lg transition-all"
                        >
                            <Settings className="w-6 h-6" />
                            <div className="font-bold">{t('modes.practice.title')}</div>
                            <span className="text-xs font-normal text-muted-foreground">{t('modes.practice.desc')}</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="exam"
                            className="flex flex-col gap-2 py-4 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm border border-transparent rounded-lg transition-all"
                        >
                            <AlertCircle className="w-6 h-6" />
                            <div className="font-bold">{t('modes.exam.title')}</div>
                            <span className="text-xs font-normal text-muted-foreground">{t('modes.exam.desc')}</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="practice">
                        <Card className="border-t-4 border-t-green-500 shadow-md bg-card">
                            <CardHeader>
                                <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    {t('practice.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('practice.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground">{t('practice.modeLabel')}</h3>
                                    <Tabs defaultValue="random" onValueChange={(v) => {
                                        if (v === 'random') {
                                            setRangeMode(false)
                                        } else {
                                            setRangeMode(true)
                                        }
                                    }}>
                                        <TabsList className="w-full grid grid-cols-2 bg-muted">
                                            <TabsTrigger value="random" className="data-[state=active]:bg-card">{t('practice.random')}</TabsTrigger>
                                            <TabsTrigger value="range" className="data-[state=active]:bg-card">{t('practice.range')}</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {rangeMode && (
                                    <div className="grid grid-cols-2 gap-4 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                                        <div className="space-y-2">
                                            <Label>{t('practice.from')}</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={category.questionsCount}
                                                value={rangeStart}
                                                className="bg-background"
                                                onChange={(e) => {
                                                    const valStr = e.target.value
                                                    if (valStr === '') {
                                                        setRangeStart('')
                                                        return
                                                    }
                                                    let val = parseInt(valStr)
                                                    if (isNaN(val)) return
                                                    if (val > category.questionsCount) val = category.questionsCount
                                                    setRangeStart(val)
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('practice.to')}</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={category.questionsCount}
                                                value={rangeEnd}
                                                onChange={(e) => {
                                                    const valStr = e.target.value
                                                    if (valStr === '') {
                                                        setRangeEnd('')
                                                        return
                                                    }
                                                    let val = parseInt(valStr)
                                                    if (isNaN(val)) return
                                                    if (val > category.questionsCount) val = category.questionsCount
                                                    setRangeEnd(val)
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-xs text-yellow-800 dark:text-yellow-500">
                                                {t('practice.rangeDesc', { count: questionCount, start: rangeStart || 1, end: rangeEnd || category.questionsCount })}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{t('practice.countLabel')}</Label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min={1}
                                                max={rangeMode ? ((typeof rangeEnd === 'number' ? rangeEnd : category.questionsCount) - (typeof rangeStart === 'number' ? rangeStart : 1) + 1) : 100}
                                                value={questionCount}
                                                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
                                                className="pl-10 bg-background"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Tối đa: {rangeMode ? ((typeof rangeEnd === 'number' ? rangeEnd : category.questionsCount) - (typeof rangeStart === 'number' ? rangeStart : 1) + 1) : category.questionsCount} {t('practice.maxSuffix')}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t('practice.timeLabel')}</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min={1}
                                                max={300}
                                                value={timeLimit}
                                                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                                                className="pl-10 bg-background"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t('practice.timeHint')}</p>
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-sm text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900/30">
                                    💡 <strong>{t('practice.tipTitle')}</strong> {t('practice.tipDesc')}
                                </div>

                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12" onClick={startPractice}>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    {t('practice.startBtn')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="exam">
                        <Card className="border-t-4 border-t-red-500 shadow-md bg-card">
                            <CardHeader>
                                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    {t('exam.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('exam.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-foreground">30</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">{t('exam.stats.questions')}</div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-foreground">180</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">{t('exam.stats.minutes')}</div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-foreground">70%</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">{t('exam.stats.passingScore')}</div>
                                    </div>
                                    <div className="bg-muted p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-foreground">CBT</div>
                                        <div className="text-xs text-muted-foreground uppercase font-semibold">{t('exam.stats.interface')}</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw('exam.rules.1') }} />
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-muted-foreground">{t('exam.rules.2')}</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">3</div>
                                        <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.raw('exam.rules.3') }} />
                                    </div>
                                </div>

                                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12" onClick={startMockExam}>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    {t('exam.startBtn')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
