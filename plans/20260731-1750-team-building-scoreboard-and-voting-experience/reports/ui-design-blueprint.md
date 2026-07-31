# UI Design Blueprint

## Hướng thị giác

- Giữ nguyên Matsuri: nền kem có chấm, đỏ lễ hội, vàng, xanh biển và hệ màu riêng của từng Hub.
- Ảnh tham chiếu chỉ định cấu trúc thẻ option 2x2 và label giữa; không sao chép font hay nội dung không liên quan.
- Ưu tiên màn hình sự kiện: chữ lớn, tương phản cao, trạng thái nhận biết từ xa và animation có mục đích.

## Admin — nhập điểm Team building

- Tách thành component/card riêng bên dưới phần thiết lập poll để `AdminPanel.tsx` không tiếp tục phình lớn.
- Header card gồm tiêu đề, mô tả ngắn và link mở `/team-building` trong tab mới.
- Bốn input number theo lưới 2x2, mỗi input mang màu Hub tương ứng và label luôn hiển thị.
- Input tối thiểu 16px, `min=0`, `step=1`; reject số âm, thập phân, rỗng không hợp lệ và giá trị vượt giới hạn.
- Nút “Lưu điểm Team building” độc lập với “Lưu & công bố” của poll.
- Trạng thái saving/đã lưu/lỗi phải nằm gần button; không dùng alert cho happy path.

## Trang `/team-building`

- Dùng header FestivalBrand và một panel scoreboard lớn, không yêu cầu đăng nhập.
- Bốn đội hiển thị thành grid responsive: bốn cột trên màn hình trình chiếu, 2x2 trên tablet/mobile.
- Mỗi tile có tên Hub, điểm số cỡ lớn và màu Hub; không dựa riêng vào màu để phân biệt.
- Realtime update dùng chuyển động tăng/scale nhẹ; reduced-motion chuyển thẳng giá trị.
- Document chưa tồn tại hoặc field thiếu thì hiển thị `0`, lỗi đọc có message rõ ràng.

## Màn `/results`

- Header action có button QR cạnh link quản trị; icon có text/aria-label và touch target tối thiểu 44px.
- QR dùng native `<dialog>` để có Escape/focus return; nội dung gồm QR SVG, URL chữ và nút đóng rõ ràng.
- Countdown đặt ở summary card, dùng tabular numbers và ba trạng thái: còn thời gian, không giới hạn, đã kết thúc.
- Khi chuyển sang hết giờ, chart vẫn giữ vị trí; overlay/final banner xuất hiện thay vì thay toàn bộ layout.
- Final reveal gồm Trophy, “Kết quả chung cuộc”, tên một hoặc nhiều Hub thắng và số lượt cao nhất.
- Không có phiếu: dùng thông điệp trung tính, không coi cả bốn Hub là đồng chiến thắng.
- Đồng hạng: liệt kê tất cả đội cùng điểm cao nhất.
- Confetti/particles giới hạn, không chặn nội dung và tắt khi `prefers-reduced-motion`.

## Site user — option grid 2x2

- `.vote-options` dùng hai cột đều nhau; gap 10–12px và không scroll ngang từ 320px.
- Thẻ gần vuông, label căn giữa, màu nền Hub bão hòa vừa phải; bỏ hoàn toàn badge số thứ tự.
- Trạng thái selected có viền dày, check ở góc trên phải và nâng nhẹ; vẫn giữ `aria-pressed`.
- Trạng thái disabled giảm độ bão hòa/opacity nhưng label vẫn đọc được; selected không bị làm mờ.
- Focus-visible dùng outline vàng/trắng tương phản, không chỉ dùng shadow.
- Với ba option, ô cuối không tự kéo full-width; cấu trúc vẫn ổn định.
- Desktop giới hạn chiều rộng card user để tile không phình quá lớn; mobile giữ 2x2 theo yêu cầu.

## Accessibility và motion

- Label/input liên kết bằng `htmlFor`; lỗi form dùng `role=alert` hoặc vùng live phù hợp.
- QR dialog có heading, mô tả URL, nút đóng và trả focus về button mở.
- Countdown dùng `role=timer`, không phát live announcement mỗi giây; chỉ announce khi kết thúc.
- Final reveal dùng polite live region một lần khi trạng thái chuyển đổi.
- Mọi animation dùng opacity/transform; không animation height/layout liên tục ngoài bar chart hiện có.
- `useReducedMotion` của Motion quyết định bỏ particle và rút ngắn transition.

## Kiểm tra thị giác

- User: 320px, 375px, 619px và desktop; bốn tile không tràn, label không bị cắt.
- Results: 1280px trình chiếu và tablet; QR dialog không vượt viewport.
- Team building: kiểm tra 0, số 1–3 chữ số, số lớn hợp lệ và realtime update.
- Kiểm tra keyboard cho option, QR button/dialog và admin inputs.
- Kiểm tra contrast của chữ trắng trên bốn màu Hub và focus ring trên nền màu.
