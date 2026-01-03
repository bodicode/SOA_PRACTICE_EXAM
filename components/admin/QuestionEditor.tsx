import remarkGfm from "remark-gfm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css"; // Import styles
import { ChevronLeft, ChevronRight, Shuffle, Wand2, Plus, Trash2 } from "lucide-react";

// Dynamic import for PdfQuestionDisplay to avoid SSR issues
const PdfQuestionDisplay = dynamic(() => import("@/components/pdf/PdfQuestionDisplay").then(m => m.PdfQuestionDisplay), { ssr: false });

const MATH_TOOLS = [
    { label: "Bold", code: "****", tooltip: "Bold Text", offset: 2 },
    { label: "Italic", code: "**", tooltip: "Italic Text", offset: 1 },
    { label: "U", code: "<u></u>", tooltip: "Underline", offset: 3 },
    { label: "Blank", code: "<u>&nbsp;&nbsp;&nbsp;&nbsp;</u>", tooltip: "Blank Line" },
    { label: "x²", code: "$^{}$", tooltip: "Power", offset: 3, cursorBack: 2 },
    { label: "X₁", code: "$_{}$", tooltip: "Subscript (e.g. C₁)", offset: 3, cursorBack: 2 },
    { label: "x_i", code: "$_{}$", tooltip: "Subscript", offset: 3, cursorBack: 2 },
    { label: "½", code: "$\\frac{}{}$", tooltip: "Fraction", offset: 7, cursorBack: 2 },
    { label: ">", code: " > ", tooltip: "Greater Than" },
    { label: "<", code: " < ", tooltip: "Less Than" },
    { label: "≥", code: "$\\ge$", tooltip: "Greater or Equal" },
    { label: "≤", code: "$\\le$", tooltip: "Less or Equal" },
    { label: "√", code: "$\\sqrt{}$", tooltip: "Square Root", offset: 7 },
    { label: "∫", code: "$\\int_{}^{}$ ", tooltip: "Integral", offset: 7 },
    { label: "Σ", code: "$\\sum_{}^{}$ ", tooltip: "Sum", offset: 7 },
    { label: "∪", code: "$\\cup$", tooltip: "Union" },
    { label: "∩", code: "$\\cap$", tooltip: "Intersection" },
    { label: "∈", code: "$\\in$", tooltip: "Element of" },
    { label: "∞", code: "$\\infty$", tooltip: "Infinity" },
    { label: "∅", code: "$\\emptyset$", tooltip: "Empty Set" },
    { label: "$...$", code: "$$", tooltip: "Inline Math", offset: 1 },
    { label: "Block", code: "\n$$\n\n$$\n", tooltip: "Block Math", offset: 4 },
    {
        label: "Cases",
        code: "\n$$\nf(x) = \\begin{cases} \n  x & \\text{if } ... \\\\ \n  y & \\text{otherwise} \n\\end{cases}\n$$\n",
        tooltip: "Piecewise Function"
    },
    {
        label: "Table",
        code: "\n| Header 1 | Header 2 | Header 3 |\n|---|---|---|\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n\n",
        tooltip: "Insert Table"
    },
];

type Question = {
    id: string;
    questionNo: number;
    pageIndex: number;
    x: number; y: number; w: number; h: number;
    textContent?: string | null;
    correctAnswer?: string | null;
    solutionText?: string | null;
    category?: string | null;
    options?: any; // JSON
};

type Props = {
    question: Question | null;
    pdfUrl: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, newText: string | null, correctAnswer: string | null, solutionText: string | null, category: string | null, options: any) => Promise<void>;
    onNavigate: (direction: number) => void;
};

type OptionItem = {
    id: string; // "A", "B", ... or UUID
    text: string;
    isCorrect: boolean;
};

export function QuestionEditor({ question, pdfUrl, isOpen, onClose, onSave, onNavigate }: Props) {
    const [text, setText] = useState("");
    const [solution, setSolution] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("P"); // Default to P
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [optionsList, setOptionsList] = useState<OptionItem[]>([]);
    const [activeTab, setActiveTab] = useState<"question" | "options" | "solution">("question");
    const [saving, setSaving] = useState(false);
    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(0);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // Resizable Logic
    const [leftWidth, setLeftWidth] = useState(30);
    const [midWidth, setMidWidth] = useState(40);
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizingRef = useRef<"left" | "mid" | null>(null);

    useEffect(() => {
        if (question) {
            setText(question.textContent || "");
            setSolution(question.solutionText || "");
            setCorrectAnswer(question.correctAnswer || null);
            setCategory(question.category || "P");

            // Initialize options
            if (question.options && Array.isArray(question.options) && question.options.length > 0) {
                setOptionsList(question.options);
            } else {
                // Default 5 empty options A-E or minimal
                setOptionsList([
                    { id: "A", text: "", isCorrect: question.correctAnswer === "A" },
                    { id: "B", text: "", isCorrect: question.correctAnswer === "B" },
                    { id: "C", text: "", isCorrect: question.correctAnswer === "C" },
                    { id: "D", text: "", isCorrect: question.correctAnswer === "D" },
                    { id: "E", text: "", isCorrect: question.correctAnswer === "E" },
                ]);
            }

            setActiveTab("question");
        }
    }, [question]);

    // Update isCorrect in optionsList when correctAnswer state changes (backwards compatibility)
    useEffect(() => {
        if (!correctAnswer) return;
        setOptionsList(prev => prev.map(o => ({ ...o, isCorrect: o.id === correctAnswer })));
    }, [correctAnswer]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizingRef.current || !containerRef.current) return;
            const containerRect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - containerRect.left;
            const percentage = (x / containerRect.width) * 100;

            if (isResizingRef.current === "left") {
                const newLeft = Math.max(10, Math.min(percentage, 80));
                if (newLeft + midWidth < 90) setLeftWidth(newLeft);
            } else if (isResizingRef.current === "mid") {
                const newMid = percentage - leftWidth;
                if (newMid > 10 && (leftWidth + newMid) < 90) setMidWidth(newMid);
            }
        };

        const handleMouseUp = () => {
            isResizingRef.current = null;
            document.body.style.cursor = "default";
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [leftWidth, midWidth]);



    // Fetch Categories
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await fetch("/api/categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (e) {
                console.error("Failed to fetch categories", e);
            }
        };
        fetchCats();
    }, []);

    // Helper to detect if cursor is inside math block ($...$ or $$...$$)
    const isCursorInMath = (text: string, cursorIndex: number): boolean => {
        let i = 0;
        let inDisplayMath = false; // $$ ... $$
        let inInlineMath = false;  // $ ... $

        while (i < cursorIndex) {
            // Check for Display Math $$
            if (text.substring(i, i + 2) === "$$") {
                if (inInlineMath) {
                    // $ ... $$ -> unexpected, but treat as closing inline? 
                    // Let's assume valid LaTeX. $$ inside $ is invalid usually.
                    // But if we see $$, it toggles Display Math.
                    // Actually, if we are in inline math, seeing $$ is weird.
                    // Let's prioritize $$ detection.
                    inDisplayMath = !inDisplayMath;
                    i += 2;
                    continue;
                }
                inDisplayMath = !inDisplayMath;
                i += 2;
                continue;
            }

            // Check for Inline Math $
            if (text[i] === "$") {
                if (inDisplayMath) {
                    // $ inside $$ is just a character usually, or error. 
                    // But standard markdown treats $$ as block. $ inside is ignored?
                    // Let's assume $ inside $$ doesn't close $$.
                    i++;
                    continue;
                }
                inInlineMath = !inInlineMath;
                i++;
                continue;
            }

            i++;
        }

        return inDisplayMath || inInlineMath;
    };

    const insertSnippet = (snippetObj: any) => {
        // Handle Options Tab
        if (activeTab === "options") {
            if (focusedOptionIndex === null) return;
            const targetId = `option-input-${focusedOptionIndex}`;
            const activeEl = document.getElementById(targetId) as HTMLTextAreaElement;

            if (activeEl) {
                activeEl.focus(); // Restore focus
                const start = activeEl.selectionStart;
                const end = activeEl.selectionEnd;
                const selectedText = activeEl.value.substring(start, end);

                const inMath = isCursorInMath(activeEl.value, start);
                let code = snippetObj.code;
                let offset = snippetObj.offset;

                if (inMath && code.startsWith("$") && code.endsWith("$")) {
                    code = code.substring(1, code.length - 1);
                    if (offset !== undefined) offset -= 1;
                }

                let insertText = code;
                let newCursorPos = start + code.length;

                // Logic for wrapping (Bold, Italic, etc)
                if (offset !== undefined) {
                    if (selectedText) {
                        // Wrapping mode (e.g. **text**)
                        const prefix = code.substring(0, offset);
                        const suffix = code.substring(offset);
                        insertText = prefix + selectedText + suffix;
                        newCursorPos = start + prefix.length + selectedText.length + suffix.length;
                    } else {
                        // Empty insert mode (e.g. **|)
                        const prefix = code.substring(0, offset);
                        newCursorPos = start + prefix.length;
                        insertText = code;
                    }
                } else if (snippetObj.cursorBack) {
                    // Backtrack mode (e.g. ^{})
                    newCursorPos = start + code.length - snippetObj.cursorBack;
                }

                // Execute Insert
                const success = document.execCommand("insertText", false, insertText);

                if (!success) {
                    const newText = activeEl.value.substring(0, start) + insertText + activeEl.value.substring(end);
                    handleOptionChange(focusedOptionIndex, newText);
                }

                // Restore Cursor
                setTimeout(() => {
                    activeEl.focus();
                    activeEl.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
            }
            return;
        }

        if (!textAreaRef.current) return;
        const textarea = textAreaRef.current;
        textarea.focus();

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const content = textarea.value;
        const selectedText = content.substring(start, end);

        const inMath = isCursorInMath(content, start);
        let code = snippetObj.code;
        let offset = snippetObj.offset;

        if (inMath && code.startsWith("$") && code.endsWith("$")) {
            code = code.substring(1, code.length - 1);
            if (offset !== undefined) offset -= 1;
        }

        let finalInsertText = "";
        let cursorOffsetAfter = 0;

        if (offset !== undefined) {
            // Wrapping Logic
            const splitPoint = offset;
            const left = code.substring(0, splitPoint);
            const right = code.substring(splitPoint);

            finalInsertText = left + selectedText + right;

            if (selectedText.length > 0) {
                // Cursor after the block
                cursorOffsetAfter = left.length + selectedText.length + right.length;
            } else {
                // Cursor inside
                cursorOffsetAfter = left.length;
            }
        } else {
            // Simple insertion
            finalInsertText = code;
            cursorOffsetAfter = code.length;
        }

        // Use execCommand to preserve Undo history
        const success = document.execCommand("insertText", false, finalInsertText);

        // Fallback if execCommand fails (though it shouldn't on standard textarea)
        if (!success) {
            const newText = content.substring(0, start) + finalInsertText + content.substring(end);
            if (activeTab === "question") setText(newText);
            else setSolution(newText);
        }

        // Restore cursor position calculated relative to the start of insertion
        if (selectedText.length === 0 && snippetObj.offset !== undefined) {
            const rightLength = snippetObj.code.substring(snippetObj.offset).length;
            setTimeout(() => {
                const newPos = textarea.selectionStart - rightLength;
                textarea.setSelectionRange(newPos, newPos);
            }, 0);
        } else if (selectedText.length > 0 && snippetObj.cursorBack) {
            setTimeout(() => {
                const newPos = textarea.selectionStart - snippetObj.cursorBack;
                textarea.setSelectionRange(newPos, newPos);
            }, 0);
        }
    };

    const rect = useMemo(() => {
        if (!question) return { x: 0, y: 0, w: 0, h: 0 };
        return { x: question.x, y: question.y, w: question.w, h: question.h };
    }, [question?.x, question?.y, question?.w, question?.h]);

    const startResize = (pane: "left" | "mid") => {
        isResizingRef.current = pane;
        document.body.style.cursor = "col-resize";
    };

    if (!question) return null;

    const saveChanges = async () => {
        setSaving(true);
        // Correct answer is derived from options list or the separate state?
        // Let's ensure consistency. If options are used, the correct answer is the ONE with isCorrect=true
        const correctOpt = optionsList.find(o => o.isCorrect);
        // If shuffled, 'id' might be random, but we need to map back to A, B, C, D...
        // Actually the backend expects "A", "B"... 
        // If we shuffle, we must re-assign A,B,C,D based on current display order?
        // User said "shuffle options". 
        // Usually index 0 = A, index 1 = B.
        // So we just save the array order. And the 'correctAnswer' string is the letter corresponding to the correct index.
        const alphabet = ["A", "B", "C", "D", "E"];
        const correctIndex = optionsList.findIndex(o => o.isCorrect);
        const derivedCorrectAnswer = correctIndex >= 0 ? alphabet[correctIndex] : null;

        await onSave(
            question.id,
            text || null,
            derivedCorrectAnswer,
            solution || null,
            category || null,
            optionsList
        );
        setSaving(false);
    };

    const handleSaveAndClose = async () => {
        await saveChanges();
        onClose();
    };

    const handleInternalNavigate = async (direction: number) => {
        const isDirty = text !== (question.textContent || "") ||
            solution !== (question.solutionText || "");
        // Deep compare options? excessive. Assume save on nav is safer.
        await saveChanges();
        onNavigate(direction);
    };

    const handleClearText = async () => {
        if (confirm("Clear all text?")) {
            setText("");
            setSolution("");
        }
    };

    // --- Options Logic ---
    const handleExtractOptions = () => {
        // Regex to find A. B. C. D. in text
        // (?:^|\n)\s*([A-E])[\.:\)]\s+(.*)
        const regex = /(?:^|\n)\s*([A-E])[\.:\)]\s+(.*)/g;
        let match;
        const newOptions = [...optionsList];

        while ((match = regex.exec(text)) !== null) {
            const letter = match[1];
            const content = match[2].trim();
            const index = letter.charCodeAt(0) - 65; // A=0
            if (index >= 0 && index < 5) {
                newOptions[index] = { ...newOptions[index], text: content };
            }
        }
        setOptionsList(newOptions);

        // Remove options from question text? Optional.
        // User might want to keep them until verified.
        // const cleanedText = text.replace(regex, "").trim();
        // setText(cleanedText);
    };

    const handleShuffleOptions = () => {
        // Shuffle the array
        const shuffled = [...optionsList].sort(() => Math.random() - 0.5);
        // Re-assign IDs to match positions? No, ID should track the content? 
        // Actually, for "A, B, C" display, the position matters.
        // The ID 'A' usually implies position 0.
        // If we shuffle, we just change the data at declared positions.
        setOptionsList(shuffled);
    };

    const handleOptionChange = (idx: number, val: string) => {
        const newOpts = [...optionsList];
        newOpts[idx].text = val;
        setOptionsList(newOpts);
    };

    const setOptionCorrect = (idx: number) => {
        const newOpts = optionsList.map((o, i) => ({ ...o, isCorrect: i === idx }));
        setOptionsList(newOpts);
        const alphabet = ["A", "B", "C", "D", "E"];
        setCorrectAnswer(alphabet[idx]);
    };

    const formatForPreview = (content: string) => {
        let isPreviousLineTable = false;

        // Regex to fix " ** text ** " -> "**text**" (SAFER: Single line only)
        const cleanContent = content
            .replace(/\*\*\s+([^\r\n*]+?)\s+\*\*/g, "**$1**") // Fix ** text ** -> **text**
            .replace(/\*\*\s+([^\r\n*]+?)\*\*/g, "**$1**")    // Fix ** text** -> **text**
            .replace(/\*\*([^\r\n*]+?)\s+\*\*/g, "**$1**");   // Fix **text ** -> **text**

        return cleanContent.split("\n").map(line => {
            const preservedLine = line.replace(/^ +/g, (match) => "\u00A0".repeat(match.length));
            const trimmed = preservedLine.trim();

            if (trimmed === "") {
                if (isPreviousLineTable) {
                    // Critical: Must close the table block with a clean break
                    isPreviousLineTable = false;
                    return "";
                }
                // Text mode or already closed: Force visible space
                return "\u00A0  ";
            }

            // Detect if this line looks like a table row for the NEXT iteration
            isPreviousLineTable = trimmed.startsWith("|");

            // Add 2 spaces at end to force hard break, UNLESS it's a table row
            return preservedLine + (isPreviousLineTable ? "" : "  ");
        }).join("\n");
    };

    const LABELS = ["A", "B", "C", "D", "E"];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-[95vh] flex flex-col p-4">
                <DialogHeader className="mb-2 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleInternalNavigate(-1)} title="Previous Question">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <DialogTitle>Edit Question {question.questionNo}</DialogTitle>
                        <Button variant="outline" size="icon" onClick={() => handleInternalNavigate(1)} title="Next Question">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value="P">Exam P</option>
                                    <option value="FM">Exam FM</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 mr-8">
                        <span className="text-sm font-bold text-gray-700">Correct Answer:</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {optionsList.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setOptionCorrect(idx)}
                                    className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${opt.isCorrect
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "hover:bg-gray-200 text-gray-600"
                                        }`}
                                >
                                    {LABELS[idx]}
                                </button>
                            ))}
                        </div>
                    </div>
                </DialogHeader>

                <div ref={containerRef} className="flex flex-1 min-h-0 min-w-0">
                    {/* Pane 1: Image Source */}
                    <div style={{ width: `${leftWidth}%` }} className="border rounded bg-gray-100 p-2 flex items-center justify-center overflow-auto h-full relative">
                        <div className="absolute top-2 left-2 z-10 bg-white/80 px-2 py-1 rounded text-xs font-bold text-gray-500 pointer-events-none">Image</div>
                        <PdfQuestionDisplay
                            url={pdfUrl}
                            pageIndex={question.pageIndex}
                            rect={rect}
                            scale={1.5}
                        />
                    </div>

                    <div onMouseDown={() => startResize("left")} className="w-2 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group relative z-50 hover:scale-x-150 transition-all">
                        <div className="h-8 w-1 bg-gray-300 group-hover:bg-white rounded"></div>
                    </div>

                    {/* Pane 2: Editor */}
                    <div style={{ width: `${midWidth}%` }} className="flex flex-col gap-2 h-full min-w-[200px]">
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-t border-t border-x">
                            <button onClick={() => setActiveTab("question")} className={`text-sm font-bold px-3 py-1 rounded ${activeTab === "question" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"}`}>
                                Question
                            </button>
                            <button onClick={() => setActiveTab("options")} className={`text-sm font-bold px-3 py-1 rounded ${activeTab === "options" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>
                                Options
                            </button>
                            <button onClick={() => setActiveTab("solution")} className={`text-sm font-bold px-3 py-1 rounded ${activeTab === "solution" ? "bg-green-100 text-green-700" : "text-gray-500 hover:bg-gray-100"}`}>
                                Solution
                            </button>
                        </div>

                        <div className="flex flex-col border-x border-b p-2 bg-gray-50 mb-[-8px] rounded-b gap-2">
                            {/* Group 1: Text Formatting */}
                            <div className="flex gap-1 flex-wrap">
                                {MATH_TOOLS.slice(0, 4).map(tool => (
                                    <button key={tool.label} onClick={() => insertSnippet(tool)} className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 rounded text-sm font-medium text-gray-700 shadow-sm" title={tool.tooltip}>
                                        <span dangerouslySetInnerHTML={{ __html: tool.label.replace("U", "<u>U</u>") }}></span>
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-200 my-1"></div>

                            {/* Group 2: Math & Sets */}
                            <div className="flex gap-1 flex-wrap">
                                {MATH_TOOLS.slice(4).map(tool => (
                                    <button key={tool.label} onClick={() => insertSnippet(tool)} className={`px-2 py-1 border rounded text-xs min-w-[28px] ${tool.label === "Table" || tool.label === "Cases" ? "bg-purple-50 font-bold text-purple-700 border-purple-200" : "bg-white text-gray-700 hover:bg-blue-50 border-gray-200"}`} title={tool.tooltip}>
                                        {tool.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeTab === "question" && (
                            <Textarea
                                ref={textAreaRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                className="flex-1 font-mono text-base resize-none p-4 leading-relaxed border-2 focus-visible:ring-0 focus-visible:border-blue-500 rounded-b mt-0"
                                placeholder="Type question content here..."
                            />
                        )}

                        {activeTab === "solution" && (
                            <Textarea
                                ref={textAreaRef}
                                value={solution}
                                onChange={e => setSolution(e.target.value)}
                                className="flex-1 font-mono text-base resize-none p-4 leading-relaxed border-2 focus-visible:ring-0 focus-visible:border-green-500 bg-green-50/10 rounded-b mt-0"
                                placeholder="Type detailed solution here..."
                            />
                        )}

                        {activeTab === "options" && (
                            <div className="flex-1 overflow-auto p-4 space-y-4 border rounded bg-purple-50/10">
                                <div className="flex justify-between">
                                    <Button size="sm" variant="outline" onClick={handleExtractOptions} title="Parse A. B. C. from Question Text">
                                        <Wand2 className="w-4 h-4 mr-2" /> Extract Options
                                    </Button>
                                    <Button size="sm" variant="secondary" onClick={handleShuffleOptions}>
                                        <Shuffle className="w-4 h-4 mr-2" /> Shuffle
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {optionsList.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2 items-start">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold flex-shrink-0 ${opt.isCorrect ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                                                {LABELS[idx]}
                                            </div>
                                            <div className="flex-1">
                                                <Textarea
                                                    id={`option-input-${idx}`}
                                                    value={opt.text}
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                    onFocus={() => setFocusedOptionIndex(idx)}
                                                    className="min-h-[60px] resize-y"
                                                    placeholder={`Option ${LABELS[idx]}...`}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Button size="icon" variant="ghost" onClick={() => setOptionCorrect(idx)} title="Mark Correct">
                                                    <span className="text-xs">✔</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div onMouseDown={() => startResize("mid")} className="w-2 hover:bg-blue-400 cursor-col-resize flex items-center justify-center group relative z-50 hover:scale-x-150 transition-all">
                        <div className="h-8 w-1 bg-gray-300 group-hover:bg-white rounded"></div>
                    </div>

                    {/* Pane 3: Preview */}
                    <div className="flex-1 flex flex-col gap-2 h-full min-w-[200px] pl-2">
                        <div className="flex justify-between items-center px-2 py-1">
                            <label className="text-sm font-bold text-gray-600">
                                {activeTab === "question" ? "Question Preview" : activeTab === "solution" ? "Solution Preview" : "Options Preview"}
                            </label>
                        </div>
                        <div className={`flex-1 border rounded p-4 overflow-auto bg-white prose prose-sm max-w-none dark:prose-invert`}>
                            {activeTab === "options" ? (
                                <ul className="list-none space-y-2 p-0">
                                    {optionsList.map((opt, idx) => (
                                        <li key={idx} className={`flex gap-2 p-2 rounded border ${opt.isCorrect ? "border-green-500 bg-green-50" : "border-transparent"}`}>
                                            <span className="font-bold">{LABELS[idx]}.</span>
                                            <div>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath, remarkGfm]}
                                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                                >
                                                    {formatForPreview(opt.text)}
                                                </ReactMarkdown>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                    components={{
                                        table: ({ node, ...props }) => <table className="border-collapse border border-gray-300 my-4 w-full" {...props} />,
                                        th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left" {...props} />,
                                        td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2" {...props} />,
                                    }}
                                >
                                    {formatForPreview(
                                        activeTab === "question"
                                            ? (text.trim().match(new RegExp(`^${question.questionNo}[.)]`, 'i'))
                                                ? text.replace(new RegExp(`^(${question.questionNo})[.)]`, 'i'), "**$1.**") // Make it bold and text
                                                : `**${question.questionNo}.** ${text}`)
                                            : solution
                                    )}
                                </ReactMarkdown>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 mt-4">
                    <Button variant="ghost" onClick={handleClearText} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Clear Text
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSaveAndClose} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
