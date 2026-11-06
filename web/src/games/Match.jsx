import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Progress from './Progress';
import { shuffle, shortMeaning } from '../lib/util';

const PER_ROUND = 6;

export default function Match({ deck, onFinish }) {
  const rounds = useMemo(() => {
    const r = [];
    for (let i = 0; i < deck.length; i += PER_ROUND) r.push(deck.slice(i, i + PER_ROUND));
    // gộp lượt cuối quá ngắn vào lượt trước
    if (r.length > 1 && r[r.length - 1].length < 3) r[r.length - 2].push(...r.pop());
    return r;
  }, [deck]);
  const [ri, setRi] = useState(0);
  const cur = rounds[ri];
  const left = useMemo(() => shuffle(cur), [cur]);
  const right = useMemo(() => shuffle(cur), [cur]);
  const [selL, setSelL] = useState(null);
  const [selR, setSelR] = useState(null);
  const [done, setDone] = useState(new Set());
  const [bad, setBad] = useState(null);
  const missed = useRef(new Set());
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!selL || !selR) return;
    if (selL === selR) {
      const nd = new Set(done).add(selL);
      setDone(nd);
      setSelL(null);
      setSelR(null);
      if (nd.size === cur.length) {
        setTimeout(() => {
          if (ri + 1 < rounds.length) {
            setRi(ri + 1);
            setDone(new Set());
          } else {
            onFinish(deck.map((w) => ({ id: w.id, correct: !missed.current.has(w.id) })));
          }
        }, 450);
      }
    } else {
      missed.current.add(selL);
      missed.current.add(selR);
      setMistakes((m) => m + 1);
      setBad([selL, selR]);
      setTimeout(() => {
        setBad(null);
        setSelL(null);
        setSelR(null);
      }, 450);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selL, selR]);

  const secs = Math.floor((now - start) / 1000);
  const cls = (id, side) => {
    if (done.has(id)) return 'ok';
    if (bad && bad[side === 'L' ? 0 : 1] === id) return 'bad';
    if ((side === 'L' ? selL : selR) === id) return 'sel';
    return '';
  };

  const doneBefore = rounds.slice(0, ri).reduce((s, r) => s + r.length, 0) + done.size;

  return (
    <>
      <Progress i={doneBefore} total={deck.length} right={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} />
      <div className="row small muted" style={{ marginBottom: 12 }}>
        <Icon name="link" size={15} /> Chọn một từ bên trái rồi chọn nghĩa đúng bên phải.
        <span className="spacer" />
        {rounds.length > 1 && <span>Lượt {ri + 1}/{rounds.length}</span>}
        <span className="badge">{mistakes} lỗi</span>
      </div>
      <div className="match-grid">
        <div className="match-col">
          {left.map((w) => (
            <button key={w.id} className={`tile en ${cls(w.id, 'L')}`} disabled={done.has(w.id) || !!bad} onClick={() => setSelL(selL === w.id ? null : w.id)}>
              {w.text}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((w) => (
            <button key={w.id} className={`tile ${cls(w.id, 'R')}`} disabled={done.has(w.id) || !!bad} onClick={() => setSelR(selR === w.id ? null : w.id)}>
              {shortMeaning(w.meaning)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
