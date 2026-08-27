# Các Hook Tự chọn (Hooks)

Tài liệu này ghi nhận hiện trạng và giải thích kiến trúc sử dụng các React Hook trong dự án **Vapas Quiz**.

## 1. Không có Thư mục Hooks độc lập

Dự án **Vapas Quiz** không thiết lập thư mục `/src/hooks` chứa các React Hook tự chọn độc lập. Lý do thiết kế này bao gồm:
- **Quản lý trạng thái bằng Zustand**: Toàn bộ logic nghiệp vụ (business logic) và trạng thái liên quan đến việc làm bài, tải file, đồng bộ hay lưu cấu hình đều được tập trung vào các Action bên trong Zustand Store (`quizStore.ts`). Các Action này hoạt động độc lập với vòng đời React Component, giúp tránh việc viết các custom hooks phức tạp để xử lý side-effects.
- **Tách biệt hàm tiện ích thuần túy**: Các xử lý logic như chia nhỏ Markdown, kiểm định tính hợp lệ của JSON, tính dung lượng file được đặt trong thư mục `/src/lib/` dưới dạng các hàm tiện ích thuần túy (pure functions), giúp dễ dàng viết Unit Test sau này.

---

## 2. Tiện ích Hook `useRenderProfiler` (`src/lib/utils.ts`)

Mặc dù không có thư mục riêng, dự án có định nghĩa một custom hook phục vụ cho việc kiểm thử và theo dõi hiệu năng kết xuất:

### Thông tin chi tiết:
- **Nhiệm vụ**: Đo lường số lần re-render và khoảng thời gian (duration) một component cần để hoàn tất giai đoạn commit layout lên DOM.
- **Khai báo**:
  ```typescript
  import { useRef, useLayoutEffect } from "react";

  export function useRenderProfiler(componentName: string) {
    const renderCount = useRef(0);
    renderCount.current += 1;
    
    const startTime = useRef(0);
    startTime.current = performance.now();

    useLayoutEffect(() => {
      const duration = performance.now() - startTime.current;
      console.log(`[Profiler] ${componentName} - Render #${renderCount.current} committed in ${duration.toFixed(2)}ms`);
    });
  }
  ```
- **Cách hoạt động**:
  * Sử dụng `useRef` để giữ số lần render và thời điểm bắt đầu render mà không gây kích hoạt re-render lặp lại.
  * Dùng `useLayoutEffect` chạy đồng bộ ngay sau khi React thực hiện thay đổi DOM nhưng trước khi trình duyệt vẽ (paint), giúp tính toán thời gian render chính xác nhất.
- **Sử dụng thực tế**: Được gọi trong `VirtualSourceCard` và `VirtualSourcesList` để giám sát hiệu năng kéo thả reorder các tệp nguồn dữ liệu.

---

## 3. Quy tắc áp dụng Hook Tiêu chuẩn

Dự án tuân thủ các quy tắc sử dụng hook mặc định của React 19:
- **`useMemo`**: Sử dụng triệt để trong các bộ lọc câu hỏi phức tạp hoặc tính toán tỷ trọng thẻ tag trong `SettingExport.tsx` và `QuestionModification.tsx` để tránh chạy lại các phép toán nặng khi re-render component.
- **`useCallback`**: Sử dụng để bọc các hàm sự kiện kéo thả và cập nhật trạng thái trong `Sidebar.tsx` và `MainQuiz.tsx` nhằm giữ tham chiếu hàm ổn định, hỗ trợ tối ưu hóa render của các component con đã bọc trong `React.memo`.
- **`useRef`**: Sử dụng để lưu trữ các tham chiếu đến phần tử DOM (như thẻ `<input type="file">` ẩn) hoặc lưu giữ giá trị đếm giờ/trạng thái khóa nút bấm (`isLockedRef`) nhằm thay đổi trạng thái chạy nền mà không kích hoạt re-render.
- **Zustand Hook**: Đăng ký trạng thái store luôn tuân thủ việc truyền selector cụ thể để tối ưu hóa hiệu năng render.
