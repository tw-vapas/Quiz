"use client";

import React, { memo, useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "@/components/DisplayBlockRenderer";
import { splitMarkdownIntoBlocks } from "@/lib/markdownHelper";

interface MarkdownRendererProps {
  content: string;
}

// Stable static component mapping to prevent unmounting/remounting subtrees during parent renders
const MARKDOWN_COMPONENTS = {
  // Heading styling
  h1: ({ children }: any) => <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-8 mb-4 tracking-tight border-b border-slate-200 dark:border-slate-800 pb-2">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3 tracking-tight">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-5 mb-2">{children}</h3>,
  h4: ({ children }: any) => <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">{children}</h4>,
  
  // Paragraph styling
  p: ({ children }: any) => <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 mb-4">{children}</p>,
  
  // List styling
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  
  // Blockquote styling
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-indigo-500 dark:border-indigo-650 bg-slate-50 dark:bg-slate-900/50 pl-4 py-2 pr-2 rounded-r-lg my-4 italic text-slate-600 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  
  // Code & Code block styling
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !String(children).includes("\n");
    
    if (!isInline) {
      // Block code: Use our custom CodeBlock with PrismJS styling and line numbers
      return <CodeBlock content={String(children).replace(/\n$/, "")} />;
    }
    
    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-mono text-sm border border-slate-200 dark:border-slate-800/80"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Link styling
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-350 underline font-semibold transition-colors"
    >
      {children}
    </a>
  ),

  // Table styling
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 font-sans text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 font-semibold">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/40">{children}</tbody>,
  tr: ({ children }: any) => <tr>{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-3 text-left font-bold border-b border-slate-200 dark:border-slate-800">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-900/50 text-slate-650 dark:text-slate-300">{children}</td>,
};

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = useMemo(() => splitMarkdownIntoBlocks(content), [content]);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    // Reset to start on content changes
    setVisibleCount(Math.min(15, blocks.length));
    if (blocks.length <= 15) return;

    let animationFrameId: number;
    let currentVisible = 15;

    const loadNext = () => {
      if (currentVisible >= blocks.length) return;
      // Progressive append chunk size
      currentVisible = Math.min(currentVisible + 15, blocks.length);
      setVisibleCount(currentVisible);
      if (currentVisible < blocks.length) {
        animationFrameId = requestAnimationFrame(loadNext);
      }
    };

    animationFrameId = requestAnimationFrame(loadNext);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks]);

  const visibleBlocks = useMemo(() => blocks.slice(0, visibleCount), [blocks, visibleCount]);

  return (
    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-4">
      {visibleBlocks.map((blockContent, idx) => (
        <ReactMarkdown
          key={idx}
          remarkPlugins={[remarkGfm]}
          components={MARKDOWN_COMPONENTS}
        >
          {blockContent}
        </ReactMarkdown>
      ))}
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";
export default MarkdownRenderer;
