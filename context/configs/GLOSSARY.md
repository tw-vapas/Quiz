# Thuật ngữ Dự án (Glossary)

Tài liệu này giải nghĩa các thuật ngữ kỹ thuật và khái niệm nghiệp vụ đặc thù được sử dụng trong mã nguồn và tài liệu của dự án **Vapas Quiz**.

---

## 1. Các Khái niệm Lưu trữ & Tệp tin

- **SourceFile (Tệp nguồn dữ liệu)**:
  * Khai báo kiểu dữ liệu mở rộng từ `LearningPackage`. Đây là thực thể đại diện cho các tệp đề thi/tài liệu học tập được tải lên từ máy tính của người dùng và lưu trữ trong mảng `sources` của Zustand Store.
- **CreatorFile (Tệp soạn thảo)**:
  * Khai báo kiểu dữ liệu biểu diễn các tệp tin được tạo và chỉnh sửa trực tiếp bởi người dùng trong phân hệ "Tạo Quiz". Có hai phân loại chính là `QUIZ` và `SUPPORT`.
- **Quiz File (Đề thi chính)**:
  * Một phân loại của `CreatorFile` (gán thuộc tính `type: "QUIZ"`). Đây là tệp đề thi hoàn chỉnh dùng để thi trắc nghiệm trực tiếp hoặc xuất bản thành file ngoại vi. Hạn mức tối đa được tạo trong hệ thống là **5 tệp**.
- **Supported File (Tài liệu hỗ trợ)**:
  * Một phân loại của `CreatorFile` (gán thuộc tính `type: "SUPPORT"`). Thường chứa ngân hàng câu hỏi theo chuyên đề hoặc tài liệu lý thuyết đi kèm. Được thiết kế để liên kết (link) vào Đề thi chính nhằm chia sẻ câu hỏi. Hạn mức tối đa được tạo là **15 tệp**.
- **LearningPackage (Gói học liệu)**:
  * Cấu trúc giao diện dữ liệu gốc đại diện cho một gói tài liệu học tập chuẩn hóa, bao gồm: siêu dữ liệu (`metadata`), nội dung tài liệu lý thuyết (`document`), ghi chú tác giả (`note`) và danh sách câu hỏi trắc nghiệm (`questions`).

---

## 2. Các Khái niệm Giao diện & Hiệu năng

- **DisplayBlock (Khối hiển thị)**:
  * Khối dữ liệu bổ trợ đính kèm trong câu hỏi trắc nghiệm. Hỗ trợ hai phân loại chính: `code` (khối mã nguồn tin học được tự động định dạng dòng và tô màu PrismJS) và `image` (khối hình ảnh minh họa cho câu hỏi).
- **Progressive Rendering (Kết xuất tiến trình)**:
  * Kỹ thuật tối ưu hóa hiệu năng render giao diện trong component `MarkdownRenderer`. Thay vì render toàn bộ tài liệu Markdown dài gây đơ trình duyệt, thuật toán chia văn bản thành mảng các khối độc lập và sử dụng `requestAnimationFrame` để tăng dần số lượng khối hiển thị sau mỗi khung hình.
- **Hydration (Nạp dữ liệu / Đồng bộ trạng thái)**:
  * Quá trình đọc dữ liệu cũ đã lưu từ `localStorage` của trình duyệt và nạp ngược lại vào bộ nhớ lưu trữ tạm thời Zustand Store khi ứng dụng khởi chạy trên máy khách, giúp khôi phục phiên làm việc trước đó của người dùng.
- **STORAGE_LIMIT_BYTES (Hạn mức lưu trữ an toàn)**:
  * Giới hạn an toàn dung lượng lưu trữ cục bộ của dự án được đặt ở mức **4.5 MB** (tương đương 4.5 * 1024 * 1024 bytes) nhằm dành lại 0.5MB dự phòng, tránh lỗi tràn bộ nhớ trình duyệt làm hỏng tệp hoặc gián đoạn hoạt động của trang web.
- **FISHER-YATES SHUFFLE**:
  * Thuật toán trộn mảng ngẫu nhiên có độ phức tạp thời gian tối ưu $O(N)$, được ứng dụng để trộn ngẫu nhiên thứ tự câu hỏi và thứ tự các đáp án lựa chọn A-D khi người dùng nhấn bắt đầu thi trắc nghiệm, ngăn chặn hiện tượng học vẹt đáp án.
- **Path Aliases (Bí danh đường dẫn)**:
  * Kỹ thuật cấu hình trong `tsconfig.json` cho phép viết các câu lệnh import từ thư mục gốc của dự án thông qua ký tự đại diện `@/` thay vì viết các đường dẫn tương đối dài dạng `../../`.
