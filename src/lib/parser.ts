import mammoth from "mammoth";
import { 
  Option, 
  DisplayBlock, 
  Question, 
  LearningPackage, 
  ParseResult, 
  parseQuizText, 
  parseQuizJson 
} from "./parserCore";

// Re-export all parser interfaces and core pure functions for compatibility across components
export type { Option, DisplayBlock, Question, LearningPackage, ParseResult };
export { parseQuizText, parseQuizJson };

export function isQuestionCorrect(q: Question, answer: string[] | undefined): boolean {
  if (!answer || answer.length === 0) return false;
  const correctIds = q.correctOptionIds;
  if (correctIds.length !== answer.length) return false;
  const setCorrect = new Set(correctIds);
  return answer.every(id => setCorrect.has(id));
}

// Fallback main thread parser if Web Worker fails or is unavailable (e.g. during testing/SSR)
async function parseFileMainThread(file: File): Promise<ParseResult> {
  try {
    if (file.name.endsWith(".json")) {
      const text = await file.text();
      return parseQuizJson(text);
    }

    let text = "";
    if (file.name.endsWith(".txt")) {
      text = await file.text();
    } else if (file.name.endsWith(".docx")) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } else {
      return { questions: [], isValid: false, error: "Định dạng file không được hỗ trợ. Vui lòng chọn file .txt, .docx hoặc .json" };
    }

    return parseQuizText(text, file.name.endsWith(".docx"));
  } catch (error) {
    console.error("Main thread fallback parsing failed:", error);
    return { questions: [], isValid: false, error: "Đã xảy ra lỗi khi đọc file." };
  }
}

/**
 * Offloads file reading and parsing onto a Web Worker thread.
 * Utilizes transferable ArrayBuffer transfer for zero-copy memory performance.
 * Falls back to main thread execution if Worker is unsupported or throws an initialization error.
 */
export async function parseFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined" || typeof Worker === "undefined") {
        console.warn("Workers not supported, using main thread parsing fallback");
        parseFileMainThread(file).then(resolve);
        return;
      }

      // Instantiate Web Worker with module support
      const worker = new Worker(new URL("./parser.worker.ts", import.meta.url), { type: "module" });

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === "success") {
          const result: ParseResult = e.data.result;
          if (result.isValid && !result.metadata) {
            result.metadata = {
              file_name: file.name,
              question_count: result.questions.length,
              last_modified: file.lastModified
            };
          }
          resolve(result);
        } else {
          resolve({ questions: [], isValid: false, error: e.data.error || "Lỗi phân tích tệp." });
        }
        worker.terminate();
      };

      worker.onerror = (err) => {
        console.error("Web Worker execution failed, falling back to main thread:", err);
        parseFileMainThread(file).then(resolve);
        worker.terminate();
      };

      // Read file content asynchronously as ArrayBuffer
      file.arrayBuffer().then((buffer) => {
        // Post message with transferable ArrayBuffer for zero-copy performance!
        worker.postMessage({
          fileContents: buffer,
          fileName: file.name
        }, [buffer]);
      }).catch((err) => {
        console.error("Failed to read file buffer, using main thread fallback:", err);
        parseFileMainThread(file).then(resolve);
        worker.terminate();
      });

    } catch (e) {
      console.error("Failed to instantiate Web Worker, using main thread fallback:", e);
      parseFileMainThread(file).then(resolve);
    }
  });
}
