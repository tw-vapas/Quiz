# Nghiệp vụ Hệ thống (Business Logic)

Tài liệu này tổng hợp và giải thích chi tiết các quy tắc nghiệp vụ cốt lõi, thuật toán và các định dạng dữ liệu đặc thù của ứng dụng **Vapas Quiz**.

---

## 1. Cú pháp Phân tích Đề thi dạng Văn bản (Text Format Conventions)

Bộ phân tích cú pháp (`parseQuizText` trong `parserCore.ts`) chuyển đổi tài liệu văn bản thô (.txt hoặc trích xuất từ .docx) thành đề thi dựa trên các từ khóa và thẻ đánh dấu sau:

- **Câu hỏi**: Bắt đầu bằng nhãn `Câu X:` (ví dụ: `Câu 1:`, `Câu 12:`) hoặc thẻ định dạng đầy đủ `[?][single_choice]` hoặc `[?][multiple_choice]`.
- **Lựa chọn đáp án**: Bắt đầu bằng `A.`, `B.`, `C.`, `D.` ở đầu dòng.
- **Xác định đáp án đúng**:
  * Cách 1 (Hỗ trợ phổ thông): Thêm ký tự gạch chéo `/` vào ngay cuối văn bản lựa chọn (ví dụ: `A. Đáp án này đúng/` hoặc `A. Đáp án này đúng /`).
  * Cách 2 (Dùng thẻ): Sử dụng thẻ `[=][T]` cho đáp án đúng và `[=][F]` cho đáp án sai đặt ở đầu dòng (ví dụ: `[=][T] Lựa chọn này đúng`).
- **Khối hiển thị hình ảnh/mã nguồn (Display Block)**:
  * Cú pháp thẻ: Bắt đầu bằng `[+][type]` và kết thúc bằng `[/+]` (trong đó `type` là `code` hoặc `image`).
  * Cú pháp inline: `[+]: (type=code) . ("nội dung code")`.
- **Giải thích đáp án (Explanation)**:
  * Cú pháp thẻ: Bắt đầu bằng `[>]` và kết thúc bằng `[/>]`.
  * Cú pháp inline: `[>]: "nội dung giải thích"`.

---

## 2. Đặc tả Tệp tin Cấu trúc JSON (JSON Schema Conventions)

Tệp dữ liệu nhập xuất dưới dạng JSON phải tuân thủ schema được giải mã bởi hàm `parseQuizJson`:
- Tập tin bắt buộc là một đối tượng chứa thuộc tính `questions` (dạng mảng).
- Mỗi câu hỏi trong mảng `questions` phải chứa:
  * Trường văn bản: `question` hoặc `text`.
  * Đáp án: Mảng `answers` (mỗi phần tử có `content` và cờ `is_correct`/`isCorrect`) hoặc mảng `options` (chứa `id` và `text`) đi kèm mảng danh sách ID đúng `correctOptionIds` hoặc `correct_answer`.
  * Khối bổ trợ: `display_block` (đối tượng `{type, content}`) hoặc danh sách `display_blocks`.
  * Các trường không bắt buộc: `explanation` (chuỗi), `tags` (mảng chuỗi, tối đa 5 phần tử).

---

## 3. Quy tắc Đề thi & Tệp hỗ trợ (Quiz & Supported Files)

Trong trình tạo đề thi, hệ thống phân chia các tệp soạn thảo thành hai loại:
- **Quiz File (Đề thi chính - Giới hạn tối đa 5 tệp)**: Đề thi hoàn chỉnh dùng để thi hoặc xuất bản.
- **Supported File (Tài liệu hỗ trợ - Giới hạn tối đa 15 tệp)**: Chứa ngân hàng câu hỏi theo chuyên đề hoặc tài liệu lý thuyết bổ trợ.

### Quy tắc liên kết dữ liệu (Linking Rules):
1. Một Quiz File có thể liên kết với nhiều Supported Files (`supportedFileIds`).
2. Khi liên kết một tệp hỗ trợ vào đề thi chính, hệ thống tự động sao chép toàn bộ câu hỏi của tệp hỗ trợ đó vào Quiz File, đồng thời đổi ID câu hỏi thành định dạng `${supportFileId}_${questionId}` để tránh xung đột định danh và lưu nguồn gốc tệp hỗ trợ (`sourceId`, `sourceName`).
3. Khi gỡ liên kết (Unlink), tất cả câu hỏi có tiền tố ID thuộc tệp hỗ trợ đó sẽ tự động bị xóa khỏi Quiz File.
4. Khi đồng bộ (Sync), hệ thống lọc bỏ các câu hỏi cũ của tệp hỗ trợ trong Quiz File và nạp lại danh sách câu hỏi mới nhất từ Supported File gốc.

---

## 4. Thuật toán Tự cân bằng Phân bổ Câu hỏi (Rebalancing Algorithm)

Khi người dùng chọn cấu hình làm bài thi tùy chỉnh số lượng câu hỏi (`CUSTOM`), hệ thống cho phép phân bổ tỷ lệ số câu hỏi lấy từ từng tệp nguồn thông qua component `SourceAllocation`.

### Thuật toán phân bổ tự động (Proportional Rebalancing):
1. Lấy danh sách các tệp nguồn đang hoạt động (`activeSources`).
2. Tính tổng số lượng câu hỏi khả dụng tối đa từ các nguồn này (`totalAvailable`).
3. Xác định số câu hỏi mục tiêu làm bài: `targetQuestions = min(customQuestionCount, totalAvailable)`.
4. Nếu tổng số lượng câu hỏi yêu cầu vượt quá hoặc bằng tổng số câu hỏi khả dụng, gán số câu hỏi cho từng nguồn bằng tối đa số câu của nguồn đó (`allocations[sourceId] = questionsCount`).
5. Nếu ngược lại, tính phân bổ tỷ lệ:
   - Bước 1 (Tính phần nguyên): Gán cho mỗi nguồn số câu hỏi `assigned = floor((questionsCount / totalAvailable) * targetQuestions)`.
   - Bước 2 (Phân bổ phần dư): Số lượng câu hỏi còn dư (`remaining = targetQuestions - sum(assigned)`) sẽ được phân bổ lần lượt từng câu một cho các tệp nguồn nào chưa đạt giới hạn số câu hỏi tối đa của tệp đó, lặp lại cho đến khi hết phần dư.
6. Khi người dùng kéo một thanh trượt phân tách giữa nguồn A và nguồn B trên giao diện, thuật toán sẽ cố định tổng số câu hỏi của nguồn A và nguồn B, chỉ dịch chuyển ranh giới số câu tăng thêm của nguồn này tương ứng với số câu giảm đi của nguồn kia dựa trên tọa độ vị trí chuột kéo, đảm bảo không vượt quá giới hạn tối đa câu hỏi của mỗi nguồn.

---

## 5. Các Ràng buộc Trình soạn thảo (Editor Constraints)

- **Giới hạn thẻ nhãn (Tags)**: Mỗi câu hỏi chỉ được gán tối đa **5 thẻ**. Mỗi thẻ chỉ được chứa tối đa **16 ký tự**. Khi người dùng nhập thẻ dài hơn hoặc nhiều hơn, hệ thống sẽ từ chối lưu và hiển thị thông báo lỗi.
- **Giới hạn từ ghi chú (Note)**: Ghi chú đính kèm tệp tin giới hạn tối đa **200 từ**. Logic trong `SettingExport.tsx` sẽ tự động cắt bỏ các từ từ thứ 201 trở đi.
