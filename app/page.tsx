'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, BarChart2, BookOpen, Target, LogOut, LayoutDashboard, ChevronRight, Star, Sparkles, Zap, Users } from 'lucide-react'
import { HeroSection } from '@/components/HeroSection'
import { HomeProgress } from '@/components/HomeProgress'

export default function Home() {
  const { user, isLoading } = useUserStore()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}


      {/* Hero Section */}
      <section className="pt-8 pb-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-[#1e293b] rounded-[2rem] p-8 md:p-16 overflow-hidden shadow-2xl">
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900/60 to-slate-900/90" />
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 L0 0 L100 0 Z" fill="url(#gradHero)" />
                <defs>
                  <linearGradient id="gradHero" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Abstract Blobs */}
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="relative z-10 max-w-3xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight font-display">
                Luyện Thi SOA <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Chinh Phục Chứng Chỉ Actuary</span>
              </h1>

              <p className="text-lg md:text-xl text-blue-100/80 mb-10 leading-relaxed max-w-2xl">
                Mô phỏng điều kiện thi thực tế với các bài luyện tập toàn diện cho Exam P, FM. Theo dõi tiến độ và tối ưu điểm số hiệu quả.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/practice">
                  <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 rounded-xl transition-all hover:scale-105 active:scale-95 font-semibold">
                    <Zap className="w-5 h-5 mr-2 fill-current" />
                    Bắt Đầu Luyện Thi
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95 font-semibold">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Xem Tiến Độ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Progress Section (Logged In) */}
      {user && <HomeProgress />}

      {/* Features Section */}
      <section className="pt-10 py-20 relative overflow-hidden bg-white">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob" />
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tính năng vượt trội</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight"
            >
              Tại Sao Bạn Nên Chọn <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">SOA Prep</span>?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mx-auto leading-relaxed"
            >
              Chúng tôi kết hợp công nghệ AI tiên tiến với kiến thức chuyên sâu từ các Actuary hàng đầu<br className="hidden md:block" /> để mang đến trải nghiệm ôn thi hiệu quả nhất.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              {
                icon: <BookOpen className="w-8 h-8 text-white" />,
                bg: "bg-blue-600",
                shadow: "shadow-blue-600/30",
                title: "Kho Bài Luyện Thi",
                desc: "Hàng ngàn câu hỏi được phân loại theo chủ đề, độ khó, giúp bạn tập trung vào từng mảng kiến thức cụ thể."
              },
              {
                icon: <Target className="w-8 h-8 text-white" />,
                bg: "bg-indigo-600",
                shadow: "shadow-indigo-600/30",
                title: "Thi Thử Thực Tế",
                desc: "Mô phỏng kỳ thi CBT thật với áp lực thời gian, giúp bạn làm quen và tự tin trước khi bước vào phòng thi."
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-white" />,
                bg: "bg-violet-600",
                shadow: "shadow-violet-600/30",
                title: "Theo Dõi Tiến Độ",
                desc: "Biểu đồ trực quan thống kê lịch sử làm bài, phân tích điểm mạnh yếu để tối ưu lộ trình ôn luyện."
              },
              {
                icon: <Users className="w-8 h-8 text-white" />,
                bg: "bg-pink-600",
                shadow: "shadow-pink-600/30",
                title: "Phòng Ôn Thi Chung",
                desc: "Tạo hoặc tham gia phòng học nhóm, cùng nhau rèn luyện, chia sẻ kiến thức và tạo động lực học tập."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
                whileHover={{ y: -8 }}
                className="group relative bg-white p-8 lg:p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-[10rem] opacity-50 group-hover:scale-110 transition-transform duration-500" />

                <div className={`relative w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center shadow-lg ${feature.shadow} mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {feature.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Programs Section - Deep SEO for Exam P & FM */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 font-semibold tracking-wider uppercase text-sm">Chương Trình Luyện Thi</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">Các Kỳ Thi SOA Trọng Tâm</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tập trung ôn luyện vào các chủ đề cốt lõi. Ngân hàng câu hỏi của chúng tôi bao phủ 100% syllabus mới nhất.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Exam P Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:border-blue-200 transition-colors relative overflow-hidden group h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 font-bold text-xl">P</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Exam P - Probability</h3>
                <p className="text-gray-600 mb-6 line-clamp-2">
                  Chinh phục môn Xác Suất. Bao gồm các chủ đề: Biến ngẫu nhiên, Phân phối xác suất (Univariate & Multivariate), Risk Management.
                </p>
                <div className="space-y-3 mb-8">
                  {['General Probability', 'Univariate Random Variables', 'Multivariate Random Variables'].map((topic) => (
                    <div key={topic} className="flex items-center text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {topic}
                    </div>
                  ))}
                </div>
                <Link href="/practice?exam=P" className="mt-auto">
                  <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white transition-colors">
                    Luyện Đề Exam P
                  </Button>
                </Link>
              </div>
            </div>

            {/* Exam FM Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 hover:border-indigo-200 transition-colors relative overflow-hidden group h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600 font-bold text-xl">FM</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Exam FM - Financial Math</h3>
                <p className="text-gray-600 mb-6 line-clamp-2">
                  Làm chủ Toán Tài Chính. Các chủ đề cốt lõi: Time Value of Money, Niên kim (Annuities), Trái phiếu (Bonds), Quản lý rủi ro lãi suất.
                </p>
                <div className="space-y-3 mb-8">
                  {['Time Value of Money', 'Annuities & Cash Flows', 'Loans & Bonds', 'Immunization'].map((topic) => (
                    <div key={topic} className="flex items-center text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {topic}
                    </div>
                  ))}
                </div>
                <Link href="/practice?exam=FM" className="mt-auto">
                  <Button className="w-full bg-slate-900 hover:bg-indigo-600 text-white transition-colors">
                    Luyện Đề Exam FM
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      < section className="py-24 overflow-hidden" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-blue-600 rounded-3xl p-12 lg:p-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8">
                  <span className="text-4xl">❝</span>
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                  "Tôi đã trượt Exam P hai lần trước khi biết đến SOA Prep. Phương pháp học thích ứng đã giúp tôi lấy lại căn bản và đỗ với điểm 9!"
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg border border-white/30">
                    AN
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg">Nguyễn Phước Thịnh</div>
                    <div className="text-blue-200">Associate of the Society of Actuaries (ASA)</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 max-w-sm">
                  <div className="flex items-center gap-2 mb-4 text-white">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/90 mb-4">
                    Được tin dùng bởi hơn 5,000 học viên Actuary trên toàn thế giới.
                  </p>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-0 font-bold">
                    Tham Gia Cộng Đồng Ngay
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* FAQ Section - SEO Optimization */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Câu Hỏi Thường Gặp Về Luyện Thi SOA</h2>
            <p className="text-lg text-gray-600">Giải đáp thắc mắc cho người mới bắt đầu hành trình Actuary</p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">SOA là gì và chứng chỉ này dành cho ai?</h3>
              <p className="text-gray-600 leading-relaxed">
                SOA (Society of Actuaries) là Hiệp hội Định phí Hoa Kỳ. Các kỳ thi SOA (như Exam P, FM) là bước khởi đầu bắt buộc để trở thành chuyên gia định phí (Actuary) - một trong những nghề nghiệp có thu nhập cao nhất thế giới, dành cho nhân sự ngành Toán, Thống kê, Tài chính và Bảo hiểm.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tôi nên bắt đầu luyện thi SOA từ Exam nào?</h3>
              <p className="text-gray-600 leading-relaxed">
                Hầu hết ứng viên bắt đầu với <strong>Exam P (Probability)</strong> hoặc <strong>Exam FM (Financial Mathematics)</strong>. Tại SOA Exam Practice, chúng tôi cung cấp ngân hàng câu hỏi thích ứng (Adaptive Learning) cho cả hai kỳ thi này để giúp bạn tối ưu hóa thời gian ôn luyện.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Học phí và lệ phí thi SOA là bao nhiêu?</h3>
              <p className="text-gray-600 leading-relaxed">
                Lệ phí thi chính thức của SOA thường dao động từ $250 - $350/exam (có giảm cho sinh viên). Về chi phí ôn luyện, SOA Prep cung cấp các gói luyện đề với chi phí tiết kiệm hơn 80% so với sách giáo khoa truyền thống, đồng thời cập nhật liên tục theo syllabus 2026.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div >
  )
}
