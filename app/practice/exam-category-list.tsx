'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryData } from '@/lib/categories'
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
    const { user } = useUserStore()
    const router = useRouter()
    const [showLoginDialog, setShowLoginDialog] = useState(false)

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
                                {exam.parentName ? `Thuộc: ${exam.parentName}` : 'Kỳ thi chính thức'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{exam.questionsCount} câu hỏi</span>
                            <Button
                                size="sm"
                                className="bg-[#003366] hover:bg-[#002244]"
                                onClick={() => handleStart(exam.id)}
                            >
                                Bắt đầu
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yêu cầu đăng nhập</DialogTitle>
                        <DialogDescription>
                            Bạn cần đăng nhập để bắt đầu làm bài thi thử. Tài khoản của bạn sẽ được lưu quá trình học tập.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                            Hủy
                        </Button>
                        <Link href="/login">
                            <Button onClick={() => setShowLoginDialog(false)}>
                                Đăng nhập ngay
                            </Button>
                        </Link>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
