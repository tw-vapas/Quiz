"use client";

import React, { useRef, useState, useLayoutEffect, useCallback, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuizStore, SourceFile } from "@/store/quizStore";
import { parseFile } from "@/lib/parser";
import { getSourceDisplayName } from "@/lib/sourceHelper";
import SourceAllocation from "./SourceAllocation";
import { Plus, Trash2, FileText, FileWarning, X, GripVertical, BookOpen } from "lucide-react";
import { cn, useRenderProfiler, STORAGE_LIMIT_BYTES, getQuizStorageUsedBytesExcept, getQuizStorageUsedBytesByKey, getItemBytes, formatBytes } from "@/lib/utils";

// --- Virtualized Source Card Item (HTML5 Drag & Drop) ---
interface VirtualSourceCardProps {
  source: SourceFile;
  index: number;
  editingSourceIds: Record<string, boolean>;
  setEditingSourceIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  updateLocalCustomName: (id: string, name: string) => void;
  toggleLocalSource: (id: string) => void;
  removeLocalSource: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  draggedIndex: number | null;
  setDraggedIndex: (idx: number | null) => void;
  dropTargetIndex: number | null;
  onDropTargetChange: (idx: number | null) => void;
  onReorder: (newSources: SourceFile[]) => void;
  localSources: SourceFile[];
}

const ITEM_HEIGHT = 96;

const VirtualSourceCard = React.memo(({
  source,
  index,
  editingSourceIds,
  setEditingSourceIds,
  updateLocalCustomName,
  toggleLocalSource,
  removeLocalSource,
  onDeleteRequest,
  draggedIndex,
  setDraggedIndex,
  dropTargetIndex,
  onDropTargetChange,
  onReorder,
  localSources
}: VirtualSourceCardProps) => {
  useRenderProfiler(`VirtualSourceCard`);
  const router = useRouter();
  const [isDraggable, setIsDraggable] = useState(false);
  const hasDocument = !!(source.document || source.note);
  
  const sourceBytes = getItemBytes(source);
  const sourceSizeText = formatBytes(sourceBytes);

  const handleDragStart = (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onDropTargetChange(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = y / rect.height;
      if (ratio < 0.25) {
        onDropTargetChange(index);
      } else if (ratio > 0.75) {
        onDropTargetChange(index + 1);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
      onDropTargetChange(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex && draggedIndex + 1 !== dropTargetIndex) {
      const adjustedTarget = draggedIndex < dropTargetIndex ? dropTargetIndex - 1 : dropTargetIndex;
      const nextSources = [...localSources];
      const [removed] = nextSources.splice(draggedIndex, 1);
      nextSources.splice(adjustedTarget, 0, removed);
      onReorder(nextSources);
    }
    setDraggedIndex(null);
    onDropTargetChange(null);
  };

  const toggleEditing = (id: string) => {
    setEditingSourceIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isDragging = draggedIndex === index;

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ minHeight: `${ITEM_HEIGHT - 12}px` }}
      className={cn(
        "p-4 rounded-xl border flex items-center gap-3 transition-all duration-150 group/card relative select-none",
        source.isValid 
          ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80" 
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50",
        isDragging && "opacity-40"
      )}
    >
      {/* Drag Handle Icon in front */}
      <div
        className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg cursor-grab active:cursor-grabbing opacity-65 hover:opacity-100 transition-all duration-150 flex items-center justify-center touch-none select-none w-11 h-11 md:w-8 md:h-8 md:-ml-2 shrink-0"
        onMouseEnter={() => setIsDraggable(true)}
        onMouseLeave={() => setIsDraggable(false)}
        title="Kéo để sắp xếp"
      >
        <GripVertical className="w-5 h-5 shrink-0" />
      </div>

      <div className="flex items-center shrink-0">
        <input
          type="checkbox"
          checked={source.active}
          disabled={!source.isValid}
          onChange={() => toggleLocalSource(source.id)}
          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-50"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1">
          <div className="flex-1 min-w-0">
            {editingSourceIds[source.id] ? (
              <input
                type="text"
                placeholder="Đặt tên nguồn dữ liệu..."
                value={source.customName || ""}
                onChange={(e) => updateLocalCustomName(source.id, e.target.value)}
                onBlur={() => {
                  setEditingSourceIds(prev => ({ ...prev, [source.id]: false }));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingSourceIds(prev => ({ ...prev, [source.id]: false }));
                  }
                }}
                className="w-full px-2 py-1 text-sm font-bold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-1"
                autoFocus
              />
            ) : (
              <>
                <h3 className="font-semibold text-sm truncate text-slate-800 dark:text-slate-200" title={getSourceDisplayName(source)}>
                  {getSourceDisplayName(source)}
                </h3>
                {getSourceDisplayName(source) !== source.name && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate" title={source.name}>
                    {source.name}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {hasDocument && (
              <button
                onClick={() => {
                  useQuizStore.getState().setSelectedDocumentSourceId(source.id);
                  router.push("/document");
                }}
                className="min-w-11 min-h-11 md:min-w-0 md:min-h-0 flex items-center justify-center text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 select-none shrink-0 cursor-pointer"
                title="Xem tài liệu"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => toggleEditing(source.id)}
              className="min-h-11 md:min-h-0 px-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-semibold select-none cursor-pointer"
            >
              Đặt tên
            </button>
            <button
              onClick={() => onDeleteRequest(source.id)}
              className="min-w-11 min-h-11 md:min-w-0 md:min-h-0 flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 select-none shrink-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {source.isValid ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>{source.questionsCount} câu hỏi</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-mono">{sourceSizeText}</span>
          </p>
        ) : (
          <button
            onClick={() => {
              useQuizStore.getState().setActiveFileId(source.id);
              useQuizStore.getState().setSettingsOpen(false);
              useQuizStore.getState().setActiveSection("create");
            }}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline mt-1 flex items-center gap-1 cursor-pointer select-none text-left"
            title={source.error || "Nhấp để chuyển tới File Manager chỉnh sửa"}
          >
            <FileWarning className="w-4 h-4 shrink-0" />
            <span className="truncate">Chưa hợp lệ (Chỉnh sửa trong File Manager)</span>
          </button>
        )}
      </div>
    </div>
  );
});

VirtualSourceCard.displayName = "VirtualSourceCard";


// --- Virtualized Sources List container ---
interface VirtualSourcesListProps {
  sources: SourceFile[];
  editingSourceIds: Record<string, boolean>;
  setEditingSourceIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  updateLocalCustomName: (id: string, name: string) => void;
  toggleLocalSource: (id: string) => void;
  removeLocalSource: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onReorder: (newSources: SourceFile[]) => void;
  parentScrollRef: React.RefObject<HTMLDivElement | null>;
}

const VirtualSourcesList = ({
  sources,
  editingSourceIds,
  setEditingSourceIds,
  updateLocalCustomName,
  toggleLocalSource,
  removeLocalSource,
  onDeleteRequest,
  onReorder,
  parentScrollRef: _parentScrollRef
}: VirtualSourcesListProps) => {
  useRenderProfiler("VirtualSourcesList");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const showLine = dropTargetIndex !== null && draggedIndex !== null;

  return (
    <div className="relative w-full space-y-3 pb-4">
      {sources.map((source, index) => (
        <Fragment key={source.id}>
          {showLine && dropTargetIndex === index && (
            <div className="h-0.5 -my-0.5 relative z-10">
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] w-[95%] bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
            </div>
          )}
          <VirtualSourceCard
            source={source}
            index={index}
            editingSourceIds={editingSourceIds}
            setEditingSourceIds={setEditingSourceIds}
            updateLocalCustomName={updateLocalCustomName}
            toggleLocalSource={toggleLocalSource}
            removeLocalSource={removeLocalSource}
            onDeleteRequest={onDeleteRequest}
            draggedIndex={draggedIndex}
            setDraggedIndex={setDraggedIndex}
            dropTargetIndex={dropTargetIndex}
            onDropTargetChange={setDropTargetIndex}
            onReorder={onReorder}
            localSources={sources}
          />
        </Fragment>
      ))}
      {showLine && dropTargetIndex === sources.length && (
        <div className="h-0.5 -mt-0.5 relative z-10">
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-[3px] w-[95%] bg-indigo-500 rounded-full shadow-[0_0_6px_rgba(99,102,241,0.4)]" />
        </div>
      )}
    </div>
  );
};


// --- Memoized Settings & Controls ---
interface SidebarControlsProps {
  localShowResult: boolean;
  setLocalShowResult: (val: boolean) => void;
  localAutoNext: boolean;
  setLocalAutoNext: (val: boolean) => void;
  localTheme: 'light' | 'dark';
  setLocalTheme: (val: 'light' | 'dark') => void;
  localTimeLimitMode: 'UNLIMITED' | 'LIMITED';
  setLocalTimeLimitMode: (val: 'UNLIMITED' | 'LIMITED') => void;
  localTimeLimitMinutes: number;
  setLocalTimeLimitMinutes: React.Dispatch<React.SetStateAction<number>>;
  localCountMode: "ALL" | "CUSTOM";
  setLocalCountMode: (val: "ALL" | "CUSTOM") => void;
  localCustomCount: number;
  setLocalCustomCount: React.Dispatch<React.SetStateAction<number>>;
  totalAvailable: number;
  localSources: SourceFile[];
  localAllocations: Record<string, number>;
  setLocalAllocations: (val: Record<string, number>) => void;
}

const SidebarControls = React.memo(({
  localShowResult,
  setLocalShowResult,
  localAutoNext,
  setLocalAutoNext,
  localTheme,
  setLocalTheme,
  localTimeLimitMode,
  setLocalTimeLimitMode,
  localTimeLimitMinutes,
  setLocalTimeLimitMinutes,
  localCountMode,
  setLocalCountMode,
  localCustomCount,
  setLocalCustomCount,
  totalAvailable,
  localSources,
  localAllocations,
  setLocalAllocations
}: SidebarControlsProps) => {
  useRenderProfiler("SidebarControls");
  return (
    <div className="flex flex-col shrink-0 bg-white dark:bg-slate-900">
      {/* Sticky Header for Tùy chỉnh chung */}
      <div className="sticky top-0 z-10 px-5 md:px-6 py-3.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Tùy chỉnh chung</h2>
      </div>

      <div className="p-5 md:p-6 space-y-6">
        {/* 1. Giao diện */}
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Giao diện</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="themeMode"
                value="light"
                checked={localTheme === 'light'}
                onChange={() => setLocalTheme('light')}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sáng</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="themeMode"
                value="dark"
                checked={localTheme === 'dark'}
                onChange={() => setLocalTheme('dark')}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tối</span>
            </label>
          </div>
        </div>

        {/* 2. Tương tác */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-700/80">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Tương tác</h3>
          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex items-center pt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={localShowResult}
                  onChange={(e) => setLocalShowResult(e.target.checked)}
                />
                <div className="w-5 h-5 shrink-0 border-2 border-slate-300 dark:border-slate-600 rounded transition-colors peer-checked:bg-indigo-600 peer-checked:border-indigo-600 dark:peer-checked:bg-indigo-500 dark:peer-checked:border-indigo-500 group-hover:border-indigo-500 flex items-center justify-center">
                  {localShowResult && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug pt-0.5">Hiển thị kết quả sau mỗi câu</span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer group">
              <div className="relative flex items-center pt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={localAutoNext}
                  onChange={(e) => setLocalAutoNext(e.target.checked)}
                />
                <div className="w-5 h-5 shrink-0 border-2 border-slate-300 dark:border-slate-600 rounded transition-colors peer-checked:bg-indigo-600 peer-checked:border-indigo-600 dark:peer-checked:bg-indigo-500 dark:peer-checked:border-indigo-500 group-hover:border-indigo-500 flex items-center justify-center">
                  {localAutoNext && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-snug pt-0.5">Chuyển sang câu tiếp theo lập tức sau khi chọn</span>
            </label>
          </div>
        </div>

        {/* 3. Số lượng câu hỏi */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-700/80">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Số lượng câu hỏi</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="questionCountMode"
                value="ALL"
                checked={localCountMode === 'ALL'}
                onChange={() => setLocalCountMode('ALL')}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tất cả ({totalAvailable})</span>
            </label>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="questionCountMode"
                  value="CUSTOM"
                  checked={localCountMode === 'CUSTOM'}
                  onChange={() => setLocalCountMode('CUSTOM')}
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tùy chỉnh:</span>
              </label>
              <input
                type="number"
                min={1}
                max={totalAvailable || 1}
                disabled={localCountMode !== 'CUSTOM'}
                value={localCustomCount === 0 ? '' : localCustomCount}
                onChange={(e) => {
                  const valStr = e.target.value;
                  if (valStr === '') {
                    setLocalCustomCount(0);
                    return;
                  }
                  let val = parseInt(valStr);
                  if (isNaN(val)) val = 0;
                  val = Math.max(0, Math.min(val, totalAvailable));
                  setLocalCustomCount(val);
                }}
                onBlur={() => {
                  if (localCustomCount < 1) {
                    setLocalCustomCount(Math.min(1, totalAvailable));
                  }
                }}
                className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
              />
            </div>

            {localCountMode === 'CUSTOM' && localSources.filter(s => s.active && s.isValid).length > 0 && (
              <SourceAllocation
                sources={localSources}
                totalQuestions={localCustomCount}
                allocations={localAllocations}
                onChange={setLocalAllocations}
              />
            )}
          </div>
        </div>

        {/* 4. Thời gian */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-700/80">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Thời gian</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="timeLimitMode"
                checked={localTimeLimitMode === 'UNLIMITED'}
                onChange={() => setLocalTimeLimitMode('UNLIMITED')}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Không giới hạn thời gian</span>
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-3 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="timeLimitMode"
                  checked={localTimeLimitMode === 'LIMITED'}
                  onChange={() => setLocalTimeLimitMode('LIMITED')}
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Giới hạn thời gian:</span>
              </label>
              <input
                type="number"
                min={1}
                disabled={localTimeLimitMode !== 'LIMITED'}
                value={localTimeLimitMinutes === 0 ? '' : localTimeLimitMinutes}
                onChange={(e) => {
                  const valStr = e.target.value;
                  if (valStr === '') {
                    setLocalTimeLimitMinutes(0);
                    return;
                  }
                  let val = parseInt(valStr);
                  if (isNaN(val)) val = 0;
                  val = Math.max(1, val);
                  setLocalTimeLimitMinutes(val);
                }}
                onBlur={() => {
                  if (localTimeLimitMinutes < 1) {
                    setLocalTimeLimitMinutes(15);
                  }
                }}
                className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">phút</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SidebarControls.displayName = "SidebarControls";


// --- Memoized Sources List Section ---
interface SidebarListProps {
  localSources: SourceFile[];
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  editingSourceIds: Record<string, boolean>;
  setEditingSourceIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  updateLocalCustomName: (id: string, name: string) => void;
  toggleLocalSource: (id: string) => void;
  removeLocalSource: (id: string) => void;
  onReorder: (newSources: SourceFile[]) => void;
  parentScrollRef: React.RefObject<HTMLDivElement | null>;
}

const SidebarList = React.memo(({
  localSources,
  isUploading,
  fileInputRef,
  handleFileUpload,
  editingSourceIds,
  setEditingSourceIds,
  updateLocalCustomName,
  toggleLocalSource,
  removeLocalSource,
  onReorder,
  parentScrollRef
}: SidebarListProps) => {
  useRenderProfiler("SidebarList");

  const [storageUsedBytes, setStorageUsedBytes] = useState(() => {
    const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_sources");
    const sourcesBytes = localSources.reduce((sum, s) => sum + getItemBytes(s), 0);
    return otherBytes + sourcesBytes;
  });
  useEffect(() => {
    const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_sources");
    const sourcesBytes = localSources.reduce((sum, s) => sum + getItemBytes(s), 0);
    setStorageUsedBytes(otherBytes + sourcesBytes);
  }, [localSources]);
  
  const sourcesBytes = localSources.reduce((sum, s) => sum + getItemBytes(s), 0);
  const creatorFilesBytes = getQuizStorageUsedBytesByKey("vapas_quiz_creator_files");
  const sourcesPercent = Math.min(100, (sourcesBytes / STORAGE_LIMIT_BYTES) * 100);
  const creatorFilesPercent = Math.min(100, (creatorFilesBytes / STORAGE_LIMIT_BYTES) * 100);
  const storagePercent = Math.min(100, (storageUsedBytes / STORAGE_LIMIT_BYTES) * 100);
  const isStorageFull = storageUsedBytes >= STORAGE_LIMIT_BYTES;
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const handleDeleteRequest = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);
  const confirmSource = confirmDeleteId ? localSources.find(s => s.id === confirmDeleteId) : null;

  return (
    <div className="flex flex-col shrink-0 relative bg-slate-50/50 dark:bg-slate-900/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 px-5 md:px-6 py-3.5 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-sm border-y border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
        <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Nguồn dữ liệu</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isStorageFull}
          className="w-11 h-11 md:w-8 md:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          title={isStorageFull ? "Đã đạt giới hạn dung lượng" : "Tải lên tệp .txt, .json, .docx, .pdf, hình ảnh"}
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt,.json,.docx,.pdf,image/*"
          multiple
          className="hidden"
        />
      </div>

      {/* Storage Bar (Unified Quiz File Storage) */}
      <div className="px-5 md:px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-600 dark:text-slate-400">
            Dung lượng lưu trữ: <span className="font-mono text-slate-800 dark:text-slate-200 font-extrabold">{(storageUsedBytes / (1024 * 1024)).toFixed(2)} MB</span> / {(STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span className={cn(
            "font-extrabold px-1.5 py-0.5 rounded text-[9px]",
            storagePercent >= 90 
              ? "bg-red-500/10 text-red-500" 
              : storagePercent >= 70 
                ? "bg-amber-500/10 text-amber-500" 
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          )}>
            {storagePercent >= 90 ? "Bộ nhớ sắp đầy!" : `${storagePercent.toFixed(0)}%`}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 shadow-sm",
              storagePercent >= 90 
                ? "bg-gradient-to-r from-red-500 to-rose-600" 
                : storagePercent >= 70 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600"
            )}
            style={{ width: `${Math.max(2, storagePercent)}%` }}
            title={`Quiz Files storage: ${(storageUsedBytes / (1024 * 1024)).toFixed(2)} MB`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          <span>{localSources.length} / 10 Quiz Files</span>
          {isStorageFull && (
            <span className="text-red-500 font-bold">
              Đã đạt giới hạn dung lượng bộ nhớ.
            </span>
          )}
        </div>
      </div>

      <div className="p-5 md:p-6 flex-1 min-h-0 relative">
        {localSources.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">Chưa có tệp nào được tải lên.</p>
            <p className="text-xs mt-1">Hỗ trợ .docx, .txt, .json</p>
          </div>
        ) : (
          <VirtualSourcesList
            sources={localSources}
            editingSourceIds={editingSourceIds}
            setEditingSourceIds={setEditingSourceIds}
            updateLocalCustomName={updateLocalCustomName}
            toggleLocalSource={toggleLocalSource}
            removeLocalSource={removeLocalSource}
            onDeleteRequest={handleDeleteRequest}
            onReorder={onReorder}
            parentScrollRef={parentScrollRef}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && confirmSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Xác nhận xóa
              </h3>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa nguồn dữ liệu <span className="font-bold text-slate-800 dark:text-slate-200">{getSourceDisplayName(confirmSource)}</span>?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  removeLocalSource(confirmDeleteId);
                  setConfirmDeleteId(null);
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
});

SidebarList.displayName = "SidebarList";


// --- Top-Level Sidebar Orchestrator Container ---
export default function Sidebar() {
  useRenderProfiler("SidebarContainer");

  const setSettingsOpen = useQuizStore(state => state.setSettingsOpen);

  useLayoutEffect(() => {
    const openedAt = useQuizStore.getState().settingsOpenedAt;
    if (openedAt) {
      const timeToOpenSidebar = performance.now() - openedAt;
      console.log(`[Profiler] timeToOpenSidebar: ${timeToOpenSidebar.toFixed(2)}ms`);
    }
  }, []);

  // Local state initialized via getState to prevent subscriptions to home page modifications
  const [localShowResult, setLocalShowResult] = useState(() => useQuizStore.getState().showResultAfterQuestion);
  const [localAutoNext, setLocalAutoNext] = useState(() => useQuizStore.getState().autoNext);
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(() => useQuizStore.getState().theme);
  const [localTimeLimitMode, setLocalTimeLimitMode] = useState(() => useQuizStore.getState().timeLimitMode);
  const [localTimeLimitMinutes, setLocalTimeLimitMinutes] = useState(() => useQuizStore.getState().timeLimitMinutes);
  const [localCountMode, setLocalCountMode] = useState(() => useQuizStore.getState().questionCountMode);
  const [localCustomCount, setLocalCustomCount] = useState(() => useQuizStore.getState().customQuestionCount);
  const [localAllocations, setLocalAllocations] = useState(() => useQuizStore.getState().sourceAllocations);
  const [localSources, setLocalSources] = useState(() => useQuizStore.getState().sources);
  const [isSaved, setIsSaved] = useState(false);

  const [editingSourceIds, setEditingSourceIds] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const totalAvailable = localSources.filter(s => s.active && s.isValid).reduce((acc, curr) => acc + curr.questionsCount, 0);

  const updateLocalCustomName = useCallback((id: string, name: string) => {
    setLocalSources(prev => prev.map(s => s.id === id ? { ...s, customName: name || undefined } : s));
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const creatorFiles = useQuizStore.getState().creatorFiles;

    if (creatorFiles.length + files.length > 10) {
      useQuizStore.getState().showNotification(`Không thể tải lên: Vượt quá giới hạn tối đa 10 tệp tin. (Hiện tại: ${creatorFiles.length})`, "error");
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let addedCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await parseFile(file);
        useQuizStore.getState().createCreatorFile(file.name, {
          questions: result.questions || [],
          document: result.document || "",
          note: result.note || ""
        });
        
        const fileValid = result.isValid && result.questions.length > 0 && result.questions.every(q => q.options && q.options.length > 0 && q.correctOptionIds && q.correctOptionIds.length > 0);
        if (!fileValid) {
          invalidCount++;
        }
        addedCount++;
      } catch (err) {
        useQuizStore.getState().createCreatorFile(file.name, {
          questions: [],
          document: "",
          note: ""
        });
        invalidCount++;
        addedCount++;
      }
    }

    const updatedSources = useQuizStore.getState().sources;
    setLocalSources(updatedSources);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (invalidCount > 0) {
      useQuizStore.getState().showNotification(`Đã nạp ${addedCount} tệp vào File Manager. Có ${invalidCount} tệp chưa hợp lệ, bạn có thể chỉnh sửa trong File Manager để kích hoạt tệp làm quiz.`, "info");
    } else {
      useQuizStore.getState().showNotification(`Đã nạp thành công ${addedCount} tệp tin!`, "success");
    }
  }, []);

  const toggleLocalSource = useCallback((id: string) => {
    setLocalSources(prev => {
      const nextSources = prev.map(s => s.id === id ? { ...s, active: !s.active } : s);
      const nextTotal = nextSources.filter(s => s.active && s.isValid).reduce((acc, curr) => acc + curr.questionsCount, 0);
      setLocalCustomCount(currCount => {
        if (currCount > nextTotal && nextTotal > 0) {
          return nextTotal;
        }
        return currCount;
      });
      return nextSources;
    });
  }, []);

  const removeLocalSource = useCallback((id: string) => {
    useQuizStore.getState().deleteCreatorFile(id);
    setLocalSources(prev => {
      const nextSources = prev.filter(s => s.id !== id);
      const nextTotal = nextSources.filter(s => s.active && s.isValid).reduce((acc, curr) => acc + curr.questionsCount, 0);
      setLocalCustomCount(currCount => {
        if (currCount > nextTotal && nextTotal > 0) {
          return nextTotal;
        }
        return currCount;
      });
      return nextSources;
    });
  }, []);

  const handleReorder = useCallback((newSources: SourceFile[]) => {
    setLocalSources(newSources);
  }, []);

  const handleSave = () => {
    useQuizStore.setState({
      showResultAfterQuestion: localShowResult,
      autoNext: localAutoNext,
      timeLimitMode: localTimeLimitMode,
      timeLimitMinutes: localTimeLimitMinutes,
      questionCountMode: localCountMode,
      customQuestionCount: localCustomCount,
      sourceAllocations: localAllocations,
      sources: localSources,
      theme: localTheme
    });
    useQuizStore.getState().setTheme(localTheme);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Modal Header */}
      <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900 z-20">
        <div className="flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">Cài đặt</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSettingsOpen(false)} 
              className="min-w-11 min-h-11 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto flex flex-col relative">
        <SidebarControls
          localShowResult={localShowResult}
          setLocalShowResult={setLocalShowResult}
          localAutoNext={localAutoNext}
          setLocalAutoNext={setLocalAutoNext}
          localTheme={localTheme}
          setLocalTheme={setLocalTheme}
          localTimeLimitMode={localTimeLimitMode}
          setLocalTimeLimitMode={setLocalTimeLimitMode}
          localTimeLimitMinutes={localTimeLimitMinutes}
          setLocalTimeLimitMinutes={setLocalTimeLimitMinutes}
          localCountMode={localCountMode}
          setLocalCountMode={setLocalCountMode}
          localCustomCount={localCustomCount}
          setLocalCustomCount={setLocalCustomCount}
          totalAvailable={totalAvailable}
          localSources={localSources}
          localAllocations={localAllocations}
          setLocalAllocations={setLocalAllocations}
        />

        <SidebarList
          localSources={localSources}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          editingSourceIds={editingSourceIds}
          setEditingSourceIds={setEditingSourceIds}
          updateLocalCustomName={updateLocalCustomName}
          toggleLocalSource={toggleLocalSource}
          removeLocalSource={removeLocalSource}
          onReorder={handleReorder}
          parentScrollRef={scrollContainerRef}
        />
      </div>

      {/* Fixed Footer with Cancel and Save Buttons */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0 flex gap-3 z-20">
        <button
          onClick={() => setSettingsOpen(false)}
          className="flex-1 min-h-11 py-3 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-[0.98] text-sm cursor-pointer"
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          className={cn(
            "flex-1 min-h-11 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-md active:scale-[0.98] text-sm cursor-pointer",
            isSaved 
              ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" 
              : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
          )}
        >
          {isSaved ? "Đã lưu!" : "Lưu"}
        </button>
      </div>
    </div>
  );
}
