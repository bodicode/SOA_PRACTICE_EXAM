'use client'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function PracticePage() {
    const { user } = useUserStore()

    const examCategories = [
        { id: 'p', name: 'Exam P - Probability', questions: 850, description: 'Xác suất cơ bản và ứng dụng' },
        { id: 'fm', name: 'Exam FM - Financial Mathematics', questions: 720, description: 'Toán tài chính và lãi suất' },
        { id: 'ifm', name: 'Exam IFM - Investment & Financial Markets', questions: 540, description: 'Thị trường đầu tư và tài chính' },
        { id: 'ltam', name: 'Exam LTAM - Long-Term Actuarial Mathematics', questions: 480, description: 'Toán bảo hiểm nhân thọ' },
        { id: 'stam', name: 'Exam STAM - Short-Term Actuarial Mathematics', questions: 420, description: 'Toán bảo hiểm phi nhân thọ' },
        { id: 'pa', name: 'Exam PA - Predictive Analytics', questions: 180, description: 'Phân tích dự đoán' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-[#003366] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-white/20 rounded flex items-center justify-center">
                                    <span className="text-xl">🛡️</span>
                                </div>
                                <div>
                                    <div className="font-bold text-sm">SOA EXAM</div>
                                    <div className="text-xs text-white/70">PRACTICE</div>
                                </div>
                            </Link>
                            <nav className="hidden md:flex items-center gap-6 text-sm">
                                <Link href="/practice" className="hover:text-blue-200 transition-colors border-b-2 border-white pb-1">
                                    Đề Thi Mẫu
                                </Link>
                                <Link href="/exams" className="hover:text-blue-200 transition-colors">
                                    Các Kỳ Thi
                                </Link>
                                <Link href="/resources" className="hover:text-blue-200 transition-colors">
                                    Tài Liệu
                                </Link>
                                <Link href="/community" className="hover:text-blue-200 transition-colors">
                                    Cộng Đồng
                                </Link>
                                <Link href="/about" className="hover:text-blue-200 transition-colors">
                                    Giới Thiệu
                                </Link>
                            </nav>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-white/80 hidden sm:block">{user.fullName || user.email}</span>
                                    <Button size="sm" className="bg-[#0066cc] hover:bg-[#0055aa] text-white">
                                        Tài khoản
                                    </Button>
                                </div>
                            ) : (
                                <Link href="/login">
                                    <Button size="sm" className="bg-[#0066cc] hover:bg-[#0055aa] text-white">
                                        Đăng nhập / My SOA
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

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

                <div className="grid md:grid-cols-2 gap-4">
                    {examCategories.map((exam) => (
                        <Card key={exam.id} className="hover:shadow-lg transition-shadow border-l-4 border-[#0066cc]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[#003366] text-lg">{exam.name}</CardTitle>
                                <CardDescription>{exam.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">{exam.questions} câu hỏi</span>
                                <Link href={`/practice/${exam.id}`}>
                                    <Button size="sm" className="bg-[#003366] hover:bg-[#002244]">
                                        Bắt đầu
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>

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

            {/* Footer */}
            <footer className="bg-[#003366] text-white py-8 mt-16">
                <div className="max-w-5xl mx-auto px-4 text-center text-sm text-white/70">
                    <p>© 2024 SOA Exam Practice Vietnam. Mọi quyền được bảo lưu.</p>
                    <p className="mt-2">
                        <Link href="/privacy" className="hover:text-white">Chính sách bảo mật</Link>
                        {' • '}
                        <Link href="/terms" className="hover:text-white">Điều khoản sử dụng</Link>
                        {' • '}
                        <Link href="/contact" className="hover:text-white">Liên hệ</Link>
                    </p>
                </div>
            </footer>
        </div>
    )
}
