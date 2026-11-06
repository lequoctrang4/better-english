/**
 * Tra từ điển miễn phí, không cần key:
 *  - Free Dictionary API (dictionaryapi.dev): IPA, loại từ, ví dụ, file phát âm, định nghĩa tiếng Anh
 *  - MyMemory (mymemory.translated.net): gợi ý nghĩa tiếng Việt, dịch câu ví dụ
 */
const POS_MAP = { noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb', preposition: 'preposition', conjunction: 'conjunction' };

async function getJSON(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.status === 404) return null;
      if (r.ok) return await r.json();
    } catch {
      /* thử lại */
    }
  }
  return null;
}

async function dictionary(word) {
  const data = await getJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!Array.isArray(data) || !data.length) return null;
  const phonetics = data.flatMap((e) => e.phonetics || []);
  const us = phonetics.find((p) => p.audio && /-us\.mp3$/.test(p.audio));
  const anyAudio = us || phonetics.find((p) => p.audio);
  const ipa = (us?.text || phonetics.find((p) => p.text)?.text || data[0].phonetic || '').trim();
  const meanings = data.flatMap((e) => e.meanings || []);
  const first = meanings[0];
  const samePos = meanings.filter((m) => m.partOfSpeech === first?.partOfSpeech);
  const examples = samePos
    .flatMap((m) => m.definitions || [])
    .map((d) => d.example)
    .filter((x) => x && x.split(/\s+/).length <= 16)
    .sort((a, b) => a.length - b.length);
  return {
    ipa: ipa && !ipa.startsWith('/') ? `/${ipa}/` : ipa,
    audio: anyAudio?.audio || '',
    pos: POS_MAP[first?.partOfSpeech] || (first ? 'other' : ''),
    definition: first?.definitions?.[0]?.definition || '',
    example: examples[0] || '',
  };
}

async function translate(text) {
  if (!text) return [];
  const data = await getJSON(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Cvi`, 1);
  if (!data || data.responseStatus !== 200) return [];
  const clean = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const out = [];
  const add = (t) => {
    const c = clean(t);
    if (c && c.toLowerCase() !== text.toLowerCase() && !out.some((o) => o.toLowerCase() === c.toLowerCase())) out.push(c);
  };
  add(data.responseData?.translatedText);
  for (const m of data.matches || []) if (Number(m.match) >= 0.7) add(m.translation);
  return out;
}

/** Kết quả: { ipa, audio, pos, definition, example, meaning, exampleVi } — trường nào không tìm được thì rỗng */
export async function lookup(word) {
  const q = word.trim();
  if (!q) return null;
  const [d, tr] = await Promise.all([dictionary(q.toLowerCase()), translate(q)]);
  const exampleVi = d?.example ? (await translate(d.example))[0] || '' : '';
  const meaning = tr.slice(0, 3).map((t) => t.replace(/[.。!]+$/, '')).map((t) => (/^[A-ZĐ]/.test(t) && /^[a-z]/.test(q) ? t[0].toLowerCase() + t.slice(1) : t)).join('; ');
  if (!d && !meaning) return null;
  return { ...(d || {}), meaning, exampleVi };
}
