# Cấu trúc Thư mục (Directory Structure)

Tài liệu này giải thích cấu trúc phân bổ thư mục trong ứng dụng **Vapas Quiz**, vai trò của từng thành phần, các quy tắc nhập khẩu (importing) và quy hoạch dữ liệu.

## 1. Bản đồ Thư mục Tổng quan (Directory Map)

```
/
├── public/                 # Các tài nguyên tĩnh (favicon, hình ảnh tĩnh)
├── reference_pictures/     # Hình ảnh chụp giao diện tham khảo phục vụ kiểm thử
├── context/                # Thư mục chứa tài liệu ngữ cảnh AI (Tài liệu này)
├── src/                    # Mã nguồn chính của ứng dụng
│   ├── app/                # Next.js App Router (Định tuyến và Bố cục trang)
│   │   ├── document/       # Trang xem chi tiết tài liệu lý thuyết (/document)
│   │   │   └── page.tsx
│   │   ├── globals.css     # Định nghĩa CSS toàn cục (Tailwind CSS v4)
│   │   ├── layout.tsx      # Bố cục giao diện gốc (Root layout)
│   │   └── page.tsx        # Trang chủ ứng dụng (Làm Quiz / Biên soạn)
│   │
│   ├── components/         # Các thành phần giao diện React tái sử dụng
│   │   ├── CreateQuizSection.tsx      # Bố cục cột của Trình biên soạn đề
│   │   ├── DisplayBlockRenderer.tsx   # Kết xuất khối mã nguồn / hình ảnh trong đề
│   │   ├── FileManager.tsx            # Trình quản lý đề (cột trái Trình biên soạn)
│   │   ├── MainQuiz.tsx               # Giao diện làm bài kiểm tra trắc nghiệm
│   │   ├── MarkdownRenderer.tsx       # Bộ vẽ tài liệu lý thuyết Markdown tối ưu
│   │   ├── NotificationToast.tsx      # Hộp thông báo nổi (Toast alert)
│   │   ├── QuestionModification.tsx   # Trình sửa câu hỏi (cột giữa Trình biên soạn)
│   │   ├── ResultScreen.tsx           # Kết quả thi, thống kê thời gian & sửa câu sai
│   │   ├── SectionsSelection.tsx      # Khối tiêu đề thông tin đề thi (Beta - Chưa dùng)
│   │   ├── SettingExport.tsx          # Thiết lập và xuất bản đề (cột phải Biên soạn)
│   │   ├── Sidebar.tsx                # Hộp cài đặt đề thi ở Trang chủ
│   │   ├── SourceAllocation.tsx       # Thanh trượt phân bổ tỉ lệ câu hỏi từ nguồn
│   │   └── StartScreen.tsx            # Màn hình chuẩn bị/bắt đầu làm bài
│   │
│   ├── lib/                # Tầng lõi xử lý thuật toán và hàm tiện ích
│   │   ├── markdownHelper.ts          # Hàm phân chia khối Markdown để render mượt
│   │   ├── parser.ts                  # Hàm điều phối đọc tệp (Main thread / Web Worker)
│   │   ├── parser.worker.ts           # Web Worker phân tích tệp nền (Mammoth.js)
│   │   ├── parserCore.ts              # Thuật toán phân tích cú pháp .txt / .json
│   │   ├── sourceHelper.ts            # Hàm lấy tên hiển thị ưu tiên của nguồn tệp
│   │   └── utils.ts                   # Các bộ đo byte lưu trữ, profiler, sinh mã màu tag
│   │
│   └── store/              # Tầng quản lý trạng thái tập trung
│       └── quizStore.ts    # Zustand store quản lý cài đặt, tệp nguồn & vòng đời thi
│
├── package.json            # Quản lý phụ thuộc và các câu lệnh dev/build
├── tsconfig.json           # Cấu hình kiểm lỗi kiểu TypeScript
└── eslint.config.mjs       # Cấu hình quy tắc kiểm lỗi mã nguồn ESLint
```

---

## 2. Chi tiết Nhiệm vụ từng Thư mục

### `/src/app`
- **Vai trò**: Định nghĩa các tuyến đường (routes) của Next.js và bố cục trang.
- **Những gì thuộc về đây**: Các tập tin giao diện cấp trang (`page.tsx`), bố cục toàn cục (`layout.tsx`), tệp CSS chính (`globals.css`).
- **Lưu ý**: Hạn chế viết logic nghiệp vụ phức tạp trực tiếp ở đây. Tách các thành phần giao diện nhỏ thành các file trong `/components` để giữ mã nguồn trang sạch và dễ bảo trì.

### `/src/components`
- **Vai trò**: Chứa các component giao diện React được chia nhỏ theo mô-đun chức năng.
- **Những gì thuộc về đây**: Các component thực thi giao diện độc lập.
- **Quy tắc**: Các component không nên tự ý đọc/ghi trực tiếp vào `localStorage`, mọi trạng thái cần đồng bộ phải đi qua Zustand Store hoặc truyền qua `props`. Component nên sử dụng các selector cụ thể của Zustand để tránh kích hoạt re-render không cần thiết.

### `/src/lib`
- **Vai trò**: Thư viện chứa các hàm tiện ích thuần túy (pure helper functions) và bộ xử lý thuật toán.
- **Những gì thuộc về đây**: Các hàm tính toán, hàm xử lý chuỗi văn bản, logic phân tích cú pháp tệp.
- **Quy tắc**: Tuyệt đối không import bất kỳ Component React nào vào các tập tin trong thư mục này. Tầng này phải hoàn toàn độc lập với giao diện.

### `/src/store`
- **Vai trò**: Lưu trữ trạng thái ứng dụng.
- **Những gì thuộc về đây**: File cấu hình Zustand store (`quizStore.ts`).
- **Quy tắc**: Đây là nguồn dữ liệu chân lý duy nhất (Single Source of Truth) của ứng dụng. Mọi trạng thái cấu hình và tiến trình thi cử đều phải khai báo tại đây.

---

## 3. Quy tắc Import / Path Aliases
Ứng dụng sử dụng bí danh đường dẫn (path aliases) để đơn giản hóa các câu lệnh import:
- `@/*` ánh xạ tới `./src/*`

**Ví dụ**:
`import { useQuizStore } from "@/store/quizStore";` (Đúng)
`import { useQuizStore } from "../../store/quizStore";` (Tránh sử dụng đường dẫn tương đối dài)
