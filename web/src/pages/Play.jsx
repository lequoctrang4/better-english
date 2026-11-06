import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Spinner, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useWords, recordPractice, setMastered, srsOf, MAX_BOX } from '../lib/words';
import { dueLabel } from '../lib/date';
import LevelDots from '../components/LevelDots';
import { pickForPractice, firebaseError } from '../lib/util';
import { GAMES, SOURCES, inTag } from './Practice';
import { setName, setEmoji } from '../lib/setMeta';
import Flashcards from '../games/Flashcards';
import Match from '../games/Match';
import Quiz from '../games/Quiz';
import Typing from '../games/Typing';
import Scramble from '../games/Scramble';

const COMPONENTS = { flash: Flashcards, match: Match, quiz: Quiz, type: Typing, listen: Typing, scramble: Scramble };

export default function Play() {
  const { game } = useParams();
  const [sp] = useSearchParams();
  const { words, loading } = useWords();
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const src = SOURCES[sp.get('src')] ? sp.get('src') : 'all';
  const n = Math.max(3, Math.min(30, Number(sp.get('n')) || 10));
  const tag = sp.get('tag') || '';
  const back = `/practice${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`;
  // Từ của bộ đang luyện; đáp án nhiễu (trắc nghiệm) cũng lấy trong bộ nếu đủ từ
  const tagged = useMemo(() => words.filter(inTag(tag)), [words, tag]);
  const distractors = tag && tagged.length >= 4 ? tagged : words;
  const [round, setRound] = useState(0);
  const [results, setResults] = useState(null);
  const [srs, setSrs] = useState({});

  const meta = GAMES.find((g) => g.id === game);
  // Bộ từ cố định cho mỗi lượt (không đổi khi snapshot cập nhật)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck = useMemo(() => {
    if (loading) return [];
    const pool = tagged.filter(SOURCES[src].filter);
    if (src !== 'due') return pickForPractice(pool, n);
    // Ôn tập: từ quá hạn lâu nhất trước
    return pickForPractice(pool.sort((a, b) => srsOf(a).due - srsOf(b).due).slice(0, n), n);
  }, [loading, round, src, n, tag]);

  if (loading) return <Spinner />;
  if (!meta) return <div className="empty"><h3>Không có trò chơi này</h3></div>;

  const Game = COMPONENTS[game];

  const finish = async (res) => {
    setResults(res);
    setSrs({});
    try {
      const byId = Object.fromEntries(words.map((w) => [w.id, w]));
      setSrs(await recordPractice(user.uid, res, byId));
    } catch (e) {
      toast(firebaseError(e), 'error');
    }
  };

  if (deck.length < meta.min) {
    return (
      <div className="empty">
        <h3>Chưa đủ từ để chơi</h3>
        <p>Nhóm “{SOURCES[src].label}”{tag ? ` trong bộ ${setName(tag)}` : ''} cần ít nhất {meta.min} từ.</p>
        <button className="btn btn-primary" onClick={() => nav(back)}>Chọn nhóm khác</button>
      </div>
    );
  }

  return (
    <div className="play-wrap">
      <div className="row" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav(back)}><Icon name="back" size={15} /> Luyện tập</button>
        <span className="spacer" />
        <span className="badge badge-lime"><Icon name={meta.icon} size={13} /> {meta.name}</span>
        {tag && <span className="badge">{setEmoji(tag)} {setName(tag)}</span>}
        <span className="badge">{SOURCES[src].label}</span>
      </div>
      {results ? (
        <Result
          results={results}
          words={words}
          srs={srs}
          back={back}
          onAgain={() => { setResults(null); setRound((r) => r + 1); }}
          onMaster={async (w) => {
            try {
              await setMastered(user.uid, w, true);
              toast(`🎉 Đã thuộc “${w.text}”`);
            } catch (e) {
              toast(firebaseError(e), 'error');
            }
          }}
        />
      ) : (
        <Game key={round} deck={deck} pool={distractors} listen={game === 'listen'} onFinish={finish} />
      )}
    </div>
  );
}

function Result({ results, words, srs, back, onAgain, onMaster }) {
  const nav = useNavigate();
  const byId = Object.fromEntries(words.map((w) => [w.id, w]));
  const per = {};
  for (const r of results) {
    per[r.id] = per[r.id] || { ok: 0, bad: 0 };
    r.correct ? per[r.id].ok++ : per[r.id].bad++;
  }
  const ids = Object.keys(per);
  const right = ids.filter((id) => per[id].bad === 0).length;
  const pct = Math.round((right / ids.length) * 100);
  const ups = Object.values(srs).filter((x) => x.change === 'up').length;
  const autoMastered = Object.values(srs).filter((x) => x.mastered).length;
  const msg = pct === 100 ? 'Hoàn hảo!' : pct >= 80 ? 'Rất tốt!' : pct >= 50 ? 'Khá ổn, ôn thêm chút nhé.' : 'Không sao, lặp lại là sẽ nhớ.';

  return (
    <>
      <div className="stage result-hero">
        <span className="pill">Kết quả lượt chơi</span>
        <div className="score" style={{ marginTop: 18 }}>{right}/{ids.length}</div>
        <h2 style={{ fontSize: 22, marginTop: 10 }}>{msg}</h2>
        <p className="muted small" style={{ marginTop: 4 }}>
          {ups > 0 ? `${ups} từ lên cấp` : 'Đã lưu kết quả'}
          {autoMastered > 0 ? ` · ${autoMastered} từ tự chuyển sang “đã thuộc”` : ''} — từ sai sẽ được ôn lại ngay hôm nay.
        </p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={onAgain}><Icon name="refresh" size={16} /> Chơi lượt mới</button>
          <button className="btn btn-outline" onClick={() => nav(back)}>Đổi trò chơi</button>
        </div>
      </div>
      <div className="word-list" style={{ marginTop: 16 }}>
        {ids.map((id) => {
          const w = byId[id];
          if (!w) return null;
          const ok = per[id].bad === 0;
          return (
            <div key={id} className="card row" style={{ padding: '12px 16px' }}>
              <span className={`badge ${ok ? 'badge-ok' : 'badge-danger'}`}><Icon name={ok ? 'check' : 'x'} size={12} stroke={2.4} /></span>
              <b style={{ fontFamily: 'var(--font-head)' }}>{w.text}</b>
              <span className="muted small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.meaning}</span>
              <span className="spacer" />
              {srs[id] && (
                <span className="small muted row" style={{ gap: 8, whiteSpace: 'nowrap' }} title={`Cấp ${srs[id].box}/${MAX_BOX}`}>
                  <LevelDots box={srs[id].box} change={srs[id].change} />
                  <span className="hide-sm">ôn {dueLabel(srs[id].nextReview)}</span>
                </span>
              )}
              {w.status === 'mastered' ? (
                <span className="badge badge-lime">Đã thuộc</span>
              ) : ok ? (
                <button className="btn btn-sm" onClick={() => onMaster(w)}><Icon name="check" size={14} /> Đánh dấu thuộc</button>
              ) : (
                <span className="badge badge-warn">Ôn thêm</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
