---
work_type: feature
spec_waived: "SDD mode disabled (takumi.sddMode: off)"
status: pending
progress: 0
created: 2026-07-31
language: vi
---

# Team building scoreboard và voting experience

## Mục tiêu

Bổ sung bảng điểm Team building độc lập, QR/countdown/final reveal cho màn kết quả và lưới đáp án 2x2 cho người bình chọn mà không phá hợp đồng poll/vote hiện tại.

## Các phase

| Phase | Nội dung | Trạng thái | Tiến độ | Phụ thuộc |
|---|---|---|---:|---|
| [01](phase-01-shared-data-contracts.md) | Data contract, Firestore rules và Hub metadata | Pending | 0% | - |
| [02](phase-02-admin-team-building-score-editor.md) | Form nhập điểm Team building trong admin | Pending | 0% | 01 |
| [03](phase-03-public-team-building-scoreboard.md) | Route `/team-building` và scoreboard realtime | Pending | 0% | 01 |
| [04](phase-04-results-qr-countdown-and-final-reveal.md) | QR, countdown, auto-close và final reveal | Pending | 0% | - |
| [05](phase-05-user-voting-option-grid.md) | Option grid 2x2, bỏ số thứ tự | Pending | 0% | - |
| [06](phase-06-integration-verification-and-docs.md) | Tích hợp, test, browser verification và docs impact | Pending | 0% | 02, 03, 04, 05 |

## Đồ thị thực thi

```text
01 ─┬─> 02 ─┐
    └─> 03 ─┤
04 ────────>├─> 06
05 ────────>┘
```

## File ownership

| Owner | Phạm vi ghi |
|---|---|
| Phase 01 | `src/types.ts`, `src/hubOptions.ts`, `firestore.rules` |
| Phase 02 | `src/components/AdminPanel.tsx`, `team-building-score-editor.*` |
| Phase 03 | `src/App.tsx`, `team-building-scoreboard.*` |
| Phase 04 | `ResultsDisplay.tsx`, `results-qr-dialog.*`, `final-results-reveal.*`, `countdown.ts`, `package.json`, `bun.lock` |
| Phase 05 | `UserVote.tsx`, `src/index.css` |
| Phase 06 | Test/evidence/docs và sửa tích hợp tuần tự sau khi các phase khác kết thúc |

## Ràng buộc

- Điểm Team building không cộng vào phiếu bình chọn.
- Không thêm backend scheduler; `endTime` trong Firestore rules là lớp chặn tuyệt đối.
- QR payload phải đúng `https://sal.vn/c3-voting`.
- Giữ tương thích dữ liệu cũ và `BrowserRouter basename` cho GitHub Pages.

## Tài liệu đầu vào

- [Study report](reports/study-report.md)
- [UI design blueprint](reports/ui-design-blueprint.md)
- [Study evidence](evidence/study-context.json)
