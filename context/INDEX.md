# Quiz Lab - Context & Architecture Knowledge Index

> **For AI Agents & Developers**: This document serves as the master navigation map for the `context/` directory. All project specifications, architectural details, component layouts, and development guidelines are organized into structured subdirectories below.

---

## 📁 Directory Structure & Map

```
context/
├── INDEX.md                         # Master index (this file)
├── overview/                        # High-level architecture & tech stack
│   ├── PROJECT_OVERVIEW.md          # Project goals, core features, & scope
│   ├── ARCHITECTURE.md              # System design & component interaction overview
│   ├── DIRECTORY_STRUCTURE.md       # Repository layout & folder mapping
│   └── TECH_STACK.md                # Next.js 16, React 19, Tailwind CSS v4, Zustand v5
├── architecture/                    # Detailed frontend & state specifications
│   ├── COMPONENTS.md                # UI component hierarchy & responsibilities
│   ├── STATE_MANAGEMENT.md          # Zustand store (`useQuizStore`), actions, state schemas
│   ├── SERVICES.md                  # Data parsers (`parseQuizJson`, `pdfParser.ts`), file export/import
│   ├── HOOKS.md                     # React custom hooks (`useRenderProfiler`, etc.)
│   └── DEPENDENCY_GRAPH.md          # Component & module import dependency graph
├── guides/                          # Development rules, workflows, & logic
│   ├── DEVELOPMENT_GUIDE.md         # Setup, run, build, and test instructions
│   ├── CODING_CONVENTIONS.md        # Code formatting, TypeScript practices, component conventions
│   ├── BUSINESS_LOGIC.md            # Quiz package JSON schemas, validation criteria, storage limits
│   ├── WORKFLOWS.md                 # Feature implementation & refactoring workflows
│   └── KNOWN_ISSUES.md              # Edge cases, tracked issues, & troubleshooting
└── configs/                         # Environment & operational specs
    ├── API.md                       # API specifications & mock payload structures
    ├── AUTHENTICATION.md            # Auth rules & permission scope (if applicable)
    ├── CONFIGURATION.md             # Project configs (`tsconfig.json`, `globals.css`, `@theme`)
    ├── DATABASE.md                  # LocalStorage state persistence & storage limits
    ├── ENVIRONMENT_VARIABLES.md     # Environment variables reference
    ├── GLOSSARY.md                  # Domain terminology & data models dictionary
    └── AI_CONTEXT.md                # AI agent prompt context & design constraints
```

---

## 🎯 Categorized Documentation Index

### 1. Overview (`context/overview/`)
- [PROJECT_OVERVIEW.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/overview/PROJECT_OVERVIEW.md): Overview of Quiz Lab, core product vision, user workflows (Quiz Taking, Question Editor, Document Viewer, File Management).
- [ARCHITECTURE.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/overview/ARCHITECTURE.md): Architectural layout explaining page views, state flow between components, and parser integrations.
- [DIRECTORY_STRUCTURE.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/overview/DIRECTORY_STRUCTURE.md): Detailed map of `src/app`, `src/components`, `src/store`, `src/lib`, and public assets.
- [TECH_STACK.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/overview/TECH_STACK.md): Breakdown of core dependencies: Next.js 16 (App Router, Turbopack), React 19, Zustand v5, Tailwind CSS v4, Lucide React icons.

### 2. Architecture & State (`context/architecture/`)
- [COMPONENTS.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/architecture/COMPONENTS.md): Detailed component documentation (`StartScreen`, `MainQuiz`, `ResultScreen`, `FileManager`, `QuestionModification`, `SettingExport`, `Sidebar`, `SourceAllocation`).
- [STATE_MANAGEMENT.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/architecture/STATE_MANAGEMENT.md): State schema for `useQuizStore` including active files, creator files, undo/redo history, notification toasts, and view switches.
- [SERVICES.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/architecture/SERVICES.md): JSON quiz parser (`parseQuizJson`), PDF text extractor (`pdfParser.ts`), Markdown renderer, and export handlers.
- [HOOKS.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/architecture/HOOKS.md): Custom hooks documentation including performance profiling (`useRenderProfiler`).
- [DEPENDENCY_GRAPH.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/architecture/DEPENDENCY_GRAPH.md): Import/export relationships between UI views, stores, utilities, and parsers.

### 3. Guides & Business Logic (`context/guides/`)
- [DEVELOPMENT_GUIDE.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/guides/DEVELOPMENT_GUIDE.md): Commands for running dev server (`npm run dev`), build validation (`npm run build`), and typechecking (`npx tsc --noEmit`).
- [CODING_CONVENTIONS.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/guides/CODING_CONVENTIONS.md): Style rules, TypeScript strictness guidelines, commit standards (`.agents/AGENTS.md`), and UI polish directives.
- [BUSINESS_LOGIC.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/guides/BUSINESS_LOGIC.md): Validation rules for questions (`isValid`), file size limits (`FILE_LIMIT = 20`, `STORAGE_LIMIT_BYTES = 50MB`), and export format requirements.
- [WORKFLOWS.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/guides/WORKFLOWS.md): Standard steps for modifying UI components, adding new parser logic, or extending Zustand state.
- [KNOWN_ISSUES.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/guides/KNOWN_ISSUES.md): Documented edge cases, browser compatibility notes, and state synchronization gotchas.

### 4. Configuration & Glossary (`context/configs/`)
- [API.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/API.md): API and data exchange formats for AI Quiz generation prompts and JSON schemas.
- [AUTHENTICATION.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/AUTHENTICATION.md): Access rules and client-side storage security notes.
- [CONFIGURATION.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/CONFIGURATION.md): Global styling configuration in `globals.css` and Tailwind `@theme`.
- [DATABASE.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/DATABASE.md): LocalStorage persistence schema under key `quiz_lab_store`.
- [ENVIRONMENT_VARIABLES.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/ENVIRONMENT_VARIABLES.md): Environment settings and runtime flags.
- [GLOSSARY.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/GLOSSARY.md): Terms dictionary: `CreatorFile`, `SourceFile`, `DisplayBlock`, `Question`, `Learning Package`.
- [AI_CONTEXT.md](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/configs/AI_CONTEXT.md): Directives and context guidelines for AI assistants interacting with this codebase.

---

## 💡 Quick Start Guide for AI Agents

When starting a task in this workspace:
1. Read **`overview/PROJECT_OVERVIEW.md`** and **`overview/ARCHITECTURE.md`** to understand the application scope.
2. Read **`architecture/STATE_MANAGEMENT.md`** before making changes to state, stores, or data flows.
3. Check **`architecture/COMPONENTS.md`** to understand component boundaries and props.
4. Follow rules in **`guides/CODING_CONVENTIONS.md`** and `.agents/AGENTS.md` (Git commit format with timestamps).
