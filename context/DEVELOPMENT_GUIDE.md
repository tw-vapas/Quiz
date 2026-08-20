# Hướng dẫn Phát triển (Development Guide)

Tài liệu này cung cấp hướng dẫn từng bước cho các lập trình viên hoặc trợ lý AI khi phát triển tính năng, sửa lỗi hoặc mở rộng ứng dụng **Vapas Quiz**.

---

## 1. Các lệnh Phát triển & Phát hành (Dev Commands)

Trước khi thực hiện hoặc đẩy bất kỳ thay đổi nào lên nhánh chính, lập trình viên bắt buộc phải chạy các lệnh kiểm tra chất lượng sau:

```bash
# 1. Chạy máy chủ phát triển cục bộ (cổng mặc định: 3000)
npm run dev

# 2. Kiểm tra kiểu TypeScript (TypeScript strict check)
npx tsc --noEmit

# 3. Chạy công cụ kiểm tra chất lượng code ESLint
npm run lint

# 4. Biên dịch đóng gói dự án chạy thử (Production Build)
npm run build
```

---

## 2. Quy trình Thêm một Trang mới (Adding a Page)

Ứng dụng Next.js sử dụng App Router, do đó cấu trúc thư mục định nghĩa tuyến đường đi:
1. Tạo một thư mục con tương ứng với tuyến đường mong muốn nằm dưới `/src/app/` (ví dụ: `/src/app/about/`).
2. Tạo tập tin `page.tsx` trong thư mục đó.
3. **Quy tắc thiết kế trang**:
   - Thêm chỉ thị `"use client";` ở đầu dòng nếu trang có tương tác với các component giao diện React hoặc cần kết nối Zustand Store.
   - Luôn bọc toàn bộ mã nguồn cấp trang trong một kiểm soát Hydration để tránh lỗi bất đồng bộ SSR:
     ```typescript
     const [isLoaded, setIsLoaded] = useState(false);
     useEffect(() => {
       setIsLoaded(true);
     }, []);
     if (!isLoaded) return <Skeleton />;
     ```
   - Sử dụng các path aliases `@/*` thay vì đường dẫn tương đối (ví dụ: `import ... from "@/components/..."`).

---

## 3. Quy trình Thêm một Component mới (Adding a Component)

1. Tạo tập tin đặt tên theo chuẩn **PascalCase** dưới thư mục `/src/components/` (ví dụ: `CustomCard.tsx`).
2. **Quy tắc viết Component**:
   - Sử dụng `React.memo` bọc bên ngoài component (`export default memo(function CustomCard(...) { ... })`) để tối ưu hóa hiệu năng render khi tích hợp trong các danh sách dài.
   - Thêm class `cursor-pointer` một cách rõ ràng cho tất cả các nút bấm `<button>`, link `<a>`, hoặc thẻ div có hành động click (bắt buộc đối với Tailwind CSS v4).
   - Nếu component cần đọc thông tin từ Zustand store, hãy chỉ định selector cụ thể thay vì lấy toàn bộ store.
     * *Đúng*: `const theme = useQuizStore(s => s.theme);`
     * *Sai*: `const { theme } = useQuizStore();`

---

## 4. Quy trình Cập nhật Zustand Store (Modifying Store)

Mọi trạng thái chia sẻ hoặc logic nghiệp vụ cốt lõi đều được quản lý tại `/src/store/quizStore.ts`.
1. Định nghĩa thuộc tính state mới hoặc giao diện hành động mới trong interface `QuizStore`.
2. Khai báo giá trị mặc định của thuộc tính mới trong thân hàm tạo store `create<QuizStore>((set, get) => ({ ... }))`.
3. Triển khai action tương ứng bằng hàm cập nhật state bất biến (immutable state update):
   - Sử dụng `set((state) => ({ ... }))` để cập nhật trạng thái.
   - Tránh thay đổi trực tiếp (mutate) thuộc tính gốc của đối tượng/mảng. Luôn dùng cú pháp spread operator `[...state.array]` hoặc `{...state.object}`.
4. Nếu trạng thái mới cần được lưu trữ lâu dài trên trình duyệt của người dùng:
   - Hãy thêm thuộc tính đó vào danh sách đồng bộ của hook `useEffect` trong tệp `src/app/page.tsx`.
   - Cập nhật định nghĩa giải nén JSON trong khối hydration tương ứng.

---

## 5. Quy trình Cập nhật Bộ phân tích Cú pháp (Updating Parser)

Nếu cần bổ sung cú pháp đánh dấu câu hỏi trắc nghiệm mới:
1. Sửa đổi trực tiếp các biểu thức chính quy (Regex) và logic chia tách khối trong `src/lib/parserCore.ts`. Đây là tệp chứa các hàm xử lý chuỗi thuần túy nên có thể dễ dàng viết Unit Test độc lập.
2. Đảm bảo cấu trúc giá trị trả về của bộ lọc mới luôn tương thích với interface `Question` và `ParseResult`.
3. Kiểm tra tính tương thích của Web Worker:
   - Sau khi thay đổi `parserCore.ts`, tệp `parser.worker.ts` sẽ tự động tải phiên bản mới do sử dụng cú pháp import trực tiếp.
   - Thực thi biên dịch đóng gói `npm run build` để kiểm tra trình đóng gói (bundler) của Next.js có trích xuất thành công Web Worker dưới dạng blob/file độc lập hay không.
