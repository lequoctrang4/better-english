# wordroom — web học từ vựng

React + Vite, Firebase Auth (Google, Email/Password), Firestore, Firebase Hosting. Chạy hoàn toàn trên gói Spark (free), không dùng Cloud Functions.

## Chạy

```bash
npm install
npm run dev          # dùng project thật (đọc .env)
```

Chạy local hoàn toàn bằng emulator (không đụng dữ liệu thật):

```bash
npm run emulators    # terminal 1 — cần JDK 21+ (máy này dùng /opt/homebrew/opt/openjdk)
npm run dev:emu      # terminal 2 — tài khoản test ghi trong .env.emulator
```

## Deploy

```bash
npm run deploy       # build + deploy hosting và firestore rules
```

Project: `better-english-e7708` (tài khoản lequoctrang4@gmail.com). Nếu CLI đang đăng nhập tài khoản khác:
`firebase login:add` rồi `firebase login:use lequoctrang4@gmail.com`.

## Dữ liệu Firestore

```
users/{uid}                     hồ sơ công khai: displayName, email, photoURL, wordCount, masteredCount, lastActiveDate
users/{uid}/words/{id}          text, meaning, pos, ipa, example, exampleVi, note, tags[],
                                status (learning|mastered), learnedAt (ngày học), masteredAt (ngày thuộc),
                                correct, wrong, lastPracticedAt
users/{uid}/activity/{YYYY-MM-DD}  added, mastered, practiced, correct, wrong — dùng cho streak & heatmap
users/{uid}/friends/{friendUid} danh sách bạn (đối xứng)
friendRequests/{from}_{to}      lời mời kết bạn
```

Quyền (xem `firestore.rules`): chỉ chủ sở hữu được ghi; bạn bè đọc được `words` và `activity` của nhau.

## Cấu trúc

- `src/styles/tokens.css` — toàn bộ màu/bo góc/font (theme Vibe Room). Đổi theme chỉ cần sửa file này.
- `src/lib/` — Firebase, dữ liệu từ vựng, bạn bè.
- `src/pages/` — Tổng quan, Sổ từ vựng, Bộ từ vựng, Luyện tập, Bạn bè, Hồ sơ bạn bè.
- **Bộ từ vựng** (`/sets`): mỗi bộ = một tag trong sổ, không cần collection riêng.
  - Thư viện bộ có sẵn (Động vật, Đồ vật trong nhà, Văn phòng & đồ công nghệ) nằm ở `src/data/sets.json`,
    sinh bởi `python3 scripts/gen_web_sets.py` (bộ Động vật lấy từ `data/vocab.json`, tag `animals`).
    Thêm bộ mới: sửa script rồi chạy lại.
  - Tự tạo bộ: đặt tên → thêm từ mới hoặc chọn từ có sẵn trong sổ. Xoá bộ chỉ gỡ tag, không xoá từ.
  - Luyện theo bộ: `/practice?tag=<tag>`; trắc nghiệm lấy đáp án nhiễu trong cùng bộ nếu bộ có ≥ 4 từ.
- `src/games/` — Thẻ ghi nhớ, Ghép từ, Trắc nghiệm, Gõ từ, Sắp chữ, Nghe & gõ.
- Nút **Nhập JSON** trong Sổ từ vựng nhận file `data/vocab.json` của dự án.
