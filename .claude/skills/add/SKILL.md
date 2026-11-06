---
name: add
description: Lưu nhanh một hoặc nhiều từ / cụm từ / mẫu câu tiếng Anh vào sổ học. Dùng khi người dùng gõ /add hoặc nói "lưu từ này", "thêm từ".
---

# Thêm vào sổ

Tham số: một hoặc nhiều từ/câu, có thể kèm ngữ cảnh (câu gốc nơi gặp từ).

1. Xác định từng mục là `vocab` (một từ/từ ghép) hay `phrase` (cụm, câu, idiom, phrasal verb nhiều từ).
2. Đưa về dạng gốc (VD "struggling" → `struggle`); nếu ngữ cảnh cho nghĩa cụ thể thì ưu tiên nghĩa đó.
3. Điền đủ trường theo "Quy tắc khi thêm mục mới" trong CLAUDE.md. Nếu người dùng đưa câu gốc → dùng làm `example` (sửa nếu sai) và ghi `source`.
4. `add`. Nếu báo trùng → cho người dùng biết trạng thái hiện tại và hỏi có muốn ôn lại ngay hoặc bổ sung ví dụ (`update`) không.
5. Hiển thị thẻ của mục vừa lưu (format như `/daily`), mời người dùng đặt một câu để nhớ (tuỳ chọn), sau đó `render`.
