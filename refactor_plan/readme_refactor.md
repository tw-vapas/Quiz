# Task: Viết lại README.md (Readme Refactor)

> - **Trạng thái**: CHỜ DUYỆT
> - **Ngày lập**: 2026-08-22
> - **Nhánh thực thi**: `refactor`
> - **File bị tác động khi implement**: `README.md` (duy nhất)
> - **Phụ thuộc**: KHÔNG chặn bởi Giai đoạn 1 (tái cấu trúc `context/`) — xử lý bằng forward-link + TODO marker

---

## 1. Mục tiêu & Phạm vi

### 1.1. Mục tiêu
Viết lại `README.md` từ boilerplate mặc định của `create-next-app` thành tài liệu hướng dẫn thực sự hữu ích cho cả **người mới** và **AI agent**:
- Giới thiệu đúng dự án Vapas Quiz là gì, làm được gì.
- Hướng dẫn cài đặt / chạy / kiểm tra chất lượng chính xác theo thực tế repo.
- Cung cấp **index đầy đủ tới `context/`** (21 file tài liệu).
- Cung cấp phần **hướng dẫn riêng cho AI agent** trỏ tới `context/` và `.agents/`.

### 1.2. Phạm vi LÀM
- Ghi đè toàn bộ `README.md` bằng draft ở mục 4.

### 1.3. Phạm vi KHÔNG làm
- Không đụng mã nguồn `src/`, cấu hình build.
- Không stage `package-lock.json` (đang dirty trong working tree).
- Không sửa nội dung `context/` hay `.agents/` (chỉ tham chiếu/link).

---

## 2. Phân tích Hiện trạng (kèm bằng chứng)

| # | Vấn đề | Bằng chứng |
|---|--------|-----------|
| 1 | Boilerplate thuần | Toàn bộ là template `create-next-app`, không có dòng nào mô tả Vapas Quiz |
| 2 | Rác cuối file | 3 dòng `"# Quiz"` thừa tại dòng 37–39 — dấu vết commit sai kiểu `echo "# Quiz" >> README.md` |
| 3 | Hướng dẫn sai đường dẫn | Bảo sửa `app/page.tsx` trong khi code thực tế nằm ở `src/app/page.tsx` |
| 4 | Liệt kê thừa | Đưa yarn/pnpm/bun trong khi repo chuẩn hóa npm (`package-lock.json`) |
| 5 | Thiếu mọi thông tin hướng dẫn | Không có: giới thiệu tính năng, yêu cầu môi trường, quy trình chạy/lint/typecheck, cấu trúc thư mục, index tài liệu `context/`, quy tắc làm việc `.agents/` |

---

## 3. Cấu trúc README mới

```
# Vapas Quiz
├── Giới thiệu ngắn (2–3 câu)
├── ✨ Tính năng chính
├── 🛠 Công nghệ (bảng)
├── 📦 Yêu cầu
├── 🚀 Khởi chạy dự án (+ lệnh khác)
├── 📁 Cấu trúc thư mục (bảng)
├── 📚 Tài liệu Dự án          ⭐ Index → context/
├── 🤖 Hướng dẫn cho AI Agent  ⭐ Trỏ context/ + .agents/
└── ☁️ Triển khai (Vercel)
```

---

## 4. Draft Nội dung README Mới (áp dụng nguyên văn khi được duyệt)

````markdown
# Vapas Quiz

**Vapas Quiz** là ứng dụng web ôn luyện thi trắc nghiệm tiếng Việt chạy hoàn toàn phía máy khách
(Client-Only SPA). Người dùng tải lên đề thi dạng Word (`.docx`), văn bản thô (`.txt`), JSON
(`.json`), PDF hoặc hình ảnh (OCR) để tự làm bài, biên soạn lại đề và xuất bản bộ đề mới.
Toàn bộ dữ liệu lưu trên `localStorage` của trình duyệt — không backend, hoạt động offline,
dữ liệu thuộc sở hữu của người dùng.

## ✨ Tính năng chính

- **Làm Quiz**: trộn ngẫu nhiên câu hỏi & đáp án, chế độ giới hạn thời gian, phản hồi đúng/sai
  tức thì (tùy chọn), phân bổ số câu theo tỷ lệ từ nhiều nguồn tệp, tạm dừng/tiếp tục,
  thống kê thời gian từng câu bằng biểu đồ, làm lại riêng các câu trả lời sai.
- **Biên soạn đề thi (Creator Suite)**: quản lý tối đa 10 tệp đề, trình sửa câu hỏi trực quan
  (thẻ phân loại, khối code/hình ảnh, giải thích), "Tạo Quiz Nhanh" bóc tách tự động từ
  JSON/văn bản dán vào, soạn tài liệu lý thuyết Markdown.
- **Xuất bản đề thi**: xuất JSON hoặc DOCX với tùy chọn cắt lát phạm vi câu hỏi.
- **Xem tài liệu lý thuyết**: trang `/document` kết xuất Markdown theo tiến trình
  (progressive rendering) không đơ trang.

## 🛠 Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript strict |
| Trạng thái | Zustand v5 (store duy nhất `src/store/quizStore.ts`) |
| Giao diện | Tailwind CSS v4 · Framer Motion · Lucide Icons |
| Xử lý tệp | Mammoth (.docx) · pdfjs-dist (PDF) · Tesseract.js (OCR ảnh) |
| Nội dung | React Markdown · remark-gfm · PrismJS |

## 📦 Yêu cầu

- [Node.js](https://nodejs.org) **20 LTS** trở lên
- npm (đi kèm Node.js)

## 🚀 Khởi chạy dự án

```bash
git clone git@github.com:tw-vapas/Quiz.git
cd Quiz
npm install

# Chạy môi trường phát triển (http://localhost:3000)
npm run dev
```

Thử tính năng import ngay bằng các tệp mẫu tại thư mục gốc:
`sample_quiz.txt`, `sample_learning_package.json`.

### Các lệnh khác

```bash
npm run build        # Biên dịch production
npm run start        # Chạy bản production sau khi build
npm run lint         # Kiểm tra ESLint
npx tsc --noEmit     # Kiểm tra kiểu TypeScript
```

> Lưu ý: dự án chưa có framework test và chưa sử dụng Prettier.

## 📁 Cấu trúc thư mục

| Đường dẫn | Vai trò |
|---|---|
| `src/app/` | Trang Next.js App Router (`/`, `/document`) |
| `src/components/` | Component giao diện (MainQuiz, FileManager, QuestionModification...) |
| `src/lib/` | Hàm thuần túy & thuật toán (parser, Web Worker, markdown helper, utils) |
| `src/store/` | Zustand store — nguồn dữ liệu chân lý duy nhất của ứng dụng |
| `context/` | Tài liệu ngữ cảnh dự án dành cho người phát triển & AI agent |
| `.agents/` | Quy tắc làm việc workspace dành cho AI agent |
| `prompts/`, `Sample/`, `reference_pictures/` | Tài nguyên phụ trợ phục vụ phát triển |

## 📚 Tài liệu Dự án

Toàn bộ tài liệu chi tiết nằm trong thư mục [`context/`](context/AI_CONTEXT.md):

| Nhóm | Tài liệu |
|------|----------|
| **Điểm bắt đầu** | [AI_CONTEXT.md](context/AI_CONTEXT.md) |
| Nghiệp vụ & luồng | [PROJECT_OVERVIEW](context/PROJECT_OVERVIEW.md) · [WORKFLOWS](context/WORKFLOWS.md) · [BUSINESS_LOGIC](context/BUSINESS_LOGIC.md) |
| Kiến trúc | [ARCHITECTURE](context/ARCHITECTURE.md) · [DIRECTORY_STRUCTURE](context/DIRECTORY_STRUCTURE.md) · [DEPENDENCY_GRAPH](context/DEPENDENCY_GRAPH.md) |
| Tham chiếu code | [API](context/API.md) · [STATE_MANAGEMENT](context/STATE_MANAGEMENT.md) · [DATABASE](context/DATABASE.md) · [SERVICES](context/SERVICES.md) · [COMPONENTS](context/COMPONENTS.md) · [HOOKS](context/HOOKS.md) |
| Quy ước & cấu hình | [CODING_CONVENTIONS](context/CODING_CONVENTIONS.md) · [CONFIGURATION](context/CONFIGURATION.md) · [GLOSSARY](context/GLOSSARY.md) |
| Vận hành & nợ kỹ thuật | [DEVELOPMENT_GUIDE](context/DEVELOPMENT_GUIDE.md) · [KNOWN_ISSUES](context/KNOWN_ISSUES.md) |

> **[TODO-refactor]** Sau khi tái cấu trúc `context/` hoàn tất (xem
> `refactor_plan/agent_context_refactor.md`), thay bảng trên bằng link tới `context/INDEX.md`.

## 🤖 Hướng dẫn cho AI Agent

Nếu bạn là trợ lý AI (hoặc lập trình viên mới) làm việc trên repo này:

1. **Đọc trước**: [`context/AI_CONTEXT.md`](context/AI_CONTEXT.md) — tổng quan kiến trúc +
   mục lục toàn bộ tài liệu dự án.
2. **Tuân thủ quy tắc workspace** tại [`.agents/AGENTS.md`](.agents/AGENTS.md):
   - Commit message gồm mốc thời gian `[YYYY-MM-DD HH:mm]` + tóm tắt thay đổi.
   - Yêu cầu chưa rõ ràng phải hỏi owner để làm rõ trước khi triển khai.
3. **Quy ước code quan trọng** (chi tiết tại
   [CODING_CONVENTIONS](context/CODING_CONVENTIONS.md)): đăng ký Zustand qua specific selector,
   tự thêm class `cursor-pointer` cho mọi phần tử tương tác (Tailwind v4 không tự áp dụng).
4. **Trước khi commit** phải chạy: `npx tsc --noEmit && npm run lint`.

> **[TODO-refactor]** Khi root `AGENTS.md` được tạo (theo kế hoạch tái cấu trúc), cập nhật
> phần này trỏ tới `AGENTS.md`.

## ☁️ Triển khai

Dự án triển khai dễ dàng trên [Vercel Platform](https://vercel.com/new) (đã tích hợp
`@vercel/analytics`). Chi tiết xem
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
````

---

## 5. Các bước Thực thi

1. Xác nhận đang trên nhánh `refactor`.
2. Ghi đè `README.md` bằng nội dung draft mục 4 (nguyên văn).
3. Stage tường minh: `git add README.md` (KHÔNG dùng `git add .`).
4. Commit message: `[YYYY-MM-DD HH:mm] Viet lai README: gioi thieu du an, huong dan chay, index tai lieu context va huong dan AI agent` (điền timestamp thật lúc commit).
5. `git push origin refactor`.
6. Chạy checklist mục 6; nếu lệch thì sửa + commit riêng.

---

## 6. Checklist Verify

- [ ] Không còn 3 dòng `"# Quiz"` thừa cuối file.
- [ ] Mọi link tương đối trong README tồn tại thực tế (21 file `context/*.md`, `.agents/AGENTS.md`, `sample_quiz.txt`, `sample_learning_package.json`).
- [ ] Các lệnh trong README đúng với `package.json` scripts (`dev`, `build`, `start`, `lint`) + `npx tsc --noEmit`.
- [ ] Ngôn ngữ tiếng Việt thống nhất toàn bộ file.
- [ ] Có đúng 2 marker `[TODO-refactor]` (cuối phần Tài liệu Dự án + cuối phần AI Agent).
- [ ] Phần index liệt kê đủ 17 file nhóm (trừ AI_CONTEXT entry point, AUTHENTICATION + ENVIRONMENT_VARIABLES không đưa vào bảng vì sẽ bị gộp/xóa ở Giai đoạn 1).
- [ ] `git status`: chỉ README.md thay đổi, `package-lock.json` vẫn chưa được stage.
- [ ] Push thành công lên `origin/refactor`.

---

## 7. Rủi ro & Lưu ý

| Rủi ro | Giảm thiểu |
|---|---|
| Link `context/*.md` sẽ đổi tên sau Giai đoạn 1 | Đã đặt `[TODO-refactor]` ngay hai phần liên quan; việc đổi link thuộc bước 8–9 Giai đoạn 1 |
| Phiên bản Node tối thiểu chưa ghi chính thức trong repo | Ghi "Node 20 LTS+" dựa trên `@types/node ^20` + yêu cầu Next.js 16; owner có thể chỉnh sau |
| README song song tồn tại với docs tiếng Anh template cũ của GitHub | Không áp dụng — toàn bộ viết lại bằng tiếng Việt theo quyết định của owner |

---

*Hết task. Việc ghi đè README.md chỉ thực hiện sau khi owner duyệt draft mục 4.*
