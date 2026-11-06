---
name: review
description: Ôn tập nhanh các từ vựng và mẫu câu đến hạn theo lặp lại ngắt quãng. Dùng khi người dùng gõ /review hoặc muốn "ôn bài".
---

# Ôn tập

Tham số tuỳ chọn: số lượng (mặc định 20), `vocab` hoặc `phrase`.

1. `python3 scripts/eng.py due --limit <N> [--kind ...]`. Không có gì đến hạn → báo, gợi ý `/learn` hoặc ôn thêm các từ box thấp (`list vocab --status learning --brief`), dừng.
2. Hỏi từng mục một, xoay vòng dạng câu hỏi như bước 1 của `/daily`. Không lộ đáp án trong câu hỏi.
3. Sau mỗi câu trả lời: chấm `again|hard|good|easy` → `grade` ngay → phản hồi 1–2 dòng (đúng: xác nhận + ví dụ khác; sai: đáp án + mẹo nhớ).
4. Mục `again` → hỏi lại một lần ở cuối phiên (không `grade` lần hai).
5. Kết thúc: thống kê ngắn, nối mục vào `logs/YYYY-MM-DD.md`, `render`.
