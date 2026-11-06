import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Progress from './Progress';
import { blankOut, norm } from '../lib/util';
import { say } from '../lib/speak';
import { POS_VI } from '../lib/words';

/** Gõ từ (xem nghĩa) và Nghe & gõ (listen=true) */
export default function Typing({ deck, onFinish, listen }) {
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState(0);
  const [state, setState] = useState(null); // null | 'ok' | 'bad' | 'retry'
  const res = useRef([]);
  const input = useRef();
  const w = deck[i];
  const score = res.current.filter((r) => r.correct).length;

  useEffect(() => {
    input.current?.focus();
    if (listen) setTimeout(() => say(w), 250);
  }, [i, listen, w.text]);

  const finishWord = (correct) => {
    res.current.push({ id: w.id, correct });
    setState(correct ? 'ok' : 'bad');
    if (!listen) say(w);
  };

  const next = () => {
    if (i + 1 >= deck.length) return onFinish(res.current);
    setI(i + 1);
    setVal('');
    setTries(0);
    setHint(0);
    setState(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (state === 'ok' || state === 'bad') return next();
    if (!val.trim()) return;
    if (norm(val) === norm(w.text)) return finishWord(hint === 0);
    if (tries === 0) {
      setTries(1);
      setState('retry');
      return;
    }
    finishWord(false);
  };

  const hintText = w.text
    .split('')
    .map((c, idx) => (c === ' ' ? ' ' : idx < hint ? c : '_'))
    .join('');

  const done = state === 'ok' || state === 'bad';

  return (
    <>
      <Progress i={i} total={deck.length} right={`${score} đúng`} />
      <div className="card q-card">
        {listen ? (
          <>
            <div className="kicker">Nghe và gõ lại từ bạn nghe được</div>
            <div className="row" style={{ justifyContent: 'center', gap: 12, margin: '18px 0 8px' }}>
              <button className="btn btn-primary btn-lg" type="button" onClick={() => say(w)}><Icon name="volume" size={20} /> Nghe</button>
              <button className="btn btn-outline btn-lg" type="button" onClick={() => say(w, 0.6)}>Chậm</button>
            </div>
            {(hint > 0 || done) && <div className="muted">{w.meaning}</div>}
          </>
        ) : (
          <>
            <div className="kicker">Gõ từ tiếng Anh có nghĩa</div>
            <div className="q-prompt vi">{w.meaning}</div>
            <div className="muted small">{[w.pos && POS_VI[w.pos], `${w.text.length} ký tự`].filter(Boolean).join(' · ')}</div>
            {w.example && <p className="muted" style={{ fontStyle: 'italic', marginTop: 10 }}>“{done ? w.example : blankOut(w.example, w.text)}”</p>}
          </>
        )}
        {hint > 0 && !done && <div className="hint-letters">{hintText}</div>}
      </div>

      <form onSubmit={submit}>
        <input
          ref={input}
          className="input input-lg"
          value={val}
          disabled={done}
          onChange={(e) => { setVal(e.target.value); if (state === 'retry') setState(null); }}
          placeholder="Gõ câu trả lời rồi nhấn Enter"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        />
        {state === 'retry' && <div className="feedback bad"><Icon name="x" size={18} /> Chưa đúng — thử lại một lần nữa nhé.</div>}
        {state === 'ok' && (
          <div className="feedback ok">
            <Icon name="check" size={18} />
            <div style={{ flex: 1 }}><b>{w.text}</b> {w.ipa} {hint > 0 ? '— đúng (có dùng gợi ý)' : '— chính xác!'}</div>
          </div>
        )}
        {state === 'bad' && (
          <div className="feedback bad">
            <Icon name="bulb" size={18} />
            <div style={{ flex: 1 }}>Đáp án: <b>{w.text}</b> {w.ipa} — {w.meaning}</div>
          </div>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          {!done && (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setHint((h) => Math.min(h + 1, w.text.length - 1))}>
                <Icon name="bulb" size={16} /> Gợi ý
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => finishWord(false)}>Bỏ qua</button>
            </>
          )}
          <span className="spacer" />
          <button className="btn btn-primary">{done ? <>Tiếp <Icon name="arrow" size={16} /></> : 'Kiểm tra'}</button>
        </div>
      </form>
    </>
  );
}
