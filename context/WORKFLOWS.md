# Các Luồng Nghiệp vụ (Workflows)

Tài liệu này hướng dẫn chi tiết các luồng nghiệp vụ lớn (End-to-End Workflows) trong ứng dụng **Vapas Quiz** dưới góc độ trải nghiệm người dùng và quy trình xử lý dữ liệu hệ thống.

---

## 1. Luồng Nghiệp vụ A: Nạp Tệp nguồn & Cài đặt Đề thi

Quy trình chuẩn bị tài liệu và cấu hình thông số đề thi trước khi làm bài:

```
[Màn hình chuẩn bị] ──► [Nhấp vào biểu tượng Bánh răng] ──► [Sidebar Modal mở ra]
                                                                  │
[Lưu thiết lập] ◄── [Kéo thanh Phân bổ tỉ lệ] ◄── [Tải tệp tin đề thi] ◄┘
```

1. **Truy cập Cài đặt**: Tại màn hình chuẩn bị (`StartScreen`), người dùng nhấp vào biểu tượng bánh răng ở góc trên bên phải để mở thanh cấu hình `Sidebar`.
2. **Tải lên dữ liệu**: Nhấp nút **"+" (Tải lên tệp)** ở phần "Nguồn dữ liệu". Người dùng chọn một hoặc nhiều tệp `.docx`, `.txt`, hoặc `.json`.
   - Hệ thống chuyển đổi tệp tin thành `ArrayBuffer` và gửi sang Web Worker đểMammoth trích xuất văn bản thô.
   - Bộ phân tích cú pháp phân tách câu hỏi, đáp án, giải thích. Kết quả trả về giao diện chính hiển thị dung lượng file và số câu hỏi đếm được.
3. **Lọc nguồn tệp**: Người dùng tích chọn/hủy chọn hộp kiểm của từng tệp để quyết định nguồn đề thi nào sẽ tham gia vào lượt làm bài này.
4. **Cấu hình thông số**:
   - Chọn chế độ hiển thị kết quả ngay tức thì hoặc nộp bài mới biết điểm.
   - Chọn chế độ thời gian: Không giới hạn hoặc nhập số phút giới hạn làm bài.
   - Chọn số lượng câu hỏi làm bài: "Tất cả" hoặc "Tùy chỉnh" (nhập số lượng cụ thể).
5. **Cân đối tỷ lệ (Nếu chọn chế độ Tùy chỉnh)**: Thanh phân bổ tỷ lệ `SourceAllocation` xuất hiện. Người dùng kéo các tay nắm phân tách hoặc nhập số câu trực tiếp để quyết định cấu trúc đề (ví dụ: 10 câu Giải tích từ Tệp A và 20 câu Hình học từ Tệp B).
6. **Lưu cài đặt**: Nhấn nút **"Lưu"**. Zustand Store cập nhật toàn bộ trạng thái cấu hình và kích hoạt các hook `useEffect` ghi đè dữ liệu mới vào `localStorage`. Giao diện màn hình chuẩn bị cập nhật lại tổng số câu hỏi thực tế sẽ làm.

---

## 2. Luồng Nghiệp vụ B: Làm Bài trắc nghiệm (Quiz Running)

1. **Khởi tạo**: Người dùng nhấn **"Bắt đầu"**. Hệ thống trộn ngẫu nhiên câu hỏi và đáp án, gán mốc thời gian bắt đầu (`startTime`) và kết xuất màn hình làm bài (`MainQuiz`).
2. **Chọn đáp án**: Người dùng nhấp chuột vào các phương án A, B, C, D hoặc bấm phím tắt tương ứng trên bàn phím.
3. **Phản hồi đáp án (Nếu bật chế độ xem kết quả ngay)**:
   - Khi nhấn **"Xác nhận đáp án"** (hoặc bấm `Enter`), hệ thống khóa thao tác lựa chọn của câu hỏi đó và tô màu nổi bật: Màu xanh lá cho đáp án đúng và màu đỏ cho đáp án sai người dùng chọn.
   - Nếu có hướng dẫn giải thích (`explanation`), một khối hộp màu sắc chứa thông tin giải thích sẽ tự động trượt xuống dưới câu hỏi.
   - Nếu trả lời đúng và bật chế độ **"Tự động chuyển câu"**, hệ thống đợi 1 giây rồi tự động nhảy sang câu hỏi tiếp theo.
   - Nếu trả lời sai, người dùng xem kỹ lời giải rồi chủ động nhấn **"Câu tiếp theo"** (hoặc bấm `Enter`) để chuyển câu.
4. **Tạm dừng làm bài**:
   - Nhấn nút **"Tạm dừng"** (hoặc bấm phím `P`), màn hình phủ một lớp mờ dừng cuộc thi. Bộ đếm giờ tính toán thời gian làm bài của giây cuối cùng cộng dồn vào bộ nhớ tích lũy và tạm dừng theo dõi để người dùng nghỉ ngơi. Nhấn **"Tiếp tục"** để làm bài tiếp.
5. **Nộp bài**: Nhấn **"Nộp bài"** (hoặc bấm phím `S`), một hộp thoại xác nhận hiện ra. Người dùng đồng ý sẽ kết thúc phiên làm bài và tính toán tổng thời gian thi cử thực tế.

---

## 3. Luồng Nghiệp vụ C: Xem Kết quả & Làm lại câu sai

1. **Tổng quan kết quả**: Hệ thống tính toán điểm số thang 10, đếm số câu đúng/sai, đo tổng thời gian thực hiện và tính thời gian trung bình làm bài cho mỗi câu hỏi.
2. **Phân tích biểu đồ thời gian**:
   - Màn hình hiển thị biểu đồ cột SVG biểu diễn thời gian làm bài của từng câu hỏi theo thứ tự thời gian tăng dần. Cột màu xanh đại diện cho câu trả lời đúng, cột màu đỏ đại diện cho câu trả lời sai.
   - Khi click vào bất kỳ cột nào trên biểu đồ, một hộp thông báo nổi (tooltip popover) xuất hiện hiển thị: Tóm tắt nội dung câu hỏi, thời gian chi tiết người thi suy nghĩ câu đó, đáp án người dùng chọn và đáp án đúng thực tế.
3. **Xem lại các câu trả lời sai**: Danh sách toàn bộ các câu hỏi trả lời sai được hiển thị ở bên dưới kèm theo chỉ dẫn chi tiết đáp án đúng và phần giải thích rõ ràng.
4. **Làm lại các câu sai**:
   - Người dùng nhấn nút **"Làm lại các câu sai"**. Hộp thoại cấu hình mở ra hiển thị số câu sai khả dụng.
   - Người dùng có thể tích chọn "Bổ sung thêm câu hỏi" từ kho đề thi và chọn số lượng câu bổ sung. Có hai chế độ bổ sung: Lấy ngẫu nhiên (`RANDOM`) hoặc ưu tiên lấy các câu hỏi ôn tập tốn nhiều thời gian suy nghĩ nhất của lượt làm bài trước (`TIME`).
   - Nhấn **"Bắt đầu"** để tạo ngay một phiên thi trắc nghiệm mới được thiết lập riêng cho việc sửa sai.

---

## 4. Luồng Nghiệp vụ D: Biên soạn Đề thi (Creator Flow)

1. **Khởi động**: Chọn tab **"Tạo Quiz"** trên thanh điều hướng. Màn hình duy trì 3 cột linh hoạt trên desktop/laptop (chỉ gộp 1 cột khi màn hình `< 768px`).
2. **Khởi tạo tệp tin (FileManager - Cột 1)**:
   - Nhấp nút **"Thêm tệp"** (nằm bên phải dòng `Danh Sách Tệp ({n}/10)`), nhập tên tệp và chọn phương thức nạp dữ liệu (tệp trống hoặc nhập & gộp dữ liệu từ máy/file có sẵn).
   - Tệp tin mới tạo xuất hiện trong danh sách `Danh Sách Tệp`.
3. **Biên soạn chi tiết (QuestionModification - Cột 2)**:
   - Nhấp vào tệp tin để kích hoạt trình soạn thảo.
   - **Tab Tài Liệu**: Soạn thảo tài liệu ôn tập bằng Markdown và chuyển đổi xem trước (preview).
   - **Tab Câu Hỏi**:
     - Thao tác trực quan dạng Panel split-view: Chọn câu hỏi bên phải để chỉnh sửa bên trái. Các ô nhập liệu đồng bộ định dạng `text-base font-normal`.
     - **Tính năng "Tạo Quiz Nhanh"**: Cho phép dán nhanh mảng JSON đáp án & giải thích hoặc dán văn bản câu hỏi thô để bóc tách tự động.
     - Khi xóa câu hỏi $i$, hệ thống tự động chọn câu hỏi $i - 1$ ngay phía trước nó.
4. **Thiết lập & Xuất bản (SettingExport - Cột 3)**:
   - Đổi tên tệp, kiểm thử tự động trạng thái hợp lệ, và viết ghi chú đề thi (tối đa 200 từ).
   - Nhấn **"Xuất bản"**, chọn định dạng tệp (`JSON` hoặc `DOCX`), chọn phạm vi xuất (Tất cả, N câu đầu/cuối, khoảng tùy chọn, hoặc áp dụng bộ lọc). Tải tệp về máy tính.
