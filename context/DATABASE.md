# Cơ sở Dữ liệu & Lưu trữ (Database)

Tài liệu này mô tả cơ chế quản lý lưu trữ dữ liệu (Storage Engine) trong ứng dụng **Vapas Quiz**.

## 1. Không có Cơ sở Dữ liệu Máy chủ (No Server Database)

Ứng dụng hoạt động hoàn toàn độc lập phía máy khách (Client-Only), do đó **không sử dụng** các hệ thống cơ sở dữ liệu quan hệ (SQL) hay phi quan hệ (NoSQL) chạy trên server (như PostgreSQL, MySQL, MongoDB). 

---

## 2. Hệ lưu trữ Cục bộ: Browser `localStorage`

Toàn bộ dữ liệu của ứng dụng được lưu trực tiếp trên trình duyệt của người dùng thông qua API `localStorage`.

### Các khóa lưu trữ (Storage Keys) được sử dụng:
1. `vapas_quiz_settings`: 
   - **Mô tả**: Lưu cấu hình cài đặt chung.
   - **Định dạng**: Chuỗi JSON chứa trạng thái giao diện và cấu hình thi (`showResultAfterQuestion`, `autoNext`, `questionCountMode`, `customQuestionCount`, `theme`, `timeLimitMode`, `timeLimitMinutes`, `sourceAllocations`).
2. `vapas_quiz_sources`: 
   - **Mô tả**: Mảng chứa danh sách các nguồn dữ liệu câu hỏi ôn tập được nạp vào hệ thống (`SourceFile[]`).
3. `vapas_quiz_creator_files`:
   - **Mô tả**: Mảng chứa các tệp đề thi do người dùng tự soạn thảo hoặc chỉnh sửa (`CreatorFile[]`), bao gồm cả tệp đề thi (`QUIZ`) và tệp hỗ trợ (`SUPPORT`).
4. `vapas_quiz_creator_active_id`:
   - **Mô tả**: Lưu ID của tệp tin đang được mở biên soạn trong trình quản lý file.
5. `vapas_last_opened_document_id`:
   - **Mô tả**: Lưu ID của tài liệu ôn tập được mở đọc cuối cùng tại trang `/document`.

---

## 3. Quản lý Hạn mức Dung lượng (Storage Quota Management)

Trình duyệt giới hạn dung lượng lưu trữ tối đa cho mỗi tên miền đối với `localStorage` thường là 5MB. Để tránh việc lưu trữ bị lỗi tràn bộ nhớ (`QuotaExceededError`) làm sập ứng dụng và mất dữ liệu của người dùng, dự án áp dụng thuật toán kiểm soát hạn mức nghiêm ngặt:

### A. Định mức giới hạn dung lượng:
- Định nghĩa giới hạn lưu trữ tối đa của dự án:
  `export const STORAGE_LIMIT_BYTES = 4.5 * 1024 * 1024;` (tương đương 4.5 Megabytes).
- Dành lại 0.5MB làm bộ đệm an toàn cho trình duyệt hoạt động ổn định.

### B. Công thức tính kích thước dữ liệu:
Vì chuỗi ký tự JavaScript được mã hóa theo chuẩn UTF-16 (mỗi ký tự chiếm 2 byte bộ nhớ), hàm tiện ích ước lượng dung lượng thực tế của một đối tượng được tính như sau:
```typescript
export function getItemBytes(obj: unknown): number {
  try {
    return JSON.stringify(obj).length * 2;
  } catch {
    return 0;
  }
}
```

### C. Cơ chế kiểm soát chủ động (Proactive Quota Handling):
Trước khi thực hiện các tác vụ ghi lớn (như nhập tệp mới từ máy khách, nhân bản đề thi, hoặc thêm câu hỏi mới vào đề), hệ thống sẽ chạy mô phỏng ước tính dung lượng:
1. Tính dung lượng hiện dùng của tất cả các khóa lưu trữ ngoại trừ khóa cần thay đổi bằng hàm `getQuizStorageUsedBytesExcept(excludeKey)`.
2. Dự toán dung lượng mới của đối tượng cần thay đổi sau khi chèn thêm bản ghi mới bằng `JSON.stringify(newObject).length * 2`.
3. Cộng hai giá trị trên để có `totalEstimatedBytes`.
4. So sánh: Nếu `totalEstimatedBytes > STORAGE_LIMIT_BYTES`, ứng dụng sẽ hủy lệnh ghi, đưa ra thông báo cảnh báo lỗi `"Bộ nhớ lưu trữ đã đầy. Vui lòng xóa bớt file."` và ngăn chặn trình duyệt ném ra ngoại lệ hệ thống.
