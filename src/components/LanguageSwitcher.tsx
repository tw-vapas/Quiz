"use client";

import React from "react";
import { useTranslation, Locale } from "@/locales";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "button" | "select" | "pills";
  className?: string;
}

export default function LanguageSwitcher({ variant = "pills", className }: LanguageSwitcherProps) {
  const { language, setLanguage } = useTranslation();

  const handleSelect = (lang: Locale) => {
    setLanguage(lang);
    try {
      localStorage.setItem("vapas_quiz_language", lang);
    } catch (e) {
      console.warn("Could not save language preference to localStorage", e);
    }
  };

  if (variant === "select") {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
        <select
          value={language}
          onChange={(e) => handleSelect(e.target.value as Locale)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0", className)}>
      <button
        type="button"
        onClick={() => handleSelect("vi")}
        className={cn(
          "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
          language === "vi"
            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        )}
        title="Tiếng Việt"
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => handleSelect("en")}
        className={cn(
          "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
          language === "en"
            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        )}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
