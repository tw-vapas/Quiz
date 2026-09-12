# Vapas Quiz - Ứng dụng Biên soạn & Ôn luyện Trắc nghiệm

**Vapas Quiz** là ứng dụng web Client-Side (SPA) hiện đại, giúp người dùng dễ dàng chuyển đổi các tài liệu văn bản thô (Word, Text, JSON) thành các bộ câu hỏi trắc nghiệm tương tác trực quan để tự học, ôn thi và xuất bản đề thi.

---

## ✨ Tính năng chính

### 🎯 1. Ôn luyện & Làm Quiz (Quiz Execution)
- **Xáo trộn thông minh**: Trộn ngẫu nhiên thứ tự câu hỏi và đáp án lựa chọn để nâng cao hiệu quả ôn tập.
- **Chế độ thời gian linh hoạt**: Hỗ trợ đếm ngược thời gian hoặc làm bài không giới hạn.
- **Phân bổ tỷ lệ câu hỏi**: Cho phép lấy câu hỏi theo tỷ lệ tùy chỉnh từ nhiều nguồn tệp dữ liệu khác nhau.
- **Phân tích & Thống kê**: Đo lường thời gian làm bài trung bình từng câu hỏi, hiển thị biểu đồ phân phối trực quan ở màn hình kết quả.
- **Lưu tiến trình tự động**: Tạm dừng (Pause) và tiếp tục làm bài bất cứ lúc nào (lưu trữ qua `localStorage`).

### ✍️ 2. Trình kiến tạo & Quản lý Đề thi (Creator Suite)
- **Quản lý tệp (`FileManager`)**: Tạo mới, gộp nhiều tệp đề thi, quản lý kho tài liệu học tập.
- **Biên soạn trực quan (`Visual Editor`)**: Tạo và chỉnh sửa nội dung câu hỏi, đáp án, gán thẻ phân loại (`Tags`), đính kèm khối mã nguồn/hình ảnh (`DisplayBlock`) và lời giải thích.
- **Biên soạn tài liệu (`Document Editor`)**: Viết nội dung lý thuyết và ghi chú ôn tập dạng Markdown đi kèm bộ đề.
- **Cài đặt & Xuất bản (`SettingExport`)**: Cho phép xuất bản bộ đề thi thành định dạng `JSON` hoặc tệp `DOCX` với các tùy chọn cắt lát câu hỏi.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Framework**: Next.js 16 (App Router, Turbopack) & React 19
- **State Management**: Zustand v5 (kèm persistence qua `localStorage`)
- **Styling**: Tailwind CSS v4 & Lucide React Icons
- **Tối ưu hiệu năng**: Web Workers cho các tác vụ xử lý tệp (.docx, .json, .txt) nặng bất đồng bộ

---

## 🚀 Hướng dẫn Chạy ứng dụng

### 1. Cài đặt Phụ thuộc
```bash
npm install
```

### 2. Chạy Dev Server
```bash
npm run dev
```
Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng ứng dụng.

### 3. Kiểm tra TypeScript & Build
```bash
# Kiểm tra lỗi type
npx tsc --noEmit

# Build bản sản xuất
npm run build
```

---

## 📂 Cấu trúc Tài liệu Dự án

Tất cả tài liệu kiến trúc, specs và hướng dẫn phát triển được lưu trữ tại thư mục **`context/`**:
- [INDEX.md](file:///context/INDEX.md): Master Navigation Index
- [PROJECT_OVERVIEW.md](file:///context/overview/PROJECT_OVERVIEW.md): Tổng quan dự án & nghiệp vụ
- [ARCHITECTURE.md](file:///context/overview/ARCHITECTURE.md): Kiến trúc hệ thống
- [COMPONENTS.md](file:///context/architecture/COMPONENTS.md): Cấu trúc các UI components
