# Cấu hình Dự án (Configuration)

Tài liệu này giải thích vai trò và chi tiết cấu hình của các tập tin thiết lập hệ thống trong ứng dụng **Vapas Quiz**.

---

## 1. `package.json`
- **Mục đích**: Quản lý thông tin dự án, các gói thư viện phụ thuộc (dependencies) và định nghĩa các câu lệnh vận hành dự án.
- **Các lệnh script chính**:
  * `npm run dev`: Khởi chạy môi trường phát triển Next.js cục bộ (Next development server).
  * `npm run build`: Biên dịch dự án thành gói sản phẩm tối ưu chạy trên môi trường production.
  * `npm run start`: Khởi chạy dự án ở chế độ production sau khi build.
  * `npm run lint`: Chạy công cụ ESLint kiểm tra lỗi định dạng và quy tắc viết code.
  * **Lưu ý**: Dự án không sử dụng thư viện định dạng code Prettier độc lập hay hệ thống chạy test chuyên biệt. Kiểm tra kiểu TypeScript được chạy thủ công thông qua lệnh `npx tsc --noEmit`.

---

## 2. `tsconfig.json`
- **Mục đích**: Cấu hình trình biên dịch TypeScript và quy tắc kiểm tra kiểu cho dự án.
- **Các thông số quan trọng**:
  * `"target": "ES2017"`: Biên dịch mã nguồn TypeScript ra chuẩn cú pháp ES2017 phù hợp các trình duyệt hiện đại.
  * `"strict": true`: Kích hoạt chế độ kiểm tra kiểu nghiêm ngặt (strict mode), bắt buộc lập trình viên khai báo kiểu rõ ràng, giảm thiểu lỗi runtime.
  * `"noEmit": true`: Không tự sinh file `.js` sau khi biên dịch (phù hợp với cơ chế bundler của Next.js biên dịch trực tiếp).
  * `"moduleResolution": "bundler"`: Sử dụng cơ chế phân giải mô-đun tối ưu cho các trình đóng gói hiện đại.
  * `"paths": { "@/*": ["./src/*"] }`: Định nghĩa bí danh đường dẫn, ánh xạ `@/` trỏ trực tiếp đến thư mục `./src/`.

---

## 3. `eslint.config.mjs`
- **Mục đích**: Cấu hình kiểm tra chất lượng code và quy tắc định dạng (Linters).
- **Chi tiết**: Sử dụng cấu hình cấu trúc mới dạng Flat Config của ESLint v9. Kế thừa các bộ quy tắc chuẩn:
  * `eslint-config-next/core-web-vitals` để tối ưu hóa hiệu năng và tuân thủ các quy tắc cốt lõi của Next.js.
  * Tích hợp kiểm tra kiểu TypeScript để đảm bảo tính an toàn hệ thống kiểu.

---

## 4. `postcss.config.mjs`
- **Mục đích**: Cấu hình bộ xử lý CSS tiền biên dịch (PostCSS).
- **Chi tiết**: Nạp plugin `@tailwindcss/postcss` để hỗ trợ tích hợp và biên dịch trực tiếp Tailwind CSS v4. Do Tailwind CSS v4 tối giản hóa quy trình và không sử dụng tệp `tailwind.config.ts` riêng biệt, mọi thiết lập biến màu hay font chữ đều được quản lý trực tiếp qua các biến CSS trong tệp `src/app/globals.css`.

---

## 5. `next.config.ts`
- **Mục đích**: Cấu hình các đặc tính vận hành của framework Next.js.
- **Thông số cấu hình**:
  ```typescript
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {
    devIndicators: false, // Tắt chỉ báo phát triển (indicator dấu sấm sét/loading ở góc dưới màn hình khi chạy dev)
  };

  export default nextConfig;
  ```
