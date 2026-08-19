"use client";

import React from "react";
import { Sparkles, Check, HelpCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionsSelectionProps {
  className?: string;
  totalFiles?: number;
  totalQuestions?: number;
}

export default function SectionsSelection({ 
  className, 
  totalFiles = 3, 
  totalQuestions = 120 
}: SectionsSelectionProps) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-sm", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Trình kiến tạo câu hỏi
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
              BETA
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Tải lên, biên soạn và cấu hình xuất bản bộ đề ôn tập của bạn
          </p>
        </div>
      </div>

      {/* Info Badges / Quick Status */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/35 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
            {totalFiles} tệp tin nguồn
          </span>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/35 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
            {totalQuestions} câu hỏi tổng cộng
          </span>
        </div>
      </div>
    </div>
  );
}
