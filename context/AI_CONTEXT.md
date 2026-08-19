# Hướng dẫn Ngữ cảnh AI (AI Context Master)

Tập tin này là điểm bắt đầu (entrypoint) lý tưởng dành cho các trợ lý lập trình AI hoặc nhà phát triển mới tiếp cận dự án **Vapas Quiz**. Dưới đây là tóm tắt nhanh toàn bộ kiến trúc, công nghệ và chỉ dẫn điều hướng chi tiết.

---

## 1. Tóm tắt Dự án (Project Summary)

**Vapas Quiz** là ứng dụng hỗ trợ tự học và ôn luyện thi trắc nghiệm bằng tiếng Việt chạy hoàn toàn ở phía máy khách (Client-Side SPA). Người dùng có thể tải lên tệp đề thi dạng Word (`.docx`), Văn bản thô (`.txt`), hoặc cấu trúc JSON (`.json`) để tự kiểm tra kiến thức hoặc chỉnh sửa trực quan và xuất bản tệp đề thi mới.

---

## 2. Kiến trúc & Công nghệ (Architecture & Tech Stack)

- **Mô hình**: Next.js 16 (App Router) + React 19 chạy cục bộ trên trình duyệt (không sử dụng backend database).
- **Trạng thái**: Quản lý tập trung bằng **Zustand v5** (`src/store/quizStore.ts`) kết hợp đồng bộ thủ công với **`localStorage`** ở trình duyệt.
- **Xử lý tệp**: Sử dụng luồng chạy ngầm **Web Worker** (`parser.worker.ts`) để Mammoth.js đọc tệp Word mà không chặn Main UI Thread.
- **Phong cách giao diện**: Hiện đại, mượt mà bằng **Tailwind CSS v4** và thư viện chuyển động **Framer Motion**.
- **Kết xuất lý thuyết**: Sử dụng **React Markdown** tích hợp thuật toán vẽ progressive để hiển thị nhanh tài liệu ôn tập lớn mà không bị đơ gián đoạn trang web.

---

## 3. Quy ước Lập trình Quan trọng (Coding Conventions)

- **Đăng ký Store**: Để tránh kích hoạt re-render lặp lại khi đồng hồ đếm giờ chạy, luôn đăng ký trạng thái Zustand thông qua **Specific Selectors**.
  * *Ví dụ*: `const theme = useQuizStore(s => s.theme);` (Đúng).
- **Phím tắt trong React**: Thao tác ghi đè trạng thái store trong hàm callback hoặc sự kiện ngoài React phải gọi trực tiếp qua `useQuizStore.getState()`.
- **Cơ chế con trỏ chuột**: Lập trình viên phải khai báo class `cursor-pointer` thủ công cho tất cả các phần tử tương tác (như button, link) do Tailwind CSS v4 không tự động áp dụng pointer mặc định.
- **Tỉ lệ Giao diện & Typography**: Cỡ chữ gốc được thiết lập `html { font-size: 75% }` (1rem = 12px) để thu nhỏ giao diện tương đương Zoom 75% trên Chrome. Toàn bộ dự án quy chuẩn về **5 level cỡ chữ** (`12px` / `text-xs`, `14px` / `text-sm`, `16px` / `text-base`, `18px` / `text-lg`, `20px` / `text-xl`). Tiêu đề 3 section chính dùng `font-bold text-lg`. All inputs trong Question Editor dùng `text-base font-normal`.

---

## 4. Mục lục và Điều hướng Tài liệu (Document Navigation Index)

Nhấp vào các liên kết bên dưới để đọc sâu các chi tiết kỹ thuật chuyên biệt nằm trong thư mục `/context`:

1. [Tổng quan Dự án](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/PROJECT_OVERVIEW.md) (`PROJECT_OVERVIEW.md`): Mục đích, tính năng, nghiệp vụ và đối tượng người dùng.
2. [Kiến trúc Hệ thống](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/ARCHITECTURE.md) (`ARCHITECTURE.md`): Luồng xử lý tệp tin, vòng đời thi cử, cơ chế hydration và giải pháp progressive rendering.
3. [Công nghệ Sử dụng](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/TECH_STACK.md) (`TECH_STACK.md`): Chi tiết phiên bản các thư viện chính (React 19, Next.js 16, Zustand v5, Tailwind CSS v4, Mammoth).
4. [Bản đồ Thư mục](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/DIRECTORY_STRUCTURE.md) (`DIRECTORY_STRUCTURE.md`): Sơ đồ cấu trúc thư mục từ ngoài vào trong và quy hoạch code.
5. [Quy ước Viết code](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/CODING_CONVENTIONS.md) (`CODING_CONVENTIONS.md`): Cách đặt tên biến, phong cách viết CSS Tailwind v4, xử lý ngoại lệ bất đồng bộ.
6. [Tài liệu Component](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/COMPONENTS.md) (`COMPONENTS.md`): Vai trò, props, các trạng thái cục bộ và logic xử lý của 8 component cốt lõi.
7. [Tài liệu Hooks](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/HOOKS.md) (`HOOKS.md`): Làm rõ lý do không viết custom hook riêng biệt và cách sử dụng hook `useRenderProfiler` để kiểm tra render.
8. [Tài liệu Services](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/SERVICES.md) (`SERVICES.md`): Giải thích cách thức vận hành đọc file của Web Worker cục bộ.
9. [Tài liệu API](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/API.md) (`API.md`): Đặc tả cấu hình tham số kiểu dữ liệu nội bộ (`ParseResult`, `Question`, `Option`, `DisplayBlock`).
10. [Tài liệu Cơ sở dữ liệu](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/DATABASE.md) (`DATABASE.md`): Mô tả các khóa lưu trữ trong `localStorage` và thuật toán kiểm duyệt giới hạn dung lượng 4.5MB.
11. [Xác thực & Phân quyền](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/AUTHENTICATION.md) (`AUTHENTICATION.md`): Phân tích tính an toàn của sandbox trình duyệt do không sử dụng backend auth.
12. [Quản lý Trạng thái](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/STATE_MANAGEMENT.md) (`STATE_MANAGEMENT.md`): Danh sách chi tiết các Action và State của Zustand Store.
13. [Nghiệp vụ Hệ thống](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/BUSINESS_LOGIC.md) (`BUSINESS_LOGIC.md`): Cú pháp quy định cấu trúc đề thi dạng text thô, quy tắc đồng bộ tệp tạo quiz và thuật toán tự cân bằng tỷ lệ câu hỏi.
14. [Tập tin Cấu hình](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/CONFIGURATION.md) (`CONFIGURATION.md`): Giải mã các file cấu hình dự án (`tsconfig`, `eslint`, `postcss`, `next.config`).
15. [Biến Môi trường](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/ENVIRONMENT_VARIABLES.md) (`ENVIRONMENT_VARIABLES.md`): Xác nhận dự án không sử dụng biến môi trường.
16. [Sơ đồ Phụ thuộc](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/DEPENDENCY_GRAPH.md) (`DEPENDENCY_GRAPH.md`): Biểu đồ quan hệ nhập khẩu (import) giữa các Page, Component và Lib.
17. [Hướng dẫn Phát triển](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/DEVELOPMENT_GUIDE.md) (`DEVELOPMENT_GUIDE.md`): Quy trình các bước khi thêm trang mới, thêm component mới hoặc chỉnh sửa store.
18. [Các Luồng Nghiệp vụ chính](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/WORKFLOWS.md) (`WORKFLOWS.md`): Hướng dẫn 4 luồng thao tác người dùng (làm bài, cài đặt đề, sửa câu sai, biên soạn đề).
19. [Các Lỗi Đã biết](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/KNOWN_ISSUES.md) (`KNOWN_ISSUES.md`): Ghi nhận nợ kỹ thuật và component chưa dùng.
20. [Thuật ngữ Hệ thống](file:///c:/Documents/Project/Code/Quiz%20Standard/Quiz/context/GLOSSARY.md) (`GLOSSARY.md`): Giải thích các từ khóa chuyên ngành sử dụng trong dự án.

---

## 5. Các Quy tắc Nghiệp vụ Cốt lõi & Phím tắt

### Cú pháp đánh dấu đề thi nhanh (.txt):
- Đề thi bắt đầu bằng `Câu X:`.
- Lựa chọn đáp án bắt đầu bằng ký tự viết hoa kèm dấu chấm: `A.`, `B.`, `C.`, `D.`.
- Thêm dấu `/` vào cuối văn bản đáp án đúng để đánh dấu (ví dụ: `A. Lựa chọn này đúng/`).
- Khối code đính kèm bọc trong thẻ `[+][code]` và kết thúc bằng `[/+]`.
- Phần giải thích câu hỏi đặt trong thẻ `[>]` và kết thúc bằng `[/>]`.

### Phím tắt lúc làm bài trắc nghiệm (MainQuiz):
- `A`, `B`, `C`, `D`: Nhấn phím để chọn đáp án tương ứng.
- `Enter`: Nhấn xác nhận đáp án hoặc chuyển sang câu hỏi tiếp theo.
- `P`: Tạm dừng bộ đếm giờ và làm bài.
- `S`: Nộp bài thi sớm để tính điểm.
- `Escape`: Mở hộp thoại xác nhận thoát khỏi lượt làm bài.
