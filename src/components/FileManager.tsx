"use client";

import React, { useState } from "react";
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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportedFileItem {
  id: string;
  name: string;
}

interface QuizFileItem {
  id: string;
  name: string;
  supportedFiles: SupportedFileItem[];
}

export default function FileManager() {
  // --- MOCK DATA ---
  const [quizFiles, setQuizFiles] = useState<QuizFileItem[]>([
    {
      id: "qf1",
      name: "Quiz File 1",
      supportedFiles: [
        { id: "sf1", name: "Supported File 1" },
        { id: "sf2", name: "Supported File 2" }
      ]
    },
    {
      id: "qf2",
      name: "Quiz File 2",
      supportedFiles: [
        { id: "sf3", name: "Supported File 3" }
      ]
    }
  ]);

  const [supportedFiles, setSupportedFiles] = useState<SupportedFileItem[]>([
    { id: "sf1", name: "Supported File 1" },
    { id: "sf2", name: "Supported File 2" },
    { id: "sf3", name: "Supported File 3" }
  ]);

  const mockAvailableSources = [
    "Source 1 (Giải tích 1.txt)",
    "Source 2 (Vật lý đại cương.json)",
    "Source 3 (Hóa học hữu cơ.docx)",
    "Source 4 (Triết học Mác-Lênin.txt)"
  ];

  // --- INTERACTIVE STATES ---
  const [expandedQuizFiles, setExpandedQuizFiles] = useState<Record<string, boolean>>({
    qf1: true,
    qf2: true
  });

  // Modal "+ Create File" States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileType, setNewFileType] = useState<"QUIZ" | "SUPPORT">("QUIZ");
  const [newFileDataMode, setNewFileDataMode] = useState<"SOURCE" | "BLANK" | "IMPORT">("SOURCE");
  const [selectedSource, setSelectedSource] = useState(mockAvailableSources[0]);
  const [newFileNameInput, setNewFileNameInput] = useState("");

  // Modal "+ Add Supported Files" States
  const [isAddSupportModalOpen, setIsAddSupportModalOpen] = useState(false);
  const [targetQuizFileId, setTargetQuizFileId] = useState<string | null>(null);
  const [selectedSupportFileIds, setSelectedSupportFileIds] = useState<Record<string, boolean>>({});

  // Sync effect simulator state
  const [syncingFileId, setSyncingFileId] = useState<string | null>(null);

  // --- ACTIONS ---
  const toggleQuizExpand = (id: string) => {
    setExpandedQuizFiles(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFile = () => {
    const finalName = newFileNameInput.trim() || (
      newFileType === "QUIZ" 
        ? `Quiz File ${quizFiles.length + 1}` 
        : `Supported File ${supportedFiles.length + 1}`
    );

    if (newFileType === "QUIZ") {
      const newQuiz: QuizFileItem = {
        id: `qf_${Date.now()}`,
        name: finalName,
        supportedFiles: []
      };
      setQuizFiles(prev => [...prev, newQuiz]);
    } else {
      const newSupport: SupportedFileItem = {
        id: `sf_${Date.now()}`,
        name: finalName
      };
      setSupportedFiles(prev => [...prev, newSupport]);
    }

    // Reset Form & Close
    setNewFileNameInput("");
    setIsCreateModalOpen(false);
  };

  const openAddSupportModal = (quizFileId: string) => {
    setTargetQuizFileId(quizFileId);
    // Tiền tích chọn những file đã liên kết
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

    // Lấy các Supported File được tích chọn
    const selectedFiles = supportedFiles.filter(sf => selectedSupportFileIds[sf.id]);

    setQuizFiles(prev => prev.map(q => {
      if (q.id === targetQuizFileId) {
        return {
          ...q,
          supportedFiles: selectedFiles
        };
      }
      return q;
    }));

    setIsAddSupportModalOpen(false);
    setTargetQuizFileId(null);
  };

  const deleteQuizFile = (id: string) => {
    setQuizFiles(prev => prev.filter(q => q.id !== id));
  };

  const unlinkSupportFile = (quizId: string, supportId: string) => {
    setQuizFiles(prev => prev.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          supportedFiles: q.supportedFiles.filter(sf => sf.id !== supportId)
        };
      }
      return q;
    }));
  };

  const deleteSupportFileGlobal = (id: string) => {
    // 1. Xóa khỏi danh sách Support Files chung
    setSupportedFiles(prev => prev.filter(sf => sf.id !== id));
    // 2. Xóa liên kết trong tất cả các Quiz Files
    setQuizFiles(prev => prev.map(q => ({
      ...q,
      supportedFiles: q.supportedFiles.filter(sf => sf.id !== id)
    })));
  };

  const simulateSync = (fileId: string) => {
    setSyncingFileId(fileId);
    setTimeout(() => {
      setSyncingFileId(null);
      alert("Đồng bộ câu hỏi trắc nghiệm từ Support File thành công!");
    }, 1000);
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 font-extrabold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create File
        </button>
      </div>

      {/* 2. SCROLLABLE FOLDERS LIST */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* QUIZ FILE ACCORDIONS */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Quiz File
          </h4>

          <div className="space-y-3">
            {quizFiles.map((qf) => {
              const isExpanded = expandedQuizFiles[qf.id];
              return (
                <div key={qf.id} className="space-y-1.5">
                  {/* Quiz File Node Row */}
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all group">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Arrow to Toggle Collapse */}
                      <button 
                        onClick={() => toggleQuizExpand(qf.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center shrink-0">
                        <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                        {qf.name}
                      </span>
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
                        onClick={() => deleteQuizFile(qf.id)}
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
                            className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/10 hover:border-slate-200 dark:hover:border-slate-800 transition-all group relative before:content-[''] before:absolute before:-left-3 before:top-1/2 before:w-3 before:h-px before:bg-slate-200 dark:before:bg-slate-800"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-650 dark:text-slate-350 truncate">
                                {sf.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {/* Sync Button */}
                              <button 
                                onClick={() => simulateSync(sf.id)}
                                className={cn(
                                  "p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-450 cursor-pointer transition-all",
                                  syncingFileId === sf.id && "animate-spin text-indigo-600 dark:text-indigo-400"
                                )}
                                title="Đồng bộ lại câu hỏi"
                              >
                                <RefreshCw className="w-3 h-3" />
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
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
            Supported File
          </h4>

          <div className="space-y-2.5">
            {supportedFiles.length > 0 ? (
              supportedFiles.map((sf) => (
                <div 
                  key={sf.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                      {sf.name}
                    </span>
                  </div>

                  <button 
                    onClick={() => deleteSupportFileGlobal(sf.id)}
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
                    onClick={() => setNewFileType("QUIZ")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all",
                      newFileType === "QUIZ"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                    )}
                  >
                    Quiz File
                  </button>
                  <button
                    onClick={() => setNewFileType("SUPPORT")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all",
                      newFileType === "SUPPORT"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850/50"
                    )}
                  >
                    Supported File
                  </button>
                </div>
              </div>

              {/* File Data Mode Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  File Data:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setNewFileDataMode("SOURCE")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-[10px] cursor-pointer transition-all",
                      newFileDataMode === "SOURCE"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Chọn nguồn
                  </button>
                  <button
                    onClick={() => setNewFileDataMode("BLANK")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-[10px] cursor-pointer transition-all",
                      newFileDataMode === "BLANK"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Tạo trống
                  </button>
                  <button
                    onClick={() => setNewFileDataMode("IMPORT")}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-[10px] cursor-pointer transition-all",
                      newFileDataMode === "IMPORT"
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-750 dark:text-indigo-400"
                        : "border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Import file
                  </button>
                </div>
              </div>

              {/* Data Selection Area depending on selected Data Mode */}
              {newFileDataMode === "SOURCE" && (
                <div className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Danh sách nguồn khả dụng
                  </label>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {mockAvailableSources.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSource(src)}
                        className={cn(
                          "w-full p-2 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between",
                          selectedSource === src
                            ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-750 dark:text-indigo-400"
                            : "border-slate-200 dark:border-slate-850 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350"
                        )}
                      >
                        <span className="truncate">{src}</span>
                        {selectedSource === src && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newFileDataMode === "BLANK" && (
                <div className="p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/20 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed select-none">
                  Tạo tệp rỗng không chứa câu hỏi. Bạn có thể thêm câu hỏi trực tiếp bằng trình soạn thảo ở cột giữa sau khi tệp được khởi tạo.
                </div>
              )}

              {newFileDataMode === "IMPORT" && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/55 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-55/20 hover:bg-indigo-500/5 group/drop flex flex-col items-center">
                  <Upload className="w-8 h-8 text-slate-400 group-hover/drop:text-indigo-600 transition-colors mb-2" />
                  <span className="text-xs font-extrabold text-slate-750 dark:text-slate-300">
                    Tải tệp từ thiết bị của bạn
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Hỗ trợ .txt, .docx, .json
                  </span>
                </div>
              )}

            </div>

            {/* Modal Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2.5">
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button 
                onClick={handleCreateFile}
                className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
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

    </div>
  );
}
