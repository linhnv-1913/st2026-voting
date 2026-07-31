# Phase 04 — Results QR, countdown và final reveal

## Context Links

- [Study report](reports/study-report.md)
- [UI design blueprint](reports/ui-design-blueprint.md)
- `src/components/ResultsDisplay.tsx`

## Overview

- Priority: Critical
- Status: Pending
- Mục tiêu: bổ sung QR, countdown realtime, auto-close UI/persistence và reveal kết quả chung cuộc.

## Key Insights

- Firestore rules đã từ chối vote sau `endTime`; client write `isActive=false` chỉ là persistence best-effort.
- `/results` đã yêu cầu admin nên có quyền update config khi timer kết thúc.
- Không thay toàn bộ chart khi reveal để tránh layout shift.

## Requirements

- Thêm `qrcode.react` 4.2.x, cập nhật manifest và Bun lock atomically.
- QR dialog chứa chính xác `https://sal.vn/c3-voting`, đóng bằng Escape/button và trả focus.
- Countdown tick mỗi giây; hỗ trợ no-end-time và expired-on-load.
- Khi hết giờ, update `isActive=false` tối đa một lần và announce kết thúc.
- Reveal winner/tie/zero-vote, tôn trọng reduced-motion.

## Architecture

`ResultsDisplay` giữ clock/final state; QR dialog và final reveal là component riêng. Formatter countdown nằm trong helper dùng lại được.

## Related Code Files

- Modify: `src/components/ResultsDisplay.tsx`
- Modify: `package.json`
- Modify: `bun.lock`
- Create: `src/countdown.ts`
- Create: `src/components/results-qr-dialog.tsx`
- Create: `src/components/final-results-reveal.tsx`
- Create: `src/components/results-experience.css`
- Delete: none

## Implementation Steps

1. Cài/pin `qrcode.react` và kiểm tra React 19 typings.
2. Tách formatter countdown thuần, test được cho ngày/giờ/phút/giây.
3. Tạo native dialog với `QRCodeSVG`, heading, URL text và focus handling.
4. Thêm `now` interval có cleanup và derive live/expired từ `endTime`.
5. Guard update config bằng ref để không write lặp; preserve toàn bộ field config.
6. Tính winner khi max vote > 0; render final overlay/banner bằng Motion.
7. Dùng `useReducedMotion` để tắt particle/transition không cần thiết.

## Todo List

- [ ] QR dependency và dialog.
- [ ] Shared countdown helper và timer.
- [ ] Auto-close guard/persistence.
- [ ] Final reveal tie/zero-vote logic.
- [ ] Accessible/reduced-motion styles.

## Success Criteria

- QR scan/inspection trả đúng URL.
- Countdown thay đổi mỗi giây và kết thúc tại zero.
- Vote bị chặn sau deadline dù results client đóng; khi mở, config được đưa về inactive best-effort.
- Final reveal đúng winner, tie và no-vote; không lặp animation mỗi snapshot.

## Risk Assessment

- Update loop từ snapshot; chặn bằng ref và chỉ write khi `config.isActive` còn true.
- Dialog browser support; Vite target hiện đại phù hợp, vẫn cần keyboard test.

## Security Considerations

- Không dùng external QR API hoặc nhúng user-controlled payload.
- Chỉ admin-authenticated `/results` thực hiện config update.

## Next Steps

- Phase 06 chạy timer boundary test và manual QR/focus verification.
