import { SourceFile } from "@/store/quizStore";

/**
 * Returns the display name of a source file according to the priority:
 * 1. customName (user-defined name)
 * 2. metadata.file_name (from .json package)
 * 3. name (original file name)
 */
export function getSourceDisplayName(source: SourceFile): string {
  return source.customName || source.metadata?.file_name || source.name;
}
