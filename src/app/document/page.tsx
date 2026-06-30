"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useQuizStore, SourceFile } from "@/store/quizStore";
import { getSourceDisplayName } from "@/lib/sourceHelper";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { 
  ArrowLeft, 
  Menu, 
  X, 
  BookOpen, 
  FileText, 
  Info, 
  Calendar, 
  Hash, 
  AlertCircle,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function DocumentSkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans animate-pulse">
      {/* Header Skeleton */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
          <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline" />
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </header>

      {/* Main Workspace Skeleton */}
      <div className="flex-1 flex overflow-hidden relative justify-center">
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 md:py-12 flex justify-center">
          <div className="max-w-4xl w-full space-y-8">
            {/* Note Skeleton */}
            <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-900/20 rounded-2xl p-5 md:p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100/30 dark:bg-amber-900/20 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-28 bg-amber-200/30 dark:bg-amber-900/30 rounded" />
                <div className="h-4 w-full bg-amber-200/30 dark:bg-amber-900/30 rounded" />
                <div className="h-4 w-3/4 bg-amber-200/30 dark:bg-amber-900/30 rounded" />
              </div>
            </div>

            {/* Document Body Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm space-y-6">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-4 pt-4">
                <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded pt-4" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function EmptyDocumentState() {
  return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-8 md:p-12 w-full transition-colors duration-300">
      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-350 dark:text-slate-650 animate-pulse" />
      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Tài liệu trống</h3>
      <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        File này chưa có nội dung hoặc chưa được cấu hình note/document.
      </p>
    </div>
  );
}

// Multi-field scoring search logic
function getFilteredAndSortedSources(sources: SourceFile[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return sources;
  
  return sources
    .map(src => {
      const filenameMatch = src.name.toLowerCase().includes(normalizedQuery) ? 1 : 0;
      const customNameMatch = (src.customName && src.customName.toLowerCase().includes(normalizedQuery)) ? 1 : 0;
      const noteMatch = (src.note && src.note.toLowerCase().includes(normalizedQuery)) ? 1 : 0;
      const rawTextMatch = (src.document && src.document.toLowerCase().includes(normalizedQuery)) ? 1 : 0;

      // Tags match
      const tags = src.questions ? src.questions.flatMap(q => q.tags || []) : [];
      const tagMatch = tags.some(t => t.toLowerCase().includes(normalizedQuery)) ? 1 : 0;

      // Metadata Match (Explanations & question titles)
      let parsedMatch = 0;
      if (rawTextMatch === 0) {
        const hasQuestionMatch = src.questions && src.questions.some(q => 
          q.text.toLowerCase().includes(normalizedQuery) || 
          (q.explanation && q.explanation.toLowerCase().includes(normalizedQuery))
        );
        if (hasQuestionMatch) {
          parsedMatch = 1;
        }
      }
      const finalRawTextMatch = Math.max(rawTextMatch, parsedMatch);

      const score = (filenameMatch * 3) + 
                    (customNameMatch * 3) + 
                    (tagMatch * 2) + 
                    (noteMatch * 2) + 
                    (finalRawTextMatch * 1);
      return { src, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.src);
}

interface DocumentPickerEntryProps {
  sources: SourceFile[];
  onSelect: (id: string) => void;
  formatDate: (timestamp?: any) => string;
}

function DocumentPickerEntry({ sources, onSelect, formatDate }: DocumentPickerEntryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSources = useMemo(() => {
    return getFilteredAndSortedSources(sources, searchQuery);
  }, [sources, searchQuery]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 md:p-10 shadow-xl transition-all duration-200 w-full max-w-4xl mx-auto flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-indigo-650 dark:text-indigo-400" />
            <span>Chọn tài liệu học tập</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chọn một tài liệu bên dưới để bắt đầu đọc và ôn luyện.
          </p>
        </div>
        
        {sources.length > 5 && (
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-11 pl-9 pr-10 py-2 text-sm border border-slate-250 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-205 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center text-slate-450 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {filteredSources.length === 0 ? (
          <div className="text-center py-12 text-slate-450 dark:text-slate-500">
            Không tìm thấy tài liệu phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-2">
            {filteredSources.map((src) => {
              const hasDocument = !!src.document && src.document.trim() !== "";
              const displayName = getSourceDisplayName(src);

              return (
                <button
                  key={src.id}
                  onClick={() => onSelect(src.id)}
                  className="w-full min-h-11 text-left p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all duration-200 hover:shadow-md flex items-start gap-3 md:gap-4 group cursor-pointer"
                >
                  <div className={cn(
                    "p-3 rounded-xl shrink-0 transition-colors",
                    hasDocument 
                      ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    {hasDocument ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6 opacity-60" />}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-205 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate mb-1" title={displayName}>
                      {displayName}
                    </h3>
                    {displayName !== src.name && (
                      <p className="text-xs text-slate-450 dark:text-slate-500 truncate mb-2" title={src.name}>
                        {src.name}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        {src.questions.length} câu hỏi
                      </span>
                      {src.metadata?.last_modified && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />
                          <span className="truncate flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(src.metadata.last_modified).split(" ")[0]}
                          </span>
                        </>
                      )}
                    </div>

                    {hasDocument && (
                      <div className="mt-3">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-extrabold uppercase tracking-wide">
                          Có tài liệu ôn tập
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface DocumentPickerModalProps {
  sources: SourceFile[];
  onSelect: (id: string) => void;
  formatDate: (timestamp?: any) => string;
  onClose: () => void;
  isOpen: boolean;
}

function DocumentPickerModal({ sources, onSelect, formatDate, onClose, isOpen }: DocumentPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredSources = useMemo(() => {
    return getFilteredAndSortedSources(sources, searchQuery);
  }, [sources, searchQuery]);

  return (
    <motion.div
      initial={false}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-auto"
    >
      <div
        className="w-full max-w-4xl h-[100dvh] md:h-auto md:max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none md:rounded-3xl shadow-2xl relative p-4 md:p-10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-indigo-650 dark:text-indigo-400" />
              <span>Chọn tài liệu học tập</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Chọn một tài liệu bên dưới để bắt đầu đọc và ôn luyện.
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {sources.length > 5 && (
              <div className="relative w-full md:w-72 shrink-0">
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11 pl-9 pr-10 py-2 text-sm border border-slate-250 dark:border-slate-700/80 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center text-slate-450 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            <button
              onClick={onClose}
              className="min-w-11 min-h-11 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-755 dark:text-slate-450 dark:hover:text-slate-250 transition-all cursor-pointer border border-slate-200 dark:border-slate-800 shrink-0"
              title="Đóng hộp thoại"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {filteredSources.length === 0 ? (
            <div className="text-center py-12 text-slate-450 dark:text-slate-500">
              Không tìm thấy tài liệu phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-2">
              {filteredSources.map((src) => {
                const hasDocument = !!src.document && src.document.trim() !== "";
                const displayName = getSourceDisplayName(src);

                return (
                  <button
                    key={src.id}
                    onClick={() => onSelect(src.id)}
                    className="w-full min-h-11 text-left p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-900 transition-all duration-200 hover:shadow-md flex items-start gap-3 md:gap-4 group cursor-pointer"
                  >
                    <div className={cn(
                      "p-3 rounded-xl shrink-0 transition-colors",
                      hasDocument 
                        ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}>
                      {hasDocument ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6 opacity-60" />}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-205 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate mb-1" title={displayName}>
                        {displayName}
                      </h3>
                      {displayName !== src.name && (
                        <p className="text-xs text-slate-450 dark:text-slate-500 truncate mb-2" title={src.name}>
                          {src.name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" />
                          {src.questions.length} câu hỏi
                        </span>
                        {src.metadata?.last_modified && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-350 dark:bg-slate-700" />
                            <span className="truncate flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {formatDate(src.metadata.last_modified).split(" ")[0]}
                            </span>
                          </>
                        )}
                      </div>

                      {hasDocument && (
                        <div className="mt-3">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-extrabold uppercase tracking-wide">
                            Có tài liệu ôn tập
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

type DocumentUIState = "EMPTY" | "PICKER_ENTRY" | "VIEWER" | "PICKER_MODAL";
type DocumentRenderState = "NO_SELECTION" | "HAS_CONTENT" | "EMPTY_CONTENT";

function resolveDocumentState(source: SourceFile | undefined): DocumentRenderState {
  if (!source) return "NO_SELECTION";
  const doc = source.document;
  const note = source.note;
  const hasContent =
    (typeof doc === "string" && doc.trim().length > 0) ||
    (typeof note === "string" && note.trim().length > 0);
  if (hasContent) return "HAS_CONTENT";
  return "EMPTY_CONTENT";
}

export default function DocumentViewerPage() {
  const theme = useQuizStore((state) => state.theme);
  const sources = useQuizStore((state) => state.sources);
  const selectedDocumentSourceId = useQuizStore((state) => state.selectedDocumentSourceId);
  const setSelectedDocumentSourceId = useQuizStore((state) => state.setSelectedDocumentSourceId);

  const [uiState, setUiState] = useState<DocumentUIState>("PICKER_ENTRY");
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply dark mode theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

      // Hydrate store from localStorage on mount only if store is empty (first load)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSources = localStorage.getItem("vapas_quiz_sources");
      const savedSettings = localStorage.getItem("vapas_quiz_settings");
      
      if (savedSources && sources.length === 0) {
        try {
          const parsed = JSON.parse(savedSources);
          useQuizStore.setState({ sources: parsed });
        } catch (e) {
          console.error("Error loading sources:", e);
        }
      }
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          useQuizStore.setState(parsed);
        } catch (e) {
          console.error("Error loading settings:", e);
        }
      }
      
      setIsLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine UI state after hydration and when selectedSourceId changes
  useEffect(() => {
    const currentSources = useQuizStore.getState().sources;
    const currentSelectedId = useQuizStore.getState().selectedDocumentSourceId;
    
    if (currentSources.length === 0) {
      setUiState("EMPTY");
    } else if (currentSelectedId && currentSources.some(s => s.id === currentSelectedId)) {
      setUiState("VIEWER");
    } else {
      setUiState("PICKER_ENTRY");
    }
  }, [selectedDocumentSourceId, sources]);

  // Persist selected source ID to lastOpenedDocumentId (optional memory)
  useEffect(() => {
    if (selectedDocumentSourceId) {
      localStorage.setItem("vapas_last_opened_document_id", selectedDocumentSourceId);
    }
  }, [selectedDocumentSourceId]);

  // Verify selected document ID is valid, reset to null if not found
  useEffect(() => {
    if (selectedDocumentSourceId && sources.length > 0) {
      const exists = sources.some(s => s.id === selectedDocumentSourceId);
      if (!exists) {
        setSelectedDocumentSourceId(null);
        setUiState("PICKER_ENTRY");
      }
    } else if (sources.length === 0 && isLoaded) {
      setUiState("EMPTY");
    }
  }, [sources, selectedDocumentSourceId, setSelectedDocumentSourceId, isLoaded]);

  const activeSource = sources.find(s => s.id === selectedDocumentSourceId);

  const handleSourceSelect = (id: string) => {
    setSelectedDocumentSourceId(id);
    setUiState("VIEWER");
  };

  const activeDocumentId = selectedDocumentSourceId;
  const selectedSource = activeSource;

  const renderState = useMemo(() => {
    return resolveDocumentState(selectedSource);
  }, [activeDocumentId, selectedSource, sources]);

  const memoizedNote = useMemo(() => {
    if (!selectedSource) return null;
    if (!selectedSource.note || selectedSource.note.trim() === "") {
      return (
        <div className="bg-slate-105 bg-slate-100/55 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2 transition-colors">
          <AlertCircle className="w-4 h-4 text-slate-350 dark:text-slate-650" />
          Tài liệu này không chứa ghi chú từ tác giả.
        </div>
      );
    }
    return (
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 md:p-6 shadow-sm flex items-start gap-3 md:gap-4 transition-colors overflow-hidden">
        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-amber-850 dark:text-amber-400 uppercase tracking-wider mb-1">Ghi chú từ tác giả</h2>
          <p className="text-sm md:text-base text-amber-800 dark:text-amber-300 whitespace-pre-wrap leading-relaxed">
            {selectedSource.note}
          </p>
        </div>
      </div>
    );
  }, [activeDocumentId, selectedSource, sources]);

  const memoizedDocument = useMemo(() => {
    if (!selectedSource) return null;
    if (!selectedSource.document || selectedSource.document.trim() === "") {
      return <EmptyDocumentState />;
    }
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-10 shadow-sm transition-colors duration-200 overflow-hidden">
        <h2 className="text-sm font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nội dung tài liệu học tập
        </h2>
        <MarkdownRenderer content={selectedSource.document} />
      </div>
    );
  }, [activeDocumentId, selectedSource, sources]);

  const formatDate = (timestamp?: any) => {
    if (!timestamp) return "N/A";
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return String(timestamp);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
  };

  const renderMobileHeaderInfo = () => {
    if (!selectedSource) return null;
    return (
      <div className="lg:hidden bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 justify-between items-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="font-extrabold text-sm text-indigo-650 dark:text-indigo-400 w-full truncate mb-1">
          {getSourceDisplayName(selectedSource)}
        </div>
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(selectedSource.metadata?.last_modified)}
        </span>
        <span className="flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5" />
          {selectedSource.questions.length} câu hỏi
        </span>
      </div>
    );
  };

  const renderWorkspaceContent = () => {
    if (uiState === "EMPTY") {
      return (
        <div className="py-8 md:py-16 px-4 md:px-8">
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-12 transition-all max-w-4xl mx-auto">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700 animate-pulse" />
          <h2 className="text-2xl font-extrabold text-slate-855 dark:text-slate-100 mb-3">Chưa có nguồn tài liệu</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            Vui lòng tải lên tài liệu học tập (.json) có cấu trúc Learning Package hoặc tệp thô (.txt, .docx) từ trang chủ để bắt đầu ôn luyện.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-650 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 text-sm md:text-base cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tải lên tệp tại Trang chủ
          </Link>
          </div>
        </div>
      );
    }
    if (uiState === "PICKER_ENTRY") {
      return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
          <DocumentPickerEntry
            sources={sources}
            onSelect={handleSourceSelect}
            formatDate={formatDate}
          />
        </div>
      );
    }
    
    switch (renderState) {
      case "NO_SELECTION":
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
            <DocumentPickerEntry
              sources={sources}
              onSelect={handleSourceSelect}
              formatDate={formatDate}
            />
          </div>
        );
      case "EMPTY_CONTENT":
        return (
          <div className="space-y-5 md:space-y-8 w-full px-0 md:px-8 py-5 md:py-12">
            {renderMobileHeaderInfo()}
            <EmptyDocumentState />
          </div>
        );
      case "HAS_CONTENT":
        return (
          <div className="space-y-5 md:space-y-8 w-full px-0 md:px-8 py-5 md:py-12">
            {renderMobileHeaderInfo()}
            {memoizedNote}
            {memoizedDocument}
          </div>
        );
    }
  };

  if (!isLoaded) {
    return <DocumentSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="min-w-11 min-h-11 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250 transition-colors flex items-center justify-center cursor-pointer"
            title="Quay lại trang chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline" />
          <h1 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Tài liệu học tập</span>
            <span className="sm:hidden">Tài liệu</span>
          </h1>
        </div>

        {(uiState === "VIEWER" || uiState === "PICKER_MODAL") && selectedSource && (
          <div className="hidden lg:flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Cập nhật: {formatDate(selectedSource.metadata?.last_modified)}
            </span>
            <span className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              Tổng số câu: {selectedSource.questions.length}
            </span>
          </div>
        )}

        {selectedDocumentSourceId !== null && (
          <button
            onClick={() => setUiState("PICKER_MODAL")}
            className={cn(
              "min-w-11 min-h-11 p-2.5 rounded-xl border transition-all flex items-center justify-center gap-2 hover:shadow-sm cursor-pointer",
              uiState === "PICKER_MODAL"
                ? "border-indigo-300 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 font-semibold"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}
            title="Chọn nguồn tài liệu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-semibold hidden md:inline">Nguồn tài liệu</span>
          </button>
        )}
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Center Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-4xl mx-auto px-4 md:px-8 pb-5 md:pb-4 w-full overflow-x-hidden">
            {renderWorkspaceContent()}
          </div>
        </main>

        {/* Modal Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-200",
            uiState === "PICKER_MODAL" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        >
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80"
            onClick={() => {
              if (selectedDocumentSourceId) {
                setUiState("VIEWER");
              } else {
                setUiState("PICKER_ENTRY");
              }
            }}
          />
          <DocumentPickerModal
            sources={sources}
            onSelect={handleSourceSelect}
            formatDate={formatDate}
            isOpen={uiState === "PICKER_MODAL"}
            onClose={() => {
              if (selectedDocumentSourceId) {
                setUiState("VIEWER");
              } else {
                setUiState("PICKER_ENTRY");
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}
