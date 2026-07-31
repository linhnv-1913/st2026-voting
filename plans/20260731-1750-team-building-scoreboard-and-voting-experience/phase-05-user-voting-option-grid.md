# Phase 05 — User voting option grid

## Context Links

- [UI design blueprint](reports/ui-design-blueprint.md)
- Screenshot tham chiếu: `codex-clipboard-0a40678e-fc30-4d74-981c-3ac178331e71.png`
- `src/components/UserVote.tsx`, `src/index.css`

## Overview

- Priority: High
- Status: Pending
- Mục tiêu: chuyển option thành thẻ 2x2 gần vuông, bỏ số thứ tự và giữ nguyên chọn đúng ba đáp án.

## Key Insights

- Selection semantics hiện đúng qua `aria-pressed` và giới hạn ba lựa chọn.
- CSS cũ dùng row layout và badge số; cần thay có kiểm soát, không đổi vote payload.

## Requirements

- Hai cột ở 320px trở lên, không scroll ngang.
- Bỏ hoàn toàn numeric badge khỏi DOM.
- Label giữa, Hub colors, selected check, focus-visible và disabled state rõ.
- Selected option không bị mờ khi các option khác disabled.
- Giữ helper text `sr-only`, progress `n/3`, submit contract và expired state.

## Architecture

Chỉ thay markup trình bày và CSS; `toggleOption`, `handleVote` và Firestore payload không đổi.

## Related Code Files

- Modify: `src/components/UserVote.tsx`
- Modify: `src/index.css`
- Create: none
- Delete: none

## Implementation Steps

1. Bỏ index khỏi map khi không còn dùng và xóa `vote-option__number` markup.
2. Thêm selected check decorative, giữ `aria-pressed` là semantic source.
3. Chuyển grid hai cột và card aspect ratio gần vuông.
4. Dùng CSS variables Hub cho background/text/focus/selected states với contrast phù hợp.
5. Điều chỉnh mobile dock/padding để grid không bị che.
6. Giữ reduced-motion rule hiện có cho shimmer/transform.

## Todo List

- [ ] Bỏ numeric badge và index dư.
- [ ] Thêm selected indicator.
- [ ] Implement responsive 2x2 card styles.
- [ ] Kiểm tra disabled/focus/expired/has-voted states.

## Success Criteria

- Bốn option hiển thị 2x2 tại 320/375/619px và desktop.
- Không còn số thứ tự; label không bị cắt.
- Chọn/bỏ chọn và submit đúng ba option như trước.
- Keyboard focus rõ, screen reader nhận selected state.

## Risk Assessment

- Card vuông có thể đẩy submit xuống dưới fold; dùng clamp/aspect ratio và giữ fixed dock trên mobile.
- Màu fill ảnh hưởng contrast; kiểm tra từng Hub, không dựa vào shadow.

## Security Considerations

- Không thay vote validation hoặc user identity contract.
- Disabled UI không thay thế Firestore deadline rule.

## Next Steps

- Phase 06 chạy manual responsive/keyboard tests và regression vote flow.
