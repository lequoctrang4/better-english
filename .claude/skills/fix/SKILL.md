---
name: fix
description: Sửa câu, đoạn văn, email, tin nhắn tiếng Anh và giải thích lỗi. Dùng khi người dùng gõ /fix hoặc nhờ kiểm tra/viết lại tiếng Anh.
---

# Sửa tiếng Anh

Tham số: đoạn tiếng Anh cần sửa (có thể kèm ngữ cảnh: gửi sếp, khách hàng, bạn bè...).

1. Câu ngắn (≤ 3 câu) → format "Sửa câu" trong CLAUDE.md cho từng câu có lỗi.
2. Đoạn dài / email:
   - **Bản đã sửa** hoàn chỉnh (giữ ý và giọng của người dùng, điều chỉnh độ trang trọng theo ngữ cảnh).
   - Bảng lỗi chính: `| Gốc | Sửa | Lý do |` — chỉ lỗi đáng kể, tối đa ~8 dòng.
   - (Tuỳ chọn) 1 bản **tự nhiên hơn** như người bản xứ viết.
3. Ghi lỗi thật sự bằng `mistake` (mỗi loại lỗi một lần, script tự tăng đếm nếu lặp).
4. Từ/cụm hay trong bản sửa mà người dùng có thể chưa biết → hỏi "Lưu vào sổ không?" → làm theo `/add`.
5. Nếu lỗi này đã có `count ≥ 3` → nhắc nhẹ "lỗi này lặp lại lần thứ N" và cho 1 mẹo nhớ.
