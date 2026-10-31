/**
 * What kind of box is this? Pure checks on the box's own attributes.
 *
 * A one-time-code box is matched on whole words in its name, id and
 * autocomplete only. "security code" is left out on purpose: it is the card CVV box. Matching letters anywhere (and the class name) made
 * "shipping", "pincode", "postcode", "promo_code" and "author" look like code
 * boxes, so a login code could land in a checkout form.
 */

const OTP_WORD = /(?<![a-z0-9])(totp|2fa|otp|mfa|authenticator)(?![a-z0-9])/;
const OTP_PHRASE = /(?<![a-z0-9])(verification|auth|one[-_ ]?time|login)[-_ ]?(code|token)(?![a-z0-9])/;

/**
 * What the page itself said in `autocomplete`. OKey rewrites that attribute on
 * boxes it badges (to keep the browser's own popup away) and keeps the original
 * in data-okey-autocomplete. Always read the original.
 */
export function pageAutocomplete(el) {
  return el.dataset?.okeyAutocomplete ?? el.autocomplete ?? '';
}

export function isOtpFieldLike(el) {
  if (el.tagName !== 'INPUT') return false;
  if (!['text', 'number', 'tel'].includes(el.type)) return false;
  if (pageAutocomplete(el) === 'one-time-code') return true;
  const hay = `${el.name || ''} ${el.id || ''}`.toLowerCase();
  return OTP_WORD.test(hay) || OTP_PHRASE.test(hay);
}

/** "Choose a new password" boxes must not be filled with the saved one. */
export function isNewPasswordField(el) {
  return pageAutocomplete(el) === 'new-password';
}
