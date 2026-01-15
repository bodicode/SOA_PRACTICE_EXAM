'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import LoginForm from './login-form'

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-blue-50 relative overflow-hidden">
            <Link
                href="/"
                className="absolute top-8 left-8 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all text-gray-600 hover:text-blue-600 font-medium group shadow-sm hover:shadow-md"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Trang chủ</span>
            </Link>
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 50, 0],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[100px]"
                />
            </div>

            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
