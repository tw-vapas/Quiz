import mammoth from "mammoth";
import { parseQuizText, parseQuizJson } from "./parserCore";

self.onmessage = async (e: MessageEvent) => {
  const { fileContents, fileName } = e.data;
  try {
    if (fileName.endsWith(".json")) {
      const text = new TextDecoder("utf-8").decode(fileContents);
      const result = parseQuizJson(text);
      self.postMessage({ type: "success", result });
    } else if (fileName.endsWith(".txt")) {
      const text = new TextDecoder("utf-8").decode(fileContents);
      const result = parseQuizText(text, false);
      self.postMessage({ type: "success", result });
    } else if (fileName.endsWith(".docx")) {
      const resultDoc = await mammoth.convertToHtml({ arrayBuffer: fileContents });
      let html = resultDoc.value;
      html = html.replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n");
      html = html.replace(/<br\s*\/?>/gi, "\n");
      html = html.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, "**$2**");
      html = html.replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, "__$2__");
      const text = html.replace(/<[^>]+>/g, " ").split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n");
      const result = parseQuizText(text, true);
      self.postMessage({ type: "success", result });
    } else {
      self.postMessage({ type: "error", error: "Định dạng tệp không được hỗ trợ." });
    }
  } catch (err) {
    self.postMessage({ type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};
