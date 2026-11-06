import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { firebaseError } from '../lib/util';
import { Brand } from '../components/Layout';
import Icon from '../components/Icon';
import { usingEmulator } from '../lib/firebase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function Login() {
  const { loginGoogle, loginEmail, signupEmail } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setErr('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(firebaseError(e));
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'signup') run(() => signupEmail(name.trim() || email.split('@')[0], email.trim(), pw));
    else run(() => loginEmail(email.trim(), pw));
  };

  return (
    <div className="auth">
      <section className="auth-art">
        <Brand />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 460 }}>
          <span className="pill">Góc học của bạn</span>
          <h1>Mỗi ngày một từ.<br /><em>Nhớ thật lâu.</em></h1>
          <p className="muted" style={{ fontSize: 15, maxWidth: 380 }}>
            Ghi lại từ mới, đánh dấu khi đã thuộc, luyện bằng mini game và học cùng bạn bè.
          </p>
        </div>
        <div className="row small muted" style={{ position: 'relative', zIndex: 1 }}>
          <Icon name="sparkle" size={15} /> Không vội vàng. Mỗi ngày một chút.
        </div>
        <div className="deck" aria-hidden="true">
          <div className="deck-card c3" />
          <div className="deck-card c2" />
          <div className="deck-card c1">
            <span className="deck-tag">verb</span>
            <b>achieve</b>
            <span className="deck-ipa">/əˈtʃiːv/</span>
            <span className="deck-mean">đạt được</span>
          </div>
        </div>
      </section>

      <section className="auth-form">
        <div className="auth-box">
          {usingEmulator && (
            <div className="err" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
              Bản chạy thử local (Firebase Emulator) — tài khoản và dữ liệu ở đây không lưu lên Firestore thật.
            </div>
          )}
          <div>
            <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the room'}</div>
            <h2 style={{ fontSize: 26, letterSpacing: -1, marginTop: 6 }}>
              {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </h2>
          </div>

          <button className="btn btn-outline btn-lg btn-block" disabled={busy} onClick={() => run(loginGoogle)}>
            <GoogleIcon /> Tiếp tục với Google
          </button>

          <div className="divider">hoặc dùng email</div>

          <form className="stack" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="field">
                <span>Tên hiển thị</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Minh Anh" />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label className="field">
              <span>Mật khẩu</span>
              <input
                className="input" type="password" required minLength={6} value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
            {err && <div className="err">{err}</div>}
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="muted small" style={{ textAlign: 'center' }}>
            {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-ink)' }}
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}
            >
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
