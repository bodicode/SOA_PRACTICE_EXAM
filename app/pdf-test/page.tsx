"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const PdfQuestionDisplay = dynamic(() => import("@/components/pdf/PdfQuestionDisplay").then(m => m.PdfQuestionDisplay), { ssr: false });
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";

type Asset = { id: string; title: string; storagePath: string };
type Question = {
    id: string;
    questionNo: number;
    pageIndex: number;
    x: number; y: number; w: number; h: number;
    correctAnswer?: string | null;
    textContent?: string | null;
    solutionText?: string | null;
    options?: any; // JSON array of {id, text, isCorrect}
};

export default function PdfTestPage() {
    const supabase = createClient();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [selectedAssetId, setSelectedAssetId] = useState("");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [pdfUrl, setPdfUrl] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const QUESTIONS_PER_PAGE = 5;

    // User answers state
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetch("/api/pdf-assets").then(r => r.json()).then(d => {
            if (d.assets) setAssets(d.assets);
        });
    }, []);

    useEffect(() => {
        if (!selectedAssetId) return;
        const asset = assets.find(a => a.id === selectedAssetId);
        if (!asset) return;

        // Get public URL
        const { data } = supabase.storage.from("exam-pdfs").getPublicUrl(asset.storagePath);
        setPdfUrl(data.publicUrl);

        // Fetch questions
        setQuestions([]); // Clear old
        fetch(`/api/pdf-questions?pdfAssetId=${selectedAssetId}`)
            .then(r => r.json())
            .then(d => {
                if (d.questions) {
                    setQuestions(d.questions);
                    setCurrentPage(1); // Reset page on new file
                    setUserAnswers({});
                    setShowResults(false);
                }
            });
    }, [selectedAssetId, assets, supabase]);

    // Pagination Logic
    const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
    const currentQuestions = questions.slice(
        (currentPage - 1) * QUESTIONS_PER_PAGE,
        currentPage * QUESTIONS_PER_PAGE
    );

    function handleNext() {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
        window.scrollTo(0, 0);
    }

    function handlePrev() {
        if (currentPage > 1) setCurrentPage(p => p - 1);
        window.scrollTo(0, 0);
    }

    // Helper to format text similarly to Editor
    const formatForPreview = (content: string) => {
        if (!content) return "";
        return content.split("\n").map(line => {
            const preservedLine = line.replace(/^ +/g, (match) => "\u00A0".repeat(match.length));
            return preservedLine.trim() === "" ? "\u00A0" : preservedLine;
        }).join("  \n");
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold">PDF Exam Preview</h1>

            <div className="flex gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <select
                        className="border p-2 rounded"
                        value={selectedAssetId}
                        onChange={e => setSelectedAssetId(e.target.value)}
                    >
                        <option value="">-- Select Exam PDF --</option>
                        {assets.map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                    </select>
                    <div className="text-sm text-gray-500 pt-2">
                        Total: {questions.length}
                    </div>
                </div>

                <Button onClick={() => setShowResults(!showResults)} variant={showResults ? "outline" : "default"}>
                    {showResults ? "Hide Results" : "Submit / Check Results"}
                </Button>
            </div>

            {selectedAssetId && questions.length === 0 && (
                <div className="text-muted-foreground">No questions found for this PDF. Go to Admin to detect them.</div>
            )}

            <div className="space-y-8 min-h-[500px]">
                {currentQuestions.map((q: any) => (
                    <div key={q.id} className="border p-6 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">
                                Question {q.questionNo}
                            </span>
                            {showResults && q.correctAnswer && (
                                <span className={userAnswers[q.id] === q.correctAnswer ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                    {userAnswers[q.id] === q.correctAnswer ? "Correct" : `Wrong! Key: ${q.correctAnswer}`}
                                </span>
                            )}
                        </div>

                        {/* Question Text or Image */}
                        {q.textContent ? (
                            <div className="mb-6 prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                                >
                                    {formatForPreview(q.textContent)}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            pdfUrl && (
                                <div className="mb-6">
                                    <PdfQuestionDisplay
                                        url={pdfUrl}
                                        pageIndex={q.pageIndex}
                                        rect={{ x: q.x, y: q.y, w: q.w, h: q.h }}
                                        scale={1.5}
                                    />
                                </div>
                            )
                        )}

                        {/* Options Rendering */}
                        <div className="space-y-3">
                            {q.options && Array.isArray(q.options) && q.options.length > 0 ? (
                                // Render structured options
                                q.options.map((opt: any, idx: number) => {
                                    const label = ["A", "B", "C", "D", "E"][idx];
                                    const isSelected = userAnswers[q.id] === label;
                                    const isCorrect = q.correctAnswer === label;

                                    let containerClass = "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ";

                                    if (showResults) {
                                        if (isCorrect) containerClass += "bg-green-50 border-green-500 ";
                                        else if (isSelected && !isCorrect) containerClass += "bg-red-50 border-red-500 ";
                                        else containerClass += "border-transparent bg-gray-50 opacity-50 ";
                                    } else {
                                        if (isSelected) containerClass += "bg-blue-50 border-blue-500 ";
                                        else containerClass += "border-transparent bg-gray-50 hover:bg-gray-100 ";
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={containerClass}
                                            onClick={() => !showResults && setUserAnswers(prev => ({ ...prev, [q.id]: label }))}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-bold text-xs flex-shrink-0 ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-400 text-gray-500"}`}>
                                                {label}
                                            </div>
                                            <div className="prose prose-sm max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath, remarkGfm]}
                                                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                                                >
                                                    {opt.text}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                // Fallback to simple A-E buttons if no structured options
                                <div className="grid grid-cols-5 gap-4 max-w-md">
                                    {["A", "B", "C", "D", "E"].map((opt) => {
                                        const isSelected = userAnswers[q.id] === opt;
                                        const isCorrect = q.correctAnswer === opt;

                                        let btnClass = "h-10 w-10 rounded-full border-2 font-semibold transition-all flex items-center justify-center ";
                                        if (showResults) {
                                            if (isCorrect) btnClass += "bg-green-100 border-green-500 text-green-700 ";
                                            else if (isSelected && !isCorrect) btnClass += "bg-red-100 border-red-500 text-red-700 ";
                                            else btnClass += "border-gray-200 text-gray-400 ";
                                        } else {
                                            if (isSelected) btnClass += "bg-blue-600 border-blue-600 text-white ";
                                            else btnClass += "border-gray-300 text-gray-600 hover:border-blue-500 hover:bg-blue-50 ";
                                        }
                                        return (
                                            <button key={opt} className={btnClass} onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))} disabled={showResults}>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Solution Rendering */}
                        {showResults && q.solutionText && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-bold text-green-800 mb-2">Solution Explanation:</h4>
                                <div className="prose prose-sm max-w-none text-green-900">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath, remarkGfm]}
                                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                                    >
                                        {formatForPreview(q.solutionText)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {questions.length > 0 && (
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button onClick={handlePrev} disabled={currentPage === 1} variant="outline">
                        &larr; Previous
                    </Button>
                    <span className="font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline">
                        Next &rarr;
                    </Button>
                </div>
            )}
        </div>
    );
}
