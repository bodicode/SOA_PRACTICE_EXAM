"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";



type Props = {
    url: string;
    pageIndex: number; // 0-based
    scale?: number;
    onViewport?: (v: { width: number; height: number; scale: number }) => void;
};

export const PdfCanvas = React.memo(function PdfCanvas({ url, pageIndex, scale = 1.5, onViewport }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set worker locally
        if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        let cancelled = false;

        async function run() {
            setLoading(true);
            try {
                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;

                if (cancelled) return;

                const page = await pdf.getPage(pageIndex + 1);
                if (cancelled) return;

                const viewport = page.getViewport({ scale });

                const canvas = canvasRef.current!;
                if (!canvas) return;
                const ctx = canvas.getContext("2d")!;

                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);

                onViewport?.({ width: canvas.width, height: canvas.height, scale });

                const renderTask = page.render({ canvasContext: ctx, viewport, canvas: null as any });
                await renderTask.promise;

                if (!cancelled) setLoading(false);
            } catch (error) {
                console.error("Error rendering PDF:", error);
                if (!cancelled) setLoading(false);
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [url, pageIndex, scale, onViewport]);

    return (
        <div className="relative inline-block border rounded overflow-hidden">
            {loading && (
                <div className="absolute inset-0 grid place-items-center bg-background/60 z-10">
                    <div className="text-sm font-medium">Rendering PDF...</div>
                </div>
            )}
            <canvas ref={canvasRef} className="block" />
        </div>
    );
});
