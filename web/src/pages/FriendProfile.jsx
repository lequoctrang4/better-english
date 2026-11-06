import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocs, orderBy, query } from 'firebase/firestore';
import Icon from '../components/Icon';
import Heatmap from '../components/Heatmap';
import WordBrowser from '../components/WordBrowser';
import { Avatar, Spinner, useToast } from '../components/ui';
import { useSocial } from '../lib/social';
import { useAuth } from '../lib/auth';
import { getUser } from '../lib/friends';
import { wordsCol, loadActivity, activityStreak, addWord, useWords } from '../lib/words';
import { fmtDate, relDay, dayKey } from '../lib/date';
import { firebaseError } from '../lib/util';

export default function FriendProfile() {
  const { uid } = useParams();
  const { friends } = useSocial();
  const { user } = useAuth();
  const { words: mine } = useWords();
  const toast = useToast();
  const nav = useNavigate();
  const [state, setState] = useState({ loading: true });
  const isFriend = friends.some((f) => f.uid === uid);

  useEffect(() => {
    if (!isFriend) return;
    let alive = true;
    (async () => {
      try {
        const [p, ws, act] = await Promise.all([
          getUser(uid),
          getDocs(query(wordsCol(uid), orderBy('createdAt', 'desc'))),
          loadActivity(uid),
        ]);
        if (alive) setState({ loading: false, profile: p, words: ws.docs.map((d) => ({ id: d.id, ...d.data() })), activity: act });
      } catch (e) {
        if (alive) setState({ loading: false, error: firebaseError(e) });
      }
    })();
    return () => { alive = false; };
  }, [uid, isFriend]);

  const mineSet = useMemo(() => new Set(mine.map((w) => w.text.toLowerCase())), [mine]);
  const { profile, words = [], activity = [] } = state;
  const mastered = words.filter((w) => w.status === 'mastered').length;
  const streak = activityStreak(activity);
  const thisWeek = activity.filter((a) => a.date >= dayKey(new Date(Date.now() - 6 * 86400000))).reduce((s, a) => s + (a.added || 0), 0);

  if (!friends.length && state.loading) return <Spinner />;
  if (!isFriend) {
    return (
      <div className="empty">
        <h3>Không xem được hồ sơ này</h3>
        <p>Bạn chỉ xem được sổ từ của những người đã kết bạn.</p>
        <button className="btn btn-primary" onClick={() => nav('/friends')}>Về trang Bạn bè</button>
      </div>
    );
  }
  if (state.loading) return <Spinner />;
  if (state.error) return <div className="empty"><h3>Lỗi</h3><p>{state.error}</p></div>;

  const copy = async (w) => {
    try {
      await addWord(user.uid, { ...w, tags: w.tags || [], status: 'learning', learnedAt: dayKey() });
      toast(`Đã thêm “${w.text}” vào sổ của bạn`);
    } catch (e) {
      toast(firebaseError(e), 'error');
    }
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => nav('/friends')}><Icon name="back" size={15} /> Bạn bè</button>

      <div className="stage" style={{ marginTop: 14 }}>
        <div className="row wrap" style={{ gap: 18 }}>
          <Avatar name={profile?.displayName} src={profile?.photoURL} size="lg" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <span className="pill">Góc học của bạn bè</span>
            <h1 className="page-title" style={{ marginTop: 12 }}>{profile?.displayName}</h1>
            <p className="muted small">{profile?.lastActiveDate ? `Học gần nhất ${relDay(profile.lastActiveDate)}` : 'Chưa có hoạt động'} · tham gia {fmtDate(profile?.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginTop: 16 }}>
        <div className="card stat"><div className="label"><Icon name="book" size={15} /> Tổng số từ</div><div className="value">{words.length}</div></div>
        <div className="card stat"><div className="label"><Icon name="star" size={15} /> Đã thuộc</div><div className="value">{mastered}</div></div>
        <div className="card stat"><div className="label"><Icon name="flame" size={15} /> Chuỗi ngày</div><div className="value">{streak}<small>ngày</small></div></div>
        <div className="card stat"><div className="label"><Icon name="calendar" size={15} /> Từ mới 7 ngày</div><div className="value">{thisWeek}</div></div>
      </div>

      <div className="section">
        <div className="section-head"><div><div className="kicker">Nhịp học</div><h2>Hoạt động</h2></div></div>
        <div className="card"><Heatmap activity={activity} /></div>
      </div>

      <div className="section">
        <div className="section-head">
          <div><div className="kicker">Sổ từ của {profile?.displayName}</div><h2>Những gì bạn ấy đã học</h2></div>
        </div>
        <WordBrowser
          words={words.map((w) => ({ ...w }))}
          readOnly
          extra={null}
        />
        <CopyHint words={words} mineSet={mineSet} onCopy={copy} />
      </div>
    </>
  );
}

/** Gợi ý những từ bạn bè có mà mình chưa có */
function CopyHint({ words, mineSet, onCopy }) {
  const missing = words.filter((w) => !mineSet.has(w.text.toLowerCase())).slice(0, 12);
  if (!missing.length) return null;
  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="kicker">Học ké</div>
      <h3 style={{ fontSize: 16, margin: '4px 0 12px' }}>Từ bạn ấy có mà bạn chưa có</h3>
      <div className="row wrap" style={{ gap: 8 }}>
        {missing.map((w) => (
          <button key={w.id} className="btn btn-sm btn-outline" title={w.meaning} onClick={() => onCopy(w)}>
            <Icon name="plus" size={13} /> {w.text}
          </button>
        ))}
      </div>
    </div>
  );
}
