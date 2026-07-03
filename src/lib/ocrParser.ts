import { createWorker } from "tesseract.js";

/**
 * Recognizes and extracts text from an image file (PNG, JPEG, etc.) using Tesseract.js.
 * Supports Vietnamese and English characters.
 * Reports progress back to the caller.
 */
export async function parseImageFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  
  try {
    if (onProgress) onProgress("Đang khởi tạo bộ máy nhận diện ký tự (OCR)...");
    
    // Create Tesseract worker and load Vietnamese ("vie") and English ("eng") languages.
    // In Tesseract.js v5, the worker is initialized with languages and options parameters.
    worker = await createWorker("vie+eng", 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m && m.status === "recognizing" && onProgress) {
          const progressPercent = Math.round(m.progress * 100);
          onProgress(`Đang quét hình ảnh: ${progressPercent}%...`);
        }
      }
    });
    
    if (onProgress) onProgress("Đang trích xuất chữ viết từ hình ảnh...");
    
    const { data: { text } } = await worker.recognize(imageUrl);
    
    return text;
  } catch (error) {
    console.error("Tesseract OCR execution failed:", error);
    throw new Error("Không thể nhận diện hình ảnh. Vui lòng thử lại hoặc sử dụng tệp văn bản.");
  } finally {
    if (worker) {
      await worker.terminate();
    }
    URL.revokeObjectURL(imageUrl);
  }
}
