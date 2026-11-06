import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon';
import WordForm from '../components/WordForm';
import WordBrowser from '../components/WordBrowser';
import { Confirm, Modal, Spinner, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useWords, isDue, setMastered, deleteWord, tagWords, untagWords } from '../lib/words';
import { LIB_BY_TAG, libWords, setName, setEmoji, practicePath } from '../lib/sets';
import { firebaseError } from '../lib/util';

/** Một bộ của người dùng = các từ trong sổ có tag này */
export default function SetDetail() {
  const tag = decodeURIComponent(useParams().tag || '');
  const { user } = useAuth();
  const { words, loading } = useWords();
  const toast = useToast();
  const nav = useNavigate();
  const [editing, setEditing] = useState(null); // null | 'new' | word
  const [deleting, setDeleting] = useState(null);
  const [picking, setPicking] = useState(false);
  const [removing, setRemoving] = useState(false);

  const inSet = useMemo(() => words.filter((w) => (w.tags || []).includes(tag)), [words, tag]);
  const lib = LIB_BY_TAG[tag];
  const missing = useMemo(() => {
    if (!lib) return 0;
    const have = new Set(inSet.map((w) => w.text.toLowerCase()));
    return libWords(lib).filter((w) => !have.has(w.text.toLowerCase())).length;
  }, [lib, inSet]);

  if (loading) return <Spinner />;

  const mastered = inSet.filter((w) => w.status === 'mastered').length;
  const due = inSet.filter(isDue).length;

  const toggle = async (w) => {
    const to = w.status !== 'mastered';
    try {
      await setMastered(user.uid, w, to);
      toast(to ? `🎉 Đã thuộc “${w.text}”` : `Chuyển “${w.text}” về đang học`);
    } catch (e) {
      toast(firebaseError(e), 'error');
    }
  };

  return (
    <>
      <Link to="/sets" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}><Icon name="back" size={15} /> Bộ từ vựng</Link>
      <div className="row wrap" style={{ alignItems: 'flex-end', marginBottom: 22 }}>
        <div className="row" style={{ gap: 14 }}>
          <span className="set-emoji lg">{setEmoji(tag)}</span>
          <div>
            <div className="eyebrow">{lib ? lib.en : `#${tag}`}</div>
            <h1 className="page-title" style={{ margin: '4px 0' }}>{setName(tag)}</h1>
            <p className="page-sub">
              {inSet.length} từ · {mastered} đã thuộc · {due} cần ôn hôm nay
            </p>
          </div>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" disabled={!inSet.length} onClick={() => nav(practicePath(tag))}>
          <Icon name="game" size={16} /> Luyện bộ này
        </button>
      </div>

      <div className="row wrap" style={{ gap: 8, marginBottom: 18 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setEditing('new')}><Icon name="plus" size={14} /> Thêm từ mới</button>
        <button className="btn btn-outline btn-sm" onClick={() => setPicking(true)}><Icon name="book" size={14} /> Chọn từ trong sổ</button>
        {lib && missing > 0 && (
          <Link className="btn btn-outline btn-sm" to={`/sets/lib/${lib.id}`}><Icon name="layers" size={14} /> Thêm {missing} từ còn lại từ thư viện</Link>
        )}
        <span className="spacer" />
        {inSet.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setRemoving(true)}><Icon name="trash" size={14} /> Xoá bộ</button>
        )}
      </div>

      {inSet.length === 0 ? (
        <div className="empty">
          <h3>Bộ “{setName(tag)}” chưa có từ nào</h3>
          <p>Thêm từ mới, hoặc chọn những từ đã có trong sổ để gom vào bộ này.</p>
          <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Thêm từ mới</button>
            <button className="btn btn-outline" onClick={() => setPicking(true)}>Chọn từ trong sổ</button>
          </div>
        </div>
      ) : (
        <WordBrowser words={inSet} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} />
      )}

      {editing && (
        <WordForm word={editing === 'new' ? null : editing} preset={{ tags: tag }} onClose={() => setEditing(null)} />
      )}
      {picking && <PickWords tag={tag} words={words} onClose={() => setPicking(false)} />}
      {deleting && (
        <Confirm
          title="Xoá từ này khỏi sổ?"
          message={`“${deleting.text}” sẽ bị xoá vĩnh viễn khỏi sổ (cả các bộ khác). Muốn chỉ bỏ khỏi bộ thì sửa từ và xoá tag “${tag}”.`}
          onConfirm={async () => {
            await deleteWord(user.uid, deleting.id);
            toast(`Đã xoá “${deleting.text}”`);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
      {removing && (
        <Confirm
          title={`Xoá bộ “${setName(tag)}”?`}
          message={`Chỉ gỡ ${inSet.length} từ ra khỏi bộ — các từ vẫn còn trong sổ cùng lịch ôn tập.`}
          confirmText="Xoá bộ"
          onConfirm={async () => {
            try {
              await untagWords(user.uid, inSet.map((w) => w.id), tag);
              toast(`Đã xoá bộ “${setName(tag)}”`);
              nav('/sets');
            } catch (e) {
              toast(firebaseError(e), 'error');
            }
          }}
          onClose={() => setRemoving(false)}
        />
      )}
    </>
  );
}

/** Chọn từ có sẵn trong sổ để gắn vào bộ */
function PickWords({ tag, words, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const candidates = useMemo(() => {
    const s = q.trim().toLowerCase();
    return words
      .filter((w) => !(w.tags || []).includes(tag))
      .filter((w) => !s || w.text.toLowerCase().includes(s) || w.meaning.toLowerCase().includes(s))
      .sort((a, b) => a.text.localeCompare(b.text));
  }, [words, tag, q]);

  const flip = (id) => setSel((x) => {
    const y = new Set(x);
    y.has(id) ? y.delete(id) : y.add(id);
    return y;
  });

  const save = async () => {
    setBusy(true);
    try {
      await tagWords(user.uid, [...sel], tag);
      toast(`Đã thêm ${sel.size} từ vào bộ “${setName(tag)}”`);
      onClose();
    } catch (e) {
      toast(firebaseError(e), 'error');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Thêm từ vào bộ “${setName(tag)}”`}
      onClose={onClose}
      width={560}
      footer={
        <>
          <span className="muted small" style={{ marginRight: 'auto' }}>Đã chọn {sel.size}</span>
          <button className="btn btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" disabled={!sel.size || busy} onClick={save}>{busy ? 'Đang lưu…' : sel.size ? `Thêm ${sel.size} từ` : 'Thêm từ'}</button>
        </>
      }
    >
      <div className="search" style={{ marginBottom: 12 }}>
        <Icon name="search" size={16} />
        <input className="input" autoFocus placeholder="Tìm từ hoặc nghĩa…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {candidates.length === 0 ? (
        <p className="muted small">{words.length ? 'Không còn từ nào phù hợp.' : 'Sổ của bạn chưa có từ nào.'}</p>
      ) : (
        <div className="pick-list">
          {candidates.map((w) => (
            <label key={w.id} className={`pick-row ${sel.has(w.id) ? 'on' : ''}`}>
              <input type="checkbox" checked={sel.has(w.id)} onChange={() => flip(w.id)} />
              <b>{w.text}</b>
              <span className="muted small">{w.meaning}</span>
              {(w.tags || []).length > 0 && <span className="muted small hide-sm" style={{ marginLeft: 'auto' }}>{w.tags.map((t) => `#${t}`).join(' ')}</span>}
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
