---
name: daily
description: Buổi học tiếng Anh hằng ngày đầy đủ (ôn tập, từ mới, luyện tập, tổng kết). Dùng khi người dùng gõ /daily, chào để bắt đầu học, hoặc hỏi "hôm nay học gì".
---

# Buổi học hằng ngày (~15–20 phút)

Tuân thủ quy tắc trong CLAUDE.md. Hỏi từng câu một, chờ trả lời.

## 0. Khởi động (không hỏi gì dài)
1. Chạy `python3 scripts/eng.py stats` và đọc `data/profile.md`, log gần nhất trong `logs/` (mục "Gợi ý buổi sau").
2. Chào ngắn bằng tiếng Anh, báo: streak, số mục đến hạn, kế hoạch hôm nay (1–2 dòng).
3. Nếu profile còn mục "Cần hỏi người học" chưa tick → hỏi **một** câu trong đó (rồi cập nhật profile).

## 1. Ôn tập (tối đa 15 mục)
- `python3 scripts/eng.py due --limit 15`.
- Nếu có từ `unrated` (xem `list vocab --status unrated --brief`): mỗi buổi hỏi nhanh 5 từ "Biết từ này chưa? Nghĩa là gì?" → `rate`.
- Với mỗi mục đến hạn, **xoay vòng** dạng câu hỏi:
  - EN → VI: "What does *approach* mean?"
  - VI → EN: "Từ nào nghĩa là 'bền vững'?"
  - Điền chỗ trống: "We need a more ___ way of working. (bền vững)"
  - Đặt câu: "Make a sentence with *avoid*." (cho box ≥ 2)
  - Mẫu câu: đưa tình huống, yêu cầu người dùng nói câu phù hợp.
- Chấm và gọi `grade` **ngay sau mỗi câu trả lời**. Sai → đưa đáp án + ví dụ + mẹo nhớ ngắn.
- Câu người dùng tự đặt → sửa theo format "Sửa câu" trong CLAUDE.md.

## 2. Học mới (mặc định 5 mục, ví dụ 3 từ + 2 mẫu câu)
- Nếu tỉ lệ `again` khi ôn > 30% → giảm còn 3 mục.
- Chọn theo mục tiêu trong profile và chủ đề liên quan đến từ đang học; tránh trùng (`list ... --brief`).
- Mỗi mục trình bày gọn:
  ```
  🆕 negotiate /nɪˈɡoʊʃieɪt/ (verb) — đàm phán, thương lượng
     📌 We negotiated a better price with the supplier.
     🔗 negotiate a deal / a contract / with someone
     💡 Mẹo: ...
  ```
- Sau mỗi mục yêu cầu người dùng đặt 1 câu → sửa → `add` (kèm source `daily YYYY-MM-DD`).

## 3. Luyện tổng hợp (1 bài)
Chọn một: viết 3–4 câu về ngày hôm nay dùng ≥ 2 từ mới; dịch 3 câu Việt → Anh; mini hội thoại 4 lượt. Ưu tiên luyện lỗi có `count ≥ 3` trong `data/mistakes.json`.

## 4. Tổng kết
- Tóm tắt: số mục ôn (good/hard/again), từ mới, lỗi đã sửa, 1 lời khen cụ thể, 1 điểm cần chú ý.
- Ghi `logs/YYYY-MM-DD.md` theo mẫu trong CLAUDE.md, cập nhật profile nếu có điều mới.
- `python3 scripts/eng.py render`.
- Chào kết thúc: "See you tomorrow!" + nhắc số mục đến hạn ngày mai nếu biết.

Nếu người dùng muốn dừng giữa chừng → nhảy thẳng tới bước 4.
