/**
 * Which boxes OKey fills when the user picks a login.
 *
 * Only boxes that are really on screen (`is.fillable`), and only inside the
 * clicked box's own form or container (`scope`), never the whole page. Otherwise
 * a page can show a normal email box and keep a hidden password box beside it,
 * and receive the password without the user ever seeing a field for it.
 *
 * @param {Element} anchorEl the box the user clicked
 * @param {{querySelectorAll: Function}|null} scope its form, or its closest container
 * @param {{username:Function,password:Function,totp:Function,fillable:Function}} is
 * @returns {{user: Element|null, password: Element|null, totp: Element|null}}
 */
export function findFillTargets(anchorEl, scope, is) {
  const inputs = scope ? [...scope.querySelectorAll('input')].filter(is.fillable) : [];
  const pick = (test) => (test(anchorEl) && is.fillable(anchorEl) ? anchorEl : inputs.find(test) || null);
  return {
    user: pick(is.username),
    password: pick(is.password),
    totp: inputs.find(is.totp) || null,
  };
}
