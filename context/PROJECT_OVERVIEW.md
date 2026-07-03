# Tổng quan Dự án (Project Overview)

Tài liệu này cung cấp cái nhìn tổng quan về mục đích, đối tượng người dùng, tính năng chính và triết lý phát triển của ứng dụng **Vapas Quiz**.

## 1. Mục đích Dự án (Project Purpose)
**Vapas Quiz** là một ứng dụng web chạy trực tiếp trên trình duyệt, cho phép người dùng tự ôn luyện và kiểm tra kiến thức trắc nghiệm từ các nguồn tài liệu thô. Ứng dụng tập trung vào việc chuyển đổi dễ dàng các tài liệu văn bản thông thường thành các bộ câu hỏi trắc nghiệm có cấu trúc để làm bài hoặc xuất bản.

## 2. Lĩnh vực Nghiệp vụ (Business Domain)
Dự án nằm trong lĩnh vực Công nghệ Giáo dục (EdTech), cụ thể là công cụ hỗ trợ ôn thi và tự học. Nó giải quyết nhu cầu chuyển đổi nhanh chóng các đề thi dạng văn bản thô (Word, Text) hoặc các gói tài liệu học tập có sẵn thành định dạng câu hỏi trắc nghiệm tương tác trực quan.

## 3. Các Tính năng Chính (Major Features)
- **Làm Quiz (Quiz Execution)**:
  - Trộn ngẫu nhiên thứ tự câu hỏi và thứ tự các đáp án lựa chọn để chống học vẹt.
  - Hỗ trợ chế độ giới hạn thời gian (countdown timer) hoặc không giới hạn.
  - Hiển thị kết quả đúng/sai và giải thích chi tiết ngay sau khi chọn đáp án (tùy chọn) hoặc sau khi nộp bài.
  - Phân bổ số lượng câu hỏi tùy chỉnh theo tỷ lệ từ nhiều tệp nguồn dữ liệu khác nhau.
  - Tự động lưu trữ tiến trình làm bài, cho phép tạm dừng (Pause) và tiếp tục làm bài.
  - Phân tích thống kê thời gian làm bài trung bình cho từng câu hỏi và vẽ biểu đồ phân phối trực quan ở màn hình kết quả.
  - Cho phép làm lại riêng các câu trả lời sai kèm theo cơ chế bổ sung thêm câu hỏi ngẫu nhiên hoặc câu hỏi tốn nhiều thời gian.
- **Trình kiến tạo câu hỏi (Creator Suite)**:
  - **Quản lý tệp (File Manager)**: Hỗ trợ tạo mới, chỉnh sửa và quản lý các tệp đề thi (Quiz File) và tệp dữ liệu hỗ trợ (Supported File).
  - **Biên soạn trực quan (Visual Editor)**: Tạo câu hỏi mới, chỉnh sửa nội dung, đáp án lựa chọn, gán thẻ (Tags), đính kèm khối mã nguồn/hình ảnh (Display Block) và nội dung giải thích (Explanation).
  - **Chỉnh sửa mã JSON (Code View)**: Hỗ trợ một IDE Editor tích hợp với tính năng tô màu cú pháp và kiểm lỗi JSON trước khi lưu.
  - **Biên soạn Tài liệu (Document Editor)**: Viết tài liệu ôn tập và ghi chú đi kèm dưới định dạng Markdown để người dùng học lý thuyết trước khi làm bài.
  - **Liên kết & Đồng bộ (Linking & Syncing)**: Liên kết nhiều tệp hỗ trợ (Supported Files) vào một đề thi lớn (Quiz File) và đồng bộ câu hỏi tự động.
  - **Xuất bản đề thi (Export)**: Cho phép tải xuống bộ đề dưới dạng tệp cấu trúc JSON hoặc tệp văn bản DOCX thô với các tùy chọn cắt lát câu hỏi (Range, First N, Last N).

## 4. Đối tượng Người dùng (Target Users)
- **Học sinh, sinh viên**: Sử dụng để tự ôn luyện các kỳ thi trắc nghiệm (THPT Quốc gia, Ngoại ngữ, Đại cương).
- **Giáo viên, người hướng dẫn**: Sử dụng công cụ này để nhanh chóng tạo, định dạng lại và xuất bản đề thi trắc nghiệm cho học sinh mà không cần các phần mềm soạn thảo phức tạp.

## 5. Kiến trúc Tổng thể (Overall Architecture)
Ứng dụng được xây dựng theo mô hình **SPA Client-Only** sử dụng Next.js 16 và React 19.
- **Không có Backend & Database**: Toàn bộ trạng thái ứng dụng được lưu trực tiếp trên trình duyệt qua `localStorage` và đồng bộ vào bộ nhớ tạm thông qua thư viện quản lý trạng thái Zustand v5.
- **Xử lý tệp bất đồng bộ**: Việc đọc tệp .docx, .txt, .json được ủy nhiệm cho một **Web Worker** để không gây đơ hoặc giật lag cho giao diện người dùng (Main UI Thread).

## 6. Triết lý Phát triển (Development Philosophy)
- **Offline & Bảo mật**: Dữ liệu hoàn toàn thuộc quyền sở hữu của người dùng, không tải lên bất kỳ máy chủ nào.
- **Trải nghiệm người dùng mượt mà (Aesthetics & Performance)**: Tận dụng Tailwind CSS v4, Framer Motion để tạo các hiệu ứng chuyển động mượt mà và giao diện tối giản, hiện đại.
- **Tối ưu kết cấu**: Chia nhỏ các tác vụ render lớn (ví dụ: Progressive Rendering đối với tài liệu Markdown dài) để đảm bảo app luôn phản hồi nhanh nhất.
