# Phase 06 — Integration, verification và docs

## Context Links

- [Plan](plan.md)
- [Study evidence](evidence/study-context.json)
- Phase 01–05

## Overview

- Priority: Critical
- Status: Pending
- Mục tiêu: tích hợp các nhánh, chứng minh acceptance criteria và đánh giá tác động tài liệu.

## Key Insights

- Repo chưa có test runner chuyên dụng; ưu tiên helper thuần + TypeScript/build và browser checks có bằng chứng.
- Vite build trong sandbox có thể gặp access-denied; khi lặp lại phải chạy ngoài sandbox thay vì kết luận source lỗi.

## Requirements

- Không còn file ownership conflict hoặc import cycle.
- Type-check, production build và diff check phải pass.
- Kiểm tra Firestore rule bằng emulator nếu sẵn có; nếu không, ghi rõ giới hạn và review rule tĩnh.
- Xác minh deep routes `/results`, `/admin`, `/team-building` với base path.
- Đánh giá docs roadmap/changelog/architecture/code standards theo file thực tế; không tạo tài liệu giả nếu repo không quản lý chúng.

## Architecture

Phase này chạy tuần tự sau mọi phase code, là owner duy nhất của integration fixes và evidence cuối.

## Related Code Files

- Modify: chỉ các file đã thay đổi nếu cần sửa lỗi tích hợp.
- Create: evidence test/review artifacts trong plan directory.
- Docs: cập nhật chỉ khi doc-writer xác nhận có managed docs phù hợp.
- Delete: none ngoài artifact tạm do test tạo nếu có.

## Implementation Steps

1. Reconcile imports/types/routes và chạy `git diff --check`.
2. Chạy TypeScript `--noEmit`; sửa lỗi thật, không nới strictness.
3. Chạy production build với base `/st2026-voting/`; kiểm tra asset URL và `dist/404.html`.
4. Kiểm tra score persistence, rule permissions và missing-document defaults.
5. Manual browser: 320/375/619/1280px, QR, Escape/focus, countdown boundary, final reveal, tie/no-vote.
6. Kiểm tra reduced-motion và keyboard flow.
7. Giao tester, debugger nếu fail, reviewer; ghi evidence theo Takumi gate.
8. Giao project-manager/doc-writer đồng bộ plan và docs impact.

## Todo List

- [ ] Diff/type-check/build pass.
- [ ] Route/base/fallback pass.
- [ ] Team building admin/public flow pass.
- [ ] QR/countdown/final reveal pass.
- [ ] User 2x2 vote flow pass.
- [ ] Accessibility/reduced-motion pass.
- [ ] Tester/reviewer/evidence/doc sync hoàn tất.

## Success Criteria

- Toàn bộ acceptance criteria trong `study-context.json` có bằng chứng pass hoặc giới hạn được nêu rõ.
- Không có critical review finding hoặc reachable regression.
- Không commit/push khi chưa có yêu cầu riêng từ người dùng.

## Risk Assessment

- Firebase live state khó tái tạo; dùng emulator hoặc manual test có kiểm soát và ghi giới hạn.
- QR scan vật lý có thể chưa thực hiện được; ít nhất kiểm tra SVG payload/DOM và URL text.

## Security Considerations

- Kiểm tra public read chỉ mở đúng score document, không mở rộng writes.
- Không log secret/config Firebase ngoài giá trị public đã có trong client.

## Next Steps

- Sau khi Blueprint được duyệt, bắt đầu Phase 01, 04 và 05 theo graph; Phase 02/03 mở khi Phase 01 hoàn tất.
