# Phase 01 — Shared data contracts

## Context Links

- [Study report](reports/study-report.md)
- [Study evidence](evidence/study-context.json)
- `src/types.ts`, `src/hubOptions.ts`, `firestore.rules`

## Overview

- Priority: Critical
- Status: Pending
- Mục tiêu: định nghĩa một hợp đồng điểm Team building riêng, backward-compatible và được Firestore bảo vệ.

## Key Insights

- `config/main` đang phục vụ poll và không nên chứa dữ liệu điểm ngoài poll.
- Bốn Hub là tập cố định: Hub 1, Hub 2, Hub 4, Hub 5.
- Public scoreboard cần read công khai; ghi dữ liệu chỉ dành cho admin.

## Requirements

- Tạo type cho score map và document `team-building/scores`.
- Thiếu document/field phải mặc định về `0` ở client.
- Điểm là integer từ `0` đến `1_000_000`; `updatedAt` là epoch milliseconds.
- Không thay đổi contract của `Config` và `Vote`.

## Architecture

```text
Admin editor -> team-building/scores <- public scoreboard
                         |
                   Firestore rules
```

## Related Code Files

- Modify: `src/types.ts`
- Modify: `src/hubOptions.ts`
- Modify: `firestore.rules`
- Create: none
- Delete: none

## Implementation Steps

1. Thêm `HubId`, `TeamBuildingScores` và `TeamBuildingScoreDocument` với key cố định.
2. Expose danh sách Hub metadata dùng chung, giữ nguyên các helper class hiện tại.
3. Thêm rule `team-building/{documentId}`: public read, admin create/update, validate exact keys/type/range.
4. Không cho client delete score document.
5. Kiểm tra rule mới không nới quyền `config`, `votes` hoặc `admins`.

## Todo List

- [ ] Thêm type score document.
- [ ] Thêm Hub metadata dùng chung.
- [ ] Thêm Firestore validation/read/write rules.
- [ ] Kiểm tra backward compatibility khi document chưa tồn tại.

## Success Criteria

- Admin hợp lệ có thể ghi đúng schema; user không thể ghi.
- Public client đọc được score document.
- Số âm, số thập phân, key lạ và giá trị quá lớn bị từ chối.
- Poll/vote contract hiện tại không thay đổi.

## Risk Assessment

- Firestore map validation sai có thể chặn dữ liệu hợp lệ; giảm thiểu bằng exact-key tests/manual emulator check nếu khả dụng.
- Metadata Hub bị trùng với CSS mapping; giảm thiểu bằng một nguồn danh sách dùng chung.

## Security Considerations

- Chỉ `isAdmin()` được create/update.
- Không dùng client timestamp làm căn cứ phân quyền; `updatedAt` chỉ là metadata hiển thị.

## Next Steps

- Phase 02 và 03 có thể chạy song song sau khi contract hoàn tất.
