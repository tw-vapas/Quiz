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

export function parseQuizText(rawText: string, isDocx: boolean = false): ParseResult {
  const normalizedText = rawText.replace(/\[\\(\+|\?|\>|\=)\]/gi, (match, tag) => `[/${tag}]`);
  
  const questions: Question[] = [];
  const parts = normalizedText.split(/(Câu\s+\d+\s*:|\[\?\]\s*\[\s*(?:single_choice|multiple_choice)\s*\])/gi);
  
  if (parts.length < 3) {
    return { questions: [], isValid: false, error: "Không tìm thấy câu hỏi nào. Đảm bảo đúng định dạng 'Câu X:' hoặc '[?][type]'" };
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
      
      if (optionMatches.length === 0) {
        continue;
      }

      const firstOptionIndex = cleanedBlock.indexOf(optionMatches[0][0]);
      let rawQuestionText = cleanedBlock.substring(0, firstOptionIndex).trim();
      const câuPrefixMatch = rawQuestionText.match(/^Câu\s+\d+\s*:\s*([\s\S]*)/i);
      if (câuPrefixMatch) {
        rawQuestionText = câuPrefixMatch[1].trim();
      }

      if (taggedQuestion) {
        questionText = taggedQuestion.text;
        questionType = taggedQuestion.type;
      } else {
        questionText = rawQuestionText;
      }

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

      if (taggedQuestion) {
        questionType = taggedQuestion.type;
      } else {
        questionType = correctOptionIds.length > 1 ? "multiple_choice" : "single_choice";
      }
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

  if (questions.length === 0) {
    return { questions: [], isValid: false, error: "Không tìm thấy câu hỏi hoặc lựa chọn nào hợp lệ." };
  }

  const invalidQuestions = questions.filter(q => q.correctOptionIds.length === 0);
  if (invalidQuestions.length > 0) {
    return { questions, isValid: false, error: `Có ${invalidQuestions.length} câu thiếu đáp án đúng (dấu / hoặc [T])` };
  }

  return { questions, isValid: true };
}

export function parseQuizJson(rawText: string): ParseResult {
  try {
    const data = JSON.parse(rawText);
    if (!data || !Array.isArray(data.questions)) {
      return { questions: [], isValid: false, error: "Định dạng JSON không hợp lệ. Phải chứa danh sách 'questions'." };
    }

    const questions: Question[] = [];
    for (let index = 0; index < data.questions.length; index++) {
      const q = data.questions[index];
      const questionText = q.question !== undefined ? String(q.question) : (q.text !== undefined ? String(q.text) : "");
      if (!questionText) {
        return { questions: [], isValid: false, error: `Câu hỏi thứ ${index + 1} thiếu trường 'question' hoặc 'text'.` };
      }

      let options: Option[] = [];
      let correctOptionIds: string[] = [];

      if (Array.isArray(q.answers)) {
        options = q.answers.map((ans: any, optIdx: number) => {
          const id = ans.id ? String(ans.id) : Math.random().toString(36).substring(2, 9);
          return {
            id: id,
            text: ans.content ? String(ans.content) : "",
            originalText: `${String.fromCharCode(65 + optIdx)}. ${ans.content || ""}`
          };
        });

        q.answers.forEach((ans: any, optIdx: number) => {
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
            text: opt.text ? String(opt.text) : "",
            originalText: `${id}. ${opt.text || ""}`
          };
        });

        if (Array.isArray(q.correctOptionIds)) {
          correctOptionIds = q.correctOptionIds.map((ans: string | number) => String(ans));
        } else if (Array.isArray(q.correct_answer)) {
          correctOptionIds = q.correct_answer.map((ans: string | number) => String(ans));
        }
      } else {
        return { questions: [], isValid: false, error: `Câu hỏi thứ ${index + 1} thiếu hoặc rỗng danh sách 'options' hoặc 'answers'.` };
      }

      if (correctOptionIds.length === 0) {
        return { questions: [], isValid: false, error: `Câu hỏi thứ ${index + 1} thiếu đáp án đúng.` };
      }

      const optionIds = new Set(options.map(o => o.id));
      const invalidCorrect = correctOptionIds.filter((id: string) => !optionIds.has(id));
      if (invalidCorrect.length > 0) {
        return { questions: [], isValid: false, error: `Câu hỏi thứ ${index + 1} có đáp án đúng '${invalidCorrect.join(", ")}' không nằm trong danh sách options.` };
      }

      let tags: string[] = [];
      if (Array.isArray(q.tags)) {
        tags = q.tags
          .filter((t: any) => typeof t === "string")
          .map((t: string) => t.trim());
      }

      const display_block = q.display_block || null;
      const display_blocks: DisplayBlock[] = Array.isArray(q.display_blocks)
        ? q.display_blocks.map((db: any) => ({
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

    return {
      questions,
      isValid: true,
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
