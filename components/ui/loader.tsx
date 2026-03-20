'use client'

import React, { useEffect, useState } from 'react'
import Lottie from "lottie-react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Simple caching to avoid re-fetching the large JSON
let mascotCache: any = null
let fetchPromise: Promise<any> | null = null

export function Spinner({ className }: { className?: string }) {
    return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
}

interface LoaderProps {
    text?: string
    className?: string
    size?: "icon" | "xs" | "sm" | "md" | "lg" | "xl"
}

export function Loader({ text, className, size = "md" }: LoaderProps) {
    const [animationData, setAnimationData] = useState<any>(mascotCache)

    useEffect(() => {
        if (mascotCache) {
            setAnimationData(mascotCache)
            return
        }

        if (!fetchPromise) {
            fetchPromise = fetch("/mascot.json")
                .then(res => res.json())
                .then(data => {
                    mascotCache = data
                    return data
                })
                .catch(err => {
                    console.error("Failed to load mascot", err)
                    return null
                })
        }

        fetchPromise.then(data => {
            if (data) setAnimationData(data)
        })
    }, [])

    const sizeClasses = {
        icon: "w-6 h-6",
        xs: "w-10 h-10",
        sm: "w-24 h-24",
        md: "w-48 h-48",
        lg: "w-64 h-64",
        xl: "w-96 h-96"
    }

    if (!animationData) {
        return (
            <div className={cn("flex flex-col items-center justify-center", size !== 'icon' && size !== 'xs' && "min-h-[200px]", className)}>
                <Spinner className={cn(size === 'icon' ? "w-4 h-4" : "h-10 w-10")} />
                {text && <p className="mt-4 text-muted-foreground animate-pulse text-sm">{text}</p>}
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col items-center justify-center", (size !== 'icon' && size !== 'xs') && "p-4", className)}>
            <div className={cn(sizeClasses[size])}>
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                />
            </div>
            {text && (
                <p className={cn(
                    "mt-2 text-muted-foreground font-medium animate-pulse",
                    (size === 'icon' || size === 'xs') ? "text-xs mt-1" : "text-lg"
                )}>
                    {text}
                </p>
            )}
        </div>
    )
}
