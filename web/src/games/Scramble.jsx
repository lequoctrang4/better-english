import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Progress from './Progress';
import { shuffle, norm } from '../lib/util';
import { say } from '../lib/speak';

const letters = (text) => {
  const chars = text.split('').map((c, idx) => ({ c, idx })).filter((x) => x.c !== ' ');
  let s = shuffle(chars);
  for (let k = 0; k < 5 && chars.length > 1 && s.every((x, j) => x.idx === chars[j].idx); k++) s = shuffle(chars);
  return s;
};

export default function Scramble({ deck, onFinish }) {
  const [i, setI] = useState(0);
  const w = deck[i];
  const tiles = useMemo(() => letters(w.text), [w]);
  const [picked, setPicked] = useState([]); // indexes into tiles
  const [state, setState] = useState(null);
  const res = useRef([]);
  const wrongOnce = useRef(false);
  const score = res.current.filter((r) => r.correct).length;
  const target = w.text.replace(/ /g, '');

  const built = picked.map((p) => tiles[p].c).join('');

  useEffect(() => {
    if (picked.length !== tiles.length || state) return;
    if (norm(built) === norm(target)) {
      res.current.push({ id: w.id, correct: !wrongOnce.current });
      setState('ok');
      say(w);
    } else {
      wrongOnce.current = true;
      setState('retry');
      setTimeout(() => { setPicked([]); setState(null); }, 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const next = () => {
    if (i + 1 >= deck.length) return onFinish(res.current);
    wrongOnce.current = false;
    setI(i + 1);
    setPicked([]);
    setState(null);
  };

  const giveUp = () => {
    res.current.push({ id: w.id, correct: false });
    setState('bad');
  };

  // hiển thị theo cấu trúc từ gốc (giữ khoảng trắng)
  let p = 0;
  const slots = w.text.split('').map((c, k) =>
    c === ' ' ? <span key={k} style={{ width: 14 }} /> : (
      <span key={k} className="tile en" style={{ minHeight: 46, width: 40, justifyContent: 'center', padding: 0, cursor: 'default', borderStyle: built[p] ? 'solid' : 'dashed', ...(state === 'ok' ? { borderColor: 'var(--success)', color: 'var(--success)' } : state === 'retry' ? { borderColor: 'var(--danger)' } : {}) }}>
        {state === 'bad' ? c : built[p++] || ''}
      </span>
    ),
  );

  return (
    <>
      <Progress i={i} total={deck.length} right={`${score} đúng`} />
      <div className="card q-card">
        <div className="kicker">Sắp xếp chữ cái thành từ có nghĩa</div>
        <div className="q-prompt vi">{w.meaning}</div>
        <div className="row wrap" style={{ justifyContent: 'center', gap: 6, marginTop: 18 }}>{slots}</div>
      </div>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 8 }}>
        {tiles.map((t, k) => (
          <button
            key={k}
            className="tile en"
            style={{ minHeight: 50, width: 46, justifyContent: 'center', padding: 0, visibility: picked.includes(k) ? 'hidden' : 'visible' }}
            disabled={!!state}
            onClick={() => setPicked([...picked, k])}
          >
            {t.c}
          </button>
        ))}
      </div>
      {state === 'bad' && (
        <div className="feedback bad"><Icon name="bulb" size={18} /> Đáp án: <b>{w.text}</b> {w.ipa}</div>
      )}
      <div className="row" style={{ marginTop: 18 }}>
        {!state && (
          <>
            <button className="btn btn-ghost" disabled={!picked.length} onClick={() => setPicked(picked.slice(0, -1))}><Icon name="back" size={15} /> Xoá chữ</button>
            <button className="btn btn-ghost" onClick={giveUp}>Bỏ qua</button>
          </>
        )}
        <span className="spacer" />
        {(state === 'ok' || state === 'bad') && <button className="btn btn-primary" onClick={next}>Tiếp <Icon name="arrow" size={16} /></button>}
      </div>
    </>
  );
}
