import Icon from './Icon';
import { fmtDate, dueLabel } from '../lib/date';
import LevelDots from './LevelDots';
import { say, canSpeak } from '../lib/speak';
import { POS_VI, srsOf, isDue } from '../lib/words';

export default function WordRow({ w, onToggle, onEdit, onDelete, readOnly }) {
  const done = w.status === 'mastered';
  const { box, due } = srsOf(w);
  const dueNow = isDue(w);
  return (
    <div className={`word-row ${done ? 'done' : ''}`}>
      {readOnly ? (
        <span className={`tick ${done ? 'on' : ''}`} style={{ cursor: 'default' }}><Icon name="check" size={15} stroke={2.4} /></span>
      ) : (
        <button className={`tick ${done ? 'on' : ''}`} onClick={() => onToggle(w)} title={done ? 'Bỏ đánh dấu đã thuộc' : 'Đánh dấu đã thuộc'}>
          <Icon name="check" size={15} stroke={2.4} />
        </button>
      )}
      <div style={{ minWidth: 0 }}>
        <div className="w-text">
          {w.text}
          {canSpeak && (
            <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => say(w)} title="Nghe phát âm">
              <Icon name="volume" size={15} />
            </button>
          )}
        </div>
        <div className="w-meta">
          <span title={`Cấp ôn tập ${box}/6`}><LevelDots box={box} /></span>
          {!readOnly && dueNow && <span className="badge badge-lime" style={{ padding: '1px 7px', fontSize: 10.5 }}>cần ôn</span>}
          {w.pos && <span className="pos">{POS_VI[w.pos] || w.pos}</span>}
          {w.ipa && <span>{w.ipa}</span>}
          {(w.tags || []).slice(0, 3).map((t) => <span key={t}>#{t}</span>)}
        </div>
      </div>
      <div className="w-meaning-col" style={{ minWidth: 0 }}>
        <div className="w-meaning">{w.meaning}</div>
        {w.example && <div className="w-example" title={w.example}>“{w.example}”</div>}
      </div>
      <div className="w-dates">
        <div>Học: <b>{fmtDate(w.learnedAt)}</b></div>
        <div>{done ? <>Thuộc: <b style={{ color: 'var(--accent-ink)' }}>{fmtDate(w.masteredAt)}</b></> : <span className="badge badge-warn">Đang học</span>}</div>
        {!readOnly && <div>Ôn: <b>{dueLabel(due)}</b></div>}
      </div>
      {!readOnly && (
        <div className="w-actions">
          <button className="icon-btn" onClick={() => onEdit(w)} title="Sửa"><Icon name="edit" size={16} /></button>
          <button className="icon-btn" onClick={() => onDelete(w)} title="Xoá"><Icon name="trash" size={16} /></button>
        </div>
      )}
    </div>
  );
}
