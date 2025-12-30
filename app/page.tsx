'use client'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, BarChart2, BookOpen, Target, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react'

export default function Home() {
  const { user, isLoading } = useUserStore()

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
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <span className="text-white text-lg font-bold">S</span>
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">SOA Prep</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                <Link href="/exams" className="hover:text-blue-600 transition-colors">
                  Danh Mục Đề Thi
                </Link>
                <Link href="/pricing" className="hover:text-blue-600 transition-colors">
                  Bảng Giá
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="w-24 h-9 bg-gray-100 animate-pulse rounded-full" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.fullName || user.email?.split('@')[0]}
                  </span>
                  <Link href="/dashboard">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full px-5">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <a href="/api/auth/signout">
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </a>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-medium">
                      Đăng Nhập
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-6 transition-transform hover:scale-105">
                      Đăng Ký
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                TÍNH NĂNG MỚI ĐÃ CÓ
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Chinh Phục <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Exam SOA
                </span> <br />
                Dễ Dàng Hơn
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
                Nền tảng luyện thi thông minh với ngân hàng đề phong phú,
                phân tích hiệu suất chi tiết và lộ trình học tập cá nhân hóa.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-full transition-transform hover:scale-105 active:scale-95">
                    Bắt Đầu Ngay
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-gray-200 hover:border-blue-600 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                    Xem Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-8 flex items-center gap-6 text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Không cần thẻ tín dụng
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Hủy bất kỳ lúc nào
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 p-8 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tiến Độ Học Tập</h3>
                    <p className="text-sm text-gray-500">Thống kê 7 ngày qua</p>
                  </div>
                  <div className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                    +12.5%
                  </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-4 px-2">
                  {[45, 60, 75, 50, 85, 70, 95].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg opacity-90 hover:opacity-100 transition-opacity cursor-pointer relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {height} điểm
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between mt-4 text-xs font-medium text-gray-400">
                  <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute -right-8 -bottom-8 bg-white p-5 rounded-2xl shadow-xl border border-gray-100 max-w-[200px]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl">🏆</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Top 1%</p>
                    <p className="text-xs text-gray-500">Trong tháng này</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 font-display">
              Tại Sao Chọn SOA Prep?
            </h2>
            <p className="text-lg text-gray-600">
              Được xây dựng bởi các chuyên gia actuary hàng đầu, giúp bạn tối ưu hóa thời gian và đạt kết quả cao nhất.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-8 h-8 text-blue-600" />,
                title: "Độ Khó Thích Ứng",
                desc: "Hệ thống AI tự động điều chỉnh độ khó câu hỏi dựa trên năng lực thực tế của bạn."
              },
              {
                icon: <BookOpen className="w-8 h-8 text-indigo-600" />,
                title: "Lời Giải Chi Tiết",
                desc: "Giải thích cặn kẽ từng bước cho mọi câu hỏi, giúp bạn hiểu sâu bản chất vấn đề."
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-purple-600" />,
                title: "Phân Tích Chuyên Sâu",
                desc: "Dashboard trực quan giúp nhận diện điểm mạnh, điểm yếu để có chiến lược ôn thi phù hợp."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 overflow-hidden">
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
                    <div className="font-bold text-white text-lg">Nguyễn Minh Anh</div>
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
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Sẵn Sàng Để Trở Thành Next Actuary?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Bắt đầu hành trình của bạn ngay hôm nay với tài khoản miễn phí.
            Không rủi ro, không cam kết dài hạn.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl shadow-gray-900/10">
                Tạo Tài Khoản Miễn Phí
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="font-bold text-gray-900">SOA Prep</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-600">
              <Link href="/support" className="hover:text-blue-600 transition-colors">Hỗ Trợ</Link>
              <Link href="/exams" className="hover:text-blue-600 transition-colors">Danh Mục Đề Thi</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Điều Khoản</Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Bảo Mật</Link>
            </nav>
            <div className="text-sm text-gray-500">
              © 2024 SOA Prep. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
