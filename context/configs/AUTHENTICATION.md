# Xác thực & Phân quyền (Authentication)

Tài liệu này xác nhận hiện trạng bảo mật, xác thực người dùng và phân quyền truy cập trong ứng dụng **Vapas Quiz**.

## 1. Không có Cơ chế Xác thực (No Authentication System)

Ứng dụng **Vapas Quiz** không tích hợp bất kỳ hệ thống đăng nhập, xác thực người dùng (User Authentication) hoặc xử lý mã thông báo (Token Handling như JWT, OAuth, Cookie) nào.
- Mọi người dùng truy cập trang web đều có thể sử dụng đầy đủ các tính năng lập tức mà không cần tạo tài khoản.
- Không có phân hệ quản lý người dùng (User Management), phân vai trò (RBAC) hoặc phân cấp quản trị viên.

---

## 2. Bảo mật Tuyến đường (Route Protection)

Ứng dụng không có các tuyến đường bảo vệ (protected routes) yêu cầu kiểm tra quyền truy cập từ máy chủ. Tất cả các trang hiển thị (`/` và `/document`) đều công khai và có thể truy cập tự do.

---

## 3. Quyền Riêng tư Dữ liệu (Data Privacy)

Mặc dù không có cơ chế xác thực, dữ liệu của người dùng vẫn được bảo mật an toàn nhờ đặc tính kiến trúc chạy cục bộ ở client:
- **Ngăn cách môi trường (Sandboxing)**: Trình duyệt tự động ngăn cách kho lưu trữ `localStorage` giữa các tên miền (domain) khác nhau theo chính sách cùng nguồn gốc (Same-Origin Policy). Chỉ mã nguồn chạy từ chính tên miền của Vapas Quiz mới có quyền đọc dữ liệu đề thi được lưu trong trình duyệt của người dùng đó.
- **Không gửi dữ liệu ngoại vi**: Do không kết nối internet để truyền câu hỏi thi, dữ liệu cá nhân của người học không bị rò rỉ ra các máy chủ bên ngoài. Người dùng có thể xóa toàn bộ dữ liệu này bất cứ lúc nào bằng cách xóa lịch sử duyệt web hoặc nhấn nút xóa đề thi trong File Manager.
