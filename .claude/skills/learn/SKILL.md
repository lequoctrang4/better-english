---
name: learn
description: Học từ vựng hoặc mẫu câu mới theo chủ đề. Dùng khi người dùng gõ /learn, hoặc nói muốn học từ mới / câu mới về một chủ đề.
---

# Học mới

Tham số: `[chủ đề] [số lượng]` — VD `/learn meeting 5`, `/learn phrases email`, `/learn`. Mặc định: 5 mục, chủ đề theo profile.

1. Đọc `data/profile.md` và `list vocab --brief` / `list phrase --brief` để tránh trùng và chọn đúng trình độ (cao hơn trình độ hiện tại một chút).
2. Nếu tham số có "phrase(s)"/"câu" → chỉ mẫu câu; mặc định trộn từ + mẫu câu, ưu tiên mục **tần suất cao, dùng được ngay**.
3. Trình bày **từng mục một** theo format thẻ trong `/daily` bước 2. Với mẫu câu: nêu tình huống dùng, mức trang trọng (formal/neutral/casual), 1–2 biến thể.
4. Sau mỗi mục, yêu cầu người dùng đặt câu hoặc trả lời một tình huống → sửa → `add` (tags theo chủ đề, source `learn YYYY-MM-DD`). Nếu người dùng nói đã biết rõ → `add --known`.
5. Cuối phiên: quiz nhanh 1 lượt (VI → EN) các mục vừa học, `grade` kết quả, ghi log, `render`.
