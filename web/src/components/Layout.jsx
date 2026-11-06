import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { Avatar } from './ui';
import ThemePicker from './ThemePicker';
import { usingEmulator } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { useSocial } from '../lib/social';
import { useWords } from '../lib/words';

const NAV = [
  { to: '/', icon: 'home', label: 'Tổng quan', end: true },
  { to: '/words', icon: 'book', label: 'Sổ từ vựng' },
  { to: '/sets', icon: 'layers', label: 'Bộ từ vựng', short: 'Bộ từ' },
  { to: '/practice', icon: 'game', label: 'Luyện tập' },
  { to: '/friends', icon: 'users', label: 'Bạn bè' },
];

const TITLES = { '': 'Tổng quan', words: 'Sổ từ vựng', sets: 'Bộ từ vựng', practice: 'Luyện tập', friends: 'Bạn bè' };

export function Brand() {
  return (
    <div className="brand">
      <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--accent)" />
        <path d="M14 22l7 22 11-17 11 17 7-22" fill="none" stroke="var(--on-accent)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>wordroom<span className="dot">.</span></span>
    </div>
  );
}

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const { incoming } = useSocial();
  const { streak } = useWords();
  const loc = useLocation();
  const nav = useNavigate();
  const seg = loc.pathname.split('/')[1] || '';
  const sub = loc.pathname.split('/')[2];

  const name = profile?.displayName || user?.displayName || 'Bạn';

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">Không gian của bạn</div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon name={n.icon} />
            {n.label}
            {n.to === '/friends' && incoming.length > 0 && <span className="count" style={{ marginLeft: 'auto' }}>{incoming.length}</span>}
          </NavLink>
        ))}

        <div className="side-card">
          <Icon name="flame" size={20} style={{ color: 'var(--accent-ink)' }} />
          <h4>{streak > 0 ? `${streak} ngày liên tiếp.` : 'Học một chút mỗi ngày.'}</h4>
          <p>{streak > 0 ? 'Giữ nhịp nhé — chỉ cần 5 phút hôm nay.' : 'Một từ mới, một ván game. Thế là đủ.'}</p>
          <button className="btn btn-primary btn-sm btn-block" onClick={() => nav('/practice')}>
            <Icon name="game" size={15} /> Luyện ngay
          </button>
        </div>

        <div className="side-user">
          <Avatar name={name} src={profile?.photoURL} />
          <div className="meta">
            <div className="name">{name}</div>
            <div className="sub">{profile?.email}</div>
          </div>
          <button className="icon-btn" title="Đăng xuất" onClick={logout}><Icon name="logout" size={17} /></button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="crumbs">
            <span>Không gian của bạn</span>
            <Icon name="chevron" size={13} />
            <b>{TITLES[seg] ?? ''}{sub && seg === 'friends' ? ' / Hồ sơ' : ''}{sub && seg === 'practice' ? ' / Chơi' : ''}{sub && seg === 'sets' ? ' / Chi tiết' : ''}</b>
          </div>
          <div className="row">
            {usingEmulator && (
              <span className="badge badge-warn" title="Đang dùng Firebase Emulator trên máy — dữ liệu KHÔNG lưu lên Firestore thật">
                EMULATOR · dữ liệu local
              </span>
            )}
            <ThemePicker />
            <button className="btn btn-outline btn-sm" onClick={() => nav('/friends')}>
              <Icon name="users" size={15} /> <span className="hide-sm">Học cùng bạn</span>
              {incoming.length > 0 && <span className="count">{incoming.length}</span>}
            </button>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>

      <nav className="bottom-nav">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={n.icon} size={20} />
            {n.short || n.label}
            {n.to === '/friends' && incoming.length > 0 && <span className="count">{incoming.length}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
