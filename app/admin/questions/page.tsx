"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Dynamic import to avoid SSR issues with canvas/DOMMatrix
const PdfCanvas = dynamic(() => import("@/components/pdf/PdfCanvas").then(m => m.PdfCanvas), {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center bg-gray-100 text-gray-400">Loading PDF Viewer...</div>
});
const BboxSelector = dynamic(() => import("@/components/pdf/BboxSelector").then(m => m.BboxSelector), { ssr: false });


import { QuestionEditor } from "@/components/admin/QuestionEditor";

type PdfAsset = { id: string; title: string; storagePath: string };

export default function AdminQuestionsPage() {
    const supabase = createClient();
    const [assets, setAssets] = useState<any[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState<string>("");

    const [pdfUrl, setPdfUrl] = useState<string>("");
    // Review State
    const [savedQuestions, setSavedQuestions] = useState<any[]>([]);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);

    const [pageIndex, setPageIndex] = useState(0);
    const [viewport, setViewport] = useState<{ width: number; height: number; scale: number } | null>(null);
    const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
    const [questionNo, setQuestionNo] = useState(1);
    const [status, setStatus] = useState("");


    useEffect(() => {
        fetch("/api/pdf-assets").then(res => res.json()).then(data => {
            if (data.assets) setAssets(data.assets);
        });
    }, []);

    useEffect(() => {
        if (!selectedAssetId) return;
        const asset = assets.find(a => a.id === selectedAssetId);
        if (asset) {
            const { data } = supabase.storage.from("exam-pdfs").getPublicUrl(asset.storagePath);
            setPdfUrl(data.publicUrl);
        } else {
            setPdfUrl("");
        }
    }, [selectedAssetId, assets, supabase]);

    async function save() {
        if (!rect || !selectedAssetId) return;
        setStatus("Saving...");

        try {
            const res = await fetch("/api/pdf-questions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    pdfAssetId: selectedAssetId,
                    questionNo,
                    pageIndex,
                    ...rect,
                }),
            });

            if (!res.ok) throw new Error("Failed");
            setStatus("Saved!");
            setTimeout(() => setStatus(""), 2000);

            // Auto increment question number
            setQuestionNo(q => q + 1);
            setRect(null); // Reset selection
        } catch (e) {
            setStatus("Error saving");
        }
    }

    const [isAutoDetecting, setIsAutoDetecting] = useState(false);

    // Helper: Load PDFJS dynamically
    async function loadPdfJs() {
        const pdfjs = await import("pdfjs-dist");
        if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
            pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }
        return pdfjs;
    }

    // Helper to process a single page
    async function detectOnPage(pdf: any, pIdx: number) {
        const page = await pdf.getPage(pIdx + 1);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        const items = textContent.items.map((item: any) => ({
            str: item.str,
            tx: item.transform[4],
            ty: item.transform[5],
            ...item
        }));

        const questionStarts: { num: number, y: number, x: number }[] = [];
        items.forEach((item: any) => {
            const match = item.str.trim().match(/^(\d+)[\.%]?$/);
            if (match) {
                const [vx, vy] = viewport.convertToViewportPoint(item.tx, item.ty);
                // Use relative margin for robustness (e.g., 15% of page width)
                if (Math.abs(vx) < viewport.width * 0.15) {
                    questionStarts.push({ num: parseInt(match[1]), y: vy, x: vx });
                }
            }
        });

        questionStarts.sort((a, b) => a.y - b.y);
        if (questionStarts.length === 0) return 0;

        // Smart Crop Logic V2
        const scale = 1.5;
        const pageWidth = viewport.width * scale; // NOTE: page.getViewport({scale}).width might be better, but this approximates
        // Wait, viewport is scale 1.0 above. 
        // We want intended width. 
        // Let's stick to previous logic `page.getViewport({ scale }).width` but we need to re-call getViewport or multiply.
        const scaledViewport = page.getViewport({ scale });
        const realPageWidth = scaledViewport.width;

        const isFooter = (y: number) => y > viewport.height * 0.9;

        let saved = 0;

        for (let i = 0; i < questionStarts.length; i++) {
            const current = questionStarts[i];
            const next = questionStarts[i + 1];
            const topY = current.y;
            const nextY = next ? next.y : viewport.height;

            let maxContentY = topY;

            // Scan content for bottom bound
            items.forEach((item: any) => {
                const [, iy] = viewport.convertToViewportPoint(item.tx, item.ty);
                if (iy > topY && iy < nextY && !isFooter(iy)) {
                    maxContentY = Math.max(maxContentY, iy);
                }
            });

            // If last question on page, rely heavily on content end
            let bottomY = maxContentY + 50; // Increased padding to prevent cutting (E)

            // If internal question, ensure we don't overlap next one
            if (next) {
                // Cut halfway or at content end, whichever is smaller, but usually content end is safe
                bottomY = Math.min(bottomY, nextY - 15);
            } else {
                // Last question: Check if bottomY is unreasonably high (empty space), limit to page bottom
                bottomY = Math.min(bottomY, viewport.height);
            }

            // Fallback if content scan failed (empty)
            if (bottomY <= topY) bottomY = Math.min(topY + 100, nextY - 10);

            const startY = Math.max(0, topY - 10);

            // Extract text content for this region
            const regionItems = items.filter((item: any) => {
                const [, iy] = viewport.convertToViewportPoint(item.tx, item.ty);
                return iy >= topY && iy <= bottomY;
            });

            // Sort by Y (desc) -> X (asc) to reconstruct reading order
            regionItems.sort((a: any, b: any) => {
                const [, ay] = viewport.convertToViewportPoint(a.tx, a.ty);
                const [, by] = viewport.convertToViewportPoint(b.tx, b.ty);
                if (Math.abs(ay - by) > 5) return ay - by; // Top to bottom (smaller Y is top? No, in PDF coords 0,0 is bottom-left usually, but viewport convert handles it)
                // Wait, viewport.convertToViewportPoint might flip Y? 
                // Usually PDF is bottom-up, Viewport is top-down? 
                // Assuming `iy` is already top-down because we used it for `topY` logic above.
                // So smaller Y is TOP.
                return ay - by;
            });

            // Reconstruct text
            let currentLineY = -1;
            let textContent = "";
            regionItems.forEach((item: any) => {
                const [, iy] = viewport.convertToViewportPoint(item.tx, item.ty);
                if (currentLineY === -1) currentLineY = iy;

                if (Math.abs(iy - currentLineY) > 8) {
                    textContent += "\n";
                    currentLineY = iy;
                }
                textContent += item.str + " ";
            });

            // Post-process hygiene
            textContent = textContent.replace(/[ \t]+/g, " ").trim(); // Collapse spaces but keep newlines

            // Smart Formatting: Insert double newlines before structure markers
            // 1. Options (A) (B) ... (E) OR A. B. C. OR A) B) C)
            // Ensure they are on own lines
            textContent = textContent.replace(/\s+(\(?\s*[A-E]\s*[\.:\)]\s*)/g, "\n$1");

            // 2. Roman numerals (i) (ii) (iii) ...
            textContent = textContent.replace(/\s+(\([ivx]+\))\s+/g, "\n$1 ");

            // 3. Numbered lists "1." "2." (careful not to match decimals)
            textContent = textContent.replace(/\s+(\d+\.)\s+/g, "\n$1 ");

            // --- Auto-Extract Options ---
            const options: any[] = [];
            // Regex to capture:
            // 1. (A) Content
            // 2. A. Content
            // 3. A) Content
            const optRegex = /(?:^|\n)\s*(?:\(?([A-E])[\.:\)]|[A-E]\.|Question \d+)\s+(.*)/g;
            // Wait, "Question \d+" is bad there.

            // Clean regex for A-E
            const strictOptRegex = /(?:^|\n)\s*(?:\(?([A-E])[\.:\)])\s+(.*)/g;

            let optMatch;
            const extractedOpts: Record<string, string> = {};

            // We iterate to find all matches in the CLEANED text
            let scanText = textContent;
            while ((optMatch = strictOptRegex.exec(scanText)) !== null) {
                const letter = optMatch[1];
                const content = optMatch[2].trim();
                extractedOpts[letter] = content;
            }

            // Construct standardized ABCDE array
            if (Object.keys(extractedOpts).length > 0) {
                ["A", "B", "C", "D", "E"].forEach(letter => {
                    options.push({
                        id: letter,
                        text: extractedOpts[letter] || "",
                        isCorrect: false
                    });
                });
            }

            try {
                const res = await fetch("/api/pdf-questions", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        pdfAssetId: selectedAssetId,
                        questionNo: current.num,
                        pageIndex: pIdx,
                        x: 0,
                        y: startY * scale,
                        w: realPageWidth,
                        h: (bottomY - startY) * scale,
                        textContent: textContent,
                        options: options.length > 0 ? options : undefined // Send options if found
                    }),
                });
                if (!res.ok) console.error(`Failed to save Q${current.num}`, await res.text());
                else saved++;
            } catch (err) {
                console.error(`Error saving Q${current.num}`, err);
            }
        }
        return saved;
    }

    async function handleAutoDetect() {
        if (!selectedAssetId || !pdfUrl) return;
        setIsAutoDetecting(true);
        setStatus("Detecting current page...");

        try {
            const pdfjs = await loadPdfJs();
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;

            const count = await detectOnPage(pdf, pageIndex);

            setStatus(`Saved ${count} questions on Page ${pageIndex}`);
        } catch (e) {
            console.error(e);
            setStatus("Failed");
        } finally {
            setIsAutoDetecting(false);
        }
    }

    async function handleBatchDetect() {
        if (!selectedAssetId || !pdfUrl) return;
        if (!confirm("This will scan ALL pages starting from the current one. Continue?")) return;

        setIsAutoDetecting(true);

        try {
            const pdfjs = await loadPdfJs();
            const loadingTask = pdfjs.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            let totalSaved = 0;

            for (let i = pageIndex; i < pdf.numPages; i++) {
                setPageIndex(i); // Update UI
                setStatus(`Scanning Page ${i} / ${pdf.numPages}...`);

                // Small delay to allow UI to update (optional)
                await new Promise(r => setTimeout(r, 100));

                const count = await detectOnPage(pdf, i);
                totalSaved += count;
            }

            setStatus(`Batch Complete! Saved ${totalSaved} questions.`);
        } catch (e) {
            console.error(e);
            setStatus("Batch failed");
        } finally {
            setIsAutoDetecting(false);
        }
    }

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("Uploading...");
        try {
            // 1. Upload to Supabase Storage
            const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
            const { data, error } = await supabase.storage
                .from("exam-pdfs")
                .upload(filename, file);

            if (error) throw error;

            // 2. Create Asset in DB
            const res = await fetch("/api/pdf-assets", {
                method: "POST",
                body: JSON.stringify({ title: file.name, storagePath: filename })
            });
            const assetData = await res.json();

            if (assetData.asset) {
                setAssets([assetData.asset, ...assets]);
                setSelectedAssetId(assetData.asset.id);
                setStatus("Uploaded!");
                setTimeout(() => setStatus(""), 2000);
            }
        } catch (err) {
            console.error(err);
            setStatus("Upload failed");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSolutionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedAssetId) return;

        setStatus("Parsing Solution PDF...");
        try {
            const pdfjs = await loadPdfJs();
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjs.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;

            let extractedData: { qNo: number, ans?: string, text?: string }[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const tokenizedText = await page.getTextContent();

                // 1. Sort items to reconstruct reading order (Top->Bottom, Left->Right)
                const items = tokenizedText.items.map((item: any) => ({
                    str: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    h: item.height
                })).sort((a: any, b: any) => {
                    // Group by line (tolerance of ~half height)
                    if (Math.abs(a.y - b.y) > (a.h || 10) * 0.5) return b.y - a.y;
                    return a.x - b.x;
                });

                // 2. Reconstruct text with newlines
                let fullPageText = "";
                let lastY = items[0]?.y;

                items.forEach((item: any) => {
                    if (lastY !== undefined && (lastY - item.y) > 10) {
                        fullPageText += "\n";
                    }
                    fullPageText += item.str + " "; // Add space between tokens
                    lastY = item.y;
                });

                // 3. Regex Splitting
                // Look for "1.", "2." etc. at start of lines
                // Regex: (Start or Newline) (Number) (Dot or Colon) (Space)
                const questionRegex = /(?:^|\n)(\d+)[\.:]\s/g;
                let match;
                let lastIndex = 0;
                let lastQNo = null;

                // We need to capture the text BETWEEN matches
                // Find all start indices first
                const indices: { qNo: number, index: number }[] = [];
                while ((match = questionRegex.exec(fullPageText)) !== null) {
                    indices.push({ qNo: parseInt(match[1]), index: match.index });
                }

                // Slice text
                for (let k = 0; k < indices.length; k++) {
                    const current = indices[k];
                    const next = indices[k + 1];
                    const end = next ? next.index : fullPageText.length;

                    // The text block for this question
                    let rawBlock = fullPageText.substring(current.index, end).trim();

                    // Remove the number prefix "1. " -> DISABLED per user request (keep numbering)
                    // rawBlock = rawBlock.replace(/^(\d+)[\.:]\s*/, "");

                    // 4. Extract Answer Key
                    // Look for "Solution: A" or "(A)" or just "A" at start
                    // Common formats: "Solution: A", "Key: A", "(A)", "Answer is A"
                    let ans = null;
                    const ansMatch = rawBlock.match(/(?:Solution|Key|Answer)?\s*[:.-]?\s*\(?([A-E])\)?/i);

                    if (ansMatch) {
                        ans = ansMatch[1].toUpperCase();
                        // Optional: Remove the answer key from the explanation text to clean it up
                        // rawBlock = rawBlock.replace(ansMatch[0], "").trim();
                    }

                    // The rest is solution text
                    const solutionText = rawBlock.trim();

                    if (ans || solutionText) {
                        extractedData.push({ qNo: current.qNo, ans: ans || undefined, text: solutionText });
                    }
                }
            }

            setStatus(`Found ${extractedData.length} items. Syncing...`);

            // 5. Batch Update
            let updatedCount = 0;
            for (const item of extractedData) {
                // We use handleSaveEdit directly since it now handles logic
                // But handleSaveEdit expects ID, which we don't have here easily without map.
                // We should use the API directly with PDF ID + QNo

                await fetch("/api/pdf-questions", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        pdfAssetId: selectedAssetId,
                        questionNo: item.qNo,
                        correctAnswer: item.ans,
                        solutionText: item.text // Send the full explanation!
                    }),
                });
                updatedCount++;
            }

            setStatus(`Successfully imported ${updatedCount} solutions!`);
            fetchQuestions();

        } catch (err) {
            console.error(err);
            setStatus("Failed to parse solution PDF");
        } finally {
            // Reset input
            e.target.value = "";
        }
    };

    // Review Handlers
    async function fetchQuestions() {
        if (!selectedAssetId) return;
        try {
            const res = await fetch(`/api/pdf-questions?pdfAssetId=${selectedAssetId}`);
            const data = await res.json();
            if (data.questions) {
                // Sort by question number
                setSavedQuestions(data.questions.sort((a: any, b: any) => a.questionNo - b.questionNo));
            }
        } catch (e) { console.error(e); }
    }

    async function handleSaveEdit(id: string, newText: string | null, correctAnswer: string | null, solutionText: string | null, category: string | number | null, options: any) {
        // Find existing to get required fields
        const original = savedQuestions.find(q => q.id === id);
        if (!original) return;

        try {
            const res = await fetch("/api/pdf-questions", {
                method: "POST", // This upserts based on assetId + qNo
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    pdfAssetId: original.pdfAssetId,
                    questionNo: original.questionNo,
                    pageIndex: original.pageIndex,
                    x: original.x,
                    y: original.y,
                    w: original.w,
                    h: original.h,
                    correctAnswer: correctAnswer,
                    textContent: newText,
                    solutionText: solutionText,
                    category: category, // API handles number/string mapping now
                    options: options
                }),
            });
            if (res.ok) {
                setStatus(`Updated Question ${original.questionNo}`);
                fetchQuestions(); // Refresh UI
            } else {
                alert("Failed to update");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating");
        }
    }

    useEffect(() => {
        if (selectedAssetId) fetchQuestions();
    }, [selectedAssetId]);

    const handleNavigate = (direction: number) => {
        if (!editingQuestion || savedQuestions.length === 0) return;

        // Use a more robust finding method (by ID or index in array)
        const currentIndex = savedQuestions.findIndex(q => q.id === editingQuestion.id);
        if (currentIndex === -1) return;

        const newIndex = currentIndex + direction;

        // Bounds check
        if (newIndex >= 0 && newIndex < savedQuestions.length) {
            setEditingQuestion(savedQuestions[newIndex]);
        }
    };


    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">PDF Question Annotator</h1>
                <div className="flex gap-2">
                    <Button onClick={handleAutoDetect} disabled={!pdfUrl || isAutoDetecting} variant="secondary">
                        Detect Page
                    </Button>
                    <Button onClick={handleBatchDetect} disabled={!pdfUrl || isAutoDetecting} variant="destructive">
                        ⚡ Detect ALL
                    </Button>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleSolutionUpload}
                        />
                        <Button variant="outline">📂 Upload Solution Key</Button>
                    </div>

                    <div>
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                            + Upload PDF
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
                <div className="space-y-2 min-w-[200px]">
                    <Label>Select PDF</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedAssetId}
                        onChange={e => setSelectedAssetId(e.target.value)}
                    >
                        <option value="">-- Choose PDF --</option>
                        {assets.map(a => (
                            <option key={a.id} value={a.id}>{a.title} ({a.storagePath})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2 w-24">
                    <Label>Page (0-idx)</Label>
                    <Input
                        type="number"
                        min={0}
                        value={pageIndex}
                        onChange={(e) => setPageIndex(Number(e.target.value))}
                    />
                </div>

                <div className="space-y-2 w-24">
                    <Label>Question #</Label>
                    <Input
                        type="number"
                        min={1}
                        value={questionNo}
                        onChange={(e) => setQuestionNo(Number(e.target.value))}
                    />
                </div>

                <Button onClick={save} disabled={!rect || !selectedAssetId}>
                    Save Question {questionNo}
                </Button>

                {status && <span className="text-sm font-medium animate-pulse text-green-600 self-center">{status}</span>}
            </div>

            {/* Review Section */}
            {selectedAssetId && (
                <div className="border rounded-lg bg-white p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Review Saved Questions ({savedQuestions.length})</h2>
                        <Button variant="outline" size="sm" onClick={fetchQuestions}>Refresh List</Button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-[300px] overflow-y-auto">
                        {savedQuestions.map(q => (
                            <Button
                                key={q.id}
                                variant={q.textContent ? "default" : "secondary"} // Highlight text-ready Qs
                                className={`w-full justify-start ${!q.textContent && q.correctAnswer ? "border-green-500 border-2" : ""}`}
                                onClick={() => setEditingQuestion(q)}
                            >
                                Q{q.questionNo} {q.textContent ? "📝" : "🖼️"} {q.correctAnswer ? `(${q.correctAnswer})` : ""}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            <QuestionEditor
                question={editingQuestion}
                pdfUrl={pdfUrl}
                isOpen={!!editingQuestion}
                onClose={() => setEditingQuestion(null)}
                onSave={handleSaveEdit}
                onNavigate={handleNavigate}
            />

            {selectedAssetId && pdfUrl ? (
                <div className="relative inline-block border bg-gray-50 rounded-lg overflow-hidden shadow">
                    <PdfCanvas url={pdfUrl} pageIndex={pageIndex} scale={1.5} onViewport={setViewport} />
                    {viewport && (
                        <BboxSelector width={viewport.width} height={viewport.height} onChange={setRect} />
                    )}
                </div>
            ) : (
                <div className="h-64 grid place-items-center bg-muted/30 border-2 dashed rounded-xl">
                    <span className="text-muted-foreground">Select a PDF to start annotating</span>
                </div>
            )}

            <div className="text-xs text-muted-foreground font-mono mt-4">
                Debug: {JSON.stringify({ rect, viewport }, null, 2)}
            </div>
        </div>
    );
}

