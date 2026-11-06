import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Progress from './Progress';
import { shuffle, shortMeaning } from '../lib/util';
import { say, canSpeak } from '../lib/speak';

function build(deck, pool) {
  return deck.map((w, idx) => {
    const toVi = idx % 2 === 0;
    const label = (x) => (toVi ? shortMeaning(x.meaning) : x.text);
    const seen = new Set([label(w).toLowerCase()]);
    const others = [];
    for (const o of shuffle(pool)) {
      if (o.id === w.id) continue;
      const l = label(o).toLowerCase();
      if (seen.has(l)) continue;
      seen.add(l);
      others.push(o);
      if (others.length === 3) break;
    }
    return { w, toVi, options: shuffle([w, ...others]).map((o) => ({ id: o.id, label: label(o) })) };
  });
}

export default function Quiz({ deck, pool, onFinish }) {
  const qs = useMemo(() => build(deck, pool), [deck, pool]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const res = useRef([]);
  const q = qs[i];
  const score = res.current.filter((r) => r.correct).length;

  const pick = (id) => {
    if (picked) return;
    setPicked(id);
    const correct = id === q.w.id;
    res.current.push({ id: q.w.id, correct });
    if (canSpeak && q.toVi) say(q.w);
    if (correct) setTimeout(next, 900);
  };
  const next = () => {
    if (i + 1 >= qs.length) onFinish(res.current);
    else { setI((x) => x + 1); setPicked(null); }
  };

  useEffect(() => {
    const k = (e) => {
      const n = Number(e.key);
      if (!picked && n >= 1 && n <= q.options.length) pick(q.options[n - 1].id);
      if (picked && e.key === 'Enter') next();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  return (
    <>
      <Progress i={i} total={qs.length} right={`${score} đúng`} />
      <div className="card q-card">
        <div className="kicker">{q.toVi ? 'Từ này nghĩa là gì?' : 'Từ tiếng Anh nào có nghĩa…'}</div>
        <div className={`q-prompt ${q.toVi ? '' : 'vi'}`}>{q.toVi ? q.w.text : q.w.meaning}</div>
        {q.toVi && q.w.ipa && <div className="muted">{q.w.ipa}</div>}
      </div>
      <div className="options">
        {q.options.map((o, idx) => {
          const st = picked ? (o.id === q.w.id ? 'ok' : o.id === picked ? 'bad' : '') : '';
          return (
            <button key={o.id} className={`option ${st}`} disabled={!!picked} onClick={() => pick(o.id)}>
              <kbd>{idx + 1}</kbd>
              <span style={q.toVi ? undefined : { fontFamily: 'var(--font-head)', fontWeight: 700 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      {picked && picked !== q.w.id && (
        <div className="feedback bad">
          <Icon name="bulb" size={18} />
          <div style={{ flex: 1 }}>
            <b>{q.w.text}</b> — {q.w.meaning}
            {q.w.example && <div className="small" style={{ marginTop: 4, opacity: 0.85 }}>“{q.w.example}”</div>}
          </div>
          <button className="btn btn-sm btn-outline" onClick={next}>Tiếp <Icon name="arrow" size={14} /></button>
        </div>
      )}
    </>
  );
}
