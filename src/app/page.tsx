"use client";

import { useEffect, useState } from "react";
import { useQuizStore } from "@/store/quizStore";
import Sidebar from "@/components/Sidebar";
import StartScreen from "@/components/StartScreen";
import MainQuiz from "@/components/MainQuiz";
import ResultScreen from "@/components/ResultScreen";
import CreateQuizSection from "@/components/CreateQuizSection";
import NotificationToast from "@/components/NotificationToast";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const state = useQuizStore((state) => state.state);
  const theme = useQuizStore((state) => state.theme);
  const isSettingsOpen = useQuizStore((state) => state.isSettingsOpen);
  const activeSection = useQuizStore((state) => state.activeSection);
  const setActiveSection = useQuizStore((state) => state.setActiveSection);
  
  // Specific selectors to avoid full-store subscriptions causing unnecessary updates
  const sources = useQuizStore((state) => state.sources);
  const showResultAfterQuestion = useQuizStore((state) => state.showResultAfterQuestion);
  const autoNext = useQuizStore((state) => state.autoNext);
  const questionCountMode = useQuizStore((state) => state.questionCountMode);
  const customQuestionCount = useQuizStore((state) => state.customQuestionCount);
  const sourceAllocations = useQuizStore((state) => state.sourceAllocations);
  const timeLimitMode = useQuizStore((state) => state.timeLimitMode);
  const timeLimitMinutes = useQuizStore((state) => state.timeLimitMinutes);
  const creatorFiles = useQuizStore((state) => state.creatorFiles);
  const activeFileId = useQuizStore((state) => state.activeFileId);

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load settings and sources from localStorage on mount (client-side only to prevent SSR mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSources = localStorage.getItem("vapas_quiz_sources");
      const savedSettings = localStorage.getItem("vapas_quiz_settings");
      const savedCreatorFiles = localStorage.getItem("vapas_quiz_creator_files");
      const savedActiveFileId = localStorage.getItem("vapas_quiz_creator_active_id");
      if (savedSources) {
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
      if (savedCreatorFiles) {
        try {
          const parsed = JSON.parse(savedCreatorFiles);
          useQuizStore.setState({ creatorFiles: parsed });
        } catch (e) {
          console.error("Error loading creator files:", e);
        }
      }
      if (savedActiveFileId) {
        useQuizStore.setState({ activeFileId: savedActiveFileId });
      }
      setHasHydrated(true);
    }
  }, []);

  // Save sources to localStorage when they change, only after hydration is complete
  useEffect(() => {
    if (hasHydrated) {
      try {
        localStorage.setItem("vapas_quiz_sources", JSON.stringify(sources));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded when saving sources");
        }
      }
    }
  }, [sources, hasHydrated]);

  // Save creator files to localStorage when they change, only after hydration is complete
  useEffect(() => {
    if (hasHydrated) {
      try {
        localStorage.setItem("vapas_quiz_creator_files", JSON.stringify(creatorFiles));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded when saving creator files");
        }
      }
    }
  }, [creatorFiles, hasHydrated]);

  // Save active file ID to localStorage when it changes, only after hydration is complete
  useEffect(() => {
    if (hasHydrated) {
      try {
        localStorage.setItem("vapas_quiz_creator_active_id", activeFileId || "");
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded when saving active file ID");
        }
      }
    }
  }, [activeFileId, hasHydrated]);

  // Save settings to localStorage when they change, only after hydration is complete
  useEffect(() => {
    if (hasHydrated) {
      try {
        const settingsObj = {
          showResultAfterQuestion,
          autoNext,
          questionCountMode,
          customQuestionCount,
          sourceAllocations,
          theme,
          timeLimitMode,
          timeLimitMinutes,
        };
        localStorage.setItem("vapas_quiz_settings", JSON.stringify(settingsObj));
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.warn("localStorage quota exceeded when saving settings");
        }
      }
    }
  }, [
    showResultAfterQuestion,
    autoNext,
    questionCountMode,
    customQuestionCount,
    sourceAllocations,
    theme,
    timeLimitMode,
    timeLimitMinutes,
    hasHydrated
  ]);

  // We use suppressHydrationWarning in layout.tsx to handle mismatches

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300"
    )}>
      {state === "NOT_STARTED" && (
      <nav className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-2 shadow-sm">
        <div className="flex items-center">
          <div className="flex items-center justify-center gap-2 flex-1">
            <button
              onClick={() => setActiveSection("quiz")}
              className={cn(
                "min-h-11 px-4 rounded-xl text-sm font-bold transition-colors",
                activeSection === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Làm Quiz
            </button>
            <button
              onClick={() => setActiveSection("create")}
              className={cn(
                "min-h-11 px-4 rounded-xl text-sm font-bold transition-colors",
                activeSection === "create"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              Tạo Quiz
            </button>
          </div>
        </div>
      </nav>
      )}

      <main className="flex-1 flex flex-col relative overflow-y-auto md:overflow-hidden min-h-0">
        {activeSection === "quiz" && (
          <>
            {state === "NOT_STARTED" && <StartScreen />}
            {state === "IN_PROGRESS" && <MainQuiz />}
            {state === "COMPLETED" && <ResultScreen />}
          </>
        )}
        {activeSection === "create" && (
          <CreateQuizSection />
        )}
      </main>
      
      <AnimatePresence>
        {activeSection === "quiz" && state === "NOT_STARTED" && isSettingsOpen && (
          <motion.div 
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ willChange: "opacity" }}
            className="fixed inset-0 z-[60] bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-8"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ willChange: "transform, opacity" }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[100dvh] sm:h-[85vh] rounded-none sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative transition-colors duration-200"
            >
              <Sidebar />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <NotificationToast />
    </div>
  );
}
