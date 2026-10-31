import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOtpFieldLike, isNewPasswordField } from '../src/extension/content/field-kinds.js';
import { createFillGuard } from '../src/extension/content/fill-guard.js';

const input = (over = {}) => ({ tagName: 'INPUT', type: 'text', name: '', id: '', autocomplete: '', ...over });

test('real one-time-code boxes are recognised', () => {
  for (const over of [
    { autocomplete: 'one-time-code' }, { name: 'otp' }, { id: 'user_otp' }, { name: 'totp-input' },
    { name: 'verification_code' }, { id: 'verificationCode' },
    { name: 'authcode' }, { name: 'mfa' }, { id: '2fa' }, { name: 'one_time_code' },
  ]) assert.equal(isOtpFieldLike(input(over)), true, JSON.stringify(over));
});

test('ordinary boxes that only contain the letters are not one-time-code boxes', () => {
  for (const over of [
    { name: 'shipping' }, { name: 'pincode' }, { name: 'postcode' }, { id: 'promo_code' },
    { name: 'author' }, { name: 'zip_code' }, { id: 'coupon-code' }, { name: 'secure_note' },
    { name: 'authentication_method' }, { name: 'phone_pin' },
    // Card boxes: a 2FA code must never go into a payment form.
    { name: 'security_code' }, { id: 'security-code' }, { name: 'cvv' }, { id: 'cvc' }, { name: 'card_cvv' }, { name: 'cc-csc' },
  ]) assert.equal(isOtpFieldLike(input(over)), false, JSON.stringify(over));
});

test('the class name and placeholder are not used, and only text-like boxes count', () => {
  assert.equal(isOtpFieldLike({ ...input({ name: 'q' }), className: 'otp-style', placeholder: 'otp' }), false);
  assert.equal(isOtpFieldLike(input({ type: 'password', name: 'otp' })), false);
  assert.equal(isOtpFieldLike(input({ type: 'checkbox', name: 'otp' })), false);
  assert.equal(isOtpFieldLike({ tagName: 'DIV', name: 'otp' }), false);
});

test('a new-password box is recognised', () => {
  assert.equal(isNewPasswordField(input({ type: 'password', autocomplete: 'new-password' })), true);
  assert.equal(isNewPasswordField(input({ type: 'password', autocomplete: 'current-password' })), false);
  assert.equal(isNewPasswordField(input({ type: 'password' })), false);
});

test('each box is filled once, even if the site clears it', () => {
  const guard = createFillGuard();
  const box = {};
  assert.equal(guard.canFill(box), true);
  guard.markFilled(box);
  assert.equal(guard.canFill(box), false);
  assert.equal(guard.canFill({}), true, 'another box is a different box');
});

test('a session submits at most once, and a new pick starts a new session', () => {
  const guard = createFillGuard();
  assert.equal(guard.canSubmit(), true);
  guard.markSubmitted();
  assert.equal(guard.canSubmit(), false);
  const box = {};
  guard.markFilled(box);
  guard.reset();
  assert.equal(guard.canSubmit(), true);
  assert.equal(guard.canFill(box), true);
});

test('a session restored after a page load remembers that it already submitted', () => {
  const guard = createFillGuard({ submitted: true });
  assert.equal(guard.canSubmit(), false);
  assert.equal(guard.submitted, true);
});

// OKey rewrites the page's autocomplete on boxes it badges and keeps the original in data-okey-autocomplete.
const badged = (original, now) => input({ type: 'password', autocomplete: now, dataset: { okeyAutocomplete: original } });

test('a box OKey has rewritten is judged by what the page originally said', () => {
  assert.equal(isNewPasswordField(badged('current-password', 'new-password')), false);
  assert.equal(isNewPasswordField(badged('', 'new-password')), false);
  assert.equal(isNewPasswordField(badged('new-password', 'new-password')), true);
});

test('a box OKey has not touched is judged by its own autocomplete', () => {
  assert.equal(isNewPasswordField(input({ type: 'password', autocomplete: 'new-password', dataset: {} })), true);
});

test('a one-time-code box is found by its original autocomplete too', () => {
  assert.equal(isOtpFieldLike(input({ autocomplete: 'off', dataset: { okeyAutocomplete: 'one-time-code' } })), true);
});
