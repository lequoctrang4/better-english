import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
  increment,
  Timestamp,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './auth';
import { dayKey, addDays, calcStreak, fromInputDate } from './date';

export const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'phrasal verb', 'idiom', 'preposition', 'conjunction', 'other'];
export const POS_VI = {
  noun: 'danh từ', verb: 'động từ', adjective: 'tính từ', adverb: 'trạng từ', phrase: 'cụm từ',
  'phrasal verb': 'cụm động từ', idiom: 'thành ngữ', preposition: 'giới từ', conjunction: 'liên từ', other: 'khác',
};

const POS_ALIAS = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', conj: 'conjunction', phr: 'phrase', 'phrasal-verb': 'phrasal verb' };

export const wordsCol = (uid) => collection(db, 'users', uid, 'words');
const userRef = (uid) => doc(db, 'users', uid);
const activityRef = (uid, key = dayKey()) => doc(db, 'users', uid, 'activity', key);

function bumpActivity(batch, uid, fields) {
  const inc = Object.fromEntries(Object.entries(fields).filter(([, v]) => v).map(([k, v]) => [k, increment(v)]));
  batch.set(activityRef(uid), { date: dayKey(), ...inc }, { merge: true });
  batch.set(userRef(uid), { lastActiveDate: dayKey() }, { merge: true });
}

const ts = (d) => (d ? Timestamp.fromDate(d) : null);

/* ---------- Lặp lại ngắt quãng (Leitner, giống scripts/eng.py) ---------- */
/** Khoảng ôn (ngày) theo box 0..6 */
export const INTERVALS = [0, 1, 3, 7, 14, 30, 90];
export const MAX_BOX = INTERVALS.length - 1;
/** Box từ đây trở lên thì tự đánh dấu "đã thuộc" */
export const MASTER_BOX = 5;

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};
const toD = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null);

/** Box & ngày đến hạn của một từ (kể cả từ cũ chưa có dữ liệu SRS) */
export function srsOf(w) {
  const box = Number.isInteger(w.box) ? w.box : w.status === 'mastered' ? MASTER_BOX : 0;
  let due = toD(w.nextReview);
  if (!due) {
    const base = toD(w.status === 'mastered' ? w.masteredAt : w.learnedAt) || new Date();
    due = addDays(startOfDay(base), INTERVALS[box]);
  }
  return { box, due };
}
export const isDue = (w) => srsOf(w).due <= endOfToday();
const scheduleFrom = (box, from = new Date()) => Timestamp.fromDate(addDays(startOfDay(from), INTERVALS[box]));

/** Chuẩn hoá dữ liệu từ form */
function clean(data) {
  const tags = Array.isArray(data.tags)
    ? data.tags
    : String(data.tags || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  const status = data.status === 'mastered' ? 'mastered' : 'learning';
  return {
    text: String(data.text || '').trim(),
    meaning: String(data.meaning || '').trim(),
    pos: POS_ALIAS[data.pos] || data.pos || '',
    ipa: String(data.ipa || '').trim(),
    example: String(data.example || '').trim(),
    exampleVi: String(data.exampleVi || '').trim(),
    note: String(data.note || '').trim(),
    audio: /^https:\/\//.test(data.audio || '') ? data.audio : '',
    tags,
    status,
    learnedAt: ts(fromInputDate(data.learnedAt)) || Timestamp.now(),
    masteredAt: status === 'mastered' ? ts(fromInputDate(data.masteredAt)) || Timestamp.now() : null,
  };
}

/** Dữ liệu SRS khi đổi trạng thái thủ công */
function srsForStatus(mastered, prev) {
  const { box } = prev ? srsOf(prev) : { box: 0 };
  if (mastered) {
    const b = Math.max(box, MASTER_BOX);
    return { box: b, nextReview: scheduleFrom(b) };
  }
  return { box: Math.min(box, 2), nextReview: scheduleFrom(0) };
}

export async function addWord(uid, data) {
  const w = clean(data);
  const batch = writeBatch(db);
  const ref = doc(wordsCol(uid));
  batch.set(ref, {
    ...w,
    ...srsForStatus(w.status === 'mastered'),
    lapses: 0, correct: 0, wrong: 0, lastPracticedAt: null, createdAt: serverTimestamp(),
  });
  bumpActivity(batch, uid, { added: 1, mastered: w.status === 'mastered' ? 1 : 0 });
  await batch.commit();
  return ref.id;
}

export async function updateWord(uid, id, data, prev) {
  const w = clean(data);
  const changed = prev?.status !== w.status;
  const batch = writeBatch(db);
  batch.update(doc(wordsCol(uid), id), { ...w, ...(changed ? srsForStatus(w.status === 'mastered', prev) : {}) });
  if (prev?.status !== 'mastered' && w.status === 'mastered') bumpActivity(batch, uid, { mastered: 1 });
  await batch.commit();
}

export async function setMastered(uid, word, mastered) {
  const batch = writeBatch(db);
  batch.update(doc(wordsCol(uid), word.id), {
    status: mastered ? 'mastered' : 'learning',
    masteredAt: mastered ? serverTimestamp() : null,
    ...srsForStatus(mastered, word),
  });
  if (mastered) bumpActivity(batch, uid, { mastered: 1 });
  await batch.commit();
}

export async function deleteWord(uid, id) {
  const batch = writeBatch(db);
  batch.delete(doc(wordsCol(uid), id));
  await batch.commit();
}

/**
 * Lưu kết quả một lượt chơi và cập nhật lịch ôn.
 * results: [{ id, correct }] — một từ sai ít nhất một lần trong lượt thì tính là sai.
 * - Sai: về box 0 (ôn lại ngay hôm nay), nếu đang "đã thuộc" thì chuyển về "đang học".
 * - Đúng và đã đến hạn: lên 1 box, hẹn ngày ôn tiếp theo. Đến box 5 tự đánh dấu "đã thuộc".
 * - Đúng nhưng chưa đến hạn (luyện thêm): giữ nguyên lịch.
 * Trả về { [id]: { box, nextReview: Date, status, change: 'up'|'down'|'same', mastered?: true } }
 */
export async function recordPractice(uid, results, wordsById = {}) {
  if (!results.length) return {};
  const agg = {};
  for (const r of results) {
    agg[r.id] = agg[r.id] || { c: 0, x: 0 };
    if (r.correct) agg[r.id].c += 1;
    else agg[r.id].x += 1;
  }
  const batch = writeBatch(db);
  const out = {};
  let newlyMastered = 0;
  for (const [id, { c, x }] of Object.entries(agg)) {
    const w = wordsById[id];
    const upd = { correct: increment(c), wrong: increment(x), lastPracticedAt: serverTimestamp() };
    if (w) {
      const { box, due } = srsOf(w);
      const ok = x === 0;
      let nb = box;
      let change = 'same';
      if (!ok) {
        nb = 0;
        change = box > 0 ? 'down' : 'same';
        upd.lapses = increment(1);
        upd.box = 0;
        upd.nextReview = scheduleFrom(0);
        if (w.status === 'mastered') {
          upd.status = 'learning';
          upd.masteredAt = null;
        }
      } else if (due <= endOfToday()) {
        nb = Math.min(box + 1, MAX_BOX);
        change = nb > box ? 'up' : 'same';
        upd.box = nb;
        upd.nextReview = scheduleFrom(nb);
        if (nb >= MASTER_BOX && w.status !== 'mastered') {
          upd.status = 'mastered';
          upd.masteredAt = serverTimestamp();
          newlyMastered += 1;
        }
      }
      out[id] = {
        box: nb,
        nextReview: upd.nextReview ? upd.nextReview.toDate() : due,
        status: upd.status || w.status,
        change,
        mastered: upd.status === 'mastered',
      };
    }
    batch.update(doc(wordsCol(uid), id), upd);
  }
  const correct = results.filter((r) => r.correct).length;
  bumpActivity(batch, uid, { practiced: results.length, correct, wrong: results.length - correct, sessions: 1, mastered: newlyMastered });
  await batch.commit();
  return out;
}

/**
 * Import từ file JSON (định dạng data/vocab.json của dự án, hoặc mảng {text, meaning, ...}).
 * Bỏ qua từ đã có. Trả về { added, skipped }.
 */
export async function importWords(uid, items, existing) {
  const have = new Set(existing.map((w) => w.text.toLowerCase()));
  const rows = [];
  for (const it of items) {
    const text = String(it.text || it.word || '').trim();
    const meaning = String(it.meaning || it.vi || '').trim();
    if (!text || !meaning || have.has(text.toLowerCase())) continue;
    have.add(text.toLowerCase());
    const known = ['known', 'mastered'].includes(it.status);
    rows.push({
      text,
      meaning,
      pos: it.pos || '',
      ipa: it.ipa || '',
      example: it.example || '',
      exampleVi: it.example_vi || it.exampleVi || '',
      note: [it.note, Array.isArray(it.collocations) && it.collocations.length ? `Collocations: ${it.collocations.join('; ')}` : '']
        .filter(Boolean)
        .join('\n'),
      tags: Array.isArray(it.tags) ? it.tags : [],
      status: known ? 'mastered' : 'learning',
      learnedAt: it.added || it.learnedAt || '',
      masteredAt: known ? it.last_review || it.added || '' : '',
      box: Number.isInteger(it.box) ? Math.max(0, Math.min(MAX_BOX, it.box)) : null,
      nextReview: it.next_review || it.nextReview || '',
    });
  }
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + 400)) {
      const w = clean(r);
      const srs = r.box !== null
        ? { box: r.box, nextReview: ts(fromInputDate(r.nextReview)) || scheduleFrom(r.box) }
        : srsForStatus(w.status === 'mastered');
      batch.set(doc(wordsCol(uid)), { ...w, ...srs, lapses: 0, correct: 0, wrong: 0, lastPracticedAt: null, createdAt: serverTimestamp() });
    }
    if (i === 0) bumpActivity(batch, uid, { added: rows.length });
    await batch.commit();
  }
  return { added: rows.length, skipped: items.length - rows.length };
}

/* ---------- Bộ từ vựng (mỗi bộ = một tag) ---------- */
export const normTag = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Chạy các thao tác ghi theo lô (Firestore giới hạn 500 thao tác / batch) */
async function commitChunks(ops, uid, activity) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    for (const op of ops.slice(i, i + 400)) op(batch);
    if (i === 0 && activity) bumpActivity(batch, uid, activity);
    await batch.commit();
  }
}

/**
 * Thêm các từ của một bộ có sẵn vào sổ, gắn tag của bộ.
 * Từ đã có trong sổ (trùng chữ) thì chỉ gắn thêm tag, không tạo bản sao.
 * Trả về { added, tagged }.
 */
export async function addSetWords(uid, items, tag, existing, { mastered = false } = {}) {
  const byText = new Map(existing.map((w) => [w.text.toLowerCase(), w]));
  const ops = [];
  let added = 0;
  let tagged = 0;
  for (const it of items) {
    const key = it.text.trim().toLowerCase();
    const have = byText.get(key);
    if (have) {
      if (!(have.tags || []).includes(tag)) {
        ops.push((b) => b.update(doc(wordsCol(uid), have.id), { tags: arrayUnion(tag) }));
        tagged += 1;
      }
      continue;
    }
    byText.set(key, it);
    const w = clean({ ...it, tags: [tag], status: mastered ? 'mastered' : 'learning' });
    ops.push((b) =>
      b.set(doc(wordsCol(uid)), {
        ...w,
        ...srsForStatus(mastered),
        lapses: 0, correct: 0, wrong: 0, lastPracticedAt: null, createdAt: serverTimestamp(),
      }),
    );
    added += 1;
  }
  await commitChunks(ops, uid, added ? { added, mastered: mastered ? added : 0 } : null);
  return { added, tagged };
}

/** Gắn / gỡ tag của bộ cho nhiều từ trong sổ (không xoá từ) */
export async function tagWords(uid, ids, tag) {
  await commitChunks(ids.map((id) => (b) => b.update(doc(wordsCol(uid), id), { tags: arrayUnion(tag) })));
}
export async function untagWords(uid, ids, tag) {
  await commitChunks(ids.map((id) => (b) => b.update(doc(wordsCol(uid), id), { tags: arrayRemove(tag) })));
}

/** Hoạt động N ngày gần nhất của một user (mình hoặc bạn bè) */
export async function loadActivity(uid, days = 120) {
  const from = dayKey(addDays(new Date(), -days));
  const snap = await getDocs(query(collection(db, 'users', uid, 'activity'), where('date', '>=', from)));
  return snap.docs.map((d) => d.data());
}

export const activityStreak = (acts) =>
  calcStreak(acts.filter((a) => (a.added || 0) + (a.mastered || 0) + (a.practiced || 0) > 0).map((a) => a.date));

/* ---------- Context: danh sách từ của chính mình (realtime) ---------- */
const WordsCtx = createContext(null);
export const useWords = () => useContext(WordsCtx);

export function WordsProvider({ children }) {
  const { user, profile } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fresh, setFresh] = useState(false);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = onSnapshot(
      query(wordsCol(user.uid), orderBy('createdAt', 'desc')),
      { includeMetadataChanges: false },
      (snap) => {
        setWords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFresh(!snap.metadata.fromCache);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const from = dayKey(addDays(new Date(), -120));
    return onSnapshot(query(collection(db, 'users', user.uid, 'activity'), where('date', '>=', from)), (s) =>
      setActivity(s.docs.map((d) => d.data())),
    );
  }, [user]);

  // Đồng bộ bộ đếm lên hồ sơ để bạn bè xem nhanh
  const masteredCount = useMemo(() => words.filter((w) => w.status === 'mastered').length, [words]);
  useEffect(() => {
    if (!user || !profile || !fresh) return;
    if (profile.wordCount !== words.length || profile.masteredCount !== masteredCount) {
      updateDoc(userRef(user.uid), { wordCount: words.length, masteredCount }).catch(() => {});
    }
  }, [user, profile, fresh, words.length, masteredCount]);

  const value = useMemo(
    () => ({ words, loading, activity, masteredCount, streak: activityStreak(activity) }),
    [words, loading, activity, masteredCount],
  );
  return <WordsCtx.Provider value={value}>{children}</WordsCtx.Provider>;
}
