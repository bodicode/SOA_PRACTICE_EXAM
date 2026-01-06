"use client";
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
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
    return (
        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={components}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}