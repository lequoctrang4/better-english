import { useMemo, useState } from 'react';
import Icon from './Icon';
import WordRow from './WordRow';
import { toDate } from '../lib/date';
import { isDue, srsOf } from '../lib/words';

const SORTS = {
  new: { label: 'Mới thêm', fn: (a, b) => (toDate(b.learnedAt) || 0) - (toDate(a.learnedAt) || 0) },
  old: { label: 'Cũ nhất', fn: (a, b) => (toDate(a.learnedAt) || 0) - (toDate(b.learnedAt) || 0) },
  az: { label: 'A → Z', fn: (a, b) => a.text.localeCompare(b.text) },
  due: { label: 'Đến hạn ôn', fn: (a, b) => srsOf(a).due - srsOf(b).due },
  hard: { label: 'Hay sai', fn: (a, b) => (b.wrong || 0) - (b.correct || 0) - ((a.wrong || 0) - (a.correct || 0)) },
};

/** Danh sách từ có lọc / tìm / sắp xếp. Dùng cho sổ của mình và hồ sơ bạn bè. */
export default function WordBrowser({ words, readOnly, onToggle, onEdit, onDelete, extra }) {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [tag, setTag] = useState('');

  const tags = useMemo(() => [...new Set(words.flatMap((w) => w.tags || []))].sort(), [words]);
  const counts = useMemo(
    () => ({ all: words.length, due: words.filter(isDue).length, learning: words.filter((w) => w.status !== 'mastered').length, mastered: words.filter((w) => w.status === 'mastered').length }),
    [words],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return words
      .filter((w) => (tab === 'all' ? true : tab === 'due' ? isDue(w) : tab === 'mastered' ? w.status === 'mastered' : w.status !== 'mastered'))
      .filter((w) => !tag || (w.tags || []).includes(tag))
      .filter((w) => !s || w.text.toLowerCase().includes(s) || w.meaning.toLowerCase().includes(s))
      .sort(SORTS[sort].fn);
  }, [words, tab, q, sort, tag]);

  return (
    <>
      <div className="toolbar">
        <div className="seg">
          {[['all', 'Tất cả'], ...(readOnly ? [] : [['due', 'Cần ôn']]), ['learning', 'Đang học'], ['mastered', 'Đã thuộc']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {l} <span className="n">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="search">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Tìm từ hoặc nghĩa…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {tags.length > 0 && (
          <select className="select" style={{ width: 'auto' }} value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">Mọi chủ đề</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
        )}
        <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {extra}
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <h3>{words.length === 0 ? 'Chưa có từ nào' : 'Không tìm thấy từ phù hợp'}</h3>
          <p>{words.length === 0 ? (readOnly ? 'Bạn này chưa thêm từ nào.' : 'Thêm từ đầu tiên để bắt đầu học.') : 'Thử bỏ bớt bộ lọc.'}</p>
        </div>
      ) : (
        <div className="word-list">
          {list.map((w) => (
            <WordRow key={w.id} w={w} readOnly={readOnly} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </>
  );
}
