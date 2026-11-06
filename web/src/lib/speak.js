let voice = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-US' && /Samantha|Google US|Aria|Jenny/i.test(v.name)) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    null
  );
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); };
}

export const canSpeak = typeof speechSynthesis !== 'undefined';

export function speak(text, rate = 0.92) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = rate;
  voice = voice || pickVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

let current = null;
/** Phát âm một từ: ưu tiên file phát âm thật (từ điển), không có thì dùng giọng máy. */
export function say(w, rate = 1) {
  const text = typeof w === 'string' ? w : w?.text;
  const audio = typeof w === 'string' ? '' : w?.audio;
  if (audio) {
    try {
      current?.pause();
      current = new Audio(audio);
      current.playbackRate = rate < 0.8 ? 0.7 : 1;
      current.play().catch(() => speak(text, rate < 0.8 ? 0.6 : 0.92));
      return;
    } catch {
      /* rơi xuống TTS */
    }
  }
  speak(text, rate < 0.8 ? 0.6 : 0.92);
}
