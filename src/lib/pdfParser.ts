interface TextItem {
  str: string;
  x: number;
  y: number;
  height: number;
}

/**
 * Parses a PDF file and extracts text page by page.
 * Merges text fragments on the same line using their coordinates to preserve layout columns and inline choices.
 * Reports progress back to the caller.
 */
export async function parsePdfFile(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress("Đang khởi tạo bộ đọc PDF...");
  
  // Dynamically import pdfjs-dist only on the client-side to prevent SSR DOMMatrix undefined errors!
  const pdfjs = await import("pdfjs-dist");
  const pdfjsLib = ((pdfjs as Record<string, unknown>).default || pdfjs) as typeof import("pdfjs-dist");
  
  const PDFJS_VERSION = "4.4.168"; // Fallback version if version string is unavailable
  const pdfjsVersion = pdfjsLib.version || (pdfjs as Record<string, unknown>).version as string || PDFJS_VERSION;
  const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  
  let fullText = "";
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(`Đang trích xuất văn bản: Trang ${pageNum}/${numPages}...`);
    }
    
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const items: TextItem[] = [];
    
    for (const item of textContent.items) {
      if ("str" in item && "transform" in item) {
        const str = item.str;
        const transform = item.transform; // [scaleX, skewY, skewX, scaleY, transformX, transformY]
        const x = transform[4];
        const y = transform[5];
        const height = item.height || 0;
        
        items.push({ str, x, y, height });
      }
    }
    
    // Group text items by their Y coordinate (vertical lines)
    // We allow a small tolerance (e.g. 4 units) because characters might have slight vertical offsets
    const Y_TOLERANCE = 4;
    const linesMap: { yKey: number; items: TextItem[] }[] = [];
    
    for (const item of items) {
      // Find an existing line group within the Y tolerance
      const foundGroup = linesMap.find(g => Math.abs(g.yKey - item.y) <= Y_TOLERANCE);
      if (foundGroup) {
        foundGroup.items.push(item);
      } else {
        linesMap.push({ yKey: item.y, items: [item] });
      }
    }
    
    // Sort vertical lines descending (top of page has larger Y coordinates)
    linesMap.sort((a, b) => b.yKey - a.yKey);
    
    let pageText = "";
    
    for (const line of linesMap) {
      // Sort items on the same line horizontally from left to right (X coordinate ascending)
      line.items.sort((a, b) => a.x - b.x);
      
      let lineText = "";
      let prevXEnd = -1;
      
      for (const item of line.items) {
        // If there's a significant gap between elements, add a space to keep column separators
        if (prevXEnd !== -1 && item.x - prevXEnd > 4) {
          // If the item doesn't start with space and previous didn't end with space, inject one
          if (!lineText.endsWith(" ") && !item.str.startsWith(" ")) {
            lineText += " ";
          }
        }
        
        lineText += item.str;
        
        // Approximate the end coordinate of the current item: x + length of string * width approximation
        const estWidth = item.str.length * (item.height * 0.5);
        prevXEnd = item.x + estWidth;
      }
      
      // Filter out pure whitespace lines
      if (lineText.trim()) {
        pageText += lineText + "\n";
      }
    }
    
    fullText += pageText + "\n";
  }
  
  return fullText;
}
