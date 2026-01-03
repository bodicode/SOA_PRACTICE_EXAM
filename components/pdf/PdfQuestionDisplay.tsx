import { useEffect, useRef, useState } from "react";

type Props = {
    url: string;
    pageIndex: number;
    rect: { x: number; y: number; w: number; h: number };
    scale?: number; // Render scale quality
};

export function PdfQuestionDisplay({ url, pageIndex, rect, scale = 2.0 }: Props) {
    const [imgSrc, setImgSrc] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);

        async function render() {
            try {
                // Dynamic import to avoid SSR crash
                const pdfjs = await import("pdfjs-dist");
                if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
                    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                }

                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(pageIndex + 1);

                // Use the passed scale for rendering quality
                // Note: The rect is stored at scale 1.5 (from Admin UI decision)
                // So if we render at scale 2.0, we need to adjust the crop region multiplier.
                // Assuming Admin UI saved rects are relative to the *viewport at scale 1.5*
                // Let's normalize everything.
                // Ideally, stored rects should be independent of scale (e.g. normalized 0-1) or at scale 1.0.
                // But in Admin UI we saved them as pixel values of scale 1.5 (implied).

                // Let's handle generic case:
                // We want to render the crop region `rect` (which matches scale 1.5 coords).
                // To get high quality image, we can render the PDF page at scale 1.5 (exact match)
                // OR render at higher scale and scale the rect.

                // For simplicity/correctness now: Render at the SAME scale valid for the rect (1.5).
                // If you want higher res, you need to multiply both.

                const baseScale = 1.5; // The scale the rects were defined in
                const renderScale = scale; // The target output scale (e.g. 2.0 for retina)
                const ratio = renderScale / baseScale;

                const viewport = page.getViewport({ scale: renderScale });

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport } as any).promise;

                // Now crop
                // rect is {x,y,w,h} at baseScale
                const cropX = rect.x * ratio;
                const cropY = rect.y * ratio;
                const cropW = rect.w * ratio;
                const cropH = rect.h * ratio;

                // Create a secondary canvas for the cropped image
                const cropCanvas = document.createElement("canvas");
                cropCanvas.width = cropW;
                cropCanvas.height = cropH;
                const cropCtx = cropCanvas.getContext("2d");

                if (cropCtx) {
                    cropCtx.drawImage(
                        canvas,
                        cropX, cropY, cropW, cropH,
                        0, 0, cropW, cropH
                    );
                    if (active) {
                        setImgSrc(cropCanvas.toDataURL("image/png"));
                    }
                }
            } catch (err) {
                console.error("Error cropping question:", err);
            } finally {
                if (active) setLoading(false);
            }
        }

        render();

        return () => { active = false; };
    }, [url, pageIndex, rect, scale]);

    if (loading) return <div className="h-32 w-full animate-pulse bg-muted rounded"></div>;
    if (!imgSrc) return <div className="text-red-500">Failed to load question</div>;

    return (
        <img src={imgSrc} alt="Question" className="max-w-full h-auto border rounded shadow-sm" />
    );
}
