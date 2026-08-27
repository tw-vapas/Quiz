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
  CheckCircle2,
  Undo2,
  Redo2
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

function AnswerTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      if (ref.current.scrollHeight > 0) {
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      onInput={(e) => {
        const target = e.currentTarget;
        target.style.height = "auto";
        if (target.scrollHeight > 0) {
          target.style.height = `${target.scrollHeight}px`;
        }
      }}
    />
  );
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
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<
    | { type: "question" }
    | { type: "option"; optionId: string; optionLabel: string }
    | null
  >(null);
  const isValid = isQuestionValid(question);

  const prevQuestionIdRef = React.useRef(question?.id);
  if (prevQuestionIdRef.current !== question?.id) {
    prevQuestionIdRef.current = question?.id;
    setTagsInput(question?.tags?.join(", ") || "");
  }

  // Keyboard shortcut: press A/B/C/D to toggle correct answer, Delete to open delete modal, Enter to confirm delete
  useEffect(() => {
    if (!question) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (deleteConfirmTarget) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (deleteConfirmTarget.type === "question") {
            onDelete();
          } else {
            handleRemoveAnswer(deleteConfirmTarget.optionId);
          }
          setDeleteConfirmTarget(null);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDeleteConfirmTarget(null);
        }
        return;
      }

      if (isInput) return;

      if (e.key === "Delete" || e.key === "Del") {
        e.preventDefault();
        setDeleteConfirmTarget({ type: "question" });
        return;
      }

      const key = e.key.toUpperCase();
      if (key.length === 1 && key >= "A" && key <= "Z") {
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question?.options, question?.correctOptionIds, question?.type, deleteConfirmTarget, onDelete]);

  if (!question) return null;

  const typeLabel = question.type === "single_choice" ? "1 đáp án" : "Nhiều đáp án";

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
    const newBlock = { type: "code", content: "" };
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
    <div className="p-5 sm:p-6 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 shadow-md space-y-5 relative transition-all duration-200">
      {/* Header index and Delete option */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2">
        <span className="text-lg font-semibold text-indigo-650 dark:text-indigo-400">
          Câu hỏi {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <div 
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center border text-xs font-semibold shrink-0 select-none",
              isValid 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
            )}
            title={isValid ? "Câu hỏi hợp lệ (Đủ nội dung và đáp án)" : "Câu hỏi chưa hợp lệ (Thiếu nội dung hoặc đáp án đúng)"}
          >
            {isValid ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
          </div>
          <button 
            onClick={() => setDeleteConfirmTarget({ type: "question" })}
            className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 dark:text-slate-300 hover:text-red-550 transition-colors cursor-pointer"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Text Area */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nội dung</h5>
          <span className={cn("text-xs font-mono font-medium", question.text.length >= 1000 ? "text-red-500 font-semibold" : "text-slate-400")}>
            {question.text.length}/1000
          </span>
        </div>
        <textarea
          maxLength={1000}
          value={question.text}
          onChange={(e) => onUpdate({ text: e.target.value.slice(0, 1000) })}
          className="w-full h-28 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-sm font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
          placeholder="Nhập nội dung câu hỏi (tối đa 1000 ký tự)..."
        />
      </div>

      {/* Answers Options Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
          <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Đáp án</h5>
            <button
              onClick={handleAddNewAnswer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 text-sm text-indigo-750 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Thêm đáp án
            </button>
          </div>

          <div className="space-y-2">
            {question.options.map((ans, idx) => {
              const isCorrect = question.correctOptionIds.includes(ans.id);
              return (
                <div 
                  key={ans.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-200",
                    isCorrect 
                      ? "border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/30 dark:border-emerald-800/60" 
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30"
                  )}
                >
                  {/* Correct Toggle Indicator */}
                  <button
                    onClick={() => handleToggleAnswerCorrect(ans.id)}
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer",
                      isCorrect 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500/55"
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-300 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>

                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <AnswerTextarea 
                      maxLength={150}
                      value={ans.text}
                      onChange={(e) => handleAnswerTextChange(ans.id, e.target.value)}
                      placeholder={`Nhập đáp án ${String.fromCharCode(65 + idx)} (tối đa 150 ký tự)...`}
                      className="w-full bg-transparent text-sm font-normal text-slate-850 dark:text-slate-100 focus:outline-none resize-none overflow-y-auto leading-relaxed py-0.5 custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    {ans.text.length >= 100 && (
                      <span className={cn("text-xs font-mono self-end", ans.text.length >= 150 ? "text-red-500 font-semibold" : "text-slate-400")}>
                        {ans.text.length}/150
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setDeleteConfirmTarget({ type: "option", optionId: ans.id, optionLabel: String.fromCharCode(65 + idx) })}
                    className="p-1 rounded-md text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
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
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Loại câu hỏi</span>
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full px-3 py-2 text-sm font-normal border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 flex items-center justify-between hover:border-slate-350 cursor-pointer"
            >
              <span>{typeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-300" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-1.5 space-y-1">
                <button
                  onClick={() => { handleTypeChange("single_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-sm font-normal rounded-lg cursor-pointer", question.type === "single_choice" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 font-semibold" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  1 đáp án
                </button>
                <button
                  onClick={() => { handleTypeChange("multiple_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-sm font-normal rounded-lg cursor-pointer", question.type === "multiple_choice" ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 font-semibold" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5")}
                >
                  Nhiều đáp án
                </button>
              </div>
            )}
          </div>

        <div className="space-y-1.5">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Thẻ phân loại</span>
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
            className="w-full px-3 py-2 text-sm font-normal border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            placeholder="Nhập thẻ phân loại (vd: toán, lý, hóa)..."
          />
        </div>
      </div>

      {/* Display Blocks list */}
      {(question.display_blocks || []).length > 0 && (
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(question.display_blocks || []).map((db, blockIdx) => (
            <div key={blockIdx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 space-y-2.5 relative group/block">
              {/* Top Header Bar with Block Label and Delete Button */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-1.5">
                <span className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300">
                  Khối hiển thị #{blockIdx + 1}
                </span>
                <button
                  onClick={() => handleRemoveDisplayBlock(blockIdx)}
                  className="p-1 rounded-md text-slate-400 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Xóa block"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <div className="space-y-1.5 w-full">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Loại khối</span>
                  <select
                    value={db.type}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { type: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm font-normal border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="code">Code</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">Nội dung</span>
                    <span className={cn("text-xs font-mono font-medium", db.content.length >= 1000 ? "text-red-500 font-semibold" : "text-slate-400")}>
                      {db.content.length}/1000
                    </span>
                  </div>
                  <textarea
                    maxLength={1000}
                    placeholder="Nhập nội dung khối hiển thị (tối đa 1000 ký tự)..."
                    value={db.content}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { content: e.target.value.slice(0, 1000) })}
                    className="w-full h-28 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-sm font-normal font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar placeholder:font-sans placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explanation Area */}
      {question.explanation !== undefined && question.explanation !== null && (
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 space-y-2.5 relative">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-1.5">
            <label className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 block">Giải thích</label>
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-mono font-medium", (question.explanation || "").length >= 1000 ? "text-red-500 font-semibold" : "text-slate-400")}>
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
            className="w-full h-28 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 text-sm font-normal text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none overflow-y-auto custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
              Thêm khối hiển thị ({(question.display_blocks || []).length}/2)
            </button>
          )}
          {canAddExplanation && (
            <button
              onClick={handleAddExplanation}
              className="flex-1 py-2 border border-dashed border-slate-250 dark:border-slate-600 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              Thêm giải thích
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal for Deleting Question / Option */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {deleteConfirmTarget.type === "question" ? "Xác nhận xóa câu hỏi" : `Xác nhận xóa đáp án ${deleteConfirmTarget.optionLabel}`}
              </h3>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {deleteConfirmTarget.type === "question"
                ? "Bạn có chắc chắn muốn xóa câu hỏi này?"
                : `Bạn có chắc chắn muốn xóa đáp án ${deleteConfirmTarget.optionLabel}?`}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmTarget.type === "question") {
                    onDelete();
                  } else {
                    handleRemoveAnswer(deleteConfirmTarget.optionId);
                  }
                  setDeleteConfirmTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
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

const QUIZ_QUESTION_PROMPT = `MCQ GENERATION REQUIREMENTS 
- Tạo chính xác 50 câu hỏi. 
- Bao quát hợp lý các knowledge points quan trọng trong tài liệu, phân bổ theo mức độ quan trọng và tránh tập trung vào một phần nhỏ. 
- Mỗi câu phải kiểm tra một kiến thức hoặc khả năng suy luận cụ thể và không phụ thuộc không cần thiết vào kiến thức ngoài tài liệu. 
- Đảm bảo đa dạng độ khó: nhận biết/lý thuyết → thông hiểu → vận dụng → vận dụng cao. 
- Câu khó phải khó do reasoning/application, không phải do wording mơ hồ. 
- Đa dạng dạng câu hỏi: definition, comparison, cause-effect, scenario, application, analysis, decision-making... 
- Tránh lặp lại cùng một knowledge point theo cùng một cách. 
- Mỗi câu chỉ có một đáp án đúng. 
- Distractors phải hợp lý, dựa trên những hiểu lầm hoặc suy luận sai phổ biến. 
- Các đáp án tương đối đồng đều về độ dài, cấu trúc và mức độ cụ thể; không để đáp án đúng lộ liễu bởi wording, độ dài hoặc pattern. 
- Không sử dụng distractor vô lý hoặc nhiều đáp án có thể cùng đúng. 
- Mỗi đáp án A, B, C, D phải có độ dài tối đa 150 ký tự. Đây là giới hạn cứng vì phần nội dung vượt quá 150 ký tự sẽ bị cắt. 
- Ưu tiên wording ngắn gọn, trực tiếp và đủ ý; không thêm thông tin dư thừa chỉ để làm đáp án dài hơn. 
- Trước khi output, phải tự kiểm tra độ dài của từng đáp án và đảm bảo không đáp án nào vượt quá 150 ký tự.
- Trước khi output, tự kiểm tra số lượng, coverage, difficulty, diversity, clarity, uniqueness of correct answer, distractor quality và giới hạn 150 ký tự của tất cả đáp án. 
- Chỉ output kết quả cuối cùng. 

Yêu cầu về output:
- Chỉ gồm câu hỏi và đáp án A, B, C, D. 
- Không explanation, đáp án đúng, difficulty, topic/tag, heading hoặc text thừa. 
- Không divider; giữa các câu chỉ có một blank line. 
- Phải có chính xác 50 câu.`;

const SUBCOMPONENTS_PROMPT = `Hãy dựa trên danh sách các câu hỏi trắc nghiệm vừa được tạo từ bước trước. Hãy đọc kỹ từng câu hỏi và các đáp án A, B, C, D để:
1. Xác định chính xác đáp án đúng cho từng câu.
2. Viết lời giải thích ngắn gọn nhưng đủ rõ để giải thích tại sao đáp án đúng.
3. Xác định các Tags phù hợp với nội dung kiến thức được kiểm tra.

Yêu cầu:

- Giữ nguyên thứ tự các câu hỏi.
- Mỗi câu hỏi đầu vào phải tương ứng với đúng một object trong output.
- Không bỏ sót hoặc thêm câu hỏi.
- "CorrectOptions" chứa chữ cái của đáp án đúng, ví dụ: ["A"] hoặc ["A", "C"].
- Nếu câu hỏi chỉ có một đáp án đúng, chỉ trả về một chữ cái.
- "Explanation" phải dựa trên nội dung câu hỏi và kiến thức liên quan, không suy đoán hoặc bịa đặt.
- "Tags" là mảng tùy chọn dùng để phân loại chủ đề/knowledge point; nếu không xác định được thì dùng [].

Output Format
- Chỉ trả về một JSON array hợp lệ.
- Không sử dụng Markdown code block.
- Không thêm heading, commentary hoặc bất kỳ text nào bên ngoài JSON.

[
  {
    "Question": 1,
    "CorrectOptions": ["A"],
    "Explanation": "Lời giải thích tại sao đáp án đúng.",
    "Tags": ["Môn Toán"]
  }
]`;

const DOCUMENT_PROMPT = `Bạn là chuyên gia xây dựng tài liệu học tập.

Dựa trên TOÀN BỘ các file được cung cấp, hãy tổng hợp thành một tài liệu học tập hoàn chỉnh dưới định dạng Markdown (.md).

Yêu cầu nội dung:
- Tổng hợp kiến thức từ tất cả các file, không chỉ tóm tắt từng file riêng lẻ.
- Bao quát đầy đủ các chủ đề, khái niệm và knowledge points quan trọng.
- Ưu tiên nội dung có tính nền tảng, quan trọng và có giá trị học tập.
- Giải thích rõ định nghĩa, bản chất, nguyên lý, công thức, quy tắc và cách áp dụng khi có.
- Làm rõ mối quan hệ, sự khác biệt và nguyên nhân–kết quả giữa các khái niệm.
- Đưa ra ví dụ hoặc tình huống minh họa khi cần thiết.
- Loại bỏ nội dung trùng lặp và thông tin không cần thiết.
- Không tự ý thêm thông tin không được hỗ trợ bởi tài liệu.
- Nội dung quan trọng/phức tạp cần được trình bày chi tiết hơn nội dung phụ.

Cấu trúc:
Tổ chức theo flow tổng quát → nền tảng → nội dung chính → chi tiết → ứng dụng → tổng kết.
Sử dụng đầy đủ:
- \`#\`, \`##\`, \`###\` để phân cấp.
- Bullet/numbered list.
- **Bold** cho các ý hoặc thuật ngữ quan trọng.
- Table khi cần so sánh.
- Blockquote \`>\` cho lưu ý quan trọng.
Có thể tự điều chỉnh cấu trúc section/subsection để phù hợp với nội dung thực tế.

Output:
- Chỉ trả về nội dung Markdown.
- Không thêm lời mở đầu, nhận xét hoặc text bên ngoài tài liệu.
- Mục tiêu cuối cùng là tạo một master study document có cấu trúc rõ ràng, đầy đủ, chi tiết và có thể dùng trực tiếp để học, ôn tập và tạo câu hỏi trắc nghiệm.`;

interface SupplementComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFile: CreatorFile | undefined;
  onApply: (updatedQuestions: Question[], countUpdated: number) => void;
}

function SupplementComponentModal({ isOpen, onClose, activeFile, onApply }: SupplementComponentModalProps) {
  const [mainMode, setMainMode] = useState<"RAW_TEXT_QUESTIONS" | "ANSWERS_EXPLANATION">("RAW_TEXT_QUESTIONS");
  const [jsonText, setJsonText] = useState("");

  // Tab Raw text questions state
  const [rawText, setRawText] = useState("");
  const [importStrategy, setImportStrategy] = useState<"APPEND" | "REPLACE_ALL">("APPEND");

  useEffect(() => {
    if (isOpen) {
      setMainMode("RAW_TEXT_QUESTIONS");
      setJsonText("");
      setRawText("");
      setImportStrategy("APPEND");
    }
  }, [isOpen]);

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    useQuizStore.getState().showNotification("Đã sao chép prompt thành công!", "success");
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
    const updatesMap = new Map<number, { correctOptionIds: string[]; type: "single_choice" | "multiple_choice"; explanation?: string; tags?: string[] }>();

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

      const rawTags = item.Tags ?? item.tags;
      let tags: string[] | undefined = undefined;
      if (Array.isArray(rawTags)) {
        tags = rawTags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof rawTags === "string") {
        tags = rawTags.split(/[,;\s]+/).filter(Boolean);
      }

      if (correctOptionIds.length > 0 || explanation !== undefined || tags !== undefined) {
        matchedCount++;
        updatesMap.set(qIndex, {
          correctOptionIds: correctOptionIds.length > 0 ? correctOptionIds : targetQuestion.correctOptionIds,
          type: correctOptionIds.length > 1 ? "multiple_choice" : "single_choice",
          explanation: explanation !== undefined ? explanation : targetQuestion.explanation,
          tags: tags !== undefined ? tags : targetQuestion.tags
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
        warnings: result.warnings || [],
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
          explanation: update.explanation !== undefined ? update.explanation : q.explanation,
          tags: update.tags !== undefined ? update.tags : q.tags
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
      }

      onApply(finalQuestions, newParsed.length);
      onClose();
    }
  };

  if (!isOpen || !activeFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Tạo Quiz Nhanh
            </h3>
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
            onClick={() => setMainMode("RAW_TEXT_QUESTIONS")}
            className={cn(
              "py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              mainMode === "RAW_TEXT_QUESTIONS"
                ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <span>Câu hỏi trắc nghiệm</span>
          </button>
          <button
            type="button"
            onClick={() => setMainMode("ANSWERS_EXPLANATION")}
            className={cn(
              "py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5",
              mainMode === "ANSWERS_EXPLANATION"
                ? "border-indigo-600 text-indigo-650 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <span>Các thành phần phụ</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 style-scrollbar">
          
          {mainMode === "RAW_TEXT_QUESTIONS" ? (
            <div className="space-y-4">
              {/* Functional Explanation Block */}
              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hướng dẫn nhập câu hỏi trắc nghiệm</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(QUIZ_QUESTION_PROMPT)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Sao chép prompt mẫu để yêu cầu AI tạo câu hỏi trắc nghiệm chuẩn định dạng"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Prompt</span>
                  </button>
                </div>
                <p className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hãy nhập các file tài liệu cho các AI chatbots như NotebookLM (đề xuất), Gemini, ChatGPT... và sử dụng prompt để tạo ra các câu hỏi trắc nghiệm sau đó dán vào mục nội dung bên dưới
                </p>
              </div>

              {/* Import Strategy selector (Compact Segmented UI) */}
              <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 w-full">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                  Chế độ áp dụng:
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-900 p-1 rounded-md w-full">
                  <button
                    type="button"
                    onClick={() => setImportStrategy("APPEND")}
                    className={cn(
                      "py-1.5 px-2 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer select-none outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none border-none text-center flex items-center justify-center",
                      importStrategy === "APPEND"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                    title="Nối vào cuối tệp hiện tại"
                  >
                    Thêm nối tiếp
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportStrategy("REPLACE_ALL")}
                    className={cn(
                      "py-1.5 px-2 rounded text-xs sm:text-sm font-medium transition-all cursor-pointer select-none outline-none focus:outline-none ring-0 focus:ring-0 active:outline-none border-none text-center flex items-center justify-center",
                      importStrategy === "REPLACE_ALL"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                    title="Xóa bộ cũ & thay bằng bộ mới"
                  >
                    Thay thế toàn bộ
                  </button>
                </div>
              </div>

              {/* Raw Textarea */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nội dung
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Nhập nội dung câu hỏi thô (Ví dụ:\nCâu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. TP. Hồ Chí Minh\nC. Đà Nẵng\nD. Cần Thơ)...`}
                  className="w-full h-40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-normal text-slate-800 dark:text-slate-200 outline-none focus:outline-none ring-0 focus:ring-0 focus:border-indigo-500 resize-none style-scrollbar shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Live Preview badge for Raw Text */}
              {rawTextAnalysis && (
                <div className="space-y-2 pt-1">
                  {rawTextAnalysis.error && rawTextAnalysis.totalCount === 0 ? (
                    <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{rawTextAnalysis.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Đã bóc tách thành công <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{rawTextAnalysis.totalCount}</strong> câu hỏi ({rawTextAnalysis.validCount} câu hợp lệ).
                          </span>
                        </div>
                      </div>

                      {/* Render warnings if STT gaps are detected */}
                      {Boolean(rawTextAnalysis.warnings && rawTextAnalysis.warnings.length > 0) && (
                        <div className="p-3.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 style-scrollbar">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Thông tin STT văn bản gốc:</span>
                          </div>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300 pl-1">
                            {rawTextAnalysis.warnings?.map((w: string, idx: number) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Functional Explanation Block */}
              <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hướng dẫn bổ sung thành phần phụ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPrompt(SUBCOMPONENTS_PROMPT)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                    title="Sao chép prompt mẫu để yêu cầu AI tạo dữ liệu đáp án & giải thích chuẩn JSON"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Prompt</span>
                  </button>
                </div>
                <p className="text-sm font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
                  Hãy nhập các file tài liệu cho các AI chatbots như NotebookLM (đề xuất), Gemini, ChatGPT... và sử dụng prompt để bổ sung các thành phần phụ vào các câu hỏi trắc nghiệm có sẵn sau đó dán vào mục nội dung bên dưới
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nội dung (Đáp án, Giải thích &amp; Tags)
                </label>
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`Nhập dữ liệu trắc nghiệm JSON (Ví dụ:\n[\n  { "Question": 1, "CorrectOptions": ["A"], "Explanation": "...", "Tags": ["Môn Toán"] }\n])...`}
                  className="w-full h-44 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-normal text-slate-800 dark:text-slate-200 outline-none focus:outline-none ring-0 focus:ring-0 focus:border-indigo-500 resize-none style-scrollbar shadow-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Analysis & Validation Results */}
              {analysis && (
                <div className="space-y-3 pt-1">
                  {analysis.error ? (
                    <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-bold flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{analysis.error}</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Summary badge */}
                      <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Đã tìm thấy <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{analysis.totalItems}</strong> mục JSON. Đủ điều kiện bổ sung cho <strong className="font-extrabold text-emerald-700 dark:text-emerald-200">{analysis.matchedCount} / {activeFile.questions.length}</strong> câu hỏi.
                          </span>
                        </div>
                      </div>

                      {/* Warnings list if any */}
                      {Boolean(analysis.warnings && analysis.warnings.length > 0) && (
                        <div className="p-3.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs space-y-1.5 max-h-36 overflow-y-auto style-scrollbar">
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
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
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
            className="px-5 py-2 rounded-lg bg-indigo-650 hover:bg-indigo-755 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>Xác nhận</span>
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
  const undo = useQuizStore(state => state.undo);
  const redo = useQuizStore(state => state.redo);
  const pastCreatorFiles = useQuizStore(state => state.pastCreatorFiles);
  const futureCreatorFiles = useQuizStore(state => state.futureCreatorFiles);
  const canUndo = (pastCreatorFiles?.length || 0) > 0;
  const canRedo = (futureCreatorFiles?.length || 0) > 0;

  // Keyboard shortcuts for Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;
      const key = e.key.toLowerCase();
      
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        useQuizStore.getState().undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        useQuizStore.getState().redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeFile = useMemo(() => creatorFiles.find(f => f.id === activeFileId), [creatorFiles, activeFileId]);
  const lastFileIdRef = React.useRef<string | null>(null);

  // --- TABS CONTROL ---
  const [activeTab, setActiveTab] = useState<"DOCUMENT" | "QUESTION_VIEW">("QUESTION_VIEW");
  const [docSubTab, setDocSubTab] = useState<"EDIT" | "PREVIEW">("PREVIEW");

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
  const [selectedPanelQuestionId, setSelectedPanelQuestionId] = useState<string | null>(null);
  const [deleteConfirmQuestionId, setDeleteConfirmQuestionId] = useState<string | null>(null);

  // Keyboard Hotkey for deleting question in panel list: Enter to confirm deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (deleteConfirmQuestionId) {
        if (e.key === "Enter") {
          e.preventDefault();
          deleteQuestion(deleteConfirmQuestionId);
          if (selectedPanelQuestionId === deleteConfirmQuestionId) {
            setSelectedPanelQuestionId(null);
          }
          setDeleteConfirmQuestionId(null);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDeleteConfirmQuestionId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirmQuestionId, selectedPanelQuestionId]);

  // Filter & Sort Settings state
  const [filterAndSortEnabled, setFilterAndSortEnabled] = useState(false);

  // Extract tags from active file questions
  const tagsKey = useMemo(() => {
    if (!activeFile) return "";
    return activeFile.questions.map(q => (q.tags || []).join(",")).join("|");
  }, [activeFile]);

  const allUniqueTags = useMemo(() => {
    if (!activeFile) return [];
    const tags = new Set<string>();
    activeFile.questions.forEach(q => {
      q.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [tagsKey]);

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
        let changed = false;
        const updated = { ...prev };
        allUniqueTags.forEach(t => {
          if (updated[t] === undefined) {
            updated[t] = true;
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [tagsKey, activeFile?.id, setSelectedTagsFilter]);

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
  }, [tagsKey]);

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
    const currentQuestions = activeFile.questions;
    const deletedIdx = currentQuestions.findIndex(q => q.id === qId);
    const updatedQs = currentQuestions.filter(q => q.id !== qId);

    updateCreatorFile(activeFile.id, { questions: updatedQs });

    if (selectedPanelQuestionId === qId) {
      if (updatedQs.length === 0) {
        setSelectedPanelQuestionId(null);
      } else if (deletedIdx > 0) {
        setSelectedPanelQuestionId(currentQuestions[deletedIdx - 1].id);
      } else {
        setSelectedPanelQuestionId(updatedQs[0].id);
      }
    }
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

  // Compute final filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    return activeFile?.questions || [];
  }, [activeFile?.questions]);

  // Panel view selected item state
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



  // Render empty state if no active file
  if (!activeFile) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm items-center justify-center p-8", className)}>
        <FileCode className="w-16 h-16 text-indigo-500/30 mb-4" />
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">No File Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-xs leading-relaxed">Chọn một tệp từ Quản Lý Tệp hoặc tạo tệp mới để bắt đầu chỉnh sửa câu hỏi.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm", className)}>
      
      {/* 1. HEADER */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-0 shrink">
          <FileCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-base sm:text-lg font-bold text-slate-850 dark:text-slate-100 tracking-wider truncate" title={activeFile.name}>
            {activeFile.name}
          </span>
        </div>

        {/* Undo/Redo & Tab Selection */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Undo & Redo Quick Action Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => undo()}
              disabled={!canUndo}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => redo()}
              disabled={!canRedo}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            {(["DOCUMENT", "QUESTION_VIEW"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-white dark:bg-slate-700 text-indigo-650 dark:text-indigo-350 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {tab === "DOCUMENT" && "Tài Liệu"}
                {tab === "QUESTION_VIEW" && "Câu Hỏi"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 overflow-hidden p-3 sm:p-5 relative min-h-0 flex flex-col">
        
        {/* --- TAB A: DOCUMENT VIEW --- */}
        {activeTab === "DOCUMENT" && (
          <div className="h-full flex flex-col gap-4 min-h-0">
            {/* Sub tab toggles */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
              <div className="flex gap-2">
                <button 
                  onClick={() => setDocSubTab("PREVIEW")}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors", docSubTab === "PREVIEW" ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
                >
                  Xem trước
                </button>
                <button 
                  onClick={() => setDocSubTab("EDIT")}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors", docSubTab === "EDIT" ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}
                >
                  Chỉnh sửa
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(DOCUMENT_PROMPT);
                  useQuizStore.getState().showNotification("Đã sao chép prompt thành công!", "success");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                title="Sao chép prompt mẫu để yêu cầu AI tạo tài liệu học tập chuẩn định dạng Markdown"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Prompt</span>
              </button>
            </div>

            {/* Document Editor / Viewer */}
            {docSubTab === "PREVIEW" ? (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="prose dark:prose-invert max-w-none text-sm">
                  {activeFile.document ? (
                    <MarkdownRenderer content={activeFile.document} />
                  ) : (
                    <div className="text-center py-12 text-slate-400">Tài liệu trống. Hãy nhấn nút Chỉnh sửa để thêm nội dung.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                <textarea
                  value={activeFile.document}
                  onChange={(e) => updateCreatorFile(activeFile.id, { document: e.target.value })}
                  placeholder="Nhập nội dung tài liệu học tập bằng định dạng Markdown (.md)..."
                  className="w-full flex-1 min-h-0 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-sm font-mono text-slate-700 dark:text-slate-300 resize-none focus:outline-none overflow-y-auto custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}
          </div>
        )}



        {/* --- TAB C: QUESTION VIEW (VISUAL EDITOR) --- */}
        {activeTab === "QUESTION_VIEW" && (
          <div className="flex-1 min-h-0 flex flex-col space-y-3 relative overflow-hidden">
            
            {/* Options Sub-Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tổng cộng: {activeFile.questions.length} câu hỏi
                </span>
              </div>

              <div className="flex items-center gap-2 relative">
                {/* 1. Tạo Quiz Nhanh (Fast Quiz Generator) */}
                <button
                  type="button"
                  onClick={() => setIsSupplementModalOpen(true)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium text-sm cursor-pointer transition-all flex items-center gap-1.5 select-none",
                    isSupplementModalOpen
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-650 dark:text-indigo-400 font-semibold"
                      : "bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200"
                  )}
                  title="Bổ sung đáp án đúng, lời giải thích và thẻ nhãn từ AI (JSON)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Tạo Quiz Nhanh</span>
                </button>

                {/* 2. Thêm câu hỏi (Add New Question) */}
                <button
                  type="button"
                  onClick={addNewQuestion}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 font-medium text-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 select-none"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Thêm câu hỏi</span>
                </button>
              </div>
            </div>

            {/* --- VISUAL DISPLAY MODES WORKSPACES --- */}

            {/* Chế độ Panel split view */}
            {displayMode === "Panel" && (
              <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-10 gap-4 overflow-hidden">
                {/* Section 1: Question Setting (Editor on top 2/3 on mobile, left on desktop) */}
                <div className="flex-[2] md:col-span-6 xl:col-span-7 h-full overflow-y-auto custom-scrollbar pr-2 space-y-4 min-w-0 min-h-0">
                  {panelQuestion ? (
                    <QuestionCard 
                      key={panelQuestion.id}
                      index={filteredQuestions.indexOf(panelQuestion)}
                      question={panelQuestion}
                      onUpdate={(updates) => updateQuestion(panelQuestion.id, updates)}
                      onDelete={() => {
                        deleteQuestion(panelQuestion.id);
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg text-slate-400">
                      Chọn câu hỏi bên bảng danh sách để bắt đầu chỉnh sửa.
                    </div>
                  )}
                </div>

                {/* Section 2: Question List (List selector bottom 1/3 on mobile, right on desktop) */}
                <div className="flex-1 md:col-span-4 xl:col-span-3 h-full border border-slate-200 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900/60 p-4 flex flex-col min-h-0 min-w-0 shadow-xs">
                  <h5 className="text-xs font-semibold text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 shrink-0">Danh Sách Câu Hỏi</h5>
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
                              "p-3 rounded-lg border shadow-sm transition-all group relative cursor-pointer select-none text-left",
                              qValid
                                ? (isSelected 
                                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 shadow-emerald-500/10 ring-1 ring-emerald-500/30" 
                                    : "border-emerald-500/70 dark:border-emerald-500/50 bg-white dark:bg-slate-900 hover:border-emerald-500")
                                : (isSelected
                                    ? "border-red-500 bg-red-50/20 dark:bg-red-950/30 shadow-red-500/10 ring-2 ring-red-500/20" 
                                    : "border-red-500/80 dark:border-red-500/60 bg-red-50/10 dark:bg-red-950/10 hover:border-red-500")
                            )}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-xs text-indigo-650 dark:text-indigo-400">CÂU {idx + 1}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmQuestionId(q.id);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Xóa câu hỏi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-sm font-normal text-slate-700 dark:text-slate-300 truncate">{q.text || "(Chưa có nội dung câu hỏi)"}</p>
                            {q.tags && q.tags.filter(Boolean).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {q.tags.filter(Boolean).map((t, tagIdx) => {
                                  const colors = getTagColor(t);
                                  return (
                                    <span key={`${t}_${tagIdx}`} className={cn(
                                      "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border shadow-sm",
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
                      <div className="text-center py-6 text-xs text-slate-400 font-medium select-none">Danh sách trống.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Modal confirm delete question from list */}
        {deleteConfirmQuestionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Xác nhận xóa câu hỏi
                </h3>
                <button
                  onClick={() => setDeleteConfirmQuestionId(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn xóa câu hỏi này?
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmQuestionId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    deleteQuestion(deleteConfirmQuestionId);
                    if (selectedPanelQuestionId === deleteConfirmQuestionId) {
                      setSelectedPanelQuestionId(null);
                    }
                    setDeleteConfirmQuestionId(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            </div>
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
