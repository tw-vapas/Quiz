import { SourceFile, CreatorFile } from "@/store/quizStore";
import { Question } from "@/lib/parser";

/**
 * Returns the display name of a source file according to the priority:
 * 1. customName (user-defined name)
 * 2. metadata.file_name (from .json package)
 * 3. name (original file name)
 */
export function getSourceDisplayName(source: SourceFile): string {
  return source.customName || source.metadata?.file_name || source.name;
}

/**
 * Checks if a single question is valid
 */
export function isQuestionValid(q: Question): boolean {
  if (!q || !q.text || q.text.trim().length === 0) return false;
  if (!Array.isArray(q.options) || q.options.length === 0) return false;
  const hasEmptyOption = q.options.some(opt => !opt.text || opt.text.trim().length === 0);
  if (hasEmptyOption) return false;
  if (!Array.isArray(q.correctOptionIds) || q.correctOptionIds.length === 0) return false;
  const optionIds = new Set(q.options.map(o => o.id));
  return q.correctOptionIds.every(id => optionIds.has(id));
}

/**
 * Checks if a CreatorFile or SourceFile is valid (contains questions and all are valid)
 */
export function isFileValid(f: { questions?: Question[] }): boolean {
  if (!f.questions || f.questions.length === 0) return false;
  return f.questions.every(isQuestionValid);
}
