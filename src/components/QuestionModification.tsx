"use client";

import React, { useState } from "react";
import { 
  Edit3, 
  Plus, 
  Trash2, 
  Check, 
  HelpCircle, 
  Save, 
  Eye, 
  Settings, 
  ChevronDown, 
  FileText, 
  Code,
  Sparkles,
  FileCode,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionModificationProps {
  className?: string;
}

export default function QuestionModification({ className }: QuestionModificationProps) {
  // --- TABS CONTROL ---
  const [activeTab, setActiveTab] = useState<"DOCUMENT" | "QUESTION_VIEW" | "CODE_VIEW">("QUESTION_VIEW");

  // --- GENERAL FILE INFO ---
  const [fileName, setFileName] = useState("Đề thi giữa kỳ môn Toán.txt");
  const [fileFormat, setFileFormat] = useState<"JSON" | "DOCX">("JSON");
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // --- POPOVER VISIBILITY CONTROLS ---
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);

  // View Settings Options state
  const [visibleFields, setVisibleFields] = useState({
    question: true,
    answer: true,
    explanation: true,
    type: true,
    displayBlock: true,
    tags: true
  });
  const [displayMode, setDisplayMode] = useState<"List" | "Cards" | "Panel">("Cards");
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);

  // Filter & Sort Settings state
  const [filterAndSortEnabled, setFilterAndSortEnabled] = useState(true);
  const [filterType, setFilterType] = useState({
    singleChoice: true,
    multipleChoice: true
  });
  const [filterTags, setFilterTags] = useState({
    tag1: true,
    tag2: true
  });
  const [filterOthers, setFilterOthers] = useState({
    haveCorrectAnswer: false,
    haveExplanation: false,
    haveDisplayBlock: false
  });

  // --- EDITING QUESTION DATA STATE ---
  const [questionText, setQuestionText] = useState(
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, purus lectus malesuada libero"
  );
  
  const [answers, setAnswers] = useState([
    { id: "a", text: "Answer A", isCorrect: true },
    { id: "b", text: "Answer B", isCorrect: false },
    { id: "c", text: "Answer C", isCorrect: false },
    { id: "d", text: "Answer D", isCorrect: false }
  ]);

  const [questionType, setQuestionType] = useState<"Single Choice" | "Multiple Choice">("Single Choice");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState("Tag 1, Tag 2, Tag 3");

  // Dynamic additions state (Display Block & Explanation)
  const [displayBlocks, setDisplayBlocks] = useState<{ id: string; type: "Code" | "Image"; content: string }[]>([]);
  const [explanations, setExplanations] = useState<{ id: string; content: string }[]>([]);

  // --- DYNAMIC CONTROL ACTIONS ---
  const handleAddNewAnswer = () => {
    const nextLetter = String.fromCharCode(65 + answers.length);
    setAnswers(prev => [...prev, {
      id: Math.random().toString(),
      text: `Answer ${nextLetter}`,
      isCorrect: false
    }]);
  };

  const handleRemoveAnswer = (id: string) => {
    setAnswers(prev => prev.filter(ans => ans.id !== id));
  };

  const toggleAnswerCorrect = (id: string) => {
    setAnswers(prev => prev.map(ans => {
      if (questionType === "Single Choice") {
        return { ...ans, isCorrect: ans.id === id };
      } else {
        return { ...ans, isCorrect: ans.id === id ? !ans.isCorrect : ans.isCorrect };
      }
    }));
  };

  const handleAddDisplayBlock = () => {
    setDisplayBlocks(prev => [...prev, {
      id: Math.random().toString(),
      type: "Code",
      content: "[Select] Block Type"
    }]);
  };

  const handleRemoveDisplayBlock = (id: string) => {
    setDisplayBlocks(prev => prev.filter(db => db.id !== id));
  };

  const handleAddExplanation = () => {
    if (explanations.length === 0) {
      setExplanations([{
        id: Math.random().toString(),
        content: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Maecenas porttitor congue"
      }]);
    }
  };

  const handleRemoveExplanation = (id: string) => {
    setExplanations(prev => prev.filter(exp => exp.id !== id));
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm", className)}>
      
      {/* --- 1. MAIN HEADER (TÊN FILE & TABS) --- */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* File Name & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode className="w-5 h-5 text-indigo-650 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-black text-slate-850 dark:text-slate-100 truncate" title={fileName}>
            {fileName}
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase shrink-0">
            Quiz File
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(["DOCUMENT", "QUESTION_VIEW", "CODE_VIEW"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer",
                activeTab === tab 
                  ? "bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-350 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab === "DOCUMENT" && "Document"}
              {tab === "QUESTION_VIEW" && "Question View"}
              {tab === "CODE_VIEW" && "Code View"}
            </button>
          ))}
        </div>
      </div>

      {/* --- 2. WORKSPACE CONTENT (CHANGES ACCORDING TO TAB) --- */}
      <div className="flex-1 overflow-y-auto p-5 relative min-h-0">

        {/* --- TAB A: DOCUMENT VIEW --- */}
        {activeTab === "DOCUMENT" && (
          <div className="space-y-4 max-w-3xl mx-auto text-xs font-medium text-slate-700 dark:text-slate-350 leading-relaxed">
            <p>
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, purus lectus malesuada libero, nec adipiscing elit. Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, purus lectus malesuada libero, nec adipiscing elit. Maecenas porttitor congue massa.
            </p>
            <p>
              Nunc viverra imperdiet enim. Fusce est. Vivamus a tellus. consectetuer adipiscing elit. Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, purus lectus malesuada libero, nec adipiscing elit. Maecenas porttitor congue massa.
            </p>
            <p>
              Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci. consectetuer adipiscing elit. Maecenas porttitor congue massa. Fusce posuere, magna sed pulvinar ultricies, purus lectus malesuada libero.
            </p>
          </div>
        )}

        {/* --- TAB B: CODE VIEW --- */}
        {activeTab === "CODE_VIEW" && (
          <div className="h-full flex flex-col gap-4">
            <textarea
              readOnly
              value={`Câu 1: Theo Luật Nghĩa vụ quân sự hiện hành, độ tuổi gọi nhập ngũ trong thời bình là từ đủ 18 tuổi đến hết bao nhiêu tuổi đến hết bao nhiêu tuổi?
A. Từ đủ 18 tuổi đến hết 25 tuổi/
B. Từ đủ 17 tuổi đến hết 25 tuổi
C. Từ đủ 18 tuổi đến hết 27 tuổi
D. Từ đủ 19 tuổi đến hết 26 tuổi

[+] Độ tuổi gọi nhập ngũ thông thường trong thời bình là từ đủ 18 tuổi đến hết 25 tuổi; trường hợp công dân được đào tạo trình độ cao đẳng, đại học đã được tạm hoãn gọi nhập ngũ thì độ tuổi gọi nhập ngũ đến hết 27 tuổi. [/+]

Câu 2: Công dân được đào tạo trình độ cao đẳng, đại học đã được tạm hoãn gọi nhập ngũ trong thời bình thì độ tuổi gọi nhập ngũ đến hết bao nhiêu tuổi?
A. Hết 25 tuổi
B. Hết 26 tuổi
C. Hết 27 tuổi/
D. Hết 28 tuổi`}
              className="flex-1 w-full p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed resize-none focus:outline-none"
            />
            {/* Format Picker bar at bottom left */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500">Format:</span>
              <div className="relative">
                <button
                  onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{fileFormat}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isFormatDropdownOpen && (
                  <div className="absolute left-0 bottom-full mb-1 z-15 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 space-y-0.5">
                    {(["JSON", "DOCX"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => { setFileFormat(fmt); setIsFormatDropdownOpen(false); }}
                        className={cn("w-full px-2.5 py-1 text-[10px] text-left font-bold rounded cursor-pointer", fileFormat === fmt ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB C: QUESTION VIEW (VISUAL EDITOR) --- */}
        {activeTab === "QUESTION_VIEW" && (
          <div className="space-y-4 relative">
            
            {/* Sub-header Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Total: 1 Question
              </span>

              <div className="flex items-center gap-2 relative">
                {/* Add New Question */}
                <button
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-extrabold text-[10px] text-slate-750 dark:text-slate-300 hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  New Question
                </button>

                {/* View settings button (Eye 👁️) */}
                <button
                  onClick={() => { setIsViewSettingsOpen(!isViewSettingsOpen); setIsFilterSettingsOpen(false); }}
                  className={cn(
                    "p-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
                    isViewSettingsOpen 
                      ? "border-indigo-400 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  )}
                  title="View Settings"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Filter and Settings button (Gear ⚙️) */}
                <button
                  onClick={() => { setIsFilterSettingsOpen(!isFilterSettingsOpen); setIsViewSettingsOpen(false); }}
                  className={cn(
                    "p-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all",
                    isFilterSettingsOpen 
                      ? "border-indigo-400 bg-indigo-50/20 text-indigo-650 dark:text-indigo-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  )}
                  title="Filter & Sort"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* --- POPOVER 1: VIEW SETTINGS (EYE) --- */}
                {isViewSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-1.5">
                      Visibility
                    </h5>
                    <div className="space-y-2">
                      {Object.keys(visibleFields).map((field) => {
                        const isChecked = visibleFields[field as keyof typeof visibleFields];
                        return (
                          <label key={field} className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => setVisibleFields(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))}
                              className="w-3.5 h-3.5 text-indigo-600 rounded"
                            />
                            <span className="capitalize">{field.replace("Block", " Block")}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Display Mode
                      </label>
                      <button
                        onClick={() => setIsQtyDropdownOpen(!isQtyDropdownOpen)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
                      >
                        <span>{displayMode}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {isQtyDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 z-25 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg shadow-md p-1 space-y-0.5">
                          {(["List", "Cards", "Panel"] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => { setDisplayMode(mode); setIsQtyDropdownOpen(false); }}
                              className={cn("w-full p-1.5 text-left text-xs font-bold rounded cursor-pointer", displayMode === mode ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50")}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setIsViewSettingsOpen(false)} className="flex-1 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 cursor-pointer">
                        Cancel
                      </button>
                      <button onClick={() => setIsViewSettingsOpen(false)} className="flex-1 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-extrabold shadow-sm cursor-pointer">
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* --- POPOVER 2: FILTER & SORT SETTINGS (GEAR) --- */}
                {isFilterSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                      <h5 className="text-[10px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">
                        Filter & Sort
                      </h5>
                      <input 
                        type="checkbox"
                        checked={filterAndSortEnabled}
                        onChange={(e) => setFilterAndSortEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {/* Section Type */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/20">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Type</span>
                        <div className="space-y-1 mt-1">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterType.singleChoice}
                              onChange={() => setFilterType(prev => ({ ...prev, singleChoice: !prev.singleChoice }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Single Choice</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterType.multipleChoice}
                              onChange={() => setFilterType(prev => ({ ...prev, multipleChoice: !prev.multipleChoice }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Multiple Choice</span>
                          </label>
                        </div>
                      </div>

                      {/* Section Tags */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/20">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Tags</span>
                        <div className="space-y-1 mt-1">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterTags.tag1}
                              onChange={() => setFilterTags(prev => ({ ...prev, tag1: !prev.tag1 }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Tag 1</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterTags.tag2}
                              onChange={() => setFilterTags(prev => ({ ...prev, tag2: !prev.tag2 }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Tag 2</span>
                          </label>
                        </div>
                      </div>

                      {/* Section Others */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/20">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Others</span>
                        <div className="space-y-1 mt-1">
                          {Object.keys(filterOthers).map((key) => {
                            const val = filterOthers[key as keyof typeof filterOthers];
                            return (
                              <label key={key} className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={val}
                                  onChange={() => setFilterOthers(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                  className="w-3 h-3 text-indigo-600 rounded"
                                />
                                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setIsFilterSettingsOpen(false)} className="flex-1 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-50 cursor-pointer">
                        Cancel
                      </button>
                      <button onClick={() => setIsFilterSettingsOpen(false)} className="flex-1 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-extrabold shadow-sm cursor-pointer">
                        Apply
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* --- VISUAL ACTIVE QUESTION CARD EDITOR --- */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-5 relative">
              
              {/* Question Text Area */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Question
                </h5>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full min-h-[90px] p-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/30 dark:bg-slate-950/5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              {/* Answers Option area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1 shrink-0">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Answer
                  </h5>
                  <button
                    onClick={handleAddNewAnswer}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 text-[10px] text-indigo-750 dark:text-indigo-400 font-extrabold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    New Answer
                  </button>
                </div>

                <div className="space-y-2">
                  {answers.map((ans, idx) => (
                    <div 
                      key={ans.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900",
                        ans.isCorrect 
                          ? "border-green-500/35 bg-green-500/5 dark:bg-green-950/10" 
                          : "border-slate-200 dark:border-slate-800"
                      )}
                    >
                      {/* Check toggle for correct answer */}
                      <button
                        onClick={() => toggleAnswerCorrect(ans.id)}
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer",
                          ans.isCorrect 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "border-slate-300 dark:border-slate-700 text-transparent hover:border-green-500/55"
                        )}
                      >
                        <Check className="w-3 h-3" />
                      </button>

                      {/* Alphabet Badge */}
                      <span className="text-xs font-black text-slate-400 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>

                      {/* Answer Input text field */}
                      <input 
                        type="text"
                        value={ans.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswers(prev => prev.map(a => a.id === ans.id ? { ...a, text: val } : a));
                        }}
                        placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                        className="flex-1 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      />

                      {/* Remove Answer Option */}
                      <button
                        onClick={() => handleRemoveAnswer(ans.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-500 cursor-pointer shrink-0 transition-colors"
                        title="Xóa lựa chọn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower Settings (Question Type & Tags input side-by-side) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Question Type dropdown selector */}
                <div className="space-y-1.5 relative">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Question Type
                  </span>
                  <button
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-slate-350 cursor-pointer"
                  >
                    <span>{questionType}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                      {(["Single Choice", "Multiple Choice"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => { setQuestionType(type); setIsTypeDropdownOpen(false); }}
                          className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", questionType === type ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750")}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags input comma separated */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tags (split by comma)
                  </span>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="tag1, tag2..."
                  />
                </div>
              </div>

              {/* Dynamic Additions List: Display Blocks rendering */}
              {displayBlocks.length > 0 && (
                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  {displayBlocks.map((db, idx) => (
                    <div 
                      key={db.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 space-y-3 relative group/block"
                    >
                      {/* Delete Block */}
                      <button
                        onClick={() => handleRemoveDisplayBlock(db.id)}
                        className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-red-505 transition-colors cursor-pointer"
                        title="Xóa block"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Row block details */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="space-y-1.5 shrink-0 w-32 relative">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Block Type</span>
                          <button
                            onClick={() => {
                              // Simulating quick toggle between block types for mock UI
                              setDisplayBlocks(prev => prev.map(item => item.id === db.id ? { ...item, type: item.type === "Code" ? "Image" : "Code" } : item));
                            }}
                            className="w-full px-2.5 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between cursor-pointer"
                          >
                            <span>{db.type}</span>
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Content</span>
                          <input 
                            type="text"
                            placeholder={db.type === "Code" ? "Khai báo hàm / Code snippet..." : "Đường dẫn ảnh/URL ảnh..."}
                            value={db.content === "[Select] Block Type" ? "" : db.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDisplayBlocks(prev => prev.map(item => item.id === db.id ? { ...item, content: val } : item));
                            }}
                            className="w-full px-2.5 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-350 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic Additions List: Explanations rendering */}
              {explanations.map((exp) => (
                <div 
                  key={exp.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 space-y-1.5 relative"
                >
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Explanation
                  </label>
                  
                  {/* Delete Explanation */}
                  <button
                    onClick={() => handleRemoveExplanation(exp.id)}
                    className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-red-505 transition-colors cursor-pointer"
                    title="Xóa giải thích"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <textarea
                    value={exp.content}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExplanations(prev => prev.map(item => item.id === exp.id ? { ...item, content: val } : item));
                    }}
                    className="w-full min-h-[70px] p-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none leading-relaxed resize-y"
                    placeholder="Nhập nội dung giải thích..."
                  />
                </div>
              ))}

              {/* Action layout selectors buttons for Dynamic additions */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleAddDisplayBlock}
                  className="py-2.5 border border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer"
                >
                  + Add Display Block
                </button>
                <button
                  onClick={handleAddExplanation}
                  className="py-2.5 border border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all cursor-pointer"
                >
                  + Add Explanation
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
