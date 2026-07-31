# Phase 03 — Public Team building scoreboard

## Context Links

- [Phase 01](phase-01-shared-data-contracts.md)
- [UI design blueprint](reports/ui-design-blueprint.md)
- `src/App.tsx`, `src/components/MatsuriShell.tsx`

## Overview

- Priority: High
- Status: Pending
- Mục tiêu: tạo route công khai `/team-building` hiển thị điểm realtime cho bốn Hub.

## Key Insights

- Route dùng cho màn hình trình chiếu nên cần typography lớn và không phụ thuộc admin session.
- Thiếu document không phải lỗi fatal; hiển thị `0` cho mọi đội.

## Requirements

- Public route với loading/error/empty-default states.
- Grid bốn đội: 4 cột trên màn lớn, 2x2 trên màn nhỏ.
- Realtime update, màu và label Hub; không dựa riêng vào màu.
- Animation value update tôn trọng reduced-motion.

## Architecture

`TeamBuildingScoreboard` subscribe trực tiếp `team-building/scores`; route được đăng ký trong `App.tsx`.

## Related Code Files

- Modify: `src/App.tsx`
- Create: `src/components/team-building-scoreboard.tsx`
- Create: `src/components/team-building-scoreboard.css`
- Delete: none

## Implementation Steps

1. Tạo component realtime typed, cleanup listener và error callback.
2. Normalize dữ liệu thiếu về score map mặc định.
3. Render Matsuri header và bốn score tiles responsive.
4. Animate transform/opacity hoặc number transition nhẹ; bỏ animation khi reduced-motion.
5. Đăng ký `/team-building` bằng route tương đối để tôn trọng basename.

## Todo List

- [ ] Realtime scoreboard component.
- [ ] Responsive Matsuri score tiles.
- [ ] Loading/error/default states.
- [ ] Route registration.

## Success Criteria

- URL `/team-building` hiển thị bốn Hub và dữ liệu cập nhật không reload.
- Document chưa tồn tại hiển thị bốn số `0`.
- Route hoạt động local và dưới `/st2026-voting/` build base.
- Không yêu cầu đăng nhập và không có write control.

## Risk Assessment

- Số lớn làm vỡ layout; dùng tabular numbers, clamp font và overflow-safe.
- Deep link GitHub Pages; xác minh generated `404.html` ở Phase 06.

## Security Considerations

- Component chỉ đọc collection đã được rule public hóa.
- Error UI không lộ chi tiết Firebase nội bộ.

## Next Steps

- Phase 06 kiểm tra 320/375/619/1280px và realtime từ admin editor.
