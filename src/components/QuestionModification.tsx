"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuizStore, CreatorFile } from "@/store/quizStore";
import { Question, Option, DisplayBlock } from "../lib/parser";
import MarkdownRenderer from "./MarkdownRenderer";
import { parseQuizJson } from "@/lib/parser";
import { cn } from "@/lib/utils";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import { 
  Plus, 
  Trash2, 
  Check, 
  HelpCircle, 
  Save, 
  Eye, 
  Settings, 
  ChevronDown, 
  FileCode, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  EyeOff
} from "lucide-react";

interface QuestionCardProps {
  index: number;
  question: Question;
  visibleFields: {
    question: boolean;
    answer: boolean;
    explanation: boolean;
    type: boolean;
    displayBlock: boolean;
    tags: boolean;
  };
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
}

function QuestionCard({ index, question, visibleFields, onUpdate, onDelete }: QuestionCardProps) {
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState(question.tags?.join(", ") || "");

  useEffect(() => {
    const currentParsedTags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const incomingTags = question.tags || [];
    const isSame = currentParsedTags.length === incomingTags.length && 
                   currentParsedTags.every((t, i) => t === incomingTags[i]);
    if (!isSame) {
      setTagsInput(incomingTags.join(", "));
    }
  }, [question.tags]);

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
    const updatedOptions = question.options.map(opt => 
      opt.id === ansId ? { ...opt, text, originalText: `${opt.originalText.substring(0, 3)}${text}` } : opt
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
    const newBlock = { type: "code", content: "Khai báo / Code snippet..." };
    onUpdate({ display_blocks: [...blocks, newBlock] });
  };

  const handleTagsChange = (val: string) => {
    setTagsInput(val);
    const tags = val.split(",").map(t => t.trim()).filter(t => t.length > 0);
    onUpdate({ tags });
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

  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2b51] shadow-sm space-y-5 relative">
      {/* Header index and Delete option */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <span className="text-xs font-black text-indigo-650 dark:text-indigo-400">CÂU HỎI {index + 1}</span>
        <button 
          onClick={onDelete}
          className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-550 transition-colors"
          title="Xóa câu hỏi"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question Text Area */}
      {visibleFields.question && (
        <div className="space-y-1.5">
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Question</h5>
          <textarea
            value={question.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            className="w-full min-h-[90px] p-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/30 dark:bg-slate-950/5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-y"
            placeholder="Nhập nội dung câu hỏi..."
          />
        </div>
      )}

      {/* Answers Options Area */}
      {visibleFields.answer && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Answers</h5>
            <button
              onClick={handleAddNewAnswer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 text-[10px] text-indigo-750 dark:text-indigo-400 font-extrabold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 active:scale-95 transition-all"
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
                    "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900",
                    isCorrect 
                      ? "border-green-500/35 bg-green-500/5 dark:bg-green-950/10" 
                      : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  {/* Correct Toggle Indicator */}
                  <button
                    onClick={() => handleToggleAnswerCorrect(ans.id)}
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer",
                      isCorrect 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-slate-300 dark:border-slate-700 text-transparent hover:border-green-500/55"
                    )}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <span className="text-xs font-black text-slate-400 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>

                  <input 
                    type="text"
                    value={ans.text}
                    onChange={(e) => handleAnswerTextChange(ans.id, e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                    className="flex-1 bg-transparent text-xs font-bold text-slate-850 dark:text-slate-200 focus:outline-none"
                  />

                  <button
                    onClick={() => handleRemoveAnswer(ans.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 transition-colors"
                    title="Xóa đáp án"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type and Tags inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleFields.type && (
          <div className="space-y-1.5 relative">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Question Type</span>
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-slate-350"
            >
              <span>{typeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute left-0 right-0 bottom-full mb-1.5 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 space-y-1">
                <button
                  onClick={() => { handleTypeChange("single_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg", question.type === "single_choice" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50")}
                >
                  Single Choice
                </button>
                <button
                  onClick={() => { handleTypeChange("multiple_choice"); setIsTypeDropdownOpen(false); }}
                  className={cn("w-full p-2 text-left text-xs font-bold rounded-lg", question.type === "multiple_choice" ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50")}
                >
                  Multiple Choice
                </button>
              </div>
            )}
          </div>
        )}

        {visibleFields.tags && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tags (comma separated)</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="tag1, tag2..."
            />
          </div>
        )}
      </div>

      {/* Display Blocks list */}
      {visibleFields.displayBlock && (question.display_blocks || []).length > 0 && (
        <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {(question.display_blocks || []).map((db, blockIdx) => (
            <div key={blockIdx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 space-y-3 relative group/block">
              <button
                onClick={() => handleRemoveDisplayBlock(blockIdx)}
                className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-red-500"
                title="Xóa block"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="space-y-1.5 shrink-0 w-32">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Block Type</span>
                  <select
                    value={db.type}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { type: e.target.value })}
                    className="w-full px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800"
                  >
                    <option value="code">Code</option>
                    <option value="image">Image</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Content</span>
                  <textarea
                    placeholder={db.type === "code" ? "Khai báo hàm / Code snippet..." : "Đường dẫn ảnh/URL..."}
                    value={db.content}
                    onChange={(e) => handleDisplayBlockChange(blockIdx, { content: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-[10px] font-mono border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-350 focus:outline-none resize-y min-h-[40px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explanation Area */}
      {visibleFields.explanation && question.explanation !== undefined && question.explanation !== null && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 space-y-1.5 relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Explanation</label>
          <button
            onClick={handleRemoveExplanation}
            className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-red-500"
            title="Xóa giải thích"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <textarea
            value={question.explanation}
            onChange={(e) => handleExplanationChange(e.target.value)}
            className="w-full min-h-[70px] p-2.5 border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none leading-relaxed resize-y"
            placeholder="Nhập nội dung giải thích..."
          />
        </div>
      )}

      {/* Dynamic Blocks actions */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleAddDisplayBlock}
          className="py-2 border border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
        >
          + Add Display Block
        </button>
        {question.explanation === null || question.explanation === undefined ? (
          <button
            onClick={handleAddExplanation}
            className="py-2 border border-dashed border-slate-250 dark:border-slate-800 hover:border-indigo-500/50 rounded-xl font-bold text-[10px] text-slate-650 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
          >
            + Add Explanation
          </button>
        ) : (
          <div className="flex items-center justify-center border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-400 text-[10px] font-bold rounded-xl select-none">
            Giải thích đã tồn tại
          </div>
        )}
      </div>
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
    if (activeFile && activeTab !== "CODE_VIEW") {
      setCodeText(getFileJson(activeFile));
      setJsonError(null);
    }
  }, [activeFile, activeTab]);

  // --- POPOVER VISIBILITY CONTROLS ---
  const [isViewSettingsOpen, setIsViewSettingsOpen] = useState(false);
  const [isFilterSettingsOpen, setIsFilterSettingsOpen] = useState(false);
  const [isQtyDropdownOpen, setIsQtyDropdownOpen] = useState(false);

  // View Settings state
  const [visibleFields, setVisibleFields] = useState({
    question: true,
    answer: true,
    explanation: true,
    type: true,
    displayBlock: true,
    tags: true
  });
  const [displayMode, setDisplayMode] = useState<"List" | "Cards" | "Panel">("List");

  // Filter & Sort Settings state
  const [filterAndSortEnabled, setFilterAndSortEnabled] = useState(true);

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
    const initial: Record<string, boolean> = {};
    allUniqueTags.forEach(t => {
      initial[t] = true;
    });
    setSelectedTagsFilter(initial);
  }, [allUniqueTags, setSelectedTagsFilter]);

  // Sorting priorities state
  const [typeOrder, setTypeOrder] = useState<string[]>(["single_choice", "multiple_choice"]);
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    setTagOrder(allUniqueTags);
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
      originalQuestion: "",
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
    updateCreatorFile(activeFile.id, { questions: [...activeFile.questions, newQ] });
    setCardIndex(activeFile.questions.length);
  };

  // Multi-level sort function
  const getSortedQuestions = (qs: Question[]) => {
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

      // 3. Fallback
      return a.text.localeCompare(b.text);
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

  // Card view index controller
  const [cardIndex, setCardIndex] = useState(0);

  useEffect(() => {
    setCardIndex(0);
  }, [activeFileId, displayMode]);

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 15) return;
    if (e.deltaY > 0) {
      if (cardIndex < filteredQuestions.length - 1) {
        setCardIndex(prev => prev + 1);
      }
    } else {
      if (cardIndex > 0) {
        setCardIndex(prev => prev - 1);
      }
    }
  };

  // Keyboard navigation for card swap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "QUESTION_VIEW" || displayMode !== "Cards") return;
      // Do not trigger if user is typing in input or textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === "ArrowRight") {
        if (cardIndex < filteredQuestions.length - 1) {
          setCardIndex(prev => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (cardIndex > 0) {
          setCardIndex(prev => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cardIndex, filteredQuestions.length, activeTab, displayMode]);

  // Panel view selected item state
  const [selectedPanelQuestionId, setSelectedPanelQuestionId] = useState<string | null>(null);
  
  const panelQuestion = useMemo(() => {
    if (filteredQuestions.length === 0) return null;
    return filteredQuestions.find(q => q.id === selectedPanelQuestionId) || filteredQuestions[0];
  }, [filteredQuestions, selectedPanelQuestionId]);

  // Manual save for Code view
  const handleSaveJson = () => {
    if (!activeFile) return;
    const result = parseQuizJson(codeText);
    if (result.isValid) {
      updateCreatorFile(activeFile.id, {
        questions: result.questions,
        document: result.document || "",
        note: result.note || "",
        metadata: {
          ...activeFile.metadata,
          file_name: result.metadata?.file_name || activeFile.name,
          question_count: result.questions.length,
          last_modified: new Date().toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          }).replace(",", "")
        }
      });
      if (result.metadata?.file_name && result.metadata.file_name !== activeFile.name) {
        updateCreatorFile(activeFile.id, { name: result.metadata.file_name });
      }
      setJsonError(null);
      alert("Lưu tệp tin thành công!");
    } else {
      setJsonError(result.error || "Lỗi schema JSON.");
    }
  };

  // Render empty state if no active file
  if (!activeFile) {
    return (
      <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm items-center justify-center p-8", className)}>
        <FileCode className="w-16 h-16 text-indigo-500/30 animate-pulse mb-4" />
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
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0",
            activeFile.type === "QUIZ" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          )}>
            {activeFile.type === "QUIZ" ? "Quiz File" : "Supported File"}
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
      <div className="flex-1 overflow-y-auto p-5 relative min-h-0">
        
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
            <div className="flex-1 overflow-y-auto">
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
                  className="w-full h-[350px] p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-xs font-mono text-slate-700 dark:text-slate-300 resize-none focus:outline-none"
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
          <div className="space-y-4 relative">
            
            {/* Options Sub-Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Total: {filteredQuestions.length} Questions
              </span>

              <div className="flex items-center gap-2 relative">
                {/* Add New Question */}
                <button
                  onClick={addNewQuestion}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 font-extrabold text-[10px] text-slate-750 dark:text-slate-300 hover:shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-400" /> New Question
                </button>

                {/* View settings button (Eye) */}
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

                {/* Filter and settings button (Gear) */}
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

                {/* --- POPOVER 1: VIEW SETTINGS --- */}
                {isViewSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">Visibility</h5>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Display Mode</label>
                      <button
                        onClick={() => setIsQtyDropdownOpen(!isQtyDropdownOpen)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 dark:border-slate-750 rounded-lg bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-250 flex items-center justify-between hover:border-slate-350 cursor-pointer"
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
                              className={cn("w-full p-1.5 text-left text-xs font-bold rounded cursor-pointer", displayMode === mode ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "text-slate-750 dark:text-slate-300 hover:bg-slate-50")}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setIsViewSettingsOpen(false)} className="flex-1 py-1.5 border border-slate-250 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-55 cursor-pointer">Cancel</button>
                      <button onClick={() => setIsViewSettingsOpen(false)} className="flex-1 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-extrabold shadow-sm cursor-pointer">Apply</button>
                    </div>
                  </div>
                )}

                {/* --- POPOVER 2: FILTER & SORT --- */}
                {isFilterSettingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <h5 className="text-[10px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider">Filter & Sort</h5>
                      <input 
                        type="checkbox"
                        checked={filterAndSortEnabled}
                        onChange={(e) => setFilterAndSortEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                      {/* Question types filter */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
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

                      {/* Filter by tags */}
                      {allUniqueTags.length > 0 && (
                        <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Tags</span>
                          <div className="space-y-1 mt-1 max-h-[90px] overflow-y-auto">
                            {allUniqueTags.map(tag => (
                              <label key={tag} className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={!!selectedTagsFilter[tag]}
                                  onChange={() => setSelectedTagsFilter(prev => ({ ...prev, [tag]: !prev[tag] }))}
                                  className="w-3 h-3 text-indigo-600 rounded"
                                />
                                <span>{tag}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sort Priority Ordering */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Sort priorities</span>
                        
                        {/* Type prioritization */}
                        <div className="space-y-1.5 mt-1 border-b border-slate-150 dark:border-slate-800 pb-1.5">
                          <span className="text-[8px] font-black text-slate-400 uppercase">Question types order</span>
                          {typeOrder.map((t, idx) => (
                            <div key={t} className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-150">
                              <span>{t === "single_choice" ? "Single Choice" : "Multiple Choice"}</span>
                              <div className="flex gap-0.5">
                                <button onClick={() => moveTypeOrder(idx, "UP")} className="p-0.5 hover:bg-slate-100"><ArrowUp className="w-3 h-3" /></button>
                                <button onClick={() => moveTypeOrder(idx, "DOWN")} className="p-0.5 hover:bg-slate-100"><ArrowDown className="w-3 h-3" /></button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tag prioritization */}
                        {tagOrder.length > 0 && (
                          <div className="space-y-1.5 mt-1 pb-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase">Tag priority order</span>
                            <div className="space-y-1 max-h-[100px] overflow-y-auto">
                              {tagOrder.map((tag, idx) => (
                                <div key={tag} className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-150">
                                  <span className="truncate max-w-[80px]">{tag}</span>
                                  <div className="flex gap-0.5">
                                    <button onClick={() => moveTagOrder(idx, "UP")} className="p-0.5 hover:bg-slate-100"><ArrowUp className="w-3 h-3 text-slate-400" /></button>
                                    <button onClick={() => moveTagOrder(idx, "DOWN")} className="p-0.5 hover:bg-slate-100"><ArrowDown className="w-3 h-3 text-slate-400" /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter other criteria */}
                      <div className="space-y-1.5 p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Others</span>
                        <div className="space-y-1 mt-1">
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterOthers.haveCorrectAnswer}
                              onChange={() => setFilterOthers(prev => ({ ...prev, haveCorrectAnswer: !prev.haveCorrectAnswer }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Có đáp án đúng</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterOthers.haveExplanation}
                              onChange={() => setFilterOthers(prev => ({ ...prev, haveExplanation: !prev.haveExplanation }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Có giải thích</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={filterOthers.haveDisplayBlock}
                              onChange={() => setFilterOthers(prev => ({ ...prev, haveDisplayBlock: !prev.haveDisplayBlock }))}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            <span>Có display block</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button onClick={() => setIsFilterSettingsOpen(false)} className="flex-1 py-1.5 border border-slate-250 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-650 hover:bg-slate-55 cursor-pointer">Cancel</button>
                      <button onClick={() => setIsFilterSettingsOpen(false)} className="flex-1 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-extrabold shadow-sm cursor-pointer">Apply</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- VISUAL DISPLAY MODES WORKSPACES --- */}
            
            {/* Chế độ List view */}
            {displayMode === "List" && (
              <div className="space-y-6">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q, idx) => (
                    <QuestionCard 
                      key={q.id}
                      index={idx}
                      question={q}
                      visibleFields={visibleFields}
                      onUpdate={(updates) => updateQuestion(q.id, updates)}
                      onDelete={() => deleteQuestion(q.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-2xl text-slate-400 select-none">
                    Không tìm thấy câu hỏi phù hợp với bộ lọc.
                  </div>
                )}
              </div>
            )}

            {/* Chế độ Cards view (Tráo thẻ) */}
            {displayMode === "Cards" && (
              <div 
                className="space-y-4 select-none"
              >
                {filteredQuestions.length > 0 ? (
                  <div className="relative">
                    <div className="transition-all duration-300 ease-out transform">
                      <QuestionCard 
                        index={cardIndex}
                        question={filteredQuestions[cardIndex]}
                        visibleFields={visibleFields}
                        onUpdate={(updates) => updateQuestion(filteredQuestions[cardIndex].id, updates)}
                        onDelete={() => {
                          deleteQuestion(filteredQuestions[cardIndex].id);
                          if (cardIndex > 0) setCardIndex(prev => prev - 1);
                        }}
                      />
                    </div>
                    {/* Navigation controllers */}
                    <div className="flex items-center justify-between mt-4 px-2 text-xs font-black text-slate-500 select-none">
                      <button 
                        disabled={cardIndex === 0}
                        onClick={() => setCardIndex(prev => prev - 1)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Trước
                      </button>
                      <span className="text-[10px] tracking-wide uppercase">
                        Câu {cardIndex + 1} / {filteredQuestions.length}
                      </span>
                      <button 
                        disabled={cardIndex === filteredQuestions.length - 1}
                        onClick={() => setCardIndex(prev => prev + 1)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Sau <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed rounded-2xl text-slate-400">
                    Không tìm thấy câu hỏi phù hợp với bộ lọc.
                  </div>
                )}
              </div>
            )}

            {/* Chế độ Panel split view */}
            {displayMode === "Panel" && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[480px]">
                {/* Editor on the left */}
                <div className="lg:col-span-3 space-y-4">
                  {panelQuestion ? (
                    <QuestionCard 
                      index={filteredQuestions.indexOf(panelQuestion)}
                      question={panelQuestion}
                      visibleFields={visibleFields}
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

                {/* List selector on the right */}
                <div className="lg:col-span-2 border border-slate-250 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-4 overflow-y-auto max-h-[500px] space-y-2">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1.5 mb-2">Danh sách câu hỏi</h5>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q, idx) => {
                      const isSelected = panelQuestion?.id === q.id;
                      return (
                        <div 
                          key={q.id}
                          onClick={() => setSelectedPanelQuestionId(q.id)}
                          className={cn(
                            "p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none text-left",
                            isSelected 
                              ? "border-indigo-500 bg-white dark:bg-slate-900 shadow-sm"
                              : "border-slate-200/60 dark:border-slate-800 hover:bg-white/80 dark:hover:bg-slate-900/50"
                          )}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-extrabold text-[10px] text-indigo-650 dark:text-indigo-400">CÂU {idx + 1}</span>
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase">{q.type === "single_choice" ? "Single" : "Multiple"}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{q.text}</p>
                          {q.tags && q.tags.filter(Boolean).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {q.tags.filter(Boolean).slice(0, 2).map(t => (
                                <span key={t} className="text-[8px] bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 px-1 py-0.5 rounded font-extrabold">{t}</span>
                              ))}
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
            )}

          </div>
        )}

      </div>
    </div>
  );
}
