# Các Vấn đề đã biết & Nợ Kỹ thuật (Known Issues & Tech Debt)

Tài liệu này tổng hợp các lỗi giao diện nhỏ, mã nguồn chết (dead code), các tính năng chưa hoàn chỉnh, và các lỗi biên dịch/linter (ESLint check errors) hiện tại trong dự án **Vapas Quiz**.

---

## 1. Lỗi Linter & Cảnh báo Biên dịch (ESLint & React 19 Rules)

Dự án hiện có một số lỗi vi phạm quy tắc nghiêm ngặt của React 19 và TypeScript (chạy qua lệnh `npm run lint` hoặc `npx tsc`):

### A. Lỗi vi phạm tính thuần khiết và quản lý Refs của React (react-hooks/refs, react-hooks/purity)
- **Tập tin**: `src/lib/utils.ts` (Hàm `useRenderProfiler`)
- **Chi tiết**: 
  * Cú pháp `renderCount.current += 1` và `startTime.current = performance.now()` được gọi trực tiếp trong thân hook thay vì đặt trong `useEffect` hoặc `useLayoutEffect`. Điều này vi phạm nguyên tắc của React: **Không cập nhật hoặc truy cập Ref trong lúc render** (để tránh trường hợp component không cập nhật đúng cách).
  * Hàm `performance.now()` là một hàm không thuần khiết (impure function). Việc gọi nó trong quá trình render vi phạm quy tắc Component/Hook phải là hàm thuần nhất (must be pure / idempotent).

### B. Lỗi kích hoạt render bắc cầu (react-hooks/set-state-in-effect)
- **Tập tin**: `src/components/Sidebar.tsx` (dòng 531) và `src/components/SourceAllocation.tsx` (dòng 39)
- **Chi tiết**: Gọi hàm `setStorageUsedBytes(...)` và `setLocalAllocs(...)` đồng bộ ngay trong thân hàm `useEffect`. Điều này bắt buộc React phải chạy lại một chu kỳ render phụ (cascading render) ngay sau chu kỳ render trước đó, làm giảm đáng kể hiệu năng ứng dụng.

### C. Lỗi ép kiểu lỏng lẻo (no-explicit-any & no-unused-vars)
- **Tập tin**: `src/lib/parserCore.ts` (các dòng 333, 342, 382, 389) dùng kiểu `any` khi ép dữ liệu JSON thay vì định nghĩa interface chặt chẽ.
- **Tập tin**: `src/components/Sidebar.tsx` (dòng 247) khai báo tham số `_parentScrollRef` trong component `VirtualSourcesList` nhưng không bao giờ sử dụng.

---

## 2. Mã nguồn chết / Không sử dụng (Dead Code)

- **Component `SectionsSelection.tsx`**:
  * **Vị trí**: `src/components/SectionsSelection.tsx`
  * **Hiện trạng**: Component này định nghĩa cấu trúc một khối tiêu đề thẻ hiển thị thông số tệp tin và tổng số câu hỏi ôn tập (gán mác phiên bản "BETA"). Tuy nhiên, không có bất kỳ component hoặc trang nào import hay sử dụng component này. Đây là mã nguồn chết thừa cần được dọn dẹp hoặc tích hợp lại trong tương lai.

---

## 3. Tính năng chưa hoàn thiện (Unimplemented Features)

- **Chế độ hiển thị danh sách câu hỏi trong Trình soạn thảo**:
  * **Vị trí**: `src/components/QuestionModification.tsx`
  * **Mô tả**: Trong phần định nghĩa kiểu dữ liệu và cấu hình giao diện, biến `displayMode` hỗ trợ 3 tùy chọn hiển thị: `"List" | "Cards" | "Panel"`. Tuy nhiên, mã nguồn kết xuất thực tế chỉ viết logic render cho chế độ `"Panel"` (giao diện chia đôi cột). Nếu người dùng cố tình chuyển sang chế độ `"List"` hoặc `"Cards"`, màn hình sẽ trống rỗng và không hiển thị câu hỏi nào do thiếu code render tương ứng.

---

## 4. Các vấn đề tiềm ẩn về hiệu năng & Lưu trữ

- **Rủi ro lỗi tràn dung lượng lưu trữ thực tế**:
  * **Mô tả**: Mặc dù dự án đã xây dựng bộ kiểm duyệt dung lượng chủ động so sánh với `STORAGE_LIMIT_BYTES` (4.5MB), cơ chế này chỉ ước lượng kích thước dữ liệu thuộc về ứng dụng Vapas Quiz thông qua tiền tố khóa `vapas_quiz_`. 
  * **Vấn đề**: Nếu trên cùng một tên miền (domain) có các ứng dụng khác cũng lưu trữ dữ liệu vào `localStorage`, dung lượng trống khả dụng của trình duyệt có thể nhỏ hơn mức 4.5MB dự toán. Khi đó, câu lệnh `localStorage.setItem` chạy trong các hook `useEffect` đồng bộ của `page.tsx` vẫn có nguy cơ ném ra lỗi `QuotaExceededError` chưa được bọc xử lý triệt để, dẫn đến dừng cập nhật dữ liệu.
- **Hiện tượng chậm Main Thread khi Worker Fallback hoạt động**:
  * **Mô tả**: Nếu trình duyệt không hỗ trợ Web Worker (ví dụ chạy trên các hệ máy cũ hoặc trong môi trường máy chủ kết xuất SSR), mammoth.js sẽ chạy đồng bộ trên Main UI Thread.
  * **Vấn đề**: Khi tải lên tệp tin Word (.docx) lớn (trên 1MB hoặc chứa hàng trăm câu hỏi), Main Thread sẽ bị chặn xử lý từ 1-3 giây gây ra hiện tượng giật lag, đơ nút bấm giao diện tạm thời.

---

## 5. Hành vi lỗi Nhập liệu dạng Số (Input Edge Cases)

- **Bộ đếm thời gian giới hạn**:
  * **Mô tả**: Khi cấu hình số phút giới hạn làm bài thi, nếu người dùng xóa trắng trường nhập liệu hoặc nhập số `0` hoặc số âm, ô nhập liệu sẽ lưu trạng thái rỗng tạm thời hoặc giá trị không hợp lệ. Chỉ khi người dùng click chuột ra ngoài (kích hoạt sự kiện `onBlur`), giá trị mới được tự động đưa về mặc định `15` phút. Trong khoảng thời gian gõ phím đó, nếu người dùng nhấn bắt đầu thi ngay, bộ đếm giờ có thể hoạt động sai lệch hoặc tự động nộp bài lập tức do hiểu nhầm thời gian bằng `0`.
- **Số câu hỏi tùy chỉnh**:
  * **Mô tả**: Tương tự như bộ đếm giờ, khi cấu hình số lượng câu hỏi làm bài chế độ `CUSTOM`, nếu người dùng nhập số lớn hơn tổng số câu khả dụng hoặc xóa trắng ô nhập liệu, hệ thống chỉ sửa lại khi click ra ngoài (`onBlur`). Hành vi này có thể gây bối rối nhẹ cho người dùng khi đang gõ số.
