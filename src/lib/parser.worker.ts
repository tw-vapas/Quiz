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
      const resultDoc = await mammoth.extractRawText({ arrayBuffer: fileContents });
      const text = resultDoc.value;
      const result = parseQuizText(text, true);
      self.postMessage({ type: "success", result });
    } else {
      self.postMessage({ type: "error", error: "Định dạng tệp không được hỗ trợ." });
    }
  } catch (err) {
    self.postMessage({ type: "error", error: err instanceof Error ? err.message : String(err) });
  }
};
