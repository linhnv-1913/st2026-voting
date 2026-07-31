# Phase 02 — Admin Team building score editor

## Context Links

- [Phase 01](phase-01-shared-data-contracts.md)
- [UI design blueprint](reports/ui-design-blueprint.md)
- `src/components/AdminPanel.tsx`

## Overview

- Priority: High
- Status: Pending
- Mục tiêu: cho admin nhập/lưu bốn điểm Team building độc lập với cấu hình poll.

## Key Insights

- `AdminPanel.tsx` đã lớn; business/UI mới cần component riêng.
- Score save không được gọi chung `handleSaveConfig` để tránh ghi đè poll.

## Requirements

- Subscribe realtime `team-building/scores` và mặc định bốn giá trị `0`.
- Bốn input có label, màu Hub, integer `0..1_000_000`.
- Save state gồm idle/saving/success/error; lỗi nằm cạnh form.
- Có link mở `/team-building` trong tab mới.

## Architecture

`AdminDashboard` render `TeamBuildingScoreEditor`; component tự quản snapshot và save riêng qua Firebase.

## Related Code Files

- Modify: `src/components/AdminPanel.tsx`
- Create: `src/components/team-building-score-editor.tsx`
- Create: `src/components/team-building-score-editor.css`
- Delete: none

## Implementation Steps

1. Tạo component dưới 200 dòng với typed local form state.
2. Load document realtime và normalize field thiếu về `0`.
3. Validate mọi field trước write; lưu `scores` và `updatedAt` cùng lúc.
4. Hiển thị feedback accessible và disable button khi saving/invalid.
5. Gắn component vào admin grid và thêm link scoreboard.

## Todo List

- [ ] Component score editor và style riêng.
- [ ] Realtime load/default state.
- [ ] Validation và save feedback.
- [ ] Admin integration và scoreboard link.

## Success Criteria

- Admin nhập/lưu được bốn điểm mà poll config không thay đổi.
- Reload giữ đúng dữ liệu Firestore.
- Invalid input không gửi write.
- Keyboard và screen reader nhận đúng label/state.

## Risk Assessment

- Snapshot có thể ghi đè input đang sửa; chỉ đồng bộ form khi không dirty hoặc sau save thành công.
- Alert spam; dùng inline status thay vì `window.alert` cho save thường lệ.

## Security Considerations

- UI không thay thế Firestore rules; lỗi permission phải được hiển thị rõ.
- Không log dữ liệu auth/token.

## Next Steps

- Phase 06 kiểm tra persistence và tương tác cùng poll editor.
