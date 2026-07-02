import { create } from 'zustand';
import { Question, LearningPackage } from '../lib/parser';

export interface SourceFile extends LearningPackage {
  id: string;
  name: string;
  questionsCount: number;
  active: boolean;
  isValid: boolean;
  error?: string;
  customName?: string;
}

export interface CreatorFile {
  id: string;
  name: string;
  type: "QUIZ" | "SUPPORT";
  document: string;
  note: string;
  questions: Question[];
  metadata: {
    file_name: string;
    question_count: number;
    last_modified: number | string;
  };
  supportedFileIds: string[];
}

export type QuizState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface QuizStore {
  // Settings
  showResultAfterQuestion: boolean;
  autoNext: boolean;
  setShowResultAfterQuestion: (val: boolean) => void;
  setAutoNext: (val: boolean) => void;
  questionCountMode: 'ALL' | 'CUSTOM';
  customQuestionCount: number;
  setQuestionCountMode: (val: 'ALL' | 'CUSTOM') => void;
  setCustomQuestionCount: (val: number) => void;
  
  timeLimitMode: 'UNLIMITED' | 'LIMITED';
  timeLimitMinutes: number;
  setTimeLimitMode: (val: 'UNLIMITED' | 'LIMITED') => void;
  setTimeLimitMinutes: (val: number) => void;
  
  sourceAllocations: Record<string, number>;
  setSourceAllocations: (allocs: Record<string, number>) => void;
  
  theme: 'light' | 'dark';
  setTheme: (val: 'light' | 'dark') => void;
  
  isSettingsOpen: boolean;
  settingsOpenedAt: number | null;
  setSettingsOpen: (val: boolean) => void;

  // Selected Document Source
  selectedDocumentSourceId: string | null;
  setSelectedDocumentSourceId: (id: string | null) => void;

  // Sources
  sources: SourceFile[];
  addSource: (source: SourceFile) => void;
  toggleSource: (id: string) => void;
  removeSource: (id: string) => void;

  // Creator State
  creatorFiles: CreatorFile[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  createCreatorFile: (name: string, type: "QUIZ" | "SUPPORT", initialData?: Partial<CreatorFile>) => string;
  deleteCreatorFile: (id: string) => void;
  updateCreatorFile: (id: string, updates: Partial<CreatorFile>) => void;
  linkSupportFileToQuiz: (quizId: string, supportId: string) => void;
  unlinkSupportFileFromQuiz: (quizId: string, supportId: string) => void;
  syncQuestionsFromSupport: (quizId: string, supportId: string) => void;

  // Quiz execution
  state: QuizState;
  questions: Question[]; // Combined and shuffled
  currentIndex: number;
  answers: Record<string, string[]>; // questionId -> optionIds
  startTime: number | null;
  accumulatedTime: number;
  totalTime: number | null;
  isPaused: boolean;
  
  questionStartTime: number | null;
  questionAccumulatedTime: number;
  questionTimes: Record<string, number>;
  
  startQuiz: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  exitQuiz: () => void;
  submitQuizEarly: () => void;
  submitAnswer: (questionId: string, optionIds: string[]) => void;
  nextQuestion: () => void;
  retryQuiz: () => void;
  retryIncorrectQuestions: (incorrectIds: string[], addExtra: boolean, extraCount: number, extraMode: 'TIME' | 'RANDOM') => void;
  resetApp: () => void;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const initialCreatorFiles: CreatorFile[] = [
  {
    id: "sf1",
    name: "Supported File 1",
    type: "SUPPORT",
    document: "# Tài liệu Ôn tập Giải tích\n\nĐây là tài liệu hỗ trợ ôn tập về đạo hàm và tích phân lớp 12.",
    note: "Ghi chú cho tài liệu giải tích: tập trung ôn tập các công thức đạo hàm cơ bản.",
    questions: [
      {
        id: "q1",
        text: "Đạo hàm của hàm số y = x^2 là gì?",
        options: [
          { id: "a", text: "y' = 2x", originalText: "A. y' = 2x" },
          { id: "b", text: "y' = x", originalText: "B. y' = x" },
          { id: "c", text: "y' = 2", originalText: "C. y' = 2" },
          { id: "d", text: "y' = 0", originalText: "D. y' = 0" }
        ],
        correctOptionIds: ["a"],
        type: "single_choice",
        explanation: "Theo công thức đạo hàm cơ bản, (x^n)' = n * x^(n-1). Do đó (x^2)' = 2x.",
        tags: ["Giải tích", "Đạo hàm"]
      },
      {
        id: "q2",
        text: "Những hàm số nào sau đây đồng biến trên R?",
        options: [
          { id: "a", text: "y = x^3 + x", originalText: "A. y = x^3 + x" },
          { id: "b", text: "y = -x^3 - x", originalText: "B. y = -x^3 - x" },
          { id: "c", text: "y = x^2", originalText: "C. y = x^2" },
          { id: "d", text: "y = x^5 + 2x^3", originalText: "D. y = x^5 + 2x^3" }
        ],
        correctOptionIds: ["a", "d"],
        type: "multiple_choice",
        explanation: "Các hàm số y = x^3 + x và y = x^5 + 2x^3 có đạo hàm luôn dương trên R nên đồng biến trên R.",
        tags: ["Giải tích", "Hàm số"]
      }
    ],
    metadata: {
      file_name: "Supported File 1",
      question_count: 2,
      last_modified: "12:00 01/07/2026"
    },
    supportedFileIds: []
  },
  {
    id: "sf2",
    name: "Supported File 2",
    type: "SUPPORT",
    document: "# Tài liệu Ôn tập Hình học\n\nĐây là tài liệu hỗ trợ ôn tập về thể tích khối đa diện lớp 12.",
    note: "Ghi chú hình học: Nhớ công thức thể tích khối chóp và khối lăng trụ.",
    questions: [
      {
        id: "q3",
        text: "Thể tích V của khối chóp có diện tích đáy B và chiều cao h được tính theo công thức nào?",
        options: [
          { id: "a", text: "V = B * h", originalText: "A. V = B * h" },
          { id: "b", text: "V = 1/3 * B * h", originalText: "B. V = 1/3 * B * h" },
          { id: "c", text: "V = 3 * B * h", originalText: "C. V = 3 * B * h" },
          { id: "d", text: "V = 1/2 * B * h", originalText: "D. V = 1/2 * B * h" }
        ],
        correctOptionIds: ["b"],
        type: "single_choice",
        explanation: "Công thức thể tích khối chóp là V = 1/3 * đáy * chiều cao.",
        tags: ["Hình học", "Thể tích"]
      }
    ],
    metadata: {
      file_name: "Supported File 2",
      question_count: 1,
      last_modified: "12:00 01/07/2026"
    },
    supportedFileIds: []
  },
  {
    id: "sf3",
    name: "Supported File 3",
    type: "SUPPORT",
    document: "# Ôn tập tổ hợp và xác suất\n\nTài liệu ôn tập về chỉnh hợp, tổ hợp lớp 11.",
    note: "Nhớ phân biệt chỉnh hợp và tổ hợp.",
    questions: [
      {
        id: "q4",
        text: "Chọn 3 học sinh từ 10 học sinh đi trực nhật có bao nhiêu cách chọn?",
        options: [
          { id: "a", text: "C_10^3", originalText: "A. C_10^3" },
          { id: "b", text: "A_10^3", originalText: "B. A_10^3" },
          { id: "c", text: "10^3", originalText: "C. 10^3" },
          { id: "d", text: "30", originalText: "D. 30" }
        ],
        correctOptionIds: ["a"],
        type: "single_choice",
        explanation: "Vì không phân biệt thứ tự nhiệm vụ của 3 học sinh nên ta dùng tổ hợp C_10^3.",
        tags: ["Tổ hợp", "Xác suất"]
      }
    ],
    metadata: {
      file_name: "Supported File 3",
      question_count: 1,
      last_modified: "12:00 01/07/2026"
    },
    supportedFileIds: []
  },
  {
    id: "qf1",
    name: "Quiz File 1",
    type: "QUIZ",
    document: "# Đề kiểm tra tổng hợp Toán 12\n\nĐề kiểm tra bao gồm cả đạo hàm, tích phân và thể tích khối chóp.",
    note: "Đề thi dùng chung cho cả lớp học.",
    questions: [
      {
        id: "sf1_q1",
        text: "Đạo hàm của hàm số y = x^2 là gì?",
        options: [
          { id: "a", text: "y' = 2x", originalText: "A. y' = 2x" },
          { id: "b", text: "y' = x", originalText: "B. y' = x" },
          { id: "c", text: "y' = 2", originalText: "C. y' = 2" },
          { id: "d", text: "y' = 0", originalText: "D. y' = 0" }
        ],
        correctOptionIds: ["a"],
        type: "single_choice",
        explanation: "Theo công thức đạo hàm cơ bản, (x^n)' = n * x^(n-1). Do đó (x^2)' = 2x.",
        tags: ["Giải tích", "Đạo hàm"],
        sourceId: "sf1",
        sourceName: "Supported File 1"
      },
      {
        id: "sf1_q2",
        text: "Những hàm số nào sau đây đồng biến trên R?",
        options: [
          { id: "a", text: "y = x^3 + x", originalText: "A. y = x^3 + x" },
          { id: "b", text: "y = -x^3 - x", originalText: "B. y = -x^3 - x" },
          { id: "c", text: "y = x^2", originalText: "C. y = x^2" },
          { id: "d", text: "y = x^5 + 2x^3", originalText: "D. y = x^5 + 2x^3" }
        ],
        correctOptionIds: ["a", "d"],
        type: "multiple_choice",
        explanation: "Các hàm số y = x^3 + x và y = x^5 + 2x^3 có đạo hàm luôn dương trên R nên đồng biến trên R.",
        tags: ["Giải tích", "Hàm số"],
        sourceId: "sf1",
        sourceName: "Supported File 1"
      },
      {
        id: "sf2_q3",
        text: "Thể tích V của khối chóp có diện tích đáy B và chiều cao h được tính theo công thức nào?",
        options: [
          { id: "a", text: "V = B * h", originalText: "A. V = B * h" },
          { id: "b", text: "V = 1/3 * B * h", originalText: "B. V = 1/3 * B * h" },
          { id: "c", text: "V = 3 * B * h", originalText: "C. V = 3 * B * h" },
          { id: "d", text: "V = 1/2 * B * h", originalText: "D. V = 1/2 * B * h" }
        ],
        correctOptionIds: ["b"],
        type: "single_choice",
        explanation: "Công thức thể tích khối chóp là V = 1/3 * đáy * chiều cao.",
        tags: ["Hình học", "Thể tích"],
        sourceId: "sf2",
        sourceName: "Supported File 2"
      }
    ],
    metadata: {
      file_name: "Quiz File 1",
      question_count: 3,
      last_modified: "12:00 01/07/2026"
    },
    supportedFileIds: ["sf1", "sf2"]
  },
  {
    id: "qf2",
    name: "Quiz File 2",
    type: "QUIZ",
    document: "# Đề kiểm tra Đại số & Tổ hợp\n\nĐề thi thử lớp 11 phần tổ hợp xác suất.",
    note: "Đề thi dùng cho nhóm học tập nâng cao.",
    questions: [
      {
        id: "sf3_q4",
        text: "Chọn 3 học sinh từ 10 học sinh đi trực nhật có bao nhiêu cách chọn?",
        options: [
          { id: "a", text: "C_10^3", originalText: "A. C_10^3" },
          { id: "b", text: "A_10^3", originalText: "B. A_10^3" },
          { id: "c", text: "10^3", originalText: "C. 10^3" },
          { id: "d", text: "30", originalText: "D. 30" }
        ],
        correctOptionIds: ["a"],
        type: "single_choice",
        explanation: "Vì không phân biệt thứ tự nhiệm vụ của 3 học sinh nên ta dùng tổ hợp C_10^3.",
        tags: ["Tổ hợp", "Xác suất"],
        sourceId: "sf3",
        sourceName: "Supported File 3"
      }
    ],
    metadata: {
      file_name: "Quiz File 2",
      question_count: 1,
      last_modified: "12:00 01/07/2026"
    },
    supportedFileIds: ["sf3"]
  }
];

export const useQuizStore = create<QuizStore>((set, get) => ({
  showResultAfterQuestion: true,
  autoNext: false,
  setShowResultAfterQuestion: (val) => set({ showResultAfterQuestion: val }),
  setAutoNext: (val) => set({ autoNext: val }),
  questionCountMode: 'ALL',
  customQuestionCount: 10,
  setQuestionCountMode: (val) => set({ questionCountMode: val }),
  setCustomQuestionCount: (val) => set({ customQuestionCount: val }),
  
  timeLimitMode: 'UNLIMITED',
  timeLimitMinutes: 15,
  setTimeLimitMode: (val) => set({ timeLimitMode: val }),
  setTimeLimitMinutes: (val) => set({ timeLimitMinutes: val }),
  
  sourceAllocations: {},
  setSourceAllocations: (allocs) => set({ sourceAllocations: allocs }),
  
  theme: 'light',
  setTheme: (val) => set({ theme: val }),
  
  isSettingsOpen: false,
  settingsOpenedAt: null,
  setSettingsOpen: (val) => set({ 
    isSettingsOpen: val,
    settingsOpenedAt: val ? performance.now() : null
  }),

  selectedDocumentSourceId: null,
  setSelectedDocumentSourceId: (id) => set({ selectedDocumentSourceId: id }),

  sources: [],
  addSource: (source) => set((state) => ({ sources: [...state.sources, source] })),
  toggleSource: (id) => set((state) => ({
    sources: state.sources.map(s => s.id === id ? { ...s, active: !s.active } : s)
  })),
  removeSource: (id) => set((state) => ({
    sources: state.sources.filter(s => s.id !== id)
  })),

  // Creator State
  creatorFiles: initialCreatorFiles,
  activeFileId: "qf1",
  setActiveFileId: (id) => set({ activeFileId: id }),
  createCreatorFile: (name, type, initialData) => {
    const id = `${type === "QUIZ" ? "qf" : "sf"}_${Date.now()}`;
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(",", "");
    
    const newFile: CreatorFile = {
      id,
      name,
      type,
      document: initialData?.document || "",
      note: initialData?.note || "",
      questions: initialData?.questions || [],
      metadata: {
        file_name: initialData?.metadata?.file_name || name,
        question_count: initialData?.questions?.length || 0,
        last_modified: formattedTime,
        ...initialData?.metadata
      },
      supportedFileIds: initialData?.supportedFileIds || [],
      ...initialData
    };
    
    set((state) => ({
      creatorFiles: [...state.creatorFiles, newFile],
      activeFileId: id
    }));
    return id;
  },
  deleteCreatorFile: (id) => set((state) => {
    const newActiveId = state.activeFileId === id ? null : state.activeFileId;
    const updatedFiles = state.creatorFiles
      .filter((f) => f.id !== id)
      .map((f) => {
        if (f.type === "QUIZ" && f.supportedFileIds.includes(id)) {
          const remainingQuestions = f.questions.filter((q) => q.sourceId !== id);
          return {
            ...f,
            supportedFileIds: f.supportedFileIds.filter((sfId) => sfId !== id),
            questions: remainingQuestions,
            metadata: {
              ...f.metadata,
              question_count: remainingQuestions.length,
              last_modified: new Date().toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              }).replace(",", "")
            }
          };
        }
        return f;
      });
    return {
      creatorFiles: updatedFiles,
      activeFileId: newActiveId
    };
  }),
  updateCreatorFile: (id, updates) => set((state) => {
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(",", "");

    const updatedFiles = state.creatorFiles.map((f) => {
      if (f.id === id) {
        const questions = updates.questions !== undefined ? updates.questions : f.questions;
        const name = updates.name !== undefined ? updates.name : f.name;

        const updatedMetadata = {
          ...f.metadata,
          file_name: updates.metadata?.file_name || name,
          question_count: questions.length,
          last_modified: formattedTime,
          ...updates.metadata
        };

        return {
          ...f,
          ...updates,
          metadata: updatedMetadata
        };
      }
      return f;
    });

    return { creatorFiles: updatedFiles };
  }),
  linkSupportFileToQuiz: (quizId, supportId) => set((state) => {
    const supportFile = state.creatorFiles.find(f => f.id === supportId);
    if (!supportFile) return {};

    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(",", "");

    const updatedFiles = state.creatorFiles.map((f) => {
      if (f.id === quizId && f.type === "QUIZ") {
        if (f.supportedFileIds.includes(supportId)) return f;
        
        const newSupportedIds = [...f.supportedFileIds, supportId];
        const newQuestionsFromSupport = supportFile.questions.map(q => ({
          ...q,
          id: `${supportId}_${q.id}`,
          sourceId: supportId,
          sourceName: supportFile.name
        }));

        const combinedQuestions = [...f.questions, ...newQuestionsFromSupport];

        return {
          ...f,
          supportedFileIds: newSupportedIds,
          questions: combinedQuestions,
          metadata: {
            ...f.metadata,
            question_count: combinedQuestions.length,
            last_modified: formattedTime
          }
        };
      }
      return f;
    });
    return { creatorFiles: updatedFiles };
  }),
  unlinkSupportFileFromQuiz: (quizId, supportId) => set((state) => {
    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(",", "");

    const updatedFiles = state.creatorFiles.map((f) => {
      if (f.id === quizId && f.type === "QUIZ") {
        const newSupportedIds = f.supportedFileIds.filter(id => id !== supportId);
        const remainingQuestions = f.questions.filter(q => q.sourceId !== supportId);

        return {
          ...f,
          supportedFileIds: newSupportedIds,
          questions: remainingQuestions,
          metadata: {
            ...f.metadata,
            question_count: remainingQuestions.length,
            last_modified: formattedTime
          }
        };
      }
      return f;
    });
    return { creatorFiles: updatedFiles };
  }),
  syncQuestionsFromSupport: (quizId, supportId) => set((state) => {
    const supportFile = state.creatorFiles.find(f => f.id === supportId);
    if (!supportFile) return {};

    const timestamp = Date.now();
    const formattedTime = new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).replace(",", "");

    const updatedFiles = state.creatorFiles.map((f) => {
      if (f.id === quizId && f.type === "QUIZ") {
        const baseQuestions = f.questions.filter(q => q.sourceId !== supportId);
        const freshQuestions = supportFile.questions.map(q => ({
          ...q,
          id: `${supportId}_${q.id.replace(new RegExp(`^${supportId}_`), '')}`,
          sourceId: supportId,
          sourceName: supportFile.name
        }));
        
        const combined = [...baseQuestions, ...freshQuestions];

        return {
          ...f,
          questions: combined,
          metadata: {
            ...f.metadata,
            question_count: combined.length,
            last_modified: formattedTime
          }
        };
      }
      return f;
    });
    return { creatorFiles: updatedFiles };
  }),

  state: 'NOT_STARTED',
  questions: [],
  currentIndex: 0,
  answers: {},
  startTime: null,
  accumulatedTime: 0,
  totalTime: null,
  isPaused: false,

  questionStartTime: null,
  questionAccumulatedTime: 0,
  questionTimes: {},

  startQuiz: () => {
    const { sources, questionCountMode, customQuestionCount, sourceAllocations } = get();
    const activeSources = sources.filter(s => s.active && s.isValid);
    if (activeSources.length === 0) return;

    let combinedQuestions: Question[] = [];
    
    if (questionCountMode === 'CUSTOM' && Object.keys(sourceAllocations).length > 0) {
      // Check if allocations match total custom count exactly
      const sumAlloc = Object.values(sourceAllocations).reduce((a, b) => a + b, 0);
      const isAllocValid = sumAlloc === customQuestionCount;
      
      if (isAllocValid) {
        activeSources.forEach(source => {
          const alloc = sourceAllocations[source.id] || 0;
          if (alloc > 0) {
            const qs = source.questions.map(q => ({ ...q, id: `${source.id}__${q.id}`, sourceId: source.id, sourceName: source.customName || source.name }));
            const shuffledQs = shuffleArray(qs).slice(0, alloc);
            combinedQuestions = [...combinedQuestions, ...shuffledQs];
          }
        });
      } else {
        // Fallback if allocations are broken
        activeSources.forEach(source => {
          const withSource = source.questions.map(q => ({ ...q, id: `${source.id}__${q.id}`, sourceId: source.id, sourceName: source.customName || source.name }));
          combinedQuestions = [...combinedQuestions, ...withSource];
        });
      }
    } else {
      activeSources.forEach(source => {
        const withSource = source.questions.map(q => ({ ...q, id: `${source.id}__${q.id}`, sourceId: source.id, sourceName: source.customName || source.name }));
        combinedQuestions = [...combinedQuestions, ...withSource];
      });
    }

    // Shuffle combined questions
    let finalQuestions = shuffleArray(combinedQuestions);
    
    // If not using allocations (ALL or fallback CUSTOM), apply slice
    if (questionCountMode === 'CUSTOM' && (Object.keys(sourceAllocations).length === 0 || Object.values(sourceAllocations).reduce((a, b) => a + b, 0) !== customQuestionCount)) {
      if (customQuestionCount > 0) {
        finalQuestions = finalQuestions.slice(0, customQuestionCount);
      }
    }

    if (finalQuestions.length === 0) return;

    finalQuestions = finalQuestions.map(q => ({
      ...q,
      options: shuffleArray(q.options),
      tags: q.tags ? q.tags.slice(0, 5) : []
    }));

    set({
      state: 'IN_PROGRESS',
      questions: finalQuestions,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      accumulatedTime: 0,
      totalTime: null,
      isPaused: false,
      questionStartTime: Date.now(),
      questionAccumulatedTime: 0,
      questionTimes: {}
    });
  },

  submitAnswer: (questionId, optionIds) => {
    const { startTime, accumulatedTime, questionStartTime, questionAccumulatedTime } = get();
    const newAccumulated = accumulatedTime + (startTime ? Date.now() - startTime : 0);
    const newQAccumulated = questionAccumulatedTime + (questionStartTime ? Date.now() - questionStartTime : 0);

    set((state) => ({
      answers: { ...state.answers, [questionId]: optionIds },
      startTime: null,
      accumulatedTime: newAccumulated,
      questionStartTime: null,
      questionAccumulatedTime: newQAccumulated
    }));
  },

  nextQuestion: () => {
    const state = get();
    const { currentIndex, questions, startTime, accumulatedTime, questionStartTime, questionAccumulatedTime, questionTimes } = state;
    
    const currentQTime = questionAccumulatedTime + (questionStartTime ? Date.now() - questionStartTime : 0);
    const currentQId = questions[currentIndex].id;
    const newQuestionTimes = { ...questionTimes, [currentQId]: currentQTime };

    if (currentIndex < questions.length - 1) {
      set({ 
        currentIndex: currentIndex + 1,
        questionTimes: newQuestionTimes,
        startTime: Date.now(),
        questionStartTime: Date.now(),
        questionAccumulatedTime: 0
      });
    } else {
      const finalTime = accumulatedTime + (startTime ? Date.now() - startTime : 0);
      set({ 
        state: 'COMPLETED', 
        totalTime: finalTime, 
        startTime: null,
        questionTimes: newQuestionTimes,
        questionStartTime: null
      });
    }
  },

  retryQuiz: () => {
    const { questions } = get();
    // Reshuffle for retry
    const reshuffled = shuffleArray(questions).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
    set({
      state: 'IN_PROGRESS',
      questions: reshuffled,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      accumulatedTime: 0,
      totalTime: null,
      isPaused: false,
      questionStartTime: Date.now(),
      questionAccumulatedTime: 0,
      questionTimes: {}
    });
  },

  retryIncorrectQuestions: (incorrectIds, addExtra, extraCount, extraMode) => {
    const { questions, questionTimes, sources } = get();
    
    const incorrectQuestions = questions.filter(q => incorrectIds.includes(q.id));
    let extraQuestions: Question[] = [];
    
    if (addExtra && extraCount > 0) {
      if (extraMode === 'TIME') {
        const correctQuestions = questions.filter(q => !incorrectIds.includes(q.id));
        const sortedCorrect = [...correctQuestions].sort((a, b) => {
          const timeA = questionTimes[a.id] || 0;
          const timeB = questionTimes[b.id] || 0;
          return timeB - timeA;
        });
        extraQuestions = sortedCorrect.slice(0, extraCount);
      } else {
        let allPool: Question[] = [];
        sources.filter(s => s.active && s.isValid).forEach(source => {
           const qs = source.questions.map(q => ({ ...q, id: `${source.id}__${q.id}`, sourceId: source.id, sourceName: source.customName || source.name }));
           allPool = [...allPool, ...qs];
        });
        const poolExcludeIncorrect = allPool.filter(q => !incorrectIds.includes(q.id));
        const shuffledPool = shuffleArray(poolExcludeIncorrect);
        extraQuestions = shuffledPool.slice(0, extraCount);
      }
    }

    const combined = [...incorrectQuestions, ...extraQuestions];
    const uniqueCombined = Array.from(new Map(combined.map(q => [q.id, q])).values());

    const finalQuestions = shuffleArray(uniqueCombined).map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));

    set({
      state: 'IN_PROGRESS',
      questions: finalQuestions,
      currentIndex: 0,
      answers: {},
      startTime: Date.now(),
      accumulatedTime: 0,
      totalTime: null,
      isPaused: false,
      questionStartTime: Date.now(),
      questionAccumulatedTime: 0,
      questionTimes: {}
    });
  },

  pauseQuiz: () => {
    const { startTime, accumulatedTime, isPaused, questionStartTime, questionAccumulatedTime } = get();
    if (isPaused) return;
    const newAccumulated = accumulatedTime + (startTime ? Date.now() - startTime : 0);
    const newQAccumulated = questionAccumulatedTime + (questionStartTime ? Date.now() - questionStartTime : 0);
    
    set({
      isPaused: true,
      accumulatedTime: newAccumulated,
      startTime: null,
      questionAccumulatedTime: newQAccumulated,
      questionStartTime: null
    });
  },

  resumeQuiz: () => {
    const { questions, currentIndex, answers } = get();
    const currentQ = questions[currentIndex];
    const isAnswered = currentQ ? !!answers[currentQ.id] : false;

    set({
      isPaused: false,
      startTime: isAnswered ? null : Date.now(),
      questionStartTime: isAnswered ? null : Date.now()
    });
  },

  exitQuiz: () => {
    set({
      state: 'NOT_STARTED',
      questions: [],
      currentIndex: 0,
      answers: {},
      startTime: null,
      accumulatedTime: 0,
      totalTime: null,
      isPaused: false,
      questionStartTime: null,
      questionAccumulatedTime: 0,
      questionTimes: {}
    });
  },

  submitQuizEarly: () => {
    const state = get();
    const { startTime, accumulatedTime, questionStartTime, questionAccumulatedTime, currentIndex, questions, questionTimes } = state;
    const finalTime = accumulatedTime + (startTime ? Date.now() - startTime : 0);
    
    // Save the time of the current question when submitting early
    const currentQTime = questionAccumulatedTime + (questionStartTime ? Date.now() - questionStartTime : 0);
    const currentQId = questions[currentIndex].id;
    const newQuestionTimes = { ...questionTimes, [currentQId]: currentQTime };

    set({ 
      state: 'COMPLETED', 
      totalTime: finalTime, 
      startTime: null,
      questionTimes: newQuestionTimes,
      questionStartTime: null
    });
  },

  resetApp: () => {
    set({
      state: 'NOT_STARTED',
      questions: [],
      currentIndex: 0,
      answers: {},
      startTime: null,
      accumulatedTime: 0,
      totalTime: null,
      isPaused: false,
      questionStartTime: null,
      questionAccumulatedTime: 0,
      questionTimes: {}
    });
  },

  notification: null,
  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } });
  },
  clearNotification: () => set({ notification: null })
}));
