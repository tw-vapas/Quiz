"use client";

import React, { useEffect } from "react";
import { useQuizStore } from "@/store/quizStore";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationToast() {
  const notification = useQuizStore((state) => state.notification);
  const clearNotification = useQuizStore((state) => state.clearNotification);

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      clearNotification();
    }, 4000);

    return () => clearTimeout(timer);
  }, [notification, clearNotification]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full px-4"
        >
          <div
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 shadow-2xl relative overflow-hidden bg-white dark:bg-slate-900 transition-all duration-200",
              notification.type === "success" && "border-emerald-500 text-slate-900 dark:text-slate-100",
              notification.type === "error" && "border-red-500 text-slate-900 dark:text-slate-100",
              notification.type === "info" && "border-indigo-500 text-slate-900 dark:text-slate-100"
            )}
          >
            {/* Left Status Bar */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                notification.type === "success" && "bg-emerald-500",
                notification.type === "error" && "bg-red-500",
                notification.type === "info" && "bg-indigo-500"
              )}
            />

            {/* Icon */}
            <div className="shrink-0 ml-1">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {notification.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {notification.type === "info" && <Info className="w-5 h-5 text-indigo-500" />}
            </div>

            {/* Message */}
            <span className="flex-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {notification.message}
            </span>

            {/* Close Button */}
            <button
              onClick={clearNotification}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
