# Quản lý Trạng thái (State Management)

Tài liệu này chi tiết hóa cấu trúc quản lý trạng thái tập trung (Zustand v5 Store) và cơ chế đồng bộ hóa bộ nhớ cục bộ trong ứng dụng **Vapas Quiz**.

---

## 1. Zustand Store: `src/store/quizStore.ts`

Ứng dụng quản lý toàn bộ trạng thái trong một store duy nhất phân chia thành các vùng chức năng chính:

### A. Cấu trúc Trạng thái (State Store Structure)

1. **Cấu hình & Cài đặt (Settings)**:
   - `showResultAfterQuestion`: Hiển thị lời giải và kết quả đúng/sai ngay lập tức khi click chọn đáp án.
   - `autoNext`: Tự động chuyển câu hỏi tiếp theo sau khi chọn đáp án đúng.
   - `questionCountMode`: Chế độ số câu hỏi (`ALL` hoặc `CUSTOM`).
   - `customQuestionCount`: Số lượng câu hỏi cần làm ở chế độ tùy chọn.
   - `timeLimitMode`: Chế độ thời gian làm bài (`UNLIMITED` hoặc `LIMITED`).
   - `timeLimitMinutes`: Số phút giới hạn làm bài.
   - `sourceAllocations`: Bản ghi tỷ lệ phân bổ câu hỏi từ các tệp nguồn (`Record<string, number>`).
   - `theme`: Giao diện sáng/tối (`light` | `dark`).
   - `isSettingsOpen` & `settingsOpenedAt`: Quản lý hiển thị modal Cài đặt và đo hiệu năng thời gian mở.
2. **Nguồn Dữ liệu (Sources)**:
   - `sources`: Danh sách nguồn tệp đề thi trắc nghiệm đã tải lên (`SourceFile[]`).
   - `selectedDocumentSourceId`: ID của tệp nguồn được chọn xem tài liệu học tập lý thuyết.
3. **Trình kiến tạo đề thi (Creator State)**:
   - `creatorFiles`: Danh sách các tệp đề thi và tệp hỗ trợ đang biên soạn (`CreatorFile[]`).
   - `activeFileId`: ID của tệp đang mở chỉnh sửa trong File Manager.
4. **Vòng đời & Tiến trình Thi (Quiz Execution State)**:
   - `state`: Trạng thái thi hiện tại (`NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`).
   - `questions`: Danh sách câu hỏi thi đã được trộn thứ tự câu hỏi và thứ tự các đáp án.
   - `currentIndex`: Chỉ số câu hỏi hiện tại đang hiển thị làm bài.
   - `answers`: Bản ghi đáp án người thi lựa chọn cho mỗi câu hỏi (`Record<questionId, optionIds[]>`).
   - `startTime`: Mốc thời gian bắt đầu phiên làm bài hiện tại (dùng để đo thời gian thực).
   - `accumulatedTime`: Tổng thời gian làm bài tích lũy từ các phiên trước khi nhấn tạm dừng (Pause).
   - `totalTime`: Tổng thời gian làm bài cuối cùng khi nộp bài.
   - `isPaused`: Cờ trạng thái tạm dừng thi cử.
   - `questionStartTime`, `questionAccumulatedTime`, `questionTimes`: Đo lường chi tiết thời gian làm bài cho từng câu hỏi riêng biệt để phục vụ vẽ biểu đồ kết quả.
5. **Thông báo (Notification)**:
   - `notification`: Nội dung và loại thông báo nổi hiện tại (`{ message, type: 'success'|'error'|'info' } | null`).

---

## 2. Các Hành động Chính trong Store (Store Actions)

### A. Nhóm Tác vụ Đề ôn tập (Sources Actions)
- `addSource(source)`: Thêm một nguồn tài liệu mới nạp được.
- `toggleSource(id)`: Bật/Tắt trạng thái hoạt động của tệp nguồn khi chọn lọc câu hỏi thi.
- `removeSource(id)`: Xóa tệp nguồn khỏi danh sách.

### B. Nhóm Tác vụ Biên soạn đề (Creator Actions)
- `createCreatorFile(name, type, initialData)`: Tạo tệp đề thi (`QUIZ`) hoặc tệp hỗ trợ (`SUPPORT`) mới, định dạng thời gian sửa đổi cục bộ theo múi giờ việt nam.
- `deleteCreatorFile(id)`: Xóa tệp biên soạn. Nếu xóa một tệp Supported File, hệ thống tự động gỡ liên kết và xóa toàn bộ các câu hỏi kế thừa từ tệp đó trong các Quiz Files liên quan.
- `updateCreatorFile(id, updates)`: Cập nhật nội dung câu hỏi, Markdown tài liệu lý thuyết, cập nhật số lượng câu hỏi và tự động cập nhật mốc thời gian sửa đổi gần nhất.
- `linkSupportFileToQuiz(quizId, supportId)`: Liên kết tệp hỗ trợ vào đề thi chính, tự động sao chép các câu hỏi của tệp hỗ trợ vào đề thi chính và đổi ID câu hỏi thành dạng `${supportId}_${questionId}` để tránh trùng lặp.
- `unlinkSupportFileFromQuiz(quizId, supportId)`: Gỡ liên kết tệp hỗ trợ, tự động lọc bỏ các câu hỏi có nguồn gốc từ tệp hỗ trợ đó ra khỏi đề thi chính.
- `syncQuestionsFromSupport(quizId, supportId)`: Đồng bộ lại danh sách câu hỏi mới nhất từ tệp hỗ trợ vào đề thi chính.

### C. Nhóm Tác vụ Thực thi Quiz (Quiz Actions)
- `startQuiz()`: Khởi tạo phiên thi. Lọc nguồn câu hỏi, trộn Fisher-Yates, cắt lát câu hỏi theo phân bổ tỷ lệ và thiết lập mốc thời gian.
- `submitAnswer(questionId, optionIds)`: Ghi nhận đáp án người dùng chọn và cộng dồn thời gian tích lũy cho câu hỏi hiện tại.
- `nextQuestion()`: Chuyển câu hỏi tiếp theo, tính thời gian làm bài câu hiện tại lưu vào `questionTimes` và reset bộ đếm thời gian của câu hỏi mới.
- `retryIncorrectQuestions(incorrectIds, addExtra, extraCount, extraMode)`: Tạo một phiên thi mới chứa các câu trả lời sai, hỗ trợ chèn thêm câu hỏi ngẫu nhiên hoặc các câu tốn nhiều thời gian nhất.
- `pauseQuiz()` / `resumeQuiz()`: Dừng/Tiếp tục làm bài, cập nhật thời gian tích lũy.
- `submitQuizEarly()`: Nộp bài thi sớm, chốt tổng thời gian và tính điểm.

---

## 3. Cơ chế Hydration & Đồng bộ cục bộ (Persistence Mechanics)

Dự án không sử dụng middleware `persist` có sẵn của Zustand để tránh xung đột cấu trúc dữ liệu khi Next.js render phía Server (SSR). Thay vào đó, việc đồng bộ với `localStorage` được quản lý thủ công qua React `useEffect` trong các file trang chính:

### A. Tại Trang chủ (`src/app/page.tsx`):
1. **Giai đoạn Mount (Hydration)**:
   - Khi component được mount lần đầu trên Client, ứng dụng đọc các khóa dữ liệu tương ứng từ `localStorage` (`vapas_quiz_sources`, `vapas_quiz_settings`, `vapas_quiz_creator_files`, `vapas_quiz_creator_active_id`).
   - Các giá trị này được ghi vào Zustand Store bằng phương thức `useQuizStore.setState(...)`.
   - Cờ `hasHydrated` được đặt thành `true`.
2. **Giai đoạn Thay đổi (Persistence)**:
   - Các hook `useEffect` độc lập lắng nghe sự thay đổi của `sources`, `creatorFiles`, `activeFileId` và các biến `settings`.
   - **Ràng buộc an toàn**: Việc ghi dữ liệu ngược lại `localStorage` chỉ được thực hiện khi cờ `hasHydrated === true`. Điều này ngăn chặn việc ghi ghi đè dữ liệu rỗng (trạng thái mặc định ban đầu của Zustand) đè lên dữ liệu cũ trong `localStorage` trước khi quá trình nạp dữ liệu hoàn tất.

### B. Tại Trang Tài liệu ôn tập (`src/app/document/page.tsx`):
- Khi truy cập trực tiếp vào trang tài liệu, ứng dụng chỉ nạp dữ liệu từ `localStorage` vào Zustand store **nếu danh sách `sources.length === 0`**. 
- Nếu store đã có sẵn dữ liệu (do người dùng chuyển hướng từ Trang chủ sang trang Tài liệu), ứng dụng sẽ bỏ qua bước này để giữ nguyên các trạng thái thay đổi tạm thời trên bộ nhớ trong phiên làm việc hiện tại.
