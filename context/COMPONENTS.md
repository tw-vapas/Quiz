# Hướng dẫn chi tiết Component (Components)

Tài liệu này cung cấp tài liệu kỹ thuật chi tiết cho các thành phần giao diện (React Components) cốt lõi của ứng dụng **Vapas Quiz**.

---

## 1. FileManager (`src/components/FileManager.tsx`)
- **Mục đích**: Cột bên trái trong giao diện "Tạo Quiz". Quản lý danh sách duy nhất các tệp đề thi **Tệp trắc nghiệm (Quiz File)** (giới hạn tối đa 10 tệp).
- **Giao diện & Nhãn tiếng Việt**:
  - `Quản lý tệp` (Header chính), `Thêm tệp` (Nút tạo file mới), `Tệp trắc nghiệm` (Danh sách tệp).
  - Cấu trúc File Card tối ưu: Dòng 2 bên dưới tên tệp chỉ hiển thị số lượng câu hỏi (ví dụ: `10 câu hỏi`). Dung lượng tệp tin (File size) hiển thị gọn gàng góc phải bên trái nút Thùng rác. Đã gỡ bỏ badge dấu check/X để giao diện tối giản.
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
- **Các tab chính**:
  * **Tài Liệu**: Nhập tài liệu ôn tập bằng Markdown hoặc xem trước kết quả hiển thị lý thuyết.
  * **Câu Hỏi**: Chỉnh sửa trực quan các câu hỏi dạng Panel split-view (danh sách câu hỏi bên phải, form chỉnh sửa nội dung/đáp án/tags/display block/explanation bên trái).
  * *(Ghi chú: Tab **Mã nguồn / Code View** đã được loại bỏ hoàn toàn để tinh gọn trải nghiệm; tính năng Xuất bản file độc lập ở cột Setting & Export vẫn đảm bảo xuất đúng chuẩn dữ liệu).*
- **Quy tắc UI & Tinh chỉnh Giao diện**:
  * **Thanh Header & Nút thao tác**:
    * Bộ nút **Hoàn tác / Làm lại (Undo / Redo)** nằm sát bên trái nút `Tài Liệu` trên thanh Header chính, thiết kế dạng icon button phẳng mượt mà.
    * Thống kê tổng số câu hỏi định dạng: `Tổng cộng: X câu hỏi` (hoặc `Tổng cộng: X/Y câu hỏi` khi đang lọc).
    * Bộ 3 nút thao tác căn thứ tự từ trái sang phải: **`Tạo Quiz Nhanh`** (AI Supplement) -> **`Bộ lọc & Sắp xếp`** -> **`Thêm câu hỏi`**. Thiết kế dạng thẻ phẳng không viền outline trắng, cỡ chữ đồng bộ `10px`.
  * **Question Card (Trình biên tập câu hỏi)**:
    * Tiêu đề `Câu hỏi X` mang cỡ chữ nổi bật (`text-base md:text-lg font-extrabold`). Icon tròn Hợp lệ (Check/X) nằm bên trái nút Thùng rác xóa câu hỏi.
    * Tất cả các tiêu đề mục (`Nội dung`, `Đáp án`, `Loại câu hỏi`, `Thẻ phân loại`, `Khối hiển thị`, `Loại khối`, `Nội dung khối`, `Giải thích`) chuẩn phong cách **Sentence Case**, font chữ màu **trắng `#FFFFFF`** (`text-sm md:text-base font-bold`).
    * Ô nhập **Nội dung** câu hỏi có bộ đếm `x/1000` ký tự.
    * Ô nhập **Đáp án**: Tự động căn giữa nội dung theo chiều dọc (`my-auto`, `leading-normal`) chuẩn hàng với nút chọn và nút xóa.
    * **Display Block**: Chiều cao ô nhập nội dung ban đầu bằng với ô chọn `Loại khối` (`32px`), tự động mở rộng theo dòng gõ (tối đa 5 dòng / `108px`), tự kích hoạt thanh cuộn mảnh (`custom-scrollbar` / 4px thin) khi vượt quá 5 dòng.
- **Tối ưu hóa & Logic quan trọng**:
  * Tạo chuỗi băm primitive `tagsKey` cho `allUniqueTags` và `useEffect` giúp triệt tiêu hoàn toàn lỗi re-render lặp vô hạn `Maximum update depth exceeded` khi gõ phím.
  * Bộ lọc câu hỏi (`filterType`, `filterOthers`) và bộ sắp xếp đa lớp (theo độ ưu tiên của loại câu hỏi hoặc thứ tự của nhãn tag).

---

## 3. SettingExport (`src/components/SettingExport.tsx`)
- **Mục đích**: Cột bên phải trong giao diện "Tạo Quiz". Quản lý siêu dữ liệu (metadata), ghi chú, thống kê và xuất bản đề thi.
- **Giao diện & Nhãn tiếng Việt**:
  - `Cài đặt & Xuất bản` (Header chính), `Thông tin chung` (Khu vực thông tin tệp), `Tên`, `Trạng thái`, `Chỉnh sửa lần cuối`, `Xuất bản` (Nút xuất file).
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
