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

export default function ExamModeSelectionPage() {
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

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>
    if (!category) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy kỳ thi</div>

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/practice" className="text-gray-500 hover:text-[#003366] mb-6 inline-flex items-center gap-2">
                    ← Quay lại danh sách
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#003366] mb-2">{category.name}</h1>
                    <p className="text-gray-600">Chọn chế độ thi để bắt đầu làm bài</p>
                </div>

                <Tabs defaultValue="practice" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1 bg-white border border-gray-200 rounded-xl">
                        <TabsTrigger
                            value="practice"
                            className="flex flex-col gap-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-[#003366] data-[state=active]:border-blue-200 border border-transparent rounded-lg transition-all"
                        >
                            <Settings className="w-6 h-6" />
                            <div className="font-bold">Luyện Tập Linh Hoạt (Practice Mode)</div>
                            <span className="text-xs font-normal text-gray-500">Tùy chỉnh số câu & thời gian</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="exam"
                            className="flex flex-col gap-2 py-4 data-[state=active]:bg-blue-50 data-[state=active]:text-[#003366] data-[state=active]:border-blue-200 border border-transparent rounded-lg transition-all"
                        >
                            <AlertCircle className="w-6 h-6" />
                            <div className="font-bold">Thi Thử (Exam Mode)</div>
                            <span className="text-xs font-normal text-gray-500">Giả lập thi thật (CBT)</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="practice">
                        <Card className="border-t-4 border-t-green-500 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-green-700 flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Cấu Hình Bài Luyện Tập
                                </CardTitle>
                                <CardDescription>
                                    Chọn số lượng câu hỏi và thời gian bạn muốn dành cho bài luyện tập này.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700">Chế độ chọn câu hỏi</h3>
                                    <Tabs defaultValue="random" onValueChange={(v) => {
                                        if (v === 'random') {
                                            setRangeMode(false)
                                        } else {
                                            setRangeMode(true)
                                        }
                                    }}>
                                        <TabsList className="w-full grid grid-cols-2">
                                            <TabsTrigger value="random">Ngẫu nhiên toàn bộ</TabsTrigger>
                                            <TabsTrigger value="range">Tùy chỉnh phạm vi</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {rangeMode && (
                                    <div className="grid grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <div className="space-y-2">
                                            <Label>Từ câu</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={category.questionsCount}
                                                value={rangeStart}
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
                                            <Label>Đến câu</Label>
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
                                            <p className="text-xs text-yellow-800">
                                                Hệ thống sẽ chọn ngẫu nhiên {questionCount} câu hỏi trong phạm vi từ câu {rangeStart || 1} đến câu {rangeEnd || category.questionsCount}.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Số lượng câu muốn làm</Label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="number"
                                                min={1}
                                                max={rangeMode ? ((typeof rangeEnd === 'number' ? rangeEnd : category.questionsCount) - (typeof rangeStart === 'number' ? rangeStart : 1) + 1) : 100}
                                                value={questionCount}
                                                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 0)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Tối đa: {rangeMode ? ((typeof rangeEnd === 'number' ? rangeEnd : category.questionsCount) - (typeof rangeStart === 'number' ? rangeStart : 1) + 1) : category.questionsCount} câu
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Thời gian (phút)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="number"
                                                min={1}
                                                max={300}
                                                value={timeLimit}
                                                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">Đề xuất: 2-3 phút/câu</p>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800 border border-green-200">
                                    💡 <strong>Mẹo:</strong> Chế độ này phù hợp để ôn tập theo chủ đề hoặc tranh thủ luyện tập trong thời gian ngắn.
                                </div>

                                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg h-12" onClick={startPractice}>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Bắt Đầu Luyện Tập
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="exam">
                        <Card className="border-t-4 border-t-red-500 shadow-md">
                            <CardHeader>
                                <CardTitle className="text-red-700 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Thông Tin Bài Thi Chuẩn
                                </CardTitle>
                                <CardDescription>
                                    Chế độ này mô phỏng chính xác áp lực và quy định của kỳ thi thật.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">30</div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Câu hỏi</div>
                                    </div>
                                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">180</div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Phút</div>
                                    </div>
                                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">70%</div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Điểm đỗ</div>
                                    </div>
                                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-900">CBT</div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Giao diện</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">1</div>
                                        <p className="text-sm text-gray-700">Thời gian sẽ <strong>không thể tạm dừng</strong> một khi đã bắt đầu.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">2</div>
                                        <p className="text-sm text-gray-700">Bạn có thể đánh dấu (flag) các câu hỏi để xem lại sau.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">3</div>
                                        <p className="text-sm text-gray-700">Kết quả sẽ được tính vào <strong>Ranking System</strong> của hệ thống.</p>
                                    </div>
                                </div>

                                <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12" onClick={startMockExam}>
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Bắt Đầu Thi Thử
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
