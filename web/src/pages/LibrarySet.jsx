import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import { Spinner, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useWords, addSetWords, POS_VI } from '../lib/words';
import { LIB_BY_ID, libWords, setPath, practicePath } from '../lib/sets';
import { say, canSpeak } from '../lib/speak';
import { firebaseError } from '../lib/util';

/** Xem một bộ trong thư viện, chọn từ để thêm vào sổ */
export default function LibrarySet() {
  const set = LIB_BY_ID[useParams().id];
  const { user } = useAuth();
  const { words, loading } = useWords();
  const toast = useToast();
  const nav = useNavigate();
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  // Trạng thái từng từ trong sổ: 'in' (đã trong bộ) | 'other' (có trong sổ, chưa gắn bộ) | undefined (chưa có)
  const state = useMemo(() => {
    if (!set) return {};
    const byText = new Map(words.map((w) => [w.text.toLowerCase(), w]));
    return Object.fromEntries(
      libWords(set).map((w) => {
        const have = byText.get(w.text.toLowerCase());
        return [w.text, have ? ((have.tags || []).includes(set.tag) ? 'in' : 'other') : undefined];
      }),
    );
  }, [set, words]);

  if (!set) return <div className="empty"><h3>Không tìm thấy bộ từ này</h3><Link className="btn btn-primary" to="/sets">Về Bộ từ vựng</Link></div>;
  if (loading) return <Spinner />;

  const all = libWords(set);
  const selectable = all.filter((w) => state[w.text] !== 'in');
  const inSet = all.length - selectable.length;
  const chosen = all.filter((w) => sel.has(w.text) && state[w.text] !== 'in');

  const flip = (text) => setSel((x) => {
    const y = new Set(x);
    y.has(text) ? y.delete(text) : y.add(text);
    return y;
  });
  const setGroup = (ws, on) => setSel((x) => {
    const y = new Set(x);
    for (const w of ws) if (state[w.text] !== 'in') on ? y.add(w.text) : y.delete(w.text);
    return y;
  });

  const add = async (mastered) => {
    setBusy(true);
    try {
      const { added, tagged } = await addSetWords(user.uid, chosen, set.tag, words, { mastered });
      const parts = [];
      if (added) parts.push(`thêm ${added} từ${mastered ? ' (đã thuộc)' : ''}`);
      if (tagged) parts.push(`gắn ${tagged} từ có sẵn vào bộ`);
      toast(`Đã ${parts.join(', ')}`);
      setSel(new Set());
    } catch (e) {
      toast(firebaseError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/sets" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}><Icon name="back" size={15} /> Bộ từ vựng</Link>
      <div className="row wrap" style={{ alignItems: 'flex-end', marginBottom: 18 }}>
        <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
          <span className="set-emoji lg">{set.emoji}</span>
          <div>
            <div className="eyebrow">Thư viện · {set.en}</div>
            <h1 className="page-title" style={{ margin: '4px 0' }}>{set.name}</h1>
            <p className="page-sub" style={{ maxWidth: 560 }}>{set.desc}</p>
          </div>
        </div>
        <div className="spacer" />
        {inSet > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <Link className="btn btn-outline" to={setPath(set.tag)}>Xem trong sổ</Link>
            <button className="btn btn-primary" onClick={() => nav(practicePath(set.tag))}><Icon name="game" size={16} /> Luyện bộ này</button>
          </div>
        )}
      </div>

      <div className="card set-bar">
        <div style={{ minWidth: 0 }}>
          <b>{inSet}/{all.length}</b> <span className="muted small">từ đã trong sổ</span>
          <div className="bar" style={{ marginTop: 6, width: 180, maxWidth: '100%' }}><span style={{ width: `${(inSet / all.length) * 100}%` }} /></div>
        </div>
        <span className="spacer" />
        {selectable.length > 0 ? (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setGroup(selectable, chosen.length < selectable.length)}>
              {chosen.length < selectable.length ? `Chọn tất cả (${selectable.length})` : 'Bỏ chọn'}
            </button>
            <button className="btn btn-outline btn-sm" disabled={!chosen.length || busy} onClick={() => add(true)} title="Thêm vào sổ và đánh dấu đã thuộc — chỉ ôn lại thỉnh thoảng">
              <Icon name="check" size={14} /> Tôi đã biết
            </button>
            <button className="btn btn-primary btn-sm" disabled={!chosen.length || busy} onClick={() => add(false)}>
              <Icon name="plus" size={14} stroke={2.2} /> {busy ? 'Đang thêm…' : chosen.length ? `Thêm ${chosen.length} từ để học` : 'Thêm từ để học'}
            </button>
          </>
        ) : (
          <span className="badge badge-ok"><Icon name="check" size={12} stroke={2.4} /> Đã thêm cả bộ</span>
        )}
      </div>
      <p className="muted small" style={{ margin: '10px 2px 0' }}>
        Mẹo: chỉ chọn những từ bạn <b>chưa biết</b> để học (5–10 từ mỗi lần là vừa). Từ đã biết thì bấm “Tôi đã biết” để luyện chung khi chơi theo bộ.
      </p>

      {set.groups.map((g) => {
        const free = g.words.filter((w) => state[w.text] !== 'in');
        const allOn = free.length > 0 && free.every((w) => sel.has(w.text));
        return (
          <div key={g.name} className="section" style={{ marginTop: 26 }}>
            <div className="section-head" style={{ alignItems: 'center' }}>
              <h2>{g.emoji} {g.name} <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>· {g.words.length}</span></h2>
              {free.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setGroup(free, !allOn)}>{allOn ? 'Bỏ chọn nhóm' : 'Chọn cả nhóm'}</button>
              )}
            </div>
            <div className="word-list">
              {g.words.map((w) => {
                const st = state[w.text];
                const on = st !== 'in' && sel.has(w.text);
                return (
                  <label key={w.text} className={`lib-row ${on ? 'on' : ''} ${st === 'in' ? 'have' : ''}`}>
                    {st === 'in' ? (
                      <span className="tick on" title="Đã có trong bộ"><Icon name="check" size={15} stroke={2.4} /></span>
                    ) : (
                      <input type="checkbox" checked={on} onChange={() => flip(w.text)} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="w-text">
                        {w.text}
                        {canSpeak && (
                          <button type="button" className="icon-btn" style={{ width: 26, height: 26 }} onClick={(e) => { e.preventDefault(); say(w); }} title="Nghe phát âm">
                            <Icon name="volume" size={15} />
                          </button>
                        )}
                      </div>
                      <div className="w-meta">
                        {w.pos && <span className="pos">{POS_VI[w.pos] || w.pos}</span>}
                        {w.ipa && <span>{w.ipa}</span>}
                        {st === 'other' && <span className="badge" style={{ padding: '1px 7px', fontSize: 10.5 }}>có trong sổ</span>}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="w-meaning">{w.meaning}</div>
                      {w.example && <div className="lib-example">“{w.example}” <span className="muted">— {w.exampleVi}</span></div>}
                      {w.note && <div className="lib-note">💡 {w.note}</div>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
