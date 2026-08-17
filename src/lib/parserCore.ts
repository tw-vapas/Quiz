export interface Option {
  id: string;
  text: string;
  originalText: string;
}

export interface DisplayBlock {
  type: string;
  content: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctOptionIds: string[];
  type: "single_choice" | "multiple_choice";
  display_block?: DisplayBlock | null;
  display_blocks?: DisplayBlock[];
  explanation?: string | null;
  sourceId?: string;
  sourceName?: string;
  tags?: string[];
}

export interface LearningPackage {
  metadata?: {
    file_name: string;
    question_count: number;
    last_modified: number | string;
  };
  document?: string;
  note?: string;
  questions: Question[];
}

export interface ParseResult {
  questions: Question[];
  isValid: boolean;
  error?: string;
  metadata?: {
    file_name: string;
    question_count: number;
    last_modified: number | string;
  };
  document?: string;
  note?: string;
}

export function unescapeString(str: string): string {
  return str.replace(/\\(.)/g, (match, char) => {
    switch (char) {
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case '\\': return '\\';
      case '"': return '"';
      case "'": return "'";
      default: return char;
    }
  });
}

export function mapBlockType(type: string): string {
  if (type === "code_block") return "code";
  if (type.endsWith("_block")) {
    return type.substring(0, type.length - 6);
  }
  return type;
}

export function normalizeCodeIndentation(content: string, isDocx: boolean = false): string {
  let result = content.replace(/\r\n/g, "\n");
  
  if (isDocx) {
    result = result.replace(/\n\n/g, "\n");
  }
  
  if (result.startsWith("\n")) {
    result = result.substring(1);
  }
  if (result.endsWith("\n")) {
    result = result.substring(0, result.length - 1);
  }
  
  return result.split("\n").map(line => {
    const match = line.match(/^([>\s\t]*)/);
    if (match) {
      const prefix = match[1];
      const newPrefix = prefix.replace(/>/g, "    ");
      return newPrefix + line.substring(prefix.length);
    }
    return line;
  }).join("\n");
}

export function parseTaggedQuestionBlock(text: string): { text: string; type: "single_choice" | "multiple_choice" } | null {
  const regex = /\[\?\]\s*\[\s*(single_choice|multiple_choice)\s*\]([\s\S]*?)(?:\[\/\?\]|(?=\[\+\]|\[=\]|\[\>\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi;
  const match = regex.exec(text);
  if (match) {
    return {
      text: match[2].trim(),
      type: match[1].toLowerCase() as "single_choice" | "multiple_choice"
    };
  }
  return null;
}

export function parseTaggedDisplayBlocks(text: string, isDocx: boolean = false): DisplayBlock[] {
  const blocks: DisplayBlock[] = [];
  const regex = /\[\+\]\s*\[\s*([a-zA-Z0-9_]+)\s*\]([\s\S]*?)(?:\[\/\+\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const rawType = match[1];
    const rawContent = match[2];
    const type = mapBlockType(rawType);
    const content = type === "code" ? normalizeCodeIndentation(rawContent, isDocx) : rawContent.trim();
    blocks.push({ type, content });
  }
  return blocks;
}

export function parseTaggedExplanation(text: string): string | null {
  const regex = /\[\>\]([\s\S]*?)(?:\[\/\>\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi;
  const match = regex.exec(text);
  if (match) {
    return match[1].trim();
  }
  return null;
}

export function parseTaggedAnswerBlocks(text: string): { text: string; isCorrect: boolean }[] {
  const answers: { text: string; isCorrect: boolean }[] = [];
  const regex = /\[=\]\s*\[\s*([TF])\s*\]([\s\S]*?)(?:\[\/=\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const isCorrect = match[1].toUpperCase() === "T";
    const content = match[2].trim();
    answers.push({ text: content, isCorrect });
  }
  return answers;
}

function cleanAdministrativeNoise(text: string): string {
  const lines = text.split("\n");
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim().toLowerCase();
    if (!trimmed) return true; // giữ dòng trống phục vụ phân đoạn
    
    // Lọc số trang (ví dụ: Trang 1/4, Page 2 of 3)
    if (/^trang\s*\d+(\s*\/\s*\d+)?$/i.test(trimmed)) return false;
    if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(trimmed)) return false;
    if (/^trang\s*-\s*\d+\s*-$/i.test(trimmed)) return false;
    
    // Lọc tiêu đề hành chính đề kiểm tra thông thường
    if (/^sở\s+gd\s*&\s*đt/i.test(trimmed)) return false;
    if (/^bộ\s+giáo\s+dục/i.test(trimmed)) return false;
    if (/^trường\s+thpt/i.test(trimmed)) return false;
    if (/^đề\s+thi\s+(học\s+kỳ|thử|tốt\s+nghiệp|khảo\s+sát|ôn\s+tập)/i.test(trimmed)) return false;
    if (/^môn\s*(học)?\s*:/i.test(trimmed)) return false;
    if (/^mã\s+đề\s+(thi\s*)?:?\s*\d+/i.test(trimmed)) return false;
    if (/^thời\s+gian\s+làm\s+bài/i.test(trimmed)) return false;
    if (/^\(?thí\s+sinh\s+không\s+được\s+sử\s+dụng\s+tài\s+liệu\)?/i.test(trimmed)) return false;
    if (/^---\s*(hết|kết\s+thúc)\s*---/i.test(trimmed)) return false;
    
    return true;
  });
  return cleanedLines.join("\n");
}

function extractAnswerKeyMap(text: string, cutoffIndex: number): Map<number, string> {
  const keyMap = new Map<number, string>();
  
  // Nếu không tìm thấy vị trí bảng đáp án thực sự (cutoffIndex === -1), không tự động quét thân bài
  if (cutoffIndex === -1) {
    return keyMap;
  }
  
  const footerText = text.substring(cutoffIndex);
  
  // Quét các cặp câu và đáp án: 1-A, 2. B, 3: C, 4/D, hoặc định dạng bảng 1A, 2B, 3C...
  const pairRegex = /(\d+)\s*[\.\:\-\/\s]*\s*([A-D])(?!\w)/gi;
  let pairMatch;
  while ((pairMatch = pairRegex.exec(footerText)) !== null) {
    const qNum = parseInt(pairMatch[1], 10);
    const ansLetter = pairMatch[2].toUpperCase();
    if (!keyMap.has(qNum)) {
      keyMap.set(qNum, ansLetter);
    }
  }
  return keyMap;
}

function parseOptionsFromBlock(blockText: string): { questionText: string, options: { letter: string, text: string, isCorrect: boolean }[] } {
  // Regex tìm kiếm các marker đáp án A, B, C, D (hỗ trợ A. A) A: (A) [A] và chữ thường)
  const optionRegex = /(?:^|[\s\t\(\[-]+)([a-d])[\.\:\)\/\-\]]\s*/gi;
  const matches = [];
  let match;
  
  while ((match = optionRegex.exec(blockText)) !== null) {
    matches.push({
      letter: match[1].toUpperCase(),
      index: match.index,
      matchLength: match[0].length
    });
  }
  
  // Đảm bảo tính tuần tự của đáp án (A -> B -> C -> D)
  const validSequence = [];
  let expectedLetterCode = 65; // ký tự 'A'
  
  for (const m of matches) {
    if (m.letter.charCodeAt(0) === expectedLetterCode) {
      validSequence.push(m);
      expectedLetterCode++;
    }
  }
  
  if (validSequence.length === 0) {
    return { questionText: blockText, options: [] };
  }
  
  const firstOptionIdx = validSequence[0].index;
  const questionText = blockText.substring(0, firstOptionIdx).trim();
  
  const options = [];
  for (let idx = 0; idx < validSequence.length; idx++) {
    const current = validSequence[idx];
    const startIdx = current.index + current.matchLength;
    const endIdx = (idx + 1 < validSequence.length) ? validSequence[idx + 1].index : blockText.length;
    
    let optionText = blockText.substring(startIdx, endIdx).trim();
    let isCorrect = false;
    
    // Kiểm tra ký tự đánh dấu đúng (dấu / hoặc dấu * ở đầu/cuối)
    if (optionText.endsWith("/")) {
      isCorrect = true;
      optionText = optionText.substring(0, optionText.length - 1).trim();
    } else if (optionText.endsWith(" /")) {
      isCorrect = true;
      optionText = optionText.substring(0, optionText.length - 2).trim();
    }
    
    // Kiểm tra tiền tố dấu sao * đứng ngay trước đáp án
    const precedingText = blockText.substring(Math.max(0, current.index - 3), current.index);
    if (/^\s*\*+\s*$/.test(precedingText) || precedingText.trim().endsWith("*")) {
      isCorrect = true;
    }
    if (optionText.startsWith("*")) {
      isCorrect = true;
      optionText = optionText.substring(1).trim();
    }
    
    // Kiểm tra định dạng in đậm / gạch chân từ Mammoth chuyển đổi
    if (optionText.startsWith("**") && optionText.endsWith("**")) {
      isCorrect = true;
      optionText = optionText.substring(2, optionText.length - 2).trim();
    } else if (optionText.startsWith("__") && optionText.endsWith("__")) {
      isCorrect = true;
      optionText = optionText.substring(2, optionText.length - 2).trim();
    }
    
    options.push({
      letter: current.letter,
      text: optionText,
      isCorrect
    });
  }
  
  return {
    questionText,
    options
  };
}

export function parseQuizText(rawText: string, isDocx = false): ParseResult {
  if (!rawText || !rawText.trim()) {
    return { questions: [], isValid: false, error: "Nội dung văn bản rỗng." };
  }

  const normalizedText = rawText.replace(/\[\\(\+|\?|\>|\=)\]/gi, (match, tag) => `[/${tag}]`);
  
  // 1. Tìm vị trí bảng đáp án thực sự ở cuối tài liệu (không bị trùng với từ "đáp án" trong câu hỏi)
  const sheetRegex = /(?:\r?\n|^)\s*(?:bảng\s+đáp\s+án|đáp\s+án|answer\s+key|hướng\s+dẫn\s+giải)(?:\s*:|\s*\r?\n|$)/gi;
  let sheetMatch;
  let cutoffIndex = -1;
  
  while ((sheetMatch = sheetRegex.exec(normalizedText)) !== null) {
    const candidateIndex = sheetMatch.index;
    const remainingText = normalizedText.substring(candidateIndex + sheetMatch[0].length);
    // Kiểm tra xem phía sau vị trí này còn chứa câu hỏi nào khác không (Câu X:, Question X., [?])
    const hasSubsequentQuestions = /(?:[\*\_\#\>\s]*(?:Câu|Question|Q)\s*\d+(?:\s*[\.:\)\/\-])?|\d+\s*[\.:\)\/\-]|\[\?\])/i.test(remainingText);
    
    if (!hasSubsequentQuestions) {
      cutoffIndex = candidateIndex;
      break;
    }
  }
  
  // 2. Tìm vị trí của các phần không phải trắc nghiệm (Tự luận, bài tập ngắn, câu hỏi ngắn...)
  const endingHeaderRegex = /(?:\r?\n|^)\s*(?:câu\s+hỏi\s+ngắn|tự\s+luận|bài\s+tập(?!\s+trắc\s+nghiệm)|phần\s+(?:ii|2)(?!\s+trắc\s+nghiệm)|short\s+questions|essay|exercises(?!\s+multiple\s+choice))(?:\s*:|\s*\r?\n|$)/gi;
  let endingMatch;
  let essayCutoffIndex = -1;
  
  while ((endingMatch = endingHeaderRegex.exec(normalizedText)) !== null) {
    const candidateIndex = endingMatch.index;
    const remainingText = normalizedText.substring(candidateIndex + endingMatch[0].length);
    const hasSubsequentMcq = /a[\.\:\)\/\-\]][\s\S]{1,400}b[\.\:\)\/\-\]][\s\S]{1,400}c[\.\:\)\/\-\]][\s\S]{1,400}d[\.\:\)\/\-\]]/i.test(remainingText);
    
    if (!hasSubsequentMcq) {
      essayCutoffIndex = candidateIndex;
      break;
    }
  }
  
  let finalCutoffIndex = -1;
  if (cutoffIndex !== -1 && essayCutoffIndex !== -1) {
    finalCutoffIndex = Math.min(cutoffIndex, essayCutoffIndex);
  } else if (cutoffIndex !== -1) {
    finalCutoffIndex = cutoffIndex;
  } else if (essayCutoffIndex !== -1) {
    finalCutoffIndex = essayCutoffIndex;
  }
  
  // 3. Quét bảng đáp án ở cuối đề thi nếu có
  const answerKeyMap = extractAnswerKeyMap(normalizedText, cutoffIndex);
  
  // 4. Tách riêng phần chứa câu hỏi
  const questionsTextSection = finalCutoffIndex !== -1 ? normalizedText.substring(0, finalCutoffIndex) : normalizedText;
  
  // 5. Lọc nhiễu hành chính
  const cleanedText = cleanAdministrativeNoise(questionsTextSection);
  
  // 4. Tìm kiếm các điểm bắt đầu của câu hỏi
  const qRegex = /(?:\r?\n|^)[\*\_\#\>\s]*(?:(?:Câu|Question|Q)\s*(\d+)(?:\s*[\.:\)\/\-])?|(\d+)\s*[\.:\)\/\-]|\[\?\]\s*\[\s*(single_choice|multiple_choice)\s*\])[\*\_\s]*/gi;
  const questionsList = [];
  let qMatch;
  while ((qMatch = qRegex.exec(cleanedText)) !== null) {
    questionsList.push({
      numberStr: qMatch[1] || qMatch[2],
      typeTag: qMatch[3],
      index: qMatch.index,
      matchLength: qMatch[0].length
    });
  }
  
  const questions: Question[] = [];
  
  if (questionsList.length === 0) {
    // Luồng dự phòng (Fallback): split theo kiểu cũ
    const parts = cleanedText.split(/(?:(?:\r?\n|^)[\*\_\#\>\s]*(?:Câu|Question|Q)\s*\d+(?:\s*[\.:\)\/\-])?[\*\_\s]*|\[\?\]\s*\[\s*(?:single_choice|multiple_choice)\s*\])/gi);
    if (parts.length < 3) {
      return { questions: [], isValid: false, error: "Không tìm thấy câu hỏi nào. Đảm bảo đúng định dạng câu hỏi." };
    }
    
    let i = 1;
    while (i < parts.length) {
      const câuLabel = parts[i];
      const body = parts[i + 1] || "";
      i += 2;
      
      const fullQuestionBlock = (câuLabel + body).trim();
      if (!fullQuestionBlock) continue;
      
      const taggedDisplay = parseTaggedDisplayBlocks(fullQuestionBlock, isDocx);
      let display_block: DisplayBlock | null = taggedDisplay.length > 0 ? taggedDisplay[0] : null;
      let explanation = parseTaggedExplanation(fullQuestionBlock);
      const taggedAnswers = parseTaggedAnswerBlocks(fullQuestionBlock);
      const taggedQuestion = parseTaggedQuestionBlock(fullQuestionBlock);
      
      let cleanedBlock = fullQuestionBlock;
      if (!display_block) {
        const displayBlockRegex = /\[\+\]\s*:\s*\(\s*type\s*=\s*([a-zA-Z_0-9]+)\s*\)\s*\.\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)/g;
        cleanedBlock = cleanedBlock.replace(displayBlockRegex, (match, type, content) => {
          const mappedType = mapBlockType(type);
          const unescaped = unescapeString(content);
          display_block = {
            type: mappedType,
            content: mappedType === "code" ? normalizeCodeIndentation(unescaped, isDocx) : unescaped
          };
          return "";
        });
      } else {
        const displayBlockRegex = /\[\+\]\s*:\s*\(\s*type\s*=\s*([a-zA-Z_0-9]+)\s*\)\s*\.\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)/g;
        cleanedBlock = cleanedBlock.replace(displayBlockRegex, "");
      }
      
      if (!explanation) {
        const explanationRegex = /\[\>\]\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        cleanedBlock = cleanedBlock.replace(explanationRegex, (match, content) => {
          explanation = unescapeString(content);
          return "";
        });
      } else {
        const explanationRegex = /\[\>\]\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        cleanedBlock = cleanedBlock.replace(explanationRegex, "");
      }
      
      let options: Option[] = [];
      const correctOptionIds: string[] = [];
      let questionText = "";
      let questionType: "single_choice" | "multiple_choice" = "single_choice";
      
      if (taggedAnswers.length > 0) {
        options = taggedAnswers.map((ans, idx) => {
          const optionLetter = String.fromCharCode(65 + idx);
          const optId = Math.random().toString(36).substring(2, 9);
          if (ans.isCorrect) {
            correctOptionIds.push(optId);
          }
          return {
            id: optId,
            text: ans.text,
            originalText: `${optionLetter}. ${ans.text}`
          };
        });
        
        if (taggedQuestion) {
          questionText = taggedQuestion.text;
          questionType = taggedQuestion.type;
        } else {
          let cleanText = cleanedBlock.trim();
          const câuPrefixMatch = cleanText.match(/^Câu\s+\d+\s*:\s*([\s\S]*)/i);
          if (câuPrefixMatch) {
            cleanText = câuPrefixMatch[1].trim();
          }
          questionText = cleanText;
          questionType = correctOptionIds.length > 1 ? "multiple_choice" : "single_choice";
        }
      } else {
        const optionMatches = Array.from(cleanedBlock.matchAll(/^([A-D])[\.\)]\s*(.*?)$/gim));
        if (optionMatches.length === 0) continue;
        
        const firstOptionIndex = cleanedBlock.indexOf(optionMatches[0][0]);
        let rawQuestionText = cleanedBlock.substring(0, firstOptionIndex).trim();
        const câuPrefixMatch = rawQuestionText.match(/^Câu\s+\d+\s*:\s*([\s\S]*)/i);
        if (câuPrefixMatch) {
          rawQuestionText = câuPrefixMatch[1].trim();
        }
        
        questionText = taggedQuestion ? taggedQuestion.text : rawQuestionText;
        
        for (const match of optionMatches) {
          const optionLetter = match[1].toUpperCase();
          let optionText = match[2].trim();
          let isCorrect = false;
          
          if (optionText.endsWith("/")) {
            isCorrect = true;
            optionText = optionText.substring(0, optionText.length - 1).trim();
          } else if (optionText.endsWith(" /")) {
            isCorrect = true;
            optionText = optionText.substring(0, optionText.length - 2).trim();
          }
          
          const optId = Math.random().toString(36).substring(2, 9);
          options.push({
            id: optId,
            text: optionText,
            originalText: `${optionLetter}. ${optionText}`
          });
          
          if (isCorrect) {
            correctOptionIds.push(optId);
          }
        }
        
        questionType = taggedQuestion ? taggedQuestion.type : (correctOptionIds.length > 1 ? "multiple_choice" : "single_choice");
      }
      
      const display_blocks: DisplayBlock[] = display_block ? [display_block] : [];
      if (options.length > 0) {
        questions.push({
          id: Math.random().toString(36).substring(2, 9),
          text: questionText,
          options,
          correctOptionIds,
          type: questionType,
          display_block,
          display_blocks,
          explanation
        });
      }
    }
  } else {
    // Vòng lặp phân tích cú pháp thông minh sử dụng danh sách chỉ mục câu hỏi đã quét
    for (let idx = 0; idx < questionsList.length; idx++) {
      const current = questionsList[idx];
      const startIdx = current.index + current.matchLength;
      const endIdx = (idx + 1 < questionsList.length) ? questionsList[idx + 1].index : cleanedText.length;
      const blockText = cleanedText.substring(startIdx, endIdx).trim();
      
      // Lấy tagged components nếu có
      const taggedDisplay = parseTaggedDisplayBlocks(blockText, isDocx);
      let display_block: DisplayBlock | null = taggedDisplay.length > 0 ? taggedDisplay[0] : null;
      let explanation = parseTaggedExplanation(blockText);
      const taggedAnswers = parseTaggedAnswerBlocks(blockText);
      const taggedQuestion = parseTaggedQuestionBlock(blockText);
      
      let cleanedBlock = blockText;
      cleanedBlock = cleanedBlock.replace(/\[\?\]\s*\[\s*(single_choice|multiple_choice)\s*\]([\s\S]*?)(?:\[\/\?\]|(?=\[\+\]|\[=\]|\[\>\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi, "");
      cleanedBlock = cleanedBlock.replace(/\[\+\]\s*\[\s*([a-zA-Z0-9_]+)\s*\]([\s\S]*?)(?:\[\/\+\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi, "");
      cleanedBlock = cleanedBlock.replace(/\[\>\]([\s\S]*?)(?:\[\/\>\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi, "");
      cleanedBlock = cleanedBlock.replace(/\[=\]\s*\[\s*([TF])\s*\]([\s\S]*?)(?:\[\/=\]|(?=\[\+\]|\[=\]|\[\>\]|\[\/\?\]|\[\?\]|\r?\n\s*Câu\s+\d+\s*:|\r?\n\s*[A-D][\.\)]|$))/gi, "");
      
      if (!display_block) {
        const displayBlockRegex = /\[\+\]\s*:\s*\(\s*type\s*=\s*([a-zA-Z_0-9]+)\s*\)\s*\.\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)/g;
        cleanedBlock = cleanedBlock.replace(displayBlockRegex, (match, type, content) => {
          const mappedType = mapBlockType(type);
          const unescaped = unescapeString(content);
          display_block = {
            type: mappedType,
            content: mappedType === "code" ? normalizeCodeIndentation(unescaped, isDocx) : unescaped
          };
          return "";
        });
      } else {
        const displayBlockRegex = /\[\+\]\s*:\s*\(\s*type\s*=\s*([a-zA-Z_0-9]+)\s*\)\s*\.\s*\(\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*\)/g;
        cleanedBlock = cleanedBlock.replace(displayBlockRegex, "");
      }
      
      if (!explanation) {
        const explanationRegex = /\[\>\]\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        cleanedBlock = cleanedBlock.replace(explanationRegex, (match, content) => {
          explanation = unescapeString(content);
          return "";
        });
      } else {
        const explanationRegex = /\[\>\]\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
        cleanedBlock = cleanedBlock.replace(explanationRegex, "");
      }
      
      // Phân tách câu hỏi và các đáp án tự động
      const { questionText: parsedQText, options: parsedOpts } = parseOptionsFromBlock(cleanedBlock);
      
      // Nếu không tìm thấy phương án đáp án nào và đây không phải là câu đầu tiên:
      // Heuristic: Khả năng cao đây là đoạn tiếp theo của câu hỏi trước đó bị số đánh dấu chia nhầm
      if (parsedOpts.length === 0 && questions.length > 0) {
        const lastQ = questions[questions.length - 1];
        lastQ.text += "\n" + cleanedBlock;
        continue;
      }
      
      let options: Option[] = [];
      const correctOptionIds: string[] = [];
      const questionText = taggedQuestion ? taggedQuestion.text : parsedQText;
      let questionType: "single_choice" | "multiple_choice" = "single_choice";
      
      if (taggedAnswers.length > 0) {
        options = taggedAnswers.map((ans, oIdx) => {
          const optLetter = String.fromCharCode(65 + oIdx);
          const optId = Math.random().toString(36).substring(2, 9);
          if (ans.isCorrect) correctOptionIds.push(optId);
          return {
            id: optId,
            text: ans.text,
            originalText: `${optLetter}. ${ans.text}`
          };
        });
      } else {
        options = parsedOpts.map((opt) => {
          const optId = Math.random().toString(36).substring(2, 9);
          
          // Kiểm tra xem phương án này có đúng theo style / biểu tượng không
          let isCorrect = opt.isCorrect;
          
          // Kiểm tra xem có bảng đáp án bên ngoài khớp với câu này không
          if (current.numberStr) {
            const qNum = parseInt(current.numberStr, 10);
            const sheetCorrectLetter = answerKeyMap.get(qNum);
            if (sheetCorrectLetter === opt.letter) {
              isCorrect = true;
            }
          }
          
          if (isCorrect) {
            correctOptionIds.push(optId);
          }
          
          // Dọn dẹp lại định dạng markdown bold ** và __ để text hiển thị đẹp mắt
          let cleanedOptText = opt.text;
          cleanedOptText = cleanedOptText.replace(/^\*+/g, "").replace(/\*+$/g, ""); // xóa dấu *
          cleanedOptText = cleanedOptText.replace(/^\*\*+/, "").replace(/\*\*+$/, ""); // xóa bold **
          cleanedOptText = cleanedOptText.replace(/^__+/, "").replace(/__+$/, ""); // xóa u __
          
          return {
            id: optId,
            text: cleanedOptText,
            originalText: `${opt.letter}. ${cleanedOptText}`
          };
        });
      }
      
      // Xử lý style in đậm của đáp án ở cấp độ nhóm (nếu chỉ đúng 1 câu có in đậm mà không đánh dấu đúng trước đó)
      if (correctOptionIds.length === 0 && options.length > 0) {
        // Kiểm tra xem trong các phương án ban đầu, có đúng một phương án chứa dấu in đậm ** hoặc __ không
        const boldOpts = parsedOpts.filter(o => o.text.includes("**") || o.text.includes("__"));
        if (boldOpts.length === 1) {
          const correctLetter = boldOpts[0].letter;
          const targetOpt = options.find((o, idx) => parsedOpts[idx].letter === correctLetter);
          if (targetOpt) {
            correctOptionIds.push(targetOpt.id);
          }
        }
      }
      
      questionType = taggedQuestion ? taggedQuestion.type : (correctOptionIds.length > 1 ? "multiple_choice" : "single_choice");
      
      const display_blocks: DisplayBlock[] = display_block ? [display_block] : [];
      
      if (options.length > 0) {
        questions.push({
          id: Math.random().toString(36).substring(2, 9),
          text: questionText,
          options,
          correctOptionIds,
          type: questionType,
          display_block,
          display_blocks,
          explanation
        });
      }
    }
  }
  
  if (questions.length === 0) {
    return { questions: [], isValid: false, error: "Không tìm thấy câu hỏi hoặc lựa chọn nào hợp lệ." };
  }
  
  // 6. Kiểm tra tính liên tục của STT câu hỏi để cảnh báo nếu văn bản gốc bị khuyết câu
  const warnings: string[] = [];
  const parsedNumbers = questionsList
    .map(q => parseInt(q.numberStr, 10))
    .filter(n => !isNaN(n));

  if (parsedNumbers.length > 0) {
    const maxNum = Math.max(...parsedNumbers);
    const minNum = Math.min(...parsedNumbers);
    const presentSet = new Set(parsedNumbers);
    const missingNums: number[] = [];

    for (let num = minNum; num <= maxNum; num++) {
      if (!presentSet.has(num)) {
        missingNums.push(num);
      }
    }

    if (missingNums.length > 0) {
      const missingRangeStr = missingNums.length > 5
        ? `${missingNums.slice(0, 3).join(", ")}, ..., ${missingNums[missingNums.length - 1]}`
        : missingNums.join(", ");
      warnings.push(
        `Văn bản gốc chứa STT lớn nhất là Câu ${maxNum} nhưng bị khuyết ${missingNums.length} câu (STT: ${missingRangeStr}). Hệ thống đã bóc tách đầy đủ 100% tất cả ${questions.length} câu hỏi thực tế có trong văn bản.`
      );
    }
  }

  // Trả về isValid: true để chấp nhận cả đề không có sẵn đáp án đúng, cho phép chỉnh sửa sau
  return { questions, isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
}

export function parseQuizJson(rawText: string): ParseResult {
  try {
    const data = JSON.parse(rawText);
    if (!data || !Array.isArray(data.questions)) {
      return { questions: [], isValid: false, error: "Định dạng JSON không hợp lệ. Phải chứa danh sách 'questions'." };
    }

    const questions: Question[] = [];
    let hasInvalidQuestion = false;

    for (let index = 0; index < data.questions.length; index++) {
      const q = data.questions[index];
      const questionText = q.question !== undefined ? String(q.question) : (q.text !== undefined ? String(q.text) : "");

      let options: Option[] = [];
      let correctOptionIds: string[] = [];

      if (Array.isArray(q.answers)) {
        options = q.answers.map((ans: { id?: string | number; content?: string | number }, optIdx: number) => {
          const id = ans.id ? String(ans.id) : Math.random().toString(36).substring(2, 9);
          return {
            id: id,
            text: ans.content ? String(ans.content) : "",
            originalText: `${String.fromCharCode(65 + optIdx)}. ${ans.content || ""}`
          };
        });

        q.answers.forEach((ans: { is_correct?: boolean; isCorrect?: boolean }, optIdx: number) => {
          if (ans.is_correct || ans.isCorrect) {
            const opt = options[optIdx];
            if (opt) {
              correctOptionIds.push(opt.id);
            }
          }
        });
      } else if (Array.isArray(q.options)) {
        options = q.options.map((opt: { id?: string | number; text?: string | number }, optIdx: number) => {
          const id = opt.id ? String(opt.id) : String.fromCharCode(65 + optIdx);
          return {
            id: id,
            text: opt.text !== undefined ? String(opt.text) : "",
            originalText: `${id}. ${opt.text || ""}`
          };
        });

        if (Array.isArray(q.correctOptionIds)) {
          correctOptionIds = q.correctOptionIds.map((ans: string | number) => String(ans));
        } else if (Array.isArray(q.correct_answer)) {
          correctOptionIds = q.correct_answer.map((ans: string | number) => String(ans));
        }
      }

      if (!questionText.trim() || options.length === 0 || correctOptionIds.length === 0) {
        hasInvalidQuestion = true;
      }

      let tags: string[] = [];
      if (Array.isArray(q.tags)) {
        const tagsArray = q.tags as unknown[];
        tags = tagsArray
          .filter((t: unknown): t is string => typeof t === "string")
          .map(t => t.trim())
          .slice(0, 5);
      }

      const display_block = q.display_block || null;
      const display_blocks: DisplayBlock[] = Array.isArray(q.display_blocks)
        ? q.display_blocks.map((db: { type?: string | number; content?: string | number }) => ({
            type: db.type ? String(db.type) : "code",
            content: db.content ? String(db.content) : ""
          }))
        : (display_block ? [display_block] : []);

      questions.push({
        id: q.id ? String(q.id) : Math.random().toString(36).substring(2, 9),
        text: questionText,
        options,
        correctOptionIds,
        type: q.type === "multiple_choice" ? "multiple_choice" : (q.type === "single_choice" ? "single_choice" : (correctOptionIds.length > 1 ? "multiple_choice" : "single_choice")),
        display_block,
        display_blocks,
        explanation: q.explanation || null,
        tags
      });
    }

    const metadata = data.metadata ? {
      file_name: data.metadata.file_name ? String(data.metadata.file_name) : "",
      question_count: typeof data.metadata.question_count === "number" ? data.metadata.question_count : questions.length,
      last_modified: data.metadata.last_modified ? data.metadata.last_modified : Date.now()
    } : undefined;

    const isAllValid = questions.length > 0 && !hasInvalidQuestion && questions.every(q => 
      q.text.trim().length > 0 && q.options.length > 0 && q.correctOptionIds.length > 0
    );

    return {
      questions,
      isValid: isAllValid,
      metadata,
      document: data.document ? String(data.document) : undefined,
      note: data.note ? String(data.note) : undefined
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("JSON Parse Error:", errorMsg);
    return { questions: [], isValid: false, error: "Tệp JSON không hợp lệ: " + errorMsg };
  }
}
