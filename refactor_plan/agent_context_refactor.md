# Kế hoạch Refactor Thư mục `context/` (Agent Context Refactor)

> - **Trạng thái**: CHỜ DUYỆT
> - **Ngày lập**: 2026-08-22
> - **Nhánh thực thi**: `refactor`
> - **Phạm vi**: CHỈ tổ chức lại tài liệu trong `context/` + tạo `AGENTS.md` ở root. KHÔNG thay đổi mã nguồn ứng dụng (`src/`, cấu hình build).

---

## 1. Mục tiêu & Phạm vi

### 1.1. Mục tiêu
Tổ chức lại toàn bộ tài liệu ngữ cảnh AI trong thư mục `context/` sao cho:
- **Agent dễ điều hướng**: có entry point chuẩn (root `AGENTS.md` → `context/INDEX.md`), có bảng định tuyến "loại task → file cần đọc".
- **Mỗi quy tắc chỉ nằm đúng 1 nơi** (Single Source of Truth), các nơi khác chỉ dẫn link, giảm trùng lặp tốn token.
- **Loại bỏ lỗi kỹ thuật tài liệu**: link tuyệt đối Windows bị hỏng, mâu thuẫn nội dung giữa các file.
- **Minh bạch phần lệch thực tế**: các chỗ docs chưa khớp code được đánh dấu TODO rõ ràng để xử lý ở giai đoạn sau (KHÔNG sửa nội dung cho khớp code trong đợt này).

### 1.2. Phạm vi LÀM
- Di chuyển / đổi tên / gộp / xóa các file `.md` trong `context/`.
- Viết lại `AI_CONTEXT.md` thành `INDEX.md` mới.
- Tạo `AGENTS.md` ở root dự án.
- Chèn TODO markers tại các nội dung đã lệch so với code.

### 1.3. Phạm vi KHÔNG làm (ghi nhận lại, xử lý sau)
- Đồng bộ nội dung docs với code thực tế (bổ sung PDF/OCR parser, xóa action chết...).
- Refactor mã nguồn (`src/`): dọn dead code `SectionsSelection.tsx`, sửa lỗi ESLint...
- Tổ chức lại `prompts/`, `Sample/`, `reference_pictures/`.
- File `package-lock.json` đang dirty trong working tree: KHÔNG stage, KHÔNG đụng tới.

---

## 2. Hiện trạng & Vấn đề phát hiện (kèm bằng chứng)

| # | Vấn đề | Bằng chứng |
|---|--------|-----------|
| 1 | **Docs lệch so với code** | `src/lib/pdfParser.ts`, `src/lib/ocrParser.ts` tồn tại (dùng deps `pdfjs-dist`, `tesseract.js` trong `package.json`) nhưng không được đề cập trong TECH_STACK, DIRECTORY_STRUCTURE, DEPENDENCY_GRAPH, SERVICES |
| 2 | **Docs mô tả API không còn tồn tại** | STATE_MANAGEMENT.md mục 2B liệt kê các action `linkSupportFileToQuiz()`, `unlinkSupportFileFromQuiz()`, `syncQuestionsFromSupport()` — `rg` trên `quizStore.ts` không tìm thấy bất kỳ action nào như vậy |
| 3 | **Mâu thuẫn nội bộ giữa các file** | GLOSSARY.md: Quiz File giới hạn **5** + Supported File giới hạn **15** ↔ BUSINESS_LOGIC.md mục 3: "đã loại bỏ Supported File, thống nhất Quiz File giới hạn **10**" |
| 4 | **Link hỏng hàng loạt** | 21 vị trí dùng đường dẫn tuyệt đối Windows `file:///c:/Documents/Project/Code/Quiz%20Standard/...` (chủ yếu trong AI_CONTEXT.md mục 4 và ARCHITECTURE.md mục 4A) — chết khi mở trên Linux/macOS |
| 5 | **Trùng lặp nội dung** | Quy tắc `cursor-pointer`, quy tắc Zustand selector, progressive rendering, quota 4.5MB... lặp lại 3–4 nơi (AI_CONTEXT + CODING_CONVENTIONS + COMPONENTS + ARCHITECTURE + DEVELOPMENT_GUIDE) |
| 6 | **File "rỗng" tốn token agent** | ENVIRONMENT_VARIABLES.md (18 dòng) và AUTHENTICATION.md (23 dòng) thực chất chỉ khẳng định "không có gì"; SERVICES.md nửa đầu cũng chỉ nói "không dùng dịch vụ mạng ngoài" |
| 7 | **Thiếu entry hook chuẩn cho agent** | Root chưa có `AGENTS.md`; `.agents/AGENTS.md` (8 dòng) chỉ chứa rule commit + clarification, không tham chiếu tới `context/` |

Ghi chú thêm về hiện trạng: 21 file `.md`, tổng ~1.292 dòng, toàn bộ tiếng Việt, cấu trúc phẳng tên file IN-HOA.

---

## 3. Cấu trúc đích của `context/`

```
context/
├── INDEX.md                  # Map tổng + thứ tự đọc theo loại task (thay AI_CONTEXT.md)
├── product/                  # Nhóm "hệ thống làm cái gì"
│   ├── overview.md           # = PROJECT_OVERVIEW.md
│   ├── workflows.md          # = WORKFLOWS.md
│   └── business-rules.md     # = BUSINESS_LOGIC.md (SSOT cú pháp đề thi + thuật toán phân bổ)
├── architecture/             # Nhóm "hệ thống tổ chức thế nào"
│   ├── architecture.md       # = ARCHITECTURE.md (+ nuốt ý chính AUTHENTICATION.md)
│   ├── directory-map.md      # = DIRECTORY_STRUCTURE.md
│   └── dependency-graph.md   # = DEPENDENCY_GRAPH.md
├── reference/                # Nhóm tra cứu khi sửa code
│   ├── code-map.md           # ⭐ Bản đồ mã nguồn src/ — tạo TRƯỚC Giai đoạn 1 bởi task src_code_map.md
│   ├── data-models.md        # = API.md (interface Question/ParseResult/Option/DisplayBlock)
│   ├── store.md              # = STATE_MANAGEMENT.md
│   ├── storage.md            # = DATABASE.md (localStorage keys + quota)
│   ├── parsing.md            # = SERVICES.md (+ TODO luồng PDF/OCR)
│   ├── components.md         # = COMPONENTS.md
│   └── hooks.md              # = HOOKS.md
├── conventions/              # Nhóm quy ước bắt buộc tuân thủ
│   ├── coding.md             # = CODING_CONVENTIONS.md (SSOT mọi quy tắc code/style)
│   ├── configuration.md      # = CONFIGURATION.md (+ nuốt ENVIRONMENT_VARIABLES.md)
│   └── glossary.md           # = GLOSSARY.md
└── maintenance/              # Nhóm trạng thái & vận hành
    ├── known-issues.md       # = KNOWN_ISSUES.md (+ bổ sung drift phát hiện ở mục 2)
    └── dev-guide.md          # = DEVELOPMENT_GUIDE.md
```

Sau khi hoàn tất: `context/` còn **17 file .md** (từ 21), chia 5 nhóm rõ nghĩa.

> **[Ghi chú cập nhật 2026-08-23]** File `reference/code-map.md` được tạo TRƯỚC Giai đoạn 1 bởi task riêng `refactor_plan/src_code_map.md` (đã duyệt theo quy trình từng file). Khi chạy Giai đoạn 1: giữ nguyên vị trí file này, không move/không xóa, và đưa vào INDEX.md trong mục reference. Số file kết quả cuối là **18** thay vì 17.

---

## 4. Bảng Mapping Di chuyển Chi tiết

| File cũ | File mới | Hành động nội dung khi move |
|---|---|---|
| `PROJECT_OVERVIEW.md` | `product/overview.md` | Move gần nguyên vẹn |
| `WORKFLOWS.md` | `product/workflows.md` | Move gần nguyên vẹn |
| `BUSINESS_LOGIC.md` | `product/business-rules.md` | Move; giữ vai trò SSOT cú pháp đề thi (.txt/.json) — AI_CONTEXT cũ đang lặp lại phần này sẽ được bỏ |
| `ARCHITECTURE.md` | `architecture/architecture.md` | Move; sửa link hỏng `file:///c:` → đường dẫn tương đối; bổ sung mục ngắn "Không có xác thực & phân quyền" nuốt từ AUTHENTICATION.md |
| `DIRECTORY_STRUCTURE.md` | `architecture/directory-map.md` | Move; thêm TODO marker thiếu `pdfParser.ts` / `ocrParser.ts` |
| `DEPENDENCY_GRAPH.md` | `architecture/dependency-graph.md` | Move; thêm TODO marker thiếu node parser mới |
| `API.md` | `reference/data-models.md` | Rename + move; thêm TODO marker interface parser PDF/OCR chưa có |
| `STATE_MANAGEMENT.md` | `reference/store.md` | Rename + move; thêm TODO marker các action SUPPORT đã chết |
| `DATABASE.md` | `reference/storage.md` | Rename + move gần nguyên vẹn |
| `SERVICES.md` | `reference/parsing.md` | Rename + move; thêm TODO marker mô tả luồng PDF/OCR |
| `COMPONENTS.md` | `reference/components.md` | Move; gỡ các quy tắc UI trùng với coding.md, thay bằng link dẫn |
| `HOOKS.md` | `reference/hooks.md` | Move gần nguyên vẹn |
| `CODING_CONVENTIONS.md` | `conventions/coding.md` | Rename + move; là SSOT duy nhất cho cursor-pointer, selector Zustand, typography 5-level... |
| `CONFIGURATION.md` | `conventions/configuration.md` | Rename + move; bổ sung mục ngắn "Không sử dụng biến môi trường" nuốt từ ENVIRONMENT_VARIABLES.md |
| `GLOSSARY.md` | `conventions/glossary.md` | Move; thêm TODO marker mâu thuẫn hạn mức Quiz/Supported File (mục 2 bảng vấn đề #3) |
| `KNOWN_ISSUES.md` | `maintenance/known-issues.md` | Rename + move; bổ sung mục "Docs drift" liệt kê 4 việc ở bảng vấn đề #1, #2 |
| `DEVELOPMENT_GUIDE.md` | `maintenance/dev-guide.md` | Rename + move; gỡ rule trùng lặp (selector Zustand, hydration...) thay bằng link tới coding.md / store.md |
| `AI_CONTEXT.md` | `context/INDEX.md` | **Viết lại toàn bộ**: bỏ 21 link Windows hỏng, mục lục theo cây mới, thêm bảng định tuyến theo loại task |
| `AUTHENTICATION.md` | *(gộp)* | Ý chính đưa vào `architecture/architecture.md`, sau đó XÓA file |
| `ENVIRONMENT_VARIABLES.md` | *(gộp)* | Ý chính đưa vào `conventions/configuration.md`, sau đó XÓA file |

---

## 5. Nguyên tắc Viết lại Nội dung

1. **Ngôn ngữ**: giữ nguyên tiếng Việt (quyết định của owner).
2. **Single Source of Truth**: mỗi quy tắc/thuật toán/mô tả chỉ nằm đúng 1 file thuộc chuyên ngành đó; file khác muốn nhắc đến thì đặt link tương đối, không chép lại nội dung. Phân vai SSOT:
   - Quy tắc viết code/UI → `conventions/coding.md`
   - Cú pháp đề thi + thuật toán phân bổ → `product/business-rules.md`
   - Kiến trúc + hydration + progressive rendering → `architecture/architecture.md`
   - Store state/actions → `reference/store.md`
   - Storage keys + quota → `reference/storage.md`
   - Trạng thái lỗi/nợ kỹ thuật → `maintenance/known-issues.md`
3. **Chỉ dùng relative links** (vd: `[store.md](../reference/store.md)`), cấm tuyệt đối dạng `file:///` hoặc absolute path máy cá nhân.
4. **TODO marker format chuẩn**, chèn ngay đúng vị trí nội dung bị lệch:
   ```markdown
   > **[TODO-refactor]** Mô tả việc cần làm + tham chiếu file/code thực tế.
   ```
   Trong đợt này CHỈ đánh dấu, KHÔNG tự ý sửa nội dung docs cho khớp code.
5. **Front-matter tối thiểu** đầu mỗi file (giúp agent lọc nhanh):
   ```markdown
   > - **Nhóm**: reference
   > - **Vai trò SSOT**: Cấu trúc state & actions của Zustand store
   > - **Cập nhật lần cuối**: 2026-08-22 (đợt refactor context)
   ```

---

## 6. Danh sách TODO Sẽ Đánh Dấu (không sửa nội dung trong đợt này)

| Vị trí chèn | Nội dung TODO |
|---|---|
| `architecture/directory-map.md` (mục `/src/lib`) | Thiếu `pdfParser.ts`, `ocrParser.ts`; deps `pdfjs-dist`, `tesseract.js` trong `package.json` chưa phản ánh |
| `architecture/dependency-graph.md` (sơ đồ Lib) | Thiếu node `pdfParser.ts`, `ocrParser.ts` và quan hệ import thực tế (`parser.ts` đang import cả hai — kiểm chứng bằng rg) |
| `reference/parsing.md` | Chưa mô tả luồng parse PDF (pdfjs-dist) và OCR ảnh (tesseract.js); cần bổ sung sau khi rà code |
| `reference/data-models.md` | Interface kết quả trả về của pdfParser/ocrParser chưa đặc tả |
| `reference/store.md` (mục 2B Creator Actions) | Các action `linkSupportFileToQuiz()`, `unlinkSupportFileFromQuiz()`, `syncQuestionsFromSupport()` không tồn tại trong `quizStore.ts` hiện tại — cần xác minh và xóa khỏi docs |
| `conventions/glossary.md` (mục Quiz File / Supported File) | Mâu thuẫn với business-rules.md: hạn mức 5+15 vs thống nhất Quiz File 10 + bỏ concept SUPPORT — cần rà `quizStore.ts` chốt con số đúng |
| `maintenance/known-issues.md` (mục mới "Docs Drift") | Liệt kê tổng hợp các lệch nêu trên làm việc theo dõi tập trung |

---

## 7. Thiết kế `AGENTS.md` (Root)

File ~30 dòng, tiếng Việt, gồm:

```markdown
# AGENTS.md — Hướng dẫn cho AI Agent & Nhà phát triển

## Quick Facts
- Dự án: Vapas Quiz — SPA client-only (Next.js 16 App Router + React 19),
  không backend, dữ liệu lưu localStorage qua Zustand v5.
- Ngôn ngữ giao tiếp/docs: tiếng Việt.
- Path alias: `@/*` → `./src/*`. TypeScript strict. Không có test framework;
  kiểm tra bằng `npx tsc --noEmit` và `npm run lint`.

## Điều hướng Tài liệu (context/)
Đọc `context/INDEX.md` trước khi làm bất kỳ task nào. Định tuyến nhanh:
- Hiểu nghiệp vụ/tính năng → context/product/
- Sửa kiến trúc/thêm trang → context/architecture/
- Đụng tay vào store/parser/component → context/reference/
- Viết code mới → context/conventions/coding.md (bắt buộc đọc)
- Xem nợ kỹ thuật → context/maintenance/known-issues.md

## Quy tắc Bắt buộc (nguồn gốc: .agents/AGENTS.md)
- Sau mỗi task hoàn thành phải commit Git kèm timestamp + tóm tắt.
- Yêu cầu mơ hồ phải hỏi lại user trước khi triển khai, không tự đoán.

## Quy tắc Code Tóm tắt (chi tiết tại context/conventions/coding.md)
- Zustand: luôn đăng ký qua specific selector, cấm lấy cả store.
- Tailwind v4: tự thêm `cursor-pointer` cho mọi element tương tác.
```

Lưu ý: giữ nguyên `.agents/AGENTS.md` hiện hữu (không xóa) để tránh phá vỡ công cụ nào đang phụ thuộc nó; root `AGENTS.md` sẽ trích dẫn lại 2 rule đó.

---

## 8. Quy trình Thực thi Giai đoạn 1 (từng file một commit + push riêng)

Thứ tự thiết kế để repo luôn nhất quán giữa các commit (file đích xuất hiện trước khi file nguồn bị xóa/gộp):

| Bước | Thao tác | Số commit/push |
|---|---|---|
| 0 | *(đã xong)* Tạo nhánh `refactor` + file plan này | 1 |
| 1 | Tạo `context/product/`: move 3 file theo mapping | 3 |
| 2 | Tạo `context/architecture/`: move/sửa 3 file | 3 |
| 3 | Tạo `context/reference/`: rename+move 6 file | 6 |
| 4 | Tạo `context/conventions/`: rename+move 3 file | 3 |
| 5 | Tạo `context/maintenance/`: rename+move 2 file | 2 |
| 6 | Nuốt AUTHENTICATION vào `architecture/architecture.md` → xóa file cũ | 2 |
| 7 | Nuốt ENVIRONMENT_VARIABLES vào `conventions/configuration.md` → xóa file cũ | 2 |
| 8 | Viết `context/INDEX.md` mới → xóa `AI_CONTEXT.md` | 2 |
| 9 | Tạo `AGENTS.md` root | 1 |
| 10 | Checklist verify (mục 9), sửa phát sinh nếu có | 1–n |

Tổng cộng: **~26 commit/push riêng biệt** trên nhánh `refactor`. Mỗi commit message theo format sẵn có của repo: `[YYYY-MM-DD HH:mm] Mo ta thay doi (tieng Viet khong dau)`.

Move dùng `git mv` để giữ lịch sử file. Không stage `package-lock.json`.

---

## 9. Checklist Verify Cuối Giai đoạn 1

- [ ] `rg "file:///c:"` trong toàn repo trả về 0 kết quả.
- [ ] `rg "PROJECT_OVERVIEW|WORKFLOWS|BUSINESS_LOGIC|CODING_CONVENTIONS|STATE_MANAGEMENT|ENVIRONMENT_VARIABLES|AUTHENTICATION\.md|AI_CONTEXT"` trả về 0 tham chiếu tới tên file cũ.
- [ ] Mọi link tương đối trong `context/` resolve được (file đích tồn tại).
- [ ] Spot-check SSOT: `cursor-pointer`, selector Zustand, quota 4.5MB, progressive rendering — mỗi khái niệm mô tả đầy đủ đúng 1 file, chỗ khác chỉ là link.
- [ ] Các TODO marker (mục 6) đều present đúng vị trí, format `[TODO-refactor]`.
- [ ] Root `AGENTS.md` tồn tại, chứa routing table và 2 rule từ `.agents/AGENTS.md`.
- [ ] `git status`: `package-lock.json` vẫn dirty, chưa bị commit.
- [ ] `git log --oneline` thể hiện lịch sử per-file sạch trên nhánh `refactor`.

---

## 10. Rủi ro & Phương án

| Rủi ro | Giảm thiểu |
|---|---|
| Tool/công cụ ngoài đang tham chiếu tên file cũ (vd prompt trong `prompts/`) | Bước verify quét rg toàn repo; nếu thấy tham chiếu chỉ sửa link trong file doc tương ứng |
| Mất lịch sử git khi rename | Dùng `git mv`, kiểm tra bằng `git log --follow` sau từng bước |
| Commit nhầm `package-lock.json` dirty | Luôn stage bằng đường dẫn tường minh (`git add <file>`), không dùng `git add .` / `-A` |
| Nhánh `main` tiến forwards trong lúc làm | Rebase `refactor` lên `main` trước khi merge (quyết định bởi owner) |

---

*Hết kế hoạch. Giai đoạn 1 chỉ khởi động sau khi owner duyệt file này.*
