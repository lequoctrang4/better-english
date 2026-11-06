export default function Progress({ i, total, right }) {
  return (
    <div className="play-top">
      <span className="small muted" style={{ minWidth: 48 }}>{Math.min(i + 1, total)}/{total}</span>
      <div className="bar"><span style={{ width: `${(i / total) * 100}%` }} /></div>
      {right && <span className="small muted" style={{ minWidth: 48, textAlign: 'right' }}>{right}</span>}
    </div>
  );
}
