# Hướng dẫn chi tiết Component (Components)

Tài liệu này cung cấp tài liệu kỹ thuật chi tiết cho các thành phần giao diện (React Components) cốt lõi của ứng dụng **Vapas Quiz**.

---

## 1. FileManager (`src/components/FileManager.tsx`)
- **Mục đích**: Cột bên trái trong giao diện "Tạo Quiz". Quản lý danh sách duy nhất các tệp đề thi **Tệp trắc nghiệm (Quiz File)** (giới hạn tối đa 10 tệp).
- **Giao diện & Nhãn tiếng Việt**:
  - `Quản Lý Tệp` (Header chính dạng Title Case, in đậm `font-bold text-lg`).
  - Dòng danh sách tệp gộp số lượng file trực tiếp: `Danh Sách Tệp ({creatorFiles.length}/10)` (ví dụ: `Danh Sách Tệp (3/10)`). Nút `Thêm tệp` nằm cùng hàng với text này và căn lề phải.
  - Cấu trúc File Card tối ưu: Dòng 2 bên dưới tên tệp hiển thị số lượng câu hỏi và dung lượng lưu trữ. Loại bỏ hoàn toàn sự kiện lắng nghe phím `Delete` toàn cục để tránh xóa nhầm tệp khi người dùng nhấn Delete trong ô nhập liệu.
- **Trạng thái cục bộ (State)**:
  * Quản lý mở/đóng hộp thoại tạo tệp mới (`isCreateModalOpen`) hỗ trợ chọn nhiều file nguồn khả dụng để gộp thành file mới.
- **Logic quan trọng**:
  * Đọc tệp tin tải lên máy qua `parseFile` bất đồng bộ (hỗ trợ .txt, .json, .docx, .pdf, và OCR hình ảnh).
  * Trích xuất toàn bộ câu hỏi (kể cả câu chưa hoàn thiện đáp án) để đẩy vào File Manager cho người dùng chỉnh sửa.
  * **Kiểm tra giới hạn dung lượng trước khi thêm**: Dự phóng kích thước mảng `creatorFiles` sau khi thêm tệp mới, so sánh với `STORAGE_LIMIT_BYTES` (4.5MB) để ngăn lỗi tràn `localStorage`.
  * Hiển thị thanh tiến trình dung lượng (Storage bar) của bộ nhớ File Manager.
- **Lỗi thường gặp**: Tải lên tệp quá lớn có thể kích hoạt cảnh báo vượt hạn mức dung lượng. Cần xóa bớt các tệp cũ để tiếp tục.

---

## 2. QuestionModification (`src/components/QuestionModification.tsx`)
- **Mục đích**: Cột trung tâm trong giao diện "Tạo Quiz". Cung cấp giao diện trực quan chuyên nghiệp để biên tập chi tiết câu hỏi trắc nghiệm.
- **Bố cục Fluid & Breakpoint Desktop**:
  * Duy trì bố cục 3 cột linh hoạt (`grid-cols-3` với `repeat(3, minmax(0, 1fr))` và `min-w-0`) trên màn hình desktop/laptop ngay cả khi viewport bị thu hẹp (~900px - 1280px). Chỉ chuyển về layout 1 cột khi màn hình nhỏ hơn mức tablet/mobile (`< 768px`).
- **Các tab chính**:
  * **Tài Liệu**: Nhập tài liệu ôn tập bằng Markdown hoặc xem trước kết quả hiển thị lý thuyết.
  * **Câu Hỏi**: Chỉnh sửa trực quan các câu hỏi dạng Panel split-view (danh sách câu hỏi bên phải, form chỉnh sửa nội dung/đáp án/tags/display block/explanation bên trái).
- **Quy tắc UI & Tinh chỉnh Giao diện**:
  * **Thanh Header & Nút thao tác**:
    * Tiêu đề tên file active định dạng Title Case: `{activeFile.name}` in đậm `font-bold text-lg`.
    * Bộ nút **Hoàn tác / Làm lại (Undo / Redo)** nằm sát bên trái nút `Tài Liệu` trên thanh Header chính.
    * Bộ 3 nút thao tác: **`Tạo Quiz Nhanh`** (AI Supplement) -> **`Bộ lọc & Sắp xếp`** -> **`Thêm câu hỏi`**.
  * **Question Card (Trình biên tập câu hỏi)**:
    * Tiêu đề `Câu hỏi X` mang cỡ chữ `text-lg font-semibold`.
    * **Đồng bộ hóa Input Fields**: Tất cả các ô nhập liệu/textarea/select/dropdown (`Nội dung`, `Đáp án A/B/C/D`, `Loại câu hỏi`, `Thẻ phân loại`, `Khối hiển thị`, `Giải thích`) đều sử dụng chung 1 định dạng: **`text-base font-normal`**.
    * Khi xóa câu hỏi $i$, hệ thống tự động chọn lại câu hỏi $i - 1$ ngay phía trước nó (hoặc câu 0 nếu xóa câu 0).
  * **Dialog "Tạo Quiz Nhanh" (SupplementComponentModal)**:
    * Tiêu đề dialog: `Tạo Quiz Nhanh` (`text-xl font-bold`), không có icon bên trái.
    * 2 tab: `Đáp Án & Giải Thích` và `Danh sách câu hỏi` (không có icon tab).
    * Loại bỏ hoàn toàn khối AI callout box và cơ chế upload file JSON (chỉ dùng paste dữ liệu).
    * Giảm 1 level text size của các ô Textarea nội dung xuống **`text-sm font-normal`**.
    * Loại bỏ viền outline/focus ring trắng của các ô nhập liệu và bộ chuyển chế độ áp dụng.
- **Tối ưu hóa & Logic quan trọng**:
  * Tạo chuỗi băm primitive `tagsKey` cho `allUniqueTags` và `useEffect` giúp triệt tiêu hoàn toàn lỗi re-render lặp vô hạn `Maximum update depth exceeded` khi gõ phím.
  * Bộ lọc câu hỏi (`filterType`, `filterOthers`) và bộ sắp xếp đa lớp.

---

## 3. SettingExport (`src/components/SettingExport.tsx`)
- **Mục đích**: Cột bên phải trong giao diện "Tạo Quiz". Quản lý siêu dữ liệu (metadata), ghi chú, thống kê và xuất bản đề thi.
- **Giao diện & Nhãn tiếng Việt**:
  - `Cài Đặt & Xuất Bản` (Header chính dạng Title Case, in đậm `font-bold text-lg`), `Tên tệp tin`, `Trạng thái`, `Chỉnh sửa lần cuối`, `Ghi chú`, `Xuất bản` (Nút xuất file).
- **Logic quan trọng**:
  * Tự động kiểm thử tính hợp lệ (Auto Evaluate Status) của tệp tin: Phát hiện đề trống (`Empty File`), lỗi cấu trúc (`Syntax Error`), thiếu lựa chọn đáp án (`Missing Answer Option`), hoặc chưa chọn đáp án đúng (`Missing Correct Answer`).
  * Giới hạn ghi chú ghi tối đa **200 từ**. Nếu nhập vượt quá, hệ thống sẽ tự động cắt ngắn chuỗi tại từ thứ 200.
  * Vẽ biểu đồ hình quạt (Pie chart) biểu diễn phân phối tỉ trọng các Tags bằng mã SVG thuần túy.
  * Xuất bản tệp đề thi (JSON hoặc văn bản DOCX) dựa trực tiếp trên `activeFile` trong Zustand Store, độc lập hoàn toàn với việc hiển thị tab Mã nguồn.

---

## 4. Sidebar (`src/components/Sidebar.tsx`)
- **Mục đích**: Bảng cài đặt tùy chỉnh làm bài thi và quản lý nguồn dữ liệu dưới dạng drawer.
- **Giao diện & Tối ưu hóa**:
  * Hộp thoại Cài đặt (Quiz Settings Modal): Nhóm tùy chỉnh chung được gom lại dưới dạng nhóm **Tùy chỉnh chung** (thứ tự: Giao diện -> Tương tác -> Số lượng câu hỏi -> Thời gian) cùng cấp với **Nguồn dữ liệu**, có thanh tiêu đề sticky khi cuộn.
  * Thẻ Nguồn dữ liệu (VirtualSourceCard): Tên tùy chỉnh hiển thị inline `Tên mới - (Tên gốc)` với chiều cao thẻ nén gọn `72px`, hiển thị dung lượng file sát góc phải.
  * **Tối ưu hóa Router**: Nâng hook `useRouter()` ra khỏi từng thẻ card danh sách ảo (`VirtualSourceCard`) đưa lên cấp `SidebarList` và truyền callback `onViewDocument`, sửa triệt để lỗi Next.js Turbopack Dev `Internal Next.js error: Router action dispatched before initialization`.
- **Logic quan trọng**:
  * Đồng bộ cơ chế nạp file với File Manager: Cho phép tải các định dạng `.txt`, `.json`, `.docx`, `.pdf`, và hình ảnh.

---

## 5. SourceAllocation (`src/components/SourceAllocation.tsx`)
- **Mục đích**: Thanh phân bổ tỷ lệ câu hỏi khi người dùng chọn số lượng câu hỏi tùy chỉnh (Custom Question Mode).
- **Logic quan trọng**:
  * Tự động cân bằng lại tỷ lệ câu hỏi (Rebalancing) theo tỷ lệ thuận với số lượng câu hỏi tối đa hiện có của mỗi tệp nguồn khi người dùng thay đổi số câu hỏi cần làm.
  * Cung cấp các tay nắm phân tách trên thanh tiến trình cho phép người dùng kéo thả trực tiếp để tăng/giảm tỷ lệ câu hỏi từ nguồn tương ứng.

---

## 6. MainQuiz (`src/components/MainQuiz.tsx`)
- **Mục đích**: Bộ điều khiển giao diện làm bài thi trắc nghiệm.
- **Logic quan trọng**:
  * Quản lý bộ đếm giờ (`Timer` component). Tự động nộp bài khi hết giờ ở chế độ `LIMITED`.
  * Phối hợp các phím tắt bàn phím tiện lợi: Phím `A`/`B`/`C`/`D` để chọn đáp án tương ứng, phím `Enter` để xác nhận/chuyển câu, phím `Escape` để thoát/hủy hộp thoại, phím `P` để tạm dừng làm bài (Pause) và phím `S` để nộp bài sớm.
  * Trình chiếu hiệu ứng mượt mà khi chuyển đổi câu hỏi thông qua Framer Motion.

---

## 7. ResultScreen (`src/components/ResultScreen.tsx`)
- **Mục đích**: Màn hình tổng kết quả thi và sửa các câu sai.
- **Logic quan trọng**:
  * Biểu diễn thời gian làm bài trung bình dưới dạng biểu đồ cột SVG. Người dùng có thể click vào từng cột để xem thông tin popover chi tiết của câu hỏi tương ứng.
  * Hỗ trợ tính năng **"Làm lại các câu sai (Retry Incorrect)"**: Cho phép thiết lập bổ sung thêm câu hỏi ngẫu nhiên (`RANDOM`) hoặc các câu hỏi tốn nhiều thời gian nhất của lượt làm trước (`TIME`).

---

## 8. MarkdownRenderer (`src/components/MarkdownRenderer.tsx`)
- **Mục đích**: Hiển thị tài liệu Markdown lý thuyết.
- **Logic quan trọng**:
  * Chia nhỏ nội dung và vẽ progressive (progressive rendering) thông qua `requestAnimationFrame` để giữ UI mượt mà, chống đơ màn hình khi tải tài liệu lý thuyết dài hàng chục trang.
