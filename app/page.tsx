'use client'

import { useState } from 'react'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, BarChart2, BookOpen, Target, LogOut, LayoutDashboard, ChevronRight } from 'lucide-react'
import { HeroSection } from '@/components/HeroSection'

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
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 50, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/40 rounded-full blur-[120px] mix-blend-overlay" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Chinh Phục <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] animate-gradient">
                  Exam SOA
                </span> <br />
                Dễ Dàng Hơn
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl text-gray-600 mb-10 max-w-lg leading-relaxed">
                Nền tảng luyện thi thông minh với ngân hàng đề phong phú,
                phân tích hiệu suất chi tiết và lộ trình học tập cá nhân hóa.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Link href="/practice">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-full transition-all hover:scale-105 active:scale-95 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                    Ôn tập ngay
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            <HeroSection />
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

      {/* Mock Exam Section */}
      <section className="relative py-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-blue-900/50" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Exam Simulation
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Chế Độ Thi Thử <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                  Mô Phỏng Phòng Thi
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
                Tạo không gian thi cử nghiêm túc với đồng hồ đếm ngược và giao diện y hệt thi thật.
                Giúp bạn làm quen với áp lực thời gian và rèn luyện tâm lý vững vàng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/practice">
                  <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-0 shadow-lg shadow-red-900/20 rounded-full font-bold text-lg group">
                    <Target className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Vào Phòng Thi Ngay
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button size="lg" variant="outline" className="h-14 px-8 border-gray-700 text-gray-300 hover:text-white hover:bg-white/5 rounded-full text-lg">
                    Bảng Xếp Hạng
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative lg:h-[500px] flex items-center justify-center"
            >
              <div className="relative z-10 w-full max-w-md bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
                  <div>
                    <p className="text-gray-400 text-sm">Exam P</p>
                    <p className="text-white font-bold text-xl">Mock Exam #204</p>
                  </div>
                  <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-mono font-bold">
                    02:59:45
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-gray-700/30 border border-gray-700/50 animate-pulse" />
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Online
                    </div>
                    <div className="h-4 w-px bg-gray-700"></div>
                    <div className="text-gray-300 font-medium text-sm">
                      30 Câu hỏi
                    </div>
                  </div>
                  <div className="text-white font-bold text-sm bg-blue-600/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                    Tiến độ: 15/30
                  </div>
                </div>
              </div>

              {/* Decorative rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gray-800/50 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-gray-800/50 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}

    </div>
  )
}
