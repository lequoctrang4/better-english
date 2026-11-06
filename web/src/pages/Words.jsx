import { useRef, useState } from 'react';
import Icon from '../components/Icon';
import WordForm from '../components/WordForm';
import WordBrowser from '../components/WordBrowser';
import { Confirm, Spinner, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useWords, setMastered, deleteWord, importWords } from '../lib/words';
import { firebaseError } from '../lib/util';

export default function Words() {
  const { user } = useAuth();
  const { words, loading, masteredCount } = useWords();
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | word
  const [deleting, setDeleting] = useState(null);
  const fileRef = useRef();

  const toggle = async (w) => {
    const to = w.status !== 'mastered';
    try {
      await setMastered(user.uid, w, to);
      toast(to ? `🎉 Đã thuộc “${w.text}”` : `Chuyển “${w.text}” về đang học`);
    } catch (e) {
      toast(firebaseError(e), 'error');
    }
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const items = Array.isArray(data) ? data : data.words || data.vocab || [];
      if (!items.length) throw new Error('File không có danh sách từ.');
      const { added, skipped } = await importWords(user.uid, items, words);
      toast(`Đã nhập ${added} từ${skipped ? `, bỏ qua ${skipped} (trùng/thiếu nghĩa)` : ''}`);
    } catch (err) {
      toast(err instanceof SyntaxError ? 'File JSON không hợp lệ.' : firebaseError(err), 'error');
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="row wrap" style={{ alignItems: 'flex-end', marginBottom: 26 }}>
        <div>
          <div className="eyebrow">Your word collection</div>
          <h1 className="page-title">Sổ từ vựng, <em>của riêng bạn.</em></h1>
          <p className="page-sub">
            {words.length} từ · {masteredCount} đã thuộc · {words.length - masteredCount} đang học
          </p>
        </div>
        <div className="spacer" />
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <button className="btn btn-outline" onClick={() => fileRef.current.click()} title="Nhập từ file JSON (vd. data/vocab.json)">
          <Icon name="upload" size={16} /> Nhập JSON
        </button>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={16} stroke={2.2} /> Thêm từ
        </button>
      </div>

      <WordBrowser words={words} onToggle={toggle} onEdit={setEditing} onDelete={setDeleting} />

      {editing && <WordForm word={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <Confirm
          title="Xoá từ này?"
          message={`“${deleting.text}” và lịch sử luyện tập của nó sẽ bị xoá vĩnh viễn.`}
          onConfirm={async () => {
            await deleteWord(user.uid, deleting.id);
            toast(`Đã xoá “${deleting.text}”`);
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
