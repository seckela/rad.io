// A seed for the whole text, so different texts get different baselines (chord loops, rhythm and phrase shapes, melody
// contours) while the same text always gets the same ones. It comes from coarse features of the text rather than every character,
// so a small edit (a typo, a changed word, an extra line) doesn't change the whole track: how long the text is and how many
// lines it has (in powers of two), how much of it is punctuation, capitals, digits and indentation (in steps of 10%), how long
// the average line is, and its three most common letters.
export function seedOf(text) {
  const t = text.replace(/\r\n?/g, '\n');
  const len = Math.max(1, t.length), lines = t.split('\n').filter(l => l.trim()).length || 1;
  const count = re => (t.match(re) || []).length;
  const pct = re => Math.min(9, Math.floor(10 * count(re) / len * 2.5));      // x2.5 so ordinary texts spread across the buckets
  const freq = {};
  for (const ch of t.toLowerCase()) if (ch >= 'a' && ch <= 'z') freq[ch] = (freq[ch] || 0) + 1;
  const top = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || (a < b ? -1 : 1)).slice(0, 3).join('');
  const feats = [Math.floor(Math.log2(len)), Math.floor(Math.log2(lines)), pct(/[^\w\s]/g), pct(/[A-Z]/g), pct(/[0-9]/g),
    pct(/^[ \t]+/gm), Math.min(9, Math.floor(len / lines / 12)), top].join('|');
  return hash(feats);
}

// FNV-1a, then a final mix, to an unsigned 32-bit number.
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return h >>> 0;
}

// A choice in [0, n) for this seed and a name for what is being chosen. Different names give independent choices, so the chord loop
// doesn't always move together with the drum pattern.
export function pick(seed, name, n) { return hash(seed + ':' + name) % n; }

// The seed as a short code to show and share: base 36, upper case, 7 characters.
export const formatSeed = n => n.toString(36).toUpperCase().padStart(7, '0');

// What the user typed in the seed box, as a seed: null for empty (use the text's own). A code from formatSeed, or any short run of
// letters and digits, is read as base 36 so a code round-trips; anything else (a phrase, a name) is hashed, so any word works.
export function parseSeed(str) {
  const t = (str || '').trim();
  if (!t) return null;
  if (/^[0-9a-z]{1,7}$/i.test(t)) { const n = parseInt(t, 36); if (n < 2 ** 32) return n; }
  return hash(t);
}
