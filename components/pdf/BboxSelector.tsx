"use client";

import { useMemo, useRef, useState } from "react";

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
    width: number;
    height: number;
    onChange?: (r: Rect | null) => void;
};

export function BboxSelector({ width, height, onChange }: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [rect, setRect] = useState<Rect | null>(null);

    const style = useMemo(() => ({ width, height }), [width, height]);

    function clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n));
    }

    function getPos(e: React.PointerEvent) {
        const el = ref.current!;
        const r = el.getBoundingClientRect();
        const x = clamp(e.clientX - r.left, 0, width);
        const y = clamp(e.clientY - r.top, 0, height);
        return { x, y };
    }

    return (
        <div
            ref={ref}
            className="absolute inset-0 cursor-crosshair touch-none select-none"
            style={style}
            onPointerDown={(e) => {
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                const p = getPos(e);
                setDragStart(p);
                const initial = { x: p.x, y: p.y, w: 0, h: 0 };
                setRect(initial);
                onChange?.(initial);
            }}
            onPointerMove={(e) => {
                if (!dragStart) return;
                const p = getPos(e);
                const x = Math.min(dragStart.x, p.x);
                const y = Math.min(dragStart.y, p.y);
                const w = Math.abs(p.x - dragStart.x);
                const h = Math.abs(p.y - dragStart.y);
                const next = { x, y, w, h };
                setRect(next);
                onChange?.(next);
            }}
            onPointerUp={() => {
                setDragStart(null);
            }}
        >
            {rect && (
                <div
                    className="absolute border-2 border-primary bg-primary/20"
                    style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                >
                    <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-1 rounded">
                        Selection
                    </div>
                </div>
            )}
        </div>
    );
}
