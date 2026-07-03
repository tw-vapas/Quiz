# Biến Môi trường (Environment Variables)

Tài liệu này ghi nhận và làm rõ hiện trạng sử dụng biến môi trường (Environment Variables) trong ứng dụng **Vapas Quiz**.

## 1. Không sử dụng Biến Môi trường (No Environment Variables Required)

Do đặc thù kiến trúc **SPA Client-Only** chạy hoàn toàn trên trình duyệt và không giao tiếp với hệ thống backend bên ngoài, ứng dụng **Vapas Quiz** **không định nghĩa và không yêu cầu bất kỳ biến môi trường nào**.

- Không có các tệp tin cấu hình môi trường như `.env`, `.env.local`, `.env.development`, hay `.env.production` trong thư mục gốc của dự án.
- Mọi thiết lập hoạt động, cấu hình thời gian thi hay dữ liệu đề thi đều được lưu trữ trực tiếp thông qua cơ sở dữ liệu trình duyệt (`localStorage`), loại bỏ nhu cầu cấu hình biến động ở cấp độ máy chủ biên dịch.

---

## 2. Bảo mật Thông tin Nhạy cảm (Secrets & Credentials)

Vì không có biến môi trường hoặc kết nối cơ sở dữ liệu từ xa:
- Không lưu trữ bất kỳ khóa bí mật (secrets key), mật khẩu (database password), hay mã cấu hình kết nối (credentials API) nào trong mã nguồn.
- Lập trình viên khi phát triển các tính năng tiếp theo không cần tạo hoặc cấu hình biến môi trường bổ sung, giúp quy trình đóng gói và triển khai (deployment) ứng dụng trở nên cực kỳ đơn giản và an toàn.
