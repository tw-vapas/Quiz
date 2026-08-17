"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuizStore, CreatorFile } from "@/store/quizStore";
import { Question, Option, DisplayBlock } from "../lib/parser";
import MarkdownRenderer from "./MarkdownRenderer";
import { parseQuizJson, parseQuizText } from "@/lib/parser";
import { cn, getTagColor, STORAGE_LIMIT_BYTES, getQuizStorageUsedBytesExcept } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import { 
  Plus, 
  Trash2, 
  Check, 
  HelpCircle, 
  Save, 
  Settings, 
  ChevronDown, 
  FileCode, 
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RotateCcw,
  Filter,
  Sparkles,
  Copy,
  Upload,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

export function isQuestionValid(q: Question): boolean {
  if (!q || !q.text || q.text.trim().length === 0) return false;
  if (!Array.isArray(q.options) || q.options.length === 0) return false;
  const hasEmptyOption = q.options.some(opt => !opt.text || opt.text.trim().length === 0);
  if (hasEmptyOption) return false;
  if (!Array.isArray(q.correctOptionIds) || q.correctOptionIds.length === 0) return false;
  const optionIds = new Set(q.options.map(o => o.id));
  return q.correctOptionIds.every(id => optionIds.has(id));
}

interface QuestionCardProps {
  index: number;
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

function QuestionCard({ index, question, onUpdate, onDelete }: QuestionCardProps) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState(() => question?.tags?.join(", ") || "");
  const isValid = isQuestionValid(question);

  const prevQuestionIdRef = React.useRef(question?.id);
  if (prevQuestionIdRef.current !== question?.id) {
    prevQuestionIdRef.current = question?.id;
    setTagsInput(question?.tags?.join(", ") || "");
  }

  // Keyboard shortcut: press A/B/C/D to toggle correct answer
  useEffect(() => {
    if (!question) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.length !== 1 || key < "A" || key > "Z") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const options = question.options;
      const correctIds = question.correctOptionIds;
      const qType = question.type;
      const optionIndex = key.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < options.length) {
        e.preventDefault();
        const ansId = options[optionIndex].id;
        let newCorrectIds: string[];
        if (qType === "single_choice") {
          newCorrectIds = [ansId];
        } else {
          newCorrectIds = correctIds.includes(ansId)
            ? correctIds.filter(id => id !== ansId)
            : [...correctIds, ansId];
        }
        onUpdate({ correctOptionIds: newCorrectIds });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question?.options, question?.correctOptionIds, question?.type]);

  if (!question) return null;

  const typeLabel = question.type === "single_choice" ? "Single Choice" : "Multiple Choice";

  const handleAddNewAnswer = () => {
    const nextLetter = String.fromCharCode(65 + question.options.length);
    const newAns = {
      id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      text: `Đáp án mới`,
      originalText: `${nextLetter}. Đáp án mới`
    };
    onUpdate({ options: [...question.options, newAns] });
  };

  const handleAnswerTextChange = (ansId: string, text: string) => {
    const sliced = text.slice(0, 150);
    const updatedOptions = question.options.map(opt => 
      opt.id === ansId ? { ...opt, text: sliced, originalText: `${opt.originalText.substring(0, 3)}${sliced}` } : opt
    );
    onUpdate({ options: updatedOptions });
  };

  const handleRemoveAnswer = (ansId: string) => {
    const updatedOptions = question.options.filter(opt => opt.id !== ansId);
    const correctIds = question.correctOptionIds.filter(id => id !== ansId);
    onUpdate({ options: updatedOptions, correctOptionIds: correctIds });
  };

  const handleToggleAnswerCorrect = (ansId: string) => {
    let correctIds: string[] = [];
    if (question.type === "single_choice") {
      correctIds = [ansId];
    } else {
      if (question.correctOptionIds.includes(ansId)) {
        correctIds = question.correctOptionIds.filter(id => id !== ansId);
      } else {
        correctIds = [...question.correctOptionIds, ansId];
      }
    }
    onUpdate({ correctOptionIds: correctIds });
  };

  const handleTypeChange = (type: "single_choice" | "multiple_choice") => {
    let correctIds = [...question.correctOptionIds];
    if (type === "single_choice" && correctIds.length > 1) {
      correctIds = [correctIds[0]];
    }
    onUpdate({ type, correctOptionIds: correctIds });
  };

  const handleAddDisplayBlock = () => {
    const blocks = question.display_blocks || [];
    if (blocks.length >= 2) {
      useQuizStore.getState().showNotification("Mỗi câu hỏi chỉ được thêm tối đa 2 Display Block!", "error");
      return;
    }
    const newBlock = { type: "code", content: "Khai báo / Code snippet..." };
    onUpdate({ display_blocks: [...blocks, newBlock] });
  };

  const handleTagsChange = (val: string) => {
    setTagsInput(val);
  };

  const handleSaveTags = () => {
    if (!question) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);

    // Validate 16 characters maximum length per tag
    const hasLongTag = tags.some(t => t.length > 16);
    if (hasLongTag) {
      useQuizStore.getState().showNotification("Mỗi nhãn thẻ (tag) chỉ được tối đa 16 ký tự!", "error");
      setTagsInput((question.tags || []).join(", "));
      return;
    }

    // Truncate to maximum of 5 tags
    let finalTags = tags;
    if (finalTags.length > 5) {
      finalTags = finalTags.slice(0, 5);
      setTagsInput(finalTags.join(", "));
    }

    const currentTags = question.tags || [];
    const isSame = finalTags.length === currentTags.length && 
                   finalTags.every((t, i) => t === currentTags[i]);
    if (!isSame) {
      onUpdate({ tags: finalTags });
    }
  };

  const handleRemoveDisplayBlock = (blockIdx: number) => {
    const blocks = question.display_blocks || [];
    const updatedBlocks = blocks.filter((_, idx) => idx !== blockIdx);
    onUpdate({ display_blocks: updatedBlocks });
  };

  const handleDisplayBlockChange = (blockIdx: number, fields: Partial<DisplayBlock>) => {
    const blocks = question.display_blocks || [];
    const updatedBlocks = blocks.map((b, idx) => idx === blockIdx ? { ...b, ...fields } : b);
    onUpdate({ display_blocks: updatedBlocks });
  };

  const handleAddExplanation = () => {
    onUpdate({ explanation: "Giải thích chi tiết..." });
  };

  const handleRemoveExplanation = () => {
    onUpdate({ explanation: null });
  };

  const handleExplanationChange = (explanation: string) => {
    onUpdate({ explanation });
  };

  const canAddDisplayBlock = (question.display_blocks || []).length < 2;
  const canAddExplanation = question.explanation === null || question.explanation === undefined;

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2b51] shadow-sm space-y-5 relative">
      {/* Header index and Delete option */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-650 dark:text-indigo-400">CÂU HỎI {index + 1}</span>
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1",
            isValid
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
          )}>
            {isValid ? "✓ Hợp lệ" : "✕ Chưa hợp lệ"}
          </span>
        </div>
        <button 
          onClick={onDelete}
          className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-300 hover:text-red-550 transition-colors cursor-pointer"
          title="Xóa câu hỏi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question Text Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Question</h5>
          <span className={cn("text-[9px] font-mono font-bold", question.text.length >= 1000 ? "text-red-500 font-extrabold" : "text-slate-400")}>
            {question.text.length}/1000
          </span>
        </div>
        <textarea
          maxLength={1000}
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value.slice(0, 1000) })}
          className="w-full h-28 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/30 dark:bg-[#22325a] text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar"
          placeholder="Nhập nội dung câu hỏi (tối đa 1000 ký tự)..."
        />
      </div>

      {/* Answers Options Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-1">
          <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Answers</h5>
            <button
              onClick={handleAddNewAnswer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 text-[10px] text-indigo-750 dark:text-indigo-400 font-extrabold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> New Answer
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((ans, idx) => {
              const isCorrect = question.correctOptionIds.includes(ans.id);
              return (
                <div 
                  key={ans.id}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-200 bg-white dark:bg-[#22325a]",
                    isCorrect 
                      ? "border-green-500/35 bg-green-500/5 dark:bg-green-950/30" 
                      : "border-slate-200 dark:border-slate-600"
                  )}
                >
                  {/* Correct Toggle Indicator */}
                  <button
                    onClick={() => handleToggleAnswerCorrect(ans.id)}
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer mt-1",
                      isCorrect 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-slate-300 dark:border-slate-500 text-transparent hover:border-green-500/55"
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-black text-slate-400 dark:text-slate-300 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>

                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <textarea 
                      maxLength={150}
                      value={ans.text}
                      onChange={(e) => handleAnswerTextChange(ans.id, e.target.value)}
                      placeholder={`Đáp án ${String.fromCharCode(65 + idx)} (tối đa 150 ký tự)...`}
                      rows={1}
                      className="w-full bg-transparent text-xs font-bold text-slate-850 dark:text-slate-100 focus:outline-none resize-none overflow-y-auto leading-relaxed min-h-[26px]"
                      onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = "auto";
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                    {ans.text.length >= 100 && (
                      <span className={cn("text-[9px] font-mono self-end", ans.text.length >= 150 ? "text-red-500 font-bold" : "text-slate-400")}>
                        {ans.text.length}/150
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveAnswer(ans.id)}
                    className="p-1 rounded-md text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0 mt-0.5"
                    title="Xóa đáp án"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      {/* Type and Tags inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 relative">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider block">Question Type</span>
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#22325a] text-slate-800 dark:text-slate-100 flex items-center justify-between hover:border-slate-350 cursor-pointer"
            >
              <span>{typeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 z-20 bg-white dark:bg-[#1e2d5a] border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg p-1.5 space-y-1">
                <button
                  onClick={() => { handleTypeChange("single_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", question.type === "single_choice" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  Single Choice
                </button>
                <button
                  onClick={() => { handleTypeChange("multiple_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg cursor-pointer", question.type === "multiple_choice" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  Multiple Choice
                </button>
              </div>
            )}
          </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider block">Tags (comma separated)</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => handleTagsChange(e.target.value)}
            onBlur={handleSaveTags}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveTags();
                e.currentTarget.blur();
              }
            }}
            className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-[#22325a] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="tag1, tag2..."
          />
        </div>
      </div>

      {/* Display Blocks list */}
      {(question.display_blocks || []).length > 0 && (
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-white/10">
          {(question.display_blocks || []).map((db, blockIdx) => (
            <div key={blockIdx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/20 dark:bg-[#1e2d5a] space-y-2.5 relative group/block">
              {/* Top Header Bar with Block Label and Delete Button */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-1.5">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  DISPLAY BLOCK #{blockIdx + 1}
                </span>
                <button
                  onClick={() => handleRemoveDisplayBlock(blockIdx)}
                  className="p-1 rounded-md text-slate-400 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Xóa block"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="space-y-1.5 shrink-0 w-32">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider block">Block Type</span>
                  <select
                    value={db.type}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { type: e.target.value })}
                    className="w-full px-2 py-1.5 text-[10px] font-bold border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#22325a] text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="code">Code</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider block">Content</span>
                    <span className={cn("text-[9px] font-mono font-bold", db.content.length >= 1000 ? "text-red-500 font-extrabold" : "text-slate-400")}>
                      {db.content.length}/1000
                    </span>
                  </div>
                  <textarea
                    maxLength={1000}
                    placeholder={db.type === "code" ? "Khai báo hàm / Code snippet..." : "Đường dẫn ảnh/URL..."}
                    value={db.content}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { content: e.target.value.slice(0, 1000) })}
                    className="w-full h-28 p-2.5 text-xs font-mono border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#22325a] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explanation Area */}
      {question.explanation !== undefined && question.explanation !== null && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/20 dark:bg-[#1e2d5a] space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider block">Explanation</label>
            <div className="flex items-center gap-3">
              <span className={cn("text-[9px] font-mono font-bold", (question.explanation || "").length >= 1000 ? "text-red-500 font-extrabold" : "text-slate-400")}>
                {(question.explanation || "").length}/1000
              </span>
              <button
                onClick={handleRemoveExplanation}
                className="p-1 rounded-md text-slate-400 dark:text-slate-300 hover:text-red-500 cursor-pointer"
                title="Xóa giải thích"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            maxLength={1000}
            value={question.explanation}
            onChange={(e) => handleExplanationChange(e.target.value.slice(0, 1000))}
            className="w-full h-28 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-[#22325a] text-xs font-semibold text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar"
            placeholder="Nhập nội dung giải thích (tối đa 1000 ký tự)..."
          />
        </div>
      )}

      {/* Dynamic Blocks & Explanation actions */}
      {(canAddDisplayBlock || canAddExplanation) && (
        <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/10">
          {canAddDisplayBlock && (
            <button
              onClick={handleAddDisplayBlock}
              className="flex-1 py-2 border border-dashed border-slate-250 dark:border-slate-600 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              + Add Display Block ({(question.display_blocks || []).length}/2)
            </button>
          )}
          {canAddExplanation && (
            <button
              onClick={handleAddExplanation}
              className="flex-1 py-2 border border-dashed border-slate-250 dark:border-slate-600 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              + Add Explanation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface IdeEditorProps {
  value: string;
  onChange: (val: string) => void;
  jsonError: string | null;
}

function IdeEditor({ value, onChange, jsonError }: IdeEditorProps) {
  const lines = useMemo(() => value.split("\n"), [value]);
  
  const highlightedLines = useMemo(() => {
    const grammar = Prism.languages.json || Prism.languages.javascript;
    const lang = Prism.languages.json ? "json" : "javascript";
    return value.split("\n").map(line => {
      if (!line) return "";
      return Prism.highlight(line, grammar, lang);
    });
  }, [value]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = target.scrollTop;
      preRef.current.scrollLeft = target.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = target.scrollTop;
    }
  };

  return (
    <div className={cn(
      "flex-1 w-full rounded-2xl border font-mono text-xs overflow-hidden flex flex-col min-h-[380px] relative shadow-inner transition-colors duration-200",
      jsonError 
        ? "border-red-500/40 bg-slate-900"
        : "border-slate-200 dark:border-slate-800 bg-slate-900"
    )}>
      {/* Editor Header / Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 text-[10px] font-sans text-slate-400 select-none shrink-0">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500/80" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <span className="w-2 h-2 rounded-full bg-green-500/80" />
          <span className="ml-1.5 text-slate-350 font-mono">editor.json</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded font-extrabold text-slate-400">JSON Editor</span>
      </div>

      <div className="flex-1 flex min-h-0 relative w-full overflow-hidden">
        {/* Line Numbers Gutter */}
        <div 
          ref={gutterRef}
          className="w-10 bg-slate-950/40 text-right pr-2.5 py-4 border-r border-slate-800/60 text-slate-500 select-none overflow-hidden shrink-0 font-mono text-[11px] leading-5"
        >
          {lines.map((_, i) => (
            <div key={i} className="h-5">{i + 1}</div>
          ))}
        </div>

        {/* Text Area and Code View Container */}
        <div className="flex-1 relative overflow-hidden h-full">
          {/* Highlighted code behind */}
          <pre 
            ref={preRef}
            className="absolute inset-0 p-4 font-mono text-[11px] leading-5 text-slate-350 pointer-events-none overflow-auto whitespace-pre style-scrollbar"
            style={{ margin: 0, tabSize: 2 }}
          >
            {highlightedLines.map((line, i) => (
              <div key={i} className="h-5 whitespace-pre" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            ))}
          </pre>

          {/* Invisible Textarea on top */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 p-4 font-mono text-[11px] leading-5 bg-transparent text-transparent caret-indigo-400 focus:outline-none resize-none w-full h-full overflow-auto whitespace-pre style-scrollbar"
            style={{ margin: 0, tabSize: 2, WebkitTextFillColor: "transparent" }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

const SYSTEM_PROMPT_TEMPLATE = `Bạn là một trợ lý giáo dục chuyên nghiệp. Dưới đây là danh sách các câu hỏi trắc nghiệm.
Hãy đọc kỹ từng câu hỏi và xác định đáp án đúng cùng với lời giải thích chi tiết.
Trả về KẾT QUẢ DUY NHẤT dưới dạng mảng JSON thuần túy (không chứa markdown \`\`\`json hay bất kỳ văn bản nào khác ngoài JSON) theo đúng cấu trúc sau:

[
  {
    "Question": 1,
    "CorrectOptions": ["A"],
    "Explanation": "Lời giải thích chi tiết..."
  }
]

- "CorrectOptions": Mảng chứa các chữ cái đại diện cho đáp án đúng (ví dụ: ["A"] hoặc ["A", "C"]).
- "Explanation": Chuỗi giải thích lý do tại sao đáp án đó đúng.

Danh sách câu hỏi cần xử lý:
[Dán danh sách câu hỏi của bạn vào đây]`;

interface SupplementComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: CreatorFile | undefined;
  onApply: (updatedQuestions: Question[], countUpdated: number) => void;
}

function SupplementComponentModal({ isOpen, onClose, activeFile, onApply }: SupplementComponentModalProps) {
  const [mainMode, setMainMode] = useState<"ANSWERS_EXPLANATION" | "RAW_TEXT_QUESTIONS">("ANSWERS_EXPLANATION");
  const [activeTab, setActiveTab] = useState<"FILE" | "PASTE">("FILE");
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Tab 2 Raw text questions state
  const [rawText, setRawText] = useState("");
  const [importStrategy, setImportStrategy] = useState<"APPEND" | "OVERWRITE" | "REPLACE_ALL">("APPEND");

  useEffect(() => {
    if (isOpen) {
      setMainMode("ANSWERS_EXPLANATION");
      setActiveTab("FILE");
      setJsonText("");
      setFileName(null);
      setIsCopied(false);
      setRawText("");
      setImportStrategy("APPEND");
    }
  }, [isOpen]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(SYSTEM_PROMPT_TEMPLATE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      useQuizStore.getState().showNotification("Đã sao chép Prompt mẫu cho AI!", "success");
    } catch {
      useQuizStore.getState().showNotification("Không thể sao chép tự động, hãy chọn văn bản và sao chép thủ công.", "error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content || "");
    };
    reader.readAsText(file, "UTF-8");
  };

  const analysis = useMemo(() => {
    if (!isOpen || !activeFile || mainMode !== "ANSWERS_EXPLANATION" || !jsonText.trim()) return null;

    let cleaned = jsonText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err: any) {
      return { error: `Định dạng JSON không hợp lệ: ${err.message}` };
    }

    if (!Array.isArray(parsed)) {
      if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      } else {
        return { error: "Dữ liệu JSON phải là một mảng danh sách [ { ... }, { ... } ]" };
      }
    }

    const totalQuestions = activeFile.questions.length;
    let matchedCount = 0;
    const warnings: string[] = [];
    const updatesMap = new Map<number, { correctOptionIds: string[]; type: "single_choice" | "multiple_choice"; explanation?: string }>();

    parsed.forEach((item: any, index: number) => {
      const itemStt = item.Question ?? item.question ?? (index + 1);
      if (typeof itemStt !== "number" || isNaN(itemStt)) {
        warnings.push(`Mục thứ ${index + 1}: Trường "Question" không hợp lệ (không phải dạng số).`);
        return;
      }

      const qIndex = itemStt - 1;
      if (qIndex < 0 || qIndex >= totalQuestions) {
        warnings.push(`Câu STT ${itemStt}: Không tồn tại trong tệp hiện tại (Tệp có tổng cộng ${totalQuestions} câu hỏi).`);
        return;
      }

      const targetQuestion = activeFile.questions[qIndex];
      const correctOptionIds: string[] = [];

      const rawOptions = item.CorrectOptions ?? item.correctOptions ?? item.correct_options ?? item.correctOptionsLetters;
      let letters: string[] = [];
      if (Array.isArray(rawOptions)) {
        letters = rawOptions.map(l => String(l).trim());
      } else if (typeof rawOptions === "string") {
        letters = rawOptions.split(/[,;\s]+/).filter(Boolean);
      } else if (typeof rawOptions === "number") {
        letters = [String.fromCharCode(64 + rawOptions)];
      }

      letters.forEach(letter => {
        const cleanLetter = letter.toUpperCase();
        let letterIdx = cleanLetter.charCodeAt(0) - 65;
        if (isNaN(letterIdx) || letterIdx < 0) {
          const num = parseInt(cleanLetter, 10);
          if (!isNaN(num) && num >= 1) {
            letterIdx = num - 1;
          }
        }

        if (letterIdx >= 0 && letterIdx < targetQuestion.options.length) {
          correctOptionIds.push(targetQuestion.options[letterIdx].id);
        } else {
          warnings.push(`Câu STT ${itemStt}: Đáp án "${letter}" không tồn tại (Câu này có ${targetQuestion.options.length} lựa chọn A-${String.fromCharCode(64 + targetQuestion.options.length)}).`);
        }
      });

      const explanation = typeof item.Explanation === "string" ? item.Explanation.trim() : typeof item.explanation === "string" ? item.explanation.trim() : undefined;

      if (correctOptionIds.length > 0 || explanation) {
        matchedCount++;
        updatesMap.set(qIndex, {
          correctOptionIds: correctOptionIds.length > 0 ? correctOptionIds : targetQuestion.correctOptionIds,
          type: correctOptionIds.length > 1 ? "multiple_choice" : "single_choice",
          explanation: explanation !== undefined ? explanation : targetQuestion.explanation
        });
      }
    });

    return {
      totalItems: parsed.length,
      matchedCount,
      warnings,
      updatesMap
    };
  }, [isOpen, mainMode, jsonText, activeFile]);

  // Live Analysis for Tab 2 Raw text questions
  const rawTextAnalysis = useMemo(() => {
    if (!isOpen || !activeFile || mainMode !== "RAW_TEXT_QUESTIONS" || !rawText.trim()) return null;

    try {
      const result = parseQuizText(rawText, false);
      const parsedQuestions = result.questions || [];
      const validQuestionsCount = parsedQuestions.filter((q: Question) => isQuestionValid(q)).length;
      return {
        totalCount: parsedQuestions.length,
        validCount: validQuestionsCount,
        questions: parsedQuestions,
        error: result.error || null
      };
    } catch (err: any) {
      return {
        totalCount: 0,
        validCount: 0,
        questions: [],
        error: `Lỗi phân tích cú pháp: ${err.message}`
      };
    }
  }, [isOpen, mainMode, rawText, activeFile]);

  const handleConfirm = () => {
    if (!activeFile) return;

    if (mainMode === "ANSWERS_EXPLANATION") {
      if (!analysis || analysis.error || !analysis.updatesMap) return;

      const newQuestions = activeFile.questions.map((q, idx) => {
        const update = analysis.updatesMap?.get(idx);
        if (!update) return q;

        return {
          ...q,
          correctOptionIds: update.correctOptionIds.length > 0 ? update.correctOptionIds : q.correctOptionIds,
          type: update.correctOptionIds.length > 1 ? "multiple_choice" : q.type,
          explanation: update.explanation !== undefined ? update.explanation : q.explanation
        };
      });

      onApply(newQuestions, analysis.matchedCount);
      onClose();
    } else {
      if (!rawTextAnalysis || rawTextAnalysis.questions.length === 0) return;

      const newParsed = rawTextAnalysis.questions;
      let finalQuestions: Question[] = [];

      if (importStrategy === "APPEND") {
        finalQuestions = [...activeFile.questions, ...newParsed];
      } else if (importStrategy === "REPLACE_ALL") {
        finalQuestions = newParsed;
      } else if (importStrategy === "OVERWRITE") {
        const merged = [...activeFile.questions];
        newParsed.forEach((q: Question, idx: number) => {
          if (idx < merged.length) {
            merged[idx] = q;
          } else {
            merged.push(q);
          }
        });
        finalQuestions = merged;
      }

      onApply(finalQuestions, newParsed.length);
      onClose();
    }
  };

  if (!isOpen || !activeFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Bổ sung Thành phần &amp; Câu hỏi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Thao tác tệp <span className="font-bold text-indigo-600 dark:text-indigo-400">"{activeFile.name}"</span> ({activeFile.questions.length} câu hiện có)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Mode Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
          <button
            type="button"
            onClick={() => setMainMode("ANSWERS_EXPLANATION")}
            className={cn(
              "py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              mainMode === "ANSWERS_EXPLANATION"
                ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bổ sung Đáp án &amp; Giải thích (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setMainMode("RAW_TEXT_QUESTIONS")}
            className={cn(
              "py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              mainMode === "RAW_TEXT_QUESTIONS"
                ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Nhập nhanh Câu hỏi (Text thô)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 style-scrollbar">
          
          {mainMode === "ANSWERS_EXPLANATION" ? (
            <>
              {/* Copy Prompt Section */}
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Bạn chưa có file đáp án JSON từ AI?</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Sao chép Prompt mẫu bên dưới dán vào ChatGPT / Gemini để nhận lại file JSON đúng chuẩn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-all shadow-xs",
                    isCopied 
                      ? "bg-emerald-600 text-white" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95"
                  )}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép Prompt AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* Import Modes Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Phương thức nhập dữ liệu JSON:
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-750">
                    <button
                      type="button"
                      onClick={() => setActiveTab("FILE")}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeTab === "FILE"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      Tải tệp JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("PASTE")}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        activeTab === "PASTE"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      Dán đoạn JSON
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                {activeTab === "FILE" ? (
                  <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-900/30">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {fileName ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{fileName}</span>
                          ) : (
                            "Nhấp để chọn tệp .json hoặc kéo thả vào đây"
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          Chỉ chấp nhận tệp có định dạng .json
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder={`[
  { "Question": 1, "CorrectOptions": ["A"], "Explanation": "..." },
  { "Question": 2, "CorrectOptions": ["B"], "Explanation": "..." }
]`}
                      className="w-full h-40 p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none style-scrollbar"
                    />
                  </div>
                )}
              </div>

              {/* Analysis & Validation Results */}
              {analysis && (
                <div className="space-y-3 pt-2">
                  {analysis.error ? (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{analysis.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Summary badge */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Đã tìm thấy <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{analysis.totalItems}</strong> mục JSON. Đủ điều kiện bổ sung cho <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{analysis.matchedCount} / {activeFile.questions.length}</strong> câu hỏi.
                          </span>
                        </div>
                      </div>

                      {/* Warnings list if any */}
                      {Boolean(analysis.warnings && analysis.warnings.length > 0) && (
                        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 max-h-36 overflow-y-auto style-scrollbar">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Cảnh báo ({analysis.warnings?.length || 0}):</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300 pl-1">
                            {analysis.warnings?.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Dán danh sách câu hỏi dạng văn bản thô (ví dụ: <code className="bg-slate-200/80 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">Câu 1: ... A. ... B. ...</code>). Hệ thống sẽ tự động quét và bóc tách câu hỏi.
              </div>

              {/* Import Strategy selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Chế độ áp dụng câu hỏi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportStrategy("APPEND")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between select-none",
                      importStrategy === "APPEND"
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-bold">Thêm nối tiếp</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Nối vào cuối tệp hiện tại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportStrategy("OVERWRITE")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between select-none",
                      importStrategy === "OVERWRITE"
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-bold">Ghi đè từ đầu</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Thay thế từ câu số 1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportStrategy("REPLACE_ALL")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between select-none",
                      importStrategy === "REPLACE_ALL"
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-bold">Thay thế toàn bộ</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Xóa bộ cũ &amp; thay bằng bộ mới</span>
                  </button>
                </div>
              </div>

              {/* Raw Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nội dung văn bản câu hỏi:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội /
B. TP. Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ

Câu 2: Đơn vị đo cường độ dòng điện là gì?
A. Vôn (V)
B. Ampe (A) /
C. Ôm (Ω)
D. Oát (W)`}
                  className="w-full h-40 p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none style-scrollbar"
                />
              </div>

              {/* Live Preview badge for Raw Text */}
              {rawTextAnalysis && (
                <div className="space-y-2 pt-1">
                  {rawTextAnalysis.error && rawTextAnalysis.totalCount === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{rawTextAnalysis.error}</span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          Đã bóc tách thành công <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{rawTextAnalysis.totalCount}</strong> câu hỏi ({rawTextAnalysis.validCount} câu hợp lệ).
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              mainMode === "ANSWERS_EXPLANATION"
                ? !analysis || Boolean(analysis.error) || analysis.matchedCount === 0
                : !rawTextAnalysis || Boolean(rawTextAnalysis.error && rawTextAnalysis.totalCount === 0) || rawTextAnalysis.totalCount === 0
            }
            className="px-5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {mainMode === "ANSWERS_EXPLANATION"
                ? `Xác nhận bổ sung (${analysis?.matchedCount || 0} câu)`
                : `Xác nhận nhập (${rawTextAnalysis?.totalCount || 0} câu)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}

interface QuestionModificationProps {
  className?: string;
  filterType: {
    singleChoice: boolean;
    multipleChoice: boolean;
  };
  setFilterType: React.Dispatch<React.SetStateAction<{
    singleChoice: boolean;
    multipleChoice: boolean;
  }>>;
  filterOthers: {
    haveCorrectAnswer: boolean;
    haveExplanation: boolean;
    haveDisplayBlock: boolean;
  };
  setFilterOthers: React.Dispatch<React.SetStateAction<{
    haveCorrectAnswer: boolean;
    haveExplanation: boolean;
    haveDisplayBlock: boolean;
  }>>;
  selectedTagsFilter: Record<string, boolean>;
  setSelectedTagsFilter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function QuestionModification({ 
  className,
  filterType,
  setFilterType,
  filterOthers,
  setFilterOthers,
  selectedTagsFilter,
  setSelectedTagsFilter
}: QuestionModificationProps) {
  const activeFileId = useQuizStore(state => state.activeFileId);
  const creatorFiles = useQuizStore(state => state.creatorFiles);
  const updateCreatorFile = useQuizStore(state => state.updateCreatorFile);
  const storeSources = useQuizStore(state => state.sources);

  const activeFile = useMemo(() => creatorFiles.find(f => f.id === activeFileId), [creatorFiles, activeFileId]);
  const lastFileIdRef = React.useRef<string | null>(null);

  // --- TABS CONTROL ---
  const [activeTab, setActiveTab] = useState<"DOCUMENT" | "QUESTION_VIEW" | "CODE_VIEW">("QUESTION_VIEW");
  const [docSubTab, setDocSubTab] = useState<"EDIT" | "PREVIEW">("PREVIEW");

  // FormatPicker dropdown state
  const [fileFormat, setFileFormat] = useState<"JSON" | "DOCX">("JSON");
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  // JSON code state (local buffer)
  const [codeText, setCodeText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Sync store to local JSON buffer when selecting file or switching tabs
  const getFileJson = (file: CreatorFile) => {
    const pkg = {
      metadata: file.metadata,
      document: file.document,
      note: file.note,
      questions: file.questions
    };
    return JSON.stringify(pkg, null, 2);
  };

  useEffect(() => {
    if (activeFile && activeTab === "CODE_VIEW") {
      setCodeText(getFileJson(activeFile));
      setJsonError(null);
    }
  }, [activeFile?.id, activeTab]);

  // --- POPOVER VISIBILITY CONTROLS ---
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);
  const [isSupplementModalOpen, setIsSupplementModalOpen] = useState(false);

  const handleApplySupplement = (updatedQuestions: Question[], countUpdated: number) => {
    if (!activeFile) return;
    updateCreatorFile(activeFile.id, { questions: updatedQuestions });
    useQuizStore.getState().showNotification(`Đã bổ sung thành công đáp án & giải thích cho ${countUpdated} câu hỏi!`, "success");
  };

  const [displayMode, setDisplayMode] = useState<"List" | "Cards" | "Panel">("Panel");

  // Filter & Sort Settings state
  const [filterAndSortEnabled, setFilterAndSortEnabled] = useState(false);

  // Extract tags from active file questions
  const allUniqueTags = useMemo(() => {
    if (!activeFile) return [];
    const tags = new Set<string>();
    activeFile.questions.forEach(q => {
      q.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [activeFile]);

  useEffect(() => {
    if (!activeFile) return;
    if (lastFileIdRef.current !== activeFile.id) {
      lastFileIdRef.current = activeFile.id;
      const initial: Record<string, boolean> = {};
      allUniqueTags.forEach(t => {
        initial[t] = true;
      });
      setSelectedTagsFilter(initial);
    } else {
      setSelectedTagsFilter(prev => {
        const updated = { ...prev };
        let changed = false;
        allUniqueTags.forEach(t => {
          if (updated[t] === undefined) {
            updated[t] = true;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [allUniqueTags, activeFile, setSelectedTagsFilter]);

  // Sorting priorities state
  const [typeOrder, setTypeOrder] = useState<string[]>(["single_choice", "multiple_choice"]);
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    setTagOrder(prev => {
      const newTags = allUniqueTags.filter(t => !prev.includes(t));
      const removedTagsRemoved = prev.filter(t => allUniqueTags.includes(t));
      const next = [...removedTagsRemoved, ...newTags];
      const isSame = prev.length === next.length && prev.every((t, i) => t === next[i]);
      return isSame ? prev : next;
    });
  }, [allUniqueTags]);

  const moveTypeOrder = (idx: number, dir: "UP" | "DOWN") => {
    const newOrder = [...typeOrder];
    if (dir === "UP" && idx > 0) {
      [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    } else if (dir === "DOWN" && idx < typeOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    setTypeOrder(newOrder);
  };

  const moveTagOrder = (idx: number, dir: "UP" | "DOWN") => {
    const newOrder = [...tagOrder];
    if (dir === "UP" && idx > 0) {
      [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    } else if (dir === "DOWN" && idx < tagOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    }
    setTagOrder(newOrder);
  };

  // Question editing actions
  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    if (!activeFile) return;
    const updatedQs = activeFile.questions.map(q => q.id === qId ? { ...q, ...updates } : q);
    updateCreatorFile(activeFile.id, { questions: updatedQs });
  };

  const deleteQuestion = (qId: string) => {
    if (!activeFile) return;
    const updatedQs = activeFile.questions.filter(q => q.id !== qId);
    updateCreatorFile(activeFile.id, { questions: updatedQs });
  };

  const addNewQuestion = () => {
    if (!activeFile) return;
    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: "Câu hỏi mới",
      options: [
        { id: "a", text: "Lựa chọn A", originalText: "A. Lựa chọn A" },
        { id: "b", text: "Lựa chọn B", originalText: "B. Lựa chọn B" }
      ],
      correctOptionIds: ["a"],
      type: "single_choice",
      explanation: "",
      tags: [],
      display_blocks: []
    };

    // Calculate simulated storage size if this question is appended
    const simulatedFiles = creatorFiles.map((f) => {
      if (f.id === activeFile.id) {
        const nextQuestions = [...f.questions, newQ];
        return {
          ...f,
          questions: nextQuestions,
          metadata: {
            ...f.metadata,
            question_count: nextQuestions.length,
            last_modified: Date.now()
          }
        };
      }
      return f;
    });

    const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_creator_files");
    const estimatedNewFilesBytes = JSON.stringify(simulatedFiles).length * 2;
    const totalEstimatedBytes = otherBytes + estimatedNewFilesBytes;

    if (totalEstimatedBytes > STORAGE_LIMIT_BYTES) {
      useQuizStore.getState().showNotification(
        "Không thể tạo thêm câu hỏi mới: Bộ nhớ lưu trữ đã đầy.",
        "error"
      );
      return;
    }

    updateCreatorFile(activeFile.id, { questions: [...activeFile.questions, newQ] });
    setSelectedPanelQuestionId(newQ.id);
  };

  // Multi-level sort function
  const getSortedQuestions = (qs: Question[]) => {
    if (!activeFile) return qs;
    return [...qs].sort((a, b) => {
      // 1. Sort by Type priority
      const typeIndexA = typeOrder.indexOf(a.type);
      const typeIndexB = typeOrder.indexOf(b.type);
      if (typeIndexA !== typeIndexB) return typeIndexA - typeIndexB;

      // 2. Sort by Tag priority
      const getHighestTagPriority = (q: Question) => {
        if (!q.tags || q.tags.length === 0) return tagOrder.length;
        const priorities = q.tags.map(t => {
          const idx = tagOrder.indexOf(t);
          return idx === -1 ? tagOrder.length : idx;
        });
        return Math.min(...priorities);
      };
      const tagPriorityA = getHighestTagPriority(a);
      const tagPriorityB = getHighestTagPriority(b);
      if (tagPriorityA !== tagPriorityB) return tagPriorityA - tagPriorityB;

      // 3. Fallback: stable order based on original index in file
      const indexA = activeFile.questions.findIndex(q => q.id === a.id);
      const indexB = activeFile.questions.findIndex(q => q.id === b.id);
      return indexA - indexB;
    });
  };

  // Compute final filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    if (!activeFile) return [];
    
    let list = activeFile.questions.filter(q => {
      const matchType = (q.type === "single_choice" && filterType.singleChoice) || 
                        (q.type === "multiple_choice" && filterType.multipleChoice);
                        
      const matchTags = !q.tags || q.tags.length === 0 || q.tags.some(t => selectedTagsFilter[t]);
      
      const matchCorrect = !filterOthers.haveCorrectAnswer || q.correctOptionIds.length > 0;
      const matchExp = !filterOthers.haveExplanation || !!q.explanation;
      const matchBlock = !filterOthers.haveDisplayBlock || (q.display_blocks && q.display_blocks.length > 0);
      
      return matchType && matchTags && matchCorrect && matchExp && matchBlock;
    });

    if (filterAndSortEnabled) {
      list = getSortedQuestions(list);
    }
    
    return list;
  }, [activeFile?.questions, filterType, selectedTagsFilter, filterOthers, filterAndSortEnabled, typeOrder, tagOrder]);



  // Panel view selected item state
  const [selectedPanelQuestionId, setSelectedPanelQuestionId] = useState<string | null>(null);
  const questionItemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  
  const panelQuestion = useMemo(() => {
    if (filteredQuestions.length === 0) return null;
    return filteredQuestions.find(q => q.id === selectedPanelQuestionId) || filteredQuestions[0];
  }, [filteredQuestions, selectedPanelQuestionId]);

  // Auto scroll the selected question item into view in the list panel
  useEffect(() => {
    if (activeTab !== "QUESTION_VIEW" || displayMode !== "Panel" || !panelQuestion?.id) return;
    const el = questionItemRefs.current[panelQuestion.id];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [activeTab, displayMode, panelQuestion?.id]);

  // Arrow key navigation for Question View panel
  useEffect(() => {
    if (activeTab !== "QUESTION_VIEW" || displayMode !== "Panel") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
      const currentIdx = filteredQuestions.findIndex(q => q.id === panelQuestion?.id);
      if ((e.key === "ArrowRight" || e.key === "ArrowDown") && currentIdx < filteredQuestions.length - 1) {
        setSelectedPanelQuestionId(filteredQuestions[currentIdx + 1].id);
      } else if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && currentIdx > 0) {
        setSelectedPanelQuestionId(filteredQuestions[currentIdx - 1].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, displayMode, filteredQuestions, panelQuestion]);

  // Manual save for Code view
  const handleSaveJson = () => {
    if (!activeFile) return;
    const result = parseQuizJson(codeText);
    if (result.isValid) {
      const updatedFileName = result.metadata?.file_name || activeFile.name;
      const formattedTime = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).replace(",", "");

      // Estimate the new size of creatorFiles after saving
      const simulatedFiles = creatorFiles.map((f) => {
        if (f.id === activeFile.id) {
          return {
            ...f,
            name: updatedFileName,
            questions: result.questions,
            document: result.document || "",
            note: result.note || "",
            metadata: {
              ...f.metadata,
              file_name: updatedFileName,
              question_count: result.questions.length,
              last_modified: formattedTime
            }
          };
        }
        return f;
      });

      const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_creator_files");
      const estimatedNewFilesBytes = JSON.stringify(simulatedFiles).length * 2;
      const totalEstimatedBytes = otherBytes + estimatedNewFilesBytes;

      if (totalEstimatedBytes > STORAGE_LIMIT_BYTES) {
        useQuizStore.getState().showNotification(
          "Không thể lưu: Dung lượng tệp tin sau chỉnh sửa vượt quá giới hạn và đầy bộ nhớ lưu trữ.",
          "error"
        );
        return;
      }

      updateCreatorFile(activeFile.id, {
        questions: result.questions,
        document: result.document || "",
        note: result.note || "",
        metadata: {
          ...activeFile.metadata,
          file_name: updatedFileName,
          question_count: result.questions.length,
          last_modified: formattedTime
        }
      });
      if (result.metadata?.file_name && result.metadata.file_name !== activeFile.name) {
        updateCreatorFile(activeFile.id, { name: result.metadata.file_name });
      }
      setJsonError(null);
      useQuizStore.getState().showNotification("Lưu tệp tin thành công!", "success");
    } else {
      setJsonError(result.error || "Lỗi schema JSON.");
    }
  };

  // Render empty state if no active file
  if (!activeFile) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm items-center justify-center p-8", className)}>
        <FileCode className="w-16 h-16 text-indigo-500/30 mb-4" />
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">No File Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">Chọn một tệp từ File Manager ở cột bên trái hoặc tạo tệp mới để bắt đầu chỉnh sửa câu hỏi.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm", className)}>
      
      {/* 1. HEADER */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-black text-slate-850 dark:text-slate-100 truncate" title={activeFile.name}>
            {activeFile.name}
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            Quiz File
          </span>
        </div>

        {/* Tab Selection */}
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

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden p-5 relative min-h-0 flex flex-col">
        
        {/* --- TAB A: DOCUMENT VIEW --- */}
        {activeTab === "DOCUMENT" && (
          <div className="h-full flex flex-col gap-4">
            {/* Sub tab toggles */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button 
                onClick={() => setDocSubTab("PREVIEW")}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold", docSubTab === "PREVIEW" ? "bg-indigo-500/10 text-indigo-600" : "text-slate-400 hover:bg-slate-50")}
              >
                Xem trước
              </button>
              <button 
                onClick={() => setDocSubTab("EDIT")}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold", docSubTab === "EDIT" ? "bg-indigo-500/10 text-indigo-600" : "text-slate-400 hover:bg-slate-50")}
              >
                Chỉnh sửa
              </button>
            </div>

            {/* Document Editor / Viewer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {docSubTab === "PREVIEW" ? (
                <div className="prose dark:prose-invert max-w-none text-xs">
                  {activeFile.document ? (
                    <MarkdownRenderer content={activeFile.document} />
                  ) : (
                    <div className="text-center py-12 text-slate-400">Tài liệu trống. Hãy nhấn nút Chỉnh sửa để thêm nội dung.</div>
                  )}
                </div>
              ) : (
                <textarea
                  value={activeFile.document}
                  onChange={(e) => updateCreatorFile(activeFile.id, { document: e.target.value })}
                  placeholder="Nhập nội dung tài liệu học tập bằng định dạng Markdown (.md)..."
                  className="w-full h-full p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-xs font-mono text-slate-700 dark:text-slate-300 resize-none focus:outline-none custom-scrollbar"
                />
              )}
            </div>
          </div>
        )}

        {/* --- TAB B: CODE VIEW --- */}
        {activeTab === "CODE_VIEW" && (
          <div className="h-full flex flex-col gap-4">
            <IdeEditor 
              value={codeText}
              onChange={setCodeText}
              jsonError={jsonError}
            />

            {/* Validation errors banner */}
            {jsonError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-xl">
                ❌ {jsonError}
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Format dropdown picker */}
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
                          className={cn("w-full px-2.5 py-1 text-[10px] text-left font-bold rounded cursor-pointer", fileFormat === fmt ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50")}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Save JSON action */}
              <button 
                onClick={handleSaveJson}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {/* --- TAB C: QUESTION VIEW (VISUAL EDITOR) --- */}
        {activeTab === "QUESTION_VIEW" && (
          <div className="flex-1 min-h-0 flex flex-col space-y-3 relative overflow-hidden">
            
            {/* Options Sub-Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Total: {filteredQuestions.length} / {activeFile.questions.length} Questions
                </span>
                {(filterAndSortEnabled || filteredQuestions.length !== activeFile.questions.length) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterAndSortEnabled(false);
                      setFilterType({ singleChoice: true, multipleChoice: true });
                      setFilterOthers({ haveCorrectAnswer: false, haveExplanation: false, haveDisplayBlock: false });
                      const resetTags: Record<string, boolean> = {};
                      allUniqueTags.forEach(t => { resetTags[t] = true; });
                      setSelectedTagsFilter(resetTags);
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                    title="Khôi phục trạng thái xem mặc định"
                  >
                    <span>Lọc đang mở</span>
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 relative">
                {/* Add New Question */}
                <button
                  onClick={addNewQuestion}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-extrabold text-[11px] text-slate-750 dark:text-slate-200 hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>New Question</span>
                </button>

                {/* Bổ sung thành phần (Supplement Component) */}
                <button
                  type="button"
                  onClick={() => setIsSupplementModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 font-extrabold text-[11px] text-indigo-700 dark:text-indigo-300 hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  title="Bổ sung đáp án đúng và lời giải thích từ AI (JSON)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Bổ sung thành phần</span>
                </button>

                {/* Filter & Sort Button */}
                <button
                  type="button"
                  onClick={() => setIsFilterSettingsOpen(!isFilterSettingsOpen)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-[11px] font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm relative select-none",
                    isFilterSettingsOpen || filterAndSortEnabled
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  )}
                  title="Filter & Sort settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter & Sort</span>
                  {filterAndSortEnabled && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </button>

                {/* --- REDESIGNED POPOVER: FILTER & SORT --- */}
                {isFilterSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Filter className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-850 dark:text-slate-100">
                            Bộ lọc & Sắp xếp
                          </h5>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Tùy chỉnh hiển thị và thứ tự ưu tiên câu hỏi
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsFilterSettingsOpen(false)}
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Master Switch */}
                    <div 
                      onClick={() => setFilterAndSortEnabled(!filterAndSortEnabled)}
                      className={cn(
                        "p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between select-none",
                        filterAndSortEnabled
                          ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
                      )}
                    >
                      <div>
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200">
                          Kích hoạt lọc & sắp xếp
                        </span>
                        <span className="block text-[10px] text-slate-400 font-medium">
                          Áp dụng các tiêu chí lọc bên dưới cho danh sách
                        </span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={filterAndSortEnabled}
                        onChange={(e) => setFilterAndSortEnabled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0 ml-2"
                      />
                    </div>

                    {/* Scrollable Form Sections */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      
                      {/* Section 1: Question Types */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          1. Loại câu hỏi
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <label className={cn(
                            "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all select-none",
                            filterType.singleChoice
                              ? "border-indigo-500 bg-indigo-50/20 text-indigo-900 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-800 text-slate-500"
                          )}>
                            <span>Single Choice</span>
                            <input 
                              type="checkbox"
                              checked={filterType.singleChoice}
                              onChange={() => setFilterType(prev => ({ ...prev, singleChoice: !prev.singleChoice }))}
                              className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className={cn(
                            "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all select-none",
                            filterType.multipleChoice
                              ? "border-indigo-500 bg-indigo-50/20 text-indigo-900 dark:text-indigo-300"
                              : "border-slate-200 dark:border-slate-800 text-slate-500"
                          )}>
                            <span>Multiple Choice</span>
                            <input 
                              type="checkbox"
                              checked={filterType.multipleChoice}
                              onChange={() => setFilterType(prev => ({ ...prev, multipleChoice: !prev.multipleChoice }))}
                              className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Section 2: Tags Filter */}
                      {allUniqueTags.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              2. Lọc theo Thẻ Nhãn (Tags)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const allSelected = allUniqueTags.every(t => selectedTagsFilter[t]);
                                const nextState: Record<string, boolean> = {};
                                allUniqueTags.forEach(t => { nextState[t] = !allSelected; });
                                setSelectedTagsFilter(nextState);
                              }}
                              className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              {allUniqueTags.every(t => selectedTagsFilter[t]) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto custom-scrollbar p-1">
                            {allUniqueTags.map(tag => {
                              const isChecked = !!selectedTagsFilter[tag];
                              return (
                                <label 
                                  key={tag} 
                                  className={cn(
                                    "p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all select-none",
                                    isChecked 
                                      ? "border-indigo-500/60 bg-indigo-50/20 text-indigo-900 dark:text-indigo-300" 
                                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                                  )}
                                >
                                  <span className="truncate max-w-[100px]">{tag}</span>
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => setSelectedTagsFilter(prev => ({ ...prev, [tag]: !prev[tag] }))}
                                    className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer shrink-0"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 3: Others Filter */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          3. Tiêu chí phụ
                        </span>
                        <div className="space-y-1.5">
                          {[
                            { key: "haveCorrectAnswer", label: "Chỉ hiện câu CÓ đáp án đúng" },
                            { key: "haveExplanation", label: "Chỉ hiện câu CÓ lời giải thích" },
                            { key: "haveDisplayBlock", label: "Chỉ hiện câu CÓ Display Block" }
                          ].map(item => {
                            const isChecked = (filterOthers as any)[item.key];
                            return (
                              <label
                                key={item.key}
                                className={cn(
                                  "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all select-none",
                                  isChecked
                                    ? "border-indigo-500 bg-indigo-50/20 text-indigo-900 dark:text-indigo-300"
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                )}
                              >
                                <span>{item.label}</span>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => setFilterOthers(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                                  className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section 4: Sort Priorities */}
                      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                          4. Thứ tự ưu tiên sắp xếp
                        </span>
                        
                        {/* Type Order */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Ưu tiên theo Loại câu hỏi:</span>
                          {typeOrder.map((t, idx) => (
                            <div key={t} className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-750">
                              <span>{idx + 1}. {t === "single_choice" ? "Single Choice" : "Multiple Choice"}</span>
                              <div className="flex gap-1">
                                <button type="button" onClick={() => moveTypeOrder(idx, "UP")} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"><ArrowUp className="w-3.5 h-3.5 text-slate-500" /></button>
                                <button type="button" onClick={() => moveTypeOrder(idx, "DOWN")} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"><ArrowDown className="w-3.5 h-3.5 text-slate-500" /></button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tag Order */}
                        {tagOrder.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block">Ưu tiên theo Thẻ nhãn:</span>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                              {tagOrder.map((tag, idx) => (
                                <div key={tag} className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-750">
                                  <span className="truncate max-w-[120px]">{idx + 1}. {tag}</span>
                                  <div className="flex gap-1">
                                    <button type="button" onClick={() => moveTagOrder(idx, "UP")} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"><ArrowUp className="w-3.5 h-3.5 text-slate-500" /></button>
                                    <button type="button" onClick={() => moveTagOrder(idx, "DOWN")} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"><ArrowDown className="w-3.5 h-3.5 text-slate-500" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Footer Action Buttons */}
                    <div className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        type="button"
                        onClick={() => {
                          setFilterAndSortEnabled(false);
                          setFilterType({ singleChoice: true, multipleChoice: true });
                          setFilterOthers({ haveCorrectAnswer: false, haveExplanation: false, haveDisplayBlock: false });
                          const resetTags: Record<string, boolean> = {};
                          allUniqueTags.forEach(t => { resetTags[t] = true; });
                          setSelectedTagsFilter(resetTags);
                        }} 
                        className="flex-1 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Mặc định</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsFilterSettingsOpen(false)} 
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/20 active:scale-98 transition-all cursor-pointer"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- VISUAL DISPLAY MODES WORKSPACES --- */}

            {/* Chế độ Panel split view */}
            {displayMode === "Panel" && (
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-10 gap-4 overflow-y-auto lg:overflow-hidden">
                {/* Section 1: Question Setting (Editor on the left) */}
                <div className="lg:col-span-7 h-full overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  {panelQuestion ? (
                    <QuestionCard 
                      key={panelQuestion.id}
                      index={filteredQuestions.indexOf(panelQuestion)}
                      question={panelQuestion}
                      onUpdate={(updates) => updateQuestion(panelQuestion.id, updates)}
                      onDelete={() => {
                        deleteQuestion(panelQuestion.id);
                        setSelectedPanelQuestionId(null);
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-2xl text-slate-400">
                      Chọn câu hỏi bên bảng danh sách để bắt đầu chỉnh sửa.
                    </div>
                  )}
                </div>

                {/* Section 2: Question List (List selector on the right) */}
                <div className="lg:col-span-3 h-full border border-slate-250 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-4 flex flex-col min-h-0">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 mb-2 shrink-0">Danh sách câu hỏi</h5>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {filteredQuestions.length > 0 ? (
                      filteredQuestions.map((q, idx) => {
                        const isSelected = panelQuestion?.id === q.id;
                        const qValid = isQuestionValid(q);
                        return (
                          <div 
                            key={q.id}
                            ref={(el) => { questionItemRefs.current[q.id] = el; }}
                            onClick={() => setSelectedPanelQuestionId(q.id)}
                            className={cn(
                              "p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none text-left relative",
                              qValid
                                ? (isSelected 
                                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 shadow-sm"
                                    : "border-emerald-500/70 dark:border-emerald-500/50 bg-white dark:bg-slate-900 hover:border-emerald-500")
                                : (isSelected
                                    ? "border-red-500 bg-red-50/20 dark:bg-red-950/30 shadow-sm ring-2 ring-red-500/20"
                                    : "border-red-500/80 dark:border-red-500/60 bg-red-50/10 dark:bg-red-950/10 hover:border-red-500")
                            )}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-[10px] text-indigo-650 dark:text-indigo-400">CÂU {idx + 1}</span>
                              <span className={cn(
                                "text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 leading-none",
                                qValid 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                              )} title={qValid ? "Câu hỏi hợp lệ" : "Câu hỏi chưa hợp lệ (thiếu đáp án hoặc thông tin)"}>
                                {qValid ? "✓" : "✕"}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{q.text || "(Chưa có nội dung câu hỏi)"}</p>
                            {q.tags && q.tags.filter(Boolean).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {q.tags.filter(Boolean).map((t, tagIdx) => {
                                  const colors = getTagColor(t);
                                  return (
                                    <span key={`${t}_${tagIdx}`} className={cn(
                                      "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border shadow-sm",
                                      colors.bg,
                                      colors.text,
                                      colors.border
                                    )}>{t}</span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-bold select-none">Danh sách trống.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Supplement Component Modal */}
        <SupplementComponentModal
          isOpen={isSupplementModalOpen}
          onClose={() => setIsSupplementModalOpen(false)}
          activeFile={activeFile}
          onApply={handleApplySupplement}
        />

      </div>
    </div>
  );
}
