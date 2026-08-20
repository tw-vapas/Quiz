"use client";

import React, { useState, useMemo } from "react";
import { useQuizStore, CreatorFile } from "@/store/quizStore";
import { Question, parseQuizJson } from "../lib/parser";
import { cn } from "@/lib/utils";
import { 
  Settings2, 
  Download, 
  Clock, 
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";

function sanitizeFileName(name: string): string {
  if (!name || !name.trim()) return `quiz_export.json`;
  const cleaned = name.replace(/\.(json|docx|txt|pdf)$/i, "").trim();
  return `${cleaned}.json`;
}

function CustomNumberInput({
  value,
  min,
  max,
  onChange,
  className
}: {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex items-center shrink-0 select-none", className)}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (isNaN(val)) {
            onChange(min);
          } else {
            onChange(Math.max(min, Math.min(max, val)));
          }
        }}
        className="w-22 pl-3 pr-7 py-1.5 text-sm font-semibold border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <div className="absolute right-1 top-0.5 bottom-0.5 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 my-0.5 pl-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-t transition-colors disabled:opacity-30 cursor-pointer"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-b transition-colors disabled:opacity-30 cursor-pointer"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

interface SettingExportProps {
  className?: string;
  filterType?: {
    singleChoice: boolean;
    multipleChoice: boolean;
  };
  filterOthers?: {
    haveCorrectAnswer: boolean;
    haveExplanation: boolean;
    haveDisplayBlock: boolean;
  };
  selectedTagsFilter?: Record<string, boolean>;
}

type FileStatusType = 
  | "Tệp hợp lệ" 
  | "Thiếu lựa chọn đáp án" 
  | "Thiếu đáp án đúng" 
  | "Lỗi cú pháp" 
  | "Tệp rỗng";

export default function SettingExport({ 
  className
}: SettingExportProps) {
  const activeFileId = useQuizStore(state => state.activeFileId);
  const creatorFiles = useQuizStore(state => state.creatorFiles);
  const updateCreatorFile = useQuizStore(state => state.updateCreatorFile);

  const activeFile = useMemo(() => creatorFiles.find(f => f.id === activeFileId), [creatorFiles, activeFileId]);

  const getFileJson = (file: CreatorFile) => {
    const pkg = {
      metadata: file.metadata,
      document: file.document,
      note: file.note,
      questions: file.questions
    };
    return JSON.stringify(pkg, null, 2);
  };

  // --- EXPORT MODAL STATES ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [quantityMode, setQuantityMode] = useState<"ALL" | "FIRST" | "LAST" | "RANGE">("ALL");
  const [firstCount, setFirstCount] = useState(5);
  const [lastCount, setLastCount] = useState(5);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);

  // Render empty state if no active file
  if (!activeFile) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm items-center justify-center p-8", className)}>
        <Settings2 className="w-16 h-16 text-indigo-500/30 mb-4" />
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">No File Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">Chọn một tệp từ File Manager ở cột bên trái để hiển thị thiết lập.</p>
      </div>
    );
  }

  // --- AUTO EVALUATE STATUS ---
  const fileStatus = (() => {
    if (activeFile.questions.length === 0 && !activeFile.document && !activeFile.note) {
      return "Tệp rỗng";
    }
    const jsonStr = getFileJson(activeFile);
    const parsed = parseQuizJson(jsonStr);
    if (!parsed.isValid) {
      if (parsed.error?.includes("thiếu trường 'question'") || parsed.error?.includes("thiếu trường 'text'")) {
        return "Lỗi cú pháp";
      }
      if (parsed.error?.includes("thiếu hoặc rỗng danh sách 'options'")) {
        return "Thiếu lựa chọn đáp án";
      }
      if (parsed.error?.includes("thiếu đáp án đúng")) {
        return "Thiếu đáp án đúng";
      }
      return "Lỗi cú pháp";
    }
    return "Tệp hợp lệ";
  })();

  // --- NOTES WITH STRICT 200 WORDS LIMIT ---
  const handleNoteChange = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      updateCreatorFile(activeFile.id, { note: "" });
      return;
    }
    const words = trimmed.split(/\s+/);
    if (words.length > 200) {
      // Truncate to first 200 words
      const truncated = text.split(/\s+/).slice(0, 200).join(" ");
      updateCreatorFile(activeFile.id, { note: truncated });
    } else {
      updateCreatorFile(activeFile.id, { note: text });
    }
  };

  const noteWordCount = activeFile.note 
    ? activeFile.note.trim().split(/\s+/).filter(w => w.length > 0).length 
    : 0;

  // --- EXPORT DOWNLOAD TRIGGER ---
  const handleExportFile = async () => {
    // 1. Base question list
    let list = [...activeFile.questions];

    if (list.length === 0) {
      useQuizStore.getState().showNotification("Không có câu hỏi nào để xuất bản!", "error");
      return;
    }

    // 2. Quantity slice
    let exportedQuestions = [...list];
    if (quantityMode === "FIRST") {
      exportedQuestions = list.slice(0, firstCount);
    } else if (quantityMode === "LAST") {
      exportedQuestions = list.slice(Math.max(0, list.length - lastCount));
    } else if (quantityMode === "RANGE") {
      exportedQuestions = list.slice(rangeStart - 1, rangeEnd);
    }

    if (exportedQuestions.length === 0) {
      useQuizStore.getState().showNotification("Lựa chọn số lượng câu hỏi rỗng hoặc vượt quá giới hạn!", "error");
      return;
    }

    // 3. Prepare File & Data (JSON standard format)
    const rawName = activeFile.metadata?.file_name || activeFile.name;
    const defaultFileName = sanitizeFileName(rawName);

    const pkg = {
      metadata: {
        file_name: defaultFileName,
        question_count: exportedQuestions.length,
        last_modified: activeFile.metadata?.last_modified || new Date().toISOString()
      },
      document: activeFile.document,
      note: activeFile.note,
      questions: exportedQuestions
    };

    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });

    // 4. Trigger system File Manager save dialog (showSaveFilePicker)
    if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFileName,
          types: [
            {
              description: "Tệp JSON (*.json)",
              accept: { "application/json": [".json"] }
            }
          ]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        useQuizStore.getState().showNotification("Đã xuất tệp thành công!", "success");
        setIsExportModalOpen(false);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }
      }
    }

    // Fallback download qua thẻ a
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultFileName;
    a.click();
    URL.revokeObjectURL(url);

    useQuizStore.getState().showNotification("Đã xuất tệp thành công!", "success");
    setIsExportModalOpen(false);
  };

  const getStatusColor = (status: FileStatusType) => {
    switch (status) {
      case "Tệp hợp lệ":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-900/30";
      case "Thiếu lựa chọn đáp án":
      case "Thiếu đáp án đúng":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30";
      case "Lỗi cú pháp":
        return "bg-red-500/10 text-red-650 dark:text-red-400 border-red-200/50 dark:border-red-900/30";
      case "Tệp rỗng":
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/30";
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm relative", className)}>
      
      {/* 1. HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 tracking-wider">
            Cài Đặt & Xuất Bản
          </h3>
        </div>
      </div>

      {/* 2. SCROLLABLE SETTINGS CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* SECTION A: GENERAL INFORMATION */}
        <div className="space-y-4">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Tên tệp tin
            </label>
            <input 
              type="text" 
              value={activeFile.name}
              onChange={(e) => updateCreatorFile(activeFile.id, { name: e.target.value, metadata: { ...activeFile.metadata, file_name: e.target.value } })}
              className="w-full px-3 py-2 text-sm font-normal border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên tệp..."
            />
          </div>

          {/* Status Display */}
          <div className="space-y-1.5 relative">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Trạng thái
            </label>
            <div
              className={cn(
                "w-full px-3 py-2 text-sm font-medium border rounded-xl flex items-center justify-between select-none",
                getStatusColor(fileStatus)
              )}
            >
              <span>{fileStatus}</span>
            </div>
          </div>

          {/* Last Changed Field */}
          <div className="space-y-1.5 relative">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Chỉnh sửa lần cuối
            </label>
            <div className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 select-none">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{activeFile.metadata.last_modified}</span>
            </div>
          </div>
        </div>

        {/* SECTION B: NOTES */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Ghi chú
            </label>
            <span className={cn(
              "text-xs font-mono font-medium",
              noteWordCount > 180 ? "text-red-500 font-semibold" : "text-slate-400"
            )}>
              {noteWordCount}/200 từ
            </span>
          </div>
          <textarea
            value={activeFile.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="w-full h-56 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm font-normal text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar"
            placeholder="Nhập ghi chú cho tệp tin này..."
          />
        </div>

      </div>

      {/* 3. EXPORT FOOTER BUTTON */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="w-full min-h-11 bg-indigo-650 hover:bg-indigo-755 text-white font-medium text-base rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Xuất bản
        </button>
      </div>

      {/* --- EXPORT SETTING POPUP MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 truncate">
                  Xuất bản tệp tin
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate" title={activeFile.name}>
                  {activeFile.name} ({activeFile.questions.length} câu hỏi)
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              
              {/* Question Quantity Mode Selection */}
              <div className="space-y-2.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  Số lượng câu hỏi xuất bản
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: "ALL", label: "Tất cả câu hỏi", desc: `Toàn bộ ${activeFile.questions.length} câu` },
                    { id: "FIRST", label: "N câu đầu tiên", desc: "Lấy từ đầu danh sách" },
                    { id: "LAST", label: "N câu cuối cùng", desc: "Lấy từ cuối danh sách" },
                    { id: "RANGE", label: "Khoảng chỉ định", desc: "Chỉ định vị trí Từ - Đến" }
                  ].map((mode) => {
                    const isActive = quantityMode === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => setQuantityMode(mode.id as any)}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2",
                          isActive
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-semibold block truncate">{mode.label}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-normal block truncate">{mode.desc}</span>
                        </div>
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                          isActive ? "border-indigo-600 bg-indigo-600" : "border-slate-300 dark:border-slate-600 bg-transparent"
                        )}>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Range Numeric Inputs */}
                {quantityMode === "FIRST" && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">Lấy số lượng:</span>
                    <CustomNumberInput 
                      value={firstCount}
                      min={1}
                      max={activeFile.questions.length}
                      onChange={(val) => setFirstCount(val)}
                    />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      / {activeFile.questions.length} câu đầu tiên
                    </span>
                  </div>
                )}

                {quantityMode === "LAST" && (
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">Lấy số lượng:</span>
                    <CustomNumberInput 
                      value={lastCount}
                      min={1}
                      max={activeFile.questions.length}
                      onChange={(val) => setLastCount(val)}
                    />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      / {activeFile.questions.length} câu cuối cùng
                    </span>
                  </div>
                )}

                {quantityMode === "RANGE" && (
                  <div className="flex items-center justify-start gap-4 md:gap-5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">Từ câu:</span>
                      <CustomNumberInput 
                        value={rangeStart}
                        min={1}
                        max={rangeEnd}
                        onChange={(val) => setRangeStart(val)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">Đến câu:</span>
                      <CustomNumberInput 
                        value={rangeEnd}
                        min={rangeStart}
                        max={activeFile.questions.length}
                        onChange={(val) => setRangeEnd(val)}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Action buttons */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
              <button 
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleExportFile}
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Xuất Bản</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
