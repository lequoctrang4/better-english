import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { Modal, Spinner } from '../components/ui';
import { useWords, isDue, normTag } from '../lib/words';
import { LIBRARY, LIB_BY_TAG, libWords, groupByTag, setName, setEmoji, setPath, practicePath } from '../lib/sets';

export default function Sets() {
  const { words, loading } = useWords();
  const nav = useNavigate();
  const [creating, setCreating] = useState(false);

  const mine = useMemo(() => groupByTag(words), [words]);
  const texts = useMemo(() => new Set(words.map((w) => w.text.toLowerCase())), [words]);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="row wrap" style={{ alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <div className="eyebrow">Word sets</div>
          <h1 className="page-title">Bộ từ vựng, <em>học theo chủ đề.</em></h1>
          <p className="page-sub">Hôm nay muốn học về động vật hay đồ vật? Chọn một bộ có sẵn, hoặc tự gom từ thành bộ của riêng bạn.</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} stroke={2.2} /> Tạo bộ mới
        </button>
      </div>

      {mine.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div>
              <div className="kicker">Trong sổ của bạn</div>
              <h2>Bộ của bạn</h2>
            </div>
            <span className="muted small">{mine.length} bộ</span>
          </div>
          <div className="grid grid-3">
            {mine.map(({ tag, words: ws }) => {
              const mastered = ws.filter((w) => w.status === 'mastered').length;
              const due = ws.filter(isDue).length;
              const pct = Math.round((mastered / ws.length) * 100);
              return (
                <div key={tag} className="card set-card" role="link" tabIndex={0} onClick={() => nav(setPath(tag))} onKeyDown={(e) => e.key === 'Enter' && nav(setPath(tag))}>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="set-emoji">{setEmoji(tag)}</span>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="set-name">{setName(tag)}</h3>
                      <div className="muted small">{ws.length} từ · {mastered} đã thuộc</div>
                    </div>
                  </div>
                  <div className="bar" style={{ marginTop: 14 }}><span style={{ width: `${pct}%` }} /></div>
                  <div className="row" style={{ marginTop: 14 }}>
                    {due > 0 ? <span className="badge badge-lime">{due} cần ôn</span> : <span className="muted small">Không có từ cần ôn</span>}
                    <span className="spacer" />
                    <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); nav(practicePath(tag)); }}>
                      <Icon name="game" size={14} /> Luyện
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Có sẵn · soạn kèm IPA, ví dụ, ghi chú</div>
            <h2>Thư viện bộ từ</h2>
          </div>
        </div>
        <div className="grid grid-3">
          {LIBRARY.map((s) => {
            const all = libWords(s);
            const have = all.filter((w) => texts.has(w.text.toLowerCase())).length;
            return (
              <button key={s.id} className="game-card set-lib" onClick={() => nav(`/sets/lib/${s.id}`)}>
                <span className="set-emoji">{s.emoji}</span>
                <h3>{s.name} <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>· {s.en}</span></h3>
                <p>{s.desc}</p>
                <div className="row small" style={{ marginTop: 'auto', paddingTop: 6 }}>
                  <span className="muted">{all.length} từ · {s.groups.length} nhóm</span>
                  <span className="spacer" />
                  {have === all.length ? (
                    <span className="badge badge-ok">Đã thêm hết</span>
                  ) : have > 0 ? (
                    <span className="badge">Đã có {have}/{all.length}</span>
                  ) : (
                    <span className="badge badge-lime">Mới</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {creating && <CreateSet existing={mine.map((m) => m.tag)} onClose={() => setCreating(false)} />}
    </>
  );
}

function CreateSet({ existing, onClose }) {
  const nav = useNavigate();
  const [name, setNameInput] = useState('');
  const tag = normTag(name);
  const clash = existing.includes(tag) || (LIB_BY_TAG[tag] && 'lib');
  const go = (e) => {
    e?.preventDefault();
    if (!tag) return;
    onClose();
    nav(setPath(tag));
  };
  return (
    <Modal
      title="Tạo bộ từ mới"
      onClose={onClose}
      width={460}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={!tag} onClick={go}>{clash ? 'Mở bộ này' : 'Tạo bộ'}</button>
        </>
      }
    >
      <form onSubmit={go} className="stack" style={{ gap: 10 }}>
        <label className="field">
          <span>Tên bộ (cũng là chủ đề/tag của từ)</span>
          <input className="input" autoFocus value={name} onChange={(e) => setNameInput(e.target.value)} placeholder="vd. kitchen, đồ ăn, travel" maxLength={40} />
        </label>
        <p className="muted small">
          {clash
            ? 'Bộ này đã có — bấm để mở và thêm từ.'
            : 'Sau khi tạo, bạn có thể thêm từ mới hoặc chọn từ có sẵn trong sổ vào bộ. Một từ có thể nằm trong nhiều bộ.'}
        </p>
      </form>
    </Modal>
  );
}
