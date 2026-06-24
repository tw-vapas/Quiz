import { SourceFile } from "@/store/quizStore";

/**
 * Returns the display name of a source file according to the priority:
 * 1. metadata.file_name
 * 2. customName
 * 3. name (original file name)
 */
export function getSourceDisplayName(source: SourceFile): string {
  return source.metadata?.file_name || source.customName || source.name;
}
