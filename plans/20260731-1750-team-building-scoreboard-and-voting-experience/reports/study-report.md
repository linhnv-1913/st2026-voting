# Báo cáo Study

## Phạm vi

- Admin nhập điểm Team building cho Hub 1, Hub 2, Hub 4 và Hub 5.
- Trang riêng hiển thị bảng điểm Team building theo thời gian thực.
- Màn kết quả có QR, countdown, tự đóng và hiệu ứng kết quả chung cuộc.
- Site bình chọn đổi bốn đáp án sang lưới thẻ 2x2, bỏ số thứ tự.

## Hiện trạng kỹ thuật

- Ứng dụng dùng React 19, React Router 6, Firebase Auth/Firestore và Motion.
- `/admin/*` xác thực admin bằng document `admins/{uid}`.
- `/results` cũng yêu cầu admin và đọc realtime `config/main` cùng collection `votes`.
- `/` đọc công khai `config/main`; người dùng đăng nhập ẩn danh và chỉ tạo một phiếu.
- Firestore đã chặn tạo phiếu khi `endTime` hết hạn, kể cả khi không có client nào đang mở.
- `Config` hiện chỉ chứa câu hỏi, tối đa bốn option, trạng thái và thời gian kết thúc.
- `UserVote` đã có timer một giây; `ResultsDisplay` chưa có state thời gian nên chưa thể countdown liên tục.

## Hướng dữ liệu đề xuất

- Dùng document riêng `team-building/scores`, không nhét điểm vào `config/main` để tránh ghi đè cấu hình poll.
- Schema cố định: `scores.hub1`, `scores.hub2`, `scores.hub4`, `scores.hub5`, `updatedAt` dạng epoch milliseconds.
- Điểm là số nguyên không âm; UI mặc định `0` khi document chưa tồn tại.
- Firestore cho phép đọc công khai bảng điểm, chỉ admin được create/update, không cho delete từ client.
- Trang `/team-building` hiển thị realtime và không yêu cầu đăng nhập để dùng như màn hình trình chiếu.

## Hướng UI/interaction đề xuất

- Admin có một card riêng để nhập/lưu bốn điểm và link mở `/team-building` ở tab mới.
- Results thêm button QR mở native `<dialog>` chứa `QRCodeSVG` cho `https://sal.vn/c3-voting`.
- Dùng `qrcode.react` 4.2.x để render SVG tại chỗ, không phụ thuộc dịch vụ ảnh QR bên ngoài.
- Tách formatter countdown dùng chung; Results cập nhật mỗi giây và hiển thị trạng thái không giới hạn khi thiếu `endTime`.
- Khi hết giờ, rule Firestore đã dừng nhận phiếu; client admin đồng thời ghi `isActive: false` theo kiểu best-effort.
- Final reveal dùng Motion, hỗ trợ reduced-motion, xử lý hòa và trường hợp chưa có phiếu.
- Bốn option chuyển thành lưới 2x2, thẻ gần vuông, label giữa, bỏ badge số; selected state có check và viền rõ.
- Giữ màu Hub/Matsuri hiện tại thay vì sao chép màu/typography không liên quan từ ảnh tham chiếu.

## Rủi ro và giới hạn

- Không có backend scheduler: `isActive` chỉ được ghi về `false` khi một client admin đang mở, nhưng bảo vệ vote theo `endTime` vẫn luôn có hiệu lực ở Firestore.
- Thêm dependency QR cần cập nhật `package.json` và `bun.lock` cùng lúc.
- `AdminPanel.tsx` đã vượt 200 dòng; nên tách form điểm Team building thành component riêng.
- `src/index.css` lớn; style mới cần chia theo block rõ và tránh phá responsive hiện tại.
- Cần kiểm tra route với `BrowserRouter basename` và fallback GitHub Pages sau khi thêm `/team-building`.

## Quyết định mặc định cho Blueprint

- Bảng điểm Team building dùng đúng bốn Hub hiện tại.
- Route bảng điểm là `/team-building`, public read-only.
- Điểm không tự cộng với số phiếu; đây là màn hình điểm có sẵn riêng biệt.
- QR là modal trên `/results`, không hiển thị thường trực.
- Final reveal xác định đồng hạng nếu nhiều Hub có cùng số phiếu cao nhất.

## Điểm cần người dùng xác nhận

- Có thể dùng các quyết định mặc định trên để đi tiếp, hoặc điều chỉnh route/quy tắc điểm trước khi Blueprint.
