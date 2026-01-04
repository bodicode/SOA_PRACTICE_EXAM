'use client'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { Category, examService } from '@/services/exam.service'

export default function PracticePage() {
    const { user } = useUserStore()
    const [examCategories, setExamCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await examService.getCategories()
                // Filter only main exams if structure implies hierarchy, or display all. 
                // Assuming top-level categories are exams for now.
                setExamCategories(data)
            } catch (error) {
                console.error('Failed to fetch categories:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchCategories()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}


            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-[#003366] mb-8">
                    Đề Thi Mẫu Trực Tuyến
                </h1>

                {/* Notice Box */}
                <div className="bg-gray-100 border-l-4 border-[#003366] p-6 mb-8">
                    <p className="text-gray-700 leading-relaxed">
                        Chào mừng bạn đến với hệ thống luyện thi SOA trực tuyến. Đội ngũ của chúng tôi liên tục
                        cập nhật ngân hàng câu hỏi để phù hợp với format thi mới nhất. Nếu bạn gặp bất kỳ vấn đề
                        kỹ thuật nào, vui lòng liên hệ với chúng tôi qua email hỗ trợ.
                    </p>
                </div>

                {/* Description */}
                <div className="prose prose-lg max-w-none mb-12">
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Hội Actuary Việt Nam (SOA Practice) cam kết hỗ trợ các ứng viên trong quá trình chuẩn bị
                        cho các kỳ thi sơ cấp. Để đạt được mục tiêu này, chúng tôi cung cấp các bài thi mẫu trực
                        tuyến cho một số kỳ thi sơ cấp. <strong>Hoàn toàn miễn phí</strong>, các bài thi mẫu này
                        lựa chọn câu hỏi và lời giải trong môi trường thi trực tuyến mô phỏng gần nhất với format
                        thi thực tế của SOA.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Các câu hỏi đã được mã hóa để đáp ứng các mục tiêu học tập của kỳ thi và đảm bảo ứng viên
                        nhận được bộ câu hỏi cân bằng nhưng được xáo trộn ngẫu nhiên mỗi lần họ làm bài thi mẫu.
                        Các câu hỏi hiện tại được lấy từ nguồn câu hỏi mẫu chính thức.
                    </p>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        Quy trình được sử dụng để tạo ra các bài thi actuary của SOA từ một ngân hàng câu hỏi lớn
                        rất phức tạp và tính đến nhiều yếu tố khác nhau, bao gồm độ khó tổng thể của bài thi và
                        mức độ bao phủ của các mục tiêu học tập. <span className="text-[#0066cc]">Do đó, trong khi
                            nằm trong phạm vi các mục tiêu học tập của kỳ thi, các câu hỏi trong những bài thi mẫu này
                            có thể không đại diện cho độ khó trung bình của một bài thi thực tế.</span>
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        Nếu bạn có câu hỏi hoặc gặp khó khăn kỹ thuật với bài thi mẫu trực tuyến, vui lòng liên hệ
                        với chúng tôi qua <a href="mailto:support@soapractice.vn" className="text-[#0066cc] hover:underline">
                            support@soapractice.vn</a>.
                    </p>
                </div>

                {/* Exam Categories */}
                <h2 className="text-2xl font-bold text-[#003366] mb-6">
                    Chọn Kỳ Thi Để Bắt Đầu
                </h2>

                {isLoading ? (
                    <div className="text-center py-12">Đang tải dữ liệu...</div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {examCategories.map((exam) => (
                            <Card key={exam.id} className="hover:shadow-lg transition-shadow border-l-4 border-[#0066cc]">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[#003366] text-lg">{exam.name}</CardTitle>
                                    <CardDescription>
                                        {/* Since description isn't in Category interface, we might need to map it or omit it for now */}
                                        {exam.parentName ? `Thuộc: ${exam.parentName}` : 'Kỳ thi chính thức'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">{exam.questionsCount} câu hỏi</span>
                                    {/* Pass the ID to the dynamic route */}
                                    <Link href={`/practice/${exam.id}`}>
                                        <Button size="sm" className="bg-[#003366] hover:bg-[#002244]">
                                            Bắt đầu
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Reporting Errors Box */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-[#003366] mb-2">Báo Lỗi:</h3>
                    <p className="text-gray-700 text-sm">
                        Nếu bạn tìm thấy lỗi có thể xảy ra trong câu hỏi hoặc đáp án, vui lòng chụp màn hình
                        câu hỏi cùng với lời giải của bạn và gửi cho chúng tôi qua{' '}
                        <a href="mailto:errors@soapractice.vn" className="text-[#0066cc] hover:underline">
                            errors@soapractice.vn
                        </a>. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
                    </p>
                </div>
            </main>


        </div>
    )
}
