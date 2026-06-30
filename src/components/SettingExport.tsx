"use client";

import React, { useState } from "react";
import { 
  Settings2, 
  Download, 
  ChevronDown, 
  Info, 
  Clock, 
  Tag, 
  FileText, 
  Check, 
  X,
  Layers,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingExportProps {
  className?: string;
}

type FileStatusType = 
  | "Valid File" 
  | "Missing Answer Option" 
  | "Missing Correct Answer" 
  | "Syntax Error" 
  | "Empty File";

export default function SettingExport({ className }: SettingExportProps) {
  // --- GENERAL INFORMATION STATES ---
  const [fileName, setFileName] = useState("Đề thi giữa kỳ môn Toán.txt");
  const [fileType, setFileType] = useState<"QUIZ" | "SUPPORT">("QUIZ");
  const [fileStatus, setFileStatus] = useState<FileStatusType>("Valid File");
  const [lastChanged, setLastChanged] = useState("14:30 30/06/2026");

  // --- STATS STATES ---
  const [hasAnswers, setHasAnswers] = useState(true);
  const [hasExplanations, setHasExplanations] = useState(true);
  const [hasTags, setHasTags] = useState(true);
  const totalQuestions = 10;

  // Mock tag list for pie weight
  const tagsData = [
    { name: "Đại số", count: 4, color: "#6366F1", dashArray: "25 100", dashOffset: "0" },     // Indigo - 40%
    { name: "Hình học", count: 3, color: "#10B981", dashArray: "30 100", dashOffset: "-25" },  // Emerald - 30%
    { name: "Tích phân", count: 2, color: "#F59E0B", dashArray: "20 100", dashOffset: "-55" }, // Amber - 20%
    { name: "Tổ hợp", count: 1, color: "#EF4444", dashArray: "25 100", dashOffset: "-75" }     // Red - 10%
  ];

  // --- NOTES STATE ---
  const [notes, setNotes] = useState(
    "Bộ đề kiểm tra kiến thức Toán giải tích lớp 12 học kỳ 1. Tập trung vào các chuyên đề khảo sát hàm số, đạo hàm và tích phân ứng dụng thực tế."
  );

  // --- EXPORT MODAL STATES ---
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [quantityMode, setQuantityMode] = useState<"ALL" | "FIRST" | "LAST" | "RANGE">("ALL");
  const [firstCount, setFirstCount] = useState(5);
  const [lastCount, setLastCount] = useState(5);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(10);
  const [fileFormat, setFileFormat] = useState<"JSON" | "DOCX">("JSON");
  const [applyFilterSetting, setApplyFilterSetting] = useState(false);

  // Dropdown open states for forms
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // --- STYLE UTILITIES ---
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
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
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
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 dark:hover:border-slate-700 cursor-pointer"
            >
              <span>{fileType === "QUIZ" ? "Quiz File" : "Supported File"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 z-15 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                <button
                  onClick={() => { setFileType("QUIZ"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", fileType === "QUIZ" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                >
                  Quiz File
                </button>
                <button
                  onClick={() => { setFileType("SUPPORT"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", fileType === "SUPPORT" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                >
                  Supported File
                </button>
              </div>
            )}
          </div>

          {/* Status Select Dropdown */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Status
            </label>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className={cn(
                "w-full px-3 py-2 text-xs font-bold border rounded-xl flex items-center justify-between cursor-pointer",
                getStatusColor(fileStatus)
              )}
            >
              <span>{fileStatus}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1.5 z-15 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1 max-h-[180px] overflow-y-auto">
                {(["Valid File", "Missing Answer Option", "Missing Correct Answer", "Syntax Error", "Empty File"] as FileStatusType[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => { setFileStatus(st); setIsStatusDropdownOpen(false); }}
                    className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", fileStatus === st ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Last Changed Tag */}
          <div className="px-3.5 py-2.5 rounded-xl border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold select-none">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Changed: {lastChanged}</span>
          </div>
        </div>

        {/* SECTION B: STATISTICS */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Statistics
          </h4>

          {/* Question Stats Info Box */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center gap-4">
            {/* Total Large Indicator */}
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

          {/* Donut Chart: Tỉ Trọng Tag */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 flex flex-col items-center justify-center">
            <h5 className="text-xs font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider text-center">
              Tỉ Trọng Tag
            </h5>

            {/* SVG Donut */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#E2E8F0" 
                  className="dark:stroke-slate-800"
                  strokeWidth="10"
                />
                
                {/* Segments drawing (Mock calculations based on static Tag ratios) */}
                {/* 40% Algebra (dasharray: 220, offset: 0) */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#6366F1" 
                  strokeWidth="10"
                  strokeDasharray="88 220"
                  strokeDashoffset="0"
                />

                {/* 30% Geometry (dasharray: 220, offset: -88) */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#10B981" 
                  strokeWidth="10"
                  strokeDasharray="66 220"
                  strokeDashoffset="-88"
                />

                {/* 20% Integral (dasharray: 220, offset: -154) */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#F59E0B" 
                  strokeWidth="10"
                  strokeDasharray="44 220"
                  strokeDashoffset="-154"
                />

                {/* 10% Combination (dasharray: 220, offset: -198) */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill="transparent" 
                  stroke="#EF4444" 
                  strokeWidth="10"
                  strokeDasharray="22 220"
                  strokeDashoffset="-198"
                />
              </svg>

              {/* Total Number in Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-805 dark:text-slate-100 leading-none">
                  {totalQuestions}
                </span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Tag
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-[10px] font-bold text-slate-500 dark:text-slate-450">
              {tagsData.map((tag, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="truncate">{tag.name} ({tag.count})</span>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* SECTION C: NOTES */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Notes
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[90px] p-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            placeholder="Nhập ghi chú cho tệp tin này..."
          />
        </div>

      </div>

      {/* 3. FIXED EXPORT ACTION FOOTER BUTTON */}
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
              
              {/* Dropdown 1: Number of Question */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Number of Question
                </label>
                <button
                  onClick={() => setIsQtyDropdownOpen(!isQtyDropdownOpen)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
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
                        className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", quantityMode === opt.id ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Number Input fields depending on QuantityMode */}
              {quantityMode === "FIRST" && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <input 
                    type="number" 
                    min={1}
                    max={totalQuestions}
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
                    max={totalQuestions}
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
                    max={totalQuestions}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-slate-250 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-center"
                  />
                </div>
              )}

              {/* Dropdown 2: File Format */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  File Format
                </label>
                <button
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
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
                        className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", fileFormat === fmt ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Checkbox: Apply Filter Setting */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:bg-slate-50/50 cursor-pointer transition-colors select-none">
                  <input 
                    type="checkbox"
                    checked={applyFilterSetting}
                    onChange={(e) => setApplyFilterSetting(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-300">
                      Apply Filter Setting
                    </span>
                  </div>
                </label>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={() => {
                  setIsExportModalOpen(false);
                  alert(`Xuất bản đề thi thành công dưới dạng ${fileFormat}!`);
                }}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
