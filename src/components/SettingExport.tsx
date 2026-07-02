"use client";

import React, { useState, useMemo } from "react";
import { useQuizStore, CreatorFile } from "@/store/quizStore";
import { Question, parseQuizJson } from "../lib/parser";
import { cn } from "@/lib/utils";
import { 
  Settings2, 
  Download, 
  ChevronDown, 
  Clock, 
  Tag, 
  X
} from "lucide-react";

interface SettingExportProps {
  className?: string;
  filterType: {
    singleChoice: boolean;
    multipleChoice: boolean;
  };
  filterOthers: {
    haveCorrectAnswer: boolean;
    haveExplanation: boolean;
    haveDisplayBlock: boolean;
  };
  selectedTagsFilter: Record<string, boolean>;
}

type FileStatusType = 
  | "Valid File" 
  | "Missing Answer Option" 
  | "Missing Correct Answer" 
  | "Syntax Error" 
  | "Empty File";

export default function SettingExport({ 
  className,
  filterType,
  filterOthers,
  selectedTagsFilter
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

  // --- GENERAL INFORMATION STATES ---
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // --- STATISTICS CHECKBOX STATES ---
  const [hasAnswers, setHasAnswers] = useState(true);
  const [hasExplanations, setHasExplanations] = useState(true);
  const [hasTags, setHasTags] = useState(true);

  // --- EXPORT MODAL STATES ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [quantityMode, setQuantityMode] = useState<"ALL" | "FIRST" | "LAST" | "RANGE">("ALL");
  const [firstCount, setFirstCount] = useState(5);
  const [lastCount, setLastCount] = useState(5);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);
  const [fileFormat, setFileFormat] = useState<"JSON" | "DOCX">("JSON");
  const [applyFilterSetting, setApplyFilterSetting] = useState(false);
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // Render empty state if no active file
  if (!activeFile) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm items-center justify-center p-8", className)}>
        <Settings2 className="w-16 h-16 text-indigo-500/30 animate-pulse mb-4" />
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">No File Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">Chọn một tệp từ File Manager ở cột bên trái để hiển thị thiết lập.</p>
      </div>
    );
  }

  // --- AUTO EVALUATE STATUS ---
  const fileStatus = (() => {
    if (activeFile.questions.length === 0 && !activeFile.document && !activeFile.note) {
      return "Empty File";
    }
    const jsonStr = getFileJson(activeFile);
    const parsed = parseQuizJson(jsonStr);
    if (!parsed.isValid) {
      if (parsed.error?.includes("thiếu trường 'question'") || parsed.error?.includes("thiếu trường 'text'")) {
        return "Syntax Error";
      }
      if (parsed.error?.includes("thiếu hoặc rỗng danh sách 'options'")) {
        return "Missing Answer Option";
      }
      if (parsed.error?.includes("thiếu đáp án đúng")) {
        return "Missing Correct Answer";
      }
      return "Syntax Error";
    }
    return "Valid File";
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

  // --- STATISTICS FILTERS ---
  const filteredStatsQuestions = activeFile.questions.filter(q => {
    const matchAnswers = !hasAnswers || (q.options && q.options.length > 0 && q.correctOptionIds.length > 0);
    const matchExpl = !hasExplanations || !!q.explanation;
    const matchTags = !hasTags || (q.tags && q.tags.length > 0);
    return matchAnswers && matchExpl && matchTags;
  });

  const totalQuestions = filteredStatsQuestions.length;

  // --- SOLID PIE CHART CALCULATION ---
  const tagsData = (() => {
    const counts: Record<string, number> = {};
    filteredStatsQuestions.forEach(q => {
      q.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

    const totalTagOccurrences = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalTagOccurrences === 0) return [];

    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#3B82F6"];
    let cumulativePercentage = 0;

    return Object.entries(counts).map(([name, count], idx) => {
      const percentage = (count / totalTagOccurrences) * 100;
      const startAngle = (cumulativePercentage / 100) * 360;
      const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
      cumulativePercentage += percentage;

      return {
        name,
        count,
        percentage,
        color: colors[idx % colors.length],
        startAngle,
        endAngle
      };
    });
  })();

  const describeSlice = (startAngle: number, endAngle: number, radius = 40) => {
    // Offset angles by -90 deg so that 0 starts at 12 o'clock (top)
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // --- EXPORT DOWNLOAD TRIGGER ---
  const handleExportFile = () => {
    // 1. Filter questions based on configuration
    let list = [...activeFile.questions];
    if (applyFilterSetting) {
      list = list.filter(q => {
        const matchType = (q.type === "single_choice" && filterType.singleChoice) || 
                          (q.type === "multiple_choice" && filterType.multipleChoice);
        const matchTags = !q.tags || q.tags.length === 0 || q.tags.some(t => selectedTagsFilter[t]);
        const matchCorrect = !filterOthers.haveCorrectAnswer || q.correctOptionIds.length > 0;
        const matchExp = !filterOthers.haveExplanation || !!q.explanation;
        const matchBlock = !filterOthers.haveDisplayBlock || (q.display_blocks && q.display_blocks.length > 0);
        return matchType && matchTags && matchCorrect && matchExp && matchBlock;
      });
    }

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

    // 3. Trigger download
    if (fileFormat === "JSON") {
      const pkg = {
        metadata: {
          file_name: activeFile.metadata.file_name,
          question_count: exportedQuestions.length,
          last_modified: activeFile.metadata.last_modified
        },
        document: activeFile.document,
        note: activeFile.note,
        questions: exportedQuestions
      };

      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile.metadata.file_name.endsWith(".json") 
        ? activeFile.metadata.file_name 
        : `${activeFile.metadata.file_name.replace(/\.[^/.]+$/, "")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // DOCX formatting - text representation
      let textContent = "";
      exportedQuestions.forEach((q, idx) => {
        textContent += `Câu ${idx + 1}: ${q.text}\n`;
        q.options.forEach((opt, oIdx) => {
          const letter = String.fromCharCode(65 + oIdx);
          textContent += `${letter}. ${opt.text}${q.correctOptionIds.includes(opt.id) ? "/" : ""}\n`;
        });
        if (q.explanation) {
          textContent += `[>] ${q.explanation}\n`;
        }
        if (q.display_blocks && q.display_blocks.length > 0) {
          q.display_blocks.forEach(b => {
            textContent += `[+] [${b.type}]\n${b.content}\n[/-]\n`;
          });
        }
        textContent += `\n`;
      });

      const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeFile.name.replace(/\.[^/.]+$/, "")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setIsExportModalOpen(false);
  };

  const getStatusColor = (status: FileStatusType) => {
    switch (status) {
      case "Valid File":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-900/30";
      case "Missing Answer Option":
      case "Missing Correct Answer":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30";
      case "Syntax Error":
        return "bg-red-500/10 text-red-650 dark:text-red-400 border-red-200/50 dark:border-red-900/30";
      case "Empty File":
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/30";
    }
  };

  const getQtyModeLabel = (mode: typeof quantityMode) => {
    switch (mode) {
      case "ALL": return "Tất cả";
      case "FIRST": return "Câu đầu tiên";
      case "LAST": return "Câu cuối cùng";
      case "RANGE": return "Khoảng tùy chọn";
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm relative", className)}>
      
      {/* 1. HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Setting & Export
          </h3>
        </div>
      </div>

      {/* 2. SCROLLABLE SETTINGS CONTENT */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* SECTION A: GENERAL INFORMATION */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            General Information
          </h4>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Name
            </label>
            <input 
              type="text" 
              value={activeFile.name}
              onChange={(e) => updateCreatorFile(activeFile.id, { name: e.target.value, metadata: { ...activeFile.metadata, file_name: e.target.value } })}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tên tệp..."
            />
          </div>

          {/* Type Select Dropdown */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Type
            </label>
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-255 flex items-center justify-between hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer"
            >
              <span>{activeFile.type === "QUIZ" ? "Quiz File" : "Supported File"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 z-15 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                <button
                  onClick={() => { updateCreatorFile(activeFile.id, { type: "QUIZ" }); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", activeFile.type === "QUIZ" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                >
                  Quiz File
                </button>
                <button
                  onClick={() => { updateCreatorFile(activeFile.id, { type: "SUPPORT" }); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", activeFile.type === "SUPPORT" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                >
                  Supported File
                </button>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Status
            </label>
            <div
              className={cn(
                "w-full px-3 py-2 text-xs font-bold border rounded-xl flex items-center justify-between select-none",
                getStatusColor(fileStatus)
              )}
            >
              <span>{fileStatus}</span>
            </div>
          </div>

          {/* Last Changed Tag */}
          <div className="px-3.5 py-2.5 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold select-none">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Changed: {activeFile.metadata.last_modified}</span>
          </div>
        </div>

        {/* SECTION B: STATISTICS */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Statistics
          </h4>

          {/* Question Stats Info Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl font-black text-indigo-650 dark:text-indigo-400">{totalQuestions}</span>
            </div>

            {/* Checkboxes indicator */}
            <div className="flex-1 space-y-1.5">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Tổng số câu hỏi
              </h5>
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={hasAnswers}
                    onChange={(e) => setHasAnswers(e.target.checked)}
                    className="w-3 h-3 text-indigo-600 rounded" 
                  />
                  <span>Có đáp án</span>
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={hasExplanations}
                    onChange={(e) => setHasExplanations(e.target.checked)}
                    className="w-3 h-3 text-indigo-600 rounded" 
                  />
                  <span>Có giải thích</span>
                </label>
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={hasTags}
                    onChange={(e) => setHasTags(e.target.checked)}
                    className="w-3 h-3 text-indigo-600 rounded" 
                  />
                  <span>Có tag</span>
                </label>
              </div>
            </div>
          </div>

          {/* Solid Pie Chart: Tỉ Trọng Tag */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 flex flex-col items-center justify-center">
            <h5 className="text-xs font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider text-center">
              Tỉ Trọng Tag
            </h5>

            {/* SVG solid circle sectors representation */}
            <div className="relative w-32 h-32">
              {tagsData.length > 0 ? (
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {tagsData.map((tag, idx) => (
                    <path 
                      key={idx}
                      d={describeSlice(tag.startAngle, tag.endAngle)}
                      fill={tag.color}
                    >
                      <title>{`${tag.name}: ${tag.count}`}</title>
                    </path>
                  ))}
                </svg>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="#E2E8F0" className="dark:fill-slate-800" />
                </svg>
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                  {tagsData.length}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Tags
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            {tagsData.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] font-bold text-slate-500 dark:text-slate-450">
                {tagsData.map((tag, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name} ({tag.count})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 italic">Không có tag nào.</div>
            )}
          </div>
        </div>

        {/* SECTION C: NOTES */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Notes
            </h4>
            <span className={cn(
              "text-[9px] font-extrabold px-1.5 py-0.5 rounded",
              noteWordCount > 180 ? "bg-red-500/10 text-red-500" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
            )}>
              {noteWordCount}/200 từ
            </span>
          </div>
          <textarea
            value={activeFile.note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="w-full min-h-[90px] p-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            placeholder="Nhập ghi chú cho tệp tin này..."
          />
        </div>

      </div>

      {/* 3. EXPORT FOOTER BUTTON */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 shrink-0">
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="w-full min-h-11 bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export This File
        </button>
      </div>

      {/* --- EXPORT SETTING POPUP MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                  Cấu hình xuất bản tệp
                </h3>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Question quantity select */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Number of Question
                </label>
                <button
                  onClick={() => setIsQtyDropdownOpen(!isQtyDropdownOpen)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-855 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
                >
                  <span>{getQtyModeLabel(quantityMode)}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isQtyDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                    {([
                      { id: "ALL", label: "Tất cả" },
                      { id: "FIRST", label: "Câu đầu tiên" },
                      { id: "LAST", label: "Câu cuối cùng" },
                      { id: "RANGE", label: "Khoảng tùy chọn" }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setQuantityMode(opt.id); setIsQtyDropdownOpen(false); }}
                        className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", quantityMode === opt.id ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Range settings */}
              {quantityMode === "FIRST" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <input 
                    type="number" 
                    min={1}
                    max={activeFile.questions.length}
                    value={firstCount}
                    onChange={(e) => setFirstCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-2.5 py-1.5 text-xs font-bold border border-slate-250 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Câu đầu tiên của đề thi
                  </span>
                </div>
              )}

              {quantityMode === "LAST" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <input 
                    type="number" 
                    min={1}
                    max={activeFile.questions.length}
                    value={lastCount}
                    onChange={(e) => setLastCount(parseInt(e.target.value) || 1)}
                    className="w-20 px-2.5 py-1.5 text-xs font-bold border border-slate-250 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Câu cuối cùng của đề thi
                  </span>
                </div>
              )}

              {quantityMode === "RANGE" && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-bold text-slate-650 dark:text-slate-350">
                  <span>Từ câu</span>
                  <input 
                    type="number" 
                    min={1}
                    max={rangeEnd}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-slate-250 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-center"
                  />
                  <span>Đến câu</span>
                  <input 
                    type="number" 
                    min={rangeStart}
                    max={activeFile.questions.length}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-slate-250 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-center"
                  />
                </div>
              )}

              {/* Format selection dropdown */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  File Format
                </label>
                <button
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-855 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
                >
                  <span>{fileFormat}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isFormatDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                    {(["JSON", "DOCX"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => { setFileFormat(fmt); setIsFormatDropdownOpen(false); }}
                        className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", fileFormat === fmt ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter checkboxes */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 cursor-pointer transition-colors select-none">
                  <input 
                    type="checkbox"
                    checked={applyFilterSetting}
                    onChange={(e) => setApplyFilterSetting(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-extrabold text-slate-855 dark:text-slate-300">
                      Apply Filter Setting
                    </span>
                  </div>
                </label>
              </div>

            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleExportFile}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
