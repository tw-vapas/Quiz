"use client";

import React, { useState, useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { getSourceDisplayName } from "@/lib/sourceHelper";
import { parseFile } from "@/lib/parser";
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  FileCode, 
  HelpCircle,
  X,
  Upload,
  Check,
  Link2
} from "lucide-react";
import { cn, STORAGE_LIMIT_BYTES, getQuizStorageUsedBytes, getQuizStorageUsedBytesExcept, getItemBytes, formatBytes } from "@/lib/utils";

interface SupportedFileItem {
  id: string;
  name: string;
  document: string;
  note: string;
  questions: any[];
  metadata: any;
  supportedFileIds: string[];
}

interface QuizFileItem {
  id: string;
  name: string;
  document: string;
  note: string;
  questions: any[];
  metadata: any;
  supportedFileIds: string[];
  supportedFiles: SupportedFileItem[];
}

export default function FileManager() {
  const QUIZ_FILE_LIMIT = 5;
  const SUPPORTED_FILE_LIMIT = 15;

  const storeSources = useQuizStore(state => state.sources);
  const creatorFiles = useQuizStore(state => state.creatorFiles);
  const activeFileId = useQuizStore(state => state.activeFileId);
  const setActiveFileId = useQuizStore(state => state.setActiveFileId);
  const createCreatorFile = useQuizStore(state => state.createCreatorFile);
  const deleteCreatorFile = useQuizStore(state => state.deleteCreatorFile);
  const linkSupportFileToQuiz = useQuizStore(state => state.linkSupportFileToQuiz);
  const unlinkSupportFileFromQuiz = useQuizStore(state => state.unlinkSupportFileFromQuiz);
  const syncQuestionsFromSupport = useQuizStore(state => state.syncQuestionsFromSupport);

  const quizFiles = creatorFiles
    .filter(f => f.type === "QUIZ")
    .map(q => ({
      id: q.id,
      name: q.name,
      document: q.document,
      note: q.note,
      questions: q.questions,
      metadata: q.metadata,
      supportedFileIds: q.supportedFileIds,
      supportedFiles: q.supportedFileIds
        .map(sfId => creatorFiles.find(sf => sf.id === sfId))
        .filter((sf): sf is any => !!sf)
        .map(sf => ({
          id: sf.id,
          name: sf.name,
          document: sf.document,
          note: sf.note,
          questions: sf.questions,
          metadata: sf.metadata,
          supportedFileIds: sf.supportedFileIds
        }))
    }));

  const supportedFiles = creatorFiles
    .filter(f => f.type === "SUPPORT")
    .map(sf => ({
      id: sf.id,
      name: sf.name,
      document: sf.document,
      note: sf.note,
      questions: sf.questions,
      metadata: sf.metadata,
      supportedFileIds: sf.supportedFileIds
    }));

  const [storageUsedBytes, setStorageUsedBytes] = useState(() => getQuizStorageUsedBytes());
  useEffect(() => {
    const id = setTimeout(() => setStorageUsedBytes(getQuizStorageUsedBytes()), 0);
    return () => clearTimeout(id);
  }, [creatorFiles, storeSources]);
  
  const sourcesBytes = storeSources.reduce((sum, s) => sum + getItemBytes(s), 0);
  const creatorFilesBytes = creatorFiles.reduce((sum, f) => sum + getItemBytes(f), 0);
  const sourcesPercent = Math.min(100, (sourcesBytes / STORAGE_LIMIT_BYTES) * 100);
  const creatorFilesPercent = Math.min(100, (creatorFilesBytes / STORAGE_LIMIT_BYTES) * 100);
  const storagePercent = Math.min(100, (storageUsedBytes / STORAGE_LIMIT_BYTES) * 100);
  const isStorageFull = storageUsedBytes >= STORAGE_LIMIT_BYTES;

  // --- INTERACTIVE STATES ---
  const [expandedQuizFiles, setExpandedQuizFiles] = useState<Record<string, boolean>>({
    qf1: true,
    qf2: true
  });

  // Modal "+ Create File" States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileType, setNewFileType] = useState<"QUIZ" | "SUPPORT">("QUIZ");
  const [newFileDataOption, setNewFileDataOption] = useState<"BLANK" | "IMPORT">("BLANK");
  const [newFileImportSource, setNewFileImportSource] = useState<"SOURCE" | "FILE">("SOURCE");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [newFileNameInput, setNewFileNameInput] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<{
    questions: any[];
    document: string;
    note: string;
  } | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");

  // Modal "+ Add Supported Files" States
  const [isAddSupportModalOpen, setIsAddSupportModalOpen] = useState(false);
  const [targetQuizFileId, setTargetQuizFileId] = useState<string | null>(null);
  const [selectedSupportFileIds, setSelectedSupportFileIds] = useState<Record<string, boolean>>({});

  // Sync effect simulator state
  const [syncingFileId, setSyncingFileId] = useState<string | null>(null);
  const [syncedFileId, setSyncedFileId] = useState<string | null>(null);

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'quiz' | 'support'; id: string } | null>(null);

  // --- ACTIONS ---
  const toggleQuizExpand = (id: string) => {
    setExpandedQuizFiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsParsing(true);
    setParseStatus("Đang đọc tệp tin...");
    
    try {
      const result = await parseFile(file, (status) => {
        setParseStatus(status);
      });
      
      if (result.isValid) {
        // Estimate total localStorage bytes after adding this file to prevent quota exceed / crash
        const testNewFile = {
          id: "temp_test_id",
          name: file.name,
          type: newFileType,
          document: result.document || "",
          note: result.note || "",
          questions: result.questions || [],
          metadata: {
            file_name: file.name,
            question_count: result.questions.length,
            last_modified: Date.now()
          },
          supportedFileIds: []
        };

        const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_creator_files");
        const estimatedNewFilesStr = JSON.stringify([...creatorFiles, testNewFile]);
        const estimatedNewFilesBytes = estimatedNewFilesStr.length * 2;
        const totalEstimatedBytes = otherBytes + estimatedNewFilesBytes;

        if (totalEstimatedBytes > STORAGE_LIMIT_BYTES) {
          useQuizStore.getState().showNotification("Không thể tải tệp lên: Dung lượng tệp quá lớn và bộ nhớ lưu trữ đã đầy.", "error");
          if (fileInputRef.current) fileInputRef.current.value = "";
          setIsParsing(false);
          setParseStatus("");
          return;
        }

        setImportedData({
          questions: result.questions,
          document: result.document || "",
          note: result.note || ""
        });
        setNewFileNameInput(file.name);
        
        const missingCount = result.questions.filter(q => q.correctOptionIds.length === 0).length;
        if (missingCount > 0) {
          useQuizStore.getState().showNotification(`Đã trích xuất ${result.questions.length} câu hỏi. Có ${missingCount} câu chưa có đáp án đúng.`, "info");
        } else {
          useQuizStore.getState().showNotification(`Đã trích xuất thành công ${result.questions.length} câu hỏi.`, "success");
        }
      } else {
        useQuizStore.getState().showNotification("Lỗi đọc file: " + result.error, "error");
      }
    } catch (err) {
      useQuizStore.getState().showNotification("Đã xảy ra lỗi khi đọc file.", "error");
    } finally {
      setIsParsing(false);
      setParseStatus("");
    }
  };

  const handleCreateFile = () => {
    const finalName = newFileNameInput.trim() || (
      newFileType === "QUIZ" 
        ? `Quiz File ${quizFiles.length + 1}` 
        : `Supported File ${supportedFiles.length + 1}`
    );

    let initialData: any = { questions: [], document: "", note: "" };

    if (newFileDataOption === "IMPORT") {
      if (newFileImportSource === "SOURCE" && selectedSourceId) {
        const src = storeSources.find(s => s.id === selectedSourceId);
        if (src) {
          initialData = {
            questions: src.questions,
            document: src.document || "",
            note: src.note || ""
          };
        }
      } else if (newFileImportSource === "FILE" && importedData) {
        initialData = importedData;
      }
    }

    // Estimate total localStorage bytes after adding this file to prevent quota exceed / crash
    const testNewFile = {
      id: "temp_test_id",
      name: finalName,
      type: newFileType,
      document: initialData.document || "",
      note: initialData.note || "",
      questions: initialData.questions || [],
      metadata: {
        file_name: finalName,
        question_count: initialData.questions?.length || 0,
        last_modified: Date.now()
      },
      supportedFileIds: []
    };

    const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_creator_files");
    const estimatedNewFilesStr = JSON.stringify([...creatorFiles, testNewFile]);
    const estimatedNewFilesBytes = estimatedNewFilesStr.length * 2;
    const totalEstimatedBytes = otherBytes + estimatedNewFilesBytes;

    if (totalEstimatedBytes > STORAGE_LIMIT_BYTES) {
      useQuizStore.getState().showNotification("Không thể thêm file: Dung lượng file quá lớn và bộ nhớ lưu trữ đã đầy.", "error");
      return;
    }

    const newId = createCreatorFile(finalName, newFileType, initialData);
    setActiveFileId(newId);

    // Reset Form & Close
    setNewFileNameInput("");
    setImportedData(null);
    setSelectedSourceId(null);
    setIsCreateModalOpen(false);
  };

  const openAddSupportModal = (quizFileId: string) => {
    setTargetQuizFileId(quizFileId);
    const targetQuiz = quizFiles.find(q => q.id === quizFileId);
    const initialSelections: Record<string, boolean> = {};
    if (targetQuiz) {
      targetQuiz.supportedFiles.forEach(f => {
        initialSelections[f.id] = true;
      });
    }
    setSelectedSupportFileIds(initialSelections);
    setIsAddSupportModalOpen(true);
  };

  const handleAddSupportFiles = () => {
    if (!targetQuizFileId) return;

    const selectedIds = Object.keys(selectedSupportFileIds).filter(id => selectedSupportFileIds[id]);
    const targetQuiz = creatorFiles.find(q => q.id === targetQuizFileId);

    if (targetQuiz) {
      // Unlink removed ones
      targetQuiz.supportedFileIds.forEach(id => {
        if (!selectedSupportFileIds[id]) {
          unlinkSupportFileFromQuiz(targetQuizFileId, id);
        }
      });
      // Link added ones
      selectedIds.forEach(id => {
        if (!targetQuiz.supportedFileIds.includes(id)) {
          linkSupportFileToQuiz(targetQuizFileId, id);
        }
      });
    }

    setIsAddSupportModalOpen(false);
    setTargetQuizFileId(null);
  };

  const deleteQuizFile = (id: string) => {
    deleteCreatorFile(id);
  };

  const unlinkSupportFile = (quizId: string, supportId: string) => {
    unlinkSupportFileFromQuiz(quizId, supportId);
  };

  const deleteSupportFileGlobal = (id: string) => {
    deleteCreatorFile(id);
  };

  const handleSync = (quizId: string, supportId: string) => {
    setSyncingFileId(supportId);
    syncQuestionsFromSupport(quizId, supportId);
    setTimeout(() => {
      setSyncingFileId(null);
      setSyncedFileId(supportId);
      setTimeout(() => {
        setSyncedFileId(prev => prev === supportId ? null : prev);
      }, 2000);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm relative">
      {/* 1. HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            File Manager
          </h3>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={(quizFiles.length >= QUIZ_FILE_LIMIT && supportedFiles.length >= SUPPORTED_FILE_LIMIT) || isStorageFull}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-extrabold text-xs transition-all",
            (quizFiles.length >= QUIZ_FILE_LIMIT && supportedFiles.length >= SUPPORTED_FILE_LIMIT) || isStorageFull
              ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed"
              : "border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:shadow-sm active:scale-95 cursor-pointer"
          )}
        >
          <Plus className="w-4 h-4" />
          Create File
        </button>
      </div>

      {/* Storage Bar */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex items-center justify-between text-[9px] font-bold mb-1">
          <span className={cn(
            storagePercent >= 90 ? "text-red-500" : storagePercent >= 70 ? "text-amber-500" : "text-slate-400"
          )}>
            {(storageUsedBytes / (1024 * 1024)).toFixed(2)} MB / {(STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span className={cn(
            storagePercent >= 90 ? "text-red-500" : storagePercent >= 70 ? "text-amber-500" : "text-slate-400"
          )}>
            {storagePercent >= 90 ? "Sắp đầy!" : `${storagePercent.toFixed(0)}%`}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="flex h-full">
            {sourcesPercent > 0 && (
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${sourcesPercent}%` }}
                title={`Nguồn dữ liệu: ${(sourcesBytes / (1024 * 1024)).toFixed(2)} MB`}
              />
            )}
            {creatorFilesPercent > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${creatorFilesPercent}%` }}
                title={`Tệp tạo quiz: ${(creatorFilesBytes / (1024 * 1024)).toFixed(2)} MB`}
              />
            )}
          </div>
        </div>
        <div className="flex gap-4 text-[10px] mt-1">
          <span className="flex items-center gap-1 text-indigo-500">
            <span className="w-2 h-2 rounded bg-indigo-500"></span>
            Nguồn dữ liệu: {(sourcesBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
          <span className="flex items-center gap-1 text-amber-500">
            <span className="w-2 h-2 rounded bg-amber-500"></span>
            Tệp tạo quiz: {(creatorFilesBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
        {isStorageFull && (
          <div className="text-[10px] text-red-500 font-bold mt-1">
            Đã đạt giới hạn dung lượng. Vui lòng xóa bớt file để tạo mới.
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE FOLDERS LIST */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* QUIZ FILE ACCORDIONS */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Quiz File
            <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded", quizFiles.length >= QUIZ_FILE_LIMIT ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
              {quizFiles.length}/{QUIZ_FILE_LIMIT}
            </span>
          </h4>

          <div className="space-y-3">
            {quizFiles.map((qf) => {
              const isExpanded = expandedQuizFiles[qf.id];
              return (
                <div key={qf.id} className="space-y-1.5">
                  {/* Quiz File Node Row */}
                  <div className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-xl border shadow-sm transition-all group",
                    activeFileId === qf.id
                      ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-indigo-100 dark:shadow-none"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  )}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Arrow to Toggle Collapse */}
                      <button 
                        onClick={() => toggleQuizExpand(qf.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                        <div 
                          onClick={() => setActiveFileId(qf.id)}
                          className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center shrink-0">
                            <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                              {qf.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              {formatBytes(getItemBytes(creatorFiles.find(f => f.id === qf.id) || qf))}
                            </span>
                          </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {/* Add Supported File Link */}
                      <button 
                        onClick={() => openAddSupportModal(qf.id)}
                        className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors"
                        title="Liên kết Supported File"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete Quiz File */}
                      <button 
                        onClick={() => setConfirmDelete({ type: 'quiz', id: qf.id })}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-505 cursor-pointer transition-colors"
                        title="Xóa Quiz File"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render Nested Children (Supported Files list inside) */}
                  {isExpanded && (
                    <div className="pl-6 space-y-1.5 relative before:content-[''] before:absolute before:left-3 before:top-0 before:bottom-3 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                      {qf.supportedFiles.length > 0 ? (
                        qf.supportedFiles.map((sf) => (
                          <div 
                            key={sf.id}
                            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 transition-all group relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:w-3 before:h-px before:bg-slate-200 dark:before:bg-slate-800"
                          >
                            <div 
                              className="flex items-center gap-2.5 min-w-0 flex-1 select-none"
                            >
                              <Link2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-450 truncate block">
                                  {sf.name}
                                </span>
                                <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                                  {formatBytes(getItemBytes(creatorFiles.find(f => f.id === sf.id) || sf))}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {/* Sync Button */}
                              <button 
                                onClick={() => handleSync(qf.id, sf.id)}
                                className={cn(
                                  "p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer transition-all",
                                  syncingFileId === sf.id && "animate-spin text-indigo-600 dark:text-indigo-400",
                                  syncedFileId === sf.id && "text-green-600 dark:text-green-400"
                                )}
                                title={syncedFileId === sf.id ? "Đã đồng bộ" : "Đồng bộ lại câu hỏi"}
                              >
                                {syncedFileId === sf.id ? <Check className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                              </button>
                              {/* Unlink Button */}
                              <button 
                                onClick={() => unlinkSupportFile(qf.id, sf.id)}
                                className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                title="Gỡ liên kết"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-4 py-2 flex items-center gap-1.5 select-none before:content-[''] before:absolute before:-left-3 before:top-1/2 before:w-3 before:h-px before:bg-slate-200 dark:before:bg-slate-800">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                          Chưa có file hỗ trợ liên kết
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SUPPORTED FILE SECTION */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            Supported File
            <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded", supportedFiles.length >= SUPPORTED_FILE_LIMIT ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
              {supportedFiles.length}/{SUPPORTED_FILE_LIMIT}
            </span>
          </h4>

          <div className="space-y-2.5">
            {supportedFiles.length > 0 ? (
              supportedFiles.map((sf) => (
                <div 
                  key={sf.id}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-xl border shadow-sm transition-all group",
                    activeFileId === sf.id
                      ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-indigo-100 dark:shadow-none"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <div 
                    onClick={() => setActiveFileId(sf.id)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                        {sf.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {formatBytes(getItemBytes(creatorFiles.find(f => f.id === sf.id) || sf))}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setConfirmDelete({ type: 'support', id: sf.id })}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-505 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Xóa Supported File khỏi hệ thống"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Chưa có Supported File nào được tạo.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- MODAL 1: CREATE FILE --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                Tạo tệp câu hỏi mới
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* File Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Tên tệp tin
                </label>
                <input 
                  type="text" 
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder={newFileType === "QUIZ" ? "Nhập tên Quiz File..." : "Nhập tên Supported File..."}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* File Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  File Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => !(quizFiles.length >= QUIZ_FILE_LIMIT) && setNewFileType("QUIZ")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs transition-all",
                      quizFiles.length >= QUIZ_FILE_LIMIT
                        ? "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed"
                        : "cursor-pointer",
                      !(quizFiles.length >= QUIZ_FILE_LIMIT) && newFileType === "QUIZ"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "",
                      !(quizFiles.length >= QUIZ_FILE_LIMIT) && newFileType !== "QUIZ"
                        ? "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                        : ""
                    )}
                  >
                    Quiz File ({quizFiles.length}/{QUIZ_FILE_LIMIT})
                  </button>
                  <button
                    onClick={() => !(supportedFiles.length >= SUPPORTED_FILE_LIMIT) && setNewFileType("SUPPORT")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs transition-all",
                      supportedFiles.length >= SUPPORTED_FILE_LIMIT
                        ? "border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed"
                        : "cursor-pointer",
                      !(supportedFiles.length >= SUPPORTED_FILE_LIMIT) && newFileType === "SUPPORT"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "",
                      !(supportedFiles.length >= SUPPORTED_FILE_LIMIT) && newFileType !== "SUPPORT"
                        ? "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                        : ""
                    )}
                  >
                    Supported File ({supportedFiles.length}/{SUPPORTED_FILE_LIMIT})
                  </button>
                </div>
                {isStorageFull && (
                  <div className="text-[10px] text-red-500 font-bold">Đã đạt giới hạn dung lượng. Vui lòng xóa bớt file để tạo mới.</div>
                )}
                {!isStorageFull && ((newFileType === "QUIZ" && quizFiles.length >= QUIZ_FILE_LIMIT) || (newFileType === "SUPPORT" && supportedFiles.length >= SUPPORTED_FILE_LIMIT)) && (
                  <div className="text-[10px] text-red-500 font-bold">Đã đạt giới hạn số lượng. Vui lòng xóa bớt file để tạo mới.</div>
                )}
              </div>

              {/* File Data Option Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  File Data:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewFileDataOption("BLANK")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all",
                      newFileDataOption === "BLANK"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Dữ liệu trống
                  </button>
                  <button
                    onClick={() => setNewFileDataOption("IMPORT")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all",
                      newFileDataOption === "IMPORT"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Dữ liệu có sẵn
                  </button>
                </div>
              </div>

              {/* Sub-options khi chọn "Dữ liệu có sẵn" */}
              {newFileDataOption === "IMPORT" && (
                <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-indigo-900">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nguồn dữ liệu:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewFileImportSource("SOURCE")}
                      className={cn(
                        "p-2 rounded-xl border font-bold text-[10px] cursor-pointer transition-all",
                        newFileImportSource === "SOURCE"
                          ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      Chọn từ nguồn đã nhập
                    </button>
                    <button
                      onClick={() => setNewFileImportSource("FILE")}
                      className={cn(
                        "p-2 rounded-xl border font-bold text-[10px] cursor-pointer transition-all",
                        newFileImportSource === "FILE"
                          ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                          : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      Nhập file từ máy
                    </button>
                  </div>
                </div>
              )}

              {/* Data Selection Area depending on selected options */}
              {newFileDataOption === "BLANK" && (
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed select-none">
                  Tạo tệp rỗng không chứa câu hỏi. Bạn có thể thêm câu hỏi trực tiếp bằng trình soạn thảo ở cột giữa sau khi tệp được khởi tạo.
                </div>
              )}

              {newFileDataOption === "IMPORT" && newFileImportSource === "SOURCE" && (
                <div className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Danh sách nguồn khả dụng
                  </label>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {storeSources.length > 0 ? (
                      storeSources.map((src) => {
                        const displayName = getSourceDisplayName(src);
                        return (
                          <button
                            key={src.id}
                            onClick={() => setSelectedSourceId(src.id)}
                            className={cn(
                              "w-full p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer",
                              selectedSourceId === src.id
                                ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-750 dark:text-indigo-400"
                                : "border-slate-200 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350"
                            )}
                          >
                            <div className="flex items-center justify-between min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className="truncate">{displayName}</div>
                                <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                  {formatBytes(getItemBytes(src))}
                                </div>
                              </div>
                              {selectedSourceId === src.id && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 ml-2" />}
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Chưa có nguồn dữ liệu nào. Vui lòng nhập file từ phần cài đặt.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {newFileDataOption === "IMPORT" && newFileImportSource === "FILE" && (
                <div 
                  onClick={() => !isParsing && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center w-full",
                    isParsing 
                      ? "border-indigo-300 bg-indigo-50/10 dark:bg-indigo-950/10 cursor-wait"
                      : "border-slate-200 dark:border-slate-800 hover:border-indigo-500/55 cursor-pointer bg-slate-50/20 hover:bg-indigo-50/5 group/drop"
                  )}
                >
                  <input 
                    type="file" 
                    accept=".txt,.json,.docx,.pdf,image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileInputChange} 
                    className="hidden" 
                    disabled={isParsing}
                  />
                  {isParsing ? (
                    <div className="flex flex-col items-center py-2">
                      <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 animate-pulse">
                        {parseStatus || "Đang xử lý tệp..."}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 group-hover/drop:text-indigo-650 transition-colors mb-2" />
                      <span className="text-xs font-extrabold text-slate-750 dark:text-slate-300">
                        {importedData ? `Đã nạp: ${newFileNameInput}` : "Tải tệp từ thiết bị của bạn"}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {importedData ? `${importedData.questions.length} câu hỏi được tìm thấy` : "Hỗ trợ .txt, .docx, .pdf, .json, hình ảnh"}
                      </span>
                    </>
                  )}
                </div>
              )}

            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2.5">
              <button 
                onClick={() => !isParsing && setIsCreateModalOpen(false)}
                disabled={isParsing}
                className={cn(
                  "flex-1 py-2.5 border rounded-xl font-bold text-xs transition-all",
                  isParsing
                    ? "border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed bg-slate-50/50"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                )}
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateFile}
                disabled={isStorageFull || isParsing || (newFileType === "QUIZ" && quizFiles.length >= QUIZ_FILE_LIMIT) || (newFileType === "SUPPORT" && supportedFiles.length >= SUPPORTED_FILE_LIMIT)}
                className={cn(
                  "flex-1 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all",
                  isStorageFull || isParsing || (newFileType === "QUIZ" && quizFiles.length >= QUIZ_FILE_LIMIT) || (newFileType === "SUPPORT" && supportedFiles.length >= SUPPORTED_FILE_LIMIT)
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                    : "bg-indigo-650 hover:bg-indigo-750 text-white cursor-pointer"
                )}
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD SUPPORTED FILES LINK --- */}
      {isAddSupportModalOpen && targetQuizFileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
                  Supported Files
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 font-bold">
                  Chọn các file hỗ trợ liên kết với: {quizFiles.find(q => q.id === targetQuizFileId)?.name}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsAddSupportModalOpen(false);
                  setTargetQuizFileId(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Checkbox List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {supportedFiles.length > 0 ? (
                supportedFiles.map((sf) => {
                  const isChecked = !!selectedSupportFileIds[sf.id];
                  return (
                    <label 
                      key={sf.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        isChecked 
                          ? "border-indigo-500 bg-indigo-50/10 text-indigo-750 dark:text-indigo-400" 
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="text-xs font-bold truncate">{sf.name}</span>
                      </div>
                      
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedSupportFileIds(prev => ({
                            ...prev,
                            [sf.id]: !prev[sf.id]
                          }));
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      />
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Không tìm thấy Supported File nào khả dụng trong hệ thống. Hãy tạo Supported File trước.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2.5">
              <button 
                onClick={() => {
                  setIsAddSupportModalOpen(false);
                  setTargetQuizFileId(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleAddSupportFiles}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Add File
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Xác nhận xóa
              </h3>
              <button
                onClick={() => setConfirmDelete(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800 dark:text-slate-200">
                {confirmDelete.type === 'quiz'
                  ? creatorFiles.find(f => f.id === confirmDelete.id)?.name
                  : creatorFiles.find(f => f.id === confirmDelete.id)?.name}
              </span>?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'quiz') {
                    deleteQuizFile(confirmDelete.id);
                  } else {
                    deleteSupportFileGlobal(confirmDelete.id);
                  }
                  setConfirmDelete(null);
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
