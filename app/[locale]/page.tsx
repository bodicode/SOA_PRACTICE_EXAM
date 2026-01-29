'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, BarChart2, BookOpen, Target, LogOut, LayoutDashboard, ChevronRight, Star, Sparkles, Zap, Users } from 'lucide-react'
import { HeroSection } from '@/components/HeroSection'
import { HomeProgress } from '@/components/HomeProgress'

export default function Home() {
  const { user, isLoading } = useUserStore()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const tHero = useTranslations('hero')
  const tFeatures = useTranslations('features')
  const tExams = useTranslations('exams')
  const tPrograms = useTranslations('programs')
  const tTestimonials = useTranslations('testimonials')
  const tFaq = useTranslations('faq')
  const tCta = useTranslations('cta')

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
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}


      {/* Hero Section */}
      <section className="pt-8 pb-12 bg-background">
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
                {tHero('title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{tHero('subtitle')}</span>
              </h1>

              <p className="text-lg md:text-xl text-blue-100/80 mb-10 leading-relaxed max-w-2xl">
                {tHero('description')}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/practice">
                  <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 rounded-xl transition-all hover:scale-105 active:scale-95 font-semibold">
                    <Zap className="w-5 h-5 mr-2 fill-current" />
                    {tHero('startButton')}
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95 font-semibold">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    {tHero('progressButton')}
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
      <section className="pt-10 py-20 relative overflow-hidden bg-background">
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
              <span>{tFeatures('subtitle')}</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight leading-tight"
            >
              {tFeatures('title')}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground mx-auto leading-relaxed"
            >
              {tFeatures('subtitle')}
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              {
                icon: <BookOpen className="w-8 h-8 text-white" />,
                bg: "bg-blue-600",
                shadow: "shadow-blue-600/30",
                title: tFeatures('questionBank.title'),
                desc: tFeatures('questionBank.description')
              },
              {
                icon: <Target className="w-8 h-8 text-white" />,
                bg: "bg-indigo-600",
                shadow: "shadow-indigo-600/30",
                title: tFeatures('realExam.title'),
                desc: tFeatures('realExam.description')
              },
              {
                icon: <BarChart2 className="w-8 h-8 text-white" />,
                bg: "bg-violet-600",
                shadow: "shadow-violet-600/30",
                title: tFeatures('analytics.title'),
                desc: tFeatures('analytics.description')
              },
              {
                icon: <Users className="w-8 h-8 text-white" />,
                bg: "bg-pink-600",
                shadow: "shadow-pink-600/30",
                title: tFeatures('videoCall.title'),
                desc: tFeatures('videoCall.description')
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.3 }}
                whileHover={{ y: -8 }}
                className="group relative bg-card p-8 lg:p-10 rounded-[2rem] border border-border shadow-xl shadow-border/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-[10rem] opacity-50 group-hover:scale-110 transition-transform duration-500" />

                <div className={`relative w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center shadow-lg ${feature.shadow} mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Programs Section - Deep SEO for Exam P & FM */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold tracking-wider uppercase text-sm">{tPrograms('badge')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mt-2 mb-4">{tPrograms('title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {tPrograms('description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Exam P Card */}
            <div className="bg-card rounded-3xl p-8 shadow-lg border border-border hover:border-blue-200 transition-colors relative overflow-hidden group h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 font-bold text-xl">P</div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{tExams('p.title')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">
                  {tExams('p.description')}
                </p>
                <div className="space-y-3 mb-8">
                  {(tExams.raw('p.topics') as string[]).map((topic) => (
                    <div key={topic} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {topic}
                    </div>
                  ))}
                </div>
                <Link href="/practice?exam=P" className="mt-auto">
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02] font-semibold text-lg">
                    {tExams('p.button')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Exam FM Card */}
            <div className="bg-card rounded-3xl p-8 shadow-lg border border-border hover:border-indigo-200 transition-colors relative overflow-hidden group h-full flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex flex-col flex-1">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600 font-bold text-xl">FM</div>
                <h3 className="text-2xl font-bold text-foreground mb-3">{tExams('fm.title')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">
                  {tExams('fm.description')}
                </p>
                <div className="space-y-3 mb-8">
                  {(tExams.raw('fm.topics') as string[]).map((topic) => (
                    <div key={topic} className="flex items-center text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      {topic}
                    </div>
                  ))}
                </div>
                <Link href="/practice?exam=FM" className="mt-auto">
                  <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white transition-all hover:scale-[1.02] font-semibold text-lg">
                    {tExams('fm.button')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section - Enhanced UI */}
      <section className="py-24 relative overflow-hidden">
        {/* Ambient Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-[2.5rem] p-8 md:p-12 lg:p-20 overflow-hidden shadow-2xl shadow-blue-900/20"
          >
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white rounded-full blur-[100px] mix-blend-overlay translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900 rounded-full blur-[80px] mix-blend-multiply -translate-x-1/3 translate-y-1/3" />
              <svg className="absolute inset-0 w-full h-full opacity-30" width="100%" height="100%">
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="white" strokeWidth="1" fill="none" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>

            <div className="relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Column: Testimonial */}
              <div className="flex flex-col">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/20 shadow-lg"
                >
                  <span className="text-4xl text-blue-100">❝</span>
                </motion.div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight tracking-tight font-display">
                  "{tTestimonials('an.quote')}"
                </h2>

                <div className="flex items-center gap-5 mt-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-white/50 shadow-lg">
                      <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100&q=80" alt="Nguyễn Phước Thịnh" />
                      <AvatarFallback className="bg-gradient-to-tr from-blue-100 to-white text-blue-700 text-xl font-bold">AN</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-indigo-600">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-white text-xl">Nguyễn Phước Thịnh</div>
                    <div className="text-blue-100/80 font-medium">{tTestimonials('an.role')}</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Floating CTA Card */}
              <div className="flex justify-center lg:justify-end perspective-1000">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="relative group w-full max-w-sm"
                >
                  {/* Card Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000" />

                  <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-1.5 mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{
                            opacity: 1,
                            scale: [1, 1.4, 1]
                          }}
                          transition={{
                            opacity: {
                              duration: 0.5,
                              delay: 0.2 + star * 0.1
                            },
                            scale: {
                              repeat: Infinity,
                              duration: 1.5,
                              repeatDelay: 0.2, // Faster repeat delay
                              delay: 1 + star * 0.1 // Staggered start of loop
                            }
                          }}
                        >
                          <Star className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-sm" />
                        </motion.div>
                      ))}
                    </div>

                    <p className="text-white/90 text-lg mb-8 leading-relaxed font-medium">
                      {tTestimonials('trust')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section - SEO Optimization */}
      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">{tFaq('title')}</h2>
            <p className="text-lg text-muted-foreground">{tFaq('subtitle')}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-foreground mb-3">{tFaq('q1.q')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {tFaq('q1.a')}
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-foreground mb-3">{tFaq('q2.q')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {tFaq('q2.a')}
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold text-foreground mb-3">{tFaq('q3.q')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {tFaq('q3.a')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div >
  )
}
