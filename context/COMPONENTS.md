# Hướng dẫn chi tiết Component (Components)

Tài liệu này cung cấp tài liệu kỹ thuật chi tiết cho các thành phần giao diện (React Components) cốt lõi của ứng dụng **Vapas Quiz**.

---

## 1. FileManager (`src/components/FileManager.tsx`)
- **Mục đích**: Cột bên trái trong giao diện "Tạo Quiz". Quản lý danh sách các tệp đề thi (Quiz File) và tệp tài liệu hỗ trợ (Supported File).
- **Trạng thái cục bộ (State)**:
  * `expandedQuizFiles`: Bản ghi các file quiz đang được mở rộng danh sách file liên kết.
  * Các state quản lý mở đóng hộp thoại tạo tệp (`isCreateModalOpen`) và liên kết tệp hỗ trợ (`isAddSupportModalOpen`).
- **Logic quan trọng**:
  * Đọc tệp tin tải lên máy qua `parseFile` chạy bất đồng bộ.
  * **Kiểm tra giới hạn dung lượng trước khi thêm**: Dự phóng kích thước mảng `creatorFiles` sau khi thêm tệp mới, so sánh với `STORAGE_LIMIT_BYTES` (4.5MB) để ngăn lỗi tràn `localStorage`.
  * Hiển thị thanh tiến trình dung lượng (Storage bar) phân tách thành 2 màu: Indigo (Nguồn dữ liệu) và Amber (Tệp tạo quiz).
- **Lỗi thường gặp**: Tải lên tệp quá lớn có thể kích hoạt cảnh báo vượt hạn mức dung lượng. Cần xóa bớt các tệp cũ để tiếp tục.

---

## 2. QuestionModification (`src/components/QuestionModification.tsx`)
- **Mục đích**: Cột trung tâm trong giao diện "Tạo Quiz". Cung cấp giao diện trực quan để chỉnh sửa câu hỏi trắc nghiệm hoặc sửa đổi trực tiếp cấu trúc JSON gốc của tệp tin.
- **Các tab chính**:
  * **Document**: Nhập tài liệu ôn tập bằng Markdown hoặc xem trước kết quả hiển thị lý thuyết.
  * **Question View**: Chỉnh sửa trực quan các câu hỏi. Hỗ trợ hiển thị dạng Panel split-view (danh sách câu hỏi bên phải, form chỉnh sửa nội dung/đáp án/tags bên trái).
  * **Code View**: IDE Editor (`IdeEditor`) tích hợp PrismJS để sửa JSON thô trực tiếp.
- **Logic quan trọng**:
  * Tự động kiểm tra và báo lỗi cú pháp JSON thời gian thực khi chỉnh sửa trong Code View thông qua hàm `parseQuizJson`.
  * Bộ lọc câu hỏi (`filterType`, `filterOthers`) và bộ sắp xếp đa lớp (theo độ ưu tiên của loại câu hỏi hoặc thứ tự của nhãn tag).
- **Lỗi thường gặp**: Chỉnh sửa JSON sai cú pháp (như thiếu dấu phẩy, ngoặc) sẽ bị khóa lưu và hiển thị thông báo lỗi chi tiết. Cần sửa đúng định dạng schema để có thể nhấn lưu.

---

## 3. SettingExport (`src/components/SettingExport.tsx`)
- **Mục đích**: Cột bên phải trong giao diện "Tạo Quiz". Quản lý siêu dữ liệu (metadata), ghi chú, thống kê và xuất bản đề thi.
- **Logic quan trọng**:
  * Tự động kiểm thử tính hợp lệ (Auto Evaluate Status) của tệp tin: Phát hiện đề trống (`Empty File`), lỗi cấu trúc (`Syntax Error`), thiếu lựa chọn đáp án (`Missing Answer Option`), hoặc chưa chọn đáp án đúng (`Missing Correct Answer`).
  * Giới hạn ghi chú ghi tối đa **200 từ**. Nếu nhập vượt quá, hệ thống sẽ tự động cắt ngắn chuỗi tại từ thứ 200.
  * Vẽ biểu đồ hình quạt (Pie chart) biểu diễn phân phối tỉ trọng các Tags bằng mã SVG thuần túy (dựa trên thuật toán tính góc tích lũy `cumulativePercentage`).
  * Xuất bản tệp đề thi (JSON hoặc văn bản DOCX) hỗ trợ cắt lát câu hỏi (Range, First N, Last N) và áp dụng cấu hình bộ lọc động.

---

## 4. Sidebar (`src/components/Sidebar.tsx`)
- **Mục đích**: Bảng cài đặt hiển thị dưới dạng popup modal khi chuẩn bị bắt đầu làm bài kiểm tra ở trang chủ.
- **Logic quan trọng**:
  * Quản lý tải lên tệp tin nguồn dữ liệu (.docx, .txt, .json).
  * Hỗ trợ kéo thả sắp xếp thứ tự tệp nguồn trắc nghiệm bằng cơ chế HTML5 Drag & Drop thuần túy (`VirtualSourceCard`).
  * Sử dụng state cục bộ cho tất cả cấu hình (`localShowResult`, `localAutoNext`,...) và chỉ ghi đè vào Zustand Store khi người dùng nhấn nút **"Lưu"**. Nếu nhấn "Hủy" hoặc đóng popup, các thay đổi tạm thời sẽ bị hủy bỏ.
- **Lỗi thường gặp**: Kéo thả trên thiết bị di động có thể khó khăn nếu không chạm đúng vào tay cầm kéo (`GripVertical`). Do đó, tay cầm kéo được tối ưu hóa tăng kích thước vùng chạm trên màn hình cảm ứng.

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
