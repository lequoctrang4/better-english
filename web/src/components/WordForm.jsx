import { useRef, useState } from 'react';
import Icon from './Icon';
import { lookup } from '../lib/dict';
import { say } from '../lib/speak';
import { Modal, useToast } from './ui';
import { POS, POS_VI, addWord, updateWord } from '../lib/words';
import { useAuth } from '../lib/auth';
import { useWords } from '../lib/words';
import { dayKey, inputDate } from '../lib/date';
import { firebaseError } from '../lib/util';

const empty = () => ({
  text: '', meaning: '', pos: '', ipa: '', example: '', exampleVi: '', note: '', tags: '', audio: '',
  status: 'learning', learnedAt: dayKey(), masteredAt: dayKey(),
});

/** preset: giá trị mặc định cho từ mới, vd. { tags: 'animals' } khi thêm từ vào một bộ */
export default function WordForm({ word, onClose, preset }) {
  const { user } = useAuth();
  const { words } = useWords();
  const toast = useToast();
  const [f, setF] = useState(() =>
    word
      ? {
          ...empty(),
          ...word,
          tags: (word.tags || []).join(', '),
          learnedAt: inputDate(word.learnedAt) || dayKey(),
          masteredAt: inputDate(word.masteredAt) || dayKey(),
        }
      : { ...empty(), ...preset },
  );
  const [busy, setBusy] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const [look, setLook] = useState({ state: 'idle' }); // idle | loading | done | none
  const lookedFor = useRef('');

  const runLookup = async (force = false) => {
    const q = f.text.trim();
    if (!q || (!force && lookedFor.current.toLowerCase() === q.toLowerCase())) return;
    lookedFor.current = q;
    setLook({ state: 'loading' });
    const r = await lookup(q).catch(() => null);
    if (lookedFor.current !== q) return; // người dùng đã gõ từ khác
    if (!r) return setLook({ state: 'none' });
    const filled = [];
    setF((x) => {
      const y = { ...x };
      for (const k of ['meaning', 'pos', 'ipa', 'example', 'exampleVi', 'audio']) {
        if (!x[k] && r[k]) {
          y[k] = r[k];
          filled.push(k);
        }
      }
      return y;
    });
    setLook({ state: 'done', def: r.definition, filled });
  };
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? (e.target.checked ? 'mastered' : 'learning') : e.target.value }));

  const dup = !word && f.text.trim() && words.find((w) => w.text.toLowerCase() === f.text.trim().toLowerCase());

  const save = async (e) => {
    e.preventDefault();
    if (!f.text.trim() || !f.meaning.trim()) return;
    setBusy(true);
    try {
      if (word) {
        await updateWord(user.uid, word.id, f, word);
        toast('Đã lưu thay đổi');
        onClose();
      } else {
        await addWord(user.uid, f);
        toast(`Đã thêm “${f.text.trim()}”`);
        if (keepOpen) {
          setF({ ...empty(), tags: f.tags, learnedAt: f.learnedAt });
          setLook({ state: 'idle' });
          lookedFor.current = '';
        }
        else onClose();
      }
    } catch (err) {
      toast(firebaseError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={word ? 'Sửa từ' : 'Thêm từ mới'}
      onClose={onClose}
      footer={
        <>
          {!word && (
            <label className="check small muted" style={{ marginRight: 'auto' }}>
              <input type="checkbox" checked={keepOpen} onChange={(e) => setKeepOpen(e.target.checked)} />
              Thêm tiếp sau khi lưu
            </label>
          )}
          <button className="btn btn-ghost" type="button" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" form="word-form" disabled={busy || !f.text.trim() || !f.meaning.trim()}>
            {busy ? 'Đang lưu…' : word ? 'Lưu' : 'Thêm từ'}
          </button>
        </>
      }
    >
      <form id="word-form" className="form-grid" onSubmit={save}>
        <label className="field">
          <span>Từ / cụm từ <b>*</b></span>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="input" autoFocus value={f.text} onChange={set('text')} placeholder="e.g. negotiate"
              onBlur={() => !word && !dup && runLookup()}
              onKeyDown={(e) => { if (e.key === 'Enter' && !f.meaning.trim()) { e.preventDefault(); runLookup(true); } }}
            />
            <button
              type="button" className="btn btn-outline" style={{ padding: '10px 12px' }}
              disabled={!f.text.trim() || look.state === 'loading'} onClick={() => runLookup(true)} title="Tra từ điển và tự điền"
            >
              {look.state === 'loading' ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Icon name="sparkle" size={16} />}
            </button>
          </div>
          {dup && <small style={{ color: 'var(--warn)' }}>Từ này đã có trong sổ của bạn.</small>}
        </label>
        <label className="field">
          <span>Loại từ</span>
          <select className="select" value={f.pos} onChange={set('pos')}>
            <option value="">—</option>
            {POS.map((p) => <option key={p} value={p}>{p} · {POS_VI[p]}</option>)}
          </select>
        </label>
        <label className="field full">
          <span>Nghĩa tiếng Việt <b>*</b> <em className="muted" style={{ fontStyle: 'normal' }}>(nhiều nghĩa ngăn bằng ;)</em></span>
          <input className="input" value={f.meaning} onChange={set('meaning')} placeholder="đàm phán; thương lượng" />
        </label>
        {look.state !== 'idle' && (
          <div className="full dict-note">
            {look.state === 'loading' && <span className="muted">Đang tra từ điển…</span>}
            {look.state === 'none' && <span className="muted">Không tìm thấy trong từ điển — bạn điền tay nhé.</span>}
            {look.state === 'done' && (
              <>
                <div className="row" style={{ gap: 8 }}>
                  <Icon name="sparkle" size={14} style={{ color: 'var(--accent-ink)' }} />
                  <span>
                    {look.filled.length ? 'Đã tự điền từ từ điển — kiểm tra lại nghĩa tiếng Việt nhé.' : 'Đã tra từ điển (các ô đã có nội dung được giữ nguyên).'}
                  </span>
                  <span className="spacer" />
                  {f.audio && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => say(f)}>
                      <Icon name="volume" size={14} /> Nghe
                    </button>
                  )}
                </div>
                {look.def && <div className="muted small" style={{ marginTop: 4 }}>EN: {look.def}</div>}
              </>
            )}
          </div>
        )}
        <label className="field">
          <span>Phiên âm (IPA)</span>
          <input className="input" value={f.ipa} onChange={set('ipa')} placeholder="/nɪˈɡoʊʃieɪt/" />
        </label>
        <label className="field">
          <span>Chủ đề (tags)</span>
          <input className="input" value={f.tags} onChange={set('tags')} placeholder="work, meeting" />
        </label>
        <label className="field full">
          <span>Câu ví dụ</span>
          <input className="input" value={f.example} onChange={set('example')} placeholder="We need to negotiate the price." />
        </label>
        <label className="field full">
          <span>Dịch câu ví dụ</span>
          <input className="input" value={f.exampleVi} onChange={set('exampleVi')} />
        </label>
        <label className="field full">
          <span>Ghi chú</span>
          <textarea className="textarea" rows={2} value={f.note} onChange={set('note')} placeholder="Collocations, từ liên quan, mẹo nhớ…" />
        </label>
        <label className="field">
          <span>Ngày học</span>
          <input className="input" type="date" value={f.learnedAt} max={dayKey()} onChange={set('learnedAt')} />
        </label>
        <div className="field">
          <span>Trạng thái</span>
          <label className="check" style={{ minHeight: 42 }}>
            <input type="checkbox" checked={f.status === 'mastered'} onChange={set('status')} />
            Đã thuộc
          </label>
        </div>
        {f.status === 'mastered' && (
          <label className="field">
            <span>Ngày thuộc</span>
            <input className="input" type="date" value={f.masteredAt} min={f.learnedAt} max={dayKey()} onChange={set('masteredAt')} />
          </label>
        )}
      </form>
    </Modal>
  );
}
