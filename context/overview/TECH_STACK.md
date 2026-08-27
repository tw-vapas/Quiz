# Công nghệ Sử dụng (Technology Stack)

Tài liệu này mô tả chi tiết các công nghệ chính được áp dụng trong ứng dụng **Vapas Quiz** và lý do lựa chọn chúng.

## 1. Công nghệ Cốt lõi (Core Stack)

| Công nghệ | Phiên bản | Mục đích & Lý do Sử dụng |
| :--- | :--- | :--- |
| **React** | `19.2.4` | Thư viện cốt lõi xây dựng giao diện người dùng. React 19 cung cấp hiệu năng tốt hơn, cơ chế quản lý DOM ảo tối ưu và hỗ trợ các tính năng React Server Components hiện đại của Next.js. |
| **Next.js** | `16.2.6` | Framework React hỗ trợ cơ chế Routing thông qua cấu trúc thư mục (App Router) giúp quản lý trang dễ dàng, hỗ trợ tiền kết xuất giao diện tối ưu (SSR) và tối ưu hóa việc phân tách mã (code splitting). |
| **TypeScript** | `5.x.x` | Ngôn ngữ lập trình cung cấp cơ chế gõ tĩnh (strict static typing). TypeScript giúp kiểm soát lỗi dữ liệu ngay trong quá trình biên dịch, đặc biệt quan trọng đối với các cấu trúc phức tạp như mô hình câu hỏi trắc nghiệm (`Question`, `CreatorFile`). |

---

## 2. Quản lý Trạng thái & Cơ sở dữ liệu (State & Storage)

| Công nghệ | Phiên bản | Mục đích & Lý do Sử dụng |
| :--- | :--- | :--- |
| **Zustand** | `5.0.13` | Thư viện quản lý trạng thái toàn cục gọn nhẹ thay thế cho Redux hay React Context. Zustand v5 có hiệu năng cao, cơ chế selector chính xác giúp hạn chế re-render thừa và khả năng truy xuất state trực tiếp ngoài môi trường React (`useQuizStore.getState()`). |
| **localStorage** | *Native* | Cơ sở dữ liệu mặc định của trình duyệt để lưu trữ dữ liệu người dùng. Vì ứng dụng chạy client-only, localStorage là lựa chọn hoàn hảo để lưu tệp đề thi, cấu hình cài đặt mà không cần thiết lập hệ thống cơ sở dữ liệu backend phức tạp. |

---

## 3. Giao diện & Hiệu ứng (UI & Styling)

| Công nghệ | Phiên bản | Mục đích & Lý do Sử dụng |
| :--- | :--- | :--- |
| **Tailwind CSS** | `4.x.x` | Bộ khung CSS thế hệ mới. Tailwind CSS v4 loại bỏ tệp cấu hình truyền thống, cải tiến hiệu năng biên dịch và tích hợp trực tiếp các biến CSS. Nó giúp xây dựng nhanh giao diện tương tác cao, thiết kế đáp ứng (Responsive) và hỗ trợ chế độ tối (Dark Mode) nhanh chóng. |
| **Framer Motion**| `12.38.0` | Thư viện hoạt hình mạnh mẽ cho React. Được sử dụng để tạo các hiệu ứng trượt mượt mà khi chuyển câu hỏi (`AnimatePresence`, `motion.div`), mở/đóng các hộp thoại (modal) cài đặt và toast thông báo. |
| **Lucide React** | `1.16.0` | Bộ biểu trưng dạng vector (SVG) đồng bộ, sắc nét và có khả năng tương thích cao với chế độ tối, giúp tăng trải nghiệm trực quan của các nút chức năng. |

---

## 4. Thư viện Xử lý Tập tin & Định dạng (Document & Parser)

| Công nghệ | Phiên bản | Mục đích & Lý do Sử dụng |
| :--- | :--- | :--- |
| **Mammoth** | `1.12.0` | Thư viện trích xuất văn bản thuần túy từ tệp tin Microsoft Word (.docx). Được sử dụng trong Web Worker để chuyển đổi dữ liệu đề thi thô từ tệp Word sang chuỗi văn bản trước khi đưa vào bộ lọc phân tích cú pháp câu hỏi. |
| **React Markdown**| `10.1.0` | Trình biên dịch Markdown sang React element. Giúp kết xuất các tài liệu lý thuyết, công thức ôn tập một cách có cấu trúc và thẩm mỹ cao. |
| **Remark GFM** | `4.0.1` | Plugin mở rộng cho React Markdown hỗ trợ cú pháp GitHub Flavored Markdown (như bảng biểu, danh sách việc cần làm). |
| **PrismJS** | `1.30.0` | Thư viện tô màu cú pháp mã nguồn (Syntax Highlighting). Được sử dụng để tô màu tự động các khối mã code trong đề thi trắc nghiệm tin học và hiển thị định dạng JSON trong trình biên soạn `IdeEditor`. |

---

## 5. Thư viện Tiện ích (Utilities)

- **clsx** (`^2.1.1`) & **tailwind-merge** (`^3.6.0`): Phối hợp xây dựng hàm tiện ích `cn(...)` chuyên dùng để gộp các class Tailwind CSS động mà không bị xung đột thuộc tính.
- **@vercel/analytics** (`^2.0.1`): Được tích hợp ở tầng layout để theo dõi lưu lượng truy cập và hành vi cơ bản của người dùng trên môi trường production.
