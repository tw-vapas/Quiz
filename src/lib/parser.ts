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
import { parsePdfFile } from "./pdfParser";
import { parseImageFile } from "./ocrParser";

export type { Option, DisplayBlock, Question, LearningPackage, ParseResult };
export { parseQuizText, parseQuizJson };

export function isQuestionCorrect(q: Question, answer: string[] | undefined): boolean {
  if (!answer || answer.length === 0) return false;
  const correctIds = q.correctOptionIds;
  if (correctIds.length !== answer.length) return false;
  const setCorrect = new Set(correctIds);
  return answer.every(id => setCorrect.has(id));
}

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
      const result = await mammoth.convertToHtml({ arrayBuffer });
      let html = result.value;
      html = html.replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n");
      html = html.replace(/<br\s*\/?>/gi, "\n");
      html = html.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
      html = html.replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, "__$2__");
      text = html.replace(/<[^>]+>/g, " ").split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n");
    } else {
      return { questions: [], isValid: false, error: "Định dạng file không được hỗ trợ. Vui lòng chọn file .txt, .docx, .pdf, .json hoặc hình ảnh." };
    }

    return parseQuizText(text, file.name.endsWith(".docx"));
  } catch (error) {
    console.error("Main thread fallback parsing failed:", error);
    return { questions: [], isValid: false, error: "Đã xảy ra lỗi khi đọc file." };
  }
}

export async function parseFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  
  // Route PDF files to PDF Parser
  if (name.endsWith(".pdf")) {
    try {
      const text = await parsePdfFile(file, onProgress);
      const result = parseQuizText(text, false);
      if (result.isValid && !result.metadata) {
        result.metadata = {
          file_name: file.name,
          question_count: result.questions.length,
          last_modified: file.lastModified
        };
      }
      return result;
    } catch (err) {
      console.error("PDF Parsing failed:", err);
      return { 
        questions: [], 
        isValid: false, 
        error: err instanceof Error ? err.message : "Không thể phân tích tệp PDF." 
      };
    }
  }
  
  // Route image files to Tesseract OCR
  if (/\.(png|jpe?g|webp|bmp|gif)$/i.test(name)) {
    try {
      const text = await parseImageFile(file, onProgress);
      const result = parseQuizText(text, false);
      if (result.isValid && !result.metadata) {
        result.metadata = {
          file_name: file.name,
          question_count: result.questions.length,
          last_modified: file.lastModified
        };
      }
      return result;
    } catch (err) {
      console.error("Image OCR failed:", err);
      return { 
        questions: [], 
        isValid: false, 
        error: err instanceof Error ? err.message : "Lỗi nhận dạng văn bản từ hình ảnh." 
      };
    }
  }
  
  // Route other files to Web Worker
  return new Promise((resolve) => {
    try {
      if (onProgress) onProgress("Đang phân tích tệp tin...");
      if (typeof window === "undefined" || typeof Worker === "undefined") {
        console.warn("Workers not supported, using main thread parsing fallback");
        parseFileMainThread(file).then(resolve);
        return;
      }

      const worker = new Worker(new URL("./parser.worker.ts", import.meta.url), { type: "module" });

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type === "success") {
          const result: ParseResult = e.data.result;
          if (!result.metadata) {
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

      file.arrayBuffer().then((buffer) => {
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
