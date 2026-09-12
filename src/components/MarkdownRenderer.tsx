"use client";

import React, { memo, useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";
import { CodeBlock } from "@/components/DisplayBlockRenderer";
import { cn } from "@/lib/utils";
import { normalizeMarkdownForRendering, splitMarkdownIntoBlocks } from "@/lib/markdownHelper";

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
  p: ({ children }: any) => <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 mb-4 break-words">{children}</p>,
  
  // List styling
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  
  // Blockquote & AI Callout Card styling (NotebookLM / ChatGPT / Gemini Callouts)
  blockquote: ({ children }: any) => {
    const extractText = (node: any): string => {
      if (!node) return "";
      if (typeof node === "string" || typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(extractText).join(" ");
      if (node?.props?.children) return extractText(node.props.children);
      return "";
    };
    const textContent = extractText(children);
    const lower = textContent.trim().toLowerCase();

    if (lower.startsWith('[!note]') || lower.startsWith('note:') || lower.startsWith('ghi chú:') || lower.startsWith('ghi chú')) {
      return (
        <div className="my-4 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 flex items-start gap-3 shadow-2xs">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      );
    }
    if (lower.startsWith('[!warning]') || lower.startsWith('[!caution]') || lower.startsWith('warning:') || lower.startsWith('lưu ý:') || lower.startsWith('chú ý:')) {
      return (
        <div className="my-4 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      );
    }
    if (lower.startsWith('[!tip]') || lower.startsWith('tip:') || lower.startsWith('mẹo:')) {
      return (
        <div className="my-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 flex items-start gap-3 shadow-2xs">
          <Lightbulb className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      );
    }
    if (lower.startsWith('[!important]') || lower.startsWith('important:') || lower.startsWith('quan trọng:')) {
      return (
        <div className="my-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      );
    }

    return (
      <blockquote className="border-l-4 border-indigo-500 dark:border-indigo-650 bg-slate-50 dark:bg-slate-900/50 pl-4 py-2 pr-2 rounded-r-lg my-4 italic text-slate-600 dark:text-slate-400">
        {children}
      </blockquote>
    );
  },
  
  // Code & Code block styling
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const isInline = !match && !String(children).includes("\n");
    const lang = match ? match[1].toLowerCase() : "";

    if (lang === "diagram" || lang === "ascii") {
      return (
        <div className="my-6 p-4 sm:p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm leading-snug overflow-x-auto shadow-2xs whitespace-pre select-text">
          <code>{String(children).replace(/\n$/, "")}</code>
        </div>
      );
    }

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
    <div className="max-w-full overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <table className="min-w-[520px] md:min-w-full divide-y divide-slate-200 dark:divide-slate-800 font-sans text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => <thead className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 font-semibold">{children}</thead>,
  tbody: ({ children }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950/40">{children}</tbody>,
  tr: ({ children }: any) => <tr>{children}</tr>,
  th: ({ children }: any) => <th className="px-3 md:px-4 py-3 text-left font-bold border-b border-slate-200 dark:border-slate-800">{children}</th>,
  td: ({ children }: any) => <td className="px-3 md:px-4 py-3 border-b border-slate-100 dark:border-slate-900/50 text-slate-650 dark:text-slate-300">{children}</td>,

  // Additional AI Markdown elements: Accordions, Badges, Dividers, Highlights
  details: ({ children }: any) => (
    <details className="my-4 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 shadow-2xs transition-colors">
      {children}
    </details>
  ),
  summary: ({ children }: any) => (
    <summary className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 bg-slate-100/60 dark:bg-slate-800/60 cursor-pointer select-none border-b border-slate-200 dark:border-slate-800 hover:bg-slate-150 dark:hover:bg-slate-800 transition-colors">
      {children}
    </summary>
  ),
  hr: () => <hr className="my-8 border-t border-slate-200 dark:border-slate-800" />,
  mark: ({ children }: any) => (
    <mark className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-medium">
      {children}
    </mark>
  ),
  kbd: ({ children }: any) => (
    <kbd className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">
      {children}
    </kbd>
  ),
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

  const visibleBlocks = useMemo(
    () => blocks.slice(0, visibleCount).filter(b => b && typeof b === "string" && b.trim() !== "" && b.trim() !== "undefined" && b.trim() !== "null"),
    [blocks, visibleCount]
  );

  return (
    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 space-y-4 overflow-x-hidden">
      {visibleBlocks.map((blockContent, idx) => (
        <ReactMarkdown
          key={idx}
          remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={MARKDOWN_COMPONENTS}
        >
          {blockContent}
        </ReactMarkdown>
      ))}
    </div>
  );
});

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

export const InlineMarkdown = memo(function InlineMarkdown({ content, className }: InlineMarkdownProps) {
  const normalized = useMemo(() => normalizeMarkdownForRendering(content), [content]);

  if (!content) return null;

  return (
    <span className={cn("inline-markdown", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          p: ({ children }: any) => <span className="inline">{children}</span>,
          a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-semibold">
              {children}
            </a>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </span>
  );
});

InlineMarkdown.displayName = "InlineMarkdown";
MarkdownRenderer.displayName = "MarkdownRenderer";
export default MarkdownRenderer;
