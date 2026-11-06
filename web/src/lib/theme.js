export const THEMES = [
  { id: 'forest', name: 'Rừng đêm', swatch: ['#111312', '#d6eea5'], meta: '#111312' },
  { id: 'pink', name: 'Hồng nhạt', swatch: ['#fff6f8', '#f6a5bf'], meta: '#fff6f8' },
  { id: 'mint', name: 'Xanh mint', swatch: ['#f2fbf7', '#6fdcb6'], meta: '#f2fbf7' },
  { id: 'sky', name: 'Blue sky', swatch: ['#f3f8ff', '#8cc6f7'], meta: '#f3f8ff' },
];

const KEY = 'wordroom-theme';

export function storedTheme() {
  try {
    const t = localStorage.getItem(KEY);
    return THEMES.some((x) => x.id === t) ? t : 'forest';
  } catch {
    return 'forest';
  }
}

export function applyTheme(id) {
  const t = THEMES.find((x) => x.id === id) || THEMES[0];
  const root = document.documentElement;
  // Tắt transition trong lúc đổi theme để không bị "kẹt" màu cũ
  root.classList.add('theme-switching');
  root.dataset.theme = t.id;
  void root.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.meta);
  try {
    localStorage.setItem(KEY, t.id);
  } catch {
    /* private mode */
  }
  return t.id;
}
