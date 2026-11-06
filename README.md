# Học tiếng Anh cùng Claude

Dự án tự học từ vựng và mẫu câu tiếng Anh qua chat hằng ngày với Claude. Claude là gia sư, đồng thời tự lưu từ, lên lịch ôn (lặp lại ngắt quãng) và ghi nhật ký.

## Cách dùng hằng ngày

Mở Claude Code trong thư mục này, rồi gõ:

| Lệnh | Dùng khi |
|---|---|
| `/daily` | Mỗi ngày — buổi học đầy đủ 15–20 phút (hoặc chỉ cần chào "hi") |
| `/review` | Chỉ muốn ôn bài cũ |
| `/learn meeting 5` | Học 5 từ/câu mới về chủ đề *meeting* |
| `/add <từ hoặc câu>` | Gặp từ hay ở đâu đó, muốn lưu lại |
| `/fix <đoạn tiếng Anh>` | Nhờ sửa câu, email, tin nhắn |
| `/talk job interview` | Luyện hội thoại nhập vai |
| `/progress` | Xem tiến độ |

Bất kỳ câu tiếng Anh nào bạn gõ cũng sẽ được sửa nếu sai.

## Cấu trúc

```
CLAUDE.md            Quy tắc cho Claude (vai trò, dữ liệu, quy trình)
VOCAB.md             Sổ tay dễ đọc — tự sinh, mở để xem toàn bộ từ đã học
data/
  vocab.json         Từ vựng
  phrases.json       Mẫu câu & cụm từ
  mistakes.json      Lỗi sai hay gặp
  profile.md         Hồ sơ người học (bạn có thể tự sửa)
logs/YYYY-MM-DD.md   Nhật ký từng buổi học
scripts/eng.py       Công cụ quản lý dữ liệu + lịch ôn
.claude/skills/      Các lệnh /daily, /review, ...
archive/             Tài liệu gốc
```

## Lịch ôn

Mỗi mục có một "hộp" (box 0–6). Nhớ đúng → lên hộp, quên → về hộp 0. Khoảng cách ôn: 0 → 1 → 3 → 7 → 14 → 30 → 90 ngày.
Trạng thái: **learning** (box 0–2) → **known** (3–4) → **mastered** (5–6). Từ **unrated** là từ cũ chưa xác nhận bạn biết hay chưa — Claude sẽ hỏi dần.
