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
  document: string;
  note: string;
  questions: Question[];
  metadata: {
    file_name: string;
    question_count: number;
    last_modified: number | string;
  };
  active?: boolean;
  customName?: string;
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
  
  activeSection: 'quiz' | 'create';
  setActiveSection: (val: 'quiz' | 'create') => void;
  
  isSettingsOpen: boolean;
  settingsOpenedAt: number | null;
  setSettingsOpen: (val: boolean) => void;

  // Selected Document Source
  selectedDocumentSourceId: string | null;
  setSelectedDocumentSourceId: (id: string | null) => void;

  // Sources (Được liên thông trực tiếp từ CreatorFiles)
  sources: SourceFile[];
  addSource: (source: SourceFile) => void;
  toggleSource: (id: string) => void;
  removeSource: (id: string) => void;

  // Creator State
  creatorFiles: CreatorFile[];
  pastCreatorFiles: CreatorFile[][];
  futureCreatorFiles: CreatorFile[][];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  createCreatorFile: (name: string, initialData?: Partial<CreatorFile>) => string;
  deleteCreatorFile: (id: string) => void;
  updateCreatorFile: (id: string, updates: Partial<CreatorFile>) => void;
  undo: () => void;
  redo: () => void;

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
    id: "qf1",
    name: "Quiz File 1",
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
      file_name: "Quiz File 1",
      question_count: 2,
      last_modified: "12:00 01/07/2026"
    },
    active: true
  },
  {
    id: "qf2",
    name: "Quiz File 2",
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
      file_name: "Quiz File 2",
      question_count: 1,
      last_modified: "12:00 01/07/2026"
    },
    active: true
  },
  {
    id: "qf3",
    name: "Quiz File 3",
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
      file_name: "Quiz File 3",
      question_count: 1,
      last_modified: "12:00 01/07/2026"
    },
    active: true
  }
];

function checkFileValidity(f: CreatorFile): boolean {
  if (!f.questions || f.questions.length === 0) return false;
  return f.questions.every(q => 
    !!q.text && 
    Array.isArray(q.options) && 
    q.options.length > 0 && 
    Array.isArray(q.correctOptionIds) && 
    q.correctOptionIds.length > 0
  );
}

function creatorFileToSource(f: CreatorFile): SourceFile {
  return {
    id: f.id,
    name: f.name,
    customName: f.customName,
    questionsCount: f.questions?.length || 0,
    active: f.active !== false && checkFileValidity(f),
    isValid: checkFileValidity(f),
    questions: f.questions || [],
    document: f.document,
    note: f.note,
    metadata: f.metadata || {
      file_name: f.name,
      question_count: f.questions?.length || 0,
      last_modified: new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }) + " " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    }
  };
}

const initialSources = initialCreatorFiles.map(creatorFileToSource);

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

  activeSection: 'quiz',
  setActiveSection: (val) => set({ activeSection: val }),
  
  isSettingsOpen: false,
  settingsOpenedAt: null,
  setSettingsOpen: (val) => set({ 
    isSettingsOpen: val,
    settingsOpenedAt: val ? performance.now() : null
  }),

  selectedDocumentSourceId: null,
  setSelectedDocumentSourceId: (id) => set({ selectedDocumentSourceId: id }),

  sources: initialSources,
  addSource: (source) => set((state) => {
    const newFile: CreatorFile = {
      id: source.id || `qf_${Date.now()}`,
      name: source.name,
      document: source.document || "",
      note: source.note || "",
      questions: source.questions || [],
      metadata: {
        file_name: source.name,
        question_count: source.questions?.length || 0,
        last_modified: new Date().toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }).replace(",", "")
      },
      active: true
    };
    const updatedFiles = [...state.creatorFiles, newFile];
    return {
      creatorFiles: updatedFiles,
      sources: updatedFiles.map(creatorFileToSource)
    };
  }),
  toggleSource: (id) => set((state) => {
    const updatedFiles = state.creatorFiles.map(f => f.id === id ? { ...f, active: !f.active } : f);
    return {
      creatorFiles: updatedFiles,
      sources: updatedFiles.map(creatorFileToSource)
    };
  }),
  removeSource: (id) => set((state) => {
    const updatedFiles = state.creatorFiles.filter(s => s.id !== id);
    const newActiveId = state.activeFileId === id ? null : state.activeFileId;
    return {
      creatorFiles: updatedFiles,
      activeFileId: newActiveId,
      sources: updatedFiles.map(creatorFileToSource)
    };
  }),

  // Creator State
  creatorFiles: initialCreatorFiles,
  pastCreatorFiles: [],
  futureCreatorFiles: [],
  activeFileId: "qf1",
  setActiveFileId: (id) => set({ activeFileId: id }),
  createCreatorFile: (name, initialData) => {
    const id = `qf_${Date.now()}`;
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
      document: initialData?.document || "",
      note: initialData?.note || "",
      questions: initialData?.questions || [],
      metadata: {
        file_name: initialData?.metadata?.file_name || name,
        question_count: initialData?.questions?.length || 0,
        last_modified: formattedTime,
        ...initialData?.metadata
      },
      active: true,
      ...initialData
    };
    
    set((state) => {
      const currentSnapshot = JSON.parse(JSON.stringify(state.creatorFiles));
      const past = state.pastCreatorFiles || [];
      const updatedFiles = [...state.creatorFiles, newFile];
      return {
        pastCreatorFiles: [...past.slice(-29), currentSnapshot],
        futureCreatorFiles: [],
        creatorFiles: updatedFiles,
        activeFileId: id,
        sources: updatedFiles.map(creatorFileToSource)
      };
    });
    return id;
  },
  deleteCreatorFile: (id) => set((state) => {
    const currentSnapshot = JSON.parse(JSON.stringify(state.creatorFiles));
    const past = state.pastCreatorFiles || [];
    const newActiveId = state.activeFileId === id ? null : state.activeFileId;
    const updatedFiles = state.creatorFiles.filter((f) => f.id !== id);
    return {
      pastCreatorFiles: [...past.slice(-29), currentSnapshot],
      futureCreatorFiles: [],
      creatorFiles: updatedFiles,
      activeFileId: newActiveId,
      sources: updatedFiles.map(creatorFileToSource)
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

    const currentSnapshot = JSON.parse(JSON.stringify(state.creatorFiles));
    const past = state.pastCreatorFiles || [];

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

    return {
      pastCreatorFiles: [...past.slice(-29), currentSnapshot],
      futureCreatorFiles: [],
      creatorFiles: updatedFiles,
      sources: updatedFiles.map(creatorFileToSource)
    };
  }),

  undo: () => {
    const { pastCreatorFiles, creatorFiles, futureCreatorFiles } = get();
    if (!pastCreatorFiles || pastCreatorFiles.length === 0) return;

    const previousFiles = pastCreatorFiles[pastCreatorFiles.length - 1];
    const newPast = pastCreatorFiles.slice(0, pastCreatorFiles.length - 1);
    const currentSnapshot = JSON.parse(JSON.stringify(creatorFiles));
    const newFuture = [currentSnapshot, ...(futureCreatorFiles || [])];

    set({
      creatorFiles: previousFiles,
      pastCreatorFiles: newPast,
      futureCreatorFiles: newFuture,
      sources: previousFiles.map(creatorFileToSource)
    });
    get().showNotification("Đã hoàn tác (Undo)", "info");
  },

  redo: () => {
    const { pastCreatorFiles, creatorFiles, futureCreatorFiles } = get();
    if (!futureCreatorFiles || futureCreatorFiles.length === 0) return;

    const nextFiles = futureCreatorFiles[0];
    const newFuture = futureCreatorFiles.slice(1);
    const currentSnapshot = JSON.parse(JSON.stringify(creatorFiles));
    const newPast = [...(pastCreatorFiles || []), currentSnapshot];

    set({
      creatorFiles: nextFiles,
      pastCreatorFiles: newPast,
      futureCreatorFiles: newFuture,
      sources: nextFiles.map(creatorFileToSource)
    });
    get().showNotification("Đã làm lại (Redo)", "info");
  },

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
