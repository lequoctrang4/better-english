const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' theo giờ địa phương */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  return null;
};

/** dd/MM/yyyy */
export const fmtDate = (v) => {
  const d = toDate(v);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : '—';
};

/** value cho <input type="date"> */
export const inputDate = (v) => {
  const d = toDate(v);
  return d ? dayKey(d) : '';
};

/** '2026-11-04' -> Date (giữa trưa, tránh lệch múi giờ). Nếu là hôm nay dùng giờ hiện tại. */
export const fromInputDate = (s) => {
  if (!s) return null;
  if (s === dayKey()) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const relDay = (v) => {
  const d = toDate(v);
  if (!d) return '—';
  const diff = Math.round((new Date(dayKey()) - new Date(dayKey(d))) / 86400000);
  if (diff === 0) return 'hôm nay';
  if (diff === 1) return 'hôm qua';
  if (diff > 1 && diff < 7) return `${diff} ngày trước`;
  if (diff === -1) return 'ngày mai';
  if (diff < -1 && diff > -30) return `${-diff} ngày nữa`;
  return fmtDate(d);
};

/** Nhãn lịch ôn: 'hôm nay' cho mọi ngày đã đến/qua hạn */
export const dueLabel = (v) => {
  const d = toDate(v);
  if (!d) return '—';
  return new Date(dayKey(d)) <= new Date(dayKey()) ? 'hôm nay' : relDay(d);
};

/** Chuỗi ngày học liên tiếp, tính đến hôm nay (hoặc hôm qua nếu hôm nay chưa học). */
export const calcStreak = (activeKeys) => {
  const set = new Set(activeKeys);
  let cur = new Date();
  if (!set.has(dayKey(cur))) cur = addDays(cur, -1);
  let n = 0;
  while (set.has(dayKey(cur))) {
    n += 1;
    cur = addDays(cur, -1);
  }
  return n;
};
