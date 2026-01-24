'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryData } from '@/lib/categories'
import { useTranslations } from 'next-intl'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ExamCategoryListProps {
    categories: CategoryData[]
}

export default function ExamCategoryList({ categories }: ExamCategoryListProps) {
    const t = useTranslations('examSelection.practice.list')
    const { user } = useUserStore()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [showLoginDialog, setShowLoginDialog] = useState(false)
    const hasRedirected = useRef(false)

    useEffect(() => {
        const examParam = searchParams.get('exam')
        if (examParam && !hasRedirected.current) {
            const targetCategory = categories.find(c =>
                c.name.toLowerCase().includes(examParam.toLowerCase())
            )

            if (targetCategory) {
                hasRedirected.current = true
                console.log(`Redirecting to exam ${examParam}:`, targetCategory)
                router.push(`/practice/${targetCategory.id}`)
            }
        }
    }, [searchParams, categories, router])

    const handleStart = (examId: number) => {
        if (!user) {
            setShowLoginDialog(true)
        } else {
            router.push(`/practice/${examId}`)
        }
    }

    return (
        <>
            <div className="grid md:grid-cols-2 gap-4">
                {categories.map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow border-l-4 border-[#0066cc]">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[#003366] text-lg">{exam.name}</CardTitle>
                            <CardDescription>
                                {exam.parentName ? `${t('belongsTo')}: ${exam.parentName}` : t('official')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{exam.questionsCount} {t('questions')}</span>
                            <Button
                                size="sm"
                                className="bg-[#003366] hover:bg-[#002244]"
                                onClick={() => handleStart(exam.id)}
                            >
                                {t('start')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('loginTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('loginDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                            {t('cancel')}
                        </Button>
                        <Link href="/login">
                            <Button onClick={() => setShowLoginDialog(false)}>
                                {t('loginBtn')}
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
