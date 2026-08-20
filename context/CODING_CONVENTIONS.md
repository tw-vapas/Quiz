# Quy ước Lập trình (Coding Conventions)

Tài liệu này tổng hợp các quy ước lập trình, cấu trúc đặt tên, cách viết CSS, phong cách gõ kiểu (typing) và quản lý hiệu năng bắt buộc tuân thủ trong dự án **Vapas Quiz**.

## 1. Quy ước Đặt tên (Naming Conventions)

- **Thành phần React (Components)**: Đặt tên theo dạng **PascalCase** cho cả tên file và tên hàm.
  * *Ví dụ*: `FileManager.tsx`, `QuestionCardProps`, `ResultScreen`.
- **Hàm và Biến thông thường**: Đặt tên theo dạng **camelCase**.
  * *Ví dụ*: `localSources`, `getSourceDisplayName()`, `storageUsedBytes`.
- **Hành động trong Store (Actions)**: Đặt tên dạng **camelCase** bắt đầu bằng động từ hành động.
  * *Ví dụ*: `startQuiz()`, `addSource()`, `toggleSource()`.
- **Thực thể cấu trúc đề thi**: Do kế thừa định dạng JSON trắc nghiệm tiêu chuẩn, một số thuộc tính sử dụng định dạng hỗn hợp **snake_case** và **camelCase**. Cần tuân thủ đúng giao diện của bộ phân tích cú pháp (`parserCore.ts`):
  * *Ví dụ*: `correctOptionIds` (camelCase) nhưng `display_block` và `display_blocks` (snake_case).
- **Tệp Web Worker**: Tên tệp phân tách bằng dấu chấm dạng `*.worker.ts`.
  * *Ví dụ*: `parser.worker.ts`.

---

## 2. Quy tắc Tailwind CSS v4 & Styling

Ứng dụng sử dụng **Tailwind CSS v4** với một số đặc tính đặc thù sau:

- **Không có tệp cấu hình**: Tailwind CSS v4 được định cấu hình trực tiếp qua chỉ thị `@import "tailwindcss";` trong tệp `globals.css`.
- **Bắt buộc thêm con trỏ chuột cho phần tử tương tác**: Tailwind v4 mặc định không tự động gán kiểu `cursor: pointer` lên các thẻ `<button>` hay liên kết `<a>`. Do đó, lập trình viên **phải thêm class `cursor-pointer` một cách thủ công** vào tất cả các phần tử tương tác được.
- **Quy tắc Font Size & 75% UI Scaling**: Cỡ chữ gốc được thiết lập là `html { font-size: 75% }` trong `globals.css` để thu nhỏ toàn bộ tỉ lệ giao diện, khoảng cách và cỡ chữ tương đương mức Zoom 75% trên trình duyệt Chrome.
  * *Lưu ý*: 1rem tương đương với **12px** chuẩn.
- **Chuẩn hóa Hệ thống Typography (5-Level Scale)**: Toàn bộ dự án quy chuẩn về đúng **5 cấp độ kích thước chữ tiêu chuẩn**, tạo sự phân cấp thị giác bằng Font Weight và Màu sắc:
  1. `12px` (`text-xs`): Caption, Metadata, Badges trạng thái (`Valid File`, `Sắp đầy!`), Bộ đếm ký tự (`0/1000`), Thống kê dung lượng (`0.55 MB`).
  2. `14px` (`text-sm`): Form Labels (`Nội dung`, `Tên tệp tin`), Controls phụ (`Thêm tệp`, `Thêm đáp án`, `Tạo Quiz Nhanh`, `Bộ lọc & Sắp xếp`), Phụ đề sidebar.
  3. `16px` (`text-base`): Toàn bộ các ô nhập liệu/Textarea/Select/Dropdown (Nội dung câu hỏi, Đáp án A/B/C/D, Ghi chú, Thẻ phân loại), Nút xác nhận chính (`Xuất bản`, `Bắt đầu`, `Xác nhận`). *(Lưu ý: riêng Textarea dialog "Tạo Quiz Nhanh" giảm 1 cấp xuống `text-sm`)*.
  4. `18px` (`text-lg`): Tiêu đề 3 main section chính (`Quản Lý Tệp`, `{Tên tệp tin}`, `Cài Đặt & Xuất Bản`) được in đậm `font-bold text-lg`, Tiêu đề card (`Câu hỏi 1`).
  5. `20px` (`text-xl`): Tiêu đề Popup Modal (`Tạo Quiz Nhanh`, `Tạo tệp câu hỏi mới`, `Cài đặt`) và Logo Topbar (`Vapas Quiz`).
- **Tránh tràn chiều rộng Flexbox**: Thuộc tính toàn cục `* { min-width: 0 }` và `html, body { overflow-x: hidden }` được cấu hình để tránh hiện tượng vỡ khung hiển thị hoặc xuất hiện thanh cuộn ngang không mong muốn trên thiết bị di động.
- **Chế độ tối (Dark Mode)**: Kích hoạt bằng cách thêm class `.dark` vào thẻ `<html>`. Sử dụng cấu hình biến thể tùy chỉnh trong CSS:
  * `@custom-variant dark (&:where(.dark, .dark *));`
  * Trong React sử dụng cú pháp: `dark:bg-slate-950 dark:text-slate-100`.

---

## 3. Phong cách Quản lý Trạng thái (Zustand v5 Patterns)

Để tránh hiện tượng ứng dụng bị giật lag do kích hoạt re-render hàng loạt component khi cập nhật bộ đếm thời gian:

- **Bên trong React Component**: Chỉ sử dụng các selector cụ thể để đăng ký lắng nghe thuộc tính cần dùng. **Tuyệt đối không đăng ký cả store**.
  * *Đúng*: `const theme = useQuizStore((state) => state.theme);`
  * *Sai*: `const { theme, setTheme } = useQuizStore();` (Gây re-render component khi bộ đếm giờ chạy).
- **Bên ngoài React (Event handlers, callbacks, Worker message)**: Sử dụng phương thức truy cập trực tiếp `getState()` hoặc `setState()` của Zustand để tránh đăng ký lắng nghe.
  * *Đúng*: `useQuizStore.getState().setTheme('dark');`

---

## 4. Ràng buộc Kiểu dữ liệu (Typing & TypeScript Style)

- Dự án chạy ở chế độ **TypeScript strict mode** (`"strict": true`). Mọi biến, tham số hàm và giá trị trả về của hàm tiện ích đều phải được định nghĩa kiểu rõ ràng. Hạn chế tối đa việc sử dụng kiểu `any`.
- Các kiểu dữ liệu quan trọng như `Question`, `Option`, `DisplayBlock`, `CreatorFile` được định nghĩa tập trung ở `parserCore.ts` và `quizStore.ts` để đảm bảo tính nhất quán trên toàn bộ ứng dụng.

---

## 5. Xử lý Bất đồng bộ & Lỗi (Async & Error Handling)

- **Tệp tin (File input)**: Việc đọc tệp tin bắt buộc phải bọc trong khối `try/catch` ở cả luồng Worker và luồng Main thread fallback để tránh sập ứng dụng khi người dùng tải lên tệp tin bị hỏng cấu trúc.
- **Lưu trữ cục bộ (localStorage quota)**: Khi gọi `localStorage.setItem`, luôn bọc trong khối `try/catch` để chủ động bắt lỗi tràn bộ nhớ (`QuotaExceededError`) và đưa ra cảnh báo thân thiện thông qua `NotificationToast` thay vì để trình duyệt tự sập hoặc mất dữ liệu đột ngột.
