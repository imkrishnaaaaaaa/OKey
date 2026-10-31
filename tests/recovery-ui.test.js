import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers.js';
import { generateRecoveryMnemonic } from '../src/core/recovery.js';

installFakeDom();
const { recoveryReveal } = await import('../src/ui/recovery-ui.js');

function setup() {
  const mnemonic = generateRecoveryMnemonic();
  const words = mnemonic.split(' ');
  const positions = [4, 11, 19];
  let confirmed = 0;
  const { el } = recoveryReveal(mnemonic, { positions, onConfirmed: () => { confirmed++; } });
  const boxes = el.findAll((n) => n.tag === 'input');
  const button = el.find((n) => n.tag === 'button' && n.attrs.type === 'submit');
  const type = (i, text) => { boxes[i].value = text; boxes[i].dispatch('input'); };
  return { words, positions, boxes, button, type, confirmed: () => confirmed, el };
}

test('it shows all 24 words and asks for exactly the three chosen ones', () => {
  const { el, boxes, positions } = setup();
  const text = JSON.stringify(el, (k, v) => (k === 'parent' || k === 'handlers' ? undefined : v));
  assert.equal(boxes.length, 3);
  for (const n of positions) assert.ok(text.includes(`Word ${n}`), `asks for word ${n}`);
  assert.equal(el.findAll((n) => n.className === 'ok-word').length, 24);
});

test('the confirm button is off until all three words are right', () => {
  const { words, positions, button, type } = setup();
  assert.equal(button.disabled, true);
  type(0, words[positions[0] - 1]);
  type(1, words[positions[1] - 1]);
  assert.equal(button.disabled, true, 'two of three is not enough');
  type(2, 'zebra');
  assert.equal(button.disabled, true, 'a wrong word keeps it off');
  type(2, ` ${words[positions[2] - 1].toUpperCase()} `);
  assert.equal(button.disabled, false, 'case and spaces do not matter');
  type(0, 'wrong');
  assert.equal(button.disabled, true, 'it turns off again if an answer is changed');
});

test('confirming runs the callback once, however many times it is pressed', () => {
  const { words, positions, button, type, confirmed } = setup();
  positions.forEach((p, i) => type(i, words[p - 1]));
  button.click(); button.click();
  assert.equal(confirmed(), 1);
});
