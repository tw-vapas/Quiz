"use client";

import React from "react";
import FileManager from "./FileManager";
import QuestionModification from "./QuestionModification";
import SettingExport from "./SettingExport";

export default function CreateQuizSection() {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4 p-5 md:p-8 h-[calc(100vh-4rem)] min-h-0 overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Left Column: File Manager (1/4 width on desktop) */}
      <div className="lg:col-span-1 h-[400px] lg:h-full min-h-0">
        <FileManager />
      </div>

      {/* Middle Column: Question Modification (2/4 width on desktop) */}
      <div className="lg:col-span-2 h-[600px] lg:h-full min-h-0">
        <QuestionModification />
      </div>

      {/* Right Column: Setting & Export (1/4 width on desktop) */}
      <div className="lg:col-span-1 h-[450px] lg:h-full min-h-0">
        <SettingExport />
      </div>
    </div>
  );
}
