export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';

/** Nghĩa ngắn gọn: lấy nghĩa đầu tiên trước dấu ; */
export const shortMeaning = (m = '') => m.split(';')[0].trim();

/** Che từ trong câu ví dụ: "We achieved our target" -> "We ____ our target" */
export function blankOut(sentence, word) {
  if (!sentence || !word) return sentence || '';
  const base = word.toLowerCase().replace(/[^a-z' -]/g, '').trim();
  if (!base) return sentence;
  const stem = base.length > 4 ? base.replace(/(e|y)$/, '') : base;
  const esc = stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${esc}[a-z]*\\b`, 'gi');
  return sentence.replace(re, (m) => '_'.repeat(Math.max(4, Math.min(m.length, 10))));
}

/** Ưu tiên từ hay sai / ít luyện, có chút ngẫu nhiên */
export function pickForPractice(words, n) {
  const scored = words.map((w) => {
    const c = w.correct || 0;
    const x = w.wrong || 0;
    const last = w.lastPracticedAt?.toMillis?.() || 0;
    const ageDays = last ? (Date.now() - last) / 86400000 : 30;
    const score = c - x * 2 - Math.min(ageDays, 30) / 5 + Math.random() * 3;
    return { w, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return shuffle(scored.slice(0, n).map((s) => s.w));
}

export const firebaseError = (e) => {
  const code = e?.code || '';
  const map = {
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/wrong-password': 'Mật khẩu không đúng.',
    'auth/user-not-found': 'Không tìm thấy tài khoản này.',
    'auth/email-already-in-use': 'Email này đã được đăng ký.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/cancelled-popup-request': 'Đăng nhập đã bị huỷ.',
    'auth/too-many-requests': 'Thử quá nhiều lần, vui lòng đợi một lát.',
    'auth/network-request-failed': 'Lỗi mạng, kiểm tra kết nối.',
    'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase.',
    'auth/unauthorized-domain': 'Tên miền chưa được cho phép trong Firebase Auth.',
    'permission-denied': 'Bạn không có quyền thực hiện thao tác này.',
  };
  return map[code] || e?.message || 'Có lỗi xảy ra.';
};
