import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Heatmap from '../components/Heatmap';
import { Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useWords, isDue, srsOf } from '../lib/words';
import { dayKey, fmtDate, toDate } from '../lib/date';
import { GAMES } from './Practice';

export default function Home() {
  const { profile } = useAuth();
  const { words, loading, activity, streak, masteredCount } = useWords();
  const nav = useNavigate();

  const today = useMemo(() => activity.find((a) => a.date === dayKey()) || {}, [activity]);
  const recent = useMemo(
    () => [...words].sort((a, b) => (toDate(b.learnedAt) || 0) - (toDate(a.learnedAt) || 0)).slice(0, 6),
    [words],
  );
  const recentMastered = useMemo(
    () => words.filter((w) => w.status === 'mastered').sort((a, b) => (toDate(b.masteredAt) || 0) - (toDate(a.masteredAt) || 0)).slice(0, 6),
    [words],
  );

  const due = useMemo(() => words.filter(isDue), [words]);
  const tomorrow = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 2);
    return words.filter((w) => !isDue(w) && srsOf(w).due < end).length;
  }, [words]);

  if (loading) return <Spinner />;
  const name = profile?.displayName || 'bạn';
  const pct = words.length ? Math.round((masteredCount / words.length) * 100) : 0;

  return (
    <>
      <div className="eyebrow">Learn a little. Every day.</div>
      <h1 className="page-title">Chào {name}, <em>học chút nhé.</em></h1>
      <p className="page-sub">Mỗi từ nhỏ hôm nay là một câu nói tự tin ngày mai.</p>

      <div className="stage" style={{ marginTop: 24 }}>
        <span className="pill">Hôm nay của bạn</span>
        <div className="grid grid-2 stage-split" style={{ marginTop: 22, alignItems: 'end', gap: 28 }}>
          <div>
            <div className="kicker">Spaced repetition · ôn đúng lúc sắp quên</div>
            {due.length > 0 ? (
              <>
                <h2 style={{ fontSize: 34, letterSpacing: -1.2, lineHeight: 1.12, margin: '10px 0 12px', color: 'var(--stage-title)' }}>
                  Hôm nay cần ôn<br /><span style={{ color: 'var(--accent-ink)' }}>{due.length} từ.</span>
                </h2>
                <div className="row wrap">
                  <button className="btn btn-primary" onClick={() => nav(`/practice/quiz?src=due&n=${Math.min(20, due.length)}`)}>
                    <Icon name="refresh" size={16} /> Ôn ngay
                  </button>
                  <button className="btn btn-outline" onClick={() => nav(`/practice/flash?src=due&n=${Math.min(20, due.length)}`)}>
                    <Icon name="cards" size={16} /> Lật thẻ
                  </button>
                  <button className="btn btn-outline" onClick={() => nav('/words')}><Icon name="plus" size={16} /> Thêm từ</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 34, letterSpacing: -1.2, lineHeight: 1.12, margin: '10px 0 12px', color: 'var(--stage-title)' }}>
                  {words.length ? 'Ôn xong hôm nay rồi.' : 'Bắt đầu nhẹ nhàng.'}<br />
                  <span style={{ color: 'var(--accent-ink)' }}>{words.length ? (tomorrow ? `Ngày mai: ${tomorrow} từ.` : 'Thêm vài từ mới?') : 'Thêm từ đầu tiên.'}</span>
                </h2>
                <div className="row wrap">
                  <button className="btn btn-primary" onClick={() => nav('/words')}><Icon name="plus" size={16} /> Thêm từ</button>
                  {words.length > 0 && (
                    <button className="btn btn-outline" onClick={() => nav('/practice')}><Icon name="game" size={16} /> Luyện thêm</button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-3 mini-stats" style={{ gap: 10 }}>
            {[
              ['Từ mới', today.added || 0],
              ['Đã thuộc', today.mastered || 0],
              ['Câu luyện', today.practiced || 0],
            ].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--glass)', border: '1px solid var(--glass-line)', borderRadius: 12, padding: '14px 14px' }}>
                <div className="small muted">{l}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 28, letterSpacing: -1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        <div className="card stat">
          <div className="label"><Icon name="book" size={15} /> Tổng số từ</div>
          <div className="value">{words.length}</div>
        </div>
        <div className="card stat">
          <div className="label"><Icon name="layers" size={15} /> Đang học</div>
          <div className="value">{words.length - masteredCount}</div>
        </div>
        <div className="card stat">
          <div className="label"><Icon name="star" size={15} /> Đã thuộc</div>
          <div className="value">{masteredCount}<small>{pct}%</small></div>
          <div className="bar" style={{ marginTop: 8 }}><span style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="card stat">
          <div className="label"><Icon name="flame" size={15} /> Chuỗi ngày học</div>
          <div className="value">{streak}<small>ngày</small></div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Sẵn sàng khi bạn muốn</div>
            <h2>Chơi một ván cho nhớ từ</h2>
          </div>
          <Link to="/practice" className="small muted">Tất cả trò chơi →</Link>
        </div>
        <div className="grid grid-4">
          {GAMES.map((g) => (
            <button key={g.id} className="game-card" onClick={() => nav(`/practice/${g.id}`)}>
              <span className="gi"><Icon name={g.icon} size={20} /></span>
              <h3>{g.name}</h3>
              <p>{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Nhịp học</div>
            <h2>Hoạt động 4 tháng gần đây</h2>
          </div>
        </div>
        <div className="card"><Heatmap activity={activity} /></div>
      </div>

      <div className="grid grid-2 section">
        <MiniList title="Mới học gần đây" kicker="Fresh words" words={recent} dateKey="learnedAt" empty="Chưa có từ nào." />
        <MiniList title="Vừa thuộc" kicker="Nailed it" words={recentMastered} dateKey="masteredAt" empty="Chưa có từ nào được đánh dấu thuộc." />
      </div>
    </>
  );
}

function MiniList({ title, kicker, words, dateKey, empty }) {
  return (
    <div className="card">
      <div className="kicker">{kicker}</div>
      <h3 style={{ fontSize: 16, margin: '4px 0 12px' }}>{title}</h3>
      {words.length === 0 ? (
        <p className="muted small">{empty}</p>
      ) : (
        words.map((w) => (
          <div key={w.id} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
            <b style={{ fontFamily: 'var(--font-head)' }}>{w.text}</b>
            <span className="muted small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.meaning}</span>
            <span className="spacer" />
            <span className="small muted" style={{ whiteSpace: 'nowrap' }}>{fmtDate(w[dateKey])}</span>
          </div>
        ))
      )}
    </div>
  );
}
