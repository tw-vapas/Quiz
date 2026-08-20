import React, { useState } from "react";
import FileManager from "./FileManager";
import QuestionModification from "./QuestionModification";
import SettingExport from "./SettingExport";
import { FolderOpen, FileEdit, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateQuizSection() {
  // Shared filter states between QuestionModification (Column 2) and SettingExport (Column 3)
  const [filterType, setFilterType] = useState({
    singleChoice: true,
    multipleChoice: true
  });
  const [filterOthers, setFilterOthers] = useState({
    haveCorrectAnswer: false,
    haveExplanation: false,
    haveDisplayBlock: false
  });
  const [selectedTagsFilter, setSelectedTagsFilter] = useState<Record<string, boolean>>({});

  // Mobile active tab state
  const [mobileTab, setMobileTab] = useState<"files" | "editor" | "settings">("editor");

  return (
    <div className="flex-1 flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2.8fr)_minmax(0,1.1fr)] gap-3 md:gap-4 p-3 md:p-4 h-[calc(100vh-4rem)] min-h-0 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Mobile Tab Switcher (< md) */}
      <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0 md:hidden shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab("files")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            mobileTab === "files"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="truncate">Quản lý tệp</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            mobileTab === "editor"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span className="truncate">Biên soạn</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
            mobileTab === "settings"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="truncate">Xuất Bản</span>
        </button>
      </div>

      {/* Left Column: File Manager */}
      <div className={cn(
        "flex-1 min-h-0 min-w-0 md:h-full",
        mobileTab === "files" ? "block h-full" : "hidden md:block"
      )}>
        <FileManager />
      </div>

      {/* Middle Column: Question Modification */}
      <div className={cn(
        "flex-1 min-h-0 min-w-0 md:h-full",
        mobileTab === "editor" ? "block h-full" : "hidden md:block"
      )}>
        <QuestionModification 
          filterType={filterType}
          setFilterType={setFilterType}
          filterOthers={filterOthers}
          setFilterOthers={setFilterOthers}
          selectedTagsFilter={selectedTagsFilter}
          setSelectedTagsFilter={setSelectedTagsFilter}
        />
      </div>

      {/* Right Column: Setting & Export */}
      <div className={cn(
        "flex-1 min-h-0 min-w-0 md:h-full",
        mobileTab === "settings" ? "block h-full" : "hidden md:block"
      )}>
        <SettingExport 
          filterType={filterType}
          filterOthers={filterOthers}
          selectedTagsFilter={selectedTagsFilter}
        />
      </div>
    </div>
  );
}
