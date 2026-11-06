import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { useWords, isDue } from '../lib/words';
import { canSpeak } from '../lib/speak';
import { setName, setEmoji, setPath } from '../lib/setMeta';

export const GAMES = [
  { id: 'flash', name: 'Thẻ ghi nhớ', icon: 'cards', desc: 'Lật thẻ, tự đánh giá nhớ hay chưa.', min: 1 },
  { id: 'match', name: 'Ghép từ', icon: 'link', desc: 'Nối từ tiếng Anh với nghĩa đúng, đua thời gian.', min: 3 },
  { id: 'quiz', name: 'Trắc nghiệm', icon: 'list', desc: 'Chọn nghĩa đúng trong 4 đáp án — hai chiều Anh ↔ Việt.', min: 1, pool: 4 },
  { id: 'type', name: 'Gõ từ', icon: 'keyboard', desc: 'Xem nghĩa và câu ví dụ, gõ lại từ tiếng Anh.', min: 1 },
  { id: 'scramble', name: 'Sắp chữ', icon: 'refresh', desc: 'Sắp xếp các chữ cái bị xáo trộn thành từ đúng.', min: 1 },
  ...(canSpeak ? [{ id: 'listen', name: 'Nghe & gõ', icon: 'ear', desc: 'Nghe phát âm rồi gõ chính tả.', min: 1 }] : []),
];

export const SOURCES = {
  due: { label: 'Cần ôn hôm nay', filter: (w) => isDue(w) },
  learning: { label: 'Đang học', filter: (w) => w.status !== 'mastered' },
  all: { label: 'Tất cả', filter: () => true },
  mastered: { label: 'Đã thuộc (ôn lại)', filter: (w) => w.status === 'mastered' },
  hard: { label: 'Hay sai', filter: (w) => (w.wrong || 0) > (w.correct || 0) || (w.wrong || 0) >= 2 },
  recent: { label: 'Học 7 ngày qua', filter: (w) => (w.learnedAt?.toMillis?.() || 0) > Date.now() - 7 * 86400000 },
};

/** Lọc theo bộ (tag); rỗng = mọi từ */
export const inTag = (tag) => (w) => !tag || (w.tags || []).includes(tag);

export default function Practice() {
  const { words: allWords } = useWords();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const tags = useMemo(() => [...new Set(allWords.flatMap((w) => w.tags || []))].sort((a, b) => setName(a).localeCompare(setName(b))), [allWords]);
  const [tag, setTag] = useState(() => sp.get('tag') || '');
  const words = useMemo(() => allWords.filter(inTag(tag)), [allWords, tag]);
  const [game, setGame] = useState('match');
  const pickSrc = (ws) => (ws.some(isDue) ? 'due' : ws.some((w) => w.status !== 'mastered') ? 'learning' : 'all');
  const [src, setSrc] = useState(() => pickSrc(words));
  const [n, setN] = useState(10);

  const counts = useMemo(() => Object.fromEntries(Object.entries(SOURCES).map(([k, s]) => [k, words.filter(s.filter).length])), [words]);
  const g = GAMES.find((x) => x.id === game);
  const enough = counts[src] >= g.min && (!g.pool || allWords.length >= g.pool);
  const tagQ = tag ? `&tag=${encodeURIComponent(tag)}` : '';
  const changeTag = (t) => {
    setTag(t);
    setSrc(pickSrc(allWords.filter(inTag(t))));
  };

  return (
    <>
      <div className="eyebrow">Play to remember</div>
      <h1 className="page-title">Luyện tập, <em>nhẹ nhàng thôi.</em></h1>
      <p className="page-sub">
        Chọn trò chơi và nhóm từ. Trả lời đúng một từ <b>đến hạn ôn</b> sẽ đẩy nó lên cấp và hẹn ngày ôn xa hơn; trả lời sai thì về cấp 0.
      </p>

      <div className="grid grid-3" style={{ marginTop: 24 }}>
        {GAMES.map((x) => (
          <button key={x.id} className={`game-card ${game === x.id ? 'sel' : ''}`} onClick={() => setGame(x.id)} onDoubleClick={() => enough && nav(`/practice/${x.id}?src=${src}&n=${n}${tagQ}`)}>
            <span className="gi"><Icon name={x.icon} size={20} /></span>
            <h3>{x.name}</h3>
            <p>{x.desc}</p>
          </button>
        ))}
      </div>

      <div className="card section" style={{ padding: 22 }}>
        {(tags.length > 0 || tag) && (
          <div style={{ marginBottom: 20 }}>
            <div className="kicker" style={{ marginBottom: 10 }}>Bộ từ vựng</div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button className={`btn btn-sm ${tag ? 'btn-outline' : ''}`} onClick={() => changeTag('')}>
                Tất cả <span className="muted">{allWords.length}</span>
              </button>
              {[...new Set([...(tag ? [tag] : []), ...tags])].map((t) => (
                <button key={t} className={`btn btn-sm ${tag === t ? '' : 'btn-outline'}`} onClick={() => changeTag(t)}>
                  {setEmoji(t)} {setName(t)} <span className="muted">{allWords.filter(inTag(t)).length}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-2" style={{ gap: 22 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Nhóm từ</div>
            <div className="row wrap" style={{ gap: 8 }}>
              {Object.entries(SOURCES).map(([k, s]) => (
                <button key={k} className={`btn btn-sm ${src === k ? '' : 'btn-outline'}`} onClick={() => setSrc(k)}>
                  {s.label} <span className="muted">{counts[k]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Số từ mỗi lượt</div>
            <div className="seg">
              {[5, 10, 15, 20].map((v) => (
                <button key={v} className={n === v ? 'on' : ''} onClick={() => setN(v)}>{v}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 22, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          <span className="muted small">
            {enough
              ? `${g.name} · ${Math.min(n, counts[src])} từ từ nhóm “${SOURCES[src].label}”${tag ? ` · bộ ${setName(tag)}` : ''}`
              : g.pool && words.length < g.pool
                ? `Cần ít nhất ${g.pool} từ trong sổ để chơi ${g.name}.`
                : `Nhóm này${tag ? ` trong bộ ${setName(tag)}` : ''} cần ít nhất ${g.min} từ.`}
          </span>
          <span className="spacer" />
          {!enough && words.length < 4 && (
            <button className="btn btn-outline" onClick={() => nav(tag ? setPath(tag) : '/words')}><Icon name="plus" size={16} /> Thêm từ</button>
          )}
          <button className="btn btn-primary btn-lg" disabled={!enough} onClick={() => nav(`/practice/${game}?src=${src}&n=${n}${tagQ}`)}>
            Bắt đầu <Icon name="arrow" size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
