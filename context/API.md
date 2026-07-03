# Tài liệu API (API)

Tài liệu này mô tả chi tiết giao diện giao tiếp dữ liệu nội bộ (Internal APIs & Interfaces) của ứng dụng **Vapas Quiz**.

## 1. Không có API Backend (No Backend API Endpoints)

Vì ứng dụng chạy **Client-Only**, không có bất kỳ điểm cuối HTTP API (RESTful, GraphQL hay gRPC) nào được triển khai trên máy chủ trong dự án này.

---

## 2. Giao diện Phân tích Cú pháp (Internal Parser APIs)

Ứng dụng giao tiếp thông qua các hàm tiện ích phân tích cú pháp tệp dữ liệu được định nghĩa tại `src/lib/parserCore.ts` và `src/lib/parser.ts`:

### A. Hàm `parseFile`
- **Mục đích**: Nhận tệp từ giao diện người dùng và trả về kết quả phân tích.
- **Cú pháp**: `export async function parseFile(file: File): Promise<ParseResult>`
- **Giá trị trả về**: Trả về một `Promise` chứa đối tượng `ParseResult`.

### B. Hàm `parseQuizText`
- **Mục đích**: Nhận chuỗi văn bản thô (từ tệp .txt hoặc tệp .docx đã được trích xuất) và phân tích thành danh sách câu hỏi.
- **Cú pháp**: `export function parseQuizText(rawText: string, isDocx: boolean = false): ParseResult`

### C. Hàm `parseQuizJson`
- **Mục đích**: Nhận chuỗi JSON thô và phân tích cấu trúc, kiểm tra tính hợp lệ trước khi nạp vào hệ thống.
- **Cú pháp**: `export function parseQuizJson(rawText: string): ParseResult`

---

## 3. Cấu trúc Kiểu Dữ liệu Giao tiếp (Data Schema Interfaces)

Các mô-đun trao đổi dữ liệu thông qua các interface TypeScript nghiêm ngặt dưới đây:

### Interface `ParseResult`
```typescript
export interface ParseResult {
  questions: Question[];                  // Danh sách câu hỏi phân tích được
  isValid: boolean;                       // Tệp có hợp lệ hay không (không có lỗi cú pháp nghiêm trọng)
  error?: string;                         // Chi tiết lỗi nếu isValid = false
  metadata?: {
    file_name: string;                    // Tên tệp dữ liệu gốc
    question_count: number;               // Số lượng câu hỏi
    last_modified: number | string;       // Thời gian sửa đổi cuối cùng
  };
  document?: string;                      // Nội dung tài liệu lý thuyết Markdown đi kèm (nếu có)
  note?: string;                          // Ghi chú đính kèm của đề thi (nếu có)
}
```

### Interface `Question`
```typescript
export interface Question {
  id: string;                             // Định danh duy nhất cho câu hỏi
  text: string;                           // Nội dung văn bản câu hỏi
  options: Option[];                      // Các phương án lựa chọn
  correctOptionIds: string[];             // Danh sách ID của các đáp án đúng
  type: "single_choice" | "multiple_choice"; // Loại câu hỏi (Một đáp án / Nhiều đáp án)
  display_block?: DisplayBlock | null;    // Khối hiển thị đi kèm (Tương thích định dạng cũ)
  display_blocks?: DisplayBlock[];        // Danh sách các khối hiển thị (Ảnh hoặc Code)
  explanation?: string | null;            // Hướng dẫn giải thích chi tiết
  tags?: string[];                        // Các nhãn thẻ phân loại đề tài (Tối đa 5 thẻ, mỗi thẻ tối đa 16 ký tự)
  sourceId?: string;                      // ID của tệp nguồn chứa câu hỏi
  sourceName?: string;                    // Tên hiển thị của tệp nguồn
}
```

### Interface `Option`
```typescript
export interface Option {
  id: string;                             // ID ngẫu nhiên hoặc ký tự A-D
  text: string;                           // Nội dung đáp án lựa chọn đã lọc nhãn
  originalText: string;                   // Văn bản đáp án gốc dạng "A. Nội dung..."
}
```

### Interface `DisplayBlock`
```typescript
export interface DisplayBlock {
  type: string;                           // Loại khối ("code" hoặc "image")
  content: string;                        // Nội dung khối (Đoạn code thô hoặc URL hình ảnh)
}
```
