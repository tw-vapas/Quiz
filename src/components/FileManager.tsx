"use client";

import React, { useState, useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { parseFile } from "@/lib/parser";
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  FileCode, 
  X,
  Upload,
  Check
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
            File Manager
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
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${storagePercent}%` }}
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
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          Quiz File
          <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded", creatorFiles.length >= FILE_LIMIT ? "bg-red-500/10 text-red-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
            {creatorFiles.length}/{FILE_LIMIT}
          </span>
        </h4>

        <div className="space-y-2.5">
          {creatorFiles.length > 0 ? (
            creatorFiles.map((f) => (
              <div 
                key={f.id}
                className={cn(
                  "flex items-center justify-between gap-2 p-3 rounded-xl border shadow-sm transition-all group",
                  activeFileId === f.id
                    ? "border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-indigo-100 dark:shadow-none"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div 
                  onClick={() => setActiveFileId(f.id)}
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center shrink-0">
                    <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">
                      {f.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {formatBytes(getItemBytes(f))} • {f.questions?.length || 0} câu hỏi
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setConfirmDeleteId(f.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Xóa Quiz File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Chưa có Quiz File nào được tạo.
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL: CREATE FILE --- */}
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
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              
              {/* File Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Tên tệp tin
                </label>
                <input 
                  type="text" 
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="Nhập tên Quiz File..."
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                <div className="space-y-2 pl-2 border-l-2 border-indigo-200 dark:border-indigo-900">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                      Chọn từ File Manager
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
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Danh sách nguồn khả dụng
                  </label>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                    {creatorFiles.length > 0 ? (
                      creatorFiles.map((file) => {
                        const isChecked = !!selectedSourceIds[file.id];
                        return (
                          <div
                            key={file.id}
                            onClick={() => toggleSourceSelection(file.id)}
                            className={cn(
                              "w-full p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between",
                              isChecked
                                ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-750 dark:text-indigo-400"
                                : "border-slate-200 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate">{file.name}</div>
                              <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                                {formatBytes(getItemBytes(file))} • {file.questions?.length || 0} câu hỏi
                              </div>
                            </div>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSourceSelection(file.id)}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer shrink-0 ml-2"
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Chưa có Quiz File nào trong File Manager.
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
                disabled={isStorageFull || isParsing || creatorFiles.length >= FILE_LIMIT}
                className={cn(
                  "flex-1 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all",
                  isStorageFull || isParsing || creatorFiles.length >= FILE_LIMIT
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
