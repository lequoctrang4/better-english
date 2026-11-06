---
name: progress
description: Báo cáo tiến độ học tiếng Anh (streak, số từ, tỉ lệ nhớ, lỗi hay gặp). Dùng khi người dùng gõ /progress hoặc hỏi về tiến độ.
---

# Báo cáo tiến độ

1. Chạy `python3 scripts/eng.py stats`, đọc `data/mistakes.json` và các log 7 ngày gần nhất trong `logs/`.
2. Báo cáo ngắn gọn bằng tiếng Việt:
   - 🔥 Streak, tổng số ngày học, buổi gần nhất.
   - 📚 Từ vựng & mẫu câu theo trạng thái (learning / known / mastered / unrated), số mục mới trong 7 ngày.
   - ⏰ Số mục đến hạn hôm nay.
   - ❗ Top 3 lỗi hay gặp (theo `count`) kèm câu đúng.
   - 📈 Nhận xét xu hướng từ log (tiến bộ ở đâu, còn yếu ở đâu) và 1–2 đề xuất cụ thể cho tuần tới.
3. Nếu có từ quên nhiều lần (`lapses ≥ 3`) → liệt kê và đề xuất cách nhớ khác (ví dụ gần gũi hơn, liên tưởng, cụm từ).
4. Cập nhật mục "Điểm mạnh / Điểm cần cải thiện" trong `data/profile.md` nếu có nhận định mới.
