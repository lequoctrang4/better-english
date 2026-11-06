import { Brand } from '../components/Layout';

export default function Setup() {
  return (
    <div className="center-fill" style={{ minHeight: '100vh', padding: 20 }}>
      <div className="card" style={{ maxWidth: 560 }}>
        <Brand />
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Chưa cấu hình Firebase</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Tạo file <code>web/.env</code> từ <code>.env.example</code> và điền cấu hình Web app trong Firebase Console
          (Project settings → Your apps), rồi chạy lại <code>npm run dev</code>.
        </p>
        <p className="muted small">Hoặc chạy local bằng emulator: <code>npm run emulators</code> và <code>npm run dev:emu</code>.</p>
      </div>
    </div>
  );
}
