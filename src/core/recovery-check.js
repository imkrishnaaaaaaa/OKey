/**
 * Small pure helpers for proving the user kept their 24 recovery words.
 * We never store the words, so the proof is: type a few of them back (right
 * after they are shown), or type all of them and test them against the vault.
 */

const WORDS = 24;
const REMIND_AFTER_DAYS = 90;

/** Uniform random integer in [0, max) from crypto, like the password generator's. */
function randBelow(max) {
  const limit = Math.floor(2 ** 32 / max) * max;
  for (;;) {
    const n = globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
    if (n < limit) return n % max;
  }
}

/** Pick `count` different word numbers (1-based), in ascending order. */
export function pickCheckPositions(count = 3, total = WORDS) {
  const chosen = new Set();
  while (chosen.size < count) chosen.add(randBelow(total) + 1);
  return [...chosen].sort((a, b) => a - b);
}

const norm = (w) => String(w ?? '').trim().toLowerCase();

/** True when every answer matches the word at that position. */
export function checkWords(mnemonic, positions, answers) {
  const words = mnemonic.trim().split(/\s+/);
  if (answers.length !== positions.length) return false;
  return positions.every((pos, i) => norm(answers[i]) !== '' && norm(answers[i]) === norm(words[pos - 1]));
}

/** Is it time to ask "do you still have your words?" */
export function recoveryCheckDue(lastCheckAt, now = Date.now()) {
  const last = Date.parse(lastCheckAt);
  if (!Number.isFinite(last)) return true;
  return now - last > REMIND_AFTER_DAYS * 86_400_000;
}
