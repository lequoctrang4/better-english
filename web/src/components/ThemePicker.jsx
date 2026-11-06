import { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { THEMES, applyTheme } from '../lib/theme';
import Icon from './Icon';

const Swatch = ({ t, size = 18 }) => (
  <span className="swatch" style={{ width: size, height: size, background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }} />
);

export default function ThemePicker() {
  const { user, profile } = useAuth();
  const [cur, setCur] = useState(() => document.documentElement.dataset.theme || 'forest');
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Theme lưu trong hồ sơ được ưu tiên (đồng bộ giữa các thiết bị)
  useEffect(() => {
    if (profile?.theme && profile.theme !== cur) setCur(applyTheme(profile.theme));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const pick = (id) => {
    setCur(applyTheme(id));
    setOpen(false);
    if (user) updateDoc(doc(db, 'users', user.uid), { theme: id }).catch(() => {});
  };

  const t = THEMES.find((x) => x.id === cur) || THEMES[0];
  return (
    <div className="theme-picker" ref={ref}>
      <button className="btn btn-outline btn-sm" onClick={() => setOpen(!open)} title="Đổi giao diện" aria-expanded={open}>
        <Swatch t={t} size={16} /> <span className="hide-sm">{t.name}</span>
      </button>
      {open && (
        <div className="theme-menu" role="menu">
          <div className="kicker" style={{ padding: '4px 8px 8px' }}>Giao diện</div>
          {THEMES.map((x) => (
            <button key={x.id} role="menuitemradio" aria-checked={x.id === cur} className={`theme-item ${x.id === cur ? 'on' : ''}`} onClick={() => pick(x.id)}>
              <Swatch t={x} />
              {x.name}
              {x.id === cur && <Icon name="check" size={15} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
