"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// Add custom styling for tables to match professional PDF style
const components = {
    table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-4">
            <table className="border-collapse border border-gray-400 text-sm text-center" {...props} />
        </div>
    ),
    thead: ({ node, ...props }: any) => (
        <thead className="bg-gray-100 font-semibold" {...props} />
    ),
    th: ({ node, ...props }: any) => (
        <th className="border border-gray-400 px-4 py-2 text-gray-700" {...props} />
    ),
    td: ({ node, ...props }: any) => (
        <td className="border border-gray-400 px-4 py-2" {...props} />
    ),
    tr: ({ node, ...props }: any) => (
        <tr className="hover:bg-gray-50" {...props} />
    ),
    p: ({ node, ...props }: any) => (
        <p className="mb-1 last:mb-0 leading-normal" {...props} />
    ),
};

export default function MathRender({ text }: { text: string }) {
    // Preprocess text to match Admin Preview behavior (respect newlines)
    // Preprocess text to match Admin Preview behavior (respect newlines)
    const processedText = React.useMemo(() => {
        if (!text) return "";

        let isPreviousLineTable = false;

        return text.split("\n").map(line => {
            // Preserve indentation with non-breaking spaces
            const preservedLine = line.replace(/^ +/g, (match) => "\u00A0".repeat(match.length));
            const trimmed = preservedLine.trim();

            // Handle empty lines using stateful logic
            if (trimmed === "") {
                if (isPreviousLineTable) {
                    isPreviousLineTable = false;
                    return ""; // Clean break after table
                }
                return "\u00A0  "; // Force visible line break for normal text
            }

            // Check if current line is a table row or math block delimiter
            const isTable = trimmed.startsWith("|");
            // Also consider $$ blocks as "special" where we might not want to force breaks?
            // Actually, for $$ blocks, standard markdown rendering handles them.
            // If we append "  " to $$...$$, it might be fine, but let's be safe.
            const isMathBlock = trimmed.startsWith("$$");

            isPreviousLineTable = isTable;

            if (isTable || isMathBlock) {
                return preservedLine;
            }

            // Otherwise add two spaces to force <br/>
            return preservedLine + "  ";
        }).join("\n");
    }, [text]);

    return (
        <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={components}
            >
                {processedText}
            </ReactMarkdown>
        </div>
    );
}