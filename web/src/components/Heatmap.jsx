import { addDays, dayKey } from '../lib/date';

const level = (n) => (n <= 0 ? '' : n < 3 ? 'l1' : n < 8 ? 'l2' : n < 16 ? 'l3' : 'l4');

/** Lưới hoạt động 17 tuần gần nhất */
export default function Heatmap({ activity, weeks = 17 }) {
  const map = Object.fromEntries(
    activity.map((a) => [a.date, (a.added || 0) + (a.mastered || 0) + (a.practiced || 0)]),
  );
  const today = new Date();
  // bắt đầu từ thứ Hai của tuần (weeks-1) trước
  const dow = (today.getDay() + 6) % 7;
  const start = addDays(today, -dow - (weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    const k = dayKey(d);
    const future = d > today;
    const n = map[k] || 0;
    cells.push(<i key={k} className={future ? 'future' : level(n)} title={future ? '' : `${k.split('-').reverse().join('/')}: ${n} hoạt động`} />);
  }
  return (
    <div>
      <div className="heat">{cells}</div>
      <div className="heat-legend">
        Ít {[0, 1, 2, 3, 4].map((l) => <i key={l} style={{ background: `var(--heat-${l})` }} />)} Nhiều
      </div>
    </div>
  );
}
