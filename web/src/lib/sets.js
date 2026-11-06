import LIBRARY from '../data/sets.json';

/**
 * Thư viện bộ từ có sẵn (src/data/sets.json, sinh bởi scripts/gen_web_sets.py).
 * Mỗi bộ: { id, tag, emoji, name, en, desc, groups: [{ name, emoji, words: [...] }] }
 * Khi thêm vào sổ, từ được gắn tag của bộ — "bộ của bạn" chính là các tag trong sổ.
 */
export { LIBRARY };
export { setName, setEmoji, setPath, practicePath } from './setMeta';
export const LIB_BY_ID = Object.fromEntries(LIBRARY.map((s) => [s.id, s]));
export const LIB_BY_TAG = Object.fromEntries(LIBRARY.map((s) => [s.tag, s]));
export const libWords = (set) => set.groups.flatMap((g) => g.words);

/** Gom từ trong sổ theo tag: [{ tag, words }] — bộ nhiều từ đứng trước */
export function groupByTag(words) {
  const m = new Map();
  for (const w of words) for (const t of w.tags || []) {
    if (!m.has(t)) m.set(t, []);
    m.get(t).push(w);
  }
  return [...m.entries()]
    .map(([tag, ws]) => ({ tag, words: ws }))
    .sort((a, b) => b.words.length - a.words.length || a.tag.localeCompare(b.tag));
}
