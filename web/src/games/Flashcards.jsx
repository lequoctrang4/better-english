import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Progress from './Progress';
import { say, canSpeak } from '../lib/speak';
import { POS_VI } from '../lib/words';

export default function Flashcards({ deck, onFinish }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reverse, setReverse] = useState(false);
  const res = useRef([]);
  const w = deck[i];

  const answer = (correct) => {
    res.current.push({ id: w.id, correct });
    setFlipped(false);
    if (i + 1 >= deck.length) onFinish(res.current);
    else setTimeout(() => setI(i + 1), 120);
  };

  useEffect(() => {
    const k = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (flipped && (e.key === '1' || e.key === 'ArrowLeft')) answer(false);
      if (flipped && (e.key === '2' || e.key === 'ArrowRight')) answer(true);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const front = reverse ? (
    <div className="flash-meaning" style={{ color: 'var(--text)', fontSize: 26 }}>{w.meaning}</div>
  ) : (
    <>
      <div className="flash-word">{w.text}</div>
      <div className="muted">{[w.pos && POS_VI[w.pos], w.ipa].filter(Boolean).join(' · ')}</div>
    </>
  );
  const back = reverse ? (
    <>
      <div className="flash-word">{w.text}</div>
      <div className="muted">{w.ipa}</div>
    </>
  ) : (
    <div className="flash-meaning">{w.meaning}</div>
  );

  return (
    <>
      <Progress i={i} total={deck.length} />
      <div className="row" style={{ marginBottom: 12 }}>
        <label className="check small muted">
          <input type="checkbox" checked={reverse} onChange={(e) => { setReverse(e.target.checked); setFlipped(false); }} />
          Hiện nghĩa trước (Việt → Anh)
        </label>
        <span className="spacer" />
        {canSpeak && (
          <button className="btn btn-ghost btn-sm" onClick={() => say(w)}><Icon name="volume" size={15} /> Nghe</button>
        )}
      </div>
      <div className={`flash ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flash-inner">
          <div className="flash-face flash-front">
            <span className="pill">Chạm để lật</span>
            {front}
          </div>
          <div className="flash-face flash-back">
            {back}
            {w.example && <p className="muted" style={{ fontStyle: 'italic', maxWidth: 520 }}>“{w.example}”</p>}
            {w.exampleVi && <p className="small muted">{w.exampleVi}</p>}
          </div>
        </div>
      </div>
      {flipped ? (
        <div className="grid grid-2">
          <button className="btn btn-danger btn-lg" onClick={() => answer(false)}><Icon name="x" size={16} /> Chưa nhớ <kbd className="muted small">1</kbd></button>
          <button className="btn btn-primary btn-lg" onClick={() => answer(true)}><Icon name="check" size={16} /> Nhớ rồi <kbd className="small">2</kbd></button>
        </div>
      ) : (
        <button className="btn btn-outline btn-lg btn-block" onClick={() => setFlipped(true)}>Lật thẻ <span className="muted small">(Space)</span></button>
      )}
    </>
  );
}
