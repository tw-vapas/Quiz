# Task: Tạo Bộ Bản đồ Mã nguồn `src/` (Source Code Map)

> - **Trạng thái**: CHỜ DUYỆT
> - **Ngày lập**: 2026-08-23
> - **Nhánh thực thi**: `refactor`
> - **Sản phẩm**: `context/reference/code-map.md` (tạo thẳng nhà cuối cùng — Giai đoạn 1 sau đó chỉ move các file còn lại vào `reference/`)
> - **Định dạng task**: skeleton cấu trúc + dữ liệu thô đính kèm; phần viết hoàn thiện thực hiện ở bước implement
> - **Phạm vi**: chỉ tạo 1 file docs mới + 1 dòng ghi chú trong `agent_context_refactor.md`. KHÔNG sửa mã nguồn `src/`.

---

## 1. Mục tiêu & Phạm vi

### 1.1. Mục tiêu
Tạo tài liệu **Code Map** giúp AI agent (và người mới) khi cần chỉnh sửa có thể:
- Tra tên chức năng / symbol → biết ngay **file nào, dòng nào, vai trò gì**.
- Biết trước **phạm vi lan tỏa** của thay đổi: sửa X thì phải đụng thêm những chỗ nào (Change Recipes).
- Nắm **sơ đồ phụ thuộc thật** của `src/` (khác bản DEPENDENCY_GRAPH.md cũ đã lỗi thời).

### 1.2. Nguyên tắc nội dung
- Neo tra cứu = tên symbol **+ số dòng cụ thể** (quyết định của owner).
- Header file ghi rõ: *"Snapshot tại commit `<hash>` — số dòng có thể trôi khi code thay đổi; cập nhật map khi refactor lớn hoặc thêm/xóa export"*.
- Các chỗ docs cũ lệch so với code phát hiện khi lập map → chèn `[TODO-refactor]` marker, KHÔNG tự sửa docs khác.

---

## 2. Số liệu Khảo sát (snapshot 2026-08-23)

Tổng cộng **26 file · ~9.323 dòng**:

| Tầng | Số file | Tổng dòng | File nặng nhất |
|---|---|---|---|
| `src/app/` | 4 | ~1.071 | document/page.tsx (720) |
| `src/components/` | 13 | ~6.864 | QuestionModification.tsx (1871) |
| `src/lib/` | 8 | ~1.388 | parserCore.ts (771) |
| `src/store/` | 1 | 647 | quizStore.ts |

---

## 3. Phát hiện Drift Khi Lập Bản đồ (#8–12)

Các mục này sẽ trở thành `[TODO-refactor]` markers bên trong code-map:

| # | Phát hiện | Bằng chứng |
|---|-----------|-----------|
| 8 | Store có **undo/redo history** (`pastCreatorFiles`, `futureCreatorFiles`, `undo()`, `redo()`) và state `activeSection` (`'quiz'\|'create'`) — không có trong STATE_MANAGEMENT.md | `quizStore.ts:53,72-80` |
| 9 | Action chưa được docs: `exitQuiz()`, `retryQuiz()`, `resetApp()` | `quizStore.ts:99,103,105` |
| 10 | `sourceHelper.ts` vi phạm quy tắc "tầng lib hoàn toàn độc lập" (ARCHITECTURE.md §2.4) — import type từ `@/store/quizStore` | `sourceHelper.ts:1` |
| 11 | Trùng lặp logic: `isQuestionValid()` định nghĩa 2 nơi, rủi ro lệch hành vi | `components/QuestionModification.tsx:38` ↔ `lib/sourceHelper.ts:17` |
| 12 | `parserCore.ts` là SSOT types nhưng `parser.ts` re-export lại toàn bộ — agent dễ nhầm chỗ sửa | `parser.ts:14-15` |
| 13* | Quy ước import không đồng nhất: `quizStore.ts` dùng đường dẫn tương đối `'../lib/parser'`, còn lại repo dùng alias `@/` | `quizStore.ts:2` |

*\*#13 phát hiện thêm sau lần khảo sát đầu.*

---

## 4. Skeleton `context/reference/code-map.md`

```
# Bản đồ Mã nguồn (Code Map) — src/
> Snapshot tại commit <hash> · Ngày: YYYY-MM-DD
> Cách đọc: "file:dòng" · Cập nhật khi refactor lớn/thêm-xóa export

## 1. Cách Tra cứu cho AI Agent
   - Thứ tự tra: Change Recipes (mục 8) → Bản đồ tầng tương ứng (mục 3–6)
     → Sơ đồ phụ thuộc (mục 7) để tìm nơi lan tỏa.
   - Quy ước ghi: `path/file.tsx:L<line>` là vị trí khai báo export.

## 2. Thống kê Tổng quan
   [Bảng 4 tầng từ mục 2 của task này]

## 3. Tầng App — src/app/
   [Bảng: File | Dòng | Export | Vai trò | Ghi chú]
   - layout.tsx, page.tsx (hydration + switch màn hình theo
     activeSection/state), document/page.tsx, globals.css

## 4. Bản đồ Store — src/store/quizStore.ts (SSOT)
   ### 4.1 Types (L4–29): SourceFile · CreatorFile · QuizState · QuizStore
   ### 4.2 State fields theo nhóm + setters (bảng có cột Dòng)
       Nhóm: Settings(8) · UI(5) · Sources(1+3 actions) · Creator(4+5 actions,
       gồm undo/redo) · Quiz Execution(11 + 10 actions) · Notification(1+2)
   ### 4.3 Helpers nội bộ: shuffleArray · checkFileValidity · creatorFileToSource

## 5. Bản đồ Components — src/components/
   [Bảng: Component | Dòng export | Props | Selector Zustand dùng |
    Actions gọi | Lib phụ thuộc | Được dùng bởi]

## 6. Bản đồ Lib — src/lib/
   [Bảng: Hàm/Const | Dòng | Chữ ký ngắn | Caller | Ghi chú SSOT/pure/worker]

## 7. Sơ đồ Phụ thuộc Thực tế
   ```mermaid  (graph TD: app → components → store/lib; chú ý cạnh lib→store #10)
   ```
   [Bảng "file ← được import bởi" cho các node hub: quizStore, parser, utils]

## 8. ⭐ Change Recipes — "Muốn sửa X → đụng Y"
   [Bảng kịch bản phổ biến, mỗi dòng: Kịch bản | Vị trí bắt buộc | Vị trí liên quan | Docs liên quan]
   Seed sẵn ≥ 6 recipe (xem mục 6.3).

## 9. Quy tắc Bảo trì + TODO Markers
   - Khi nào phải cập nhật map (checklist 4 dòng)
   - TODO-refactor #8–13 liệt kê tại đây
```

---

## 5. Appendix A — Inventory Đầy đủ (exports + dòng)

### 5.1. `src/app/`
| File | Dòng | Export | Vai trò |
|---|---|---|---|
| `layout.tsx` | 38 | `metadata`(16), `RootLayout`(21) | Bố cục gốc, font, @vercel/analytics |
| `page.tsx` | 231 | `Home`(14) | Switch màn hình StartScreen/MainQuiz/ResultScreen/CreateQuizSection theo store; hydration + persist localStorage qua useEffect |
| `document/page.tsx` | 720 | `DocumentViewerPage`(380) | Trang xem tài liệu lý thuyết `/document`; chỉ nạp localStorage khi sources rỗng |
| `globals.css` | 82 | (CSS) | Tailwind v4 import, `html{font-size:75%}`, `@custom-variant dark` |

### 5.2. `src/store/`
| File | Dòng | Export |
|---|---|---|
| `quizStore.ts` | 647 | `SourceFile`(4), `CreatorFile`(14), `QuizState`(29), `QuizStore`(31), `useQuizStore`(158) |

### 5.3. `src/lib/`
| File | Dòng | Export (dòng khai báo) |
|---|---|---|
| `parserCore.ts` | 771 | `Option`(1), `DisplayBlock`(7), `Question`(12), `LearningPackage`(26), `ParseResult`(37), `unescapeString`(51), `mapBlockType`(65), `normalizeCodeIndentation`(73), `parseTaggedQuestionBlock`(98), `parseTaggedDisplayBlocks`(110), `parseTaggedExplanation`(124), `parseTaggedAnswerBlocks`(133), `parseQuizText`(277), `parseQuizJson`(663) |
| `pdfParser.ts` | 162 | `parsePdfFile`(14) |
| `parser.ts` | 158 | re-export types + `parseQuizText/Json`(14-15), `isQuestionCorrect`(17), `parseFile`(55) — dispatch Worker/fallback |
| `markdownHelper.ts` | 105 | `splitMarkdownIntoBlocks`(5) |
| `utils.ts` | 85 | `cn`(4), `getTagColor`(8), `STORAGE_LIMIT_BYTES`(31), `getQuizStorageUsedBytes`(33), `getQuizStorageUsedBytesExcept`(44), `getQuizStorageUsedBytesByKey`(55), `getItemBytes`(60), `formatBytes`(68), `useRenderProfiler`(74) |
| `ocrParser.ts` | 43 | `parseImageFile`(8) |
| `sourceHelper.ts` | 33 | `getSourceDisplayName`(10), `isQuestionValid`(17), `isFileValid`(30) |
| `parser.worker.ts` | 31 | onmessage handler (.json/.txt/.docx) |

### 5.4. `src/components/`
| Component | Dòng file | Export (dòng) | Ghi chú |
|---|---|---|---|
| `QuestionModification.tsx` | 1871 | `isQuestionValid`(38)⚠️#11, `QuestionModification`(1277) | Editor câu hỏi, tab Tài Liệu/Câu Hỏi, "Tạo Quiz Nhanh", undo/redo UI |
| `Sidebar.tsx` | 981 | `Sidebar`(760) | Drawer cài đặt + nguồn dữ liệu, upload file |
| `MainQuiz.tsx` | 668 | default(668) | Màn làm bài, phím tắt A-D/Enter/P/S/Esc, timer |
| `FileManager.tsx` | 663 | `FileManager`(22) | Cột 1 Creator, giới hạn 10 tệp, check quota trước thêm |
| `ResultScreen.tsx` | 584 | default(584) | Kết quả, biểu đồ thời gian SVG, retry incorrect |
| `SettingExport.tsx` | 513 | `SettingExport`(95) | Cột 3 Creator, metadata/ghi chú 200 từ, xuất JSON/DOCX |
| `SourceAllocation.tsx` | 392 | `SourceAllocation`(26); props `{sources, totalQuestions, allocations, onChange}` | Thanh phân bổ tỷ lệ, rebalance |
| `MarkdownRenderer.tsx` | 130 | memo(84), default(130) | Progressive render qua requestAnimationFrame |
| `CreateQuizSection.tsx` | 108 | `CreateQuizSection`(8) | Grid 3 cột Creator |
| `DisplayBlockRenderer.tsx` | 97 | `CodeBlock`(38), `ImageBlock`(65), `DisplayBlockRenderer`(83) | Khối code/image trong câu hỏi |
| `StartScreen.tsx` | 79 | default(79) | Màn chuẩn bị trước thi |
| `NotificationToast.tsx` | 76 | `NotificationToast`(9) | Toast đọc `notification` từ store |
| `SectionsSelection.tsx` | 55 | `SectionsSelection`(13) | ⚠️ Dead code — không ai import |

---

## 6. Appendix B — Dữ liệu Thô cho Implement

### 6.1. Bản đồ State Fields `quizStore.ts` (nhóm + dòng)
| Nhóm | Field (dòng) | Setter/Action (dòng) |
|---|---|---|
| Settings | showResultAfterQuestion(33), autoNext(34), questionCountMode(37), customQuestionCount(38), timeLimitMode(42), timeLimitMinutes(43), sourceAllocations(47) | setShowResultAfterQuestion(35), setAutoNext(36), setQuestionCountMode(39), setCustomQuestionCount(40), setTimeLimitMode(44), setTimeLimitMinutes(45), setSourceAllocations(48) |
| Theme/UI | theme(50), activeSection(53)#8, isSettingsOpen(56), settingsOpenedAt(57), selectedDocumentSourceId(61) | setTheme(51), setActiveSection(54)#8, setSettingsOpen(58), setSelectedDocumentSourceId(62) |
| Sources | sources(65) | addSource(66), toggleSource(67), removeSource(68) |
| Creator | creatorFiles(71), pastCreatorFiles(72)#8, futureCreatorFiles(73)#8, activeFileId(74) | setActiveFileId(75), createCreatorFile(76), deleteCreatorFile(77), updateCreatorFile(78), undo(79)#8, redo(80)#8 |
| Quiz Execution | state(83), questions(84), currentIndex(85), answers(86), startTime(87), accumulatedTime(88), totalTime(89), isPaused(90), questionStartTime(92), questionAccumulatedTime(93), questionTimes(94) | startQuiz(96), pauseQuiz(97), resumeQuiz(98), exitQuiz(99)#9, submitQuizEarly(100), submitAnswer(101), nextQuestion(102), retryQuiz(103)#9, retryIncorrectQuestions(104), resetApp(105)#9 |
| Notification | notification(107) | showNotification(108), clearNotification(109) |

Helpers nội bộ (không export): `shuffleArray`(~117 Fisher-Yates), `initialCreatorFiles`(~127), `checkFileValidity`(~129), `creatorFileToSource`(~138), `initialSources`(~157). Store tạo tại L158.

### 6.2. Cạnh Import Nội bộ (46 cạnh, từ rg `from "@/` + relative)
```
app/page.tsx → quizStore, Sidebar, StartScreen, MainQuiz, ResultScreen, CreateQuizSection, NotificationToast, utils(cn)          (8)
app/document/page.tsx → quizStore, utils(cn), sourceHelper(getSourceDisplayName), MarkdownRenderer                                (4)
CreateQuizSection → utils                                                                                                        (1)
DisplayBlockRenderer → parser(DisplayBlock type)                                                                                 (1)
FileManager → quizStore, parser(parseFile), sourceHelper(isFileValid), utils(6 hàm)                                              (4)
MainQuiz → quizStore, DisplayBlockRenderer, utils(cn,getTagColor), parser(isQuestionCorrect,Question)                            (4)
MarkdownRenderer → DisplayBlockRenderer(CodeBlock), markdownHelper                                                               (2)
NotificationToast → quizStore, utils(cn)                                                                                         (2)
QuestionModification → quizStore(CreatorFile), parser(parseQuizJson,parseQuizText), utils(4 hàm)                                 (3)
ResultScreen → quizStore, utils(cn), parser(isQuestionCorrect,Question,Option), DisplayBlockRenderer                             (4)
SectionsSelection → utils(cn)                                                                                                    (1)
SettingExport → quizStore(CreatorFile), utils(cn)                                                                                (2)
Sidebar → quizStore(SourceFile), parser(parseFile), sourceHelper(getSourceDisplayName), utils(6 hàm incl useRenderProfiler)       (4)
SourceAllocation → quizStore(SourceFile type), utils(cn,useRenderProfiler)                                                       (2)
StartScreen → quizStore                                                                                                          (1)
lib/sourceHelper → quizStore(SourceFile,CreatorFile type)⚠️#10, parser(Question type)                                            (2)
store/quizStore → ../lib/parser(Question,LearningPackage type)⚠️#13 relative path                                                (1)
```

Node hub cần bảng riêng "← được import bởi": `quizStore`(13 caller), `lib/utils`(12), `lib/parser`(8).

### 6.3. Seed Change Recipes (≥6, implement có thể mở rộng)
| Muốn thay đổi... | Vị trí bắt buộc | Liên quan | Docs |
|---|---|---|---|
| Thêm 1 field cài đặt quiz | quizStore interface+default (L31-155) | Sidebar.tsx (UI nhóm Tùy chỉnh chung), app/page.tsx (hydration + persist list) | reference/store.md, storage.md |
| Sửa cú pháp đề .txt/.docx | parserCore.parseQuizText(277) + các parseTagged*(98-133) | parser.worker.ts, parser.ts fallback | product/business-rules.md |
| Thêm định dạng tệp import | parser.parseFile(55) dispatch + worker | tham khảo pdfParser(14)/ocrParser(8); FileManager accept attr + Sidebar accept attr | reference/parsing.md |
| Sửa luồng/phím tắt làm bài | MainQuiz.tsx | quizStore actions nhóm Execution (L96-105) | reference/components.md |
| Sửa xuất bản đề | SettingExport.tsx(95) | parseQuizJson kiểm hợp lệ | product/workflows.md |
| Undo/Redo biên soạn | quizStore undo/redo(79-80) + past/futureCreatorFiles(72-73) | QuestionModification header buttons | reference/store.md |
| Dark mode / theme | theme(50)+setTheme(51), globals.css @custom-variant | html class `.dark` toggle ở layout/page | conventions/coding.md |

---

## 7. Các bước Thực thi

1. `mkdir context/reference` → viết `context/reference/code-map.md` từ skeleton (mục 4) lắp dữ liệu Appendix A+B, điền đủ bảng components/lib/mermaid.
2. Header code-map ghi snapshot commit hash (hash của commit chứa task này) + ngày.
3. Stage tường minh `git add context/reference/code-map.md` → commit `[YYYY-MM-DD HH:mm] Tao ban do ma nguon context/reference/code-map.md` → push.
4. Commit thứ hai: chèn ghi chú vào `agent_context_refactor.md` (sau cây cấu trúc mục 3):
   > **[Ghi chú 2026-08-23]** File `reference/code-map.md` được tạo TRƯỚC Giai đoạn 1 bởi task `src_code_map.md`. Khi chạy Giai đoạn 1 giữ nguyên vị trí, đưa vào INDEX.md mục reference.
5. Push; KHÔNG stage `package-lock.json`.

---

## 8. Checklist Verify

- [ ] Mọi symbol/số dòng trong code-map đối chiếu khớp `rg "^export"` / `wc -l` tại commit snapshot (ghi hash vào header).
- [ ] Mermaid gồm đủ 46 cạnh import, có nhánh `pdfParser`, `ocrParser`, và cạnh lib→store (#10) được vẽ nét đứt kèm chú thích.
- [ ] 5–6 marker `[TODO-refactor]` #8–13 present đúng vị trí (mục 9 code-map).
- [ ] Change Recipes ≥ 6 dòng seed, mỗi dòng đủ 4 cột.
- [ ] Link tương đối resolve; tham chiếu docs cũ kèm TODO đổi sau Giai đoạn 1.
- [ ] 2 commit riêng biệt đúng thứ tự mục 7; `package-lock.json` chưa bị stage.
- [ ] Push thành công lên `origin/refactor`.

---

*Hết task. Việc tạo `context/reference/code-map.md` chỉ thực hiện sau khi owner duyệt task này.*
