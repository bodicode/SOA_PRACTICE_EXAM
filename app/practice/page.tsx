import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getCachedCategories } from '@/lib/categories'
import ExamCategoryList from './exam-category-list'

export const revalidate = 3600 // Revalidate every hour
export const dynamic = 'force-static'

async function CategoryListLoader() {
    const categories = await getCachedCategories()
    return <ExamCategoryList categories={categories} />
}

export default function PracticePage() {
    return (
        <div className="min-h-screen bg-gray-50">
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

                {/* Group Study Banner */}
                <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-12 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                            👥 Ôn Tập Nhóm (Group Study)
                        </h2>
                        <p className="text-blue-100 text-lg mb-6 max-w-2xl">
                            Mời bạn bè cùng tham gia giải đề. Chế độ đồng bộ thời gian thực giúp nhóm của bạn thảo luận và học tập hiệu quả hơn bao giờ hết.
                        </p>
                        <Link href="/practice/group">
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold border-0">
                                Tham Gia Ngay
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
                        với chúng tôi qua <a href="mailto:29.hoang.10@gmail.com" className="text-[#0066cc] hover:underline">
                            29.hoang.10@gmail.com</a>.
                    </p>
                </div>

                {/* Exam Categories */}
                <h2 className="text-2xl font-bold text-[#003366] mb-6">
                    Chọn Kỳ Thi Để Bắt Đầu
                </h2>

                <Suspense fallback={<div className="text-center py-12">Đang tải dữ liệu...</div>}>
                    <CategoryListLoader />
                </Suspense>

                {/* Reporting Errors Box */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-[#003366] mb-2">Báo Lỗi:</h3>
                    <p className="text-gray-700 text-sm">
                        Nếu bạn tìm thấy lỗi có thể xảy ra trong câu hỏi hoặc đáp án, vui lòng chụp màn hình
                        câu hỏi cùng với lời giải của bạn và gửi cho chúng tôi qua{' '}
                        <a href="mailto:errors@soapractice.vn" className="text-[#0066cc] hover:underline">
                            29.hoang.10@gmail.com
                        </a>. Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
                    </p>
                </div>
            </main>
        </div>
    )
}
