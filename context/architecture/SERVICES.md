# Dịch vụ Hệ thống (Services)

Tài liệu này giải thích cách hoạt động của các tầng xử lý dữ liệu và dịch vụ trong ứng dụng **Vapas Quiz**.

## 1. Không sử dụng Dịch vụ Mạng Ngoại vi (No External Network Services)

Do đặc thù kiến trúc **Client-Only**, ứng dụng **Vapas Quiz** không gọi hay tương tác với bất kỳ dịch vụ mạng ngoại vi (external HTTP/gRPC API services) nào. Toàn bộ logic ứng dụng hoạt động độc lập và ngoại tuyến (offline) ngay trên trình duyệt của người dùng.

---

## 2. Dịch vụ Phân tích Tập tin (File Parsing Service)

Ứng dụng cung cấp một dịch vụ cục bộ chuyên trách xử lý và chuyển đổi định dạng tệp tin đề thi thô được nhập vào thành cấu trúc dữ liệu chuẩn của hệ thống. Dịch vụ này được thiết kế theo mô hình bất đồng bộ, hoạt động chính trên Web Worker và có luồng dự phòng (fallback) trên Main Thread.

### A. Luồng chính: Dịch vụ Web Worker (`src/lib/parser.worker.ts`)
Khi người dùng tải lên một tệp tin, trình điều phối sẽ gửi thông điệp dạng `postMessage` chứa nội dung tệp ở dạng `ArrayBuffer` sang Web Worker. Việc truyền dữ liệu dạng này tận dụng tối đa cơ chế *Transferable Objects* giúp chuyển quyền sở hữu bộ nhớ trực tiếp mà không cần sao chép dữ liệu (zero-copy memory performance), tối ưu hóa tốc độ đối với các tệp đề thi lớn.

Web Worker thực hiện dịch vụ phân tích theo quy trình:
1. Nhận thông điệp chứa `fileContents` và `fileName`.
2. Kiểm tra phần mở rộng của tệp tin để kích hoạt bộ giải mã phù hợp:
   - **Tệp .json**: Giải mã bằng `TextDecoder("utf-8")` và gọi bộ phân tích cú pháp JSON `parseQuizJson`.
   - **Tệp .txt**: Giải mã bằng `TextDecoder("utf-8")` và gọi bộ phân tích cú pháp Text `parseQuizText`.
   - **Tệp .docx**: Sử dụng thư viện `mammoth` trích xuất toàn bộ văn bản thô từ luồng nhị phân, sau đó gửi chuỗi ký tự sang bộ phân tích cú pháp `parseQuizText` (gán cờ `isDocx = true` để chuẩn hóa khoảng cách dòng đặc thù của định dạng Word).
3. Gửi thông điệp trả kết quả về Main Thread:
   - Nếu thành công: Gửi kèm đối tượng `ParseResult` hợp lệ.
   - Nếu xảy ra lỗi: Gửi mã lỗi tương ứng.

### B. Luồng dự phòng: Main Thread Fallback (`src/lib/parser.ts`)
Trong trường hợp môi trường chạy không hỗ trợ Web Worker (ví dụ: trình duyệt quá cũ, môi trường SSR của Next.js hoặc khi chạy kiểm thử), hàm `parseFile` sẽ tự động chuyển sang luồng xử lý dự phòng:
- Hàm `parseFileMainThread` được gọi và thực thi đồng bộ ngay trên luồng giao diện chính.
- Quy trình phân tích tương tự Web Worker nhưng có thể gây hiện tượng đơ nhẹ giao diện đối với các tệp cực lớn do mammoth.js phải chặn Main Thread để đọc cấu trúc tệp Word.
- Cơ chế bọc khối `try/catch` toàn bộ quy trình đảm bảo nếu cả hai luồng xử lý đều thất bại, ứng dụng vẫn hiển thị lỗi thân thiện thông qua `NotificationToast` thay vì làm sập trang.
