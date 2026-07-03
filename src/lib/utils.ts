import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: "bg-red-50 dark:bg-red-950/20", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-900/30" },
    { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-900/30" },
    { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/30" },
    { bg: "bg-green-50 dark:bg-green-950/20", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-900/30" },
    { bg: "bg-teal-50 dark:bg-teal-950/20", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200 dark:border-teal-900/30" },
    { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/30" },
    { bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-900/30" },
    { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-900/30" },
    { bg: "bg-pink-50 dark:bg-pink-950/20", text: "text-pink-700 dark:text-pink-400", border: "border-pink-200 dark:border-pink-900/30" },
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

import { useRef, useLayoutEffect } from "react";

export const STORAGE_LIMIT_BYTES = 4.5 * 1024 * 1024;

export function getQuizStorageUsedBytes(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("vapas_quiz_")) {
      total += localStorage.getItem(key)!.length * 2;
    }
  }
  return total;
}

export function getQuizStorageUsedBytesExcept(excludeKey: string): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("vapas_quiz_") && key !== excludeKey) {
      total += localStorage.getItem(key)!.length * 2;
    }
  }
  return total;
}

export function getQuizStorageUsedBytesByKey(key: string): number {
  const item = localStorage.getItem(key);
  return item ? item.length * 2 : 0;
}

export function getItemBytes(obj: unknown): number {
  try {
    return JSON.stringify(obj).length * 2;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function useRenderProfiler(componentName: string) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  const startTime = useRef(0);
  startTime.current = performance.now();

  useLayoutEffect(() => {
    const duration = performance.now() - startTime.current;
    console.log(`[Profiler] ${componentName} - Render #${renderCount.current} committed in ${duration.toFixed(2)}ms`);
  });
}
