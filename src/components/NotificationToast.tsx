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
              "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md relative overflow-hidden",
              notification.type === "success" && "bg-emerald-500/10 border-emerald-500/25 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300",
              notification.type === "error" && "bg-red-500/10 border-red-500/25 dark:bg-red-950/20 text-red-800 dark:text-red-300",
              notification.type === "info" && "bg-indigo-500/10 border-indigo-500/25 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300"
            )}
          >
            {/* Left Status Bar */}
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                notification.type === "success" && "bg-emerald-500",
                notification.type === "error" && "bg-red-500",
                notification.type === "info" && "bg-indigo-500"
              )}
            />

            {/* Icon */}
            <div className="shrink-0">
              {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {notification.type === "error" && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
              {notification.type === "info" && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </div>

            {/* Message */}
            <span className="flex-1 text-xs font-black leading-relaxed">
              {notification.message}
            </span>

            {/* Close Button */}
            <button
              onClick={clearNotification}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-500 dark:text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
