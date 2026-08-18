"use client";

import React, { useState, useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { parseFile } from "@/lib/parser";
import { isFileValid } from "@/lib/sourceHelper";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  FileCode, 
  X,
  Upload,
  Check,
  FilePlus,
  Layers,
  Sparkles,
  FolderKanban
} from "lucide-react";
import { cn, STORAGE_LIMIT_BYTES, getQuizStorageUsedBytes, getQuizStorageUsedBytesExcept, getItemBytes, formatBytes } from "@/lib/utils";

export default function FileManager() {
  const FILE_LIMIT = 10;

  const creatorFiles = useQuizStore(state => state.creatorFiles);
  const activeFileId = useQuizStore(state => state.activeFileId);
  const setActiveFileId = useQuizStore(state => state.setActiveFileId);
  const createCreatorFile = useQuizStore(state => state.createCreatorFile);
  const deleteCreatorFile = useQuizStore(state => state.deleteCreatorFile);

  const [storageUsedBytes, setStorageUsedBytes] = useState(() => getQuizStorageUsedBytes());
  useEffect(() => {
    const id = setTimeout(() => setStorageUsedBytes(getQuizStorageUsedBytes()), 0);
    return () => clearTimeout(id);
  }, [creatorFiles]);
  
  const creatorFilesBytes = creatorFiles.reduce((sum, f) => sum + getItemBytes(f), 0);
  const storagePercent = Math.min(100, (storageUsedBytes / STORAGE_LIMIT_BYTES) * 100);
  const isStorageFull = storageUsedBytes >= STORAGE_LIMIT_BYTES;

  // Modal "+ Create File" States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileDataOption, setNewFileDataOption] = useState<"BLANK" | "IMPORT">("BLANK");
  const [newFileImportSource, setNewFileImportSource] = useState<"SOURCE" | "FILE">("SOURCE");
  const [selectedSourceIds, setSelectedSourceIds] = useState<Record<string, boolean>>({});
  const [newFileNameInput, setNewFileNameInput] = useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [importedData, setImportedData] = useState<{
    questions: any[];
    document: string;
    note: string;
  } | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState("");

  // Delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsParsing(true);
    setParseStatus("Đang đọc tệp tin...");
    
    try {
      const result = await parseFile(file, (status) => {
        setParseStatus(status);
      });
      
      if (result.questions && result.questions.length > 0) {
        // Estimate total localStorage bytes after adding this file
        const testNewFile = {
          id: "temp_test_id",
          name: file.name,
          document: result.document || "",
          note: result.note || "",
          questions: result.questions || [],
          metadata: {
            file_name: file.name,
            question_count: result.questions.length,
            last_modified: Date.now()
          }
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
        
        const missingCount = result.questions.filter(q => !q.correctOptionIds || q.correctOptionIds.length === 0).length;
        if (missingCount > 0) {
          useQuizStore.getState().showNotification(`Đã trích xuất ${result.questions.length} câu hỏi. Có ${missingCount} câu chưa có đáp án đúng, bạn có thể bổ sung trong File Manager.`, "info");
        } else {
          useQuizStore.getState().showNotification(`Đã trích xuất thành công ${result.questions.length} câu hỏi.`, "success");
        }
      } else {
        useQuizStore.getState().showNotification("Không tìm thấy câu hỏi nào trong tệp: " + (result.error || "Kiểm tra lại định dạng file."), "error");
      }
    } catch (err) {
      useQuizStore.getState().showNotification("Đã xảy ra lỗi khi đọc file.", "error");
    } finally {
      setIsParsing(false);
      setParseStatus("");
    }
  };

  const handleCreateFile = () => {
    const finalName = newFileNameInput.trim() || `Quiz File ${creatorFiles.length + 1}`;

    let initialData: any = { questions: [], document: "", note: "" };

    if (newFileDataOption === "IMPORT") {
      if (newFileImportSource === "SOURCE") {
        const selectedFiles = creatorFiles.filter(f => selectedSourceIds[f.id]);
        if (selectedFiles.length > 0) {
          let mergedQuestions: any[] = [];
          let mergedDocs: string[] = [];
          let mergedNotes: string[] = [];

          selectedFiles.forEach(f => {
            if (f.questions && f.questions.length > 0) {
              const qs = f.questions.map(q => ({
                ...q,
                id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                sourceId: f.id,
                sourceName: f.name
              }));
              mergedQuestions.push(...qs);
            }
            if (f.document) mergedDocs.push(f.document);
            if (f.note) mergedNotes.push(f.note);
          });

          initialData = {
            questions: mergedQuestions,
            document: mergedDocs.join("\n\n---\n\n"),
            note: mergedNotes.join("; ")
          };
        }
      } else if (newFileImportSource === "FILE" && importedData) {
        initialData = importedData;
      }
    }

    // Estimate total localStorage bytes
    const testNewFile = {
      id: "temp_test_id",
      name: finalName,
      document: initialData.document || "",
      note: initialData.note || "",
      questions: initialData.questions || [],
      metadata: {
        file_name: finalName,
        question_count: initialData.questions?.length || 0,
        last_modified: Date.now()
      }
    };

    const otherBytes = getQuizStorageUsedBytesExcept("vapas_quiz_creator_files");
    const estimatedNewFilesStr = JSON.stringify([...creatorFiles, testNewFile]);
    const estimatedNewFilesBytes = estimatedNewFilesStr.length * 2;
    const totalEstimatedBytes = otherBytes + estimatedNewFilesBytes;

    if (totalEstimatedBytes > STORAGE_LIMIT_BYTES) {
      useQuizStore.getState().showNotification("Không thể thêm file: Dung lượng file quá lớn và bộ nhớ lưu trữ đã đầy.", "error");
      return;
    }

    const newId = createCreatorFile(finalName, initialData);
    setActiveFileId(newId);

    // Reset Form & Close
    setNewFileNameInput("");
    setImportedData(null);
    setSelectedSourceIds({});
    setIsCreateModalOpen(false);
  };

  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all duration-300 shadow-sm relative">
      {/* 1. HEADER */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Quản lý tệp
          </h3>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          disabled={creatorFiles.length >= FILE_LIMIT || isStorageFull}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-extrabold text-xs transition-all",
            creatorFiles.length >= FILE_LIMIT || isStorageFull
              ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-50 cursor-not-allowed"
              : "border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:shadow-sm active:scale-95 cursor-pointer"
          )}
        >
          <Plus className="w-4 h-4" />
          Thêm tệp
        </button>
      </div>

      {/* Storage Bar (Unified Quiz File Storage) */}
      <div className="px-5 pb-3 shrink-0 space-y-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-slate-600 dark:text-slate-400">
            Bộ nhớ: <span className="font-mono text-slate-800 dark:text-slate-200 font-extrabold">{(storageUsedBytes / (1024 * 1024)).toFixed(2)} MB</span> / {(STORAGE_LIMIT_BYTES / (1024 * 1024)).toFixed(1)} MB
          </span>
          <span className={cn(
            "font-extrabold px-1.5 py-0.5 rounded text-[9px]",
            storagePercent >= 90 
              ? "bg-red-500/10 text-red-500" 
              : storagePercent >= 70 
                ? "bg-amber-500/10 text-amber-500" 
                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
          )}>
            {storagePercent >= 90 ? "Sắp đầy!" : `${storagePercent.toFixed(0)}%`}
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
            title={`Dung lượng tệp trắc nghiệm: ${(storageUsedBytes / (1024 * 1024)).toFixed(2)} MB`}
          />
        </div>

        {isStorageFull && (
          <div className="text-[10px] text-red-500 font-bold mt-1">
            Đã đạt giới hạn dung lượng. Vui lòng xóa bớt file để tạo mới.
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE FILES LIST */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between gap-2">
          <span>Danh sách tệp</span>
          <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded", creatorFiles.length >= FILE_LIMIT ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
            {creatorFiles.length}/{FILE_LIMIT}
          </span>
        </h4>

        <div className="space-y-2.5">
          {creatorFiles.length > 0 ? (
            creatorFiles.map((f) => {
              const isFileValidStatus = isFileValid(f);
              return (
                <div 
                  key={f.id}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-2xl border shadow-sm transition-all group relative",
                    isFileValidStatus 
                      ? (activeFileId === f.id 
                          ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/30 shadow-emerald-500/10 ring-1 ring-emerald-500/30" 
                          : "border-emerald-500/70 dark:border-emerald-500/50 bg-white dark:bg-slate-900 hover:border-emerald-500")
                      : (activeFileId === f.id 
                          ? "border-red-500 bg-red-50/20 dark:bg-red-950/30 shadow-red-500/10 ring-2 ring-red-500/20" 
                          : "border-red-500/80 dark:border-red-500/60 bg-red-50/10 dark:bg-red-950/10 hover:border-red-500")
                  )}
                >
                  <div 
                    onClick={() => setActiveFileId(f.id)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isFileValidStatus
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                    )}>
                      <FileCode className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                        {f.name}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block">
                        {f.questions?.length || 0} câu hỏi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                      {formatBytes(getItemBytes(f))}
                    </span>

                    <button 
                      onClick={() => setConfirmDeleteId(f.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      title="Xóa tệp trắc nghiệm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có tệp trắc nghiệm nào được tạo.
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL: CREATE FILE (REDESIGNED) --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col max-h-[90vh] overflow-hidden relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-850 dark:text-slate-100">
                    Tạo tệp câu hỏi mới
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Khởi tạo tệp trắc nghiệm trống hoặc nhập từ nhiều nguồn dữ liệu
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
              
              {/* File Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Tên tệp tin <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="Nhập tên tệp trắc nghiệm (vd: Đề thi Toán Học Phần 1)..."
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-750 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Data Mode Selection (Visual Card Selector Tiles) */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Phương thức khởi tạo dữ liệu
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewFileDataOption("BLANK")}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2 relative select-none",
                      newFileDataOption === "BLANK"
                        ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        newFileDataOption === "BLANK" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <FilePlus className="w-4 h-4" />
                      </div>
                      {newFileDataOption === "BLANK" && (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Dữ liệu trống</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Tạo tệp rỗng và biên soạn câu hỏi từ đầu
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setNewFileDataOption("IMPORT")}
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2 relative select-none",
                      newFileDataOption === "IMPORT"
                        ? "border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        newFileDataOption === "IMPORT" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <Layers className="w-4 h-4" />
                      </div>
                      {newFileDataOption === "IMPORT" && (
                        <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Nhập & Gộp dữ liệu</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        Nhập từ tệp tin hoặc gộp các Quiz File có sẵn
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-options for "IMPORT" mode */}
              {newFileDataOption === "IMPORT" && (
                <div className="space-y-3 p-4 rounded-2xl border border-indigo-150 dark:border-indigo-900/60 bg-indigo-50/15 dark:bg-indigo-950/15">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider block">
                      Nguồn câu hỏi nạp vào:
                    </label>
                  </div>
                  
                  {/* Switcher Pills */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewFileImportSource("SOURCE")}
                      className={cn(
                        "py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        newFileImportSource === "SOURCE"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Gộp từ File Manager</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewFileImportSource("FILE")}
                      className={cn(
                        "py-1.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        newFileImportSource === "FILE"
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Nhập tệp từ máy</span>
                    </button>
                  </div>

                  {/* Section 1: Gộp từ File Manager */}
                  {newFileImportSource === "SOURCE" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          Chọn các tệp để gộp câu hỏi:
                        </span>
                        {creatorFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const allSelected = creatorFiles.every(f => selectedSourceIds[f.id]);
                              const nextState: Record<string, boolean> = {};
                              if (!allSelected) {
                                creatorFiles.forEach(f => { nextState[f.id] = true; });
                              }
                              setSelectedSourceIds(nextState);
                            }}
                            className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            {creatorFiles.every(f => selectedSourceIds[f.id]) ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                        {creatorFiles.length > 0 ? (
                          creatorFiles.map((file) => {
                            const isChecked = !!selectedSourceIds[file.id];
                            const fileValid = isFileValid(file);
                            return (
                              <div
                                key={file.id}
                                onClick={() => toggleSourceSelection(file.id)}
                                className={cn(
                                  "w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between group",
                                  isChecked
                                    ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 shadow-sm"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSourceSelection(file.id)}
                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-bold">{file.name}</div>
                                    <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                      {formatBytes(getItemBytes(file))} • {file.questions?.length || 0} câu hỏi
                                    </div>
                                  </div>
                                </div>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ml-2 border",
                                  fileValid
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                                )}>
                                  {fileValid ? "✓ Hợp lệ" : "✕ Chưa hợp lệ"}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-xs text-slate-400 font-medium">
                            Chưa có Quiz File nào trong File Manager để gộp.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Tải tệp từ thiết bị */}
                  {newFileImportSource === "FILE" && (
                    <div 
                      onClick={() => !isParsing && fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center w-full min-h-[140px]",
                        isParsing 
                          ? "border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20 cursor-wait"
                          : "border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 cursor-pointer bg-white dark:bg-slate-900 hover:bg-indigo-50/10 group/drop shadow-sm"
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
                          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 animate-pulse">
                            {parseStatus || "Đang phân tích tệp tin..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover/drop:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {importedData ? `Đã nạp: ${newFileNameInput}` : "Kéo thả hoặc Nhấp để chọn tệp"}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                            {importedData ? `${importedData.questions.length} câu hỏi trắc nghiệm tìm thấy` : "Hỗ trợ định dạng .TXT, .DOCX, .PDF, .JSON và Hình ảnh"}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
              <button 
                type="button"
                onClick={() => !isParsing && setIsCreateModalOpen(false)}
                disabled={isParsing}
                className={cn(
                  "flex-1 py-2.5 border rounded-2xl font-bold text-xs transition-all cursor-pointer",
                  isParsing
                    ? "border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed bg-slate-50/50"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleCreateFile}
                disabled={isStorageFull || isParsing || creatorFiles.length >= FILE_LIMIT}
                className={cn(
                  "flex-1 py-2.5 font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  isStorageFull || isParsing || creatorFiles.length >= FILE_LIMIT
                    ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-98"
                )}
              >
                <Plus className="w-4 h-4" />
                <span>Khởi tạo Tệp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
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
              Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800 dark:text-slate-200">
                {creatorFiles.find(f => f.id === confirmDeleteId)?.name}
              </span>?
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
                  deleteCreatorFile(confirmDeleteId);
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
}
