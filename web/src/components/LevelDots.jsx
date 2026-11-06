import { MAX_BOX } from '../lib/words';

/** Cấp độ Leitner dạng chấm: ●●●○○○ */
export default function LevelDots({ box, change }) {
  return (
    <span className={`level ${change || ''}`} aria-label={`Cấp ${box} trên ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <i key={i} className={i < box ? 'on' : ''} />
      ))}
    </span>
  );
}
