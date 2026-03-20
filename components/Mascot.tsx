'use client'

import React, { useEffect, useState } from 'react'
import Lottie from "lottie-react"
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Mascot() {
    const pathname = usePathname()
    const [animationData, setAnimationData] = useState<any>(null)
    const [windowWidth, setWindowWidth] = useState(1000)

    useEffect(() => {
        const fetchAnimation = async () => {
            try {
                const res = await fetch("/mascot.json");
                if (!res.ok) throw new Error("Local file not found");
                const data = await res.json();
                setAnimationData(data);
            } catch (err) {
                console.error("Failed to load local mascot", err);
            }
        };

        fetchAnimation();

        const handleResize = () => setWindowWidth(window.innerWidth);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [])

    if (pathname?.includes('/exam/')) return null
    if (!animationData) return null

    const maxX = windowWidth - 150;

    return (
        <motion.div
            className="fixed -bottom-8 z-50 pointer-events-none"
            initial={{ x: 0 }}
            animate={{
                x: [0, maxX, maxX, 0, 0],
                scaleX: [1, 1, -1, -1, 1]
            }}
            transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.45, 0.5, 0.95, 1]
            }}
            style={{
                width: '150px',
                height: '150px',
                left: 0
            }}
        >
            <div className="w-full h-full relative">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                />
            </div>
        </motion.div>
    )
}
