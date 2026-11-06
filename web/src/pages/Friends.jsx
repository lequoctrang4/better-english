import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import Icon from '../components/Icon';
import { Avatar, Confirm, useToast } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useSocial } from '../lib/social';
import { db } from '../lib/firebase';
import { acceptRequest, deleteRequest, findUserByEmail, removeFriend, sendRequest } from '../lib/friends';
import { firebaseError } from '../lib/util';
import { relDay } from '../lib/date';

/** Theo dõi hồ sơ công khai (bộ đếm) của danh sách bạn */
function useProfiles(uids) {
  const [map, setMap] = useState({});
  const key = uids.join(',');
  useEffect(() => {
    const unsubs = uids.map((uid) =>
      onSnapshot(doc(db, 'users', uid), (s) => setMap((m) => ({ ...m, [uid]: s.data() })), () => {}),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

export default function Friends() {
  const { user, profile } = useAuth();
  const { friends, incoming, outgoing } = useSocial();
  const toast = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const profiles = useProfiles(friends.map((f) => f.uid));
  const me = profile || { uid: user.uid, displayName: user.displayName, email: user.email, photoURL: user.photoURL };

  const invite = async (e) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em) return;
    if (em === (user.email || '').toLowerCase()) return toast('Đây là email của bạn 🙂', 'error');
    setBusy(true);
    try {
      const target = await findUserByEmail(em);
      if (!target) return toast('Không tìm thấy người dùng với email này. Họ cần đăng nhập wordroom ít nhất một lần.', 'error');
      if (friends.some((f) => f.uid === target.uid)) return toast(`${target.displayName} đã là bạn của bạn.`);
      if (outgoing.some((r) => r.to === target.uid)) return toast('Bạn đã gửi lời mời cho người này rồi.');
      const theirs = incoming.find((r) => r.from === target.uid);
      if (theirs) {
        await acceptRequest(me, theirs);
        toast(`Đã kết bạn với ${target.displayName}!`);
      } else {
        await sendRequest(me, target);
        toast(`Đã gửi lời mời tới ${target.displayName}`);
      }
      setEmail('');
    } catch (err) {
      toast(firebaseError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const act = (fn, msg) => async () => {
    try {
      await fn();
      if (msg) toast(msg);
    } catch (err) {
      toast(firebaseError(err), 'error');
    }
  };

  return (
    <>
      <div className="eyebrow">Learn together</div>
      <h1 className="page-title">Học vui hơn <em>khi có bạn.</em></h1>
      <p className="page-sub">Kết bạn bằng email để xem bạn bè đang học những từ gì và cùng giữ chuỗi ngày học.</p>

      <form className="stage" style={{ marginTop: 24, padding: '24px 26px' }} onSubmit={invite}>
        <span className="pill">Mời bạn học cùng</span>
        <div className="row wrap" style={{ marginTop: 16 }}>
          <div className="search" style={{ minWidth: 240 }}>
            <Icon name="mail" size={16} />
            <input className="input" type="email" placeholder="Email của bạn bè…" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy || !email.trim()}><Icon name="plus" size={16} /> Gửi lời mời</button>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>Email của bạn: <b className="lime">{user.email}</b> — gửi cho bạn bè để họ mời bạn.</p>
      </form>

      {incoming.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div><div className="kicker">Đang chờ bạn</div><h2>Lời mời kết bạn <span className="count">{incoming.length}</span></h2></div>
          </div>
          <div className="card list-card">
            {incoming.map((r) => (
              <div key={r.id} className="person">
                <Avatar name={r.fromName} src={r.fromPhoto} />
                <div className="meta"><div className="name">{r.fromName}</div><div className="sub">{r.fromEmail}</div></div>
                <button className="btn btn-sm btn-ghost" onClick={act(() => deleteRequest(r.from, user.uid), 'Đã từ chối')}>Từ chối</button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={act(() => acceptRequest(me, r, outgoing.some((o) => o.to === r.from)), `Đã kết bạn với ${r.fromName}!`)}
                >
                  <Icon name="check" size={14} /> Đồng ý
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <div><div className="kicker">Cùng nhau</div><h2>Bạn bè ({friends.length})</h2></div>
        </div>
        {friends.length === 0 ? (
          <div className="empty">
            <h3>Chưa có bạn học nào</h3>
            <p>Nhập email của bạn bè ở trên để gửi lời mời.</p>
          </div>
        ) : (
          <div className="grid grid-2">
            {friends.map((f) => {
              const p = profiles[f.uid] || f;
              const total = p.wordCount || 0;
              const m = p.masteredCount || 0;
              return (
                <div key={f.uid} className="card" style={{ cursor: 'pointer' }} onClick={() => nav(`/friends/${f.uid}`)}>
                  <div className="row">
                    <Avatar name={p.displayName} src={p.photoURL} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{p.displayName}</div>
                      <div className="small muted">
                        {p.lastActiveDate ? `Học gần nhất: ${relDay(p.lastActiveDate)}` : 'Chưa có hoạt động'}
                      </div>
                    </div>
                    <button
                      className="icon-btn" title="Huỷ kết bạn"
                      onClick={(e) => { e.stopPropagation(); setRemoving(p); }}
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </div>
                  <div className="row" style={{ marginTop: 14, gap: 18 }}>
                    <div><div className="small muted">Tổng từ</div><b style={{ fontFamily: 'var(--font-head)', fontSize: 20 }}>{total}</b></div>
                    <div><div className="small muted">Đã thuộc</div><b style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'var(--accent-ink)' }}>{m}</b></div>
                    <span className="spacer" />
                    <span className="small lime">Xem sổ từ →</span>
                  </div>
                  <div className="bar" style={{ marginTop: 10 }}><span style={{ width: `${total ? (m / total) * 100 : 0}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {outgoing.length > 0 && (
        <div className="section">
          <div className="section-head"><div><div className="kicker">Đã gửi</div><h2>Đang chờ phản hồi</h2></div></div>
          <div className="card list-card">
            {outgoing.map((r) => (
              <div key={r.id} className="person">
                <Avatar name={r.toName} src={r.toPhoto} />
                <div className="meta"><div className="name">{r.toName}</div><div className="sub">{r.toEmail}</div></div>
                <button className="btn btn-sm btn-outline" onClick={act(() => deleteRequest(user.uid, r.to), 'Đã huỷ lời mời')}>Huỷ lời mời</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {removing && (
        <Confirm
          title="Huỷ kết bạn?"
          message={`Bạn và ${removing.displayName} sẽ không xem được sổ từ của nhau nữa.`}
          confirmText="Huỷ kết bạn"
          onConfirm={async () => { await removeFriend(user.uid, removing.uid); toast('Đã huỷ kết bạn'); }}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}
