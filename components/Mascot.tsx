'use client'

import React, { useEffect, useState, useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import { usePathname } from 'next/navigation'

export default function Mascot() {
    const pathname = usePathname()

    // Position state
    const [position, setPosition] = useState({ x: 50, y: 0 })
    const [isWalking, setIsWalking] = useState(false)

    const [isDragging, setIsDragging] = useState(false)
    const lottieRef = useRef<LottieRefCurrentProps>(null)

    // We will fetch the animation data 
    const [animationData, setAnimationData] = useState<any>(null)

    useEffect(() => {
        // Fetch the Lottie JSON locally
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
    }, [])

    // Initial Position (Bottom Right)
    useEffect(() => {
        const updatePosition = () => {
            if (!isDragging) {
                setPosition({
                    x: window.innerWidth - 160,
                    y: window.innerHeight - 130
                })
            }
        }

        updatePosition()
        window.addEventListener('resize', updatePosition)
        return () => window.removeEventListener('resize', updatePosition)
    }, [isDragging])



    // Drag Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({ x: e.clientX - 75, y: e.clientY - 75 })
            }
        }
        const handleMouseUp = () => setIsDragging(false)

        if (isDragging) window.addEventListener('mousemove', handleMouseMove)
        else window.removeEventListener('mousemove', handleMouseMove)

        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // Hide mascot on exam pages
    if (pathname?.includes('/exam/')) return null

    if (!animationData) return null

    return (
        <div
            className="fixed z-50 cursor-grab active:cursor-grabbing transition-transform"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '150px',
                height: '150px',
                pointerEvents: 'auto',
                transition: isDragging || isWalking ? 'none' : 'all 0.3s ease-out'
            }}
            onMouseDown={() => {
                setIsDragging(true)
                setIsWalking(false)
            }}
        >
            <div
                className="w-full h-full relative"
            >
                {!isWalking && !isDragging && (
                    <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 px-3 py-1 rounded-xl shadow-lg animate-bounce whitespace-nowrap text-xs font-bold pointer-events-none border border-border"
                    >
                        Meow!
                    </div>
                )}
                <Lottie
                    lottieRef={lottieRef}
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                />
            </div>
        </div>
    )
}
