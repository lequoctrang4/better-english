import META from '../data/sets-meta.json';

/** Tên/emoji của các bộ trong thư viện — bản nhẹ, không kèm danh sách từ (sinh bởi scripts/gen_web_sets.py) */
const BY_TAG = Object.fromEntries(META.map((s) => [s.tag, s]));

export const setName = (tag) => BY_TAG[tag]?.name || tag;
export const setEmoji = (tag) => BY_TAG[tag]?.emoji || '🏷️';
export const setPath = (tag) => `/sets/t/${encodeURIComponent(tag)}`;
export const practicePath = (tag) => `/practice?tag=${encodeURIComponent(tag)}`;
