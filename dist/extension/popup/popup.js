var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@kurkle/color/dist/color.esm.js
function round(v) {
  return v + 0.5 | 0;
}
function p2b(v) {
  return lim(round(v * 2.55), 0, 255);
}
function n2b(v) {
  return lim(round(v * 255), 0, 255);
}
function b2n(v) {
  return lim(round(v / 2.55) / 100, 0, 1);
}
function n2p(v) {
  return lim(round(v * 100), 0, 100);
}
function hexParse(str) {
  var len = str.length;
  var ret;
  if (str[0] === "#") {
    if (len === 4 || len === 5) {
      ret = {
        r: 255 & map$1[str[1]] * 17,
        g: 255 & map$1[str[2]] * 17,
        b: 255 & map$1[str[3]] * 17,
        a: len === 5 ? map$1[str[4]] * 17 : 255
      };
    } else if (len === 7 || len === 9) {
      ret = {
        r: map$1[str[1]] << 4 | map$1[str[2]],
        g: map$1[str[3]] << 4 | map$1[str[4]],
        b: map$1[str[5]] << 4 | map$1[str[6]],
        a: len === 9 ? map$1[str[7]] << 4 | map$1[str[8]] : 255
      };
    }
  }
  return ret;
}
function hexString(v) {
  var f = isShort(v) ? h1 : h2;
  return v ? "#" + f(v.r) + f(v.g) + f(v.b) + alpha2(v.a, f) : void 0;
}
function hsl2rgbn(h3, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n, k = (n + h3 / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
}
function hsv2rgbn(h3, s, v) {
  const f = (n, k = (n + h3 / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)];
}
function hwb2rgbn(h3, w, b) {
  const rgb = hsl2rgbn(h3, 1, 0.5);
  let i;
  if (w + b > 1) {
    i = 1 / (w + b);
    w *= i;
    b *= i;
  }
  for (i = 0; i < 3; i++) {
    rgb[i] *= 1 - w - b;
    rgb[i] += w;
  }
  return rgb;
}
function hueValue(r, g, b, d, max) {
  if (r === max) {
    return (g - b) / d + (g < b ? 6 : 0);
  }
  if (g === max) {
    return (b - r) / d + 2;
  }
  return (r - g) / d + 4;
}
function rgb2hsl(v) {
  const range = 255;
  const r = v.r / range;
  const g = v.g / range;
  const b = v.b / range;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h3, s, d;
  if (max !== min) {
    d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h3 = hueValue(r, g, b, d, max);
    h3 = h3 * 60 + 0.5;
  }
  return [h3 | 0, s || 0, l];
}
function calln(f, a, b, c) {
  return (Array.isArray(a) ? f(a[0], a[1], a[2]) : f(a, b, c)).map(n2b);
}
function hsl2rgb(h3, s, l) {
  return calln(hsl2rgbn, h3, s, l);
}
function hwb2rgb(h3, w, b) {
  return calln(hwb2rgbn, h3, w, b);
}
function hsv2rgb(h3, s, v) {
  return calln(hsv2rgbn, h3, s, v);
}
function hue(h3) {
  return (h3 % 360 + 360) % 360;
}
function hueParse(str) {
  const m = HUE_RE.exec(str);
  let a = 255;
  let v;
  if (!m) {
    return;
  }
  if (m[5] !== v) {
    a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
  }
  const h3 = hue(+m[2]);
  const p1 = +m[3] / 100;
  const p2 = +m[4] / 100;
  if (m[1] === "hwb") {
    v = hwb2rgb(h3, p1, p2);
  } else if (m[1] === "hsv") {
    v = hsv2rgb(h3, p1, p2);
  } else {
    v = hsl2rgb(h3, p1, p2);
  }
  return {
    r: v[0],
    g: v[1],
    b: v[2],
    a
  };
}
function rotate(v, deg) {
  var h3 = rgb2hsl(v);
  h3[0] = hue(h3[0] + deg);
  h3 = hsl2rgb(h3);
  v.r = h3[0];
  v.g = h3[1];
  v.b = h3[2];
}
function hslString(v) {
  if (!v) {
    return;
  }
  const a = rgb2hsl(v);
  const h3 = a[0];
  const s = n2p(a[1]);
  const l = n2p(a[2]);
  return v.a < 255 ? `hsla(${h3}, ${s}%, ${l}%, ${b2n(v.a)})` : `hsl(${h3}, ${s}%, ${l}%)`;
}
function unpack() {
  const unpacked = {};
  const keys = Object.keys(names$1);
  const tkeys = Object.keys(map);
  let i, j, k, ok, nk;
  for (i = 0; i < keys.length; i++) {
    ok = nk = keys[i];
    for (j = 0; j < tkeys.length; j++) {
      k = tkeys[j];
      nk = nk.replace(k, map[k]);
    }
    k = parseInt(names$1[ok], 16);
    unpacked[nk] = [k >> 16 & 255, k >> 8 & 255, k & 255];
  }
  return unpacked;
}
function nameParse(str) {
  if (!names) {
    names = unpack();
    names.transparent = [0, 0, 0, 0];
  }
  const a = names[str.toLowerCase()];
  return a && {
    r: a[0],
    g: a[1],
    b: a[2],
    a: a.length === 4 ? a[3] : 255
  };
}
function rgbParse(str) {
  const m = RGB_RE.exec(str);
  let a = 255;
  let r, g, b;
  if (!m) {
    return;
  }
  if (m[7] !== r) {
    const v = +m[7];
    a = m[8] ? p2b(v) : lim(v * 255, 0, 255);
  }
  r = +m[1];
  g = +m[3];
  b = +m[5];
  r = 255 & (m[2] ? p2b(r) : lim(r, 0, 255));
  g = 255 & (m[4] ? p2b(g) : lim(g, 0, 255));
  b = 255 & (m[6] ? p2b(b) : lim(b, 0, 255));
  return {
    r,
    g,
    b,
    a
  };
}
function rgbString(v) {
  return v && (v.a < 255 ? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})` : `rgb(${v.r}, ${v.g}, ${v.b})`);
}
function interpolate(rgb1, rgb2, t) {
  const r = from(b2n(rgb1.r));
  const g = from(b2n(rgb1.g));
  const b = from(b2n(rgb1.b));
  return {
    r: n2b(to(r + t * (from(b2n(rgb2.r)) - r))),
    g: n2b(to(g + t * (from(b2n(rgb2.g)) - g))),
    b: n2b(to(b + t * (from(b2n(rgb2.b)) - b))),
    a: rgb1.a + t * (rgb2.a - rgb1.a)
  };
}
function modHSL(v, i, ratio) {
  if (v) {
    let tmp = rgb2hsl(v);
    tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
    tmp = hsl2rgb(tmp);
    v.r = tmp[0];
    v.g = tmp[1];
    v.b = tmp[2];
  }
}
function clone(v, proto) {
  return v ? Object.assign(proto || {}, v) : v;
}
function fromObject(input) {
  var v = { r: 0, g: 0, b: 0, a: 255 };
  if (Array.isArray(input)) {
    if (input.length >= 3) {
      v = { r: input[0], g: input[1], b: input[2], a: 255 };
      if (input.length > 3) {
        v.a = n2b(input[3]);
      }
    }
  } else {
    v = clone(input, { r: 0, g: 0, b: 0, a: 1 });
    v.a = n2b(v.a);
  }
  return v;
}
function functionParse(str) {
  if (str.charAt(0) === "r") {
    return rgbParse(str);
  }
  return hueParse(str);
}
var lim, map$1, hex, h1, h2, eq, isShort, alpha2, HUE_RE, map, names$1, names, RGB_RE, to, from, Color;
var init_color_esm = __esm({
  "node_modules/@kurkle/color/dist/color.esm.js"() {
    lim = (v, l, h3) => Math.max(Math.min(v, h3), l);
    map$1 = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15 };
    hex = [..."0123456789ABCDEF"];
    h1 = (b) => hex[b & 15];
    h2 = (b) => hex[(b & 240) >> 4] + hex[b & 15];
    eq = (b) => (b & 240) >> 4 === (b & 15);
    isShort = (v) => eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
    alpha2 = (a, f) => a < 255 ? f(a) : "";
    HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
    map = {
      x: "dark",
      Z: "light",
      Y: "re",
      X: "blu",
      W: "gr",
      V: "medium",
      U: "slate",
      A: "ee",
      T: "ol",
      S: "or",
      B: "ra",
      C: "lateg",
      D: "ights",
      R: "in",
      Q: "turquois",
      E: "hi",
      P: "ro",
      O: "al",
      N: "le",
      M: "de",
      L: "yello",
      F: "en",
      K: "ch",
      G: "arks",
      H: "ea",
      I: "ightg",
      J: "wh"
    };
    names$1 = {
      OiceXe: "f0f8ff",
      antiquewEte: "faebd7",
      aqua: "ffff",
      aquamarRe: "7fffd4",
      azuY: "f0ffff",
      beige: "f5f5dc",
      bisque: "ffe4c4",
      black: "0",
      blanKedOmond: "ffebcd",
      Xe: "ff",
      XeviTet: "8a2be2",
      bPwn: "a52a2a",
      burlywood: "deb887",
      caMtXe: "5f9ea0",
      KartYuse: "7fff00",
      KocTate: "d2691e",
      cSO: "ff7f50",
      cSnflowerXe: "6495ed",
      cSnsilk: "fff8dc",
      crimson: "dc143c",
      cyan: "ffff",
      xXe: "8b",
      xcyan: "8b8b",
      xgTMnPd: "b8860b",
      xWay: "a9a9a9",
      xgYF: "6400",
      xgYy: "a9a9a9",
      xkhaki: "bdb76b",
      xmagFta: "8b008b",
      xTivegYF: "556b2f",
      xSange: "ff8c00",
      xScEd: "9932cc",
      xYd: "8b0000",
      xsOmon: "e9967a",
      xsHgYF: "8fbc8f",
      xUXe: "483d8b",
      xUWay: "2f4f4f",
      xUgYy: "2f4f4f",
      xQe: "ced1",
      xviTet: "9400d3",
      dAppRk: "ff1493",
      dApskyXe: "bfff",
      dimWay: "696969",
      dimgYy: "696969",
      dodgerXe: "1e90ff",
      fiYbrick: "b22222",
      flSOwEte: "fffaf0",
      foYstWAn: "228b22",
      fuKsia: "ff00ff",
      gaRsbSo: "dcdcdc",
      ghostwEte: "f8f8ff",
      gTd: "ffd700",
      gTMnPd: "daa520",
      Way: "808080",
      gYF: "8000",
      gYFLw: "adff2f",
      gYy: "808080",
      honeyMw: "f0fff0",
      hotpRk: "ff69b4",
      RdianYd: "cd5c5c",
      Rdigo: "4b0082",
      ivSy: "fffff0",
      khaki: "f0e68c",
      lavFMr: "e6e6fa",
      lavFMrXsh: "fff0f5",
      lawngYF: "7cfc00",
      NmoncEffon: "fffacd",
      ZXe: "add8e6",
      ZcSO: "f08080",
      Zcyan: "e0ffff",
      ZgTMnPdLw: "fafad2",
      ZWay: "d3d3d3",
      ZgYF: "90ee90",
      ZgYy: "d3d3d3",
      ZpRk: "ffb6c1",
      ZsOmon: "ffa07a",
      ZsHgYF: "20b2aa",
      ZskyXe: "87cefa",
      ZUWay: "778899",
      ZUgYy: "778899",
      ZstAlXe: "b0c4de",
      ZLw: "ffffe0",
      lime: "ff00",
      limegYF: "32cd32",
      lRF: "faf0e6",
      magFta: "ff00ff",
      maPon: "800000",
      VaquamarRe: "66cdaa",
      VXe: "cd",
      VScEd: "ba55d3",
      VpurpN: "9370db",
      VsHgYF: "3cb371",
      VUXe: "7b68ee",
      VsprRggYF: "fa9a",
      VQe: "48d1cc",
      VviTetYd: "c71585",
      midnightXe: "191970",
      mRtcYam: "f5fffa",
      mistyPse: "ffe4e1",
      moccasR: "ffe4b5",
      navajowEte: "ffdead",
      navy: "80",
      Tdlace: "fdf5e6",
      Tive: "808000",
      TivedBb: "6b8e23",
      Sange: "ffa500",
      SangeYd: "ff4500",
      ScEd: "da70d6",
      pOegTMnPd: "eee8aa",
      pOegYF: "98fb98",
      pOeQe: "afeeee",
      pOeviTetYd: "db7093",
      papayawEp: "ffefd5",
      pHKpuff: "ffdab9",
      peru: "cd853f",
      pRk: "ffc0cb",
      plum: "dda0dd",
      powMrXe: "b0e0e6",
      purpN: "800080",
      YbeccapurpN: "663399",
      Yd: "ff0000",
      Psybrown: "bc8f8f",
      PyOXe: "4169e1",
      saddNbPwn: "8b4513",
      sOmon: "fa8072",
      sandybPwn: "f4a460",
      sHgYF: "2e8b57",
      sHshell: "fff5ee",
      siFna: "a0522d",
      silver: "c0c0c0",
      skyXe: "87ceeb",
      UXe: "6a5acd",
      UWay: "708090",
      UgYy: "708090",
      snow: "fffafa",
      sprRggYF: "ff7f",
      stAlXe: "4682b4",
      tan: "d2b48c",
      teO: "8080",
      tEstN: "d8bfd8",
      tomato: "ff6347",
      Qe: "40e0d0",
      viTet: "ee82ee",
      JHt: "f5deb3",
      wEte: "ffffff",
      wEtesmoke: "f5f5f5",
      Lw: "ffff00",
      LwgYF: "9acd32"
    };
    RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
    to = (v) => v <= 31308e-7 ? v * 12.92 : Math.pow(v, 1 / 2.4) * 1.055 - 0.055;
    from = (v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    Color = class _Color {
      constructor(input) {
        if (input instanceof _Color) {
          return input;
        }
        const type = typeof input;
        let v;
        if (type === "object") {
          v = fromObject(input);
        } else if (type === "string") {
          v = hexParse(input) || nameParse(input) || functionParse(input);
        }
        this._rgb = v;
        this._valid = !!v;
      }
      get valid() {
        return this._valid;
      }
      get rgb() {
        var v = clone(this._rgb);
        if (v) {
          v.a = b2n(v.a);
        }
        return v;
      }
      set rgb(obj) {
        this._rgb = fromObject(obj);
      }
      rgbString() {
        return this._valid ? rgbString(this._rgb) : void 0;
      }
      hexString() {
        return this._valid ? hexString(this._rgb) : void 0;
      }
      hslString() {
        return this._valid ? hslString(this._rgb) : void 0;
      }
      mix(color2, weight) {
        if (color2) {
          const c1 = this.rgb;
          const c2 = color2.rgb;
          let w2;
          const p = weight === w2 ? 0.5 : weight;
          const w = 2 * p - 1;
          const a = c1.a - c2.a;
          const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2;
          w2 = 1 - w1;
          c1.r = 255 & w1 * c1.r + w2 * c2.r + 0.5;
          c1.g = 255 & w1 * c1.g + w2 * c2.g + 0.5;
          c1.b = 255 & w1 * c1.b + w2 * c2.b + 0.5;
          c1.a = p * c1.a + (1 - p) * c2.a;
          this.rgb = c1;
        }
        return this;
      }
      interpolate(color2, t) {
        if (color2) {
          this._rgb = interpolate(this._rgb, color2._rgb, t);
        }
        return this;
      }
      clone() {
        return new _Color(this.rgb);
      }
      alpha(a) {
        this._rgb.a = n2b(a);
        return this;
      }
      clearer(ratio) {
        const rgb = this._rgb;
        rgb.a *= 1 - ratio;
        return this;
      }
      greyscale() {
        const rgb = this._rgb;
        const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
        rgb.r = rgb.g = rgb.b = val;
        return this;
      }
      opaquer(ratio) {
        const rgb = this._rgb;
        rgb.a *= 1 + ratio;
        return this;
      }
      negate() {
        const v = this._rgb;
        v.r = 255 - v.r;
        v.g = 255 - v.g;
        v.b = 255 - v.b;
        return this;
      }
      lighten(ratio) {
        modHSL(this._rgb, 2, ratio);
        return this;
      }
      darken(ratio) {
        modHSL(this._rgb, 2, -ratio);
        return this;
      }
      saturate(ratio) {
        modHSL(this._rgb, 1, ratio);
        return this;
      }
      desaturate(ratio) {
        modHSL(this._rgb, 1, -ratio);
        return this;
      }
      rotate(deg) {
        rotate(this._rgb, deg);
        return this;
      }
    };
  }
});

// node_modules/chart.js/dist/chunks/helpers.dataset.js
function noop() {
}
function isNullOrUndef(value) {
  return value === null || value === void 0;
}
function isArray(value) {
  if (Array.isArray && Array.isArray(value)) {
    return true;
  }
  const type = Object.prototype.toString.call(value);
  if (type.slice(0, 7) === "[object" && type.slice(-6) === "Array]") {
    return true;
  }
  return false;
}
function isObject(value) {
  return value !== null && Object.prototype.toString.call(value) === "[object Object]";
}
function isNumberFinite(value) {
  return (typeof value === "number" || value instanceof Number) && isFinite(+value);
}
function finiteOrDefault(value, defaultValue) {
  return isNumberFinite(value) ? value : defaultValue;
}
function valueOrDefault(value, defaultValue) {
  return typeof value === "undefined" ? defaultValue : value;
}
function callback(fn, args, thisArg) {
  if (fn && typeof fn.call === "function") {
    return fn.apply(thisArg, args);
  }
}
function each(loopable, fn, thisArg, reverse) {
  let i, len, keys;
  if (isArray(loopable)) {
    len = loopable.length;
    if (reverse) {
      for (i = len - 1; i >= 0; i--) {
        fn.call(thisArg, loopable[i], i);
      }
    } else {
      for (i = 0; i < len; i++) {
        fn.call(thisArg, loopable[i], i);
      }
    }
  } else if (isObject(loopable)) {
    keys = Object.keys(loopable);
    len = keys.length;
    for (i = 0; i < len; i++) {
      fn.call(thisArg, loopable[keys[i]], keys[i]);
    }
  }
}
function _elementsEqual(a0, a1) {
  let i, ilen, v0, v1;
  if (!a0 || !a1 || a0.length !== a1.length) {
    return false;
  }
  for (i = 0, ilen = a0.length; i < ilen; ++i) {
    v0 = a0[i];
    v1 = a1[i];
    if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
      return false;
    }
  }
  return true;
}
function clone2(source) {
  if (isArray(source)) {
    return source.map(clone2);
  }
  if (isObject(source)) {
    const target = /* @__PURE__ */ Object.create(null);
    const keys = Object.keys(source);
    const klen = keys.length;
    let k = 0;
    for (; k < klen; ++k) {
      target[keys[k]] = clone2(source[keys[k]]);
    }
    return target;
  }
  return source;
}
function isValidKey(key) {
  return [
    "__proto__",
    "prototype",
    "constructor"
  ].indexOf(key) === -1;
}
function _merger(key, target, source, options) {
  if (!isValidKey(key)) {
    return;
  }
  const tval = target[key];
  const sval = source[key];
  if (isObject(tval) && isObject(sval)) {
    merge(tval, sval, options);
  } else {
    target[key] = clone2(sval);
  }
}
function merge(target, source, options) {
  const sources = isArray(source) ? source : [
    source
  ];
  const ilen = sources.length;
  if (!isObject(target)) {
    return target;
  }
  options = options || {};
  const merger = options.merger || _merger;
  let current;
  for (let i = 0; i < ilen; ++i) {
    current = sources[i];
    if (!isObject(current)) {
      continue;
    }
    const keys = Object.keys(current);
    for (let k = 0, klen = keys.length; k < klen; ++k) {
      merger(keys[k], target, current, options);
    }
  }
  return target;
}
function mergeIf(target, source) {
  return merge(target, source, {
    merger: _mergerIf
  });
}
function _mergerIf(key, target, source) {
  if (!isValidKey(key)) {
    return;
  }
  const tval = target[key];
  const sval = source[key];
  if (isObject(tval) && isObject(sval)) {
    mergeIf(tval, sval);
  } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
    target[key] = clone2(sval);
  }
}
function _splitKey(key) {
  const parts = key.split(".");
  const keys = [];
  let tmp = "";
  for (const part of parts) {
    tmp += part;
    if (tmp.endsWith("\\")) {
      tmp = tmp.slice(0, -1) + ".";
    } else {
      keys.push(tmp);
      tmp = "";
    }
  }
  return keys;
}
function _getKeyResolver(key) {
  const keys = _splitKey(key);
  return (obj) => {
    for (const k of keys) {
      if (k === "") {
        break;
      }
      obj = obj && obj[k];
    }
    return obj;
  };
}
function resolveObjectKey(obj, key) {
  const resolver = keyResolvers[key] || (keyResolvers[key] = _getKeyResolver(key));
  return resolver(obj);
}
function _capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function _isClickEvent(e) {
  return e.type === "mouseup" || e.type === "click" || e.type === "contextmenu";
}
function almostEquals(x, y, epsilon) {
  return Math.abs(x - y) < epsilon;
}
function niceNum(range) {
  const roundedRange = Math.round(range);
  range = almostEquals(range, roundedRange, range / 1e3) ? roundedRange : range;
  const niceRange = Math.pow(10, Math.floor(log10(range)));
  const fraction = range / niceRange;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * niceRange;
}
function _factorize(value) {
  const result = [];
  const sqrt = Math.sqrt(value);
  let i;
  for (i = 1; i < sqrt; i++) {
    if (value % i === 0) {
      result.push(i);
      result.push(value / i);
    }
  }
  if (sqrt === (sqrt | 0)) {
    result.push(sqrt);
  }
  result.sort((a, b) => a - b).pop();
  return result;
}
function isNonPrimitive(n) {
  return typeof n === "symbol" || typeof n === "object" && n !== null && !(Symbol.toPrimitive in n || "toString" in n || "valueOf" in n);
}
function isNumber(n) {
  return !isNonPrimitive(n) && !isNaN(parseFloat(n)) && isFinite(n);
}
function almostWhole(x, epsilon) {
  const rounded = Math.round(x);
  return rounded - epsilon <= x && rounded + epsilon >= x;
}
function _setMinAndMaxByKey(array, target, property) {
  let i, ilen, value;
  for (i = 0, ilen = array.length; i < ilen; i++) {
    value = array[i][property];
    if (!isNaN(value)) {
      target.min = Math.min(target.min, value);
      target.max = Math.max(target.max, value);
    }
  }
}
function toRadians(degrees) {
  return degrees * (PI / 180);
}
function toDegrees(radians) {
  return radians * (180 / PI);
}
function _decimalPlaces(x) {
  if (!isNumberFinite(x)) {
    return;
  }
  let e = 1;
  let p = 0;
  while (Math.round(x * e) / e !== x) {
    e *= 10;
    p++;
  }
  return p;
}
function getAngleFromPoint(centrePoint, anglePoint) {
  const distanceFromXCenter = anglePoint.x - centrePoint.x;
  const distanceFromYCenter = anglePoint.y - centrePoint.y;
  const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
  let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
  if (angle < -0.5 * PI) {
    angle += TAU;
  }
  return {
    angle,
    distance: radialDistanceFromCenter
  };
}
function distanceBetweenPoints(pt1, pt2) {
  return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}
function _angleDiff(a, b) {
  return (a - b + PITAU) % TAU - PI;
}
function _normalizeAngle(a) {
  return (a % TAU + TAU) % TAU;
}
function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
  const a = _normalizeAngle(angle);
  const s = _normalizeAngle(start);
  const e = _normalizeAngle(end);
  const angleToStart = _normalizeAngle(s - a);
  const angleToEnd = _normalizeAngle(e - a);
  const startToAngle = _normalizeAngle(a - s);
  const endToAngle = _normalizeAngle(a - e);
  return a === s || a === e || sameAngleIsFullCircle && s === e || angleToStart > angleToEnd && startToAngle < endToAngle;
}
function _limitValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function _int16Range(value) {
  return _limitValue(value, -32768, 32767);
}
function _isBetween(value, start, end, epsilon = 1e-6) {
  return value >= Math.min(start, end) - epsilon && value <= Math.max(start, end) + epsilon;
}
function _lookup(table, value, cmp) {
  cmp = cmp || ((index2) => table[index2] < value);
  let hi = table.length - 1;
  let lo = 0;
  let mid;
  while (hi - lo > 1) {
    mid = lo + hi >> 1;
    if (cmp(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return {
    lo,
    hi
  };
}
function _filterBetween(values, min, max) {
  let start = 0;
  let end = values.length;
  while (start < end && values[start] < min) {
    start++;
  }
  while (end > start && values[end - 1] > max) {
    end--;
  }
  return start > 0 || end < values.length ? values.slice(start, end) : values;
}
function listenArrayEvents(array, listener) {
  if (array._chartjs) {
    array._chartjs.listeners.push(listener);
    return;
  }
  Object.defineProperty(array, "_chartjs", {
    configurable: true,
    enumerable: false,
    value: {
      listeners: [
        listener
      ]
    }
  });
  arrayEvents.forEach((key) => {
    const method = "_onData" + _capitalize(key);
    const base = array[key];
    Object.defineProperty(array, key, {
      configurable: true,
      enumerable: false,
      value(...args) {
        const res = base.apply(this, args);
        array._chartjs.listeners.forEach((object) => {
          if (typeof object[method] === "function") {
            object[method](...args);
          }
        });
        return res;
      }
    });
  });
}
function unlistenArrayEvents(array, listener) {
  const stub = array._chartjs;
  if (!stub) {
    return;
  }
  const listeners = stub.listeners;
  const index2 = listeners.indexOf(listener);
  if (index2 !== -1) {
    listeners.splice(index2, 1);
  }
  if (listeners.length > 0) {
    return;
  }
  arrayEvents.forEach((key) => {
    delete array[key];
  });
  delete array._chartjs;
}
function _arrayUnique(items) {
  const set2 = new Set(items);
  if (set2.size === items.length) {
    return items;
  }
  return Array.from(set2);
}
function throttled(fn, thisArg) {
  let argsToUse = [];
  let ticking = false;
  return function(...args) {
    argsToUse = args;
    if (!ticking) {
      ticking = true;
      requestAnimFrame.call(window, () => {
        ticking = false;
        fn.apply(thisArg, argsToUse);
      });
    }
  };
}
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    if (delay) {
      clearTimeout(timeout);
      timeout = setTimeout(fn, delay, args);
    } else {
      fn.apply(this, args);
    }
    return delay;
  };
}
function _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
  const pointCount = points.length;
  let start = 0;
  let count = pointCount;
  if (meta._sorted) {
    const { iScale, vScale, _parsed } = meta;
    const spanGaps = meta.dataset ? meta.dataset.options ? meta.dataset.options.spanGaps : null : null;
    const axis = iScale.axis;
    const { min, max, minDefined, maxDefined } = iScale.getUserBounds();
    if (minDefined) {
      start = Math.min(
        // @ts-expect-error Need to type _parsed
        _lookupByKey(_parsed, axis, min).lo,
        // @ts-expect-error Need to fix types on _lookupByKey
        animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo
      );
      if (spanGaps) {
        const distanceToDefinedLo = _parsed.slice(0, start + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        start -= Math.max(0, distanceToDefinedLo);
      }
      start = _limitValue(start, 0, pointCount - 1);
    }
    if (maxDefined) {
      let end = Math.max(
        // @ts-expect-error Need to type _parsed
        _lookupByKey(_parsed, iScale.axis, max, true).hi + 1,
        // @ts-expect-error Need to fix types on _lookupByKey
        animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max), true).hi + 1
      );
      if (spanGaps) {
        const distanceToDefinedHi = _parsed.slice(end - 1).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        end += Math.max(0, distanceToDefinedHi);
      }
      count = _limitValue(end, start, pointCount) - start;
    } else {
      count = pointCount - start;
    }
  }
  return {
    start,
    count
  };
}
function _scaleRangesChanged(meta) {
  const { xScale, yScale, _scaleRanges } = meta;
  const newRanges = {
    xmin: xScale.min,
    xmax: xScale.max,
    ymin: yScale.min,
    ymax: yScale.max
  };
  if (!_scaleRanges) {
    meta._scaleRanges = newRanges;
    return true;
  }
  const changed = _scaleRanges.xmin !== xScale.min || _scaleRanges.xmax !== xScale.max || _scaleRanges.ymin !== yScale.min || _scaleRanges.ymax !== yScale.max;
  Object.assign(_scaleRanges, newRanges);
  return changed;
}
function isPatternOrGradient(value) {
  if (value && typeof value === "object") {
    const type = value.toString();
    return type === "[object CanvasPattern]" || type === "[object CanvasGradient]";
  }
  return false;
}
function color(value) {
  return isPatternOrGradient(value) ? value : new Color(value);
}
function getHoverColor(value) {
  return isPatternOrGradient(value) ? value : new Color(value).saturate(0.5).darken(0.1).hexString();
}
function applyAnimationsDefaults(defaults2) {
  defaults2.set("animation", {
    delay: void 0,
    duration: 1e3,
    easing: "easeOutQuart",
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0
  });
  defaults2.describe("animation", {
    _fallback: false,
    _indexable: false,
    _scriptable: (name) => name !== "onProgress" && name !== "onComplete" && name !== "fn"
  });
  defaults2.set("animations", {
    colors: {
      type: "color",
      properties: colors
    },
    numbers: {
      type: "number",
      properties: numbers
    }
  });
  defaults2.describe("animations", {
    _fallback: "animation"
  });
  defaults2.set("transitions", {
    active: {
      animation: {
        duration: 400
      }
    },
    resize: {
      animation: {
        duration: 0
      }
    },
    show: {
      animations: {
        colors: {
          from: "transparent"
        },
        visible: {
          type: "boolean",
          duration: 0
        }
      }
    },
    hide: {
      animations: {
        colors: {
          to: "transparent"
        },
        visible: {
          type: "boolean",
          easing: "linear",
          fn: (v) => v | 0
        }
      }
    }
  });
}
function applyLayoutsDefaults(defaults2) {
  defaults2.set("layout", {
    autoPadding: true,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
}
function getNumberFormat(locale, options) {
  options = options || {};
  const cacheKey = locale + JSON.stringify(options);
  let formatter = intlCache.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    intlCache.set(cacheKey, formatter);
  }
  return formatter;
}
function formatNumber(num, locale, options) {
  return getNumberFormat(locale, options).format(num);
}
function calculateDelta(tickValue, ticks) {
  let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
  if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
    delta = tickValue - Math.floor(tickValue);
  }
  return delta;
}
function applyScaleDefaults(defaults2) {
  defaults2.set("scale", {
    display: true,
    offset: false,
    reverse: false,
    beginAtZero: false,
    bounds: "ticks",
    clip: true,
    grace: 0,
    grid: {
      display: true,
      lineWidth: 1,
      drawOnChartArea: true,
      drawTicks: true,
      tickLength: 8,
      tickWidth: (_ctx, options) => options.lineWidth,
      tickColor: (_ctx, options) => options.color,
      offset: false
    },
    border: {
      display: true,
      dash: [],
      dashOffset: 0,
      width: 1
    },
    title: {
      display: false,
      text: "",
      padding: {
        top: 4,
        bottom: 4
      }
    },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: false,
      textStrokeWidth: 0,
      textStrokeColor: "",
      padding: 3,
      display: true,
      autoSkip: true,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: Ticks.formatters.values,
      minor: {},
      major: {},
      align: "center",
      crossAlign: "near",
      showLabelBackdrop: false,
      backdropColor: "rgba(255, 255, 255, 0.75)",
      backdropPadding: 2
    }
  });
  defaults2.route("scale.ticks", "color", "", "color");
  defaults2.route("scale.grid", "color", "", "borderColor");
  defaults2.route("scale.border", "color", "", "borderColor");
  defaults2.route("scale.title", "color", "", "color");
  defaults2.describe("scale", {
    _fallback: false,
    _scriptable: (name) => !name.startsWith("before") && !name.startsWith("after") && name !== "callback" && name !== "parser",
    _indexable: (name) => name !== "borderDash" && name !== "tickBorderDash" && name !== "dash"
  });
  defaults2.describe("scales", {
    _fallback: "scale"
  });
  defaults2.describe("scale.ticks", {
    _scriptable: (name) => name !== "backdropPadding" && name !== "callback",
    _indexable: (name) => name !== "backdropPadding"
  });
}
function getScope$1(node, key) {
  if (!key) {
    return node;
  }
  const keys = key.split(".");
  for (let i = 0, n = keys.length; i < n; ++i) {
    const k = keys[i];
    node = node[k] || (node[k] = /* @__PURE__ */ Object.create(null));
  }
  return node;
}
function set(root, scope, values) {
  if (typeof scope === "string") {
    return merge(getScope$1(root, scope), values);
  }
  return merge(getScope$1(root, ""), scope);
}
function toFontString(font) {
  if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
    return null;
  }
  return (font.style ? font.style + " " : "") + (font.weight ? font.weight + " " : "") + font.size + "px " + font.family;
}
function _measureText(ctx, data, gc, longest, string) {
  let textWidth = data[string];
  if (!textWidth) {
    textWidth = data[string] = ctx.measureText(string).width;
    gc.push(string);
  }
  if (textWidth > longest) {
    longest = textWidth;
  }
  return longest;
}
function _longestText(ctx, font, arrayOfThings, cache) {
  cache = cache || {};
  let data = cache.data = cache.data || {};
  let gc = cache.garbageCollect = cache.garbageCollect || [];
  if (cache.font !== font) {
    data = cache.data = {};
    gc = cache.garbageCollect = [];
    cache.font = font;
  }
  ctx.save();
  ctx.font = font;
  let longest = 0;
  const ilen = arrayOfThings.length;
  let i, j, jlen, thing, nestedThing;
  for (i = 0; i < ilen; i++) {
    thing = arrayOfThings[i];
    if (thing !== void 0 && thing !== null && !isArray(thing)) {
      longest = _measureText(ctx, data, gc, longest, thing);
    } else if (isArray(thing)) {
      for (j = 0, jlen = thing.length; j < jlen; j++) {
        nestedThing = thing[j];
        if (nestedThing !== void 0 && nestedThing !== null && !isArray(nestedThing)) {
          longest = _measureText(ctx, data, gc, longest, nestedThing);
        }
      }
    }
  }
  ctx.restore();
  const gcLen = gc.length / 2;
  if (gcLen > arrayOfThings.length) {
    for (i = 0; i < gcLen; i++) {
      delete data[gc[i]];
    }
    gc.splice(0, gcLen);
  }
  return longest;
}
function _alignPixel(chart, pixel, width) {
  const devicePixelRatio = chart.currentDevicePixelRatio;
  const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
  return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
}
function clearCanvas(canvas, ctx) {
  if (!ctx && !canvas) {
    return;
  }
  ctx = ctx || canvas.getContext("2d");
  ctx.save();
  ctx.resetTransform();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
function drawPoint(ctx, options, x, y) {
  drawPointLegend(ctx, options, x, y, null);
}
function drawPointLegend(ctx, options, x, y, w) {
  let type, xOffset, yOffset, size, cornerRadius, width, xOffsetW, yOffsetW;
  const style = options.pointStyle;
  const rotation = options.rotation;
  const radius = options.radius;
  let rad = (rotation || 0) * RAD_PER_DEG;
  if (style && typeof style === "object") {
    type = style.toString();
    if (type === "[object HTMLImageElement]" || type === "[object HTMLCanvasElement]") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rad);
      ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
      ctx.restore();
      return;
    }
  }
  if (isNaN(radius) || radius <= 0) {
    return;
  }
  ctx.beginPath();
  switch (style) {
    // Default includes circle
    default:
      if (w) {
        ctx.ellipse(x, y, w / 2, radius, 0, 0, TAU);
      } else {
        ctx.arc(x, y, radius, 0, TAU);
      }
      ctx.closePath();
      break;
    case "triangle":
      width = w ? w / 2 : radius;
      ctx.moveTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      rad += TWO_THIRDS_PI;
      ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      rad += TWO_THIRDS_PI;
      ctx.lineTo(x + Math.sin(rad) * width, y - Math.cos(rad) * radius);
      ctx.closePath();
      break;
    case "rectRounded":
      cornerRadius = radius * 0.516;
      size = radius - cornerRadius;
      xOffset = Math.cos(rad + QUARTER_PI) * size;
      xOffsetW = Math.cos(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
      yOffset = Math.sin(rad + QUARTER_PI) * size;
      yOffsetW = Math.sin(rad + QUARTER_PI) * (w ? w / 2 - cornerRadius : size);
      ctx.arc(x - xOffsetW, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
      ctx.arc(x + yOffsetW, y - xOffset, cornerRadius, rad - HALF_PI, rad);
      ctx.arc(x + xOffsetW, y + yOffset, cornerRadius, rad, rad + HALF_PI);
      ctx.arc(x - yOffsetW, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
      ctx.closePath();
      break;
    case "rect":
      if (!rotation) {
        size = Math.SQRT1_2 * radius;
        width = w ? w / 2 : size;
        ctx.rect(x - width, y - size, 2 * width, 2 * size);
        break;
      }
      rad += QUARTER_PI;
    /* falls through */
    case "rectRot":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      ctx.closePath();
      break;
    case "crossRot":
      rad += QUARTER_PI;
    /* falls through */
    case "cross":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      break;
    case "star":
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      rad += QUARTER_PI;
      xOffsetW = Math.cos(rad) * (w ? w / 2 : radius);
      xOffset = Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      yOffsetW = Math.sin(rad) * (w ? w / 2 : radius);
      ctx.moveTo(x - xOffsetW, y - yOffset);
      ctx.lineTo(x + xOffsetW, y + yOffset);
      ctx.moveTo(x + yOffsetW, y - xOffset);
      ctx.lineTo(x - yOffsetW, y + xOffset);
      break;
    case "line":
      xOffset = w ? w / 2 : Math.cos(rad) * radius;
      yOffset = Math.sin(rad) * radius;
      ctx.moveTo(x - xOffset, y - yOffset);
      ctx.lineTo(x + xOffset, y + yOffset);
      break;
    case "dash":
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(rad) * (w ? w / 2 : radius), y + Math.sin(rad) * radius);
      break;
    case false:
      ctx.closePath();
      break;
  }
  ctx.fill();
  if (options.borderWidth > 0) {
    ctx.stroke();
  }
}
function _isPointInArea(point, area, margin) {
  margin = margin || 0.5;
  return !area || point && point.x > area.left - margin && point.x < area.right + margin && point.y > area.top - margin && point.y < area.bottom + margin;
}
function clipArea(ctx, area) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
  ctx.clip();
}
function unclipArea(ctx) {
  ctx.restore();
}
function _steppedLineTo(ctx, previous, target, flip, mode) {
  if (!previous) {
    return ctx.lineTo(target.x, target.y);
  }
  if (mode === "middle") {
    const midpoint = (previous.x + target.x) / 2;
    ctx.lineTo(midpoint, previous.y);
    ctx.lineTo(midpoint, target.y);
  } else if (mode === "after" !== !!flip) {
    ctx.lineTo(previous.x, target.y);
  } else {
    ctx.lineTo(target.x, previous.y);
  }
  ctx.lineTo(target.x, target.y);
}
function _bezierCurveTo(ctx, previous, target, flip) {
  if (!previous) {
    return ctx.lineTo(target.x, target.y);
  }
  ctx.bezierCurveTo(flip ? previous.cp1x : previous.cp2x, flip ? previous.cp1y : previous.cp2y, flip ? target.cp2x : target.cp1x, flip ? target.cp2y : target.cp1y, target.x, target.y);
}
function setRenderOpts(ctx, opts) {
  if (opts.translation) {
    ctx.translate(opts.translation[0], opts.translation[1]);
  }
  if (!isNullOrUndef(opts.rotation)) {
    ctx.rotate(opts.rotation);
  }
  if (opts.color) {
    ctx.fillStyle = opts.color;
  }
  if (opts.textAlign) {
    ctx.textAlign = opts.textAlign;
  }
  if (opts.textBaseline) {
    ctx.textBaseline = opts.textBaseline;
  }
}
function decorateText(ctx, x, y, line, opts) {
  if (opts.strikethrough || opts.underline) {
    const metrics = ctx.measureText(line);
    const left = x - metrics.actualBoundingBoxLeft;
    const right = x + metrics.actualBoundingBoxRight;
    const top = y - metrics.actualBoundingBoxAscent;
    const bottom = y + metrics.actualBoundingBoxDescent;
    const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.lineWidth = opts.decorationWidth || 2;
    ctx.moveTo(left, yDecoration);
    ctx.lineTo(right, yDecoration);
    ctx.stroke();
  }
}
function drawBackdrop(ctx, opts) {
  const oldColor = ctx.fillStyle;
  ctx.fillStyle = opts.color;
  ctx.fillRect(opts.left, opts.top, opts.width, opts.height);
  ctx.fillStyle = oldColor;
}
function renderText(ctx, text, x, y, font, opts = {}) {
  const lines = isArray(text) ? text : [
    text
  ];
  const stroke = opts.strokeWidth > 0 && opts.strokeColor !== "";
  let i, line;
  ctx.save();
  ctx.font = font.string;
  setRenderOpts(ctx, opts);
  for (i = 0; i < lines.length; ++i) {
    line = lines[i];
    if (opts.backdrop) {
      drawBackdrop(ctx, opts.backdrop);
    }
    if (stroke) {
      if (opts.strokeColor) {
        ctx.strokeStyle = opts.strokeColor;
      }
      if (!isNullOrUndef(opts.strokeWidth)) {
        ctx.lineWidth = opts.strokeWidth;
      }
      ctx.strokeText(line, x, y, opts.maxWidth);
    }
    ctx.fillText(line, x, y, opts.maxWidth);
    decorateText(ctx, x, y, line, opts);
    y += Number(font.lineHeight);
  }
  ctx.restore();
}
function addRoundedRectPath(ctx, rect) {
  const { x, y, w, h: h3, radius } = rect;
  ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, 1.5 * PI, PI, true);
  ctx.lineTo(x, y + h3 - radius.bottomLeft);
  ctx.arc(x + radius.bottomLeft, y + h3 - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
  ctx.lineTo(x + w - radius.bottomRight, y + h3);
  ctx.arc(x + w - radius.bottomRight, y + h3 - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
  ctx.lineTo(x + w, y + radius.topRight);
  ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
  ctx.lineTo(x + radius.topLeft, y);
}
function toLineHeight(value, size) {
  const matches = ("" + value).match(LINE_HEIGHT);
  if (!matches || matches[1] === "normal") {
    return size * 1.2;
  }
  value = +matches[2];
  switch (matches[3]) {
    case "px":
      return value;
    case "%":
      value /= 100;
      break;
  }
  return size * value;
}
function _readValueToProps(value, props) {
  const ret = {};
  const objProps = isObject(props);
  const keys = objProps ? Object.keys(props) : props;
  const read = isObject(value) ? objProps ? (prop) => valueOrDefault(value[prop], value[props[prop]]) : (prop) => value[prop] : () => value;
  for (const prop of keys) {
    ret[prop] = numberOrZero(read(prop));
  }
  return ret;
}
function toTRBL(value) {
  return _readValueToProps(value, {
    top: "y",
    right: "x",
    bottom: "y",
    left: "x"
  });
}
function toTRBLCorners(value) {
  return _readValueToProps(value, [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight"
  ]);
}
function toPadding(value) {
  const obj = toTRBL(value);
  obj.width = obj.left + obj.right;
  obj.height = obj.top + obj.bottom;
  return obj;
}
function toFont(options, fallback) {
  options = options || {};
  fallback = fallback || defaults.font;
  let size = valueOrDefault(options.size, fallback.size);
  if (typeof size === "string") {
    size = parseInt(size, 10);
  }
  let style = valueOrDefault(options.style, fallback.style);
  if (style && !("" + style).match(FONT_STYLE)) {
    console.warn('Invalid font style specified: "' + style + '"');
    style = void 0;
  }
  const font = {
    family: valueOrDefault(options.family, fallback.family),
    lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
    size,
    style,
    weight: valueOrDefault(options.weight, fallback.weight),
    string: ""
  };
  font.string = toFontString(font);
  return font;
}
function resolve(inputs, context, index2, info) {
  let cacheable = true;
  let i, ilen, value;
  for (i = 0, ilen = inputs.length; i < ilen; ++i) {
    value = inputs[i];
    if (value === void 0) {
      continue;
    }
    if (context !== void 0 && typeof value === "function") {
      value = value(context);
      cacheable = false;
    }
    if (index2 !== void 0 && isArray(value)) {
      value = value[index2 % value.length];
      cacheable = false;
    }
    if (value !== void 0) {
      if (info && !cacheable) {
        info.cacheable = false;
      }
      return value;
    }
  }
}
function _addGrace(minmax, grace, beginAtZero) {
  const { min, max } = minmax;
  const change = toDimension(grace, (max - min) / 2);
  const keepZero = (value, add) => beginAtZero && value === 0 ? 0 : value + add;
  return {
    min: keepZero(min, -Math.abs(change)),
    max: keepZero(max, change)
  };
}
function createContext(parentContext, context) {
  return Object.assign(Object.create(parentContext), context);
}
function _createResolver(scopes, prefixes = [
  ""
], rootScopes, fallback, getTarget = () => scopes[0]) {
  const finalRootScopes = rootScopes || scopes;
  if (typeof fallback === "undefined") {
    fallback = _resolve("_fallback", scopes);
  }
  const cache = {
    [Symbol.toStringTag]: "Object",
    _cacheable: true,
    _scopes: scopes,
    _rootScopes: finalRootScopes,
    _fallback: fallback,
    _getTarget: getTarget,
    override: (scope) => _createResolver([
      scope,
      ...scopes
    ], prefixes, finalRootScopes, fallback)
  };
  return new Proxy(cache, {
    /**
    * A trap for the delete operator.
    */
    deleteProperty(target, prop) {
      delete target[prop];
      delete target._keys;
      delete scopes[0][prop];
      return true;
    },
    /**
    * A trap for getting property values.
    */
    get(target, prop) {
      return _cached(target, prop, () => _resolveWithPrefixes(prop, prefixes, scopes, target));
    },
    /**
    * A trap for Object.getOwnPropertyDescriptor.
    * Also used by Object.hasOwnProperty.
    */
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
    },
    /**
    * A trap for Object.getPrototypeOf.
    */
    getPrototypeOf() {
      return Reflect.getPrototypeOf(scopes[0]);
    },
    /**
    * A trap for the in operator.
    */
    has(target, prop) {
      return getKeysFromAllScopes(target).includes(prop);
    },
    /**
    * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
    */
    ownKeys(target) {
      return getKeysFromAllScopes(target);
    },
    /**
    * A trap for setting property values.
    */
    set(target, prop, value) {
      const storage = target._storage || (target._storage = getTarget());
      target[prop] = storage[prop] = value;
      delete target._keys;
      return true;
    }
  });
}
function _attachContext(proxy, context, subProxy, descriptorDefaults) {
  const cache = {
    _cacheable: false,
    _proxy: proxy,
    _context: context,
    _subProxy: subProxy,
    _stack: /* @__PURE__ */ new Set(),
    _descriptors: _descriptors(proxy, descriptorDefaults),
    setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
    override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
  };
  return new Proxy(cache, {
    /**
    * A trap for the delete operator.
    */
    deleteProperty(target, prop) {
      delete target[prop];
      delete proxy[prop];
      return true;
    },
    /**
    * A trap for getting property values.
    */
    get(target, prop, receiver) {
      return _cached(target, prop, () => _resolveWithContext(target, prop, receiver));
    },
    /**
    * A trap for Object.getOwnPropertyDescriptor.
    * Also used by Object.hasOwnProperty.
    */
    getOwnPropertyDescriptor(target, prop) {
      return target._descriptors.allKeys ? Reflect.has(proxy, prop) ? {
        enumerable: true,
        configurable: true
      } : void 0 : Reflect.getOwnPropertyDescriptor(proxy, prop);
    },
    /**
    * A trap for Object.getPrototypeOf.
    */
    getPrototypeOf() {
      return Reflect.getPrototypeOf(proxy);
    },
    /**
    * A trap for the in operator.
    */
    has(target, prop) {
      return Reflect.has(proxy, prop);
    },
    /**
    * A trap for Object.getOwnPropertyNames and Object.getOwnPropertySymbols.
    */
    ownKeys() {
      return Reflect.ownKeys(proxy);
    },
    /**
    * A trap for setting property values.
    */
    set(target, prop, value) {
      proxy[prop] = value;
      delete target[prop];
      return true;
    }
  });
}
function _descriptors(proxy, defaults2 = {
  scriptable: true,
  indexable: true
}) {
  const { _scriptable = defaults2.scriptable, _indexable = defaults2.indexable, _allKeys = defaults2.allKeys } = proxy;
  return {
    allKeys: _allKeys,
    scriptable: _scriptable,
    indexable: _indexable,
    isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
    isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
  };
}
function _cached(target, prop, resolve2) {
  if (Object.prototype.hasOwnProperty.call(target, prop) || prop === "constructor") {
    return target[prop];
  }
  const value = resolve2();
  target[prop] = value;
  return value;
}
function _resolveWithContext(target, prop, receiver) {
  const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
  let value = _proxy[prop];
  if (isFunction(value) && descriptors2.isScriptable(prop)) {
    value = _resolveScriptable(prop, value, target, receiver);
  }
  if (isArray(value) && value.length) {
    value = _resolveArray(prop, value, target, descriptors2.isIndexable);
  }
  if (needsSubResolver(prop, value)) {
    value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors2);
  }
  return value;
}
function _resolveScriptable(prop, getValue, target, receiver) {
  const { _proxy, _context, _subProxy, _stack } = target;
  if (_stack.has(prop)) {
    throw new Error("Recursion detected: " + Array.from(_stack).join("->") + "->" + prop);
  }
  _stack.add(prop);
  let value = getValue(_context, _subProxy || receiver);
  _stack.delete(prop);
  if (needsSubResolver(prop, value)) {
    value = createSubResolver(_proxy._scopes, _proxy, prop, value);
  }
  return value;
}
function _resolveArray(prop, value, target, isIndexable) {
  const { _proxy, _context, _subProxy, _descriptors: descriptors2 } = target;
  if (typeof _context.index !== "undefined" && isIndexable(prop)) {
    return value[_context.index % value.length];
  } else if (isObject(value[0])) {
    const arr = value;
    const scopes = _proxy._scopes.filter((s) => s !== arr);
    value = [];
    for (const item of arr) {
      const resolver = createSubResolver(scopes, _proxy, prop, item);
      value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors2));
    }
  }
  return value;
}
function resolveFallback(fallback, prop, value) {
  return isFunction(fallback) ? fallback(prop, value) : fallback;
}
function addScopes(set2, parentScopes, key, parentFallback, value) {
  for (const parent of parentScopes) {
    const scope = getScope(key, parent);
    if (scope) {
      set2.add(scope);
      const fallback = resolveFallback(scope._fallback, key, value);
      if (typeof fallback !== "undefined" && fallback !== key && fallback !== parentFallback) {
        return fallback;
      }
    } else if (scope === false && typeof parentFallback !== "undefined" && key !== parentFallback) {
      return null;
    }
  }
  return false;
}
function createSubResolver(parentScopes, resolver, prop, value) {
  const rootScopes = resolver._rootScopes;
  const fallback = resolveFallback(resolver._fallback, prop, value);
  const allScopes = [
    ...parentScopes,
    ...rootScopes
  ];
  const set2 = /* @__PURE__ */ new Set();
  set2.add(value);
  let key = addScopesFromKey(set2, allScopes, prop, fallback || prop, value);
  if (key === null) {
    return false;
  }
  if (typeof fallback !== "undefined" && fallback !== prop) {
    key = addScopesFromKey(set2, allScopes, fallback, key, value);
    if (key === null) {
      return false;
    }
  }
  return _createResolver(Array.from(set2), [
    ""
  ], rootScopes, fallback, () => subGetTarget(resolver, prop, value));
}
function addScopesFromKey(set2, allScopes, key, fallback, item) {
  while (key) {
    key = addScopes(set2, allScopes, key, fallback, item);
  }
  return key;
}
function subGetTarget(resolver, prop, value) {
  const parent = resolver._getTarget();
  if (!(prop in parent)) {
    parent[prop] = {};
  }
  const target = parent[prop];
  if (isArray(target) && isObject(value)) {
    return value;
  }
  return target || {};
}
function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
  let value;
  for (const prefix of prefixes) {
    value = _resolve(readKey(prefix, prop), scopes);
    if (typeof value !== "undefined") {
      return needsSubResolver(prop, value) ? createSubResolver(scopes, proxy, prop, value) : value;
    }
  }
}
function _resolve(key, scopes) {
  for (const scope of scopes) {
    if (!scope) {
      continue;
    }
    const value = scope[key];
    if (typeof value !== "undefined") {
      return value;
    }
  }
}
function getKeysFromAllScopes(target) {
  let keys = target._keys;
  if (!keys) {
    keys = target._keys = resolveKeysFromAllScopes(target._scopes);
  }
  return keys;
}
function resolveKeysFromAllScopes(scopes) {
  const set2 = /* @__PURE__ */ new Set();
  for (const scope of scopes) {
    for (const key of Object.keys(scope).filter((k) => !k.startsWith("_"))) {
      set2.add(key);
    }
  }
  return Array.from(set2);
}
function _parseObjectDataRadialScale(meta, data, start, count) {
  const { iScale } = meta;
  const { key = "r" } = this._parsing;
  const parsed = new Array(count);
  let i, ilen, index2, item;
  for (i = 0, ilen = count; i < ilen; ++i) {
    index2 = i + start;
    item = data[index2];
    parsed[i] = {
      r: iScale.parse(resolveObjectKey(item, key), index2)
    };
  }
  return parsed;
}
function splineCurve(firstPoint, middlePoint, afterPoint, t) {
  const previous = firstPoint.skip ? middlePoint : firstPoint;
  const current = middlePoint;
  const next = afterPoint.skip ? middlePoint : afterPoint;
  const d01 = distanceBetweenPoints(current, previous);
  const d12 = distanceBetweenPoints(next, current);
  let s01 = d01 / (d01 + d12);
  let s12 = d12 / (d01 + d12);
  s01 = isNaN(s01) ? 0 : s01;
  s12 = isNaN(s12) ? 0 : s12;
  const fa = t * s01;
  const fb = t * s12;
  return {
    previous: {
      x: current.x - fa * (next.x - previous.x),
      y: current.y - fa * (next.y - previous.y)
    },
    next: {
      x: current.x + fb * (next.x - previous.x),
      y: current.y + fb * (next.y - previous.y)
    }
  };
}
function monotoneAdjust(points, deltaK, mK) {
  const pointsLen = points.length;
  let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (let i = 0; i < pointsLen - 1; ++i) {
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent || !pointAfter) {
      continue;
    }
    if (almostEquals(deltaK[i], 0, EPSILON)) {
      mK[i] = mK[i + 1] = 0;
      continue;
    }
    alphaK = mK[i] / deltaK[i];
    betaK = mK[i + 1] / deltaK[i];
    squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
    if (squaredMagnitude <= 9) {
      continue;
    }
    tauK = 3 / Math.sqrt(squaredMagnitude);
    mK[i] = alphaK * tauK * deltaK[i];
    mK[i + 1] = betaK * tauK * deltaK[i];
  }
}
function monotoneCompute(points, mK, indexAxis = "x") {
  const valueAxis = getValueAxis(indexAxis);
  const pointsLen = points.length;
  let delta, pointBefore, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (let i = 0; i < pointsLen; ++i) {
    pointBefore = pointCurrent;
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent) {
      continue;
    }
    const iPixel = pointCurrent[indexAxis];
    const vPixel = pointCurrent[valueAxis];
    if (pointBefore) {
      delta = (iPixel - pointBefore[indexAxis]) / 3;
      pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
      pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i];
    }
    if (pointAfter) {
      delta = (pointAfter[indexAxis] - iPixel) / 3;
      pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
      pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i];
    }
  }
}
function splineCurveMonotone(points, indexAxis = "x") {
  const valueAxis = getValueAxis(indexAxis);
  const pointsLen = points.length;
  const deltaK = Array(pointsLen).fill(0);
  const mK = Array(pointsLen);
  let i, pointBefore, pointCurrent;
  let pointAfter = getPoint(points, 0);
  for (i = 0; i < pointsLen; ++i) {
    pointBefore = pointCurrent;
    pointCurrent = pointAfter;
    pointAfter = getPoint(points, i + 1);
    if (!pointCurrent) {
      continue;
    }
    if (pointAfter) {
      const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
      deltaK[i] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
    }
    mK[i] = !pointBefore ? deltaK[i] : !pointAfter ? deltaK[i - 1] : sign(deltaK[i - 1]) !== sign(deltaK[i]) ? 0 : (deltaK[i - 1] + deltaK[i]) / 2;
  }
  monotoneAdjust(points, deltaK, mK);
  monotoneCompute(points, mK, indexAxis);
}
function capControlPoint(pt, min, max) {
  return Math.max(Math.min(pt, max), min);
}
function capBezierPoints(points, area) {
  let i, ilen, point, inArea, inAreaPrev;
  let inAreaNext = _isPointInArea(points[0], area);
  for (i = 0, ilen = points.length; i < ilen; ++i) {
    inAreaPrev = inArea;
    inArea = inAreaNext;
    inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
    if (!inArea) {
      continue;
    }
    point = points[i];
    if (inAreaPrev) {
      point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
      point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
    }
    if (inAreaNext) {
      point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
      point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
    }
  }
}
function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
  let i, ilen, point, controlPoints;
  if (options.spanGaps) {
    points = points.filter((pt) => !pt.skip);
  }
  if (options.cubicInterpolationMode === "monotone") {
    splineCurveMonotone(points, indexAxis);
  } else {
    let prev = loop ? points[points.length - 1] : points[0];
    for (i = 0, ilen = points.length; i < ilen; ++i) {
      point = points[i];
      controlPoints = splineCurve(prev, point, points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen], options.tension);
      point.cp1x = controlPoints.previous.x;
      point.cp1y = controlPoints.previous.y;
      point.cp2x = controlPoints.next.x;
      point.cp2y = controlPoints.next.y;
      prev = point;
    }
  }
  if (options.capBezierPoints) {
    capBezierPoints(points, area);
  }
}
function _isDomSupported() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function _getParentNode(domNode) {
  let parent = domNode.parentNode;
  if (parent && parent.toString() === "[object ShadowRoot]") {
    parent = parent.host;
  }
  return parent;
}
function parseMaxStyle(styleValue, node, parentProperty) {
  let valueInPixels;
  if (typeof styleValue === "string") {
    valueInPixels = parseInt(styleValue, 10);
    if (styleValue.indexOf("%") !== -1) {
      valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
    }
  } else {
    valueInPixels = styleValue;
  }
  return valueInPixels;
}
function getStyle(el, property) {
  return getComputedStyle(el).getPropertyValue(property);
}
function getPositionedStyle(styles, style, suffix) {
  const result = {};
  suffix = suffix ? "-" + suffix : "";
  for (let i = 0; i < 4; i++) {
    const pos = positions[i];
    result[pos] = parseFloat(styles[style + "-" + pos + suffix]) || 0;
  }
  result.width = result.left + result.right;
  result.height = result.top + result.bottom;
  return result;
}
function getCanvasPosition(e, canvas) {
  const touches = e.touches;
  const source = touches && touches.length ? touches[0] : e;
  const { offsetX, offsetY } = source;
  let box = false;
  let x, y;
  if (useOffsetPos(offsetX, offsetY, e.target)) {
    x = offsetX;
    y = offsetY;
  } else {
    const rect = canvas.getBoundingClientRect();
    x = source.clientX - rect.left;
    y = source.clientY - rect.top;
    box = true;
  }
  return {
    x,
    y,
    box
  };
}
function getRelativePosition(event, chart) {
  if ("native" in event) {
    return event;
  }
  const { canvas, currentDevicePixelRatio } = chart;
  const style = getComputedStyle(canvas);
  const borderBox = style.boxSizing === "border-box";
  const paddings = getPositionedStyle(style, "padding");
  const borders = getPositionedStyle(style, "border", "width");
  const { x, y, box } = getCanvasPosition(event, canvas);
  const xOffset = paddings.left + (box && borders.left);
  const yOffset = paddings.top + (box && borders.top);
  let { width, height } = chart;
  if (borderBox) {
    width -= paddings.width + borders.width;
    height -= paddings.height + borders.height;
  }
  return {
    x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
    y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
  };
}
function getContainerSize(canvas, width, height) {
  let maxWidth, maxHeight;
  if (width === void 0 || height === void 0) {
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
    } else {
      const rect = container.getBoundingClientRect();
      const containerStyle = getComputedStyle(container);
      const containerBorder = getPositionedStyle(containerStyle, "border", "width");
      const containerPadding = getPositionedStyle(containerStyle, "padding");
      width = rect.width - containerPadding.width - containerBorder.width;
      height = rect.height - containerPadding.height - containerBorder.height;
      maxWidth = parseMaxStyle(containerStyle.maxWidth, container, "clientWidth");
      maxHeight = parseMaxStyle(containerStyle.maxHeight, container, "clientHeight");
    }
  }
  return {
    width,
    height,
    maxWidth: maxWidth || INFINITY,
    maxHeight: maxHeight || INFINITY
  };
}
function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
  const style = getComputedStyle(canvas);
  const margins = getPositionedStyle(style, "margin");
  const maxWidth = parseMaxStyle(style.maxWidth, canvas, "clientWidth") || INFINITY;
  const maxHeight = parseMaxStyle(style.maxHeight, canvas, "clientHeight") || INFINITY;
  const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
  let { width, height } = containerSize;
  if (style.boxSizing === "content-box") {
    const borders = getPositionedStyle(style, "border", "width");
    const paddings = getPositionedStyle(style, "padding");
    width -= paddings.width + borders.width;
    height -= paddings.height + borders.height;
  }
  width = Math.max(0, width - margins.width);
  height = Math.max(0, aspectRatio ? width / aspectRatio : height - margins.height);
  width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
  height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
  if (width && !height) {
    height = round1(width / 2);
  }
  const maintainHeight = bbWidth !== void 0 || bbHeight !== void 0;
  if (maintainHeight && aspectRatio && containerSize.height && height > containerSize.height) {
    height = containerSize.height;
    width = round1(Math.floor(height * aspectRatio));
  }
  return {
    width,
    height
  };
}
function retinaScale(chart, forceRatio, forceStyle) {
  const pixelRatio = forceRatio || 1;
  const deviceHeight = round1(chart.height * pixelRatio);
  const deviceWidth = round1(chart.width * pixelRatio);
  chart.height = round1(chart.height);
  chart.width = round1(chart.width);
  const canvas = chart.canvas;
  if (canvas.style && (forceStyle || !canvas.style.height && !canvas.style.width)) {
    canvas.style.height = `${chart.height}px`;
    canvas.style.width = `${chart.width}px`;
  }
  if (chart.currentDevicePixelRatio !== pixelRatio || canvas.height !== deviceHeight || canvas.width !== deviceWidth) {
    chart.currentDevicePixelRatio = pixelRatio;
    canvas.height = deviceHeight;
    canvas.width = deviceWidth;
    chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return true;
  }
  return false;
}
function readUsedSize(element, property) {
  const value = getStyle(element, property);
  const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
  return matches ? +matches[1] : void 0;
}
function _pointInLine(p1, p2, t, mode) {
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
}
function _steppedInterpolation(p1, p2, t, mode) {
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: mode === "middle" ? t < 0.5 ? p1.y : p2.y : mode === "after" ? t < 1 ? p1.y : p2.y : t > 0 ? p2.y : p1.y
  };
}
function _bezierInterpolation(p1, p2, t, mode) {
  const cp1 = {
    x: p1.cp2x,
    y: p1.cp2y
  };
  const cp2 = {
    x: p2.cp1x,
    y: p2.cp1y
  };
  const a = _pointInLine(p1, cp1, t);
  const b = _pointInLine(cp1, cp2, t);
  const c = _pointInLine(cp2, p2, t);
  const d = _pointInLine(a, b, t);
  const e = _pointInLine(b, c, t);
  return _pointInLine(d, e, t);
}
function getRtlAdapter(rtl, rectX, width) {
  return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
}
function overrideTextDirection(ctx, direction) {
  let style, original;
  if (direction === "ltr" || direction === "rtl") {
    style = ctx.canvas.style;
    original = [
      style.getPropertyValue("direction"),
      style.getPropertyPriority("direction")
    ];
    style.setProperty("direction", direction, "important");
    ctx.prevTextDirection = original;
  }
}
function restoreTextDirection(ctx, original) {
  if (original !== void 0) {
    delete ctx.prevTextDirection;
    ctx.canvas.style.setProperty("direction", original[0], original[1]);
  }
}
function propertyFn(property) {
  if (property === "angle") {
    return {
      between: _angleBetween,
      compare: _angleDiff,
      normalize: _normalizeAngle
    };
  }
  return {
    between: _isBetween,
    compare: (a, b) => a - b,
    normalize: (x) => x
  };
}
function normalizeSegment({ start, end, count, loop, style }) {
  return {
    start: start % count,
    end: end % count,
    loop: loop && (end - start + 1) % count === 0,
    style
  };
}
function getSegment(segment, points, bounds) {
  const { property, start: startBound, end: endBound } = bounds;
  const { between, normalize: normalize2 } = propertyFn(property);
  const count = points.length;
  let { start, end, loop } = segment;
  let i, ilen;
  if (loop) {
    start += count;
    end += count;
    for (i = 0, ilen = count; i < ilen; ++i) {
      if (!between(normalize2(points[start % count][property]), startBound, endBound)) {
        break;
      }
      start--;
      end--;
    }
    start %= count;
    end %= count;
  }
  if (end < start) {
    end += count;
  }
  return {
    start,
    end,
    loop,
    style: segment.style
  };
}
function _boundSegment(segment, points, bounds) {
  if (!bounds) {
    return [
      segment
    ];
  }
  const { property, start: startBound, end: endBound } = bounds;
  const count = points.length;
  const { compare, between, normalize: normalize2 } = propertyFn(property);
  const { start, end, loop, style } = getSegment(segment, points, bounds);
  const result = [];
  let inside = false;
  let subStart = null;
  let value, point, prevValue;
  const startIsBefore = () => between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
  const endIsBefore = () => compare(endBound, value) === 0 || between(endBound, prevValue, value);
  const shouldStart = () => inside || startIsBefore();
  const shouldStop = () => !inside || endIsBefore();
  for (let i = start, prev = start; i <= end; ++i) {
    point = points[i % count];
    if (point.skip) {
      continue;
    }
    value = normalize2(point[property]);
    if (value === prevValue) {
      continue;
    }
    inside = between(value, startBound, endBound);
    if (subStart === null && shouldStart()) {
      subStart = compare(value, startBound) === 0 ? i : prev;
    }
    if (subStart !== null && shouldStop()) {
      result.push(normalizeSegment({
        start: subStart,
        end: i,
        loop,
        count,
        style
      }));
      subStart = null;
    }
    prev = i;
    prevValue = value;
  }
  if (subStart !== null) {
    result.push(normalizeSegment({
      start: subStart,
      end,
      loop,
      count,
      style
    }));
  }
  return result;
}
function _boundSegments(line, bounds) {
  const result = [];
  const segments = line.segments;
  for (let i = 0; i < segments.length; i++) {
    const sub = _boundSegment(segments[i], line.points, bounds);
    if (sub.length) {
      result.push(...sub);
    }
  }
  return result;
}
function findStartAndEnd(points, count, loop, spanGaps) {
  let start = 0;
  let end = count - 1;
  if (loop && !spanGaps) {
    while (start < count && !points[start].skip) {
      start++;
    }
  }
  while (start < count && points[start].skip) {
    start++;
  }
  start %= count;
  if (loop) {
    end += start;
  }
  while (end > start && points[end % count].skip) {
    end--;
  }
  end %= count;
  return {
    start,
    end
  };
}
function solidSegments(points, start, max, loop) {
  const count = points.length;
  const result = [];
  let last = start;
  let prev = points[start];
  let end;
  for (end = start + 1; end <= max; ++end) {
    const cur = points[end % count];
    if (cur.skip || cur.stop) {
      if (!prev.skip) {
        loop = false;
        result.push({
          start: start % count,
          end: (end - 1) % count,
          loop
        });
        start = last = cur.stop ? end : null;
      }
    } else {
      last = end;
      if (prev.skip) {
        start = end;
      }
    }
    prev = cur;
  }
  if (last !== null) {
    result.push({
      start: start % count,
      end: last % count,
      loop
    });
  }
  return result;
}
function _computeSegments(line, segmentOptions) {
  const points = line.points;
  const spanGaps = line.options.spanGaps;
  const count = points.length;
  if (!count) {
    return [];
  }
  const loop = !!line._loop;
  const { start, end } = findStartAndEnd(points, count, loop, spanGaps);
  if (spanGaps === true) {
    return splitByStyles(line, [
      {
        start,
        end,
        loop
      }
    ], points, segmentOptions);
  }
  const max = end < start ? end + count : end;
  const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
  return splitByStyles(line, solidSegments(points, start, max, completeLoop), points, segmentOptions);
}
function splitByStyles(line, segments, points, segmentOptions) {
  if (!segmentOptions || !segmentOptions.setContext || !points) {
    return segments;
  }
  return doSplitByStyles(line, segments, points, segmentOptions);
}
function doSplitByStyles(line, segments, points, segmentOptions) {
  const chartContext = line._chart.getContext();
  const baseStyle = readStyle(line.options);
  const { _datasetIndex: datasetIndex, options: { spanGaps } } = line;
  const count = points.length;
  const result = [];
  let prevStyle = baseStyle;
  let start = segments[0].start;
  let i = start;
  function addStyle(s, e, l, st) {
    const dir = spanGaps ? -1 : 1;
    if (s === e) {
      return;
    }
    s += count;
    while (points[s % count].skip) {
      s -= dir;
    }
    while (points[e % count].skip) {
      e += dir;
    }
    if (s % count !== e % count) {
      result.push({
        start: s % count,
        end: e % count,
        loop: l,
        style: st
      });
      prevStyle = st;
      start = e % count;
    }
  }
  for (const segment of segments) {
    start = spanGaps ? start : segment.start;
    let prev = points[start % count];
    let style;
    for (i = start + 1; i <= segment.end; i++) {
      const pt = points[i % count];
      style = readStyle(segmentOptions.setContext(createContext(chartContext, {
        type: "segment",
        p0: prev,
        p1: pt,
        p0DataIndex: (i - 1) % count,
        p1DataIndex: i % count,
        datasetIndex
      })));
      if (styleChanged(style, prevStyle)) {
        addStyle(start, i - 1, segment.loop, prevStyle);
      }
      prev = pt;
      prevStyle = style;
    }
    if (start < i - 1) {
      addStyle(start, i - 1, segment.loop, prevStyle);
    }
  }
  return result;
}
function readStyle(options) {
  return {
    backgroundColor: options.backgroundColor,
    borderCapStyle: options.borderCapStyle,
    borderDash: options.borderDash,
    borderDashOffset: options.borderDashOffset,
    borderJoinStyle: options.borderJoinStyle,
    borderWidth: options.borderWidth,
    borderColor: options.borderColor
  };
}
function styleChanged(style, prevStyle) {
  if (!prevStyle) {
    return false;
  }
  const cache = [];
  const replacer = function(key, value) {
    if (!isPatternOrGradient(value)) {
      return value;
    }
    if (!cache.includes(value)) {
      cache.push(value);
    }
    return cache.indexOf(value);
  };
  return JSON.stringify(style, replacer) !== JSON.stringify(prevStyle, replacer);
}
function getSizeForArea(scale, chartArea, field) {
  return scale.options.clip ? scale[field] : chartArea[field];
}
function getDatasetArea(meta, chartArea) {
  const { xScale, yScale } = meta;
  if (xScale && yScale) {
    return {
      left: getSizeForArea(xScale, chartArea, "left"),
      right: getSizeForArea(xScale, chartArea, "right"),
      top: getSizeForArea(yScale, chartArea, "top"),
      bottom: getSizeForArea(yScale, chartArea, "bottom")
    };
  }
  return chartArea;
}
function getDatasetClipArea(chart, meta) {
  const clip = meta._clip;
  if (clip.disabled) {
    return false;
  }
  const area = getDatasetArea(meta, chart.chartArea);
  return {
    left: clip.left === false ? 0 : area.left - (clip.left === true ? 0 : clip.left),
    right: clip.right === false ? chart.width : area.right + (clip.right === true ? 0 : clip.right),
    top: clip.top === false ? 0 : area.top - (clip.top === true ? 0 : clip.top),
    bottom: clip.bottom === false ? chart.height : area.bottom + (clip.bottom === true ? 0 : clip.bottom)
  };
}
var uid, toPercentage, toDimension, keyResolvers, defined, isFunction, setsEqual, PI, TAU, PITAU, INFINITY, RAD_PER_DEG, HALF_PI, QUARTER_PI, TWO_THIRDS_PI, log10, sign, _lookupByKey, _rlookupByKey, arrayEvents, requestAnimFrame, _toLeftRightCenter, _alignStartEnd, _textX, atEdge, elasticIn, elasticOut, effects, numbers, colors, intlCache, formatters, Ticks, overrides, descriptors, Defaults, defaults, LINE_HEIGHT, FONT_STYLE, numberOrZero, readKey, needsSubResolver, getScope, EPSILON, getPoint, getValueAxis, getComputedStyle, positions, useOffsetPos, round1, supportsEventListenerOptions, getRightToLeftAdapter, getLeftToRightAdapter;
var init_helpers_dataset = __esm({
  "node_modules/chart.js/dist/chunks/helpers.dataset.js"() {
    init_color_esm();
    uid = /* @__PURE__ */ (() => {
      let id = 0;
      return () => id++;
    })();
    toPercentage = (value, dimension) => typeof value === "string" && value.endsWith("%") ? parseFloat(value) / 100 : +value / dimension;
    toDimension = (value, dimension) => typeof value === "string" && value.endsWith("%") ? parseFloat(value) / 100 * dimension : +value;
    keyResolvers = {
      // Chart.helpers.core resolveObjectKey should resolve empty key to root object
      "": (v) => v,
      // default resolvers
      x: (o) => o.x,
      y: (o) => o.y
    };
    defined = (value) => typeof value !== "undefined";
    isFunction = (value) => typeof value === "function";
    setsEqual = (a, b) => {
      if (a.size !== b.size) {
        return false;
      }
      for (const item of a) {
        if (!b.has(item)) {
          return false;
        }
      }
      return true;
    };
    PI = Math.PI;
    TAU = 2 * PI;
    PITAU = TAU + PI;
    INFINITY = Number.POSITIVE_INFINITY;
    RAD_PER_DEG = PI / 180;
    HALF_PI = PI / 2;
    QUARTER_PI = PI / 4;
    TWO_THIRDS_PI = PI * 2 / 3;
    log10 = Math.log10;
    sign = Math.sign;
    _lookupByKey = (table, key, value, last) => _lookup(table, value, last ? (index2) => {
      const ti = table[index2][key];
      return ti < value || ti === value && table[index2 + 1][key] === value;
    } : (index2) => table[index2][key] < value);
    _rlookupByKey = (table, key, value) => _lookup(table, value, (index2) => table[index2][key] >= value);
    arrayEvents = [
      "push",
      "pop",
      "shift",
      "splice",
      "unshift"
    ];
    requestAnimFrame = (function() {
      if (typeof window === "undefined") {
        return function(callback2) {
          return callback2();
        };
      }
      return window.requestAnimationFrame;
    })();
    _toLeftRightCenter = (align) => align === "start" ? "left" : align === "end" ? "right" : "center";
    _alignStartEnd = (align, start, end) => align === "start" ? start : align === "end" ? end : (start + end) / 2;
    _textX = (align, left, right, rtl) => {
      const check = rtl ? "left" : "right";
      return align === check ? right : align === "center" ? (left + right) / 2 : left;
    };
    atEdge = (t) => t === 0 || t === 1;
    elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    effects = {
      linear: (t) => t,
      easeInQuad: (t) => t * t,
      easeOutQuad: (t) => -t * (t - 2),
      easeInOutQuad: (t) => (t /= 0.5) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1),
      easeInCubic: (t) => t * t * t,
      easeOutCubic: (t) => (t -= 1) * t * t + 1,
      easeInOutCubic: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2),
      easeInQuart: (t) => t * t * t * t,
      easeOutQuart: (t) => -((t -= 1) * t * t * t - 1),
      easeInOutQuart: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2),
      easeInQuint: (t) => t * t * t * t * t,
      easeOutQuint: (t) => (t -= 1) * t * t * t * t + 1,
      easeInOutQuint: (t) => (t /= 0.5) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2),
      easeInSine: (t) => -Math.cos(t * HALF_PI) + 1,
      easeOutSine: (t) => Math.sin(t * HALF_PI),
      easeInOutSine: (t) => -0.5 * (Math.cos(PI * t) - 1),
      easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
      easeOutExpo: (t) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1,
      easeInOutExpo: (t) => atEdge(t) ? t : t < 0.5 ? 0.5 * Math.pow(2, 10 * (t * 2 - 1)) : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
      easeInCirc: (t) => t >= 1 ? t : -(Math.sqrt(1 - t * t) - 1),
      easeOutCirc: (t) => Math.sqrt(1 - (t -= 1) * t),
      easeInOutCirc: (t) => (t /= 0.5) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
      easeInElastic: (t) => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
      easeOutElastic: (t) => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
      easeInOutElastic(t) {
        const s = 0.1125;
        const p = 0.45;
        return atEdge(t) ? t : t < 0.5 ? 0.5 * elasticIn(t * 2, s, p) : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
      },
      easeInBack(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
      },
      easeOutBack(t) {
        const s = 1.70158;
        return (t -= 1) * t * ((s + 1) * t + s) + 1;
      },
      easeInOutBack(t) {
        let s = 1.70158;
        if ((t /= 0.5) < 1) {
          return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
        }
        return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
      },
      easeInBounce: (t) => 1 - effects.easeOutBounce(1 - t),
      easeOutBounce(t) {
        const m = 7.5625;
        const d = 2.75;
        if (t < 1 / d) {
          return m * t * t;
        }
        if (t < 2 / d) {
          return m * (t -= 1.5 / d) * t + 0.75;
        }
        if (t < 2.5 / d) {
          return m * (t -= 2.25 / d) * t + 0.9375;
        }
        return m * (t -= 2.625 / d) * t + 0.984375;
      },
      easeInOutBounce: (t) => t < 0.5 ? effects.easeInBounce(t * 2) * 0.5 : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5
    };
    numbers = [
      "x",
      "y",
      "borderWidth",
      "radius",
      "tension"
    ];
    colors = [
      "color",
      "borderColor",
      "backgroundColor"
    ];
    intlCache = /* @__PURE__ */ new Map();
    formatters = {
      values(value) {
        return isArray(value) ? value : "" + value;
      },
      numeric(tickValue, index2, ticks) {
        if (tickValue === 0) {
          return "0";
        }
        const locale = this.chart.options.locale;
        let notation;
        let delta = tickValue;
        if (ticks.length > 1) {
          const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
          if (maxTick < 1e-4 || maxTick > 1e15) {
            notation = "scientific";
          }
          delta = calculateDelta(tickValue, ticks);
        }
        const logDelta = log10(Math.abs(delta));
        const numDecimal = isNaN(logDelta) ? 1 : Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
        const options = {
          notation,
          minimumFractionDigits: numDecimal,
          maximumFractionDigits: numDecimal
        };
        Object.assign(options, this.options.ticks.format);
        return formatNumber(tickValue, locale, options);
      },
      logarithmic(tickValue, index2, ticks) {
        if (tickValue === 0) {
          return "0";
        }
        const remain = ticks[index2].significand || tickValue / Math.pow(10, Math.floor(log10(tickValue)));
        if ([
          1,
          2,
          3,
          5,
          10,
          15
        ].includes(remain) || index2 > 0.8 * ticks.length) {
          return formatters.numeric.call(this, tickValue, index2, ticks);
        }
        return "";
      }
    };
    Ticks = {
      formatters
    };
    overrides = /* @__PURE__ */ Object.create(null);
    descriptors = /* @__PURE__ */ Object.create(null);
    Defaults = class {
      constructor(_descriptors2, _appliers) {
        this.animation = void 0;
        this.backgroundColor = "rgba(0,0,0,0.1)";
        this.borderColor = "rgba(0,0,0,0.1)";
        this.color = "#666";
        this.datasets = {};
        this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
        this.elements = {};
        this.events = [
          "mousemove",
          "mouseout",
          "click",
          "touchstart",
          "touchmove"
        ];
        this.font = {
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 12,
          style: "normal",
          lineHeight: 1.2,
          weight: null
        };
        this.hover = {};
        this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
        this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
        this.hoverColor = (ctx, options) => getHoverColor(options.color);
        this.indexAxis = "x";
        this.interaction = {
          mode: "nearest",
          intersect: true,
          includeInvisible: false
        };
        this.maintainAspectRatio = true;
        this.onHover = null;
        this.onClick = null;
        this.parsing = true;
        this.plugins = {};
        this.responsive = true;
        this.scale = void 0;
        this.scales = {};
        this.showLine = true;
        this.drawActiveElementsOnTop = true;
        this.describe(_descriptors2);
        this.apply(_appliers);
      }
      set(scope, values) {
        return set(this, scope, values);
      }
      get(scope) {
        return getScope$1(this, scope);
      }
      describe(scope, values) {
        return set(descriptors, scope, values);
      }
      override(scope, values) {
        return set(overrides, scope, values);
      }
      route(scope, name, targetScope, targetName) {
        const scopeObject = getScope$1(this, scope);
        const targetScopeObject = getScope$1(this, targetScope);
        const privateName = "_" + name;
        Object.defineProperties(scopeObject, {
          [privateName]: {
            value: scopeObject[name],
            writable: true
          },
          [name]: {
            enumerable: true,
            get() {
              const local2 = this[privateName];
              const target = targetScopeObject[targetName];
              if (isObject(local2)) {
                return Object.assign({}, target, local2);
              }
              return valueOrDefault(local2, target);
            },
            set(value) {
              this[privateName] = value;
            }
          }
        });
      }
      apply(appliers) {
        appliers.forEach((apply) => apply(this));
      }
    };
    defaults = /* @__PURE__ */ new Defaults({
      _scriptable: (name) => !name.startsWith("on"),
      _indexable: (name) => name !== "events",
      hover: {
        _fallback: "interaction"
      },
      interaction: {
        _scriptable: false,
        _indexable: false
      }
    }, [
      applyAnimationsDefaults,
      applyLayoutsDefaults,
      applyScaleDefaults
    ]);
    LINE_HEIGHT = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/;
    FONT_STYLE = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
    numberOrZero = (v) => +v || 0;
    readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
    needsSubResolver = (prop, value) => isObject(value) && prop !== "adapters" && (Object.getPrototypeOf(value) === null || value.constructor === Object);
    getScope = (key, parent) => key === true ? parent : typeof key === "string" ? resolveObjectKey(parent, key) : void 0;
    EPSILON = Number.EPSILON || 1e-14;
    getPoint = (points, i) => i < points.length && !points[i].skip && points[i];
    getValueAxis = (indexAxis) => indexAxis === "x" ? "y" : "x";
    getComputedStyle = (element) => element.ownerDocument.defaultView.getComputedStyle(element, null);
    positions = [
      "top",
      "right",
      "bottom",
      "left"
    ];
    useOffsetPos = (x, y, target) => (x > 0 || y > 0) && (!target || !target.shadowRoot);
    round1 = (v) => Math.round(v * 10) / 10;
    supportsEventListenerOptions = (function() {
      let passiveSupported = false;
      try {
        const options = {
          get passive() {
            passiveSupported = true;
            return false;
          }
        };
        if (_isDomSupported()) {
          window.addEventListener("test", null, options);
          window.removeEventListener("test", null, options);
        }
      } catch (e) {
      }
      return passiveSupported;
    })();
    getRightToLeftAdapter = function(rectX, width) {
      return {
        x(x) {
          return rectX + rectX + width - x;
        },
        setWidth(w) {
          width = w;
        },
        textAlign(align) {
          if (align === "center") {
            return align;
          }
          return align === "right" ? "left" : "right";
        },
        xPlus(x, value) {
          return x - value;
        },
        leftForLtr(x, itemWidth) {
          return x - itemWidth;
        }
      };
    };
    getLeftToRightAdapter = function() {
      return {
        x(x) {
          return x;
        },
        setWidth(w) {
        },
        textAlign(align) {
          return align;
        },
        xPlus(x, value) {
          return x + value;
        },
        leftForLtr(x, _itemWidth) {
          return x;
        }
      };
    };
  }
});

// node_modules/chart.js/dist/chart.js
function awaitAll(animations, properties) {
  const running = [];
  const keys = Object.keys(properties);
  for (let i = 0; i < keys.length; i++) {
    const anim = animations[keys[i]];
    if (anim && anim.active()) {
      running.push(anim.wait());
    }
  }
  return Promise.all(running);
}
function resolveTargetOptions(target, newOptions) {
  if (!newOptions) {
    return;
  }
  let options = target.options;
  if (!options) {
    target.options = newOptions;
    return;
  }
  if (options.$shared) {
    target.options = options = Object.assign({}, options, {
      $shared: false,
      $animations: {}
    });
  }
  return options;
}
function scaleClip(scale, allowedOverflow) {
  const opts = scale && scale.options || {};
  const reverse = opts.reverse;
  const min = opts.min === void 0 ? allowedOverflow : 0;
  const max = opts.max === void 0 ? allowedOverflow : 0;
  return {
    start: reverse ? max : min,
    end: reverse ? min : max
  };
}
function defaultClip(xScale, yScale, allowedOverflow) {
  if (allowedOverflow === false) {
    return false;
  }
  const x = scaleClip(xScale, allowedOverflow);
  const y = scaleClip(yScale, allowedOverflow);
  return {
    top: y.end,
    right: x.end,
    bottom: y.start,
    left: x.start
  };
}
function toClip(value) {
  let t, r, b, l;
  if (isObject(value)) {
    t = value.top;
    r = value.right;
    b = value.bottom;
    l = value.left;
  } else {
    t = r = b = l = value;
  }
  return {
    top: t,
    right: r,
    bottom: b,
    left: l,
    disabled: value === false
  };
}
function getSortedDatasetIndices(chart, filterVisible) {
  const keys = [];
  const metasets = chart._getSortedDatasetMetas(filterVisible);
  let i, ilen;
  for (i = 0, ilen = metasets.length; i < ilen; ++i) {
    keys.push(metasets[i].index);
  }
  return keys;
}
function applyStack(stack, value, dsIndex, options = {}) {
  const keys = stack.keys;
  const singleMode = options.mode === "single";
  let i, ilen, datasetIndex, otherValue;
  if (value === null) {
    return;
  }
  let found = false;
  for (i = 0, ilen = keys.length; i < ilen; ++i) {
    datasetIndex = +keys[i];
    if (datasetIndex === dsIndex) {
      found = true;
      if (options.all) {
        continue;
      }
      break;
    }
    otherValue = stack.values[datasetIndex];
    if (isNumberFinite(otherValue) && (singleMode || value === 0 || sign(value) === sign(otherValue))) {
      value += otherValue;
    }
  }
  if (!found && !options.all) {
    return 0;
  }
  return value;
}
function convertObjectDataToArray(data, meta) {
  const { iScale, vScale } = meta;
  const iAxisKey = iScale.axis === "x" ? "x" : "y";
  const vAxisKey = vScale.axis === "x" ? "x" : "y";
  const keys = Object.keys(data);
  const adata = new Array(keys.length);
  let i, ilen, key;
  for (i = 0, ilen = keys.length; i < ilen; ++i) {
    key = keys[i];
    adata[i] = {
      [iAxisKey]: key,
      [vAxisKey]: data[key]
    };
  }
  return adata;
}
function isStacked(scale, meta) {
  const stacked = scale && scale.options.stacked;
  return stacked || stacked === void 0 && meta.stack !== void 0;
}
function getStackKey(indexScale, valueScale, meta) {
  return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
}
function getUserBounds(scale) {
  const { min, max, minDefined, maxDefined } = scale.getUserBounds();
  return {
    min: minDefined ? min : Number.NEGATIVE_INFINITY,
    max: maxDefined ? max : Number.POSITIVE_INFINITY
  };
}
function getOrCreateStack(stacks, stackKey, indexValue) {
  const subStack = stacks[stackKey] || (stacks[stackKey] = {});
  return subStack[indexValue] || (subStack[indexValue] = {});
}
function getLastIndexInStack(stack, vScale, positive, type) {
  for (const meta of vScale.getMatchingVisibleMetas(type).reverse()) {
    const value = stack[meta.index];
    if (positive && value > 0 || !positive && value < 0) {
      return meta.index;
    }
  }
  return null;
}
function updateStacks(controller, parsed) {
  const { chart, _cachedMeta: meta } = controller;
  const stacks = chart._stacks || (chart._stacks = {});
  const { iScale, vScale, index: datasetIndex } = meta;
  const iAxis = iScale.axis;
  const vAxis = vScale.axis;
  const key = getStackKey(iScale, vScale, meta);
  const ilen = parsed.length;
  let stack;
  for (let i = 0; i < ilen; ++i) {
    const item = parsed[i];
    const { [iAxis]: index2, [vAxis]: value } = item;
    const itemStacks = item._stacks || (item._stacks = {});
    stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index2);
    stack[datasetIndex] = value;
    stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
    stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
    const visualValues = stack._visualValues || (stack._visualValues = {});
    visualValues[datasetIndex] = value;
  }
}
function getFirstScaleId(chart, axis) {
  const scales2 = chart.scales;
  return Object.keys(scales2).filter((key) => scales2[key].axis === axis).shift();
}
function createDatasetContext(parent, index2) {
  return createContext(parent, {
    active: false,
    dataset: void 0,
    datasetIndex: index2,
    index: index2,
    mode: "default",
    type: "dataset"
  });
}
function createDataContext(parent, index2, element) {
  return createContext(parent, {
    active: false,
    dataIndex: index2,
    parsed: void 0,
    raw: void 0,
    element,
    index: index2,
    mode: "default",
    type: "data"
  });
}
function clearStacks(meta, items) {
  const datasetIndex = meta.controller.index;
  const axis = meta.vScale && meta.vScale.axis;
  if (!axis) {
    return;
  }
  items = items || meta._parsed;
  for (const parsed of items) {
    const stacks = parsed._stacks;
    if (!stacks || stacks[axis] === void 0 || stacks[axis][datasetIndex] === void 0) {
      return;
    }
    delete stacks[axis][datasetIndex];
    if (stacks[axis]._visualValues !== void 0 && stacks[axis]._visualValues[datasetIndex] !== void 0) {
      delete stacks[axis]._visualValues[datasetIndex];
    }
  }
}
function getAllScaleValues(scale, type) {
  if (!scale._cache.$bar) {
    const visibleMetas = scale.getMatchingVisibleMetas(type);
    let values = [];
    for (let i = 0, ilen = visibleMetas.length; i < ilen; i++) {
      values = values.concat(visibleMetas[i].controller.getAllParsedValues(scale));
    }
    scale._cache.$bar = _arrayUnique(values.sort((a, b) => a - b));
  }
  return scale._cache.$bar;
}
function computeMinSampleSize(meta) {
  const scale = meta.iScale;
  const values = getAllScaleValues(scale, meta.type);
  let min = scale._length;
  let i, ilen, curr, prev;
  const updateMinAndPrev = () => {
    if (curr === 32767 || curr === -32768) {
      return;
    }
    if (defined(prev)) {
      min = Math.min(min, Math.abs(curr - prev) || min);
    }
    prev = curr;
  };
  for (i = 0, ilen = values.length; i < ilen; ++i) {
    curr = scale.getPixelForValue(values[i]);
    updateMinAndPrev();
  }
  prev = void 0;
  for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
    curr = scale.getPixelForTick(i);
    updateMinAndPrev();
  }
  return min;
}
function computeFitCategoryTraits(index2, ruler, options, stackCount) {
  const thickness = options.barThickness;
  let size, ratio;
  if (isNullOrUndef(thickness)) {
    size = ruler.min * options.categoryPercentage;
    ratio = options.barPercentage;
  } else {
    size = thickness * stackCount;
    ratio = 1;
  }
  return {
    chunk: size / stackCount,
    ratio,
    start: ruler.pixels[index2] - size / 2
  };
}
function computeFlexCategoryTraits(index2, ruler, options, stackCount) {
  const pixels = ruler.pixels;
  const curr = pixels[index2];
  let prev = index2 > 0 ? pixels[index2 - 1] : null;
  let next = index2 < pixels.length - 1 ? pixels[index2 + 1] : null;
  const percent = options.categoryPercentage;
  if (prev === null) {
    prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
  }
  if (next === null) {
    next = curr + curr - prev;
  }
  const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
  const size = Math.abs(next - prev) / 2 * percent;
  return {
    chunk: size / stackCount,
    ratio: options.barPercentage,
    start
  };
}
function parseFloatBar(entry, item, vScale, i) {
  const startValue = vScale.parse(entry[0], i);
  const endValue = vScale.parse(entry[1], i);
  const min = Math.min(startValue, endValue);
  const max = Math.max(startValue, endValue);
  let barStart = min;
  let barEnd = max;
  if (Math.abs(min) > Math.abs(max)) {
    barStart = max;
    barEnd = min;
  }
  item[vScale.axis] = barEnd;
  item._custom = {
    barStart,
    barEnd,
    start: startValue,
    end: endValue,
    min,
    max
  };
}
function parseValue(entry, item, vScale, i) {
  if (isArray(entry)) {
    parseFloatBar(entry, item, vScale, i);
  } else {
    item[vScale.axis] = vScale.parse(entry, i);
  }
  return item;
}
function parseArrayOrPrimitive(meta, data, start, count) {
  const iScale = meta.iScale;
  const vScale = meta.vScale;
  const labels = iScale.getLabels();
  const singleScale = iScale === vScale;
  const parsed = [];
  let i, ilen, item, entry;
  for (i = start, ilen = start + count; i < ilen; ++i) {
    entry = data[i];
    item = {};
    item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
    parsed.push(parseValue(entry, item, vScale, i));
  }
  return parsed;
}
function isFloatBar(custom) {
  return custom && custom.barStart !== void 0 && custom.barEnd !== void 0;
}
function barSign(size, vScale, actualBase) {
  if (size !== 0) {
    return sign(size);
  }
  return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
}
function borderProps(properties) {
  let reverse, start, end, top, bottom;
  if (properties.horizontal) {
    reverse = properties.base > properties.x;
    start = "left";
    end = "right";
  } else {
    reverse = properties.base < properties.y;
    start = "bottom";
    end = "top";
  }
  if (reverse) {
    top = "end";
    bottom = "start";
  } else {
    top = "start";
    bottom = "end";
  }
  return {
    start,
    end,
    reverse,
    top,
    bottom
  };
}
function setBorderSkipped(properties, options, stack, index2) {
  let edge = options.borderSkipped;
  const res = {};
  if (!edge) {
    properties.borderSkipped = res;
    return;
  }
  if (edge === true) {
    properties.borderSkipped = {
      top: true,
      right: true,
      bottom: true,
      left: true
    };
    return;
  }
  const { start, end, reverse, top, bottom } = borderProps(properties);
  if (edge === "middle" && stack) {
    properties.enableBorderRadius = true;
    if ((stack._top || 0) === index2) {
      edge = top;
    } else if ((stack._bottom || 0) === index2) {
      edge = bottom;
    } else {
      res[parseEdge(bottom, start, end, reverse)] = true;
      edge = top;
    }
  }
  res[parseEdge(edge, start, end, reverse)] = true;
  properties.borderSkipped = res;
}
function parseEdge(edge, a, b, reverse) {
  if (reverse) {
    edge = swap(edge, a, b);
    edge = startEnd(edge, b, a);
  } else {
    edge = startEnd(edge, a, b);
  }
  return edge;
}
function swap(orig, v1, v2) {
  return orig === v1 ? v2 : orig === v2 ? v1 : orig;
}
function startEnd(v, start, end) {
  return v === "start" ? start : v === "end" ? end : v;
}
function setInflateAmount(properties, { inflateAmount }, ratio) {
  properties.inflateAmount = inflateAmount === "auto" ? ratio === 1 ? 0.33 : 0 : inflateAmount;
}
function getRatioAndOffset(rotation, circumference, cutout) {
  let ratioX = 1;
  let ratioY = 1;
  let offsetX = 0;
  let offsetY = 0;
  if (circumference < TAU) {
    const startAngle = rotation;
    const endAngle = startAngle + circumference;
    const startX = Math.cos(startAngle);
    const startY = Math.sin(startAngle);
    const endX = Math.cos(endAngle);
    const endY = Math.sin(endAngle);
    const calcMax = (angle, a, b) => _angleBetween(angle, startAngle, endAngle, true) ? 1 : Math.max(a, a * cutout, b, b * cutout);
    const calcMin = (angle, a, b) => _angleBetween(angle, startAngle, endAngle, true) ? -1 : Math.min(a, a * cutout, b, b * cutout);
    const maxX = calcMax(0, startX, endX);
    const maxY = calcMax(HALF_PI, startY, endY);
    const minX = calcMin(PI, startX, endX);
    const minY = calcMin(PI + HALF_PI, startY, endY);
    ratioX = (maxX - minX) / 2;
    ratioY = (maxY - minY) / 2;
    offsetX = -(maxX + minX) / 2;
    offsetY = -(maxY + minY) / 2;
  }
  return {
    ratioX,
    ratioY,
    offsetX,
    offsetY
  };
}
function abstract() {
  throw new Error("This method is not implemented: Check that a complete date adapter is provided.");
}
function binarySearch(metaset, axis, value, intersect) {
  const { controller, data, _sorted } = metaset;
  const iScale = controller._cachedMeta.iScale;
  const spanGaps = metaset.dataset ? metaset.dataset.options ? metaset.dataset.options.spanGaps : null : null;
  if (iScale && axis === iScale.axis && axis !== "r" && _sorted && data.length) {
    const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
    if (!intersect) {
      const result = lookupMethod(data, axis, value);
      if (spanGaps) {
        const { vScale } = controller._cachedMeta;
        const { _parsed } = metaset;
        const distanceToDefinedLo = _parsed.slice(0, result.lo + 1).reverse().findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        result.lo -= Math.max(0, distanceToDefinedLo);
        const distanceToDefinedHi = _parsed.slice(result.hi).findIndex((point) => !isNullOrUndef(point[vScale.axis]));
        result.hi += Math.max(0, distanceToDefinedHi);
      }
      return result;
    } else if (controller._sharedOptions) {
      const el = data[0];
      const range = typeof el.getRange === "function" && el.getRange(axis);
      if (range) {
        const start = lookupMethod(data, axis, value - range);
        const end = lookupMethod(data, axis, value + range);
        return {
          lo: start.lo,
          hi: end.hi
        };
      }
    }
  }
  return {
    lo: 0,
    hi: data.length - 1
  };
}
function evaluateInteractionItems(chart, axis, position, handler, intersect) {
  const metasets = chart.getSortedVisibleDatasetMetas();
  const value = position[axis];
  for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
    const { index: index2, data } = metasets[i];
    const { lo, hi } = binarySearch(metasets[i], axis, value, intersect);
    for (let j = lo; j <= hi; ++j) {
      const element = data[j];
      if (!element.skip) {
        handler(element, index2, j);
      }
    }
  }
}
function getDistanceMetricForAxis(axis) {
  const useX = axis.indexOf("x") !== -1;
  const useY = axis.indexOf("y") !== -1;
  return function(pt1, pt2) {
    const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
    const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
    return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
  };
}
function getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) {
  const items = [];
  if (!includeInvisible && !chart.isPointInArea(position)) {
    return items;
  }
  const evaluationFunc = function(element, datasetIndex, index2) {
    if (!includeInvisible && !_isPointInArea(element, chart.chartArea, 0)) {
      return;
    }
    if (element.inRange(position.x, position.y, useFinalPosition)) {
      items.push({
        element,
        datasetIndex,
        index: index2
      });
    }
  };
  evaluateInteractionItems(chart, axis, position, evaluationFunc, true);
  return items;
}
function getNearestRadialItems(chart, position, axis, useFinalPosition) {
  let items = [];
  function evaluationFunc(element, datasetIndex, index2) {
    const { startAngle, endAngle } = element.getProps([
      "startAngle",
      "endAngle"
    ], useFinalPosition);
    const { angle } = getAngleFromPoint(element, {
      x: position.x,
      y: position.y
    });
    if (_angleBetween(angle, startAngle, endAngle)) {
      items.push({
        element,
        datasetIndex,
        index: index2
      });
    }
  }
  evaluateInteractionItems(chart, axis, position, evaluationFunc);
  return items;
}
function getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
  let items = [];
  const distanceMetric = getDistanceMetricForAxis(axis);
  let minDistance = Number.POSITIVE_INFINITY;
  function evaluationFunc(element, datasetIndex, index2) {
    const inRange2 = element.inRange(position.x, position.y, useFinalPosition);
    if (intersect && !inRange2) {
      return;
    }
    const center = element.getCenterPoint(useFinalPosition);
    const pointInArea = !!includeInvisible || chart.isPointInArea(center);
    if (!pointInArea && !inRange2) {
      return;
    }
    const distance = distanceMetric(position, center);
    if (distance < minDistance) {
      items = [
        {
          element,
          datasetIndex,
          index: index2
        }
      ];
      minDistance = distance;
    } else if (distance === minDistance) {
      items.push({
        element,
        datasetIndex,
        index: index2
      });
    }
  }
  evaluateInteractionItems(chart, axis, position, evaluationFunc);
  return items;
}
function getNearestItems(chart, position, axis, intersect, useFinalPosition, includeInvisible) {
  if (!includeInvisible && !chart.isPointInArea(position)) {
    return [];
  }
  return axis === "r" && !intersect ? getNearestRadialItems(chart, position, axis, useFinalPosition) : getNearestCartesianItems(chart, position, axis, intersect, useFinalPosition, includeInvisible);
}
function getAxisItems(chart, position, axis, intersect, useFinalPosition) {
  const items = [];
  const rangeMethod = axis === "x" ? "inXRange" : "inYRange";
  let intersectsItem = false;
  evaluateInteractionItems(chart, axis, position, (element, datasetIndex, index2) => {
    if (element[rangeMethod] && element[rangeMethod](position[axis], useFinalPosition)) {
      items.push({
        element,
        datasetIndex,
        index: index2
      });
      intersectsItem = intersectsItem || element.inRange(position.x, position.y, useFinalPosition);
    }
  });
  if (intersect && !intersectsItem) {
    return [];
  }
  return items;
}
function filterByPosition(array, position) {
  return array.filter((v) => v.pos === position);
}
function filterDynamicPositionByAxis(array, axis) {
  return array.filter((v) => STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
}
function sortByWeight(array, reverse) {
  return array.sort((a, b) => {
    const v0 = reverse ? b : a;
    const v1 = reverse ? a : b;
    return v0.weight === v1.weight ? v0.index - v1.index : v0.weight - v1.weight;
  });
}
function wrapBoxes(boxes) {
  const layoutBoxes = [];
  let i, ilen, box, pos, stack, stackWeight;
  for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
    box = boxes[i];
    ({ position: pos, options: { stack, stackWeight = 1 } } = box);
    layoutBoxes.push({
      index: i,
      box,
      pos,
      horizontal: box.isHorizontal(),
      weight: box.weight,
      stack: stack && pos + stack,
      stackWeight
    });
  }
  return layoutBoxes;
}
function buildStacks(layouts2) {
  const stacks = {};
  for (const wrap of layouts2) {
    const { stack, pos, stackWeight } = wrap;
    if (!stack || !STATIC_POSITIONS.includes(pos)) {
      continue;
    }
    const _stack = stacks[stack] || (stacks[stack] = {
      count: 0,
      placed: 0,
      weight: 0,
      size: 0
    });
    _stack.count++;
    _stack.weight += stackWeight;
  }
  return stacks;
}
function setLayoutDims(layouts2, params) {
  const stacks = buildStacks(layouts2);
  const { vBoxMaxWidth, hBoxMaxHeight } = params;
  let i, ilen, layout;
  for (i = 0, ilen = layouts2.length; i < ilen; ++i) {
    layout = layouts2[i];
    const { fullSize } = layout.box;
    const stack = stacks[layout.stack];
    const factor = stack && layout.stackWeight / stack.weight;
    if (layout.horizontal) {
      layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
      layout.height = hBoxMaxHeight;
    } else {
      layout.width = vBoxMaxWidth;
      layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
    }
  }
  return stacks;
}
function buildLayoutBoxes(boxes) {
  const layoutBoxes = wrapBoxes(boxes);
  const fullSize = sortByWeight(layoutBoxes.filter((wrap) => wrap.box.fullSize), true);
  const left = sortByWeight(filterByPosition(layoutBoxes, "left"), true);
  const right = sortByWeight(filterByPosition(layoutBoxes, "right"));
  const top = sortByWeight(filterByPosition(layoutBoxes, "top"), true);
  const bottom = sortByWeight(filterByPosition(layoutBoxes, "bottom"));
  const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, "x");
  const centerVertical = filterDynamicPositionByAxis(layoutBoxes, "y");
  return {
    fullSize,
    leftAndTop: left.concat(top),
    rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
    chartArea: filterByPosition(layoutBoxes, "chartArea"),
    vertical: left.concat(right).concat(centerVertical),
    horizontal: top.concat(bottom).concat(centerHorizontal)
  };
}
function getCombinedMax(maxPadding, chartArea, a, b) {
  return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
}
function updateMaxPadding(maxPadding, boxPadding) {
  maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
  maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
  maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
  maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
}
function updateDims(chartArea, params, layout, stacks) {
  const { pos, box } = layout;
  const maxPadding = chartArea.maxPadding;
  if (!isObject(pos)) {
    if (layout.size) {
      chartArea[pos] -= layout.size;
    }
    const stack = stacks[layout.stack] || {
      size: 0,
      count: 1
    };
    stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
    layout.size = stack.size / stack.count;
    chartArea[pos] += layout.size;
  }
  if (box.getPadding) {
    updateMaxPadding(maxPadding, box.getPadding());
  }
  const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, "left", "right"));
  const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, "top", "bottom"));
  const widthChanged = newWidth !== chartArea.w;
  const heightChanged = newHeight !== chartArea.h;
  chartArea.w = newWidth;
  chartArea.h = newHeight;
  return layout.horizontal ? {
    same: widthChanged,
    other: heightChanged
  } : {
    same: heightChanged,
    other: widthChanged
  };
}
function handleMaxPadding(chartArea) {
  const maxPadding = chartArea.maxPadding;
  function updatePos(pos) {
    const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
    chartArea[pos] += change;
    return change;
  }
  chartArea.y += updatePos("top");
  chartArea.x += updatePos("left");
  updatePos("right");
  updatePos("bottom");
}
function getMargins(horizontal, chartArea) {
  const maxPadding = chartArea.maxPadding;
  function marginForPositions(positions2) {
    const margin = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
    positions2.forEach((pos) => {
      margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
    });
    return margin;
  }
  return horizontal ? marginForPositions([
    "left",
    "right"
  ]) : marginForPositions([
    "top",
    "bottom"
  ]);
}
function fitBoxes(boxes, chartArea, params, stacks) {
  const refitBoxes = [];
  let i, ilen, layout, box, refit, changed;
  for (i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i) {
    layout = boxes[i];
    box = layout.box;
    box.update(layout.width || chartArea.w, layout.height || chartArea.h, getMargins(layout.horizontal, chartArea));
    const { same, other } = updateDims(chartArea, params, layout, stacks);
    refit |= same && refitBoxes.length;
    changed = changed || other;
    if (!box.fullSize) {
      refitBoxes.push(layout);
    }
  }
  return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
}
function setBoxDims(box, left, top, width, height) {
  box.top = top;
  box.left = left;
  box.right = left + width;
  box.bottom = top + height;
  box.width = width;
  box.height = height;
}
function placeBoxes(boxes, chartArea, params, stacks) {
  const userPadding = params.padding;
  let { x, y } = chartArea;
  for (const layout of boxes) {
    const box = layout.box;
    const stack = stacks[layout.stack] || {
      count: 1,
      placed: 0,
      weight: 1
    };
    const weight = layout.stackWeight / stack.weight || 1;
    if (layout.horizontal) {
      const width = chartArea.w * weight;
      const height = stack.size || box.height;
      if (defined(stack.start)) {
        y = stack.start;
      }
      if (box.fullSize) {
        setBoxDims(box, userPadding.left, y, params.outerWidth - userPadding.right - userPadding.left, height);
      } else {
        setBoxDims(box, chartArea.left + stack.placed, y, width, height);
      }
      stack.start = y;
      stack.placed += width;
      y = box.bottom;
    } else {
      const height = chartArea.h * weight;
      const width = stack.size || box.width;
      if (defined(stack.start)) {
        x = stack.start;
      }
      if (box.fullSize) {
        setBoxDims(box, x, userPadding.top, width, params.outerHeight - userPadding.bottom - userPadding.top);
      } else {
        setBoxDims(box, x, chartArea.top + stack.placed, width, height);
      }
      stack.start = x;
      stack.placed += height;
      x = box.right;
    }
  }
  chartArea.x = x;
  chartArea.y = y;
}
function initCanvas(canvas, aspectRatio) {
  const style = canvas.style;
  const renderHeight = canvas.getAttribute("height");
  const renderWidth = canvas.getAttribute("width");
  canvas[EXPANDO_KEY] = {
    initial: {
      height: renderHeight,
      width: renderWidth,
      style: {
        display: style.display,
        height: style.height,
        width: style.width
      }
    }
  };
  style.display = style.display || "block";
  style.boxSizing = style.boxSizing || "border-box";
  if (isNullOrEmpty(renderWidth)) {
    const displayWidth = readUsedSize(canvas, "width");
    if (displayWidth !== void 0) {
      canvas.width = displayWidth;
    }
  }
  if (isNullOrEmpty(renderHeight)) {
    if (canvas.style.height === "") {
      canvas.height = canvas.width / (aspectRatio || 2);
    } else {
      const displayHeight = readUsedSize(canvas, "height");
      if (displayHeight !== void 0) {
        canvas.height = displayHeight;
      }
    }
  }
  return canvas;
}
function addListener(node, type, listener) {
  if (node) {
    node.addEventListener(type, listener, eventListenerOptions);
  }
}
function removeListener(chart, type, listener) {
  if (chart && chart.canvas) {
    chart.canvas.removeEventListener(type, listener, eventListenerOptions);
  }
}
function fromNativeEvent(event, chart) {
  const type = EVENT_TYPES[event.type] || event.type;
  const { x, y } = getRelativePosition(event, chart);
  return {
    type,
    chart,
    native: event,
    x: x !== void 0 ? x : null,
    y: y !== void 0 ? y : null
  };
}
function nodeListContains(nodeList, canvas) {
  for (const node of nodeList) {
    if (node === canvas || node.contains(canvas)) {
      return true;
    }
  }
}
function createAttachObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const observer = new MutationObserver((entries) => {
    let trigger = false;
    for (const entry of entries) {
      trigger = trigger || nodeListContains(entry.addedNodes, canvas);
      trigger = trigger && !nodeListContains(entry.removedNodes, canvas);
    }
    if (trigger) {
      listener();
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  return observer;
}
function createDetachObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const observer = new MutationObserver((entries) => {
    let trigger = false;
    for (const entry of entries) {
      trigger = trigger || nodeListContains(entry.removedNodes, canvas);
      trigger = trigger && !nodeListContains(entry.addedNodes, canvas);
    }
    if (trigger) {
      listener();
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  return observer;
}
function onWindowResize() {
  const dpr = window.devicePixelRatio;
  if (dpr === oldDevicePixelRatio) {
    return;
  }
  oldDevicePixelRatio = dpr;
  drpListeningCharts.forEach((resize, chart) => {
    if (chart.currentDevicePixelRatio !== dpr) {
      resize();
    }
  });
}
function listenDevicePixelRatioChanges(chart, resize) {
  if (!drpListeningCharts.size) {
    window.addEventListener("resize", onWindowResize);
  }
  drpListeningCharts.set(chart, resize);
}
function unlistenDevicePixelRatioChanges(chart) {
  drpListeningCharts.delete(chart);
  if (!drpListeningCharts.size) {
    window.removeEventListener("resize", onWindowResize);
  }
}
function createResizeObserver(chart, type, listener) {
  const canvas = chart.canvas;
  const container = canvas && _getParentNode(canvas);
  if (!container) {
    return;
  }
  const resize = throttled((width, height) => {
    const w = container.clientWidth;
    listener(width, height);
    if (w < container.clientWidth) {
      listener();
    }
  }, window);
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    const width = entry.contentRect.width;
    const height = entry.contentRect.height;
    if (width === 0 && height === 0) {
      return;
    }
    resize(width, height);
  });
  observer.observe(container);
  listenDevicePixelRatioChanges(chart, resize);
  return observer;
}
function releaseObserver(chart, type, observer) {
  if (observer) {
    observer.disconnect();
  }
  if (type === "resize") {
    unlistenDevicePixelRatioChanges(chart);
  }
}
function createProxyAndListen(chart, type, listener) {
  const canvas = chart.canvas;
  const proxy = throttled((event) => {
    if (chart.ctx !== null) {
      listener(fromNativeEvent(event, chart));
    }
  }, chart);
  addListener(canvas, type, proxy);
  return proxy;
}
function _detectPlatform(canvas) {
  if (!_isDomSupported() || typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return BasicPlatform;
  }
  return DomPlatform;
}
function autoSkip(scale, ticks) {
  const tickOpts = scale.options.ticks;
  const determinedMaxTicks = determineMaxTicks(scale);
  const ticksLimit = Math.min(tickOpts.maxTicksLimit || determinedMaxTicks, determinedMaxTicks);
  const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
  const numMajorIndices = majorIndices.length;
  const first = majorIndices[0];
  const last = majorIndices[numMajorIndices - 1];
  const newTicks = [];
  if (numMajorIndices > ticksLimit) {
    skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
    return newTicks;
  }
  const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
  if (numMajorIndices > 0) {
    let i, ilen;
    const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
    skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
    for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
      skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
    }
    skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
    return newTicks;
  }
  skip(ticks, newTicks, spacing);
  return newTicks;
}
function determineMaxTicks(scale) {
  const offset = scale.options.offset;
  const tickLength = scale._tickSize();
  const maxScale = scale._length / tickLength + (offset ? 0 : 1);
  const maxChart = scale._maxLength / tickLength;
  return Math.floor(Math.min(maxScale, maxChart));
}
function calculateSpacing(majorIndices, ticks, ticksLimit) {
  const evenMajorSpacing = getEvenSpacing(majorIndices);
  const spacing = ticks.length / ticksLimit;
  if (!evenMajorSpacing) {
    return Math.max(spacing, 1);
  }
  const factors = _factorize(evenMajorSpacing);
  for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
    const factor = factors[i];
    if (factor > spacing) {
      return factor;
    }
  }
  return Math.max(spacing, 1);
}
function getMajorIndices(ticks) {
  const result = [];
  let i, ilen;
  for (i = 0, ilen = ticks.length; i < ilen; i++) {
    if (ticks[i].major) {
      result.push(i);
    }
  }
  return result;
}
function skipMajors(ticks, newTicks, majorIndices, spacing) {
  let count = 0;
  let next = majorIndices[0];
  let i;
  spacing = Math.ceil(spacing);
  for (i = 0; i < ticks.length; i++) {
    if (i === next) {
      newTicks.push(ticks[i]);
      count++;
      next = majorIndices[count * spacing];
    }
  }
}
function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
  const start = valueOrDefault(majorStart, 0);
  const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
  let count = 0;
  let length, i, next;
  spacing = Math.ceil(spacing);
  if (majorEnd) {
    length = majorEnd - majorStart;
    spacing = length / Math.floor(length / spacing);
  }
  next = start;
  while (next < 0) {
    count++;
    next = Math.round(start + count * spacing);
  }
  for (i = Math.max(start, 0); i < end; i++) {
    if (i === next) {
      newTicks.push(ticks[i]);
      count++;
      next = Math.round(start + count * spacing);
    }
  }
}
function getEvenSpacing(arr) {
  const len = arr.length;
  let i, diff;
  if (len < 2) {
    return false;
  }
  for (diff = arr[0], i = 1; i < len; ++i) {
    if (arr[i] - arr[i - 1] !== diff) {
      return false;
    }
  }
  return diff;
}
function sample(arr, numItems) {
  const result = [];
  const increment = arr.length / numItems;
  const len = arr.length;
  let i = 0;
  for (; i < len; i += increment) {
    result.push(arr[Math.floor(i)]);
  }
  return result;
}
function getPixelForGridLine(scale, index2, offsetGridLines) {
  const length = scale.ticks.length;
  const validIndex2 = Math.min(index2, length - 1);
  const start = scale._startPixel;
  const end = scale._endPixel;
  const epsilon = 1e-6;
  let lineValue = scale.getPixelForTick(validIndex2);
  let offset;
  if (offsetGridLines) {
    if (length === 1) {
      offset = Math.max(lineValue - start, end - lineValue);
    } else if (index2 === 0) {
      offset = (scale.getPixelForTick(1) - lineValue) / 2;
    } else {
      offset = (lineValue - scale.getPixelForTick(validIndex2 - 1)) / 2;
    }
    lineValue += validIndex2 < index2 ? offset : -offset;
    if (lineValue < start - epsilon || lineValue > end + epsilon) {
      return;
    }
  }
  return lineValue;
}
function garbageCollect(caches, length) {
  each(caches, (cache) => {
    const gc = cache.gc;
    const gcLen = gc.length / 2;
    let i;
    if (gcLen > length) {
      for (i = 0; i < gcLen; ++i) {
        delete cache.data[gc[i]];
      }
      gc.splice(0, gcLen);
    }
  });
}
function getTickMarkLength(options) {
  return options.drawTicks ? options.tickLength : 0;
}
function getTitleHeight(options, fallback) {
  if (!options.display) {
    return 0;
  }
  const font = toFont(options.font, fallback);
  const padding2 = toPadding(options.padding);
  const lines = isArray(options.text) ? options.text.length : 1;
  return lines * font.lineHeight + padding2.height;
}
function createScaleContext(parent, scale) {
  return createContext(parent, {
    scale,
    type: "scale"
  });
}
function createTickContext(parent, index2, tick) {
  return createContext(parent, {
    tick,
    index: index2,
    type: "tick"
  });
}
function titleAlign(align, position, reverse) {
  let ret = _toLeftRightCenter(align);
  if (reverse && position !== "right" || !reverse && position === "right") {
    ret = reverseAlign(ret);
  }
  return ret;
}
function titleArgs(scale, offset, position, align) {
  const { top, left, bottom, right, chart } = scale;
  const { chartArea, scales: scales2 } = chart;
  let rotation = 0;
  let maxWidth, titleX, titleY;
  const height = bottom - top;
  const width = right - left;
  if (scale.isHorizontal()) {
    titleX = _alignStartEnd(align, left, right);
    if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      titleY = scales2[positionAxisID].getPixelForValue(value) + height - offset;
    } else if (position === "center") {
      titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
    } else {
      titleY = offsetFromEdge(scale, position, offset);
    }
    maxWidth = right - left;
  } else {
    if (isObject(position)) {
      const positionAxisID = Object.keys(position)[0];
      const value = position[positionAxisID];
      titleX = scales2[positionAxisID].getPixelForValue(value) - width + offset;
    } else if (position === "center") {
      titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
    } else {
      titleX = offsetFromEdge(scale, position, offset);
    }
    titleY = _alignStartEnd(align, bottom, top);
    rotation = position === "left" ? -HALF_PI : HALF_PI;
  }
  return {
    titleX,
    titleY,
    maxWidth,
    rotation
  };
}
function registerDefaults(item, scope, parentScope) {
  const itemDefaults = merge(/* @__PURE__ */ Object.create(null), [
    parentScope ? defaults.get(parentScope) : {},
    defaults.get(scope),
    item.defaults
  ]);
  defaults.set(scope, itemDefaults);
  if (item.defaultRoutes) {
    routeDefaults(scope, item.defaultRoutes);
  }
  if (item.descriptors) {
    defaults.describe(scope, item.descriptors);
  }
}
function routeDefaults(scope, routes) {
  Object.keys(routes).forEach((property) => {
    const propertyParts = property.split(".");
    const sourceName = propertyParts.pop();
    const sourceScope = [
      scope
    ].concat(propertyParts).join(".");
    const parts = routes[property].split(".");
    const targetName = parts.pop();
    const targetScope = parts.join(".");
    defaults.route(sourceScope, sourceName, targetScope, targetName);
  });
}
function isIChartComponent(proto) {
  return "id" in proto && "defaults" in proto;
}
function allPlugins(config) {
  const localIds = {};
  const plugins2 = [];
  const keys = Object.keys(registry.plugins.items);
  for (let i = 0; i < keys.length; i++) {
    plugins2.push(registry.getPlugin(keys[i]));
  }
  const local2 = config.plugins || [];
  for (let i = 0; i < local2.length; i++) {
    const plugin = local2[i];
    if (plugins2.indexOf(plugin) === -1) {
      plugins2.push(plugin);
      localIds[plugin.id] = true;
    }
  }
  return {
    plugins: plugins2,
    localIds
  };
}
function getOpts(options, all) {
  if (!all && options === false) {
    return null;
  }
  if (options === true) {
    return {};
  }
  return options;
}
function createDescriptors(chart, { plugins: plugins2, localIds }, options, all) {
  const result = [];
  const context = chart.getContext();
  for (const plugin of plugins2) {
    const id = plugin.id;
    const opts = getOpts(options[id], all);
    if (opts === null) {
      continue;
    }
    result.push({
      plugin,
      options: pluginOpts(chart.config, {
        plugin,
        local: localIds[id]
      }, opts, context)
    });
  }
  return result;
}
function pluginOpts(config, { plugin, local: local2 }, opts, context) {
  const keys = config.pluginScopeKeys(plugin);
  const scopes = config.getOptionScopes(opts, keys);
  if (local2 && plugin.defaults) {
    scopes.push(plugin.defaults);
  }
  return config.createResolver(scopes, context, [
    ""
  ], {
    scriptable: false,
    indexable: false,
    allKeys: true
  });
}
function getIndexAxis(type, options) {
  const datasetDefaults = defaults.datasets[type] || {};
  const datasetOptions = (options.datasets || {})[type] || {};
  return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || "x";
}
function getAxisFromDefaultScaleID(id, indexAxis) {
  let axis = id;
  if (id === "_index_") {
    axis = indexAxis;
  } else if (id === "_value_") {
    axis = indexAxis === "x" ? "y" : "x";
  }
  return axis;
}
function getDefaultScaleIDFromAxis(axis, indexAxis) {
  return axis === indexAxis ? "_index_" : "_value_";
}
function idMatchesAxis(id) {
  if (id === "x" || id === "y" || id === "r") {
    return id;
  }
}
function axisFromPosition(position) {
  if (position === "top" || position === "bottom") {
    return "x";
  }
  if (position === "left" || position === "right") {
    return "y";
  }
}
function determineAxis(id, ...scaleOptions) {
  if (idMatchesAxis(id)) {
    return id;
  }
  for (const opts of scaleOptions) {
    const axis = opts.axis || axisFromPosition(opts.position) || id.length > 1 && idMatchesAxis(id[0].toLowerCase());
    if (axis) {
      return axis;
    }
  }
  throw new Error(`Cannot determine type of '${id}' axis. Please provide 'axis' or 'position' option.`);
}
function getAxisFromDataset(id, axis, dataset) {
  if (dataset[axis + "AxisID"] === id) {
    return {
      axis
    };
  }
}
function retrieveAxisFromDatasets(id, config) {
  if (config.data && config.data.datasets) {
    const boundDs = config.data.datasets.filter((d) => d.xAxisID === id || d.yAxisID === id);
    if (boundDs.length) {
      return getAxisFromDataset(id, "x", boundDs[0]) || getAxisFromDataset(id, "y", boundDs[0]);
    }
  }
  return {};
}
function mergeScaleConfig(config, options) {
  const chartDefaults = overrides[config.type] || {
    scales: {}
  };
  const configScales = options.scales || {};
  const chartIndexAxis = getIndexAxis(config.type, options);
  const scales2 = /* @__PURE__ */ Object.create(null);
  Object.keys(configScales).forEach((id) => {
    const scaleConf = configScales[id];
    if (!isObject(scaleConf)) {
      return console.error(`Invalid scale configuration for scale: ${id}`);
    }
    if (scaleConf._proxy) {
      return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
    }
    const axis = determineAxis(id, scaleConf, retrieveAxisFromDatasets(id, config), defaults.scales[scaleConf.type]);
    const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
    const defaultScaleOptions = chartDefaults.scales || {};
    scales2[id] = mergeIf(/* @__PURE__ */ Object.create(null), [
      {
        axis
      },
      scaleConf,
      defaultScaleOptions[axis],
      defaultScaleOptions[defaultId]
    ]);
  });
  config.data.datasets.forEach((dataset) => {
    const type = dataset.type || config.type;
    const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
    const datasetDefaults = overrides[type] || {};
    const defaultScaleOptions = datasetDefaults.scales || {};
    Object.keys(defaultScaleOptions).forEach((defaultID) => {
      const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
      const id = dataset[axis + "AxisID"] || axis;
      scales2[id] = scales2[id] || /* @__PURE__ */ Object.create(null);
      mergeIf(scales2[id], [
        {
          axis
        },
        configScales[id],
        defaultScaleOptions[defaultID]
      ]);
    });
  });
  Object.keys(scales2).forEach((key) => {
    const scale = scales2[key];
    mergeIf(scale, [
      defaults.scales[scale.type],
      defaults.scale
    ]);
  });
  return scales2;
}
function initOptions(config) {
  const options = config.options || (config.options = {});
  options.plugins = valueOrDefault(options.plugins, {});
  options.scales = mergeScaleConfig(config, options);
}
function initData(data) {
  data = data || {};
  data.datasets = data.datasets || [];
  data.labels = data.labels || [];
  return data;
}
function initConfig(config) {
  config = config || {};
  config.data = initData(config.data);
  initOptions(config);
  return config;
}
function cachedKeys(cacheKey, generate) {
  let keys = keyCache.get(cacheKey);
  if (!keys) {
    keys = generate();
    keyCache.set(cacheKey, keys);
    keysCached.add(keys);
  }
  return keys;
}
function getResolver(resolverCache, scopes, prefixes) {
  let cache = resolverCache.get(scopes);
  if (!cache) {
    cache = /* @__PURE__ */ new Map();
    resolverCache.set(scopes, cache);
  }
  const cacheKey = prefixes.join();
  let cached = cache.get(cacheKey);
  if (!cached) {
    const resolver = _createResolver(scopes, prefixes);
    cached = {
      resolver,
      subPrefixes: prefixes.filter((p) => !p.toLowerCase().includes("hover"))
    };
    cache.set(cacheKey, cached);
  }
  return cached;
}
function needContext(proxy, names2) {
  const { isScriptable, isIndexable } = _descriptors(proxy);
  for (const prop of names2) {
    const scriptable = isScriptable(prop);
    const indexable = isIndexable(prop);
    const value = (indexable || scriptable) && proxy[prop];
    if (scriptable && (isFunction(value) || hasFunction(value)) || indexable && isArray(value)) {
      return true;
    }
  }
  return false;
}
function positionIsHorizontal(position, axis) {
  return position === "top" || position === "bottom" || KNOWN_POSITIONS.indexOf(position) === -1 && axis === "x";
}
function compare2Level(l1, l2) {
  return function(a, b) {
    return a[l1] === b[l1] ? a[l2] - b[l2] : a[l1] - b[l1];
  };
}
function onAnimationsComplete(context) {
  const chart = context.chart;
  const animationOptions = chart.options.animation;
  chart.notifyPlugins("afterRender");
  callback(animationOptions && animationOptions.onComplete, [
    context
  ], chart);
}
function onAnimationProgress(context) {
  const chart = context.chart;
  const animationOptions = chart.options.animation;
  callback(animationOptions && animationOptions.onProgress, [
    context
  ], chart);
}
function getCanvas(item) {
  if (_isDomSupported() && typeof item === "string") {
    item = document.getElementById(item);
  } else if (item && item.length) {
    item = item[0];
  }
  if (item && item.canvas) {
    item = item.canvas;
  }
  return item;
}
function moveNumericKeys(obj, start, move) {
  const keys = Object.keys(obj);
  for (const key of keys) {
    const intKey = +key;
    if (intKey >= start) {
      const value = obj[key];
      delete obj[key];
      if (move > 0 || intKey > start) {
        obj[intKey + move] = value;
      }
    }
  }
}
function determineLastEvent(e, lastEvent, inChartArea, isClick) {
  if (!inChartArea || e.type === "mouseout") {
    return null;
  }
  if (isClick) {
    return lastEvent;
  }
  return e;
}
function invalidatePlugins() {
  return each(Chart.instances, (chart) => chart._plugins.invalidate());
}
function clipSelf(ctx, element, endAngle) {
  const { startAngle, x, y, outerRadius, innerRadius, options } = element;
  const { borderWidth, borderJoinStyle } = options;
  const outerAngleClip = Math.min(borderWidth / outerRadius, _normalizeAngle(startAngle - endAngle));
  ctx.beginPath();
  ctx.arc(x, y, outerRadius - borderWidth / 2, startAngle + outerAngleClip / 2, endAngle - outerAngleClip / 2);
  if (innerRadius > 0) {
    const innerAngleClip = Math.min(borderWidth / innerRadius, _normalizeAngle(startAngle - endAngle));
    ctx.arc(x, y, innerRadius + borderWidth / 2, endAngle - innerAngleClip / 2, startAngle + innerAngleClip / 2, true);
  } else {
    const clipWidth = Math.min(borderWidth / 2, outerRadius * _normalizeAngle(startAngle - endAngle));
    if (borderJoinStyle === "round") {
      ctx.arc(x, y, clipWidth, endAngle - PI / 2, startAngle + PI / 2, true);
    } else if (borderJoinStyle === "bevel") {
      const r = 2 * clipWidth * clipWidth;
      const endX = -r * Math.cos(endAngle + PI / 2) + x;
      const endY = -r * Math.sin(endAngle + PI / 2) + y;
      const startX = r * Math.cos(startAngle + PI / 2) + x;
      const startY = r * Math.sin(startAngle + PI / 2) + y;
      ctx.lineTo(endX, endY);
      ctx.lineTo(startX, startY);
    }
  }
  ctx.closePath();
  ctx.moveTo(0, 0);
  ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clip("evenodd");
}
function clipArc(ctx, element, endAngle) {
  const { startAngle, pixelMargin, x, y, outerRadius, innerRadius } = element;
  let angleMargin = pixelMargin / outerRadius;
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
  if (innerRadius > pixelMargin) {
    angleMargin = pixelMargin / innerRadius;
    ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
  } else {
    ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
  }
  ctx.closePath();
  ctx.clip();
}
function toRadiusCorners(value) {
  return _readValueToProps(value, [
    "outerStart",
    "outerEnd",
    "innerStart",
    "innerEnd"
  ]);
}
function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
  const o = toRadiusCorners(arc.options.borderRadius);
  const halfThickness = (outerRadius - innerRadius) / 2;
  const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
  const computeOuterLimit = (val) => {
    const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
    return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
  };
  return {
    outerStart: computeOuterLimit(o.outerStart),
    outerEnd: computeOuterLimit(o.outerEnd),
    innerStart: _limitValue(o.innerStart, 0, innerLimit),
    innerEnd: _limitValue(o.innerEnd, 0, innerLimit)
  };
}
function rThetaToXY(r, theta, x, y) {
  return {
    x: x + r * Math.cos(theta),
    y: y + r * Math.sin(theta)
  };
}
function pathArc(ctx, element, offset, spacing, end, circular) {
  const { x, y, startAngle: start, pixelMargin, innerRadius: innerR } = element;
  const outerRadius = Math.max(element.outerRadius + spacing + offset - pixelMargin, 0);
  const innerRadius = innerR > 0 ? innerR + spacing + offset + pixelMargin : 0;
  let spacingOffset = 0;
  const alpha3 = end - start;
  if (spacing) {
    const noSpacingInnerRadius = innerR > 0 ? innerR - spacing : 0;
    const noSpacingOuterRadius = outerRadius > 0 ? outerRadius - spacing : 0;
    const avNogSpacingRadius = (noSpacingInnerRadius + noSpacingOuterRadius) / 2;
    const adjustedAngle = avNogSpacingRadius !== 0 ? alpha3 * avNogSpacingRadius / (avNogSpacingRadius + spacing) : alpha3;
    spacingOffset = (alpha3 - adjustedAngle) / 2;
  }
  const beta = Math.max(1e-3, alpha3 * outerRadius - offset / PI) / outerRadius;
  const angleOffset = (alpha3 - beta) / 2;
  const startAngle = start + angleOffset + spacingOffset;
  const endAngle = end - angleOffset - spacingOffset;
  const { outerStart, outerEnd, innerStart, innerEnd } = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
  const outerStartAdjustedRadius = outerRadius - outerStart;
  const outerEndAdjustedRadius = outerRadius - outerEnd;
  const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
  const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
  const innerStartAdjustedRadius = innerRadius + innerStart;
  const innerEndAdjustedRadius = innerRadius + innerEnd;
  const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
  const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
  ctx.beginPath();
  if (circular) {
    const outerMidAdjustedAngle = (outerStartAdjustedAngle + outerEndAdjustedAngle) / 2;
    ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerMidAdjustedAngle);
    ctx.arc(x, y, outerRadius, outerMidAdjustedAngle, outerEndAdjustedAngle);
    if (outerEnd > 0) {
      const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
    }
    const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
    ctx.lineTo(p4.x, p4.y);
    if (innerEnd > 0) {
      const pCenter = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
    }
    const innerMidAdjustedAngle = (endAngle - innerEnd / innerRadius + (startAngle + innerStart / innerRadius)) / 2;
    ctx.arc(x, y, innerRadius, endAngle - innerEnd / innerRadius, innerMidAdjustedAngle, true);
    ctx.arc(x, y, innerRadius, innerMidAdjustedAngle, startAngle + innerStart / innerRadius, true);
    if (innerStart > 0) {
      const pCenter = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
    }
    const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
    ctx.lineTo(p8.x, p8.y);
    if (outerStart > 0) {
      const pCenter = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
    }
  } else {
    ctx.moveTo(x, y);
    const outerStartX = Math.cos(outerStartAdjustedAngle) * outerRadius + x;
    const outerStartY = Math.sin(outerStartAdjustedAngle) * outerRadius + y;
    ctx.lineTo(outerStartX, outerStartY);
    const outerEndX = Math.cos(outerEndAdjustedAngle) * outerRadius + x;
    const outerEndY = Math.sin(outerEndAdjustedAngle) * outerRadius + y;
    ctx.lineTo(outerEndX, outerEndY);
  }
  ctx.closePath();
}
function drawArc(ctx, element, offset, spacing, circular) {
  const { fullCircles, startAngle, circumference } = element;
  let endAngle = element.endAngle;
  if (fullCircles) {
    pathArc(ctx, element, offset, spacing, endAngle, circular);
    for (let i = 0; i < fullCircles; ++i) {
      ctx.fill();
    }
    if (!isNaN(circumference)) {
      endAngle = startAngle + (circumference % TAU || TAU);
    }
  }
  pathArc(ctx, element, offset, spacing, endAngle, circular);
  ctx.fill();
  return endAngle;
}
function drawBorder(ctx, element, offset, spacing, circular) {
  const { fullCircles, startAngle, circumference, options } = element;
  const { borderWidth, borderJoinStyle, borderDash, borderDashOffset, borderRadius } = options;
  const inner = options.borderAlign === "inner";
  if (!borderWidth) {
    return;
  }
  ctx.setLineDash(borderDash || []);
  ctx.lineDashOffset = borderDashOffset;
  if (inner) {
    ctx.lineWidth = borderWidth * 2;
    ctx.lineJoin = borderJoinStyle || "round";
  } else {
    ctx.lineWidth = borderWidth;
    ctx.lineJoin = borderJoinStyle || "bevel";
  }
  let endAngle = element.endAngle;
  if (fullCircles) {
    pathArc(ctx, element, offset, spacing, endAngle, circular);
    for (let i = 0; i < fullCircles; ++i) {
      ctx.stroke();
    }
    if (!isNaN(circumference)) {
      endAngle = startAngle + (circumference % TAU || TAU);
    }
  }
  if (inner) {
    clipArc(ctx, element, endAngle);
  }
  if (options.selfJoin && endAngle - startAngle >= PI && borderRadius === 0 && borderJoinStyle !== "miter") {
    clipSelf(ctx, element, endAngle);
  }
  if (!fullCircles) {
    pathArc(ctx, element, offset, spacing, endAngle, circular);
    ctx.stroke();
  }
}
function setStyle(ctx, options, style = options) {
  ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
  ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
  ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
  ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
  ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
  ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
}
function lineTo(ctx, previous, target) {
  ctx.lineTo(target.x, target.y);
}
function getLineMethod(options) {
  if (options.stepped) {
    return _steppedLineTo;
  }
  if (options.tension || options.cubicInterpolationMode === "monotone") {
    return _bezierCurveTo;
  }
  return lineTo;
}
function pathVars(points, segment, params = {}) {
  const count = points.length;
  const { start: paramsStart = 0, end: paramsEnd = count - 1 } = params;
  const { start: segmentStart, end: segmentEnd } = segment;
  const start = Math.max(paramsStart, segmentStart);
  const end = Math.min(paramsEnd, segmentEnd);
  const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
  return {
    count,
    start,
    loop: segment.loop,
    ilen: end < start && !outside ? count + end - start : end - start
  };
}
function pathSegment(ctx, line, segment, params) {
  const { points, options } = line;
  const { count, start, loop, ilen } = pathVars(points, segment, params);
  const lineMethod = getLineMethod(options);
  let { move = true, reverse } = params || {};
  let i, point, prev;
  for (i = 0; i <= ilen; ++i) {
    point = points[(start + (reverse ? ilen - i : i)) % count];
    if (point.skip) {
      continue;
    } else if (move) {
      ctx.moveTo(point.x, point.y);
      move = false;
    } else {
      lineMethod(ctx, prev, point, reverse, options.stepped);
    }
    prev = point;
  }
  if (loop) {
    point = points[(start + (reverse ? ilen : 0)) % count];
    lineMethod(ctx, prev, point, reverse, options.stepped);
  }
  return !!loop;
}
function fastPathSegment(ctx, line, segment, params) {
  const points = line.points;
  const { count, start, ilen } = pathVars(points, segment, params);
  const { move = true, reverse } = params || {};
  let avgX = 0;
  let countX = 0;
  let i, point, prevX, minY, maxY, lastY;
  const pointIndex = (index2) => (start + (reverse ? ilen - index2 : index2)) % count;
  const drawX = () => {
    if (minY !== maxY) {
      ctx.lineTo(avgX, maxY);
      ctx.lineTo(avgX, minY);
      ctx.lineTo(avgX, lastY);
    }
  };
  if (move) {
    point = points[pointIndex(0)];
    ctx.moveTo(point.x, point.y);
  }
  for (i = 0; i <= ilen; ++i) {
    point = points[pointIndex(i)];
    if (point.skip) {
      continue;
    }
    const x = point.x;
    const y = point.y;
    const truncX = x | 0;
    if (truncX === prevX) {
      if (y < minY) {
        minY = y;
      } else if (y > maxY) {
        maxY = y;
      }
      avgX = (countX * avgX + x) / ++countX;
    } else {
      drawX();
      ctx.lineTo(x, y);
      prevX = truncX;
      countX = 0;
      minY = maxY = y;
    }
    lastY = y;
  }
  drawX();
}
function _getSegmentMethod(line) {
  const opts = line.options;
  const borderDash = opts.borderDash && opts.borderDash.length;
  const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== "monotone" && !opts.stepped && !borderDash;
  return useFastPath ? fastPathSegment : pathSegment;
}
function _getInterpolationMethod(options) {
  if (options.stepped) {
    return _steppedInterpolation;
  }
  if (options.tension || options.cubicInterpolationMode === "monotone") {
    return _bezierInterpolation;
  }
  return _pointInLine;
}
function strokePathWithCache(ctx, line, start, count) {
  let path = line._path;
  if (!path) {
    path = line._path = new Path2D();
    if (line.path(path, start, count)) {
      path.closePath();
    }
  }
  setStyle(ctx, line.options);
  ctx.stroke(path);
}
function strokePathDirect(ctx, line, start, count) {
  const { segments, options } = line;
  const segmentMethod = _getSegmentMethod(line);
  for (const segment of segments) {
    setStyle(ctx, options, segment.style);
    ctx.beginPath();
    if (segmentMethod(ctx, line, segment, {
      start,
      end: start + count - 1
    })) {
      ctx.closePath();
    }
    ctx.stroke();
  }
}
function draw(ctx, line, start, count) {
  if (usePath2D && !line.options.segment) {
    strokePathWithCache(ctx, line, start, count);
  } else {
    strokePathDirect(ctx, line, start, count);
  }
}
function inRange$1(el, pos, axis, useFinalPosition) {
  const options = el.options;
  const { [axis]: value } = el.getProps([
    axis
  ], useFinalPosition);
  return Math.abs(pos - value) < options.radius + options.hitRadius;
}
function getBarBounds(bar, useFinalPosition) {
  const { x, y, base, width, height } = bar.getProps([
    "x",
    "y",
    "base",
    "width",
    "height"
  ], useFinalPosition);
  let left, right, top, bottom, half;
  if (bar.horizontal) {
    half = height / 2;
    left = Math.min(x, base);
    right = Math.max(x, base);
    top = y - half;
    bottom = y + half;
  } else {
    half = width / 2;
    left = x - half;
    right = x + half;
    top = Math.min(y, base);
    bottom = Math.max(y, base);
  }
  return {
    left,
    top,
    right,
    bottom
  };
}
function skipOrLimit(skip2, value, min, max) {
  return skip2 ? 0 : _limitValue(value, min, max);
}
function parseBorderWidth(bar, maxW, maxH) {
  const value = bar.options.borderWidth;
  const skip2 = bar.borderSkipped;
  const o = toTRBL(value);
  return {
    t: skipOrLimit(skip2.top, o.top, 0, maxH),
    r: skipOrLimit(skip2.right, o.right, 0, maxW),
    b: skipOrLimit(skip2.bottom, o.bottom, 0, maxH),
    l: skipOrLimit(skip2.left, o.left, 0, maxW)
  };
}
function parseBorderRadius(bar, maxW, maxH) {
  const { enableBorderRadius } = bar.getProps([
    "enableBorderRadius"
  ]);
  const value = bar.options.borderRadius;
  const o = toTRBLCorners(value);
  const maxR = Math.min(maxW, maxH);
  const skip2 = bar.borderSkipped;
  const enableBorder = enableBorderRadius || isObject(value);
  return {
    topLeft: skipOrLimit(!enableBorder || skip2.top || skip2.left, o.topLeft, 0, maxR),
    topRight: skipOrLimit(!enableBorder || skip2.top || skip2.right, o.topRight, 0, maxR),
    bottomLeft: skipOrLimit(!enableBorder || skip2.bottom || skip2.left, o.bottomLeft, 0, maxR),
    bottomRight: skipOrLimit(!enableBorder || skip2.bottom || skip2.right, o.bottomRight, 0, maxR)
  };
}
function boundingRects(bar) {
  const bounds = getBarBounds(bar);
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const border = parseBorderWidth(bar, width / 2, height / 2);
  const radius = parseBorderRadius(bar, width / 2, height / 2);
  return {
    outer: {
      x: bounds.left,
      y: bounds.top,
      w: width,
      h: height,
      radius
    },
    inner: {
      x: bounds.left + border.l,
      y: bounds.top + border.t,
      w: width - border.l - border.r,
      h: height - border.t - border.b,
      radius: {
        topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
        topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
        bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
        bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r))
      }
    }
  };
}
function inRange(bar, x, y, useFinalPosition) {
  const skipX = x === null;
  const skipY = y === null;
  const skipBoth = skipX && skipY;
  const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
  return bounds && (skipX || _isBetween(x, bounds.left, bounds.right)) && (skipY || _isBetween(y, bounds.top, bounds.bottom));
}
function hasRadius(radius) {
  return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
}
function addNormalRectPath(ctx, rect) {
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
}
function inflateRect(rect, amount, refRect = {}) {
  const x = rect.x !== refRect.x ? -amount : 0;
  const y = rect.y !== refRect.y ? -amount : 0;
  const w = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x;
  const h3 = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y;
  return {
    x: rect.x + x,
    y: rect.y + y,
    w: rect.w + w,
    h: rect.h + h3,
    radius: rect.radius
  };
}
function getBorderColor(i) {
  return BORDER_COLORS[i % BORDER_COLORS.length];
}
function getBackgroundColor(i) {
  return BACKGROUND_COLORS[i % BACKGROUND_COLORS.length];
}
function colorizeDefaultDataset(dataset, i) {
  dataset.borderColor = getBorderColor(i);
  dataset.backgroundColor = getBackgroundColor(i);
  return ++i;
}
function colorizeDoughnutDataset(dataset, i) {
  dataset.backgroundColor = dataset.data.map(() => getBorderColor(i++));
  return i;
}
function colorizePolarAreaDataset(dataset, i) {
  dataset.backgroundColor = dataset.data.map(() => getBackgroundColor(i++));
  return i;
}
function getColorizer(chart) {
  let i = 0;
  return (dataset, datasetIndex) => {
    const controller = chart.getDatasetMeta(datasetIndex).controller;
    if (controller instanceof DoughnutController) {
      i = colorizeDoughnutDataset(dataset, i);
    } else if (controller instanceof PolarAreaController) {
      i = colorizePolarAreaDataset(dataset, i);
    } else if (controller) {
      i = colorizeDefaultDataset(dataset, i);
    }
  };
}
function containsColorsDefinitions(descriptors2) {
  let k;
  for (k in descriptors2) {
    if (descriptors2[k].borderColor || descriptors2[k].backgroundColor) {
      return true;
    }
  }
  return false;
}
function containsColorsDefinition(descriptor) {
  return descriptor && (descriptor.borderColor || descriptor.backgroundColor);
}
function containsDefaultColorsDefenitions() {
  return defaults.borderColor !== "rgba(0,0,0,0.1)" || defaults.backgroundColor !== "rgba(0,0,0,0.1)";
}
function lttbDecimation(data, start, count, availableWidth, options) {
  const samples = options.samples || availableWidth;
  if (samples >= count) {
    return data.slice(start, start + count);
  }
  const decimated = [];
  const bucketWidth = (count - 2) / (samples - 2);
  let sampledIndex = 0;
  const endIndex = start + count - 1;
  let a = start;
  let i, maxAreaPoint, maxArea, area, nextA;
  decimated[sampledIndex++] = data[a];
  for (i = 0; i < samples - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    let j;
    const avgRangeStart = Math.floor((i + 1) * bucketWidth) + 1 + start;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketWidth) + 1, count) + start;
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;
    const rangeOffs = Math.floor(i * bucketWidth) + 1 + start;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketWidth) + 1, count) + start;
    const { x: pointAx, y: pointAy } = data[a];
    maxArea = area = -1;
    for (j = rangeOffs; j < rangeTo; j++) {
      area = 0.5 * Math.abs((pointAx - avgX) * (data[j].y - pointAy) - (pointAx - data[j].x) * (avgY - pointAy));
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = data[j];
        nextA = j;
      }
    }
    decimated[sampledIndex++] = maxAreaPoint;
    a = nextA;
  }
  decimated[sampledIndex++] = data[endIndex];
  return decimated;
}
function minMaxDecimation(data, start, count, availableWidth) {
  let avgX = 0;
  let countX = 0;
  let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
  const decimated = [];
  const endIndex = start + count - 1;
  const xMin = data[start].x;
  const xMax = data[endIndex].x;
  const dx = xMax - xMin;
  for (i = start; i < start + count; ++i) {
    point = data[i];
    x = (point.x - xMin) / dx * availableWidth;
    y = point.y;
    const truncX = x | 0;
    if (truncX === prevX) {
      if (y < minY) {
        minY = y;
        minIndex = i;
      } else if (y > maxY) {
        maxY = y;
        maxIndex = i;
      }
      avgX = (countX * avgX + point.x) / ++countX;
    } else {
      const lastIndex = i - 1;
      if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) {
        const intermediateIndex1 = Math.min(minIndex, maxIndex);
        const intermediateIndex2 = Math.max(minIndex, maxIndex);
        if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) {
          decimated.push({
            ...data[intermediateIndex1],
            x: avgX
          });
        }
        if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
          decimated.push({
            ...data[intermediateIndex2],
            x: avgX
          });
        }
      }
      if (i > 0 && lastIndex !== startIndex) {
        decimated.push(data[lastIndex]);
      }
      decimated.push(point);
      prevX = truncX;
      countX = 0;
      minY = maxY = y;
      minIndex = maxIndex = startIndex = i;
    }
  }
  return decimated;
}
function cleanDecimatedDataset(dataset) {
  if (dataset._decimated) {
    const data = dataset._data;
    delete dataset._decimated;
    delete dataset._data;
    Object.defineProperty(dataset, "data", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: data
    });
  }
}
function cleanDecimatedData(chart) {
  chart.data.datasets.forEach((dataset) => {
    cleanDecimatedDataset(dataset);
  });
}
function getStartAndCountOfVisiblePointsSimplified(meta, points) {
  const pointCount = points.length;
  let start = 0;
  let count;
  const { iScale } = meta;
  const { min, max, minDefined, maxDefined } = iScale.getUserBounds();
  if (minDefined) {
    start = _limitValue(_lookupByKey(points, iScale.axis, min).lo, 0, pointCount - 1);
  }
  if (maxDefined) {
    count = _limitValue(_lookupByKey(points, iScale.axis, max).hi + 1, start, pointCount) - start;
  } else {
    count = pointCount - start;
  }
  return {
    start,
    count
  };
}
function _segments(line, target, property) {
  const segments = line.segments;
  const points = line.points;
  const tpoints = target.points;
  const parts = [];
  for (const segment of segments) {
    let { start, end } = segment;
    end = _findSegmentEnd(start, end, points);
    const bounds = _getBounds(property, points[start], points[end], segment.loop);
    if (!target.segments) {
      parts.push({
        source: segment,
        target: bounds,
        start: points[start],
        end: points[end]
      });
      continue;
    }
    const targetSegments = _boundSegments(target, bounds);
    for (const tgt of targetSegments) {
      const subBounds = _getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
      const fillSources = _boundSegment(segment, points, subBounds);
      for (const fillSource of fillSources) {
        parts.push({
          source: fillSource,
          target: tgt,
          start: {
            [property]: _getEdge(bounds, subBounds, "start", Math.max)
          },
          end: {
            [property]: _getEdge(bounds, subBounds, "end", Math.min)
          }
        });
      }
    }
  }
  return parts;
}
function _getBounds(property, first, last, loop) {
  if (loop) {
    return;
  }
  let start = first[property];
  let end = last[property];
  if (property === "angle") {
    start = _normalizeAngle(start);
    end = _normalizeAngle(end);
  }
  return {
    property,
    start,
    end
  };
}
function _pointsFromSegments(boundary, line) {
  const { x = null, y = null } = boundary || {};
  const linePoints = line.points;
  const points = [];
  line.segments.forEach(({ start, end }) => {
    end = _findSegmentEnd(start, end, linePoints);
    const first = linePoints[start];
    const last = linePoints[end];
    if (y !== null) {
      points.push({
        x: first.x,
        y
      });
      points.push({
        x: last.x,
        y
      });
    } else if (x !== null) {
      points.push({
        x,
        y: first.y
      });
      points.push({
        x,
        y: last.y
      });
    }
  });
  return points;
}
function _findSegmentEnd(start, end, points) {
  for (; end > start; end--) {
    const point = points[end];
    if (!isNaN(point.x) && !isNaN(point.y)) {
      break;
    }
  }
  return end;
}
function _getEdge(a, b, prop, fn) {
  if (a && b) {
    return fn(a[prop], b[prop]);
  }
  return a ? a[prop] : b ? b[prop] : 0;
}
function _createBoundaryLine(boundary, line) {
  let points = [];
  let _loop = false;
  if (isArray(boundary)) {
    _loop = true;
    points = boundary;
  } else {
    points = _pointsFromSegments(boundary, line);
  }
  return points.length ? new LineElement({
    points,
    options: {
      tension: 0
    },
    _loop,
    _fullLoop: _loop
  }) : null;
}
function _shouldApplyFill(source) {
  return source && source.fill !== false;
}
function _resolveTarget(sources, index2, propagate) {
  const source = sources[index2];
  let fill2 = source.fill;
  const visited = [
    index2
  ];
  let target;
  if (!propagate) {
    return fill2;
  }
  while (fill2 !== false && visited.indexOf(fill2) === -1) {
    if (!isNumberFinite(fill2)) {
      return fill2;
    }
    target = sources[fill2];
    if (!target) {
      return false;
    }
    if (target.visible) {
      return fill2;
    }
    visited.push(fill2);
    fill2 = target.fill;
  }
  return false;
}
function _decodeFill(line, index2, count) {
  const fill2 = parseFillOption(line);
  if (isObject(fill2)) {
    return isNaN(fill2.value) ? false : fill2;
  }
  let target = parseFloat(fill2);
  if (isNumberFinite(target) && Math.floor(target) === target) {
    return decodeTargetIndex(fill2[0], index2, target, count);
  }
  return [
    "origin",
    "start",
    "end",
    "stack",
    "shape"
  ].indexOf(fill2) >= 0 && fill2;
}
function decodeTargetIndex(firstCh, index2, target, count) {
  if (firstCh === "-" || firstCh === "+") {
    target = index2 + target;
  }
  if (target === index2 || target < 0 || target >= count) {
    return false;
  }
  return target;
}
function _getTargetPixel(fill2, scale) {
  let pixel = null;
  if (fill2 === "start") {
    pixel = scale.bottom;
  } else if (fill2 === "end") {
    pixel = scale.top;
  } else if (isObject(fill2)) {
    pixel = scale.getPixelForValue(fill2.value);
  } else if (scale.getBasePixel) {
    pixel = scale.getBasePixel();
  }
  return pixel;
}
function _getTargetValue(fill2, scale, startValue) {
  let value;
  if (fill2 === "start") {
    value = startValue;
  } else if (fill2 === "end") {
    value = scale.options.reverse ? scale.min : scale.max;
  } else if (isObject(fill2)) {
    value = fill2.value;
  } else {
    value = scale.getBaseValue();
  }
  return value;
}
function parseFillOption(line) {
  const options = line.options;
  const fillOption = options.fill;
  let fill2 = valueOrDefault(fillOption && fillOption.target, fillOption);
  if (fill2 === void 0) {
    fill2 = !!options.backgroundColor;
  }
  if (fill2 === false || fill2 === null) {
    return false;
  }
  if (fill2 === true) {
    return "origin";
  }
  return fill2;
}
function _buildStackLine(source) {
  const { scale, index: index2, line } = source;
  const points = [];
  const segments = line.segments;
  const sourcePoints = line.points;
  const linesBelow = getLinesBelow(scale, index2);
  linesBelow.push(_createBoundaryLine({
    x: null,
    y: scale.bottom
  }, line));
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    for (let j = segment.start; j <= segment.end; j++) {
      addPointsBelow(points, sourcePoints[j], linesBelow);
    }
  }
  return new LineElement({
    points,
    options: {}
  });
}
function getLinesBelow(scale, index2) {
  const below = [];
  const metas = scale.getMatchingVisibleMetas("line");
  for (let i = 0; i < metas.length; i++) {
    const meta = metas[i];
    if (meta.index === index2) {
      break;
    }
    if (!meta.hidden) {
      below.unshift(meta.dataset);
    }
  }
  return below;
}
function addPointsBelow(points, sourcePoint, linesBelow) {
  const postponed = [];
  for (let j = 0; j < linesBelow.length; j++) {
    const line = linesBelow[j];
    const { first, last, point } = findPoint(line, sourcePoint, "x");
    if (!point || first && last) {
      continue;
    }
    if (first) {
      postponed.unshift(point);
    } else {
      points.push(point);
      if (!last) {
        break;
      }
    }
  }
  points.push(...postponed);
}
function findPoint(line, sourcePoint, property) {
  const point = line.interpolate(sourcePoint, property);
  if (!point) {
    return {};
  }
  const pointValue = point[property];
  const segments = line.segments;
  const linePoints = line.points;
  let first = false;
  let last = false;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const firstValue = linePoints[segment.start][property];
    const lastValue = linePoints[segment.end][property];
    if (_isBetween(pointValue, firstValue, lastValue)) {
      first = pointValue === firstValue;
      last = pointValue === lastValue;
      break;
    }
  }
  return {
    first,
    last,
    point
  };
}
function _getTarget(source) {
  const { chart, fill: fill2, line } = source;
  if (isNumberFinite(fill2)) {
    return getLineByIndex(chart, fill2);
  }
  if (fill2 === "stack") {
    return _buildStackLine(source);
  }
  if (fill2 === "shape") {
    return true;
  }
  const boundary = computeBoundary(source);
  if (boundary instanceof simpleArc) {
    return boundary;
  }
  return _createBoundaryLine(boundary, line);
}
function getLineByIndex(chart, index2) {
  const meta = chart.getDatasetMeta(index2);
  const visible = meta && chart.isDatasetVisible(index2);
  return visible ? meta.dataset : null;
}
function computeBoundary(source) {
  const scale = source.scale || {};
  if (scale.getPointPositionForValue) {
    return computeCircularBoundary(source);
  }
  return computeLinearBoundary(source);
}
function computeLinearBoundary(source) {
  const { scale = {}, fill: fill2 } = source;
  const pixel = _getTargetPixel(fill2, scale);
  if (isNumberFinite(pixel)) {
    const horizontal = scale.isHorizontal();
    return {
      x: horizontal ? pixel : null,
      y: horizontal ? null : pixel
    };
  }
  return null;
}
function computeCircularBoundary(source) {
  const { scale, fill: fill2 } = source;
  const options = scale.options;
  const length = scale.getLabels().length;
  const start = options.reverse ? scale.max : scale.min;
  const value = _getTargetValue(fill2, scale, start);
  const target = [];
  if (options.grid.circular) {
    const center = scale.getPointPositionForValue(0, start);
    return new simpleArc({
      x: center.x,
      y: center.y,
      radius: scale.getDistanceFromCenterForValue(value)
    });
  }
  for (let i = 0; i < length; ++i) {
    target.push(scale.getPointPositionForValue(i, value));
  }
  return target;
}
function _drawfill(ctx, source, area) {
  const target = _getTarget(source);
  const { chart, index: index2, line, scale, axis } = source;
  const lineOpts = line.options;
  const fillOption = lineOpts.fill;
  const color2 = lineOpts.backgroundColor;
  const { above = color2, below = color2 } = fillOption || {};
  const meta = chart.getDatasetMeta(index2);
  const clip = getDatasetClipArea(chart, meta);
  if (target && line.points.length) {
    clipArea(ctx, area);
    doFill(ctx, {
      line,
      target,
      above,
      below,
      area,
      scale,
      axis,
      clip
    });
    unclipArea(ctx);
  }
}
function doFill(ctx, cfg) {
  const { line, target, above, below, area, scale, clip } = cfg;
  const property = line._loop ? "angle" : cfg.axis;
  ctx.save();
  let fillColor = below;
  if (below !== above) {
    if (property === "x") {
      clipVertical(ctx, target, area.top);
      fill(ctx, {
        line,
        target,
        color: above,
        scale,
        property,
        clip
      });
      ctx.restore();
      ctx.save();
      clipVertical(ctx, target, area.bottom);
    } else if (property === "y") {
      clipHorizontal(ctx, target, area.left);
      fill(ctx, {
        line,
        target,
        color: below,
        scale,
        property,
        clip
      });
      ctx.restore();
      ctx.save();
      clipHorizontal(ctx, target, area.right);
      fillColor = above;
    }
  }
  fill(ctx, {
    line,
    target,
    color: fillColor,
    scale,
    property,
    clip
  });
  ctx.restore();
}
function clipVertical(ctx, target, clipY) {
  const { segments, points } = target;
  let first = true;
  let lineLoop = false;
  ctx.beginPath();
  for (const segment of segments) {
    const { start, end } = segment;
    const firstPoint = points[start];
    const lastPoint = points[_findSegmentEnd(start, end, points)];
    if (first) {
      ctx.moveTo(firstPoint.x, firstPoint.y);
      first = false;
    } else {
      ctx.lineTo(firstPoint.x, clipY);
      ctx.lineTo(firstPoint.x, firstPoint.y);
    }
    lineLoop = !!target.pathSegment(ctx, segment, {
      move: lineLoop
    });
    if (lineLoop) {
      ctx.closePath();
    } else {
      ctx.lineTo(lastPoint.x, clipY);
    }
  }
  ctx.lineTo(target.first().x, clipY);
  ctx.closePath();
  ctx.clip();
}
function clipHorizontal(ctx, target, clipX) {
  const { segments, points } = target;
  let first = true;
  let lineLoop = false;
  ctx.beginPath();
  for (const segment of segments) {
    const { start, end } = segment;
    const firstPoint = points[start];
    const lastPoint = points[_findSegmentEnd(start, end, points)];
    if (first) {
      ctx.moveTo(firstPoint.x, firstPoint.y);
      first = false;
    } else {
      ctx.lineTo(clipX, firstPoint.y);
      ctx.lineTo(firstPoint.x, firstPoint.y);
    }
    lineLoop = !!target.pathSegment(ctx, segment, {
      move: lineLoop
    });
    if (lineLoop) {
      ctx.closePath();
    } else {
      ctx.lineTo(clipX, lastPoint.y);
    }
  }
  ctx.lineTo(clipX, target.first().y);
  ctx.closePath();
  ctx.clip();
}
function fill(ctx, cfg) {
  const { line, target, property, color: color2, scale, clip } = cfg;
  const segments = _segments(line, target, property);
  for (const { source: src, target: tgt, start, end } of segments) {
    const { style: { backgroundColor = color2 } = {} } = src;
    const notShape = target !== true;
    ctx.save();
    ctx.fillStyle = backgroundColor;
    clipBounds(ctx, scale, clip, notShape && _getBounds(property, start, end));
    ctx.beginPath();
    const lineLoop = !!line.pathSegment(ctx, src);
    let loop;
    if (notShape) {
      if (lineLoop) {
        ctx.closePath();
      } else {
        interpolatedLineTo(ctx, target, end, property);
      }
      const targetLoop = !!target.pathSegment(ctx, tgt, {
        move: lineLoop,
        reverse: true
      });
      loop = lineLoop && targetLoop;
      if (!loop) {
        interpolatedLineTo(ctx, target, start, property);
      }
    }
    ctx.closePath();
    ctx.fill(loop ? "evenodd" : "nonzero");
    ctx.restore();
  }
}
function clipBounds(ctx, scale, clip, bounds) {
  const chartArea = scale.chart.chartArea;
  const { property, start, end } = bounds || {};
  if (property === "x" || property === "y") {
    let left, top, right, bottom;
    if (property === "x") {
      left = start;
      top = chartArea.top;
      right = end;
      bottom = chartArea.bottom;
    } else {
      left = chartArea.left;
      top = start;
      right = chartArea.right;
      bottom = end;
    }
    ctx.beginPath();
    if (clip) {
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
    ctx.rect(left, top, right - left, bottom - top);
    ctx.clip();
  }
}
function interpolatedLineTo(ctx, target, point, property) {
  const interpolatedPoint = target.interpolate(point, property);
  if (interpolatedPoint) {
    ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
  }
}
function calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight) {
  const itemWidth = calculateItemWidth(legendItem, boxWidth, labelFont, ctx);
  const itemHeight = calculateItemHeight(_itemHeight, legendItem, labelFont.lineHeight);
  return {
    itemWidth,
    itemHeight
  };
}
function calculateItemWidth(legendItem, boxWidth, labelFont, ctx) {
  let legendItemText = legendItem.text;
  if (legendItemText && typeof legendItemText !== "string") {
    legendItemText = legendItemText.reduce((a, b) => a.length > b.length ? a : b);
  }
  return boxWidth + labelFont.size / 2 + ctx.measureText(legendItemText).width;
}
function calculateItemHeight(_itemHeight, legendItem, fontLineHeight) {
  let itemHeight = _itemHeight;
  if (typeof legendItem.text !== "string") {
    itemHeight = calculateLegendItemHeight(legendItem, fontLineHeight);
  }
  return itemHeight;
}
function calculateLegendItemHeight(legendItem, fontLineHeight) {
  const labelHeight = legendItem.text ? legendItem.text.length : 0;
  return fontLineHeight * labelHeight;
}
function isListened(type, opts) {
  if ((type === "mousemove" || type === "mouseout") && (opts.onHover || opts.onLeave)) {
    return true;
  }
  if (opts.onClick && (type === "click" || type === "mouseup")) {
    return true;
  }
  return false;
}
function createTitle(chart, titleOpts) {
  const title = new Title({
    ctx: chart.ctx,
    options: titleOpts,
    chart
  });
  layouts.configure(chart, title, titleOpts);
  layouts.addBox(chart, title);
  chart.titleBlock = title;
}
function pushOrConcat(base, toPush) {
  if (toPush) {
    if (isArray(toPush)) {
      Array.prototype.push.apply(base, toPush);
    } else {
      base.push(toPush);
    }
  }
  return base;
}
function splitNewlines(str) {
  if ((typeof str === "string" || str instanceof String) && str.indexOf("\n") > -1) {
    return str.split("\n");
  }
  return str;
}
function createTooltipItem(chart, item) {
  const { element, datasetIndex, index: index2 } = item;
  const controller = chart.getDatasetMeta(datasetIndex).controller;
  const { label: label2, value } = controller.getLabelAndValue(index2);
  return {
    chart,
    label: label2,
    parsed: controller.getParsed(index2),
    raw: chart.data.datasets[datasetIndex].data[index2],
    formattedValue: value,
    dataset: controller.getDataset(),
    dataIndex: index2,
    datasetIndex,
    element
  };
}
function getTooltipSize(tooltip, options) {
  const ctx = tooltip.chart.ctx;
  const { body, footer, title } = tooltip;
  const { boxWidth, boxHeight } = options;
  const bodyFont = toFont(options.bodyFont);
  const titleFont = toFont(options.titleFont);
  const footerFont = toFont(options.footerFont);
  const titleLineCount = title.length;
  const footerLineCount = footer.length;
  const bodyLineItemCount = body.length;
  const padding2 = toPadding(options.padding);
  let height = padding2.height;
  let width = 0;
  let combinedBodyLength = body.reduce((count, bodyItem) => count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
  combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
  if (titleLineCount) {
    height += titleLineCount * titleFont.lineHeight + (titleLineCount - 1) * options.titleSpacing + options.titleMarginBottom;
  }
  if (combinedBodyLength) {
    const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
    height += bodyLineItemCount * bodyLineHeight + (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight + (combinedBodyLength - 1) * options.bodySpacing;
  }
  if (footerLineCount) {
    height += options.footerMarginTop + footerLineCount * footerFont.lineHeight + (footerLineCount - 1) * options.footerSpacing;
  }
  let widthPadding = 0;
  const maxLineWidth = function(line) {
    width = Math.max(width, ctx.measureText(line).width + widthPadding);
  };
  ctx.save();
  ctx.font = titleFont.string;
  each(tooltip.title, maxLineWidth);
  ctx.font = bodyFont.string;
  each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
  widthPadding = options.displayColors ? boxWidth + 2 + options.boxPadding : 0;
  each(body, (bodyItem) => {
    each(bodyItem.before, maxLineWidth);
    each(bodyItem.lines, maxLineWidth);
    each(bodyItem.after, maxLineWidth);
  });
  widthPadding = 0;
  ctx.font = footerFont.string;
  each(tooltip.footer, maxLineWidth);
  ctx.restore();
  width += padding2.width;
  return {
    width,
    height
  };
}
function determineYAlign(chart, size) {
  const { y, height } = size;
  if (y < height / 2) {
    return "top";
  } else if (y > chart.height - height / 2) {
    return "bottom";
  }
  return "center";
}
function doesNotFitWithAlign(xAlign, chart, options, size) {
  const { x, width } = size;
  const caret = options.caretSize + options.caretPadding;
  if (xAlign === "left" && x + width + caret > chart.width) {
    return true;
  }
  if (xAlign === "right" && x - width - caret < 0) {
    return true;
  }
}
function determineXAlign(chart, options, size, yAlign) {
  const { x, width } = size;
  const { width: chartWidth, chartArea: { left, right } } = chart;
  let xAlign = "center";
  if (yAlign === "center") {
    xAlign = x <= (left + right) / 2 ? "left" : "right";
  } else if (x <= width / 2) {
    xAlign = "left";
  } else if (x >= chartWidth - width / 2) {
    xAlign = "right";
  }
  if (doesNotFitWithAlign(xAlign, chart, options, size)) {
    xAlign = "center";
  }
  return xAlign;
}
function determineAlignment(chart, options, size) {
  const yAlign = size.yAlign || options.yAlign || determineYAlign(chart, size);
  return {
    xAlign: size.xAlign || options.xAlign || determineXAlign(chart, options, size, yAlign),
    yAlign
  };
}
function alignX(size, xAlign) {
  let { x, width } = size;
  if (xAlign === "right") {
    x -= width;
  } else if (xAlign === "center") {
    x -= width / 2;
  }
  return x;
}
function alignY(size, yAlign, paddingAndSize) {
  let { y, height } = size;
  if (yAlign === "top") {
    y += paddingAndSize;
  } else if (yAlign === "bottom") {
    y -= height + paddingAndSize;
  } else {
    y -= height / 2;
  }
  return y;
}
function getBackgroundPoint(options, size, alignment, chart) {
  const { caretSize, caretPadding, cornerRadius } = options;
  const { xAlign, yAlign } = alignment;
  const paddingAndSize = caretSize + caretPadding;
  const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
  let x = alignX(size, xAlign);
  const y = alignY(size, yAlign, paddingAndSize);
  if (yAlign === "center") {
    if (xAlign === "left") {
      x += paddingAndSize;
    } else if (xAlign === "right") {
      x -= paddingAndSize;
    }
  } else if (xAlign === "left") {
    x -= Math.max(topLeft, bottomLeft) + caretSize;
  } else if (xAlign === "right") {
    x += Math.max(topRight, bottomRight) + caretSize;
  }
  return {
    x: _limitValue(x, 0, chart.width - size.width),
    y: _limitValue(y, 0, chart.height - size.height)
  };
}
function getAlignedX(tooltip, align, options) {
  const padding2 = toPadding(options.padding);
  return align === "center" ? tooltip.x + tooltip.width / 2 : align === "right" ? tooltip.x + tooltip.width - padding2.right : tooltip.x + padding2.left;
}
function getBeforeAfterBodyLines(callback2) {
  return pushOrConcat([], splitNewlines(callback2));
}
function createTooltipContext(parent, tooltip, tooltipItems) {
  return createContext(parent, {
    tooltip,
    tooltipItems,
    type: "tooltip"
  });
}
function overrideCallbacks(callbacks, context) {
  const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
  return override ? callbacks.override(override) : callbacks;
}
function invokeCallbackWithFallback(callbacks, name, ctx, arg) {
  const result = callbacks[name].call(ctx, arg);
  if (typeof result === "undefined") {
    return defaultCallbacks[name].call(ctx, arg);
  }
  return result;
}
function findOrAddLabel(labels, raw, index2, addedLabels) {
  const first = labels.indexOf(raw);
  if (first === -1) {
    return addIfString(labels, raw, index2, addedLabels);
  }
  const last = labels.lastIndexOf(raw);
  return first !== last ? index2 : first;
}
function _getLabelForValue(value) {
  const labels = this.getLabels();
  if (value >= 0 && value < labels.length) {
    return labels[value];
  }
  return value;
}
function generateTicks$1(generationOptions, dataRange) {
  const ticks = [];
  const MIN_SPACING = 1e-14;
  const { bounds, step, min, max, precision, count, maxTicks, maxDigits, includeBounds } = generationOptions;
  const unit = step || 1;
  const maxSpaces = maxTicks - 1;
  const { min: rmin, max: rmax } = dataRange;
  const minDefined = !isNullOrUndef(min);
  const maxDefined = !isNullOrUndef(max);
  const countDefined = !isNullOrUndef(count);
  const minSpacing = (rmax - rmin) / (maxDigits + 1);
  let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
  let factor, niceMin, niceMax, numSpaces;
  if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
    return [
      {
        value: rmin
      },
      {
        value: rmax
      }
    ];
  }
  numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
  if (numSpaces > maxSpaces) {
    spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
  }
  if (!isNullOrUndef(precision)) {
    factor = Math.pow(10, precision);
    spacing = Math.ceil(spacing * factor) / factor;
  }
  if (bounds === "ticks") {
    niceMin = Math.floor(rmin / spacing) * spacing;
    niceMax = Math.ceil(rmax / spacing) * spacing;
  } else {
    niceMin = rmin;
    niceMax = rmax;
  }
  if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1e3)) {
    numSpaces = Math.round(Math.min((max - min) / spacing, maxTicks));
    spacing = (max - min) / numSpaces;
    niceMin = min;
    niceMax = max;
  } else if (countDefined) {
    niceMin = minDefined ? min : niceMin;
    niceMax = maxDefined ? max : niceMax;
    numSpaces = count - 1;
    spacing = (niceMax - niceMin) / numSpaces;
  } else {
    numSpaces = (niceMax - niceMin) / spacing;
    if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1e3)) {
      numSpaces = Math.round(numSpaces);
    } else {
      numSpaces = Math.ceil(numSpaces);
    }
  }
  const decimalPlaces = Math.max(_decimalPlaces(spacing), _decimalPlaces(niceMin));
  factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
  niceMin = Math.round(niceMin * factor) / factor;
  niceMax = Math.round(niceMax * factor) / factor;
  let j = 0;
  if (minDefined) {
    if (includeBounds && niceMin !== min) {
      ticks.push({
        value: min
      });
      if (niceMin < min) {
        j++;
      }
      if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, relativeLabelSize(min, minSpacing, generationOptions))) {
        j++;
      }
    } else if (niceMin < min) {
      j++;
    }
  }
  for (; j < numSpaces; ++j) {
    const tickValue = Math.round((niceMin + j * spacing) * factor) / factor;
    if (maxDefined && tickValue > max) {
      break;
    }
    ticks.push({
      value: tickValue
    });
  }
  if (maxDefined && includeBounds && niceMax !== max) {
    if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max, relativeLabelSize(max, minSpacing, generationOptions))) {
      ticks[ticks.length - 1].value = max;
    } else {
      ticks.push({
        value: max
      });
    }
  } else if (!maxDefined || niceMax === max) {
    ticks.push({
      value: niceMax
    });
  }
  return ticks;
}
function relativeLabelSize(value, minSpacing, { horizontal, minRotation }) {
  const rad = toRadians(minRotation);
  const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 1e-3;
  const length = 0.75 * minSpacing * ("" + value).length;
  return Math.min(minSpacing / ratio, length);
}
function isMajor(tickVal) {
  const remain = tickVal / Math.pow(10, log10Floor(tickVal));
  return remain === 1;
}
function steps(min, max, rangeExp) {
  const rangeStep = Math.pow(10, rangeExp);
  const start = Math.floor(min / rangeStep);
  const end = Math.ceil(max / rangeStep);
  return end - start;
}
function startExp(min, max) {
  const range = max - min;
  let rangeExp = log10Floor(range);
  while (steps(min, max, rangeExp) > 10) {
    rangeExp++;
  }
  while (steps(min, max, rangeExp) < 10) {
    rangeExp--;
  }
  return Math.min(rangeExp, log10Floor(min));
}
function generateTicks(generationOptions, { min, max }) {
  min = finiteOrDefault(generationOptions.min, min);
  const ticks = [];
  const minExp = log10Floor(min);
  let exp = startExp(min, max);
  let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
  const stepSize = Math.pow(10, exp);
  const base = minExp > exp ? Math.pow(10, minExp) : 0;
  const start = Math.round((min - base) * precision) / precision;
  const offset = Math.floor((min - base) / stepSize / 10) * stepSize * 10;
  let significand = Math.floor((start - offset) / Math.pow(10, exp));
  let value = finiteOrDefault(generationOptions.min, Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision);
  while (value < max) {
    ticks.push({
      value,
      major: isMajor(value),
      significand
    });
    if (significand >= 10) {
      significand = significand < 15 ? 15 : 20;
    } else {
      significand++;
    }
    if (significand >= 20) {
      exp++;
      significand = 2;
      precision = exp >= 0 ? 1 : precision;
    }
    value = Math.round((base + offset + significand * Math.pow(10, exp)) * precision) / precision;
  }
  const lastTick = finiteOrDefault(generationOptions.max, value);
  ticks.push({
    value: lastTick,
    major: isMajor(lastTick),
    significand
  });
  return ticks;
}
function getTickBackdropHeight(opts) {
  const tickOpts = opts.ticks;
  if (tickOpts.display && opts.display) {
    const padding2 = toPadding(tickOpts.backdropPadding);
    return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding2.height;
  }
  return 0;
}
function measureLabelSize(ctx, font, label2) {
  label2 = isArray(label2) ? label2 : [
    label2
  ];
  return {
    w: _longestText(ctx, font.string, label2),
    h: label2.length * font.lineHeight
  };
}
function determineLimits(angle, pos, size, min, max) {
  if (angle === min || angle === max) {
    return {
      start: pos - size / 2,
      end: pos + size / 2
    };
  } else if (angle < min || angle > max) {
    return {
      start: pos - size,
      end: pos
    };
  }
  return {
    start: pos,
    end: pos + size
  };
}
function fitWithPointLabels(scale) {
  const orig = {
    l: scale.left + scale._padding.left,
    r: scale.right - scale._padding.right,
    t: scale.top + scale._padding.top,
    b: scale.bottom - scale._padding.bottom
  };
  const limits = Object.assign({}, orig);
  const labelSizes = [];
  const padding2 = [];
  const valueCount = scale._pointLabels.length;
  const pointLabelOpts = scale.options.pointLabels;
  const additionalAngle = pointLabelOpts.centerPointLabels ? PI / valueCount : 0;
  for (let i = 0; i < valueCount; i++) {
    const opts = pointLabelOpts.setContext(scale.getPointLabelContext(i));
    padding2[i] = opts.padding;
    const pointPosition = scale.getPointPosition(i, scale.drawingArea + padding2[i], additionalAngle);
    const plFont = toFont(opts.font);
    const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i]);
    labelSizes[i] = textSize;
    const angleRadians = _normalizeAngle(scale.getIndexAngle(i) + additionalAngle);
    const angle = Math.round(toDegrees(angleRadians));
    const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
    const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
    updateLimits(limits, orig, angleRadians, hLimits, vLimits);
  }
  scale.setCenterPoint(orig.l - limits.l, limits.r - orig.r, orig.t - limits.t, limits.b - orig.b);
  scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding2);
}
function updateLimits(limits, orig, angle, hLimits, vLimits) {
  const sin = Math.abs(Math.sin(angle));
  const cos = Math.abs(Math.cos(angle));
  let x = 0;
  let y = 0;
  if (hLimits.start < orig.l) {
    x = (orig.l - hLimits.start) / sin;
    limits.l = Math.min(limits.l, orig.l - x);
  } else if (hLimits.end > orig.r) {
    x = (hLimits.end - orig.r) / sin;
    limits.r = Math.max(limits.r, orig.r + x);
  }
  if (vLimits.start < orig.t) {
    y = (orig.t - vLimits.start) / cos;
    limits.t = Math.min(limits.t, orig.t - y);
  } else if (vLimits.end > orig.b) {
    y = (vLimits.end - orig.b) / cos;
    limits.b = Math.max(limits.b, orig.b + y);
  }
}
function createPointLabelItem(scale, index2, itemOpts) {
  const outerDistance = scale.drawingArea;
  const { extra, additionalAngle, padding: padding2, size } = itemOpts;
  const pointLabelPosition = scale.getPointPosition(index2, outerDistance + extra + padding2, additionalAngle);
  const angle = Math.round(toDegrees(_normalizeAngle(pointLabelPosition.angle + HALF_PI)));
  const y = yForAngle(pointLabelPosition.y, size.h, angle);
  const textAlign = getTextAlignForAngle(angle);
  const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
  return {
    visible: true,
    x: pointLabelPosition.x,
    y,
    textAlign,
    left,
    top: y,
    right: left + size.w,
    bottom: y + size.h
  };
}
function isNotOverlapped(item, area) {
  if (!area) {
    return true;
  }
  const { left, top, right, bottom } = item;
  const apexesInArea = _isPointInArea({
    x: left,
    y: top
  }, area) || _isPointInArea({
    x: left,
    y: bottom
  }, area) || _isPointInArea({
    x: right,
    y: top
  }, area) || _isPointInArea({
    x: right,
    y: bottom
  }, area);
  return !apexesInArea;
}
function buildPointLabelItems(scale, labelSizes, padding2) {
  const items = [];
  const valueCount = scale._pointLabels.length;
  const opts = scale.options;
  const { centerPointLabels, display } = opts.pointLabels;
  const itemOpts = {
    extra: getTickBackdropHeight(opts) / 2,
    additionalAngle: centerPointLabels ? PI / valueCount : 0
  };
  let area;
  for (let i = 0; i < valueCount; i++) {
    itemOpts.padding = padding2[i];
    itemOpts.size = labelSizes[i];
    const item = createPointLabelItem(scale, i, itemOpts);
    items.push(item);
    if (display === "auto") {
      item.visible = isNotOverlapped(item, area);
      if (item.visible) {
        area = item;
      }
    }
  }
  return items;
}
function getTextAlignForAngle(angle) {
  if (angle === 0 || angle === 180) {
    return "center";
  } else if (angle < 180) {
    return "left";
  }
  return "right";
}
function leftForTextAlign(x, w, align) {
  if (align === "right") {
    x -= w;
  } else if (align === "center") {
    x -= w / 2;
  }
  return x;
}
function yForAngle(y, h3, angle) {
  if (angle === 90 || angle === 270) {
    y -= h3 / 2;
  } else if (angle > 270 || angle < 90) {
    y -= h3;
  }
  return y;
}
function drawPointLabelBox(ctx, opts, item) {
  const { left, top, right, bottom } = item;
  const { backdropColor } = opts;
  if (!isNullOrUndef(backdropColor)) {
    const borderRadius = toTRBLCorners(opts.borderRadius);
    const padding2 = toPadding(opts.backdropPadding);
    ctx.fillStyle = backdropColor;
    const backdropLeft = left - padding2.left;
    const backdropTop = top - padding2.top;
    const backdropWidth = right - left + padding2.width;
    const backdropHeight = bottom - top + padding2.height;
    if (Object.values(borderRadius).some((v) => v !== 0)) {
      ctx.beginPath();
      addRoundedRectPath(ctx, {
        x: backdropLeft,
        y: backdropTop,
        w: backdropWidth,
        h: backdropHeight,
        radius: borderRadius
      });
      ctx.fill();
    } else {
      ctx.fillRect(backdropLeft, backdropTop, backdropWidth, backdropHeight);
    }
  }
}
function drawPointLabels(scale, labelCount) {
  const { ctx, options: { pointLabels } } = scale;
  for (let i = labelCount - 1; i >= 0; i--) {
    const item = scale._pointLabelItems[i];
    if (!item.visible) {
      continue;
    }
    const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i));
    drawPointLabelBox(ctx, optsAtIndex, item);
    const plFont = toFont(optsAtIndex.font);
    const { x, y, textAlign } = item;
    renderText(ctx, scale._pointLabels[i], x, y + plFont.lineHeight / 2, plFont, {
      color: optsAtIndex.color,
      textAlign,
      textBaseline: "middle"
    });
  }
}
function pathRadiusLine(scale, radius, circular, labelCount) {
  const { ctx } = scale;
  if (circular) {
    ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
  } else {
    let pointPosition = scale.getPointPosition(0, radius);
    ctx.moveTo(pointPosition.x, pointPosition.y);
    for (let i = 1; i < labelCount; i++) {
      pointPosition = scale.getPointPosition(i, radius);
      ctx.lineTo(pointPosition.x, pointPosition.y);
    }
  }
}
function drawRadiusLine(scale, gridLineOpts, radius, labelCount, borderOpts) {
  const ctx = scale.ctx;
  const circular = gridLineOpts.circular;
  const { color: color2, lineWidth } = gridLineOpts;
  if (!circular && !labelCount || !color2 || !lineWidth || radius < 0) {
    return;
  }
  ctx.save();
  ctx.strokeStyle = color2;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(borderOpts.dash || []);
  ctx.lineDashOffset = borderOpts.dashOffset;
  ctx.beginPath();
  pathRadiusLine(scale, radius, circular, labelCount);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function createPointLabelContext(parent, index2, label2) {
  return createContext(parent, {
    label: label2,
    index: index2,
    type: "pointLabel"
  });
}
function sorter(a, b) {
  return a - b;
}
function parse(scale, input) {
  if (isNullOrUndef(input)) {
    return null;
  }
  const adapter = scale._adapter;
  const { parser, round: round2, isoWeekday } = scale._parseOpts;
  let value = input;
  if (typeof parser === "function") {
    value = parser(value);
  }
  if (!isNumberFinite(value)) {
    value = typeof parser === "string" ? adapter.parse(value, parser) : adapter.parse(value);
  }
  if (value === null) {
    return null;
  }
  if (round2) {
    value = round2 === "week" && (isNumber(isoWeekday) || isoWeekday === true) ? adapter.startOf(value, "isoWeek", isoWeekday) : adapter.startOf(value, round2);
  }
  return +value;
}
function determineUnitForAutoTicks(minUnit, min, max, capacity) {
  const ilen = UNITS.length;
  for (let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
    const interval = INTERVALS[UNITS[i]];
    const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
    if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
      return UNITS[i];
    }
  }
  return UNITS[ilen - 1];
}
function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
  for (let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
    const unit = UNITS[i];
    if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
      return unit;
    }
  }
  return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
}
function determineMajorUnit(unit) {
  for (let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
    if (INTERVALS[UNITS[i]].common) {
      return UNITS[i];
    }
  }
}
function addTick(ticks, time, timestamps) {
  if (!timestamps) {
    ticks[time] = true;
  } else if (timestamps.length) {
    const { lo, hi } = _lookup(timestamps, time);
    const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
    ticks[timestamp] = true;
  }
}
function setMajorTicks(scale, ticks, map3, majorUnit) {
  const adapter = scale._adapter;
  const first = +adapter.startOf(ticks[0].value, majorUnit);
  const last = ticks[ticks.length - 1].value;
  let major, index2;
  for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
    index2 = map3[major];
    if (index2 >= 0) {
      ticks[index2].major = true;
    }
  }
  return ticks;
}
function ticksFromTimestamps(scale, values, majorUnit) {
  const ticks = [];
  const map3 = {};
  const ilen = values.length;
  let i, value;
  for (i = 0; i < ilen; ++i) {
    value = values[i];
    map3[value] = i;
    ticks.push({
      value,
      major: false
    });
  }
  return ilen === 0 || !majorUnit ? ticks : setMajorTicks(scale, ticks, map3, majorUnit);
}
function interpolate2(table, val, reverse) {
  let lo = 0;
  let hi = table.length - 1;
  let prevSource, nextSource, prevTarget, nextTarget;
  if (reverse) {
    if (val >= table[lo].pos && val <= table[hi].pos) {
      ({ lo, hi } = _lookupByKey(table, "pos", val));
    }
    ({ pos: prevSource, time: prevTarget } = table[lo]);
    ({ pos: nextSource, time: nextTarget } = table[hi]);
  } else {
    if (val >= table[lo].time && val <= table[hi].time) {
      ({ lo, hi } = _lookupByKey(table, "time", val));
    }
    ({ time: prevSource, pos: prevTarget } = table[lo]);
    ({ time: nextSource, pos: nextTarget } = table[hi]);
  }
  const span = nextSource - prevSource;
  return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
}
var Animator, animator, transparent, interpolators, Animation, Animations, isDirectUpdateMode, cloneIfNotShared, createStack, DatasetController, BarController, BubbleController, DoughnutController, LineController, PolarAreaController, PieController, RadarController, ScatterController, controllers, DateAdapterBase, adapters, Interaction, STATIC_POSITIONS, layouts, BasePlatform, BasicPlatform, EXPANDO_KEY, EVENT_TYPES, isNullOrEmpty, eventListenerOptions, drpListeningCharts, oldDevicePixelRatio, DomPlatform, Element, reverseAlign, offsetFromEdge, getTicksLimit, Scale, TypedRegistry, Registry, registry, PluginService, keyCache, keysCached, addIfFound, Config, hasFunction, version, KNOWN_POSITIONS, instances, getChart, Chart, ArcElement, usePath2D, LineElement, PointElement, BarElement, elements, BORDER_COLORS, BACKGROUND_COLORS, plugin_colors, plugin_decimation, simpleArc, index, getBoxSize, itemsEqual, Legend, plugin_legend, Title, plugin_title, map2, plugin_subtitle, positioners, defaultCallbacks, Tooltip, plugin_tooltip, plugins, addIfString, validIndex, CategoryScale, LinearScaleBase, LinearScale, log10Floor, changeExponent, LogarithmicScale, RadialLinearScale, INTERVALS, UNITS, TimeScale, TimeSeriesScale, scales, registerables;
var init_chart = __esm({
  "node_modules/chart.js/dist/chart.js"() {
    init_helpers_dataset();
    Animator = class {
      constructor() {
        this._request = null;
        this._charts = /* @__PURE__ */ new Map();
        this._running = false;
        this._lastDate = void 0;
      }
      _notify(chart, anims, date, type) {
        const callbacks = anims.listeners[type];
        const numSteps = anims.duration;
        callbacks.forEach((fn) => fn({
          chart,
          initial: anims.initial,
          numSteps,
          currentStep: Math.min(date - anims.start, numSteps)
        }));
      }
      _refresh() {
        if (this._request) {
          return;
        }
        this._running = true;
        this._request = requestAnimFrame.call(window, () => {
          this._update();
          this._request = null;
          if (this._running) {
            this._refresh();
          }
        });
      }
      _update(date = Date.now()) {
        let remaining = 0;
        this._charts.forEach((anims, chart) => {
          if (!anims.running || !anims.items.length) {
            return;
          }
          const items = anims.items;
          let i = items.length - 1;
          let draw2 = false;
          let item;
          for (; i >= 0; --i) {
            item = items[i];
            if (item._active) {
              if (item._total > anims.duration) {
                anims.duration = item._total;
              }
              item.tick(date);
              draw2 = true;
            } else {
              items[i] = items[items.length - 1];
              items.pop();
            }
          }
          if (draw2) {
            chart.draw();
            this._notify(chart, anims, date, "progress");
          }
          if (!items.length) {
            anims.running = false;
            this._notify(chart, anims, date, "complete");
            anims.initial = false;
          }
          remaining += items.length;
        });
        this._lastDate = date;
        if (remaining === 0) {
          this._running = false;
        }
      }
      _getAnims(chart) {
        const charts = this._charts;
        let anims = charts.get(chart);
        if (!anims) {
          anims = {
            running: false,
            initial: true,
            items: [],
            listeners: {
              complete: [],
              progress: []
            }
          };
          charts.set(chart, anims);
        }
        return anims;
      }
      listen(chart, event, cb) {
        this._getAnims(chart).listeners[event].push(cb);
      }
      add(chart, items) {
        if (!items || !items.length) {
          return;
        }
        this._getAnims(chart).items.push(...items);
      }
      has(chart) {
        return this._getAnims(chart).items.length > 0;
      }
      start(chart) {
        const anims = this._charts.get(chart);
        if (!anims) {
          return;
        }
        anims.running = true;
        anims.start = Date.now();
        anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
        this._refresh();
      }
      running(chart) {
        if (!this._running) {
          return false;
        }
        const anims = this._charts.get(chart);
        if (!anims || !anims.running || !anims.items.length) {
          return false;
        }
        return true;
      }
      stop(chart) {
        const anims = this._charts.get(chart);
        if (!anims || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i = items.length - 1;
        for (; i >= 0; --i) {
          items[i].cancel();
        }
        anims.items = [];
        this._notify(chart, anims, Date.now(), "complete");
      }
      remove(chart) {
        return this._charts.delete(chart);
      }
    };
    animator = /* @__PURE__ */ new Animator();
    transparent = "transparent";
    interpolators = {
      boolean(from2, to2, factor) {
        return factor > 0.5 ? to2 : from2;
      },
      color(from2, to2, factor) {
        const c0 = color(from2 || transparent);
        const c1 = c0.valid && color(to2 || transparent);
        return c1 && c1.valid ? c1.mix(c0, factor).hexString() : to2;
      },
      number(from2, to2, factor) {
        return from2 + (to2 - from2) * factor;
      }
    };
    Animation = class {
      constructor(cfg, target, prop, to2) {
        const currentValue = target[prop];
        to2 = resolve([
          cfg.to,
          to2,
          currentValue,
          cfg.from
        ]);
        const from2 = resolve([
          cfg.from,
          currentValue,
          to2
        ]);
        this._active = true;
        this._fn = cfg.fn || interpolators[cfg.type || typeof from2];
        this._easing = effects[cfg.easing] || effects.linear;
        this._start = Math.floor(Date.now() + (cfg.delay || 0));
        this._duration = this._total = Math.floor(cfg.duration);
        this._loop = !!cfg.loop;
        this._target = target;
        this._prop = prop;
        this._from = from2;
        this._to = to2;
        this._promises = void 0;
      }
      active() {
        return this._active;
      }
      update(cfg, to2, date) {
        if (this._active) {
          this._notify(false);
          const currentValue = this._target[this._prop];
          const elapsed = date - this._start;
          const remain = this._duration - elapsed;
          this._start = date;
          this._duration = Math.floor(Math.max(remain, cfg.duration));
          this._total += elapsed;
          this._loop = !!cfg.loop;
          this._to = resolve([
            cfg.to,
            to2,
            currentValue,
            cfg.from
          ]);
          this._from = resolve([
            cfg.from,
            currentValue,
            to2
          ]);
        }
      }
      cancel() {
        if (this._active) {
          this.tick(Date.now());
          this._active = false;
          this._notify(false);
        }
      }
      tick(date) {
        const elapsed = date - this._start;
        const duration = this._duration;
        const prop = this._prop;
        const from2 = this._from;
        const loop = this._loop;
        const to2 = this._to;
        let factor;
        this._active = from2 !== to2 && (loop || elapsed < duration);
        if (!this._active) {
          this._target[prop] = to2;
          this._notify(true);
          return;
        }
        if (elapsed < 0) {
          this._target[prop] = from2;
          return;
        }
        factor = elapsed / duration % 2;
        factor = loop && factor > 1 ? 2 - factor : factor;
        factor = this._easing(Math.min(1, Math.max(0, factor)));
        this._target[prop] = this._fn(from2, to2, factor);
      }
      wait() {
        const promises = this._promises || (this._promises = []);
        return new Promise((res, rej) => {
          promises.push({
            res,
            rej
          });
        });
      }
      _notify(resolved) {
        const method = resolved ? "res" : "rej";
        const promises = this._promises || [];
        for (let i = 0; i < promises.length; i++) {
          promises[i][method]();
        }
      }
    };
    Animations = class {
      constructor(chart, config) {
        this._chart = chart;
        this._properties = /* @__PURE__ */ new Map();
        this.configure(config);
      }
      configure(config) {
        if (!isObject(config)) {
          return;
        }
        const animationOptions = Object.keys(defaults.animation);
        const animatedProps = this._properties;
        Object.getOwnPropertyNames(config).forEach((key) => {
          const cfg = config[key];
          if (!isObject(cfg)) {
            return;
          }
          const resolved = {};
          for (const option of animationOptions) {
            resolved[option] = cfg[option];
          }
          (isArray(cfg.properties) && cfg.properties || [
            key
          ]).forEach((prop) => {
            if (prop === key || !animatedProps.has(prop)) {
              animatedProps.set(prop, resolved);
            }
          });
        });
      }
      _animateOptions(target, values) {
        const newOptions = values.options;
        const options = resolveTargetOptions(target, newOptions);
        if (!options) {
          return [];
        }
        const animations = this._createAnimations(options, newOptions);
        if (newOptions.$shared) {
          awaitAll(target.options.$animations, newOptions).then(() => {
            target.options = newOptions;
          }, () => {
          });
        }
        return animations;
      }
      _createAnimations(target, values) {
        const animatedProps = this._properties;
        const animations = [];
        const running = target.$animations || (target.$animations = {});
        const props = Object.keys(values);
        const date = Date.now();
        let i;
        for (i = props.length - 1; i >= 0; --i) {
          const prop = props[i];
          if (prop.charAt(0) === "$") {
            continue;
          }
          if (prop === "options") {
            animations.push(...this._animateOptions(target, values));
            continue;
          }
          const value = values[prop];
          let animation = running[prop];
          const cfg = animatedProps.get(prop);
          if (animation) {
            if (cfg && animation.active()) {
              animation.update(cfg, value, date);
              continue;
            } else {
              animation.cancel();
            }
          }
          if (!cfg || !cfg.duration) {
            target[prop] = value;
            continue;
          }
          running[prop] = animation = new Animation(cfg, target, prop, value);
          animations.push(animation);
        }
        return animations;
      }
      update(target, values) {
        if (this._properties.size === 0) {
          Object.assign(target, values);
          return;
        }
        const animations = this._createAnimations(target, values);
        if (animations.length) {
          animator.add(this._chart, animations);
          return true;
        }
      }
    };
    isDirectUpdateMode = (mode) => mode === "reset" || mode === "none";
    cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
    createStack = (canStack, meta, chart) => canStack && !meta.hidden && meta._stacked && {
      keys: getSortedDatasetIndices(chart, true),
      values: null
    };
    DatasetController = class {
      static defaults = {};
      static datasetElementType = null;
      static dataElementType = null;
      constructor(chart, datasetIndex) {
        this.chart = chart;
        this._ctx = chart.ctx;
        this.index = datasetIndex;
        this._cachedDataOpts = {};
        this._cachedMeta = this.getMeta();
        this._type = this._cachedMeta.type;
        this.options = void 0;
        this._parsing = false;
        this._data = void 0;
        this._objectData = void 0;
        this._sharedOptions = void 0;
        this._drawStart = void 0;
        this._drawCount = void 0;
        this.enableOptionSharing = false;
        this.supportsDecimation = false;
        this.$context = void 0;
        this._syncList = [];
        this.datasetElementType = new.target.datasetElementType;
        this.dataElementType = new.target.dataElementType;
        this.initialize();
      }
      initialize() {
        const meta = this._cachedMeta;
        this.configure();
        this.linkScales();
        meta._stacked = isStacked(meta.vScale, meta);
        this.addElements();
        if (this.options.fill && !this.chart.isPluginEnabled("filler")) {
          console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options");
        }
      }
      updateIndex(datasetIndex) {
        if (this.index !== datasetIndex) {
          clearStacks(this._cachedMeta);
        }
        this.index = datasetIndex;
      }
      linkScales() {
        const chart = this.chart;
        const meta = this._cachedMeta;
        const dataset = this.getDataset();
        const chooseId = (axis, x, y, r) => axis === "x" ? x : axis === "r" ? r : y;
        const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, "x"));
        const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, "y"));
        const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, "r"));
        const indexAxis = meta.indexAxis;
        const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
        const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
        meta.xScale = this.getScaleForId(xid);
        meta.yScale = this.getScaleForId(yid);
        meta.rScale = this.getScaleForId(rid);
        meta.iScale = this.getScaleForId(iid);
        meta.vScale = this.getScaleForId(vid);
      }
      getDataset() {
        return this.chart.data.datasets[this.index];
      }
      getMeta() {
        return this.chart.getDatasetMeta(this.index);
      }
      getScaleForId(scaleID) {
        return this.chart.scales[scaleID];
      }
      _getOtherScale(scale) {
        const meta = this._cachedMeta;
        return scale === meta.iScale ? meta.vScale : meta.iScale;
      }
      reset() {
        this._update("reset");
      }
      _destroy() {
        const meta = this._cachedMeta;
        if (this._data) {
          unlistenArrayEvents(this._data, this);
        }
        if (meta._stacked) {
          clearStacks(meta);
        }
      }
      _dataCheck() {
        const dataset = this.getDataset();
        const data = dataset.data || (dataset.data = []);
        const _data = this._data;
        if (isObject(data)) {
          const meta = this._cachedMeta;
          this._data = convertObjectDataToArray(data, meta);
        } else if (_data !== data) {
          if (_data) {
            unlistenArrayEvents(_data, this);
            const meta = this._cachedMeta;
            clearStacks(meta);
            meta._parsed = [];
          }
          if (data && Object.isExtensible(data)) {
            listenArrayEvents(data, this);
          }
          this._syncList = [];
          this._data = data;
        }
      }
      addElements() {
        const meta = this._cachedMeta;
        this._dataCheck();
        if (this.datasetElementType) {
          meta.dataset = new this.datasetElementType();
        }
      }
      buildOrUpdateElements(resetNewElements) {
        const meta = this._cachedMeta;
        const dataset = this.getDataset();
        let stackChanged = false;
        this._dataCheck();
        const oldStacked = meta._stacked;
        meta._stacked = isStacked(meta.vScale, meta);
        if (meta.stack !== dataset.stack) {
          stackChanged = true;
          clearStacks(meta);
          meta.stack = dataset.stack;
        }
        this._resyncElements(resetNewElements);
        if (stackChanged || oldStacked !== meta._stacked) {
          updateStacks(this, meta._parsed);
          meta._stacked = isStacked(meta.vScale, meta);
        }
      }
      configure() {
        const config = this.chart.config;
        const scopeKeys = config.datasetScopeKeys(this._type);
        const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
        this.options = config.createResolver(scopes, this.getContext());
        this._parsing = this.options.parsing;
        this._cachedDataOpts = {};
      }
      parse(start, count) {
        const { _cachedMeta: meta, _data: data } = this;
        const { iScale, _stacked } = meta;
        const iAxis = iScale.axis;
        let sorted = start === 0 && count === data.length ? true : meta._sorted;
        let prev = start > 0 && meta._parsed[start - 1];
        let i, cur, parsed;
        if (this._parsing === false) {
          meta._parsed = data;
          meta._sorted = true;
          parsed = data;
        } else {
          if (isArray(data[start])) {
            parsed = this.parseArrayData(meta, data, start, count);
          } else if (isObject(data[start])) {
            parsed = this.parseObjectData(meta, data, start, count);
          } else {
            parsed = this.parsePrimitiveData(meta, data, start, count);
          }
          const isNotInOrderComparedToPrev = () => cur[iAxis] === null || prev && cur[iAxis] < prev[iAxis];
          for (i = 0; i < count; ++i) {
            meta._parsed[i + start] = cur = parsed[i];
            if (sorted) {
              if (isNotInOrderComparedToPrev()) {
                sorted = false;
              }
              prev = cur;
            }
          }
          meta._sorted = sorted;
        }
        if (_stacked) {
          updateStacks(this, parsed);
        }
      }
      parsePrimitiveData(meta, data, start, count) {
        const { iScale, vScale } = meta;
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const labels = iScale.getLabels();
        const singleScale = iScale === vScale;
        const parsed = new Array(count);
        let i, ilen, index2;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index2 = i + start;
          parsed[i] = {
            [iAxis]: singleScale || iScale.parse(labels[index2], index2),
            [vAxis]: vScale.parse(data[index2], index2)
          };
        }
        return parsed;
      }
      parseArrayData(meta, data, start, count) {
        const { xScale, yScale } = meta;
        const parsed = new Array(count);
        let i, ilen, index2, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index2 = i + start;
          item = data[index2];
          parsed[i] = {
            x: xScale.parse(item[0], index2),
            y: yScale.parse(item[1], index2)
          };
        }
        return parsed;
      }
      parseObjectData(meta, data, start, count) {
        const { xScale, yScale } = meta;
        const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
        const parsed = new Array(count);
        let i, ilen, index2, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index2 = i + start;
          item = data[index2];
          parsed[i] = {
            x: xScale.parse(resolveObjectKey(item, xAxisKey), index2),
            y: yScale.parse(resolveObjectKey(item, yAxisKey), index2)
          };
        }
        return parsed;
      }
      getParsed(index2) {
        return this._cachedMeta._parsed[index2];
      }
      getDataElement(index2) {
        return this._cachedMeta.data[index2];
      }
      applyStack(scale, parsed, mode) {
        const chart = this.chart;
        const meta = this._cachedMeta;
        const value = parsed[scale.axis];
        const stack = {
          keys: getSortedDatasetIndices(chart, true),
          values: parsed._stacks[scale.axis]._visualValues
        };
        return applyStack(stack, value, meta.index, {
          mode
        });
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        const parsedValue = parsed[scale.axis];
        let value = parsedValue === null ? NaN : parsedValue;
        const values = stack && parsed._stacks[scale.axis];
        if (stack && values) {
          stack.values = values;
          value = applyStack(stack, parsedValue, this._cachedMeta.index);
        }
        range.min = Math.min(range.min, value);
        range.max = Math.max(range.max, value);
      }
      getMinMax(scale, canStack) {
        const meta = this._cachedMeta;
        const _parsed = meta._parsed;
        const sorted = meta._sorted && scale === meta.iScale;
        const ilen = _parsed.length;
        const otherScale = this._getOtherScale(scale);
        const stack = createStack(canStack, meta, this.chart);
        const range = {
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY
        };
        const { min: otherMin, max: otherMax } = getUserBounds(otherScale);
        let i, parsed;
        function _skip() {
          parsed = _parsed[i];
          const otherValue = parsed[otherScale.axis];
          return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
        }
        for (i = 0; i < ilen; ++i) {
          if (_skip()) {
            continue;
          }
          this.updateRangeFromParsed(range, scale, parsed, stack);
          if (sorted) {
            break;
          }
        }
        if (sorted) {
          for (i = ilen - 1; i >= 0; --i) {
            if (_skip()) {
              continue;
            }
            this.updateRangeFromParsed(range, scale, parsed, stack);
            break;
          }
        }
        return range;
      }
      getAllParsedValues(scale) {
        const parsed = this._cachedMeta._parsed;
        const values = [];
        let i, ilen, value;
        for (i = 0, ilen = parsed.length; i < ilen; ++i) {
          value = parsed[i][scale.axis];
          if (isNumberFinite(value)) {
            values.push(value);
          }
        }
        return values;
      }
      getMaxOverflow() {
        return false;
      }
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const iScale = meta.iScale;
        const vScale = meta.vScale;
        const parsed = this.getParsed(index2);
        return {
          label: iScale ? "" + iScale.getLabelForValue(parsed[iScale.axis]) : "",
          value: vScale ? "" + vScale.getLabelForValue(parsed[vScale.axis]) : ""
        };
      }
      _update(mode) {
        const meta = this._cachedMeta;
        this.update(mode || "default");
        meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
      }
      update(mode) {
      }
      draw() {
        const ctx = this._ctx;
        const chart = this.chart;
        const meta = this._cachedMeta;
        const elements2 = meta.data || [];
        const area = chart.chartArea;
        const active = [];
        const start = this._drawStart || 0;
        const count = this._drawCount || elements2.length - start;
        const drawActiveElementsOnTop = this.options.drawActiveElementsOnTop;
        let i;
        if (meta.dataset) {
          meta.dataset.draw(ctx, area, start, count);
        }
        for (i = start; i < start + count; ++i) {
          const element = elements2[i];
          if (element.hidden) {
            continue;
          }
          if (element.active && drawActiveElementsOnTop) {
            active.push(element);
          } else {
            element.draw(ctx, area);
          }
        }
        for (i = 0; i < active.length; ++i) {
          active[i].draw(ctx, area);
        }
      }
      getStyle(index2, active) {
        const mode = active ? "active" : "default";
        return index2 === void 0 && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(mode) : this.resolveDataElementOptions(index2 || 0, mode);
      }
      getContext(index2, active, mode) {
        const dataset = this.getDataset();
        let context;
        if (index2 >= 0 && index2 < this._cachedMeta.data.length) {
          const element = this._cachedMeta.data[index2];
          context = element.$context || (element.$context = createDataContext(this.getContext(), index2, element));
          context.parsed = this.getParsed(index2);
          context.raw = dataset.data[index2];
          context.index = context.dataIndex = index2;
        } else {
          context = this.$context || (this.$context = createDatasetContext(this.chart.getContext(), this.index));
          context.dataset = dataset;
          context.index = context.datasetIndex = this.index;
        }
        context.active = !!active;
        context.mode = mode;
        return context;
      }
      resolveDatasetElementOptions(mode) {
        return this._resolveElementOptions(this.datasetElementType.id, mode);
      }
      resolveDataElementOptions(index2, mode) {
        return this._resolveElementOptions(this.dataElementType.id, mode, index2);
      }
      _resolveElementOptions(elementType, mode = "default", index2) {
        const active = mode === "active";
        const cache = this._cachedDataOpts;
        const cacheKey = elementType + "-" + mode;
        const cached = cache[cacheKey];
        const sharing = this.enableOptionSharing && defined(index2);
        if (cached) {
          return cloneIfNotShared(cached, sharing);
        }
        const config = this.chart.config;
        const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
        const prefixes = active ? [
          `${elementType}Hover`,
          "hover",
          elementType,
          ""
        ] : [
          elementType,
          ""
        ];
        const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
        const names2 = Object.keys(defaults.elements[elementType]);
        const context = () => this.getContext(index2, active, mode);
        const values = config.resolveNamedOptions(scopes, names2, context, prefixes);
        if (values.$shared) {
          values.$shared = sharing;
          cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
        }
        return values;
      }
      _resolveAnimations(index2, transition, active) {
        const chart = this.chart;
        const cache = this._cachedDataOpts;
        const cacheKey = `animation-${transition}`;
        const cached = cache[cacheKey];
        if (cached) {
          return cached;
        }
        let options;
        if (chart.options.animation !== false) {
          const config = this.chart.config;
          const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
          const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
          options = config.createResolver(scopes, this.getContext(index2, active, transition));
        }
        const animations = new Animations(chart, options && options.animations);
        if (options && options._cacheable) {
          cache[cacheKey] = Object.freeze(animations);
        }
        return animations;
      }
      getSharedOptions(options) {
        if (!options.$shared) {
          return;
        }
        return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
      }
      includeOptions(mode, sharedOptions) {
        return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
      }
      _getSharedOptions(start, mode) {
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const previouslySharedOptions = this._sharedOptions;
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions) || sharedOptions !== previouslySharedOptions;
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
        return {
          sharedOptions,
          includeOptions
        };
      }
      updateElement(element, index2, properties, mode) {
        if (isDirectUpdateMode(mode)) {
          Object.assign(element, properties);
        } else {
          this._resolveAnimations(index2, mode).update(element, properties);
        }
      }
      updateSharedOptions(sharedOptions, mode, newOptions) {
        if (sharedOptions && !isDirectUpdateMode(mode)) {
          this._resolveAnimations(void 0, mode).update(sharedOptions, newOptions);
        }
      }
      _setStyle(element, index2, mode, active) {
        element.active = active;
        const options = this.getStyle(index2, active);
        this._resolveAnimations(index2, mode, active).update(element, {
          options: !active && this.getSharedOptions(options) || options
        });
      }
      removeHoverStyle(element, datasetIndex, index2) {
        this._setStyle(element, index2, "active", false);
      }
      setHoverStyle(element, datasetIndex, index2) {
        this._setStyle(element, index2, "active", true);
      }
      _removeDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, void 0, "active", false);
        }
      }
      _setDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, void 0, "active", true);
        }
      }
      _resyncElements(resetNewElements) {
        const data = this._data;
        const elements2 = this._cachedMeta.data;
        for (const [method, arg1, arg2] of this._syncList) {
          this[method](arg1, arg2);
        }
        this._syncList = [];
        const numMeta = elements2.length;
        const numData = data.length;
        const count = Math.min(numData, numMeta);
        if (count) {
          this.parse(0, count);
        }
        if (numData > numMeta) {
          this._insertElements(numMeta, numData - numMeta, resetNewElements);
        } else if (numData < numMeta) {
          this._removeElements(numData, numMeta - numData);
        }
      }
      _insertElements(start, count, resetNewElements = true) {
        const meta = this._cachedMeta;
        const data = meta.data;
        const end = start + count;
        let i;
        const move = (arr) => {
          arr.length += count;
          for (i = arr.length - 1; i >= end; i--) {
            arr[i] = arr[i - count];
          }
        };
        move(data);
        for (i = start; i < end; ++i) {
          data[i] = new this.dataElementType();
        }
        if (this._parsing) {
          move(meta._parsed);
        }
        this.parse(start, count);
        if (resetNewElements) {
          this.updateElements(data, start, count, "reset");
        }
      }
      updateElements(element, start, count, mode) {
      }
      _removeElements(start, count) {
        const meta = this._cachedMeta;
        if (this._parsing) {
          const removed = meta._parsed.splice(start, count);
          if (meta._stacked) {
            clearStacks(meta, removed);
          }
        }
        meta.data.splice(start, count);
      }
      _sync(args) {
        if (this._parsing) {
          this._syncList.push(args);
        } else {
          const [method, arg1, arg2] = args;
          this[method](arg1, arg2);
        }
        this.chart._dataChanges.push([
          this.index,
          ...args
        ]);
      }
      _onDataPush() {
        const count = arguments.length;
        this._sync([
          "_insertElements",
          this.getDataset().data.length - count,
          count
        ]);
      }
      _onDataPop() {
        this._sync([
          "_removeElements",
          this._cachedMeta.data.length - 1,
          1
        ]);
      }
      _onDataShift() {
        this._sync([
          "_removeElements",
          0,
          1
        ]);
      }
      _onDataSplice(start, count) {
        if (count) {
          this._sync([
            "_removeElements",
            start,
            count
          ]);
        }
        const newCount = arguments.length - 2;
        if (newCount) {
          this._sync([
            "_insertElements",
            start,
            newCount
          ]);
        }
      }
      _onDataUnshift() {
        this._sync([
          "_insertElements",
          0,
          arguments.length
        ]);
      }
    };
    BarController = class extends DatasetController {
      static id = "bar";
      static defaults = {
        datasetElementType: false,
        dataElementType: "bar",
        categoryPercentage: 0.8,
        barPercentage: 0.9,
        grouped: true,
        animations: {
          numbers: {
            type: "number",
            properties: [
              "x",
              "y",
              "base",
              "width",
              "height"
            ]
          }
        }
      };
      static overrides = {
        scales: {
          _index_: {
            type: "category",
            offset: true,
            grid: {
              offset: true
            }
          },
          _value_: {
            type: "linear",
            beginAtZero: true
          }
        }
      };
      parsePrimitiveData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseArrayData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseObjectData(meta, data, start, count) {
        const { iScale, vScale } = meta;
        const { xAxisKey = "x", yAxisKey = "y" } = this._parsing;
        const iAxisKey = iScale.axis === "x" ? xAxisKey : yAxisKey;
        const vAxisKey = vScale.axis === "x" ? xAxisKey : yAxisKey;
        const parsed = [];
        let i, ilen, item, obj;
        for (i = start, ilen = start + count; i < ilen; ++i) {
          obj = data[i];
          item = {};
          item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
          parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
        }
        return parsed;
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        super.updateRangeFromParsed(range, scale, parsed, stack);
        const custom = parsed._custom;
        if (custom && scale === this._cachedMeta.vScale) {
          range.min = Math.min(range.min, custom.min);
          range.max = Math.max(range.max, custom.max);
        }
      }
      getMaxOverflow() {
        return 0;
      }
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const { iScale, vScale } = meta;
        const parsed = this.getParsed(index2);
        const custom = parsed._custom;
        const value = isFloatBar(custom) ? "[" + custom.start + ", " + custom.end + "]" : "" + vScale.getLabelForValue(parsed[vScale.axis]);
        return {
          label: "" + iScale.getLabelForValue(parsed[iScale.axis]),
          value
        };
      }
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
        const meta = this._cachedMeta;
        meta.stack = this.getDataset().stack;
      }
      update(mode) {
        const meta = this._cachedMeta;
        this.updateElements(meta.data, 0, meta.data.length, mode);
      }
      updateElements(bars, start, count, mode) {
        const reset = mode === "reset";
        const { index: index2, _cachedMeta: { vScale } } = this;
        const base = vScale.getBasePixel();
        const horizontal = vScale.isHorizontal();
        const ruler = this._getRuler();
        const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
        for (let i = start; i < start + count; i++) {
          const parsed = this.getParsed(i);
          const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {
            base,
            head: base
          } : this._calculateBarValuePixels(i);
          const ipixels = this._calculateBarIndexPixels(i, ruler);
          const stack = (parsed._stacks || {})[vScale.axis];
          const properties = {
            horizontal,
            base: vpixels.base,
            enableBorderRadius: !stack || isFloatBar(parsed._custom) || index2 === stack._top || index2 === stack._bottom,
            x: horizontal ? vpixels.head : ipixels.center,
            y: horizontal ? ipixels.center : vpixels.head,
            height: horizontal ? ipixels.size : Math.abs(vpixels.size),
            width: horizontal ? Math.abs(vpixels.size) : ipixels.size
          };
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, bars[i].active ? "active" : mode);
          }
          const options = properties.options || bars[i].options;
          setBorderSkipped(properties, options, stack, index2);
          setInflateAmount(properties, options, ruler.ratio);
          this.updateElement(bars[i], i, properties, mode);
        }
      }
      _getStacks(last, dataIndex) {
        const { iScale } = this._cachedMeta;
        const metasets = iScale.getMatchingVisibleMetas(this._type).filter((meta) => meta.controller.options.grouped);
        const stacked = iScale.options.stacked;
        const stacks = [];
        const currentParsed = this._cachedMeta.controller.getParsed(dataIndex);
        const iScaleValue = currentParsed && currentParsed[iScale.axis];
        const skipNull = (meta) => {
          const parsed = meta._parsed.find((item) => item[iScale.axis] === iScaleValue);
          const val = parsed && parsed[meta.vScale.axis];
          if (isNullOrUndef(val) || isNaN(val)) {
            return true;
          }
        };
        for (const meta of metasets) {
          if (dataIndex !== void 0 && skipNull(meta)) {
            continue;
          }
          if (stacked === false || stacks.indexOf(meta.stack) === -1 || stacked === void 0 && meta.stack === void 0) {
            stacks.push(meta.stack);
          }
          if (meta.index === last) {
            break;
          }
        }
        if (!stacks.length) {
          stacks.push(void 0);
        }
        return stacks;
      }
      _getStackCount(index2) {
        return this._getStacks(void 0, index2).length;
      }
      _getAxisCount() {
        return this._getAxis().length;
      }
      getFirstScaleIdForIndexAxis() {
        const scales2 = this.chart.scales;
        const indexScaleId = this.chart.options.indexAxis;
        return Object.keys(scales2).filter((key) => scales2[key].axis === indexScaleId).shift();
      }
      _getAxis() {
        const axis = {};
        const firstScaleAxisId = this.getFirstScaleIdForIndexAxis();
        for (const dataset of this.chart.data.datasets) {
          axis[valueOrDefault(this.chart.options.indexAxis === "x" ? dataset.xAxisID : dataset.yAxisID, firstScaleAxisId)] = true;
        }
        return Object.keys(axis);
      }
      _getStackIndex(datasetIndex, name, dataIndex) {
        const stacks = this._getStacks(datasetIndex, dataIndex);
        const index2 = name !== void 0 ? stacks.indexOf(name) : -1;
        return index2 === -1 ? stacks.length - 1 : index2;
      }
      _getRuler() {
        const opts = this.options;
        const meta = this._cachedMeta;
        const iScale = meta.iScale;
        const pixels = [];
        let i, ilen;
        for (i = 0, ilen = meta.data.length; i < ilen; ++i) {
          pixels.push(iScale.getPixelForValue(this.getParsed(i)[iScale.axis], i));
        }
        const barThickness = opts.barThickness;
        const min = barThickness || computeMinSampleSize(meta);
        return {
          min,
          pixels,
          start: iScale._startPixel,
          end: iScale._endPixel,
          stackCount: this._getStackCount(),
          scale: iScale,
          grouped: opts.grouped,
          ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
        };
      }
      _calculateBarValuePixels(index2) {
        const { _cachedMeta: { vScale, _stacked, index: datasetIndex }, options: { base: baseValue, minBarLength } } = this;
        const actualBase = baseValue || 0;
        const parsed = this.getParsed(index2);
        const custom = parsed._custom;
        const floating = isFloatBar(custom);
        let value = parsed[vScale.axis];
        let start = 0;
        let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
        let head, size;
        if (length !== value) {
          start = length - value;
          length = value;
        }
        if (floating) {
          value = custom.barStart;
          length = custom.barEnd - custom.barStart;
          if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
            start = 0;
          }
          start += value;
        }
        const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
        let base = vScale.getPixelForValue(startValue);
        if (this.chart.getDataVisibility(index2)) {
          head = vScale.getPixelForValue(start + length);
        } else {
          head = base;
        }
        size = head - base;
        if (Math.abs(size) < minBarLength) {
          size = barSign(size, vScale, actualBase) * minBarLength;
          if (value === actualBase) {
            base -= size / 2;
          }
          const startPixel = vScale.getPixelForDecimal(0);
          const endPixel = vScale.getPixelForDecimal(1);
          const min = Math.min(startPixel, endPixel);
          const max = Math.max(startPixel, endPixel);
          base = Math.max(Math.min(base, max), min);
          head = base + size;
          if (_stacked && !floating) {
            parsed._stacks[vScale.axis]._visualValues[datasetIndex] = vScale.getValueForPixel(head) - vScale.getValueForPixel(base);
          }
        }
        if (base === vScale.getPixelForValue(actualBase)) {
          const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
          base += halfGrid;
          size -= halfGrid;
        }
        return {
          size,
          base,
          head,
          center: head + size / 2
        };
      }
      _calculateBarIndexPixels(index2, ruler) {
        const scale = ruler.scale;
        const options = this.options;
        const skipNull = options.skipNull;
        const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
        let center, size;
        const axisCount = this._getAxisCount();
        if (ruler.grouped) {
          const stackCount = skipNull ? this._getStackCount(index2) : ruler.stackCount;
          const range = options.barThickness === "flex" ? computeFlexCategoryTraits(index2, ruler, options, stackCount * axisCount) : computeFitCategoryTraits(index2, ruler, options, stackCount * axisCount);
          const axisID = this.chart.options.indexAxis === "x" ? this.getDataset().xAxisID : this.getDataset().yAxisID;
          const axisNumber = this._getAxis().indexOf(valueOrDefault(axisID, this.getFirstScaleIdForIndexAxis()));
          const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index2 : void 0) + axisNumber;
          center = range.start + range.chunk * stackIndex + range.chunk / 2;
          size = Math.min(maxBarThickness, range.chunk * range.ratio);
        } else {
          center = scale.getPixelForValue(this.getParsed(index2)[scale.axis], index2);
          size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
        }
        return {
          base: center - size / 2,
          head: center + size / 2,
          center,
          size
        };
      }
      draw() {
        const meta = this._cachedMeta;
        const vScale = meta.vScale;
        const rects = meta.data;
        const ilen = rects.length;
        let i = 0;
        for (; i < ilen; ++i) {
          if (this.getParsed(i)[vScale.axis] !== null && !rects[i].hidden) {
            rects[i].draw(this._ctx);
          }
        }
      }
    };
    BubbleController = class extends DatasetController {
      static id = "bubble";
      static defaults = {
        datasetElementType: false,
        dataElementType: "point",
        animations: {
          numbers: {
            type: "number",
            properties: [
              "x",
              "y",
              "borderWidth",
              "radius"
            ]
          }
        }
      };
      static overrides = {
        scales: {
          x: {
            type: "linear"
          },
          y: {
            type: "linear"
          }
        }
      };
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
      }
      parsePrimitiveData(meta, data, start, count) {
        const parsed = super.parsePrimitiveData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          parsed[i]._custom = this.resolveDataElementOptions(i + start).radius;
        }
        return parsed;
      }
      parseArrayData(meta, data, start, count) {
        const parsed = super.parseArrayData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          const item = data[start + i];
          parsed[i]._custom = valueOrDefault(item[2], this.resolveDataElementOptions(i + start).radius);
        }
        return parsed;
      }
      parseObjectData(meta, data, start, count) {
        const parsed = super.parseObjectData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          const item = data[start + i];
          parsed[i]._custom = valueOrDefault(item && item.r && +item.r, this.resolveDataElementOptions(i + start).radius);
        }
        return parsed;
      }
      getMaxOverflow() {
        const data = this._cachedMeta.data;
        let max = 0;
        for (let i = data.length - 1; i >= 0; --i) {
          max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
        }
        return max > 0 && max;
      }
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const labels = this.chart.data.labels || [];
        const { xScale, yScale } = meta;
        const parsed = this.getParsed(index2);
        const x = xScale.getLabelForValue(parsed.x);
        const y = yScale.getLabelForValue(parsed.y);
        const r = parsed._custom;
        return {
          label: labels[index2] || "",
          value: "(" + x + ", " + y + (r ? ", " + r : "") + ")"
        };
      }
      update(mode) {
        const points = this._cachedMeta.data;
        this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const reset = mode === "reset";
        const { iScale, vScale } = this._cachedMeta;
        const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const parsed = !reset && this.getParsed(i);
          const properties = {};
          const iPixel = properties[iAxis] = reset ? iScale.getPixelForDecimal(0.5) : iScale.getPixelForValue(parsed[iAxis]);
          const vPixel = properties[vAxis] = reset ? vScale.getBasePixel() : vScale.getPixelForValue(parsed[vAxis]);
          properties.skip = isNaN(iPixel) || isNaN(vPixel);
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? "active" : mode);
            if (reset) {
              properties.options.radius = 0;
            }
          }
          this.updateElement(point, i, properties, mode);
        }
      }
      resolveDataElementOptions(index2, mode) {
        const parsed = this.getParsed(index2);
        let values = super.resolveDataElementOptions(index2, mode);
        if (values.$shared) {
          values = Object.assign({}, values, {
            $shared: false
          });
        }
        const radius = values.radius;
        if (mode !== "active") {
          values.radius = 0;
        }
        values.radius += valueOrDefault(parsed && parsed._custom, radius);
        return values;
      }
    };
    DoughnutController = class extends DatasetController {
      static id = "doughnut";
      static defaults = {
        datasetElementType: false,
        dataElementType: "arc",
        animation: {
          animateRotate: true,
          animateScale: false
        },
        animations: {
          numbers: {
            type: "number",
            properties: [
              "circumference",
              "endAngle",
              "innerRadius",
              "outerRadius",
              "startAngle",
              "x",
              "y",
              "offset",
              "borderWidth",
              "spacing"
            ]
          }
        },
        cutout: "50%",
        rotation: 0,
        circumference: 360,
        radius: "100%",
        spacing: 0,
        indexAxis: "r"
      };
      static descriptors = {
        _scriptable: (name) => name !== "spacing",
        _indexable: (name) => name !== "spacing" && !name.startsWith("borderDash") && !name.startsWith("hoverBorderDash")
      };
      static overrides = {
        aspectRatio: 1,
        plugins: {
          legend: {
            labels: {
              generateLabels(chart) {
                const data = chart.data;
                const { labels: { pointStyle, textAlign, color: color2, useBorderRadius, borderRadius } } = chart.legend.options;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label2, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: label2,
                      fillStyle: style.backgroundColor,
                      fontColor: color2,
                      hidden: !chart.getDataVisibility(i),
                      lineDash: style.borderDash,
                      lineDashOffset: style.borderDashOffset,
                      lineJoin: style.borderJoinStyle,
                      lineWidth: style.borderWidth,
                      strokeStyle: style.borderColor,
                      textAlign,
                      pointStyle,
                      borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick(e, legendItem, legend) {
              legend.chart.toggleDataVisibility(legendItem.index);
              legend.chart.update();
            }
          }
        }
      };
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.enableOptionSharing = true;
        this.innerRadius = void 0;
        this.outerRadius = void 0;
        this.offsetX = void 0;
        this.offsetY = void 0;
      }
      linkScales() {
      }
      parse(start, count) {
        const data = this.getDataset().data;
        const meta = this._cachedMeta;
        if (this._parsing === false) {
          meta._parsed = data;
        } else {
          let getter = (i2) => +data[i2];
          if (isObject(data[start])) {
            const { key = "value" } = this._parsing;
            getter = (i2) => +resolveObjectKey(data[i2], key);
          }
          let i, ilen;
          for (i = start, ilen = start + count; i < ilen; ++i) {
            meta._parsed[i] = getter(i);
          }
        }
      }
      _getRotation() {
        return toRadians(this.options.rotation - 90);
      }
      _getCircumference() {
        return toRadians(this.options.circumference);
      }
      _getRotationExtents() {
        let min = TAU;
        let max = -TAU;
        for (let i = 0; i < this.chart.data.datasets.length; ++i) {
          if (this.chart.isDatasetVisible(i) && this.chart.getDatasetMeta(i).type === this._type) {
            const controller = this.chart.getDatasetMeta(i).controller;
            const rotation = controller._getRotation();
            const circumference = controller._getCircumference();
            min = Math.min(min, rotation);
            max = Math.max(max, rotation + circumference);
          }
        }
        return {
          rotation: min,
          circumference: max - min
        };
      }
      update(mode) {
        const chart = this.chart;
        const { chartArea } = chart;
        const meta = this._cachedMeta;
        const arcs = meta.data;
        const spacing = this.getMaxBorderWidth() + this.getMaxOffset(arcs) + this.options.spacing;
        const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
        const cutout = Math.min(toPercentage(this.options.cutout, maxSize), 1);
        const chartWeight = this._getRingWeight(this.index);
        const { circumference, rotation } = this._getRotationExtents();
        const { ratioX, ratioY, offsetX, offsetY } = getRatioAndOffset(rotation, circumference, cutout);
        const maxWidth = (chartArea.width - spacing) / ratioX;
        const maxHeight = (chartArea.height - spacing) / ratioY;
        const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
        const outerRadius = toDimension(this.options.radius, maxRadius);
        const innerRadius = Math.max(outerRadius * cutout, 0);
        const radiusLength = (outerRadius - innerRadius) / this._getVisibleDatasetWeightTotal();
        this.offsetX = offsetX * outerRadius;
        this.offsetY = offsetY * outerRadius;
        meta.total = this.calculateTotal();
        this.outerRadius = outerRadius - radiusLength * this._getRingWeightOffset(this.index);
        this.innerRadius = Math.max(this.outerRadius - radiusLength * chartWeight, 0);
        this.updateElements(arcs, 0, arcs.length, mode);
      }
      _circumference(i, reset) {
        const opts = this.options;
        const meta = this._cachedMeta;
        const circumference = this._getCircumference();
        if (reset && opts.animation.animateRotate || !this.chart.getDataVisibility(i) || meta._parsed[i] === null || meta.data[i].hidden) {
          return 0;
        }
        return this.calculateCircumference(meta._parsed[i] * circumference / TAU);
      }
      updateElements(arcs, start, count, mode) {
        const reset = mode === "reset";
        const chart = this.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const animationOpts = opts.animation;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        const animateScale = reset && animationOpts.animateScale;
        const innerRadius = animateScale ? 0 : this.innerRadius;
        const outerRadius = animateScale ? 0 : this.outerRadius;
        const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
        let startAngle = this._getRotation();
        let i;
        for (i = 0; i < start; ++i) {
          startAngle += this._circumference(i, reset);
        }
        for (i = start; i < start + count; ++i) {
          const circumference = this._circumference(i, reset);
          const arc = arcs[i];
          const properties = {
            x: centerX + this.offsetX,
            y: centerY + this.offsetY,
            startAngle,
            endAngle: startAngle + circumference,
            circumference,
            outerRadius,
            innerRadius
          };
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, arc.active ? "active" : mode);
          }
          startAngle += circumference;
          this.updateElement(arc, i, properties, mode);
        }
      }
      calculateTotal() {
        const meta = this._cachedMeta;
        const metaData = meta.data;
        let total = 0;
        let i;
        for (i = 0; i < metaData.length; i++) {
          const value = meta._parsed[i];
          if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i) && !metaData[i].hidden) {
            total += Math.abs(value);
          }
        }
        return total;
      }
      calculateCircumference(value) {
        const total = this._cachedMeta.total;
        if (total > 0 && !isNaN(value)) {
          return TAU * (Math.abs(value) / total);
        }
        return 0;
      }
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const chart = this.chart;
        const labels = chart.data.labels || [];
        const value = formatNumber(meta._parsed[index2], chart.options.locale);
        return {
          label: labels[index2] || "",
          value
        };
      }
      getMaxBorderWidth(arcs) {
        let max = 0;
        const chart = this.chart;
        let i, ilen, meta, controller, options;
        if (!arcs) {
          for (i = 0, ilen = chart.data.datasets.length; i < ilen; ++i) {
            if (chart.isDatasetVisible(i)) {
              meta = chart.getDatasetMeta(i);
              arcs = meta.data;
              controller = meta.controller;
              break;
            }
          }
        }
        if (!arcs) {
          return 0;
        }
        for (i = 0, ilen = arcs.length; i < ilen; ++i) {
          options = controller.resolveDataElementOptions(i);
          if (options.borderAlign !== "inner") {
            max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
          }
        }
        return max;
      }
      getMaxOffset(arcs) {
        let max = 0;
        for (let i = 0, ilen = arcs.length; i < ilen; ++i) {
          const options = this.resolveDataElementOptions(i);
          max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
        }
        return max;
      }
      _getRingWeightOffset(datasetIndex) {
        let ringWeightOffset = 0;
        for (let i = 0; i < datasetIndex; ++i) {
          if (this.chart.isDatasetVisible(i)) {
            ringWeightOffset += this._getRingWeight(i);
          }
        }
        return ringWeightOffset;
      }
      _getRingWeight(datasetIndex) {
        return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
      }
      _getVisibleDatasetWeightTotal() {
        return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
      }
    };
    LineController = class extends DatasetController {
      static id = "line";
      static defaults = {
        datasetElementType: "line",
        dataElementType: "point",
        showLine: true,
        spanGaps: false
      };
      static overrides = {
        scales: {
          _index_: {
            type: "category"
          },
          _value_: {
            type: "linear"
          }
        }
      };
      initialize() {
        this.enableOptionSharing = true;
        this.supportsDecimation = true;
        super.initialize();
      }
      update(mode) {
        const meta = this._cachedMeta;
        const { dataset: line, data: points = [], _dataset } = meta;
        const animationsDisabled = this.chart._animationsDisabled;
        let { start, count } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
        this._drawStart = start;
        this._drawCount = count;
        if (_scaleRangesChanged(meta)) {
          start = 0;
          count = points.length;
        }
        line._chart = this.chart;
        line._datasetIndex = this.index;
        line._decimated = !!_dataset._decimated;
        line.points = points;
        const options = this.resolveDatasetElementOptions(mode);
        if (!this.options.showLine) {
          options.borderWidth = 0;
        }
        options.segment = this.options.segment;
        this.updateElement(line, void 0, {
          animated: !animationsDisabled,
          options
        }, mode);
        this.updateElements(points, start, count, mode);
      }
      updateElements(points, start, count, mode) {
        const reset = mode === "reset";
        const { iScale, vScale, _stacked, _dataset } = this._cachedMeta;
        const { sharedOptions, includeOptions } = this._getSharedOptions(start, mode);
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const { spanGaps, segment } = this.options;
        const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
        const directUpdate = this.chart._animationsDisabled || reset || mode === "none";
        const end = start + count;
        const pointsCount = points.length;
        let prevParsed = start > 0 && this.getParsed(start - 1);
        for (let i = 0; i < pointsCount; ++i) {
          const point = points[i];
          const properties = directUpdate ? point : {};
          if (i < start || i >= end) {
            properties.skip = true;
            continue;
          }
          const parsed = this.getParsed(i);
          const nullData = isNullOrUndef(parsed[vAxis]);
          const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
          const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
          properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
          properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
          if (segment) {
            properties.parsed = parsed;
            properties.raw = _dataset.data[i];
          }
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? "active" : mode);
          }
          if (!directUpdate) {
            this.updateElement(point, i, properties, mode);
          }
          prevParsed = parsed;
        }
      }
      getMaxOverflow() {
        const meta = this._cachedMeta;
        const dataset = meta.dataset;
        const border = dataset.options && dataset.options.borderWidth || 0;
        const data = meta.data || [];
        if (!data.length) {
          return border;
        }
        const firstPoint = data[0].size(this.resolveDataElementOptions(0));
        const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
        return Math.max(border, firstPoint, lastPoint) / 2;
      }
      draw() {
        const meta = this._cachedMeta;
        meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
        super.draw();
      }
    };
    PolarAreaController = class extends DatasetController {
      static id = "polarArea";
      static defaults = {
        dataElementType: "arc",
        animation: {
          animateRotate: true,
          animateScale: true
        },
        animations: {
          numbers: {
            type: "number",
            properties: [
              "x",
              "y",
              "startAngle",
              "endAngle",
              "innerRadius",
              "outerRadius"
            ]
          }
        },
        indexAxis: "r",
        startAngle: 0
      };
      static overrides = {
        aspectRatio: 1,
        plugins: {
          legend: {
            labels: {
              generateLabels(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  const { labels: { pointStyle, color: color2 } } = chart.legend.options;
                  return data.labels.map((label2, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: label2,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.borderColor,
                      fontColor: color2,
                      lineWidth: style.borderWidth,
                      pointStyle,
                      hidden: !chart.getDataVisibility(i),
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick(e, legendItem, legend) {
              legend.chart.toggleDataVisibility(legendItem.index);
              legend.chart.update();
            }
          }
        },
        scales: {
          r: {
            type: "radialLinear",
            angleLines: {
              display: false
            },
            beginAtZero: true,
            grid: {
              circular: true
            },
            pointLabels: {
              display: false
            },
            startAngle: 0
          }
        }
      };
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.innerRadius = void 0;
        this.outerRadius = void 0;
      }
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const chart = this.chart;
        const labels = chart.data.labels || [];
        const value = formatNumber(meta._parsed[index2].r, chart.options.locale);
        return {
          label: labels[index2] || "",
          value
        };
      }
      parseObjectData(meta, data, start, count) {
        return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
      }
      update(mode) {
        const arcs = this._cachedMeta.data;
        this._updateRadius();
        this.updateElements(arcs, 0, arcs.length, mode);
      }
      getMinMax() {
        const meta = this._cachedMeta;
        const range = {
          min: Number.POSITIVE_INFINITY,
          max: Number.NEGATIVE_INFINITY
        };
        meta.data.forEach((element, index2) => {
          const parsed = this.getParsed(index2).r;
          if (!isNaN(parsed) && this.chart.getDataVisibility(index2)) {
            if (parsed < range.min) {
              range.min = parsed;
            }
            if (parsed > range.max) {
              range.max = parsed;
            }
          }
        });
        return range;
      }
      _updateRadius() {
        const chart = this.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        const outerRadius = Math.max(minSize / 2, 0);
        const innerRadius = Math.max(opts.cutoutPercentage ? outerRadius / 100 * opts.cutoutPercentage : 1, 0);
        const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
        this.outerRadius = outerRadius - radiusLength * this.index;
        this.innerRadius = this.outerRadius - radiusLength;
      }
      updateElements(arcs, start, count, mode) {
        const reset = mode === "reset";
        const chart = this.chart;
        const opts = chart.options;
        const animationOpts = opts.animation;
        const scale = this._cachedMeta.rScale;
        const centerX = scale.xCenter;
        const centerY = scale.yCenter;
        const datasetStartAngle = scale.getIndexAngle(0) - 0.5 * PI;
        let angle = datasetStartAngle;
        let i;
        const defaultAngle = 360 / this.countVisibleElements();
        for (i = 0; i < start; ++i) {
          angle += this._computeAngle(i, mode, defaultAngle);
        }
        for (i = start; i < start + count; i++) {
          const arc = arcs[i];
          let startAngle = angle;
          let endAngle = angle + this._computeAngle(i, mode, defaultAngle);
          let outerRadius = chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(this.getParsed(i).r) : 0;
          angle = endAngle;
          if (reset) {
            if (animationOpts.animateScale) {
              outerRadius = 0;
            }
            if (animationOpts.animateRotate) {
              startAngle = endAngle = datasetStartAngle;
            }
          }
          const properties = {
            x: centerX,
            y: centerY,
            innerRadius: 0,
            outerRadius,
            startAngle,
            endAngle,
            options: this.resolveDataElementOptions(i, arc.active ? "active" : mode)
          };
          this.updateElement(arc, i, properties, mode);
        }
      }
      countVisibleElements() {
        const meta = this._cachedMeta;
        let count = 0;
        meta.data.forEach((element, index2) => {
          if (!isNaN(this.getParsed(index2).r) && this.chart.getDataVisibility(index2)) {
            count++;
          }
        });
        return count;
      }
      _computeAngle(index2, mode, defaultAngle) {
        return this.chart.getDataVisibility(index2) ? toRadians(this.resolveDataElementOptions(index2, mode).angle || defaultAngle) : 0;
      }
    };
    PieController = class extends DoughnutController {
      static id = "pie";
      static defaults = {
        cutout: 0,
        rotation: 0,
        circumference: 360,
        radius: "100%"
      };
    };
    RadarController = class extends DatasetController {
      static id = "radar";
      static defaults = {
        datasetElementType: "line",
        dataElementType: "point",
        indexAxis: "r",
        showLine: true,
        elements: {
          line: {
            fill: "start"
          }
        }
      };
      static overrides = {
        aspectRatio: 1,
        scales: {
          r: {
            type: "radialLinear"
          }
        }
      };
      getLabelAndValue(index2) {
        const vScale = this._cachedMeta.vScale;
        const parsed = this.getParsed(index2);
        return {
          label: vScale.getLabels()[index2],
          value: "" + vScale.getLabelForValue(parsed[vScale.axis])
        };
      }
      parseObjectData(meta, data, start, count) {
        return _parseObjectDataRadialScale.bind(this)(meta, data, start, count);
      }
      update(mode) {
        const meta = this._cachedMeta;
        const line = meta.dataset;
        const points = meta.data || [];
        const labels = meta.iScale.getLabels();
        line.points = points;
        if (mode !== "resize") {
          const options = this.resolveDatasetElementOptions(mode);
          if (!this.options.showLine) {
            options.borderWidth = 0;
          }
          const properties = {
            _loop: true,
            _fullLoop: labels.length === points.length,
            options
          };
          this.updateElement(line, void 0, properties, mode);
        }
        this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const scale = this._cachedMeta.rScale;
        const reset = mode === "reset";
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const options = this.resolveDataElementOptions(i, point.active ? "active" : mode);
          const pointPosition = scale.getPointPositionForValue(i, this.getParsed(i).r);
          const x = reset ? scale.xCenter : pointPosition.x;
          const y = reset ? scale.yCenter : pointPosition.y;
          const properties = {
            x,
            y,
            angle: pointPosition.angle,
            skip: isNaN(x) || isNaN(y),
            options
          };
          this.updateElement(point, i, properties, mode);
        }
      }
    };
    ScatterController = class extends DatasetController {
      static id = "scatter";
      static defaults = {
        datasetElementType: false,
        dataElementType: "point",
        showLine: false,
        fill: false
      };
      static overrides = {
        interaction: {
          mode: "point"
        },
        scales: {
          x: {
            type: "linear"
          },
          y: {
            type: "linear"
          }
        }
      };
      getLabelAndValue(index2) {
        const meta = this._cachedMeta;
        const labels = this.chart.data.labels || [];
        const { xScale, yScale } = meta;
        const parsed = this.getParsed(index2);
        const x = xScale.getLabelForValue(parsed.x);
        const y = yScale.getLabelForValue(parsed.y);
        return {
          label: labels[index2] || "",
          value: "(" + x + ", " + y + ")"
        };
      }
      update(mode) {
        const meta = this._cachedMeta;
        const { data: points = [] } = meta;
        const animationsDisabled = this.chart._animationsDisabled;
        let { start, count } = _getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
        this._drawStart = start;
        this._drawCount = count;
        if (_scaleRangesChanged(meta)) {
          start = 0;
          count = points.length;
        }
        if (this.options.showLine) {
          if (!this.datasetElementType) {
            this.addElements();
          }
          const { dataset: line, _dataset } = meta;
          line._chart = this.chart;
          line._datasetIndex = this.index;
          line._decimated = !!_dataset._decimated;
          line.points = points;
          const options = this.resolveDatasetElementOptions(mode);
          options.segment = this.options.segment;
          this.updateElement(line, void 0, {
            animated: !animationsDisabled,
            options
          }, mode);
        } else if (this.datasetElementType) {
          delete meta.dataset;
          this.datasetElementType = false;
        }
        this.updateElements(points, start, count, mode);
      }
      addElements() {
        const { showLine } = this.options;
        if (!this.datasetElementType && showLine) {
          this.datasetElementType = this.chart.registry.getElement("line");
        }
        super.addElements();
      }
      updateElements(points, start, count, mode) {
        const reset = mode === "reset";
        const { iScale, vScale, _stacked, _dataset } = this._cachedMeta;
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions);
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const { spanGaps, segment } = this.options;
        const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
        const directUpdate = this.chart._animationsDisabled || reset || mode === "none";
        let prevParsed = start > 0 && this.getParsed(start - 1);
        for (let i = start; i < start + count; ++i) {
          const point = points[i];
          const parsed = this.getParsed(i);
          const properties = directUpdate ? point : {};
          const nullData = isNullOrUndef(parsed[vAxis]);
          const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
          const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
          properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
          properties.stop = i > 0 && Math.abs(parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
          if (segment) {
            properties.parsed = parsed;
            properties.raw = _dataset.data[i];
          }
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? "active" : mode);
          }
          if (!directUpdate) {
            this.updateElement(point, i, properties, mode);
          }
          prevParsed = parsed;
        }
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      getMaxOverflow() {
        const meta = this._cachedMeta;
        const data = meta.data || [];
        if (!this.options.showLine) {
          let max = 0;
          for (let i = data.length - 1; i >= 0; --i) {
            max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
          }
          return max > 0 && max;
        }
        const dataset = meta.dataset;
        const border = dataset.options && dataset.options.borderWidth || 0;
        if (!data.length) {
          return border;
        }
        const firstPoint = data[0].size(this.resolveDataElementOptions(0));
        const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
        return Math.max(border, firstPoint, lastPoint) / 2;
      }
    };
    controllers = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      BarController,
      BubbleController,
      DoughnutController,
      LineController,
      PieController,
      PolarAreaController,
      RadarController,
      ScatterController
    });
    DateAdapterBase = class _DateAdapterBase {
      /**
      * Override default date adapter methods.
      * Accepts type parameter to define options type.
      * @example
      * Chart._adapters._date.override<{myAdapterOption: string}>({
      *   init() {
      *     console.log(this.options.myAdapterOption);
      *   }
      * })
      */
      static override(members) {
        Object.assign(_DateAdapterBase.prototype, members);
      }
      options;
      constructor(options) {
        this.options = options || {};
      }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      init() {
      }
      formats() {
        return abstract();
      }
      parse() {
        return abstract();
      }
      format() {
        return abstract();
      }
      add() {
        return abstract();
      }
      diff() {
        return abstract();
      }
      startOf() {
        return abstract();
      }
      endOf() {
        return abstract();
      }
    };
    adapters = {
      _date: DateAdapterBase
    };
    Interaction = {
      evaluateInteractionItems,
      modes: {
        index(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || "x";
          const includeInvisible = options.includeInvisible || false;
          const items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
          const elements2 = [];
          if (!items.length) {
            return [];
          }
          chart.getSortedVisibleDatasetMetas().forEach((meta) => {
            const index2 = items[0].index;
            const element = meta.data[index2];
            if (element && !element.skip) {
              elements2.push({
                element,
                datasetIndex: meta.index,
                index: index2
              });
            }
          });
          return elements2;
        },
        dataset(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || "xy";
          const includeInvisible = options.includeInvisible || false;
          let items = options.intersect ? getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible) : getNearestItems(chart, position, axis, false, useFinalPosition, includeInvisible);
          if (items.length > 0) {
            const datasetIndex = items[0].datasetIndex;
            const data = chart.getDatasetMeta(datasetIndex).data;
            items = [];
            for (let i = 0; i < data.length; ++i) {
              items.push({
                element: data[i],
                datasetIndex,
                index: i
              });
            }
          }
          return items;
        },
        point(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || "xy";
          const includeInvisible = options.includeInvisible || false;
          return getIntersectItems(chart, position, axis, useFinalPosition, includeInvisible);
        },
        nearest(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || "xy";
          const includeInvisible = options.includeInvisible || false;
          return getNearestItems(chart, position, axis, options.intersect, useFinalPosition, includeInvisible);
        },
        x(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          return getAxisItems(chart, position, "x", options.intersect, useFinalPosition);
        },
        y(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          return getAxisItems(chart, position, "y", options.intersect, useFinalPosition);
        }
      }
    };
    STATIC_POSITIONS = [
      "left",
      "top",
      "right",
      "bottom"
    ];
    layouts = {
      addBox(chart, item) {
        if (!chart.boxes) {
          chart.boxes = [];
        }
        item.fullSize = item.fullSize || false;
        item.position = item.position || "top";
        item.weight = item.weight || 0;
        item._layers = item._layers || function() {
          return [
            {
              z: 0,
              draw(chartArea) {
                item.draw(chartArea);
              }
            }
          ];
        };
        chart.boxes.push(item);
      },
      removeBox(chart, layoutItem) {
        const index2 = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
        if (index2 !== -1) {
          chart.boxes.splice(index2, 1);
        }
      },
      configure(chart, item, options) {
        item.fullSize = options.fullSize;
        item.position = options.position;
        item.weight = options.weight;
      },
      update(chart, width, height, minPadding) {
        if (!chart) {
          return;
        }
        const padding2 = toPadding(chart.options.layout.padding);
        const availableWidth = Math.max(width - padding2.width, 0);
        const availableHeight = Math.max(height - padding2.height, 0);
        const boxes = buildLayoutBoxes(chart.boxes);
        const verticalBoxes = boxes.vertical;
        const horizontalBoxes = boxes.horizontal;
        each(chart.boxes, (box) => {
          if (typeof box.beforeLayout === "function") {
            box.beforeLayout();
          }
        });
        const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) => wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
        const params = Object.freeze({
          outerWidth: width,
          outerHeight: height,
          padding: padding2,
          availableWidth,
          availableHeight,
          vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
          hBoxMaxHeight: availableHeight / 2
        });
        const maxPadding = Object.assign({}, padding2);
        updateMaxPadding(maxPadding, toPadding(minPadding));
        const chartArea = Object.assign({
          maxPadding,
          w: availableWidth,
          h: availableHeight,
          x: padding2.left,
          y: padding2.top
        }, padding2);
        const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
        fitBoxes(boxes.fullSize, chartArea, params, stacks);
        fitBoxes(verticalBoxes, chartArea, params, stacks);
        if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
          fitBoxes(verticalBoxes, chartArea, params, stacks);
        }
        handleMaxPadding(chartArea);
        placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
        chartArea.x += chartArea.w;
        chartArea.y += chartArea.h;
        placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
        chart.chartArea = {
          left: chartArea.left,
          top: chartArea.top,
          right: chartArea.left + chartArea.w,
          bottom: chartArea.top + chartArea.h,
          height: chartArea.h,
          width: chartArea.w
        };
        each(boxes.chartArea, (layout) => {
          const box = layout.box;
          Object.assign(box, chart.chartArea);
          box.update(chartArea.w, chartArea.h, {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
          });
        });
      }
    };
    BasePlatform = class {
      acquireContext(canvas, aspectRatio) {
      }
      releaseContext(context) {
        return false;
      }
      addEventListener(chart, type, listener) {
      }
      removeEventListener(chart, type, listener) {
      }
      getDevicePixelRatio() {
        return 1;
      }
      getMaximumSize(element, width, height, aspectRatio) {
        width = Math.max(0, width || element.width);
        height = height || element.height;
        return {
          width,
          height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
        };
      }
      isAttached(canvas) {
        return true;
      }
      updateConfig(config) {
      }
    };
    BasicPlatform = class extends BasePlatform {
      acquireContext(item) {
        return item && item.getContext && item.getContext("2d") || null;
      }
      updateConfig(config) {
        config.options.animation = false;
      }
    };
    EXPANDO_KEY = "$chartjs";
    EVENT_TYPES = {
      touchstart: "mousedown",
      touchmove: "mousemove",
      touchend: "mouseup",
      pointerenter: "mouseenter",
      pointerdown: "mousedown",
      pointermove: "mousemove",
      pointerup: "mouseup",
      pointerleave: "mouseout",
      pointerout: "mouseout"
    };
    isNullOrEmpty = (value) => value === null || value === "";
    eventListenerOptions = supportsEventListenerOptions ? {
      passive: true
    } : false;
    drpListeningCharts = /* @__PURE__ */ new Map();
    oldDevicePixelRatio = 0;
    DomPlatform = class extends BasePlatform {
      acquireContext(canvas, aspectRatio) {
        const context = canvas && canvas.getContext && canvas.getContext("2d");
        if (context && context.canvas === canvas) {
          initCanvas(canvas, aspectRatio);
          return context;
        }
        return null;
      }
      releaseContext(context) {
        const canvas = context.canvas;
        if (!canvas[EXPANDO_KEY]) {
          return false;
        }
        const initial = canvas[EXPANDO_KEY].initial;
        [
          "height",
          "width"
        ].forEach((prop) => {
          const value = initial[prop];
          if (isNullOrUndef(value)) {
            canvas.removeAttribute(prop);
          } else {
            canvas.setAttribute(prop, value);
          }
        });
        const style = initial.style || {};
        Object.keys(style).forEach((key) => {
          canvas.style[key] = style[key];
        });
        canvas.width = canvas.width;
        delete canvas[EXPANDO_KEY];
        return true;
      }
      addEventListener(chart, type, listener) {
        this.removeEventListener(chart, type);
        const proxies = chart.$proxies || (chart.$proxies = {});
        const handlers = {
          attach: createAttachObserver,
          detach: createDetachObserver,
          resize: createResizeObserver
        };
        const handler = handlers[type] || createProxyAndListen;
        proxies[type] = handler(chart, type, listener);
      }
      removeEventListener(chart, type) {
        const proxies = chart.$proxies || (chart.$proxies = {});
        const proxy = proxies[type];
        if (!proxy) {
          return;
        }
        const handlers = {
          attach: releaseObserver,
          detach: releaseObserver,
          resize: releaseObserver
        };
        const handler = handlers[type] || removeListener;
        handler(chart, type, proxy);
        proxies[type] = void 0;
      }
      getDevicePixelRatio() {
        return window.devicePixelRatio;
      }
      getMaximumSize(canvas, width, height, aspectRatio) {
        return getMaximumSize(canvas, width, height, aspectRatio);
      }
      isAttached(canvas) {
        const container = canvas && _getParentNode(canvas);
        return !!(container && container.isConnected);
      }
    };
    Element = class {
      static defaults = {};
      static defaultRoutes = void 0;
      x;
      y;
      active = false;
      options;
      $animations;
      tooltipPosition(useFinalPosition) {
        const { x, y } = this.getProps([
          "x",
          "y"
        ], useFinalPosition);
        return {
          x,
          y
        };
      }
      hasValue() {
        return isNumber(this.x) && isNumber(this.y);
      }
      getProps(props, final) {
        const anims = this.$animations;
        if (!final || !anims) {
          return this;
        }
        const ret = {};
        props.forEach((prop) => {
          ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
        });
        return ret;
      }
    };
    reverseAlign = (align) => align === "left" ? "right" : align === "right" ? "left" : align;
    offsetFromEdge = (scale, edge, offset) => edge === "top" || edge === "left" ? scale[edge] + offset : scale[edge] - offset;
    getTicksLimit = (ticksLength, maxTicksLimit) => Math.min(maxTicksLimit || ticksLength, ticksLength);
    Scale = class _Scale extends Element {
      constructor(cfg) {
        super();
        this.id = cfg.id;
        this.type = cfg.type;
        this.options = void 0;
        this.ctx = cfg.ctx;
        this.chart = cfg.chart;
        this.top = void 0;
        this.bottom = void 0;
        this.left = void 0;
        this.right = void 0;
        this.width = void 0;
        this.height = void 0;
        this._margins = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
        this.maxWidth = void 0;
        this.maxHeight = void 0;
        this.paddingTop = void 0;
        this.paddingBottom = void 0;
        this.paddingLeft = void 0;
        this.paddingRight = void 0;
        this.axis = void 0;
        this.labelRotation = void 0;
        this.min = void 0;
        this.max = void 0;
        this._range = void 0;
        this.ticks = [];
        this._gridLineItems = null;
        this._labelItems = null;
        this._labelSizes = null;
        this._length = 0;
        this._maxLength = 0;
        this._longestTextCache = {};
        this._startPixel = void 0;
        this._endPixel = void 0;
        this._reversePixels = false;
        this._userMax = void 0;
        this._userMin = void 0;
        this._suggestedMax = void 0;
        this._suggestedMin = void 0;
        this._ticksLength = 0;
        this._borderValue = 0;
        this._cache = {};
        this._dataLimitsCached = false;
        this.$context = void 0;
      }
      init(options) {
        this.options = options.setContext(this.getContext());
        this.axis = options.axis;
        this._userMin = this.parse(options.min);
        this._userMax = this.parse(options.max);
        this._suggestedMin = this.parse(options.suggestedMin);
        this._suggestedMax = this.parse(options.suggestedMax);
      }
      parse(raw, index2) {
        return raw;
      }
      getUserBounds() {
        let { _userMin, _userMax, _suggestedMin, _suggestedMax } = this;
        _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
        _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
        _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
        _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
        return {
          min: finiteOrDefault(_userMin, _suggestedMin),
          max: finiteOrDefault(_userMax, _suggestedMax),
          minDefined: isNumberFinite(_userMin),
          maxDefined: isNumberFinite(_userMax)
        };
      }
      getMinMax(canStack) {
        let { min, max, minDefined, maxDefined } = this.getUserBounds();
        let range;
        if (minDefined && maxDefined) {
          return {
            min,
            max
          };
        }
        const metas = this.getMatchingVisibleMetas();
        for (let i = 0, ilen = metas.length; i < ilen; ++i) {
          range = metas[i].controller.getMinMax(this, canStack);
          if (!minDefined) {
            min = Math.min(min, range.min);
          }
          if (!maxDefined) {
            max = Math.max(max, range.max);
          }
        }
        min = maxDefined && min > max ? max : min;
        max = minDefined && min > max ? min : max;
        return {
          min: finiteOrDefault(min, finiteOrDefault(max, min)),
          max: finiteOrDefault(max, finiteOrDefault(min, max))
        };
      }
      getPadding() {
        return {
          left: this.paddingLeft || 0,
          top: this.paddingTop || 0,
          right: this.paddingRight || 0,
          bottom: this.paddingBottom || 0
        };
      }
      getTicks() {
        return this.ticks;
      }
      getLabels() {
        const data = this.chart.data;
        return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
      }
      getLabelItems(chartArea = this.chart.chartArea) {
        const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
        return items;
      }
      beforeLayout() {
        this._cache = {};
        this._dataLimitsCached = false;
      }
      beforeUpdate() {
        callback(this.options.beforeUpdate, [
          this
        ]);
      }
      update(maxWidth, maxHeight, margins) {
        const { beginAtZero, grace, ticks: tickOpts } = this.options;
        const sampleSize = tickOpts.sampleSize;
        this.beforeUpdate();
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this._margins = margins = Object.assign({
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }, margins);
        this.ticks = null;
        this._labelSizes = null;
        this._gridLineItems = null;
        this._labelItems = null;
        this.beforeSetDimensions();
        this.setDimensions();
        this.afterSetDimensions();
        this._maxLength = this.isHorizontal() ? this.width + margins.left + margins.right : this.height + margins.top + margins.bottom;
        if (!this._dataLimitsCached) {
          this.beforeDataLimits();
          this.determineDataLimits();
          this.afterDataLimits();
          this._range = _addGrace(this, grace, beginAtZero);
          this._dataLimitsCached = true;
        }
        this.beforeBuildTicks();
        this.ticks = this.buildTicks() || [];
        this.afterBuildTicks();
        const samplingEnabled = sampleSize < this.ticks.length;
        this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
        this.configure();
        this.beforeCalculateLabelRotation();
        this.calculateLabelRotation();
        this.afterCalculateLabelRotation();
        if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === "auto")) {
          this.ticks = autoSkip(this, this.ticks);
          this._labelSizes = null;
          this.afterAutoSkip();
        }
        if (samplingEnabled) {
          this._convertTicksToLabels(this.ticks);
        }
        this.beforeFit();
        this.fit();
        this.afterFit();
        this.afterUpdate();
      }
      configure() {
        let reversePixels = this.options.reverse;
        let startPixel, endPixel;
        if (this.isHorizontal()) {
          startPixel = this.left;
          endPixel = this.right;
        } else {
          startPixel = this.top;
          endPixel = this.bottom;
          reversePixels = !reversePixels;
        }
        this._startPixel = startPixel;
        this._endPixel = endPixel;
        this._reversePixels = reversePixels;
        this._length = endPixel - startPixel;
        this._alignToPixels = this.options.alignToPixels;
      }
      afterUpdate() {
        callback(this.options.afterUpdate, [
          this
        ]);
      }
      beforeSetDimensions() {
        callback(this.options.beforeSetDimensions, [
          this
        ]);
      }
      setDimensions() {
        if (this.isHorizontal()) {
          this.width = this.maxWidth;
          this.left = 0;
          this.right = this.width;
        } else {
          this.height = this.maxHeight;
          this.top = 0;
          this.bottom = this.height;
        }
        this.paddingLeft = 0;
        this.paddingTop = 0;
        this.paddingRight = 0;
        this.paddingBottom = 0;
      }
      afterSetDimensions() {
        callback(this.options.afterSetDimensions, [
          this
        ]);
      }
      _callHooks(name) {
        this.chart.notifyPlugins(name, this.getContext());
        callback(this.options[name], [
          this
        ]);
      }
      beforeDataLimits() {
        this._callHooks("beforeDataLimits");
      }
      determineDataLimits() {
      }
      afterDataLimits() {
        this._callHooks("afterDataLimits");
      }
      beforeBuildTicks() {
        this._callHooks("beforeBuildTicks");
      }
      buildTicks() {
        return [];
      }
      afterBuildTicks() {
        this._callHooks("afterBuildTicks");
      }
      beforeTickToLabelConversion() {
        callback(this.options.beforeTickToLabelConversion, [
          this
        ]);
      }
      generateTickLabels(ticks) {
        const tickOpts = this.options.ticks;
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; i++) {
          tick = ticks[i];
          tick.label = callback(tickOpts.callback, [
            tick.value,
            i,
            ticks
          ], this);
        }
      }
      afterTickToLabelConversion() {
        callback(this.options.afterTickToLabelConversion, [
          this
        ]);
      }
      beforeCalculateLabelRotation() {
        callback(this.options.beforeCalculateLabelRotation, [
          this
        ]);
      }
      calculateLabelRotation() {
        const options = this.options;
        const tickOpts = options.ticks;
        const numTicks = getTicksLimit(this.ticks.length, options.ticks.maxTicksLimit);
        const minRotation = tickOpts.minRotation || 0;
        const maxRotation = tickOpts.maxRotation;
        let labelRotation = minRotation;
        let tickWidth, maxHeight, maxLabelDiagonal;
        if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
          this.labelRotation = minRotation;
          return;
        }
        const labelSizes = this._getLabelSizes();
        const maxLabelWidth = labelSizes.widest.width;
        const maxLabelHeight = labelSizes.highest.height;
        const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
        tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
        if (maxLabelWidth + 6 > tickWidth) {
          tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
          maxHeight = this.maxHeight - getTickMarkLength(options.grid) - tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
          maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
          labelRotation = toDegrees(Math.min(Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)), Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))));
          labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
        }
        this.labelRotation = labelRotation;
      }
      afterCalculateLabelRotation() {
        callback(this.options.afterCalculateLabelRotation, [
          this
        ]);
      }
      afterAutoSkip() {
      }
      beforeFit() {
        callback(this.options.beforeFit, [
          this
        ]);
      }
      fit() {
        const minSize = {
          width: 0,
          height: 0
        };
        const { chart, options: { ticks: tickOpts, title: titleOpts, grid: gridOpts } } = this;
        const display = this._isVisible();
        const isHorizontal = this.isHorizontal();
        if (display) {
          const titleHeight = getTitleHeight(titleOpts, chart.options.font);
          if (isHorizontal) {
            minSize.width = this.maxWidth;
            minSize.height = getTickMarkLength(gridOpts) + titleHeight;
          } else {
            minSize.height = this.maxHeight;
            minSize.width = getTickMarkLength(gridOpts) + titleHeight;
          }
          if (tickOpts.display && this.ticks.length) {
            const { first, last, widest, highest } = this._getLabelSizes();
            const tickPadding = tickOpts.padding * 2;
            const angleRadians = toRadians(this.labelRotation);
            const cos = Math.cos(angleRadians);
            const sin = Math.sin(angleRadians);
            if (isHorizontal) {
              const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
              minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
            } else {
              const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
              minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
            }
            this._calculatePadding(first, last, sin, cos);
          }
        }
        this._handleMargins();
        if (isHorizontal) {
          this.width = this._length = chart.width - this._margins.left - this._margins.right;
          this.height = minSize.height;
        } else {
          this.width = minSize.width;
          this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
        }
      }
      _calculatePadding(first, last, sin, cos) {
        const { ticks: { align, padding: padding2 }, position } = this.options;
        const isRotated = this.labelRotation !== 0;
        const labelsBelowTicks = position !== "top" && this.axis === "x";
        if (this.isHorizontal()) {
          const offsetLeft = this.getPixelForTick(0) - this.left;
          const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
          let paddingLeft = 0;
          let paddingRight = 0;
          if (isRotated) {
            if (labelsBelowTicks) {
              paddingLeft = cos * first.width;
              paddingRight = sin * last.height;
            } else {
              paddingLeft = sin * first.height;
              paddingRight = cos * last.width;
            }
          } else if (align === "start") {
            paddingRight = last.width;
          } else if (align === "end") {
            paddingLeft = first.width;
          } else if (align !== "inner") {
            paddingLeft = first.width / 2;
            paddingRight = last.width / 2;
          }
          this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding2) * this.width / (this.width - offsetLeft), 0);
          this.paddingRight = Math.max((paddingRight - offsetRight + padding2) * this.width / (this.width - offsetRight), 0);
        } else {
          let paddingTop = last.height / 2;
          let paddingBottom = first.height / 2;
          if (align === "start") {
            paddingTop = 0;
            paddingBottom = first.height;
          } else if (align === "end") {
            paddingTop = last.height;
            paddingBottom = 0;
          }
          this.paddingTop = paddingTop + padding2;
          this.paddingBottom = paddingBottom + padding2;
        }
      }
      _handleMargins() {
        if (this._margins) {
          this._margins.left = Math.max(this.paddingLeft, this._margins.left);
          this._margins.top = Math.max(this.paddingTop, this._margins.top);
          this._margins.right = Math.max(this.paddingRight, this._margins.right);
          this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
        }
      }
      afterFit() {
        callback(this.options.afterFit, [
          this
        ]);
      }
      isHorizontal() {
        const { axis, position } = this.options;
        return position === "top" || position === "bottom" || axis === "x";
      }
      isFullSize() {
        return this.options.fullSize;
      }
      _convertTicksToLabels(ticks) {
        this.beforeTickToLabelConversion();
        this.generateTickLabels(ticks);
        let i, ilen;
        for (i = 0, ilen = ticks.length; i < ilen; i++) {
          if (isNullOrUndef(ticks[i].label)) {
            ticks.splice(i, 1);
            ilen--;
            i--;
          }
        }
        this.afterTickToLabelConversion();
      }
      _getLabelSizes() {
        let labelSizes = this._labelSizes;
        if (!labelSizes) {
          const sampleSize = this.options.ticks.sampleSize;
          let ticks = this.ticks;
          if (sampleSize < ticks.length) {
            ticks = sample(ticks, sampleSize);
          }
          this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length, this.options.ticks.maxTicksLimit);
        }
        return labelSizes;
      }
      _computeLabelSizes(ticks, length, maxTicksLimit) {
        const { ctx, _longestTextCache: caches } = this;
        const widths = [];
        const heights = [];
        const increment = Math.floor(length / getTicksLimit(length, maxTicksLimit));
        let widestLabelSize = 0;
        let highestLabelSize = 0;
        let i, j, jlen, label2, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
        for (i = 0; i < length; i += increment) {
          label2 = ticks[i].label;
          tickFont = this._resolveTickFontOptions(i);
          ctx.font = fontString = tickFont.string;
          cache = caches[fontString] = caches[fontString] || {
            data: {},
            gc: []
          };
          lineHeight = tickFont.lineHeight;
          width = height = 0;
          if (!isNullOrUndef(label2) && !isArray(label2)) {
            width = _measureText(ctx, cache.data, cache.gc, width, label2);
            height = lineHeight;
          } else if (isArray(label2)) {
            for (j = 0, jlen = label2.length; j < jlen; ++j) {
              nestedLabel = label2[j];
              if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
                width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
                height += lineHeight;
              }
            }
          }
          widths.push(width);
          heights.push(height);
          widestLabelSize = Math.max(width, widestLabelSize);
          highestLabelSize = Math.max(height, highestLabelSize);
        }
        garbageCollect(caches, length);
        const widest = widths.indexOf(widestLabelSize);
        const highest = heights.indexOf(highestLabelSize);
        const valueAt = (idx) => ({
          width: widths[idx] || 0,
          height: heights[idx] || 0
        });
        return {
          first: valueAt(0),
          last: valueAt(length - 1),
          widest: valueAt(widest),
          highest: valueAt(highest),
          widths,
          heights
        };
      }
      getLabelForValue(value) {
        return value;
      }
      getPixelForValue(value, index2) {
        return NaN;
      }
      getValueForPixel(pixel) {
      }
      getPixelForTick(index2) {
        const ticks = this.ticks;
        if (index2 < 0 || index2 > ticks.length - 1) {
          return null;
        }
        return this.getPixelForValue(ticks[index2].value);
      }
      getPixelForDecimal(decimal) {
        if (this._reversePixels) {
          decimal = 1 - decimal;
        }
        const pixel = this._startPixel + decimal * this._length;
        return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
      }
      getDecimalForPixel(pixel) {
        const decimal = (pixel - this._startPixel) / this._length;
        return this._reversePixels ? 1 - decimal : decimal;
      }
      getBasePixel() {
        return this.getPixelForValue(this.getBaseValue());
      }
      getBaseValue() {
        const { min, max } = this;
        return min < 0 && max < 0 ? max : min > 0 && max > 0 ? min : 0;
      }
      getContext(index2) {
        const ticks = this.ticks || [];
        if (index2 >= 0 && index2 < ticks.length) {
          const tick = ticks[index2];
          return tick.$context || (tick.$context = createTickContext(this.getContext(), index2, tick));
        }
        return this.$context || (this.$context = createScaleContext(this.chart.getContext(), this));
      }
      _tickSize() {
        const optionTicks = this.options.ticks;
        const rot = toRadians(this.labelRotation);
        const cos = Math.abs(Math.cos(rot));
        const sin = Math.abs(Math.sin(rot));
        const labelSizes = this._getLabelSizes();
        const padding2 = optionTicks.autoSkipPadding || 0;
        const w = labelSizes ? labelSizes.widest.width + padding2 : 0;
        const h3 = labelSizes ? labelSizes.highest.height + padding2 : 0;
        return this.isHorizontal() ? h3 * cos > w * sin ? w / cos : h3 / sin : h3 * sin < w * cos ? h3 / cos : w / sin;
      }
      _isVisible() {
        const display = this.options.display;
        if (display !== "auto") {
          return !!display;
        }
        return this.getMatchingVisibleMetas().length > 0;
      }
      _computeGridLineItems(chartArea) {
        const axis = this.axis;
        const chart = this.chart;
        const options = this.options;
        const { grid, position, border } = options;
        const offset = grid.offset;
        const isHorizontal = this.isHorizontal();
        const ticks = this.ticks;
        const ticksLength = ticks.length + (offset ? 1 : 0);
        const tl = getTickMarkLength(grid);
        const items = [];
        const borderOpts = border.setContext(this.getContext());
        const axisWidth = borderOpts.display ? borderOpts.width : 0;
        const axisHalfWidth = axisWidth / 2;
        const alignBorderValue = function(pixel) {
          return _alignPixel(chart, pixel, axisWidth);
        };
        let borderValue, i, lineValue, alignedLineValue;
        let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
        if (position === "top") {
          borderValue = alignBorderValue(this.bottom);
          ty1 = this.bottom - tl;
          ty2 = borderValue - axisHalfWidth;
          y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
          y2 = chartArea.bottom;
        } else if (position === "bottom") {
          borderValue = alignBorderValue(this.top);
          y1 = chartArea.top;
          y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
          ty1 = borderValue + axisHalfWidth;
          ty2 = this.top + tl;
        } else if (position === "left") {
          borderValue = alignBorderValue(this.right);
          tx1 = this.right - tl;
          tx2 = borderValue - axisHalfWidth;
          x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
          x2 = chartArea.right;
        } else if (position === "right") {
          borderValue = alignBorderValue(this.left);
          x1 = chartArea.left;
          x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
          tx1 = borderValue + axisHalfWidth;
          tx2 = this.left + tl;
        } else if (axis === "x") {
          if (position === "center") {
            borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
          }
          y1 = chartArea.top;
          y2 = chartArea.bottom;
          ty1 = borderValue + axisHalfWidth;
          ty2 = ty1 + tl;
        } else if (axis === "y") {
          if (position === "center") {
            borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
          }
          tx1 = borderValue - axisHalfWidth;
          tx2 = tx1 - tl;
          x1 = chartArea.left;
          x2 = chartArea.right;
        }
        const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
        const step = Math.max(1, Math.ceil(ticksLength / limit));
        for (i = 0; i < ticksLength; i += step) {
          const context = this.getContext(i);
          const optsAtIndex = grid.setContext(context);
          const optsAtIndexBorder = border.setContext(context);
          const lineWidth = optsAtIndex.lineWidth;
          const lineColor = optsAtIndex.color;
          const borderDash = optsAtIndexBorder.dash || [];
          const borderDashOffset = optsAtIndexBorder.dashOffset;
          const tickWidth = optsAtIndex.tickWidth;
          const tickColor = optsAtIndex.tickColor;
          const tickBorderDash = optsAtIndex.tickBorderDash || [];
          const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
          lineValue = getPixelForGridLine(this, i, offset);
          if (lineValue === void 0) {
            continue;
          }
          alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
          if (isHorizontal) {
            tx1 = tx2 = x1 = x2 = alignedLineValue;
          } else {
            ty1 = ty2 = y1 = y2 = alignedLineValue;
          }
          items.push({
            tx1,
            ty1,
            tx2,
            ty2,
            x1,
            y1,
            x2,
            y2,
            width: lineWidth,
            color: lineColor,
            borderDash,
            borderDashOffset,
            tickWidth,
            tickColor,
            tickBorderDash,
            tickBorderDashOffset
          });
        }
        this._ticksLength = ticksLength;
        this._borderValue = borderValue;
        return items;
      }
      _computeLabelItems(chartArea) {
        const axis = this.axis;
        const options = this.options;
        const { position, ticks: optionTicks } = options;
        const isHorizontal = this.isHorizontal();
        const ticks = this.ticks;
        const { align, crossAlign, padding: padding2, mirror } = optionTicks;
        const tl = getTickMarkLength(options.grid);
        const tickAndPadding = tl + padding2;
        const hTickAndPadding = mirror ? -padding2 : tickAndPadding;
        const rotation = -toRadians(this.labelRotation);
        const items = [];
        let i, ilen, tick, label2, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
        let textBaseline = "middle";
        if (position === "top") {
          y = this.bottom - hTickAndPadding;
          textAlign = this._getXAxisLabelAlignment();
        } else if (position === "bottom") {
          y = this.top + hTickAndPadding;
          textAlign = this._getXAxisLabelAlignment();
        } else if (position === "left") {
          const ret = this._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (position === "right") {
          const ret = this._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (axis === "x") {
          if (position === "center") {
            y = (chartArea.top + chartArea.bottom) / 2 + tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
          }
          textAlign = this._getXAxisLabelAlignment();
        } else if (axis === "y") {
          if (position === "center") {
            x = (chartArea.left + chartArea.right) / 2 - tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            x = this.chart.scales[positionAxisID].getPixelForValue(value);
          }
          textAlign = this._getYAxisLabelAlignment(tl).textAlign;
        }
        if (axis === "y") {
          if (align === "start") {
            textBaseline = "top";
          } else if (align === "end") {
            textBaseline = "bottom";
          }
        }
        const labelSizes = this._getLabelSizes();
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          label2 = tick.label;
          const optsAtIndex = optionTicks.setContext(this.getContext(i));
          pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
          font = this._resolveTickFontOptions(i);
          lineHeight = font.lineHeight;
          lineCount = isArray(label2) ? label2.length : 1;
          const halfCount = lineCount / 2;
          const color2 = optsAtIndex.color;
          const strokeColor = optsAtIndex.textStrokeColor;
          const strokeWidth = optsAtIndex.textStrokeWidth;
          let tickTextAlign = textAlign;
          if (isHorizontal) {
            x = pixel;
            if (textAlign === "inner") {
              if (i === ilen - 1) {
                tickTextAlign = !this.options.reverse ? "right" : "left";
              } else if (i === 0) {
                tickTextAlign = !this.options.reverse ? "left" : "right";
              } else {
                tickTextAlign = "center";
              }
            }
            if (position === "top") {
              if (crossAlign === "near" || rotation !== 0) {
                textOffset = -lineCount * lineHeight + lineHeight / 2;
              } else if (crossAlign === "center") {
                textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
              } else {
                textOffset = -labelSizes.highest.height + lineHeight / 2;
              }
            } else {
              if (crossAlign === "near" || rotation !== 0) {
                textOffset = lineHeight / 2;
              } else if (crossAlign === "center") {
                textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
              } else {
                textOffset = labelSizes.highest.height - lineCount * lineHeight;
              }
            }
            if (mirror) {
              textOffset *= -1;
            }
            if (rotation !== 0 && !optsAtIndex.showLabelBackdrop) {
              x += lineHeight / 2 * Math.sin(rotation);
            }
          } else {
            y = pixel;
            textOffset = (1 - lineCount) * lineHeight / 2;
          }
          let backdrop;
          if (optsAtIndex.showLabelBackdrop) {
            const labelPadding = toPadding(optsAtIndex.backdropPadding);
            const height = labelSizes.heights[i];
            const width = labelSizes.widths[i];
            let top = textOffset - labelPadding.top;
            let left = 0 - labelPadding.left;
            switch (textBaseline) {
              case "middle":
                top -= height / 2;
                break;
              case "bottom":
                top -= height;
                break;
            }
            switch (textAlign) {
              case "center":
                left -= width / 2;
                break;
              case "right":
                left -= width;
                break;
              case "inner":
                if (i === ilen - 1) {
                  left -= width;
                } else if (i > 0) {
                  left -= width / 2;
                }
                break;
            }
            backdrop = {
              left,
              top,
              width: width + labelPadding.width,
              height: height + labelPadding.height,
              color: optsAtIndex.backdropColor
            };
          }
          items.push({
            label: label2,
            font,
            textOffset,
            options: {
              rotation,
              color: color2,
              strokeColor,
              strokeWidth,
              textAlign: tickTextAlign,
              textBaseline,
              translation: [
                x,
                y
              ],
              backdrop
            }
          });
        }
        return items;
      }
      _getXAxisLabelAlignment() {
        const { position, ticks } = this.options;
        const rotation = -toRadians(this.labelRotation);
        if (rotation) {
          return position === "top" ? "left" : "right";
        }
        let align = "center";
        if (ticks.align === "start") {
          align = "left";
        } else if (ticks.align === "end") {
          align = "right";
        } else if (ticks.align === "inner") {
          align = "inner";
        }
        return align;
      }
      _getYAxisLabelAlignment(tl) {
        const { position, ticks: { crossAlign, mirror, padding: padding2 } } = this.options;
        const labelSizes = this._getLabelSizes();
        const tickAndPadding = tl + padding2;
        const widest = labelSizes.widest.width;
        let textAlign;
        let x;
        if (position === "left") {
          if (mirror) {
            x = this.right + padding2;
            if (crossAlign === "near") {
              textAlign = "left";
            } else if (crossAlign === "center") {
              textAlign = "center";
              x += widest / 2;
            } else {
              textAlign = "right";
              x += widest;
            }
          } else {
            x = this.right - tickAndPadding;
            if (crossAlign === "near") {
              textAlign = "right";
            } else if (crossAlign === "center") {
              textAlign = "center";
              x -= widest / 2;
            } else {
              textAlign = "left";
              x = this.left;
            }
          }
        } else if (position === "right") {
          if (mirror) {
            x = this.left + padding2;
            if (crossAlign === "near") {
              textAlign = "right";
            } else if (crossAlign === "center") {
              textAlign = "center";
              x -= widest / 2;
            } else {
              textAlign = "left";
              x -= widest;
            }
          } else {
            x = this.left + tickAndPadding;
            if (crossAlign === "near") {
              textAlign = "left";
            } else if (crossAlign === "center") {
              textAlign = "center";
              x += widest / 2;
            } else {
              textAlign = "right";
              x = this.right;
            }
          }
        } else {
          textAlign = "right";
        }
        return {
          textAlign,
          x
        };
      }
      _computeLabelArea() {
        if (this.options.ticks.mirror) {
          return;
        }
        const chart = this.chart;
        const position = this.options.position;
        if (position === "left" || position === "right") {
          return {
            top: 0,
            left: this.left,
            bottom: chart.height,
            right: this.right
          };
        }
        if (position === "top" || position === "bottom") {
          return {
            top: this.top,
            left: 0,
            bottom: this.bottom,
            right: chart.width
          };
        }
      }
      drawBackground() {
        const { ctx, options: { backgroundColor }, left, top, width, height } = this;
        if (backgroundColor) {
          ctx.save();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(left, top, width, height);
          ctx.restore();
        }
      }
      getLineWidthForValue(value) {
        const grid = this.options.grid;
        if (!this._isVisible() || !grid.display) {
          return 0;
        }
        const ticks = this.ticks;
        const index2 = ticks.findIndex((t) => t.value === value);
        if (index2 >= 0) {
          const opts = grid.setContext(this.getContext(index2));
          return opts.lineWidth;
        }
        return 0;
      }
      drawGrid(chartArea) {
        const grid = this.options.grid;
        const ctx = this.ctx;
        const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
        let i, ilen;
        const drawLine = (p1, p2, style) => {
          if (!style.width || !style.color) {
            return;
          }
          ctx.save();
          ctx.lineWidth = style.width;
          ctx.strokeStyle = style.color;
          ctx.setLineDash(style.borderDash || []);
          ctx.lineDashOffset = style.borderDashOffset;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        };
        if (grid.display) {
          for (i = 0, ilen = items.length; i < ilen; ++i) {
            const item = items[i];
            if (grid.drawOnChartArea) {
              drawLine({
                x: item.x1,
                y: item.y1
              }, {
                x: item.x2,
                y: item.y2
              }, item);
            }
            if (grid.drawTicks) {
              drawLine({
                x: item.tx1,
                y: item.ty1
              }, {
                x: item.tx2,
                y: item.ty2
              }, {
                color: item.tickColor,
                width: item.tickWidth,
                borderDash: item.tickBorderDash,
                borderDashOffset: item.tickBorderDashOffset
              });
            }
          }
        }
      }
      drawBorder() {
        const { chart, ctx, options: { border, grid } } = this;
        const borderOpts = border.setContext(this.getContext());
        const axisWidth = border.display ? borderOpts.width : 0;
        if (!axisWidth) {
          return;
        }
        const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
        const borderValue = this._borderValue;
        let x1, x2, y1, y2;
        if (this.isHorizontal()) {
          x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
          x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
          y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        ctx.save();
        ctx.lineWidth = borderOpts.width;
        ctx.strokeStyle = borderOpts.color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
      drawLabels(chartArea) {
        const optionTicks = this.options.ticks;
        if (!optionTicks.display) {
          return;
        }
        const ctx = this.ctx;
        const area = this._computeLabelArea();
        if (area) {
          clipArea(ctx, area);
        }
        const items = this.getLabelItems(chartArea);
        for (const item of items) {
          const renderTextOptions = item.options;
          const tickFont = item.font;
          const label2 = item.label;
          const y = item.textOffset;
          renderText(ctx, label2, 0, y, tickFont, renderTextOptions);
        }
        if (area) {
          unclipArea(ctx);
        }
      }
      drawTitle() {
        const { ctx, options: { position, title, reverse } } = this;
        if (!title.display) {
          return;
        }
        const font = toFont(title.font);
        const padding2 = toPadding(title.padding);
        const align = title.align;
        let offset = font.lineHeight / 2;
        if (position === "bottom" || position === "center" || isObject(position)) {
          offset += padding2.bottom;
          if (isArray(title.text)) {
            offset += font.lineHeight * (title.text.length - 1);
          }
        } else {
          offset += padding2.top;
        }
        const { titleX, titleY, maxWidth, rotation } = titleArgs(this, offset, position, align);
        renderText(ctx, title.text, 0, 0, font, {
          color: title.color,
          maxWidth,
          rotation,
          textAlign: titleAlign(align, position, reverse),
          textBaseline: "middle",
          translation: [
            titleX,
            titleY
          ]
        });
      }
      draw(chartArea) {
        if (!this._isVisible()) {
          return;
        }
        this.drawBackground();
        this.drawGrid(chartArea);
        this.drawBorder();
        this.drawTitle();
        this.drawLabels(chartArea);
      }
      _layers() {
        const opts = this.options;
        const tz = opts.ticks && opts.ticks.z || 0;
        const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
        const bz = valueOrDefault(opts.border && opts.border.z, 0);
        if (!this._isVisible() || this.draw !== _Scale.prototype.draw) {
          return [
            {
              z: tz,
              draw: (chartArea) => {
                this.draw(chartArea);
              }
            }
          ];
        }
        return [
          {
            z: gz,
            draw: (chartArea) => {
              this.drawBackground();
              this.drawGrid(chartArea);
              this.drawTitle();
            }
          },
          {
            z: bz,
            draw: () => {
              this.drawBorder();
            }
          },
          {
            z: tz,
            draw: (chartArea) => {
              this.drawLabels(chartArea);
            }
          }
        ];
      }
      getMatchingVisibleMetas(type) {
        const metas = this.chart.getSortedVisibleDatasetMetas();
        const axisID = this.axis + "AxisID";
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          const meta = metas[i];
          if (meta[axisID] === this.id && (!type || meta.type === type)) {
            result.push(meta);
          }
        }
        return result;
      }
      _resolveTickFontOptions(index2) {
        const opts = this.options.ticks.setContext(this.getContext(index2));
        return toFont(opts.font);
      }
      _maxDigits() {
        const fontSize = this._resolveTickFontOptions(0).lineHeight;
        return (this.isHorizontal() ? this.width : this.height) / fontSize;
      }
    };
    TypedRegistry = class {
      constructor(type, scope, override) {
        this.type = type;
        this.scope = scope;
        this.override = override;
        this.items = /* @__PURE__ */ Object.create(null);
      }
      isForType(type) {
        return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
      }
      register(item) {
        const proto = Object.getPrototypeOf(item);
        let parentScope;
        if (isIChartComponent(proto)) {
          parentScope = this.register(proto);
        }
        const items = this.items;
        const id = item.id;
        const scope = this.scope + "." + id;
        if (!id) {
          throw new Error("class does not have id: " + item);
        }
        if (id in items) {
          return scope;
        }
        items[id] = item;
        registerDefaults(item, scope, parentScope);
        if (this.override) {
          defaults.override(item.id, item.overrides);
        }
        return scope;
      }
      get(id) {
        return this.items[id];
      }
      unregister(item) {
        const items = this.items;
        const id = item.id;
        const scope = this.scope;
        if (id in items) {
          delete items[id];
        }
        if (scope && id in defaults[scope]) {
          delete defaults[scope][id];
          if (this.override) {
            delete overrides[id];
          }
        }
      }
    };
    Registry = class {
      constructor() {
        this.controllers = new TypedRegistry(DatasetController, "datasets", true);
        this.elements = new TypedRegistry(Element, "elements");
        this.plugins = new TypedRegistry(Object, "plugins");
        this.scales = new TypedRegistry(Scale, "scales");
        this._typedRegistries = [
          this.controllers,
          this.scales,
          this.elements
        ];
      }
      add(...args) {
        this._each("register", args);
      }
      remove(...args) {
        this._each("unregister", args);
      }
      addControllers(...args) {
        this._each("register", args, this.controllers);
      }
      addElements(...args) {
        this._each("register", args, this.elements);
      }
      addPlugins(...args) {
        this._each("register", args, this.plugins);
      }
      addScales(...args) {
        this._each("register", args, this.scales);
      }
      getController(id) {
        return this._get(id, this.controllers, "controller");
      }
      getElement(id) {
        return this._get(id, this.elements, "element");
      }
      getPlugin(id) {
        return this._get(id, this.plugins, "plugin");
      }
      getScale(id) {
        return this._get(id, this.scales, "scale");
      }
      removeControllers(...args) {
        this._each("unregister", args, this.controllers);
      }
      removeElements(...args) {
        this._each("unregister", args, this.elements);
      }
      removePlugins(...args) {
        this._each("unregister", args, this.plugins);
      }
      removeScales(...args) {
        this._each("unregister", args, this.scales);
      }
      _each(method, args, typedRegistry) {
        [
          ...args
        ].forEach((arg) => {
          const reg = typedRegistry || this._getRegistryForType(arg);
          if (typedRegistry || reg.isForType(arg) || reg === this.plugins && arg.id) {
            this._exec(method, reg, arg);
          } else {
            each(arg, (item) => {
              const itemReg = typedRegistry || this._getRegistryForType(item);
              this._exec(method, itemReg, item);
            });
          }
        });
      }
      _exec(method, registry2, component) {
        const camelMethod = _capitalize(method);
        callback(component["before" + camelMethod], [], component);
        registry2[method](component);
        callback(component["after" + camelMethod], [], component);
      }
      _getRegistryForType(type) {
        for (let i = 0; i < this._typedRegistries.length; i++) {
          const reg = this._typedRegistries[i];
          if (reg.isForType(type)) {
            return reg;
          }
        }
        return this.plugins;
      }
      _get(id, typedRegistry, type) {
        const item = typedRegistry.get(id);
        if (item === void 0) {
          throw new Error('"' + id + '" is not a registered ' + type + ".");
        }
        return item;
      }
    };
    registry = /* @__PURE__ */ new Registry();
    PluginService = class {
      constructor() {
        this._init = void 0;
      }
      notify(chart, hook, args, filter) {
        if (hook === "beforeInit") {
          this._init = this._createDescriptors(chart, true);
          this._notify(this._init, chart, "install");
        }
        if (this._init === void 0) {
          return;
        }
        const descriptors2 = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
        const result = this._notify(descriptors2, chart, hook, args);
        if (hook === "afterDestroy") {
          this._notify(descriptors2, chart, "stop");
          this._notify(this._init, chart, "uninstall");
          this._init = void 0;
        }
        return result;
      }
      _notify(descriptors2, chart, hook, args) {
        args = args || {};
        for (const descriptor of descriptors2) {
          const plugin = descriptor.plugin;
          const method = plugin[hook];
          const params = [
            chart,
            args,
            descriptor.options
          ];
          if (callback(method, params, plugin) === false && args.cancelable) {
            return false;
          }
        }
        return true;
      }
      invalidate() {
        if (!isNullOrUndef(this._cache)) {
          this._oldCache = this._cache;
          this._cache = void 0;
        }
      }
      _descriptors(chart) {
        if (this._cache) {
          return this._cache;
        }
        const descriptors2 = this._cache = this._createDescriptors(chart);
        this._notifyStateChanges(chart);
        return descriptors2;
      }
      _createDescriptors(chart, all) {
        const config = chart && chart.config;
        const options = valueOrDefault(config.options && config.options.plugins, {});
        const plugins2 = allPlugins(config);
        return options === false && !all ? [] : createDescriptors(chart, plugins2, options, all);
      }
      _notifyStateChanges(chart) {
        const previousDescriptors = this._oldCache || [];
        const descriptors2 = this._cache;
        const diff = (a, b) => a.filter((x) => !b.some((y) => x.plugin.id === y.plugin.id));
        this._notify(diff(previousDescriptors, descriptors2), chart, "stop");
        this._notify(diff(descriptors2, previousDescriptors), chart, "start");
      }
    };
    keyCache = /* @__PURE__ */ new Map();
    keysCached = /* @__PURE__ */ new Set();
    addIfFound = (set2, obj, key) => {
      const opts = resolveObjectKey(obj, key);
      if (opts !== void 0) {
        set2.add(opts);
      }
    };
    Config = class {
      constructor(config) {
        this._config = initConfig(config);
        this._scopeCache = /* @__PURE__ */ new Map();
        this._resolverCache = /* @__PURE__ */ new Map();
      }
      get platform() {
        return this._config.platform;
      }
      get type() {
        return this._config.type;
      }
      set type(type) {
        this._config.type = type;
      }
      get data() {
        return this._config.data;
      }
      set data(data) {
        this._config.data = initData(data);
      }
      get options() {
        return this._config.options;
      }
      set options(options) {
        this._config.options = options;
      }
      get plugins() {
        return this._config.plugins;
      }
      update() {
        const config = this._config;
        this.clearCache();
        initOptions(config);
      }
      clearCache() {
        this._scopeCache.clear();
        this._resolverCache.clear();
      }
      datasetScopeKeys(datasetType) {
        return cachedKeys(datasetType, () => [
          [
            `datasets.${datasetType}`,
            ""
          ]
        ]);
      }
      datasetAnimationScopeKeys(datasetType, transition) {
        return cachedKeys(`${datasetType}.transition.${transition}`, () => [
          [
            `datasets.${datasetType}.transitions.${transition}`,
            `transitions.${transition}`
          ],
          [
            `datasets.${datasetType}`,
            ""
          ]
        ]);
      }
      datasetElementScopeKeys(datasetType, elementType) {
        return cachedKeys(`${datasetType}-${elementType}`, () => [
          [
            `datasets.${datasetType}.elements.${elementType}`,
            `datasets.${datasetType}`,
            `elements.${elementType}`,
            ""
          ]
        ]);
      }
      pluginScopeKeys(plugin) {
        const id = plugin.id;
        const type = this.type;
        return cachedKeys(`${type}-plugin-${id}`, () => [
          [
            `plugins.${id}`,
            ...plugin.additionalOptionScopes || []
          ]
        ]);
      }
      _cachedScopes(mainScope, resetCache) {
        const _scopeCache = this._scopeCache;
        let cache = _scopeCache.get(mainScope);
        if (!cache || resetCache) {
          cache = /* @__PURE__ */ new Map();
          _scopeCache.set(mainScope, cache);
        }
        return cache;
      }
      getOptionScopes(mainScope, keyLists, resetCache) {
        const { options, type } = this;
        const cache = this._cachedScopes(mainScope, resetCache);
        const cached = cache.get(keyLists);
        if (cached) {
          return cached;
        }
        const scopes = /* @__PURE__ */ new Set();
        keyLists.forEach((keys) => {
          if (mainScope) {
            scopes.add(mainScope);
            keys.forEach((key) => addIfFound(scopes, mainScope, key));
          }
          keys.forEach((key) => addIfFound(scopes, options, key));
          keys.forEach((key) => addIfFound(scopes, overrides[type] || {}, key));
          keys.forEach((key) => addIfFound(scopes, defaults, key));
          keys.forEach((key) => addIfFound(scopes, descriptors, key));
        });
        const array = Array.from(scopes);
        if (array.length === 0) {
          array.push(/* @__PURE__ */ Object.create(null));
        }
        if (keysCached.has(keyLists)) {
          cache.set(keyLists, array);
        }
        return array;
      }
      chartOptionScopes() {
        const { options, type } = this;
        return [
          options,
          overrides[type] || {},
          defaults.datasets[type] || {},
          {
            type
          },
          defaults,
          descriptors
        ];
      }
      resolveNamedOptions(scopes, names2, context, prefixes = [
        ""
      ]) {
        const result = {
          $shared: true
        };
        const { resolver, subPrefixes } = getResolver(this._resolverCache, scopes, prefixes);
        let options = resolver;
        if (needContext(resolver, names2)) {
          result.$shared = false;
          context = isFunction(context) ? context() : context;
          const subResolver = this.createResolver(scopes, context, subPrefixes);
          options = _attachContext(resolver, context, subResolver);
        }
        for (const prop of names2) {
          result[prop] = options[prop];
        }
        return result;
      }
      createResolver(scopes, context, prefixes = [
        ""
      ], descriptorDefaults) {
        const { resolver } = getResolver(this._resolverCache, scopes, prefixes);
        return isObject(context) ? _attachContext(resolver, context, void 0, descriptorDefaults) : resolver;
      }
    };
    hasFunction = (value) => isObject(value) && Object.getOwnPropertyNames(value).some((key) => isFunction(value[key]));
    version = "4.5.1";
    KNOWN_POSITIONS = [
      "top",
      "bottom",
      "left",
      "right",
      "chartArea"
    ];
    instances = {};
    getChart = (key) => {
      const canvas = getCanvas(key);
      return Object.values(instances).filter((c) => c.canvas === canvas).pop();
    };
    Chart = class {
      static defaults = defaults;
      static instances = instances;
      static overrides = overrides;
      static registry = registry;
      static version = version;
      static getChart = getChart;
      static register(...items) {
        registry.add(...items);
        invalidatePlugins();
      }
      static unregister(...items) {
        registry.remove(...items);
        invalidatePlugins();
      }
      constructor(item, userConfig) {
        const config = this.config = new Config(userConfig);
        const initialCanvas = getCanvas(item);
        const existingChart = getChart(initialCanvas);
        if (existingChart) {
          throw new Error("Canvas is already in use. Chart with ID '" + existingChart.id + "' must be destroyed before the canvas with ID '" + existingChart.canvas.id + "' can be reused.");
        }
        const options = config.createResolver(config.chartOptionScopes(), this.getContext());
        this.platform = new (config.platform || _detectPlatform(initialCanvas))();
        this.platform.updateConfig(config);
        const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
        const canvas = context && context.canvas;
        const height = canvas && canvas.height;
        const width = canvas && canvas.width;
        this.id = uid();
        this.ctx = context;
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this._options = options;
        this._aspectRatio = this.aspectRatio;
        this._layers = [];
        this._metasets = [];
        this._stacks = void 0;
        this.boxes = [];
        this.currentDevicePixelRatio = void 0;
        this.chartArea = void 0;
        this._active = [];
        this._lastEvent = void 0;
        this._listeners = {};
        this._responsiveListeners = void 0;
        this._sortedMetasets = [];
        this.scales = {};
        this._plugins = new PluginService();
        this.$proxies = {};
        this._hiddenIndices = {};
        this.attached = false;
        this._animationsDisabled = void 0;
        this.$context = void 0;
        this._doResize = debounce((mode) => this.update(mode), options.resizeDelay || 0);
        this._dataChanges = [];
        instances[this.id] = this;
        if (!context || !canvas) {
          console.error("Failed to create chart: can't acquire context from the given item");
          return;
        }
        animator.listen(this, "complete", onAnimationsComplete);
        animator.listen(this, "progress", onAnimationProgress);
        this._initialize();
        if (this.attached) {
          this.update();
        }
      }
      get aspectRatio() {
        const { options: { aspectRatio, maintainAspectRatio }, width, height, _aspectRatio } = this;
        if (!isNullOrUndef(aspectRatio)) {
          return aspectRatio;
        }
        if (maintainAspectRatio && _aspectRatio) {
          return _aspectRatio;
        }
        return height ? width / height : null;
      }
      get data() {
        return this.config.data;
      }
      set data(data) {
        this.config.data = data;
      }
      get options() {
        return this._options;
      }
      set options(options) {
        this.config.options = options;
      }
      get registry() {
        return registry;
      }
      _initialize() {
        this.notifyPlugins("beforeInit");
        if (this.options.responsive) {
          this.resize();
        } else {
          retinaScale(this, this.options.devicePixelRatio);
        }
        this.bindEvents();
        this.notifyPlugins("afterInit");
        return this;
      }
      clear() {
        clearCanvas(this.canvas, this.ctx);
        return this;
      }
      stop() {
        animator.stop(this);
        return this;
      }
      resize(width, height) {
        if (!animator.running(this)) {
          this._resize(width, height);
        } else {
          this._resizeBeforeDraw = {
            width,
            height
          };
        }
      }
      _resize(width, height) {
        const options = this.options;
        const canvas = this.canvas;
        const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
        const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
        const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
        const mode = this.width ? "resize" : "attach";
        this.width = newSize.width;
        this.height = newSize.height;
        this._aspectRatio = this.aspectRatio;
        if (!retinaScale(this, newRatio, true)) {
          return;
        }
        this.notifyPlugins("resize", {
          size: newSize
        });
        callback(options.onResize, [
          this,
          newSize
        ], this);
        if (this.attached) {
          if (this._doResize(mode)) {
            this.render();
          }
        }
      }
      ensureScalesHaveIDs() {
        const options = this.options;
        const scalesOptions = options.scales || {};
        each(scalesOptions, (axisOptions, axisID) => {
          axisOptions.id = axisID;
        });
      }
      buildOrUpdateScales() {
        const options = this.options;
        const scaleOpts = options.scales;
        const scales2 = this.scales;
        const updated = Object.keys(scales2).reduce((obj, id) => {
          obj[id] = false;
          return obj;
        }, {});
        let items = [];
        if (scaleOpts) {
          items = items.concat(Object.keys(scaleOpts).map((id) => {
            const scaleOptions = scaleOpts[id];
            const axis = determineAxis(id, scaleOptions);
            const isRadial = axis === "r";
            const isHorizontal = axis === "x";
            return {
              options: scaleOptions,
              dposition: isRadial ? "chartArea" : isHorizontal ? "bottom" : "left",
              dtype: isRadial ? "radialLinear" : isHorizontal ? "category" : "linear"
            };
          }));
        }
        each(items, (item) => {
          const scaleOptions = item.options;
          const id = scaleOptions.id;
          const axis = determineAxis(id, scaleOptions);
          const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
          if (scaleOptions.position === void 0 || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
            scaleOptions.position = item.dposition;
          }
          updated[id] = true;
          let scale = null;
          if (id in scales2 && scales2[id].type === scaleType) {
            scale = scales2[id];
          } else {
            const scaleClass = registry.getScale(scaleType);
            scale = new scaleClass({
              id,
              type: scaleType,
              ctx: this.ctx,
              chart: this
            });
            scales2[scale.id] = scale;
          }
          scale.init(scaleOptions, options);
        });
        each(updated, (hasUpdated, id) => {
          if (!hasUpdated) {
            delete scales2[id];
          }
        });
        each(scales2, (scale) => {
          layouts.configure(this, scale, scale.options);
          layouts.addBox(this, scale);
        });
      }
      _updateMetasets() {
        const metasets = this._metasets;
        const numData = this.data.datasets.length;
        const numMeta = metasets.length;
        metasets.sort((a, b) => a.index - b.index);
        if (numMeta > numData) {
          for (let i = numData; i < numMeta; ++i) {
            this._destroyDatasetMeta(i);
          }
          metasets.splice(numData, numMeta - numData);
        }
        this._sortedMetasets = metasets.slice(0).sort(compare2Level("order", "index"));
      }
      _removeUnreferencedMetasets() {
        const { _metasets: metasets, data: { datasets } } = this;
        if (metasets.length > datasets.length) {
          delete this._stacks;
        }
        metasets.forEach((meta, index2) => {
          if (datasets.filter((x) => x === meta._dataset).length === 0) {
            this._destroyDatasetMeta(index2);
          }
        });
      }
      buildOrUpdateControllers() {
        const newControllers = [];
        const datasets = this.data.datasets;
        let i, ilen;
        this._removeUnreferencedMetasets();
        for (i = 0, ilen = datasets.length; i < ilen; i++) {
          const dataset = datasets[i];
          let meta = this.getDatasetMeta(i);
          const type = dataset.type || this.config.type;
          if (meta.type && meta.type !== type) {
            this._destroyDatasetMeta(i);
            meta = this.getDatasetMeta(i);
          }
          meta.type = type;
          meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
          meta.order = dataset.order || 0;
          meta.index = i;
          meta.label = "" + dataset.label;
          meta.visible = this.isDatasetVisible(i);
          if (meta.controller) {
            meta.controller.updateIndex(i);
            meta.controller.linkScales();
          } else {
            const ControllerClass = registry.getController(type);
            const { datasetElementType, dataElementType } = defaults.datasets[type];
            Object.assign(ControllerClass, {
              dataElementType: registry.getElement(dataElementType),
              datasetElementType: datasetElementType && registry.getElement(datasetElementType)
            });
            meta.controller = new ControllerClass(this, i);
            newControllers.push(meta.controller);
          }
        }
        this._updateMetasets();
        return newControllers;
      }
      _resetElements() {
        each(this.data.datasets, (dataset, datasetIndex) => {
          this.getDatasetMeta(datasetIndex).controller.reset();
        }, this);
      }
      reset() {
        this._resetElements();
        this.notifyPlugins("reset");
      }
      update(mode) {
        const config = this.config;
        config.update();
        const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
        const animsDisabled = this._animationsDisabled = !options.animation;
        this._updateScales();
        this._checkEventBindings();
        this._updateHiddenIndices();
        this._plugins.invalidate();
        if (this.notifyPlugins("beforeUpdate", {
          mode,
          cancelable: true
        }) === false) {
          return;
        }
        const newControllers = this.buildOrUpdateControllers();
        this.notifyPlugins("beforeElementsUpdate");
        let minPadding = 0;
        for (let i = 0, ilen = this.data.datasets.length; i < ilen; i++) {
          const { controller } = this.getDatasetMeta(i);
          const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
          controller.buildOrUpdateElements(reset);
          minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
        }
        minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
        this._updateLayout(minPadding);
        if (!animsDisabled) {
          each(newControllers, (controller) => {
            controller.reset();
          });
        }
        this._updateDatasets(mode);
        this.notifyPlugins("afterUpdate", {
          mode
        });
        this._layers.sort(compare2Level("z", "_idx"));
        const { _active, _lastEvent } = this;
        if (_lastEvent) {
          this._eventHandler(_lastEvent, true);
        } else if (_active.length) {
          this._updateHoverStyles(_active, _active, true);
        }
        this.render();
      }
      _updateScales() {
        each(this.scales, (scale) => {
          layouts.removeBox(this, scale);
        });
        this.ensureScalesHaveIDs();
        this.buildOrUpdateScales();
      }
      _checkEventBindings() {
        const options = this.options;
        const existingEvents = new Set(Object.keys(this._listeners));
        const newEvents = new Set(options.events);
        if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
          this.unbindEvents();
          this.bindEvents();
        }
      }
      _updateHiddenIndices() {
        const { _hiddenIndices } = this;
        const changes = this._getUniformDataChanges() || [];
        for (const { method, start, count } of changes) {
          const move = method === "_removeElements" ? -count : count;
          moveNumericKeys(_hiddenIndices, start, move);
        }
      }
      _getUniformDataChanges() {
        const _dataChanges = this._dataChanges;
        if (!_dataChanges || !_dataChanges.length) {
          return;
        }
        this._dataChanges = [];
        const datasetCount = this.data.datasets.length;
        const makeSet = (idx) => new Set(_dataChanges.filter((c) => c[0] === idx).map((c, i) => i + "," + c.splice(1).join(",")));
        const changeSet = makeSet(0);
        for (let i = 1; i < datasetCount; i++) {
          if (!setsEqual(changeSet, makeSet(i))) {
            return;
          }
        }
        return Array.from(changeSet).map((c) => c.split(",")).map((a) => ({
          method: a[1],
          start: +a[2],
          count: +a[3]
        }));
      }
      _updateLayout(minPadding) {
        if (this.notifyPlugins("beforeLayout", {
          cancelable: true
        }) === false) {
          return;
        }
        layouts.update(this, this.width, this.height, minPadding);
        const area = this.chartArea;
        const noArea = area.width <= 0 || area.height <= 0;
        this._layers = [];
        each(this.boxes, (box) => {
          if (noArea && box.position === "chartArea") {
            return;
          }
          if (box.configure) {
            box.configure();
          }
          this._layers.push(...box._layers());
        }, this);
        this._layers.forEach((item, index2) => {
          item._idx = index2;
        });
        this.notifyPlugins("afterLayout");
      }
      _updateDatasets(mode) {
        if (this.notifyPlugins("beforeDatasetsUpdate", {
          mode,
          cancelable: true
        }) === false) {
          return;
        }
        for (let i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
          this.getDatasetMeta(i).controller.configure();
        }
        for (let i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
          this._updateDataset(i, isFunction(mode) ? mode({
            datasetIndex: i
          }) : mode);
        }
        this.notifyPlugins("afterDatasetsUpdate", {
          mode
        });
      }
      _updateDataset(index2, mode) {
        const meta = this.getDatasetMeta(index2);
        const args = {
          meta,
          index: index2,
          mode,
          cancelable: true
        };
        if (this.notifyPlugins("beforeDatasetUpdate", args) === false) {
          return;
        }
        meta.controller._update(mode);
        args.cancelable = false;
        this.notifyPlugins("afterDatasetUpdate", args);
      }
      render() {
        if (this.notifyPlugins("beforeRender", {
          cancelable: true
        }) === false) {
          return;
        }
        if (animator.has(this)) {
          if (this.attached && !animator.running(this)) {
            animator.start(this);
          }
        } else {
          this.draw();
          onAnimationsComplete({
            chart: this
          });
        }
      }
      draw() {
        let i;
        if (this._resizeBeforeDraw) {
          const { width, height } = this._resizeBeforeDraw;
          this._resizeBeforeDraw = null;
          this._resize(width, height);
        }
        this.clear();
        if (this.width <= 0 || this.height <= 0) {
          return;
        }
        if (this.notifyPlugins("beforeDraw", {
          cancelable: true
        }) === false) {
          return;
        }
        const layers = this._layers;
        for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
          layers[i].draw(this.chartArea);
        }
        this._drawDatasets();
        for (; i < layers.length; ++i) {
          layers[i].draw(this.chartArea);
        }
        this.notifyPlugins("afterDraw");
      }
      _getSortedDatasetMetas(filterVisible) {
        const metasets = this._sortedMetasets;
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metasets.length; i < ilen; ++i) {
          const meta = metasets[i];
          if (!filterVisible || meta.visible) {
            result.push(meta);
          }
        }
        return result;
      }
      getSortedVisibleDatasetMetas() {
        return this._getSortedDatasetMetas(true);
      }
      _drawDatasets() {
        if (this.notifyPlugins("beforeDatasetsDraw", {
          cancelable: true
        }) === false) {
          return;
        }
        const metasets = this.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          this._drawDataset(metasets[i]);
        }
        this.notifyPlugins("afterDatasetsDraw");
      }
      _drawDataset(meta) {
        const ctx = this.ctx;
        const args = {
          meta,
          index: meta.index,
          cancelable: true
        };
        const clip = getDatasetClipArea(this, meta);
        if (this.notifyPlugins("beforeDatasetDraw", args) === false) {
          return;
        }
        if (clip) {
          clipArea(ctx, clip);
        }
        meta.controller.draw();
        if (clip) {
          unclipArea(ctx);
        }
        args.cancelable = false;
        this.notifyPlugins("afterDatasetDraw", args);
      }
      isPointInArea(point) {
        return _isPointInArea(point, this.chartArea, this._minPadding);
      }
      getElementsAtEventForMode(e, mode, options, useFinalPosition) {
        const method = Interaction.modes[mode];
        if (typeof method === "function") {
          return method(this, e, options, useFinalPosition);
        }
        return [];
      }
      getDatasetMeta(datasetIndex) {
        const dataset = this.data.datasets[datasetIndex];
        const metasets = this._metasets;
        let meta = metasets.filter((x) => x && x._dataset === dataset).pop();
        if (!meta) {
          meta = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null,
            order: dataset && dataset.order || 0,
            index: datasetIndex,
            _dataset: dataset,
            _parsed: [],
            _sorted: false
          };
          metasets.push(meta);
        }
        return meta;
      }
      getContext() {
        return this.$context || (this.$context = createContext(null, {
          chart: this,
          type: "chart"
        }));
      }
      getVisibleDatasetCount() {
        return this.getSortedVisibleDatasetMetas().length;
      }
      isDatasetVisible(datasetIndex) {
        const dataset = this.data.datasets[datasetIndex];
        if (!dataset) {
          return false;
        }
        const meta = this.getDatasetMeta(datasetIndex);
        return typeof meta.hidden === "boolean" ? !meta.hidden : !dataset.hidden;
      }
      setDatasetVisibility(datasetIndex, visible) {
        const meta = this.getDatasetMeta(datasetIndex);
        meta.hidden = !visible;
      }
      toggleDataVisibility(index2) {
        this._hiddenIndices[index2] = !this._hiddenIndices[index2];
      }
      getDataVisibility(index2) {
        return !this._hiddenIndices[index2];
      }
      _updateVisibility(datasetIndex, dataIndex, visible) {
        const mode = visible ? "show" : "hide";
        const meta = this.getDatasetMeta(datasetIndex);
        const anims = meta.controller._resolveAnimations(void 0, mode);
        if (defined(dataIndex)) {
          meta.data[dataIndex].hidden = !visible;
          this.update();
        } else {
          this.setDatasetVisibility(datasetIndex, visible);
          anims.update(meta, {
            visible
          });
          this.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : void 0);
        }
      }
      hide(datasetIndex, dataIndex) {
        this._updateVisibility(datasetIndex, dataIndex, false);
      }
      show(datasetIndex, dataIndex) {
        this._updateVisibility(datasetIndex, dataIndex, true);
      }
      _destroyDatasetMeta(datasetIndex) {
        const meta = this._metasets[datasetIndex];
        if (meta && meta.controller) {
          meta.controller._destroy();
        }
        delete this._metasets[datasetIndex];
      }
      _stop() {
        let i, ilen;
        this.stop();
        animator.remove(this);
        for (i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
          this._destroyDatasetMeta(i);
        }
      }
      destroy() {
        this.notifyPlugins("beforeDestroy");
        const { canvas, ctx } = this;
        this._stop();
        this.config.clearCache();
        if (canvas) {
          this.unbindEvents();
          clearCanvas(canvas, ctx);
          this.platform.releaseContext(ctx);
          this.canvas = null;
          this.ctx = null;
        }
        delete instances[this.id];
        this.notifyPlugins("afterDestroy");
      }
      toBase64Image(...args) {
        return this.canvas.toDataURL(...args);
      }
      bindEvents() {
        this.bindUserEvents();
        if (this.options.responsive) {
          this.bindResponsiveEvents();
        } else {
          this.attached = true;
        }
      }
      bindUserEvents() {
        const listeners = this._listeners;
        const platform = this.platform;
        const _add = (type, listener2) => {
          platform.addEventListener(this, type, listener2);
          listeners[type] = listener2;
        };
        const listener = (e, x, y) => {
          e.offsetX = x;
          e.offsetY = y;
          this._eventHandler(e);
        };
        each(this.options.events, (type) => _add(type, listener));
      }
      bindResponsiveEvents() {
        if (!this._responsiveListeners) {
          this._responsiveListeners = {};
        }
        const listeners = this._responsiveListeners;
        const platform = this.platform;
        const _add = (type, listener2) => {
          platform.addEventListener(this, type, listener2);
          listeners[type] = listener2;
        };
        const _remove = (type, listener2) => {
          if (listeners[type]) {
            platform.removeEventListener(this, type, listener2);
            delete listeners[type];
          }
        };
        const listener = (width, height) => {
          if (this.canvas) {
            this.resize(width, height);
          }
        };
        let detached;
        const attached = () => {
          _remove("attach", attached);
          this.attached = true;
          this.resize();
          _add("resize", listener);
          _add("detach", detached);
        };
        detached = () => {
          this.attached = false;
          _remove("resize", listener);
          this._stop();
          this._resize(0, 0);
          _add("attach", attached);
        };
        if (platform.isAttached(this.canvas)) {
          attached();
        } else {
          detached();
        }
      }
      unbindEvents() {
        each(this._listeners, (listener, type) => {
          this.platform.removeEventListener(this, type, listener);
        });
        this._listeners = {};
        each(this._responsiveListeners, (listener, type) => {
          this.platform.removeEventListener(this, type, listener);
        });
        this._responsiveListeners = void 0;
      }
      updateHoverStyle(items, mode, enabled) {
        const prefix = enabled ? "set" : "remove";
        let meta, item, i, ilen;
        if (mode === "dataset") {
          meta = this.getDatasetMeta(items[0].datasetIndex);
          meta.controller["_" + prefix + "DatasetHoverStyle"]();
        }
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          item = items[i];
          const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
          if (controller) {
            controller[prefix + "HoverStyle"](item.element, item.datasetIndex, item.index);
          }
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements) {
        const lastActive = this._active || [];
        const active = activeElements.map(({ datasetIndex, index: index2 }) => {
          const meta = this.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error("No dataset found at index " + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index2],
            index: index2
          };
        });
        const changed = !_elementsEqual(active, lastActive);
        if (changed) {
          this._active = active;
          this._lastEvent = null;
          this._updateHoverStyles(active, lastActive);
        }
      }
      notifyPlugins(hook, args, filter) {
        return this._plugins.notify(this, hook, args, filter);
      }
      isPluginEnabled(pluginId) {
        return this._plugins._cache.filter((p) => p.plugin.id === pluginId).length === 1;
      }
      _updateHoverStyles(active, lastActive, replay) {
        const hoverOptions = this.options.hover;
        const diff = (a, b) => a.filter((x) => !b.some((y) => x.datasetIndex === y.datasetIndex && x.index === y.index));
        const deactivated = diff(lastActive, active);
        const activated = replay ? active : diff(active, lastActive);
        if (deactivated.length) {
          this.updateHoverStyle(deactivated, hoverOptions.mode, false);
        }
        if (activated.length && hoverOptions.mode) {
          this.updateHoverStyle(activated, hoverOptions.mode, true);
        }
      }
      _eventHandler(e, replay) {
        const args = {
          event: e,
          replay,
          cancelable: true,
          inChartArea: this.isPointInArea(e)
        };
        const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e.native.type);
        if (this.notifyPlugins("beforeEvent", args, eventFilter) === false) {
          return;
        }
        const changed = this._handleEvent(e, replay, args.inChartArea);
        args.cancelable = false;
        this.notifyPlugins("afterEvent", args, eventFilter);
        if (changed || args.changed) {
          this.render();
        }
        return this;
      }
      _handleEvent(e, replay, inChartArea) {
        const { _active: lastActive = [], options } = this;
        const useFinalPosition = replay;
        const active = this._getActiveElements(e, lastActive, inChartArea, useFinalPosition);
        const isClick = _isClickEvent(e);
        const lastEvent = determineLastEvent(e, this._lastEvent, inChartArea, isClick);
        if (inChartArea) {
          this._lastEvent = null;
          callback(options.onHover, [
            e,
            active,
            this
          ], this);
          if (isClick) {
            callback(options.onClick, [
              e,
              active,
              this
            ], this);
          }
        }
        const changed = !_elementsEqual(active, lastActive);
        if (changed || replay) {
          this._active = active;
          this._updateHoverStyles(active, lastActive, replay);
        }
        this._lastEvent = lastEvent;
        return changed;
      }
      _getActiveElements(e, lastActive, inChartArea, useFinalPosition) {
        if (e.type === "mouseout") {
          return [];
        }
        if (!inChartArea) {
          return lastActive;
        }
        const hoverOptions = this.options.hover;
        return this.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
      }
    };
    ArcElement = class extends Element {
      static id = "arc";
      static defaults = {
        borderAlign: "center",
        borderColor: "#fff",
        borderDash: [],
        borderDashOffset: 0,
        borderJoinStyle: void 0,
        borderRadius: 0,
        borderWidth: 2,
        offset: 0,
        spacing: 0,
        angle: void 0,
        circular: true,
        selfJoin: false
      };
      static defaultRoutes = {
        backgroundColor: "backgroundColor"
      };
      static descriptors = {
        _scriptable: true,
        _indexable: (name) => name !== "borderDash"
      };
      circumference;
      endAngle;
      fullCircles;
      innerRadius;
      outerRadius;
      pixelMargin;
      startAngle;
      constructor(cfg) {
        super();
        this.options = void 0;
        this.circumference = void 0;
        this.startAngle = void 0;
        this.endAngle = void 0;
        this.innerRadius = void 0;
        this.outerRadius = void 0;
        this.pixelMargin = 0;
        this.fullCircles = 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(chartX, chartY, useFinalPosition) {
        const point = this.getProps([
          "x",
          "y"
        ], useFinalPosition);
        const { angle, distance } = getAngleFromPoint(point, {
          x: chartX,
          y: chartY
        });
        const { startAngle, endAngle, innerRadius, outerRadius, circumference } = this.getProps([
          "startAngle",
          "endAngle",
          "innerRadius",
          "outerRadius",
          "circumference"
        ], useFinalPosition);
        const rAdjust = (this.options.spacing + this.options.borderWidth) / 2;
        const _circumference = valueOrDefault(circumference, endAngle - startAngle);
        const nonZeroBetween = _angleBetween(angle, startAngle, endAngle) && startAngle !== endAngle;
        const betweenAngles = _circumference >= TAU || nonZeroBetween;
        const withinRadius = _isBetween(distance, innerRadius + rAdjust, outerRadius + rAdjust);
        return betweenAngles && withinRadius;
      }
      getCenterPoint(useFinalPosition) {
        const { x, y, startAngle, endAngle, innerRadius, outerRadius } = this.getProps([
          "x",
          "y",
          "startAngle",
          "endAngle",
          "innerRadius",
          "outerRadius"
        ], useFinalPosition);
        const { offset, spacing } = this.options;
        const halfAngle = (startAngle + endAngle) / 2;
        const halfRadius = (innerRadius + outerRadius + spacing + offset) / 2;
        return {
          x: x + Math.cos(halfAngle) * halfRadius,
          y: y + Math.sin(halfAngle) * halfRadius
        };
      }
      tooltipPosition(useFinalPosition) {
        return this.getCenterPoint(useFinalPosition);
      }
      draw(ctx) {
        const { options, circumference } = this;
        const offset = (options.offset || 0) / 4;
        const spacing = (options.spacing || 0) / 2;
        const circular = options.circular;
        this.pixelMargin = options.borderAlign === "inner" ? 0.33 : 0;
        this.fullCircles = circumference > TAU ? Math.floor(circumference / TAU) : 0;
        if (circumference === 0 || this.innerRadius < 0 || this.outerRadius < 0) {
          return;
        }
        ctx.save();
        const halfAngle = (this.startAngle + this.endAngle) / 2;
        ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
        const fix = 1 - Math.sin(Math.min(PI, circumference || 0));
        const radiusOffset = offset * fix;
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        drawArc(ctx, this, radiusOffset, spacing, circular);
        drawBorder(ctx, this, radiusOffset, spacing, circular);
        ctx.restore();
      }
    };
    usePath2D = typeof Path2D === "function";
    LineElement = class extends Element {
      static id = "line";
      static defaults = {
        borderCapStyle: "butt",
        borderDash: [],
        borderDashOffset: 0,
        borderJoinStyle: "miter",
        borderWidth: 3,
        capBezierPoints: true,
        cubicInterpolationMode: "default",
        fill: false,
        spanGaps: false,
        stepped: false,
        tension: 0
      };
      static defaultRoutes = {
        backgroundColor: "backgroundColor",
        borderColor: "borderColor"
      };
      static descriptors = {
        _scriptable: true,
        _indexable: (name) => name !== "borderDash" && name !== "fill"
      };
      constructor(cfg) {
        super();
        this.animated = true;
        this.options = void 0;
        this._chart = void 0;
        this._loop = void 0;
        this._fullLoop = void 0;
        this._path = void 0;
        this._points = void 0;
        this._segments = void 0;
        this._decimated = false;
        this._pointsUpdated = false;
        this._datasetIndex = void 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      updateControlPoints(chartArea, indexAxis) {
        const options = this.options;
        if ((options.tension || options.cubicInterpolationMode === "monotone") && !options.stepped && !this._pointsUpdated) {
          const loop = options.spanGaps ? this._loop : this._fullLoop;
          _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
          this._pointsUpdated = true;
        }
      }
      set points(points) {
        this._points = points;
        delete this._segments;
        delete this._path;
        this._pointsUpdated = false;
      }
      get points() {
        return this._points;
      }
      get segments() {
        return this._segments || (this._segments = _computeSegments(this, this.options.segment));
      }
      first() {
        const segments = this.segments;
        const points = this.points;
        return segments.length && points[segments[0].start];
      }
      last() {
        const segments = this.segments;
        const points = this.points;
        const count = segments.length;
        return count && points[segments[count - 1].end];
      }
      interpolate(point, property) {
        const options = this.options;
        const value = point[property];
        const points = this.points;
        const segments = _boundSegments(this, {
          property,
          start: value,
          end: value
        });
        if (!segments.length) {
          return;
        }
        const result = [];
        const _interpolate = _getInterpolationMethod(options);
        let i, ilen;
        for (i = 0, ilen = segments.length; i < ilen; ++i) {
          const { start, end } = segments[i];
          const p1 = points[start];
          const p2 = points[end];
          if (p1 === p2) {
            result.push(p1);
            continue;
          }
          const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
          const interpolated = _interpolate(p1, p2, t, options.stepped);
          interpolated[property] = point[property];
          result.push(interpolated);
        }
        return result.length === 1 ? result[0] : result;
      }
      pathSegment(ctx, segment, params) {
        const segmentMethod = _getSegmentMethod(this);
        return segmentMethod(ctx, this, segment, params);
      }
      path(ctx, start, count) {
        const segments = this.segments;
        const segmentMethod = _getSegmentMethod(this);
        let loop = this._loop;
        start = start || 0;
        count = count || this.points.length - start;
        for (const segment of segments) {
          loop &= segmentMethod(ctx, this, segment, {
            start,
            end: start + count - 1
          });
        }
        return !!loop;
      }
      draw(ctx, chartArea, start, count) {
        const options = this.options || {};
        const points = this.points || [];
        if (points.length && options.borderWidth) {
          ctx.save();
          draw(ctx, this, start, count);
          ctx.restore();
        }
        if (this.animated) {
          this._pointsUpdated = false;
          this._path = void 0;
        }
      }
    };
    PointElement = class extends Element {
      static id = "point";
      parsed;
      skip;
      stop;
      /**
      * @type {any}
      */
      static defaults = {
        borderWidth: 1,
        hitRadius: 1,
        hoverBorderWidth: 1,
        hoverRadius: 4,
        pointStyle: "circle",
        radius: 3,
        rotation: 0
      };
      /**
      * @type {any}
      */
      static defaultRoutes = {
        backgroundColor: "backgroundColor",
        borderColor: "borderColor"
      };
      constructor(cfg) {
        super();
        this.options = void 0;
        this.parsed = void 0;
        this.skip = void 0;
        this.stop = void 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        const options = this.options;
        const { x, y } = this.getProps([
          "x",
          "y"
        ], useFinalPosition);
        return Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2) < Math.pow(options.hitRadius + options.radius, 2);
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange$1(this, mouseX, "x", useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange$1(this, mouseY, "y", useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const { x, y } = this.getProps([
          "x",
          "y"
        ], useFinalPosition);
        return {
          x,
          y
        };
      }
      size(options) {
        options = options || this.options || {};
        let radius = options.radius || 0;
        radius = Math.max(radius, radius && options.hoverRadius || 0);
        const borderWidth = radius && options.borderWidth || 0;
        return (radius + borderWidth) * 2;
      }
      draw(ctx, area) {
        const options = this.options;
        if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
          return;
        }
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.fillStyle = options.backgroundColor;
        drawPoint(ctx, options, this.x, this.y);
      }
      getRange() {
        const options = this.options || {};
        return options.radius + options.hitRadius;
      }
    };
    BarElement = class extends Element {
      static id = "bar";
      static defaults = {
        borderSkipped: "start",
        borderWidth: 0,
        borderRadius: 0,
        inflateAmount: "auto",
        pointStyle: void 0
      };
      static defaultRoutes = {
        backgroundColor: "backgroundColor",
        borderColor: "borderColor"
      };
      constructor(cfg) {
        super();
        this.options = void 0;
        this.horizontal = void 0;
        this.base = void 0;
        this.width = void 0;
        this.height = void 0;
        this.inflateAmount = void 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      draw(ctx) {
        const { inflateAmount, options: { borderColor, backgroundColor } } = this;
        const { inner, outer } = boundingRects(this);
        const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
        ctx.save();
        if (outer.w !== inner.w || outer.h !== inner.h) {
          ctx.beginPath();
          addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
          ctx.clip();
          addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
          ctx.fillStyle = borderColor;
          ctx.fill("evenodd");
        }
        ctx.beginPath();
        addRectPath(ctx, inflateRect(inner, inflateAmount));
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        return inRange(this, mouseX, mouseY, useFinalPosition);
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange(this, mouseX, null, useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange(this, null, mouseY, useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const { x, y, base, horizontal } = this.getProps([
          "x",
          "y",
          "base",
          "horizontal"
        ], useFinalPosition);
        return {
          x: horizontal ? (x + base) / 2 : x,
          y: horizontal ? y : (y + base) / 2
        };
      }
      getRange(axis) {
        return axis === "x" ? this.width / 2 : this.height / 2;
      }
    };
    elements = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      ArcElement,
      BarElement,
      LineElement,
      PointElement
    });
    BORDER_COLORS = [
      "rgb(54, 162, 235)",
      "rgb(255, 99, 132)",
      "rgb(255, 159, 64)",
      "rgb(255, 205, 86)",
      "rgb(75, 192, 192)",
      "rgb(153, 102, 255)",
      "rgb(201, 203, 207)"
      // grey
    ];
    BACKGROUND_COLORS = /* @__PURE__ */ BORDER_COLORS.map((color2) => color2.replace("rgb(", "rgba(").replace(")", ", 0.5)"));
    plugin_colors = {
      id: "colors",
      defaults: {
        enabled: true,
        forceOverride: false
      },
      beforeLayout(chart, _args, options) {
        if (!options.enabled) {
          return;
        }
        const { data: { datasets }, options: chartOptions } = chart.config;
        const { elements: elements2 } = chartOptions;
        const containsColorDefenition = containsColorsDefinitions(datasets) || containsColorsDefinition(chartOptions) || elements2 && containsColorsDefinitions(elements2) || containsDefaultColorsDefenitions();
        if (!options.forceOverride && containsColorDefenition) {
          return;
        }
        const colorizer = getColorizer(chart);
        datasets.forEach(colorizer);
      }
    };
    plugin_decimation = {
      id: "decimation",
      defaults: {
        algorithm: "min-max",
        enabled: false
      },
      beforeElementsUpdate: (chart, args, options) => {
        if (!options.enabled) {
          cleanDecimatedData(chart);
          return;
        }
        const availableWidth = chart.width;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const { _data, indexAxis } = dataset;
          const meta = chart.getDatasetMeta(datasetIndex);
          const data = _data || dataset.data;
          if (resolve([
            indexAxis,
            chart.options.indexAxis
          ]) === "y") {
            return;
          }
          if (!meta.controller.supportsDecimation) {
            return;
          }
          const xAxis = chart.scales[meta.xAxisID];
          if (xAxis.type !== "linear" && xAxis.type !== "time") {
            return;
          }
          if (chart.options.parsing) {
            return;
          }
          let { start, count } = getStartAndCountOfVisiblePointsSimplified(meta, data);
          const threshold = options.threshold || 4 * availableWidth;
          if (count <= threshold) {
            cleanDecimatedDataset(dataset);
            return;
          }
          if (isNullOrUndef(_data)) {
            dataset._data = data;
            delete dataset.data;
            Object.defineProperty(dataset, "data", {
              configurable: true,
              enumerable: true,
              get: function() {
                return this._decimated;
              },
              set: function(d) {
                this._data = d;
              }
            });
          }
          let decimated;
          switch (options.algorithm) {
            case "lttb":
              decimated = lttbDecimation(data, start, count, availableWidth, options);
              break;
            case "min-max":
              decimated = minMaxDecimation(data, start, count, availableWidth);
              break;
            default:
              throw new Error(`Unsupported decimation algorithm '${options.algorithm}'`);
          }
          dataset._decimated = decimated;
        });
      },
      destroy(chart) {
        cleanDecimatedData(chart);
      }
    };
    simpleArc = class {
      constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.radius = opts.radius;
      }
      pathSegment(ctx, bounds, opts) {
        const { x, y, radius } = this;
        bounds = bounds || {
          start: 0,
          end: TAU
        };
        ctx.arc(x, y, radius, bounds.end, bounds.start, true);
        return !opts.bounds;
      }
      interpolate(point) {
        const { x, y, radius } = this;
        const angle = point.angle;
        return {
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          angle
        };
      }
    };
    index = {
      id: "filler",
      afterDatasetsUpdate(chart, _args, options) {
        const count = (chart.data.datasets || []).length;
        const sources = [];
        let meta, i, line, source;
        for (i = 0; i < count; ++i) {
          meta = chart.getDatasetMeta(i);
          line = meta.dataset;
          source = null;
          if (line && line.options && line instanceof LineElement) {
            source = {
              visible: chart.isDatasetVisible(i),
              index: i,
              fill: _decodeFill(line, i, count),
              chart,
              axis: meta.controller.options.indexAxis,
              scale: meta.vScale,
              line
            };
          }
          meta.$filler = source;
          sources.push(source);
        }
        for (i = 0; i < count; ++i) {
          source = sources[i];
          if (!source || source.fill === false) {
            continue;
          }
          source.fill = _resolveTarget(sources, i, options.propagate);
        }
      },
      beforeDraw(chart, _args, options) {
        const draw2 = options.drawTime === "beforeDraw";
        const metasets = chart.getSortedVisibleDatasetMetas();
        const area = chart.chartArea;
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (!source) {
            continue;
          }
          source.line.updateControlPoints(area, source.axis);
          if (draw2 && source.fill) {
            _drawfill(chart.ctx, source, area);
          }
        }
      },
      beforeDatasetsDraw(chart, _args, options) {
        if (options.drawTime !== "beforeDatasetsDraw") {
          return;
        }
        const metasets = chart.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (_shouldApplyFill(source)) {
            _drawfill(chart.ctx, source, chart.chartArea);
          }
        }
      },
      beforeDatasetDraw(chart, args, options) {
        const source = args.meta.$filler;
        if (!_shouldApplyFill(source) || options.drawTime !== "beforeDatasetDraw") {
          return;
        }
        _drawfill(chart.ctx, source, chart.chartArea);
      },
      defaults: {
        propagate: true,
        drawTime: "beforeDatasetDraw"
      }
    };
    getBoxSize = (labelOpts, fontSize) => {
      let { boxHeight = fontSize, boxWidth = fontSize } = labelOpts;
      if (labelOpts.usePointStyle) {
        boxHeight = Math.min(boxHeight, fontSize);
        boxWidth = labelOpts.pointStyleWidth || Math.min(boxWidth, fontSize);
      }
      return {
        boxWidth,
        boxHeight,
        itemHeight: Math.max(fontSize, boxHeight)
      };
    };
    itemsEqual = (a, b) => a !== null && b !== null && a.datasetIndex === b.datasetIndex && a.index === b.index;
    Legend = class extends Element {
      constructor(config) {
        super();
        this._added = false;
        this.legendHitBoxes = [];
        this._hoveredItem = null;
        this.doughnutMode = false;
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this.legendItems = void 0;
        this.columnSizes = void 0;
        this.lineWidths = void 0;
        this.maxHeight = void 0;
        this.maxWidth = void 0;
        this.top = void 0;
        this.bottom = void 0;
        this.left = void 0;
        this.right = void 0;
        this.height = void 0;
        this.width = void 0;
        this._margins = void 0;
        this.position = void 0;
        this.weight = void 0;
        this.fullSize = void 0;
      }
      update(maxWidth, maxHeight, margins) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this._margins = margins;
        this.setDimensions();
        this.buildLabels();
        this.fit();
      }
      setDimensions() {
        if (this.isHorizontal()) {
          this.width = this.maxWidth;
          this.left = this._margins.left;
          this.right = this.width;
        } else {
          this.height = this.maxHeight;
          this.top = this._margins.top;
          this.bottom = this.height;
        }
      }
      buildLabels() {
        const labelOpts = this.options.labels || {};
        let legendItems = callback(labelOpts.generateLabels, [
          this.chart
        ], this) || [];
        if (labelOpts.filter) {
          legendItems = legendItems.filter((item) => labelOpts.filter(item, this.chart.data));
        }
        if (labelOpts.sort) {
          legendItems = legendItems.sort((a, b) => labelOpts.sort(a, b, this.chart.data));
        }
        if (this.options.reverse) {
          legendItems.reverse();
        }
        this.legendItems = legendItems;
      }
      fit() {
        const { options, ctx } = this;
        if (!options.display) {
          this.width = this.height = 0;
          return;
        }
        const labelOpts = options.labels;
        const labelFont = toFont(labelOpts.font);
        const fontSize = labelFont.size;
        const titleHeight = this._computeTitleHeight();
        const { boxWidth, itemHeight } = getBoxSize(labelOpts, fontSize);
        let width, height;
        ctx.font = labelFont.string;
        if (this.isHorizontal()) {
          width = this.maxWidth;
          height = this._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
        } else {
          height = this.maxHeight;
          width = this._fitCols(titleHeight, labelFont, boxWidth, itemHeight) + 10;
        }
        this.width = Math.min(width, options.maxWidth || this.maxWidth);
        this.height = Math.min(height, options.maxHeight || this.maxHeight);
      }
      _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
        const { ctx, maxWidth, options: { labels: { padding: padding2 } } } = this;
        const hitboxes = this.legendHitBoxes = [];
        const lineWidths = this.lineWidths = [
          0
        ];
        const lineHeight = itemHeight + padding2;
        let totalHeight = titleHeight;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        let row = -1;
        let top = -lineHeight;
        this.legendItems.forEach((legendItem, i) => {
          const itemWidth = boxWidth + fontSize / 2 + ctx.measureText(legendItem.text).width;
          if (i === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding2 > maxWidth) {
            totalHeight += lineHeight;
            lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
            top += lineHeight;
            row++;
          }
          hitboxes[i] = {
            left: 0,
            top,
            row,
            width: itemWidth,
            height: itemHeight
          };
          lineWidths[lineWidths.length - 1] += itemWidth + padding2;
        });
        return totalHeight;
      }
      _fitCols(titleHeight, labelFont, boxWidth, _itemHeight) {
        const { ctx, maxHeight, options: { labels: { padding: padding2 } } } = this;
        const hitboxes = this.legendHitBoxes = [];
        const columnSizes = this.columnSizes = [];
        const heightLimit = maxHeight - titleHeight;
        let totalWidth = padding2;
        let currentColWidth = 0;
        let currentColHeight = 0;
        let left = 0;
        let col = 0;
        this.legendItems.forEach((legendItem, i) => {
          const { itemWidth, itemHeight } = calculateItemSize(boxWidth, labelFont, ctx, legendItem, _itemHeight);
          if (i > 0 && currentColHeight + itemHeight + 2 * padding2 > heightLimit) {
            totalWidth += currentColWidth + padding2;
            columnSizes.push({
              width: currentColWidth,
              height: currentColHeight
            });
            left += currentColWidth + padding2;
            col++;
            currentColWidth = currentColHeight = 0;
          }
          hitboxes[i] = {
            left,
            top: currentColHeight,
            col,
            width: itemWidth,
            height: itemHeight
          };
          currentColWidth = Math.max(currentColWidth, itemWidth);
          currentColHeight += itemHeight + padding2;
        });
        totalWidth += currentColWidth;
        columnSizes.push({
          width: currentColWidth,
          height: currentColHeight
        });
        return totalWidth;
      }
      adjustHitBoxes() {
        if (!this.options.display) {
          return;
        }
        const titleHeight = this._computeTitleHeight();
        const { legendHitBoxes: hitboxes, options: { align, labels: { padding: padding2 }, rtl } } = this;
        const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
        if (this.isHorizontal()) {
          let row = 0;
          let left = _alignStartEnd(align, this.left + padding2, this.right - this.lineWidths[row]);
          for (const hitbox of hitboxes) {
            if (row !== hitbox.row) {
              row = hitbox.row;
              left = _alignStartEnd(align, this.left + padding2, this.right - this.lineWidths[row]);
            }
            hitbox.top += this.top + titleHeight + padding2;
            hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
            left += hitbox.width + padding2;
          }
        } else {
          let col = 0;
          let top = _alignStartEnd(align, this.top + titleHeight + padding2, this.bottom - this.columnSizes[col].height);
          for (const hitbox of hitboxes) {
            if (hitbox.col !== col) {
              col = hitbox.col;
              top = _alignStartEnd(align, this.top + titleHeight + padding2, this.bottom - this.columnSizes[col].height);
            }
            hitbox.top = top;
            hitbox.left += this.left + padding2;
            hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox.left), hitbox.width);
            top += hitbox.height + padding2;
          }
        }
      }
      isHorizontal() {
        return this.options.position === "top" || this.options.position === "bottom";
      }
      draw() {
        if (this.options.display) {
          const ctx = this.ctx;
          clipArea(ctx, this);
          this._draw();
          unclipArea(ctx);
        }
      }
      _draw() {
        const { options: opts, columnSizes, lineWidths, ctx } = this;
        const { align, labels: labelOpts } = opts;
        const defaultColor = defaults.color;
        const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
        const labelFont = toFont(labelOpts.font);
        const { padding: padding2 } = labelOpts;
        const fontSize = labelFont.size;
        const halfFontSize = fontSize / 2;
        let cursor;
        this.drawTitle();
        ctx.textAlign = rtlHelper.textAlign("left");
        ctx.textBaseline = "middle";
        ctx.lineWidth = 0.5;
        ctx.font = labelFont.string;
        const { boxWidth, boxHeight, itemHeight } = getBoxSize(labelOpts, fontSize);
        const drawLegendBox = function(x, y, legendItem) {
          if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
            return;
          }
          ctx.save();
          const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
          ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
          ctx.lineCap = valueOrDefault(legendItem.lineCap, "butt");
          ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
          ctx.lineJoin = valueOrDefault(legendItem.lineJoin, "miter");
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
          ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
          if (labelOpts.usePointStyle) {
            const drawOptions = {
              radius: boxHeight * Math.SQRT2 / 2,
              pointStyle: legendItem.pointStyle,
              rotation: legendItem.rotation,
              borderWidth: lineWidth
            };
            const centerX = rtlHelper.xPlus(x, boxWidth / 2);
            const centerY = y + halfFontSize;
            drawPointLegend(ctx, drawOptions, centerX, centerY, labelOpts.pointStyleWidth && boxWidth);
          } else {
            const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
            const xBoxLeft = rtlHelper.leftForLtr(x, boxWidth);
            const borderRadius = toTRBLCorners(legendItem.borderRadius);
            ctx.beginPath();
            if (Object.values(borderRadius).some((v) => v !== 0)) {
              addRoundedRectPath(ctx, {
                x: xBoxLeft,
                y: yBoxTop,
                w: boxWidth,
                h: boxHeight,
                radius: borderRadius
              });
            } else {
              ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
            }
            ctx.fill();
            if (lineWidth !== 0) {
              ctx.stroke();
            }
          }
          ctx.restore();
        };
        const fillText = function(x, y, legendItem) {
          renderText(ctx, legendItem.text, x, y + itemHeight / 2, labelFont, {
            strikethrough: legendItem.hidden,
            textAlign: rtlHelper.textAlign(legendItem.textAlign)
          });
        };
        const isHorizontal = this.isHorizontal();
        const titleHeight = this._computeTitleHeight();
        if (isHorizontal) {
          cursor = {
            x: _alignStartEnd(align, this.left + padding2, this.right - lineWidths[0]),
            y: this.top + padding2 + titleHeight,
            line: 0
          };
        } else {
          cursor = {
            x: this.left + padding2,
            y: _alignStartEnd(align, this.top + titleHeight + padding2, this.bottom - columnSizes[0].height),
            line: 0
          };
        }
        overrideTextDirection(this.ctx, opts.textDirection);
        const lineHeight = itemHeight + padding2;
        this.legendItems.forEach((legendItem, i) => {
          ctx.strokeStyle = legendItem.fontColor;
          ctx.fillStyle = legendItem.fontColor;
          const textWidth = ctx.measureText(legendItem.text).width;
          const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
          const width = boxWidth + halfFontSize + textWidth;
          let x = cursor.x;
          let y = cursor.y;
          rtlHelper.setWidth(this.width);
          if (isHorizontal) {
            if (i > 0 && x + width + padding2 > this.right) {
              y = cursor.y += lineHeight;
              cursor.line++;
              x = cursor.x = _alignStartEnd(align, this.left + padding2, this.right - lineWidths[cursor.line]);
            }
          } else if (i > 0 && y + lineHeight > this.bottom) {
            x = cursor.x = x + columnSizes[cursor.line].width + padding2;
            cursor.line++;
            y = cursor.y = _alignStartEnd(align, this.top + titleHeight + padding2, this.bottom - columnSizes[cursor.line].height);
          }
          const realX = rtlHelper.x(x);
          drawLegendBox(realX, y, legendItem);
          x = _textX(textAlign, x + boxWidth + halfFontSize, isHorizontal ? x + width : this.right, opts.rtl);
          fillText(rtlHelper.x(x), y, legendItem);
          if (isHorizontal) {
            cursor.x += width + padding2;
          } else if (typeof legendItem.text !== "string") {
            const fontLineHeight = labelFont.lineHeight;
            cursor.y += calculateLegendItemHeight(legendItem, fontLineHeight) + padding2;
          } else {
            cursor.y += lineHeight;
          }
        });
        restoreTextDirection(this.ctx, opts.textDirection);
      }
      drawTitle() {
        const opts = this.options;
        const titleOpts = opts.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        if (!titleOpts.display) {
          return;
        }
        const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
        const ctx = this.ctx;
        const position = titleOpts.position;
        const halfFontSize = titleFont.size / 2;
        const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
        let y;
        let left = this.left;
        let maxWidth = this.width;
        if (this.isHorizontal()) {
          maxWidth = Math.max(...this.lineWidths);
          y = this.top + topPaddingPlusHalfFontSize;
          left = _alignStartEnd(opts.align, left, this.right - maxWidth);
        } else {
          const maxHeight = this.columnSizes.reduce((acc, size) => Math.max(acc, size.height), 0);
          y = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, this.top, this.bottom - maxHeight - opts.labels.padding - this._computeTitleHeight());
        }
        const x = _alignStartEnd(position, left, left + maxWidth);
        ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
        ctx.textBaseline = "middle";
        ctx.strokeStyle = titleOpts.color;
        ctx.fillStyle = titleOpts.color;
        ctx.font = titleFont.string;
        renderText(ctx, titleOpts.text, x, y, titleFont);
      }
      _computeTitleHeight() {
        const titleOpts = this.options.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
      }
      _getLegendItemAt(x, y) {
        let i, hitBox, lh;
        if (_isBetween(x, this.left, this.right) && _isBetween(y, this.top, this.bottom)) {
          lh = this.legendHitBoxes;
          for (i = 0; i < lh.length; ++i) {
            hitBox = lh[i];
            if (_isBetween(x, hitBox.left, hitBox.left + hitBox.width) && _isBetween(y, hitBox.top, hitBox.top + hitBox.height)) {
              return this.legendItems[i];
            }
          }
        }
        return null;
      }
      handleEvent(e) {
        const opts = this.options;
        if (!isListened(e.type, opts)) {
          return;
        }
        const hoveredItem = this._getLegendItemAt(e.x, e.y);
        if (e.type === "mousemove" || e.type === "mouseout") {
          const previous = this._hoveredItem;
          const sameItem = itemsEqual(previous, hoveredItem);
          if (previous && !sameItem) {
            callback(opts.onLeave, [
              e,
              previous,
              this
            ], this);
          }
          this._hoveredItem = hoveredItem;
          if (hoveredItem && !sameItem) {
            callback(opts.onHover, [
              e,
              hoveredItem,
              this
            ], this);
          }
        } else if (hoveredItem) {
          callback(opts.onClick, [
            e,
            hoveredItem,
            this
          ], this);
        }
      }
    };
    plugin_legend = {
      id: "legend",
      _element: Legend,
      start(chart, _args, options) {
        const legend = chart.legend = new Legend({
          ctx: chart.ctx,
          options,
          chart
        });
        layouts.configure(chart, legend, options);
        layouts.addBox(chart, legend);
      },
      stop(chart) {
        layouts.removeBox(chart, chart.legend);
        delete chart.legend;
      },
      beforeUpdate(chart, _args, options) {
        const legend = chart.legend;
        layouts.configure(chart, legend, options);
        legend.options = options;
      },
      afterUpdate(chart) {
        const legend = chart.legend;
        legend.buildLabels();
        legend.adjustHitBoxes();
      },
      afterEvent(chart, args) {
        if (!args.replay) {
          chart.legend.handleEvent(args.event);
        }
      },
      defaults: {
        display: true,
        position: "top",
        align: "center",
        fullSize: true,
        reverse: false,
        weight: 1e3,
        onClick(e, legendItem, legend) {
          const index2 = legendItem.datasetIndex;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index2)) {
            ci.hide(index2);
            legendItem.hidden = true;
          } else {
            ci.show(index2);
            legendItem.hidden = false;
          }
        },
        onHover: null,
        onLeave: null,
        labels: {
          color: (ctx) => ctx.chart.options.color,
          boxWidth: 40,
          padding: 10,
          generateLabels(chart) {
            const datasets = chart.data.datasets;
            const { labels: { usePointStyle, pointStyle, textAlign, color: color2, useBorderRadius, borderRadius } } = chart.legend.options;
            return chart._getSortedDatasetMetas().map((meta) => {
              const style = meta.controller.getStyle(usePointStyle ? 0 : void 0);
              const borderWidth = toPadding(style.borderWidth);
              return {
                text: datasets[meta.index].label,
                fillStyle: style.backgroundColor,
                fontColor: color2,
                hidden: !meta.visible,
                lineCap: style.borderCapStyle,
                lineDash: style.borderDash,
                lineDashOffset: style.borderDashOffset,
                lineJoin: style.borderJoinStyle,
                lineWidth: (borderWidth.width + borderWidth.height) / 4,
                strokeStyle: style.borderColor,
                pointStyle: pointStyle || style.pointStyle,
                rotation: style.rotation,
                textAlign: textAlign || style.textAlign,
                borderRadius: useBorderRadius && (borderRadius || style.borderRadius),
                datasetIndex: meta.index
              };
            }, this);
          }
        },
        title: {
          color: (ctx) => ctx.chart.options.color,
          display: false,
          position: "center",
          text: ""
        }
      },
      descriptors: {
        _scriptable: (name) => !name.startsWith("on"),
        labels: {
          _scriptable: (name) => ![
            "generateLabels",
            "filter",
            "sort"
          ].includes(name)
        }
      }
    };
    Title = class extends Element {
      constructor(config) {
        super();
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this._padding = void 0;
        this.top = void 0;
        this.bottom = void 0;
        this.left = void 0;
        this.right = void 0;
        this.width = void 0;
        this.height = void 0;
        this.position = void 0;
        this.weight = void 0;
        this.fullSize = void 0;
      }
      update(maxWidth, maxHeight) {
        const opts = this.options;
        this.left = 0;
        this.top = 0;
        if (!opts.display) {
          this.width = this.height = this.right = this.bottom = 0;
          return;
        }
        this.width = this.right = maxWidth;
        this.height = this.bottom = maxHeight;
        const lineCount = isArray(opts.text) ? opts.text.length : 1;
        this._padding = toPadding(opts.padding);
        const textSize = lineCount * toFont(opts.font).lineHeight + this._padding.height;
        if (this.isHorizontal()) {
          this.height = textSize;
        } else {
          this.width = textSize;
        }
      }
      isHorizontal() {
        const pos = this.options.position;
        return pos === "top" || pos === "bottom";
      }
      _drawArgs(offset) {
        const { top, left, bottom, right, options } = this;
        const align = options.align;
        let rotation = 0;
        let maxWidth, titleX, titleY;
        if (this.isHorizontal()) {
          titleX = _alignStartEnd(align, left, right);
          titleY = top + offset;
          maxWidth = right - left;
        } else {
          if (options.position === "left") {
            titleX = left + offset;
            titleY = _alignStartEnd(align, bottom, top);
            rotation = PI * -0.5;
          } else {
            titleX = right - offset;
            titleY = _alignStartEnd(align, top, bottom);
            rotation = PI * 0.5;
          }
          maxWidth = bottom - top;
        }
        return {
          titleX,
          titleY,
          maxWidth,
          rotation
        };
      }
      draw() {
        const ctx = this.ctx;
        const opts = this.options;
        if (!opts.display) {
          return;
        }
        const fontOpts = toFont(opts.font);
        const lineHeight = fontOpts.lineHeight;
        const offset = lineHeight / 2 + this._padding.top;
        const { titleX, titleY, maxWidth, rotation } = this._drawArgs(offset);
        renderText(ctx, opts.text, 0, 0, fontOpts, {
          color: opts.color,
          maxWidth,
          rotation,
          textAlign: _toLeftRightCenter(opts.align),
          textBaseline: "middle",
          translation: [
            titleX,
            titleY
          ]
        });
      }
    };
    plugin_title = {
      id: "title",
      _element: Title,
      start(chart, _args, options) {
        createTitle(chart, options);
      },
      stop(chart) {
        const titleBlock = chart.titleBlock;
        layouts.removeBox(chart, titleBlock);
        delete chart.titleBlock;
      },
      beforeUpdate(chart, _args, options) {
        const title = chart.titleBlock;
        layouts.configure(chart, title, options);
        title.options = options;
      },
      defaults: {
        align: "center",
        display: false,
        font: {
          weight: "bold"
        },
        fullSize: true,
        padding: 10,
        position: "top",
        text: "",
        weight: 2e3
      },
      defaultRoutes: {
        color: "color"
      },
      descriptors: {
        _scriptable: true,
        _indexable: false
      }
    };
    map2 = /* @__PURE__ */ new WeakMap();
    plugin_subtitle = {
      id: "subtitle",
      start(chart, _args, options) {
        const title = new Title({
          ctx: chart.ctx,
          options,
          chart
        });
        layouts.configure(chart, title, options);
        layouts.addBox(chart, title);
        map2.set(chart, title);
      },
      stop(chart) {
        layouts.removeBox(chart, map2.get(chart));
        map2.delete(chart);
      },
      beforeUpdate(chart, _args, options) {
        const title = map2.get(chart);
        layouts.configure(chart, title, options);
        title.options = options;
      },
      defaults: {
        align: "center",
        display: false,
        font: {
          weight: "normal"
        },
        fullSize: true,
        padding: 0,
        position: "top",
        text: "",
        weight: 1500
      },
      defaultRoutes: {
        color: "color"
      },
      descriptors: {
        _scriptable: true,
        _indexable: false
      }
    };
    positioners = {
      average(items) {
        if (!items.length) {
          return false;
        }
        let i, len;
        let xSet = /* @__PURE__ */ new Set();
        let y = 0;
        let count = 0;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const pos = el.tooltipPosition();
            xSet.add(pos.x);
            y += pos.y;
            ++count;
          }
        }
        if (count === 0 || xSet.size === 0) {
          return false;
        }
        const xAverage = [
          ...xSet
        ].reduce((a, b) => a + b) / xSet.size;
        return {
          x: xAverage,
          y: y / count
        };
      },
      nearest(items, eventPosition) {
        if (!items.length) {
          return false;
        }
        let x = eventPosition.x;
        let y = eventPosition.y;
        let minDistance = Number.POSITIVE_INFINITY;
        let i, len, nearestElement;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const center = el.getCenterPoint();
            const d = distanceBetweenPoints(eventPosition, center);
            if (d < minDistance) {
              minDistance = d;
              nearestElement = el;
            }
          }
        }
        if (nearestElement) {
          const tp = nearestElement.tooltipPosition();
          x = tp.x;
          y = tp.y;
        }
        return {
          x,
          y
        };
      }
    };
    defaultCallbacks = {
      beforeTitle: noop,
      title(tooltipItems) {
        if (tooltipItems.length > 0) {
          const item = tooltipItems[0];
          const labels = item.chart.data.labels;
          const labelCount = labels ? labels.length : 0;
          if (this && this.options && this.options.mode === "dataset") {
            return item.dataset.label || "";
          } else if (item.label) {
            return item.label;
          } else if (labelCount > 0 && item.dataIndex < labelCount) {
            return labels[item.dataIndex];
          }
        }
        return "";
      },
      afterTitle: noop,
      beforeBody: noop,
      beforeLabel: noop,
      label(tooltipItem) {
        if (this && this.options && this.options.mode === "dataset") {
          return tooltipItem.label + ": " + tooltipItem.formattedValue || tooltipItem.formattedValue;
        }
        let label2 = tooltipItem.dataset.label || "";
        if (label2) {
          label2 += ": ";
        }
        const value = tooltipItem.formattedValue;
        if (!isNullOrUndef(value)) {
          label2 += value;
        }
        return label2;
      },
      labelColor(tooltipItem) {
        const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
        const options = meta.controller.getStyle(tooltipItem.dataIndex);
        return {
          borderColor: options.borderColor,
          backgroundColor: options.backgroundColor,
          borderWidth: options.borderWidth,
          borderDash: options.borderDash,
          borderDashOffset: options.borderDashOffset,
          borderRadius: 0
        };
      },
      labelTextColor() {
        return this.options.bodyColor;
      },
      labelPointStyle(tooltipItem) {
        const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
        const options = meta.controller.getStyle(tooltipItem.dataIndex);
        return {
          pointStyle: options.pointStyle,
          rotation: options.rotation
        };
      },
      afterLabel: noop,
      afterBody: noop,
      beforeFooter: noop,
      footer: noop,
      afterFooter: noop
    };
    Tooltip = class extends Element {
      static positioners = positioners;
      constructor(config) {
        super();
        this.opacity = 0;
        this._active = [];
        this._eventPosition = void 0;
        this._size = void 0;
        this._cachedAnimations = void 0;
        this._tooltipItems = [];
        this.$animations = void 0;
        this.$context = void 0;
        this.chart = config.chart;
        this.options = config.options;
        this.dataPoints = void 0;
        this.title = void 0;
        this.beforeBody = void 0;
        this.body = void 0;
        this.afterBody = void 0;
        this.footer = void 0;
        this.xAlign = void 0;
        this.yAlign = void 0;
        this.x = void 0;
        this.y = void 0;
        this.height = void 0;
        this.width = void 0;
        this.caretX = void 0;
        this.caretY = void 0;
        this.labelColors = void 0;
        this.labelPointStyles = void 0;
        this.labelTextColors = void 0;
      }
      initialize(options) {
        this.options = options;
        this._cachedAnimations = void 0;
        this.$context = void 0;
      }
      _resolveAnimations() {
        const cached = this._cachedAnimations;
        if (cached) {
          return cached;
        }
        const chart = this.chart;
        const options = this.options.setContext(this.getContext());
        const opts = options.enabled && chart.options.animation && options.animations;
        const animations = new Animations(this.chart, opts);
        if (opts._cacheable) {
          this._cachedAnimations = Object.freeze(animations);
        }
        return animations;
      }
      getContext() {
        return this.$context || (this.$context = createTooltipContext(this.chart.getContext(), this, this._tooltipItems));
      }
      getTitle(context, options) {
        const { callbacks } = options;
        const beforeTitle = invokeCallbackWithFallback(callbacks, "beforeTitle", this, context);
        const title = invokeCallbackWithFallback(callbacks, "title", this, context);
        const afterTitle = invokeCallbackWithFallback(callbacks, "afterTitle", this, context);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeTitle));
        lines = pushOrConcat(lines, splitNewlines(title));
        lines = pushOrConcat(lines, splitNewlines(afterTitle));
        return lines;
      }
      getBeforeBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "beforeBody", this, tooltipItems));
      }
      getBody(tooltipItems, options) {
        const { callbacks } = options;
        const bodyItems = [];
        each(tooltipItems, (context) => {
          const bodyItem = {
            before: [],
            lines: [],
            after: []
          };
          const scoped = overrideCallbacks(callbacks, context);
          pushOrConcat(bodyItem.before, splitNewlines(invokeCallbackWithFallback(scoped, "beforeLabel", this, context)));
          pushOrConcat(bodyItem.lines, invokeCallbackWithFallback(scoped, "label", this, context));
          pushOrConcat(bodyItem.after, splitNewlines(invokeCallbackWithFallback(scoped, "afterLabel", this, context)));
          bodyItems.push(bodyItem);
        });
        return bodyItems;
      }
      getAfterBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(invokeCallbackWithFallback(options.callbacks, "afterBody", this, tooltipItems));
      }
      getFooter(tooltipItems, options) {
        const { callbacks } = options;
        const beforeFooter = invokeCallbackWithFallback(callbacks, "beforeFooter", this, tooltipItems);
        const footer = invokeCallbackWithFallback(callbacks, "footer", this, tooltipItems);
        const afterFooter = invokeCallbackWithFallback(callbacks, "afterFooter", this, tooltipItems);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeFooter));
        lines = pushOrConcat(lines, splitNewlines(footer));
        lines = pushOrConcat(lines, splitNewlines(afterFooter));
        return lines;
      }
      _createItems(options) {
        const active = this._active;
        const data = this.chart.data;
        const labelColors = [];
        const labelPointStyles = [];
        const labelTextColors = [];
        let tooltipItems = [];
        let i, len;
        for (i = 0, len = active.length; i < len; ++i) {
          tooltipItems.push(createTooltipItem(this.chart, active[i]));
        }
        if (options.filter) {
          tooltipItems = tooltipItems.filter((element, index2, array) => options.filter(element, index2, array, data));
        }
        if (options.itemSort) {
          tooltipItems = tooltipItems.sort((a, b) => options.itemSort(a, b, data));
        }
        each(tooltipItems, (context) => {
          const scoped = overrideCallbacks(options.callbacks, context);
          labelColors.push(invokeCallbackWithFallback(scoped, "labelColor", this, context));
          labelPointStyles.push(invokeCallbackWithFallback(scoped, "labelPointStyle", this, context));
          labelTextColors.push(invokeCallbackWithFallback(scoped, "labelTextColor", this, context));
        });
        this.labelColors = labelColors;
        this.labelPointStyles = labelPointStyles;
        this.labelTextColors = labelTextColors;
        this.dataPoints = tooltipItems;
        return tooltipItems;
      }
      update(changed, replay) {
        const options = this.options.setContext(this.getContext());
        const active = this._active;
        let properties;
        let tooltipItems = [];
        if (!active.length) {
          if (this.opacity !== 0) {
            properties = {
              opacity: 0
            };
          }
        } else {
          const position = positioners[options.position].call(this, active, this._eventPosition);
          tooltipItems = this._createItems(options);
          this.title = this.getTitle(tooltipItems, options);
          this.beforeBody = this.getBeforeBody(tooltipItems, options);
          this.body = this.getBody(tooltipItems, options);
          this.afterBody = this.getAfterBody(tooltipItems, options);
          this.footer = this.getFooter(tooltipItems, options);
          const size = this._size = getTooltipSize(this, options);
          const positionAndSize = Object.assign({}, position, size);
          const alignment = determineAlignment(this.chart, options, positionAndSize);
          const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this.chart);
          this.xAlign = alignment.xAlign;
          this.yAlign = alignment.yAlign;
          properties = {
            opacity: 1,
            x: backgroundPoint.x,
            y: backgroundPoint.y,
            width: size.width,
            height: size.height,
            caretX: position.x,
            caretY: position.y
          };
        }
        this._tooltipItems = tooltipItems;
        this.$context = void 0;
        if (properties) {
          this._resolveAnimations().update(this, properties);
        }
        if (changed && options.external) {
          options.external.call(this, {
            chart: this.chart,
            tooltip: this,
            replay
          });
        }
      }
      drawCaret(tooltipPoint, ctx, size, options) {
        const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
        ctx.lineTo(caretPosition.x1, caretPosition.y1);
        ctx.lineTo(caretPosition.x2, caretPosition.y2);
        ctx.lineTo(caretPosition.x3, caretPosition.y3);
      }
      getCaretPosition(tooltipPoint, size, options) {
        const { xAlign, yAlign } = this;
        const { caretSize, cornerRadius } = options;
        const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(cornerRadius);
        const { x: ptX, y: ptY } = tooltipPoint;
        const { width, height } = size;
        let x1, x2, x3, y1, y2, y3;
        if (yAlign === "center") {
          y2 = ptY + height / 2;
          if (xAlign === "left") {
            x1 = ptX;
            x2 = x1 - caretSize;
            y1 = y2 + caretSize;
            y3 = y2 - caretSize;
          } else {
            x1 = ptX + width;
            x2 = x1 + caretSize;
            y1 = y2 - caretSize;
            y3 = y2 + caretSize;
          }
          x3 = x1;
        } else {
          if (xAlign === "left") {
            x2 = ptX + Math.max(topLeft, bottomLeft) + caretSize;
          } else if (xAlign === "right") {
            x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
          } else {
            x2 = this.caretX;
          }
          if (yAlign === "top") {
            y1 = ptY;
            y2 = y1 - caretSize;
            x1 = x2 - caretSize;
            x3 = x2 + caretSize;
          } else {
            y1 = ptY + height;
            y2 = y1 + caretSize;
            x1 = x2 + caretSize;
            x3 = x2 - caretSize;
          }
          y3 = y1;
        }
        return {
          x1,
          x2,
          x3,
          y1,
          y2,
          y3
        };
      }
      drawTitle(pt, ctx, options) {
        const title = this.title;
        const length = title.length;
        let titleFont, titleSpacing, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
          pt.x = getAlignedX(this, options.titleAlign, options);
          ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
          ctx.textBaseline = "middle";
          titleFont = toFont(options.titleFont);
          titleSpacing = options.titleSpacing;
          ctx.fillStyle = options.titleColor;
          ctx.font = titleFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
            pt.y += titleFont.lineHeight + titleSpacing;
            if (i + 1 === length) {
              pt.y += options.titleMarginBottom - titleSpacing;
            }
          }
        }
      }
      _drawColorBox(ctx, pt, i, rtlHelper, options) {
        const labelColor = this.labelColors[i];
        const labelPointStyle = this.labelPointStyles[i];
        const { boxHeight, boxWidth } = options;
        const bodyFont = toFont(options.bodyFont);
        const colorX = getAlignedX(this, "left", options);
        const rtlColorX = rtlHelper.x(colorX);
        const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
        const colorY = pt.y + yOffSet;
        if (options.usePointStyle) {
          const drawOptions = {
            radius: Math.min(boxWidth, boxHeight) / 2,
            pointStyle: labelPointStyle.pointStyle,
            rotation: labelPointStyle.rotation,
            borderWidth: 1
          };
          const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
          const centerY = colorY + boxHeight / 2;
          ctx.strokeStyle = options.multiKeyBackground;
          ctx.fillStyle = options.multiKeyBackground;
          drawPoint(ctx, drawOptions, centerX, centerY);
          ctx.strokeStyle = labelColor.borderColor;
          ctx.fillStyle = labelColor.backgroundColor;
          drawPoint(ctx, drawOptions, centerX, centerY);
        } else {
          ctx.lineWidth = isObject(labelColor.borderWidth) ? Math.max(...Object.values(labelColor.borderWidth)) : labelColor.borderWidth || 1;
          ctx.strokeStyle = labelColor.borderColor;
          ctx.setLineDash(labelColor.borderDash || []);
          ctx.lineDashOffset = labelColor.borderDashOffset || 0;
          const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth);
          const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - 2);
          const borderRadius = toTRBLCorners(labelColor.borderRadius);
          if (Object.values(borderRadius).some((v) => v !== 0)) {
            ctx.beginPath();
            ctx.fillStyle = options.multiKeyBackground;
            addRoundedRectPath(ctx, {
              x: outerX,
              y: colorY,
              w: boxWidth,
              h: boxHeight,
              radius: borderRadius
            });
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = labelColor.backgroundColor;
            ctx.beginPath();
            addRoundedRectPath(ctx, {
              x: innerX,
              y: colorY + 1,
              w: boxWidth - 2,
              h: boxHeight - 2,
              radius: borderRadius
            });
            ctx.fill();
          } else {
            ctx.fillStyle = options.multiKeyBackground;
            ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
            ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
            ctx.fillStyle = labelColor.backgroundColor;
            ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
          }
        }
        ctx.fillStyle = this.labelTextColors[i];
      }
      drawBody(pt, ctx, options) {
        const { body } = this;
        const { bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth, boxPadding } = options;
        const bodyFont = toFont(options.bodyFont);
        let bodyLineHeight = bodyFont.lineHeight;
        let xLinePadding = 0;
        const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
        const fillLineOfText = function(line) {
          ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
          pt.y += bodyLineHeight + bodySpacing;
        };
        const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
        let bodyItem, textColor, lines, i, j, ilen, jlen;
        ctx.textAlign = bodyAlign;
        ctx.textBaseline = "middle";
        ctx.font = bodyFont.string;
        pt.x = getAlignedX(this, bodyAlignForCalculation, options);
        ctx.fillStyle = options.bodyColor;
        each(this.beforeBody, fillLineOfText);
        xLinePadding = displayColors && bodyAlignForCalculation !== "right" ? bodyAlign === "center" ? boxWidth / 2 + boxPadding : boxWidth + 2 + boxPadding : 0;
        for (i = 0, ilen = body.length; i < ilen; ++i) {
          bodyItem = body[i];
          textColor = this.labelTextColors[i];
          ctx.fillStyle = textColor;
          each(bodyItem.before, fillLineOfText);
          lines = bodyItem.lines;
          if (displayColors && lines.length) {
            this._drawColorBox(ctx, pt, i, rtlHelper, options);
            bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
          }
          for (j = 0, jlen = lines.length; j < jlen; ++j) {
            fillLineOfText(lines[j]);
            bodyLineHeight = bodyFont.lineHeight;
          }
          each(bodyItem.after, fillLineOfText);
        }
        xLinePadding = 0;
        bodyLineHeight = bodyFont.lineHeight;
        each(this.afterBody, fillLineOfText);
        pt.y -= bodySpacing;
      }
      drawFooter(pt, ctx, options) {
        const footer = this.footer;
        const length = footer.length;
        let footerFont, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
          pt.x = getAlignedX(this, options.footerAlign, options);
          pt.y += options.footerMarginTop;
          ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
          ctx.textBaseline = "middle";
          footerFont = toFont(options.footerFont);
          ctx.fillStyle = options.footerColor;
          ctx.font = footerFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
            pt.y += footerFont.lineHeight + options.footerSpacing;
          }
        }
      }
      drawBackground(pt, ctx, tooltipSize, options) {
        const { xAlign, yAlign } = this;
        const { x, y } = pt;
        const { width, height } = tooltipSize;
        const { topLeft, topRight, bottomLeft, bottomRight } = toTRBLCorners(options.cornerRadius);
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.beginPath();
        ctx.moveTo(x + topLeft, y);
        if (yAlign === "top") {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width - topRight, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
        if (yAlign === "center" && xAlign === "right") {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width, y + height - bottomRight);
        ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
        if (yAlign === "bottom") {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + bottomLeft, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
        if (yAlign === "center" && xAlign === "left") {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x, y + topLeft);
        ctx.quadraticCurveTo(x, y, x + topLeft, y);
        ctx.closePath();
        ctx.fill();
        if (options.borderWidth > 0) {
          ctx.stroke();
        }
      }
      _updateAnimationTarget(options) {
        const chart = this.chart;
        const anims = this.$animations;
        const animX = anims && anims.x;
        const animY = anims && anims.y;
        if (animX || animY) {
          const position = positioners[options.position].call(this, this._active, this._eventPosition);
          if (!position) {
            return;
          }
          const size = this._size = getTooltipSize(this, options);
          const positionAndSize = Object.assign({}, position, this._size);
          const alignment = determineAlignment(chart, options, positionAndSize);
          const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
          if (animX._to !== point.x || animY._to !== point.y) {
            this.xAlign = alignment.xAlign;
            this.yAlign = alignment.yAlign;
            this.width = size.width;
            this.height = size.height;
            this.caretX = position.x;
            this.caretY = position.y;
            this._resolveAnimations().update(this, point);
          }
        }
      }
      _willRender() {
        return !!this.opacity;
      }
      draw(ctx) {
        const options = this.options.setContext(this.getContext());
        let opacity = this.opacity;
        if (!opacity) {
          return;
        }
        this._updateAnimationTarget(options);
        const tooltipSize = {
          width: this.width,
          height: this.height
        };
        const pt = {
          x: this.x,
          y: this.y
        };
        opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
        const padding2 = toPadding(options.padding);
        const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
        if (options.enabled && hasTooltipContent) {
          ctx.save();
          ctx.globalAlpha = opacity;
          this.drawBackground(pt, ctx, tooltipSize, options);
          overrideTextDirection(ctx, options.textDirection);
          pt.y += padding2.top;
          this.drawTitle(pt, ctx, options);
          this.drawBody(pt, ctx, options);
          this.drawFooter(pt, ctx, options);
          restoreTextDirection(ctx, options.textDirection);
          ctx.restore();
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements, eventPosition) {
        const lastActive = this._active;
        const active = activeElements.map(({ datasetIndex, index: index2 }) => {
          const meta = this.chart.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error("Cannot find a dataset at index " + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index2],
            index: index2
          };
        });
        const changed = !_elementsEqual(lastActive, active);
        const positionChanged = this._positionChanged(active, eventPosition);
        if (changed || positionChanged) {
          this._active = active;
          this._eventPosition = eventPosition;
          this._ignoreReplayEvents = true;
          this.update(true);
        }
      }
      handleEvent(e, replay, inChartArea = true) {
        if (replay && this._ignoreReplayEvents) {
          return false;
        }
        this._ignoreReplayEvents = false;
        const options = this.options;
        const lastActive = this._active || [];
        const active = this._getActiveElements(e, lastActive, replay, inChartArea);
        const positionChanged = this._positionChanged(active, e);
        const changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
        if (changed) {
          this._active = active;
          if (options.enabled || options.external) {
            this._eventPosition = {
              x: e.x,
              y: e.y
            };
            this.update(true, replay);
          }
        }
        return changed;
      }
      _getActiveElements(e, lastActive, replay, inChartArea) {
        const options = this.options;
        if (e.type === "mouseout") {
          return [];
        }
        if (!inChartArea) {
          return lastActive.filter((i) => this.chart.data.datasets[i.datasetIndex] && this.chart.getDatasetMeta(i.datasetIndex).controller.getParsed(i.index) !== void 0);
        }
        const active = this.chart.getElementsAtEventForMode(e, options.mode, options, replay);
        if (options.reverse) {
          active.reverse();
        }
        return active;
      }
      _positionChanged(active, e) {
        const { caretX, caretY, options } = this;
        const position = positioners[options.position].call(this, active, e);
        return position !== false && (caretX !== position.x || caretY !== position.y);
      }
    };
    plugin_tooltip = {
      id: "tooltip",
      _element: Tooltip,
      positioners,
      afterInit(chart, _args, options) {
        if (options) {
          chart.tooltip = new Tooltip({
            chart,
            options
          });
        }
      },
      beforeUpdate(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      reset(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      afterDraw(chart) {
        const tooltip = chart.tooltip;
        if (tooltip && tooltip._willRender()) {
          const args = {
            tooltip
          };
          if (chart.notifyPlugins("beforeTooltipDraw", {
            ...args,
            cancelable: true
          }) === false) {
            return;
          }
          tooltip.draw(chart.ctx);
          chart.notifyPlugins("afterTooltipDraw", args);
        }
      },
      afterEvent(chart, args) {
        if (chart.tooltip) {
          const useFinalPosition = args.replay;
          if (chart.tooltip.handleEvent(args.event, useFinalPosition, args.inChartArea)) {
            args.changed = true;
          }
        }
      },
      defaults: {
        enabled: true,
        external: null,
        position: "average",
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        titleFont: {
          weight: "bold"
        },
        titleSpacing: 2,
        titleMarginBottom: 6,
        titleAlign: "left",
        bodyColor: "#fff",
        bodySpacing: 2,
        bodyFont: {},
        bodyAlign: "left",
        footerColor: "#fff",
        footerSpacing: 2,
        footerMarginTop: 6,
        footerFont: {
          weight: "bold"
        },
        footerAlign: "left",
        padding: 6,
        caretPadding: 2,
        caretSize: 5,
        cornerRadius: 6,
        boxHeight: (ctx, opts) => opts.bodyFont.size,
        boxWidth: (ctx, opts) => opts.bodyFont.size,
        multiKeyBackground: "#fff",
        displayColors: true,
        boxPadding: 0,
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 0,
        animation: {
          duration: 400,
          easing: "easeOutQuart"
        },
        animations: {
          numbers: {
            type: "number",
            properties: [
              "x",
              "y",
              "width",
              "height",
              "caretX",
              "caretY"
            ]
          },
          opacity: {
            easing: "linear",
            duration: 200
          }
        },
        callbacks: defaultCallbacks
      },
      defaultRoutes: {
        bodyFont: "font",
        footerFont: "font",
        titleFont: "font"
      },
      descriptors: {
        _scriptable: (name) => name !== "filter" && name !== "itemSort" && name !== "external",
        _indexable: false,
        callbacks: {
          _scriptable: false,
          _indexable: false
        },
        animation: {
          _fallback: false
        },
        animations: {
          _fallback: "animation"
        }
      },
      additionalOptionScopes: [
        "interaction"
      ]
    };
    plugins = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      Colors: plugin_colors,
      Decimation: plugin_decimation,
      Filler: index,
      Legend: plugin_legend,
      SubTitle: plugin_subtitle,
      Title: plugin_title,
      Tooltip: plugin_tooltip
    });
    addIfString = (labels, raw, index2, addedLabels) => {
      if (typeof raw === "string") {
        index2 = labels.push(raw) - 1;
        addedLabels.unshift({
          index: index2,
          label: raw
        });
      } else if (isNaN(raw)) {
        index2 = null;
      }
      return index2;
    };
    validIndex = (index2, max) => index2 === null ? null : _limitValue(Math.round(index2), 0, max);
    CategoryScale = class extends Scale {
      static id = "category";
      static defaults = {
        ticks: {
          callback: _getLabelForValue
        }
      };
      constructor(cfg) {
        super(cfg);
        this._startValue = void 0;
        this._valueRange = 0;
        this._addedLabels = [];
      }
      init(scaleOptions) {
        const added = this._addedLabels;
        if (added.length) {
          const labels = this.getLabels();
          for (const { index: index2, label: label2 } of added) {
            if (labels[index2] === label2) {
              labels.splice(index2, 1);
            }
          }
          this._addedLabels = [];
        }
        super.init(scaleOptions);
      }
      parse(raw, index2) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        const labels = this.getLabels();
        index2 = isFinite(index2) && labels[index2] === raw ? index2 : findOrAddLabel(labels, raw, valueOrDefault(index2, raw), this._addedLabels);
        return validIndex(index2, labels.length - 1);
      }
      determineDataLimits() {
        const { minDefined, maxDefined } = this.getUserBounds();
        let { min, max } = this.getMinMax(true);
        if (this.options.bounds === "ticks") {
          if (!minDefined) {
            min = 0;
          }
          if (!maxDefined) {
            max = this.getLabels().length - 1;
          }
        }
        this.min = min;
        this.max = max;
      }
      buildTicks() {
        const min = this.min;
        const max = this.max;
        const offset = this.options.offset;
        const ticks = [];
        let labels = this.getLabels();
        labels = min === 0 && max === labels.length - 1 ? labels : labels.slice(min, max + 1);
        this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
        this._startValue = this.min - (offset ? 0.5 : 0);
        for (let value = min; value <= max; value++) {
          ticks.push({
            value
          });
        }
        return ticks;
      }
      getLabelForValue(value) {
        return _getLabelForValue.call(this, value);
      }
      configure() {
        super.configure();
        if (!this.isHorizontal()) {
          this._reversePixels = !this._reversePixels;
        }
      }
      getPixelForValue(value) {
        if (typeof value !== "number") {
          value = this.parse(value);
        }
        return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getPixelForTick(index2) {
        const ticks = this.ticks;
        if (index2 < 0 || index2 > ticks.length - 1) {
          return null;
        }
        return this.getPixelForValue(ticks[index2].value);
      }
      getValueForPixel(pixel) {
        return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
      }
      getBasePixel() {
        return this.bottom;
      }
    };
    LinearScaleBase = class extends Scale {
      constructor(cfg) {
        super(cfg);
        this.start = void 0;
        this.end = void 0;
        this._startValue = void 0;
        this._endValue = void 0;
        this._valueRange = 0;
      }
      parse(raw, index2) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        if ((typeof raw === "number" || raw instanceof Number) && !isFinite(+raw)) {
          return null;
        }
        return +raw;
      }
      handleTickRangeOptions() {
        const { beginAtZero } = this.options;
        const { minDefined, maxDefined } = this.getUserBounds();
        let { min, max } = this;
        const setMin = (v) => min = minDefined ? min : v;
        const setMax = (v) => max = maxDefined ? max : v;
        if (beginAtZero) {
          const minSign = sign(min);
          const maxSign = sign(max);
          if (minSign < 0 && maxSign < 0) {
            setMax(0);
          } else if (minSign > 0 && maxSign > 0) {
            setMin(0);
          }
        }
        if (min === max) {
          let offset = max === 0 ? 1 : Math.abs(max * 0.05);
          setMax(max + offset);
          if (!beginAtZero) {
            setMin(min - offset);
          }
        }
        this.min = min;
        this.max = max;
      }
      getTickLimit() {
        const tickOpts = this.options.ticks;
        let { maxTicksLimit, stepSize } = tickOpts;
        let maxTicks;
        if (stepSize) {
          maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
          if (maxTicks > 1e3) {
            console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
            maxTicks = 1e3;
          }
        } else {
          maxTicks = this.computeTickLimit();
          maxTicksLimit = maxTicksLimit || 11;
        }
        if (maxTicksLimit) {
          maxTicks = Math.min(maxTicksLimit, maxTicks);
        }
        return maxTicks;
      }
      computeTickLimit() {
        return Number.POSITIVE_INFINITY;
      }
      buildTicks() {
        const opts = this.options;
        const tickOpts = opts.ticks;
        let maxTicks = this.getTickLimit();
        maxTicks = Math.max(2, maxTicks);
        const numericGeneratorOptions = {
          maxTicks,
          bounds: opts.bounds,
          min: opts.min,
          max: opts.max,
          precision: tickOpts.precision,
          step: tickOpts.stepSize,
          count: tickOpts.count,
          maxDigits: this._maxDigits(),
          horizontal: this.isHorizontal(),
          minRotation: tickOpts.minRotation || 0,
          includeBounds: tickOpts.includeBounds !== false
        };
        const dataRange = this._range || this;
        const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
        if (opts.bounds === "ticks") {
          _setMinAndMaxByKey(ticks, this, "value");
        }
        if (opts.reverse) {
          ticks.reverse();
          this.start = this.max;
          this.end = this.min;
        } else {
          this.start = this.min;
          this.end = this.max;
        }
        return ticks;
      }
      configure() {
        const ticks = this.ticks;
        let start = this.min;
        let end = this.max;
        super.configure();
        if (this.options.offset && ticks.length) {
          const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
          start -= offset;
          end += offset;
        }
        this._startValue = start;
        this._endValue = end;
        this._valueRange = end - start;
      }
      getLabelForValue(value) {
        return formatNumber(value, this.chart.options.locale, this.options.ticks.format);
      }
    };
    LinearScale = class extends LinearScaleBase {
      static id = "linear";
      static defaults = {
        ticks: {
          callback: Ticks.formatters.numeric
        }
      };
      determineDataLimits() {
        const { min, max } = this.getMinMax(true);
        this.min = isNumberFinite(min) ? min : 0;
        this.max = isNumberFinite(max) ? max : 1;
        this.handleTickRangeOptions();
      }
      computeTickLimit() {
        const horizontal = this.isHorizontal();
        const length = horizontal ? this.width : this.height;
        const minRotation = toRadians(this.options.ticks.minRotation);
        const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 1e-3;
        const tickFont = this._resolveTickFontOptions(0);
        return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
      }
      getPixelForValue(value) {
        return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
        return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
      }
    };
    log10Floor = (v) => Math.floor(log10(v));
    changeExponent = (v, m) => Math.pow(10, log10Floor(v) + m);
    LogarithmicScale = class extends Scale {
      static id = "logarithmic";
      static defaults = {
        ticks: {
          callback: Ticks.formatters.logarithmic,
          major: {
            enabled: true
          }
        }
      };
      constructor(cfg) {
        super(cfg);
        this.start = void 0;
        this.end = void 0;
        this._startValue = void 0;
        this._valueRange = 0;
      }
      parse(raw, index2) {
        const value = LinearScaleBase.prototype.parse.apply(this, [
          raw,
          index2
        ]);
        if (value === 0) {
          this._zero = true;
          return void 0;
        }
        return isNumberFinite(value) && value > 0 ? value : null;
      }
      determineDataLimits() {
        const { min, max } = this.getMinMax(true);
        this.min = isNumberFinite(min) ? Math.max(0, min) : null;
        this.max = isNumberFinite(max) ? Math.max(0, max) : null;
        if (this.options.beginAtZero) {
          this._zero = true;
        }
        if (this._zero && this.min !== this._suggestedMin && !isNumberFinite(this._userMin)) {
          this.min = min === changeExponent(this.min, 0) ? changeExponent(this.min, -1) : changeExponent(this.min, 0);
        }
        this.handleTickRangeOptions();
      }
      handleTickRangeOptions() {
        const { minDefined, maxDefined } = this.getUserBounds();
        let min = this.min;
        let max = this.max;
        const setMin = (v) => min = minDefined ? min : v;
        const setMax = (v) => max = maxDefined ? max : v;
        if (min === max) {
          if (min <= 0) {
            setMin(1);
            setMax(10);
          } else {
            setMin(changeExponent(min, -1));
            setMax(changeExponent(max, 1));
          }
        }
        if (min <= 0) {
          setMin(changeExponent(max, -1));
        }
        if (max <= 0) {
          setMax(changeExponent(min, 1));
        }
        this.min = min;
        this.max = max;
      }
      buildTicks() {
        const opts = this.options;
        const generationOptions = {
          min: this._userMin,
          max: this._userMax
        };
        const ticks = generateTicks(generationOptions, this);
        if (opts.bounds === "ticks") {
          _setMinAndMaxByKey(ticks, this, "value");
        }
        if (opts.reverse) {
          ticks.reverse();
          this.start = this.max;
          this.end = this.min;
        } else {
          this.start = this.min;
          this.end = this.max;
        }
        return ticks;
      }
      getLabelForValue(value) {
        return value === void 0 ? "0" : formatNumber(value, this.chart.options.locale, this.options.ticks.format);
      }
      configure() {
        const start = this.min;
        super.configure();
        this._startValue = log10(start);
        this._valueRange = log10(this.max) - log10(start);
      }
      getPixelForValue(value) {
        if (value === void 0 || value === 0) {
          value = this.min;
        }
        if (value === null || isNaN(value)) {
          return NaN;
        }
        return this.getPixelForDecimal(value === this.min ? 0 : (log10(value) - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
        const decimal = this.getDecimalForPixel(pixel);
        return Math.pow(10, this._startValue + decimal * this._valueRange);
      }
    };
    RadialLinearScale = class extends LinearScaleBase {
      static id = "radialLinear";
      static defaults = {
        display: true,
        animate: true,
        position: "chartArea",
        angleLines: {
          display: true,
          lineWidth: 1,
          borderDash: [],
          borderDashOffset: 0
        },
        grid: {
          circular: false
        },
        startAngle: 0,
        ticks: {
          showLabelBackdrop: true,
          callback: Ticks.formatters.numeric
        },
        pointLabels: {
          backdropColor: void 0,
          backdropPadding: 2,
          display: true,
          font: {
            size: 10
          },
          callback(label2) {
            return label2;
          },
          padding: 5,
          centerPointLabels: false
        }
      };
      static defaultRoutes = {
        "angleLines.color": "borderColor",
        "pointLabels.color": "color",
        "ticks.color": "color"
      };
      static descriptors = {
        angleLines: {
          _fallback: "grid"
        }
      };
      constructor(cfg) {
        super(cfg);
        this.xCenter = void 0;
        this.yCenter = void 0;
        this.drawingArea = void 0;
        this._pointLabels = [];
        this._pointLabelItems = [];
      }
      setDimensions() {
        const padding2 = this._padding = toPadding(getTickBackdropHeight(this.options) / 2);
        const w = this.width = this.maxWidth - padding2.width;
        const h3 = this.height = this.maxHeight - padding2.height;
        this.xCenter = Math.floor(this.left + w / 2 + padding2.left);
        this.yCenter = Math.floor(this.top + h3 / 2 + padding2.top);
        this.drawingArea = Math.floor(Math.min(w, h3) / 2);
      }
      determineDataLimits() {
        const { min, max } = this.getMinMax(false);
        this.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
        this.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
        this.handleTickRangeOptions();
      }
      computeTickLimit() {
        return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
      }
      generateTickLabels(ticks) {
        LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
        this._pointLabels = this.getLabels().map((value, index2) => {
          const label2 = callback(this.options.pointLabels.callback, [
            value,
            index2
          ], this);
          return label2 || label2 === 0 ? label2 : "";
        }).filter((v, i) => this.chart.getDataVisibility(i));
      }
      fit() {
        const opts = this.options;
        if (opts.display && opts.pointLabels.display) {
          fitWithPointLabels(this);
        } else {
          this.setCenterPoint(0, 0, 0, 0);
        }
      }
      setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
        this.xCenter += Math.floor((leftMovement - rightMovement) / 2);
        this.yCenter += Math.floor((topMovement - bottomMovement) / 2);
        this.drawingArea -= Math.min(this.drawingArea / 2, Math.max(leftMovement, rightMovement, topMovement, bottomMovement));
      }
      getIndexAngle(index2) {
        const angleMultiplier = TAU / (this._pointLabels.length || 1);
        const startAngle = this.options.startAngle || 0;
        return _normalizeAngle(index2 * angleMultiplier + toRadians(startAngle));
      }
      getDistanceFromCenterForValue(value) {
        if (isNullOrUndef(value)) {
          return NaN;
        }
        const scalingFactor = this.drawingArea / (this.max - this.min);
        if (this.options.reverse) {
          return (this.max - value) * scalingFactor;
        }
        return (value - this.min) * scalingFactor;
      }
      getValueForDistanceFromCenter(distance) {
        if (isNullOrUndef(distance)) {
          return NaN;
        }
        const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
        return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
      }
      getPointLabelContext(index2) {
        const pointLabels = this._pointLabels || [];
        if (index2 >= 0 && index2 < pointLabels.length) {
          const pointLabel = pointLabels[index2];
          return createPointLabelContext(this.getContext(), index2, pointLabel);
        }
      }
      getPointPosition(index2, distanceFromCenter, additionalAngle = 0) {
        const angle = this.getIndexAngle(index2) - HALF_PI + additionalAngle;
        return {
          x: Math.cos(angle) * distanceFromCenter + this.xCenter,
          y: Math.sin(angle) * distanceFromCenter + this.yCenter,
          angle
        };
      }
      getPointPositionForValue(index2, value) {
        return this.getPointPosition(index2, this.getDistanceFromCenterForValue(value));
      }
      getBasePosition(index2) {
        return this.getPointPositionForValue(index2 || 0, this.getBaseValue());
      }
      getPointLabelPosition(index2) {
        const { left, top, right, bottom } = this._pointLabelItems[index2];
        return {
          left,
          top,
          right,
          bottom
        };
      }
      drawBackground() {
        const { backgroundColor, grid: { circular } } = this.options;
        if (backgroundColor) {
          const ctx = this.ctx;
          ctx.save();
          ctx.beginPath();
          pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this._pointLabels.length);
          ctx.closePath();
          ctx.fillStyle = backgroundColor;
          ctx.fill();
          ctx.restore();
        }
      }
      drawGrid() {
        const ctx = this.ctx;
        const opts = this.options;
        const { angleLines, grid, border } = opts;
        const labelCount = this._pointLabels.length;
        let i, offset, position;
        if (opts.pointLabels.display) {
          drawPointLabels(this, labelCount);
        }
        if (grid.display) {
          this.ticks.forEach((tick, index2) => {
            if (index2 !== 0 || index2 === 0 && this.min < 0) {
              offset = this.getDistanceFromCenterForValue(tick.value);
              const context = this.getContext(index2);
              const optsAtIndex = grid.setContext(context);
              const optsAtIndexBorder = border.setContext(context);
              drawRadiusLine(this, optsAtIndex, offset, labelCount, optsAtIndexBorder);
            }
          });
        }
        if (angleLines.display) {
          ctx.save();
          for (i = labelCount - 1; i >= 0; i--) {
            const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i));
            const { color: color2, lineWidth } = optsAtIndex;
            if (!lineWidth || !color2) {
              continue;
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color2;
            ctx.setLineDash(optsAtIndex.borderDash);
            ctx.lineDashOffset = optsAtIndex.borderDashOffset;
            offset = this.getDistanceFromCenterForValue(opts.reverse ? this.min : this.max);
            position = this.getPointPosition(i, offset);
            ctx.beginPath();
            ctx.moveTo(this.xCenter, this.yCenter);
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      drawBorder() {
      }
      drawLabels() {
        const ctx = this.ctx;
        const opts = this.options;
        const tickOpts = opts.ticks;
        if (!tickOpts.display) {
          return;
        }
        const startAngle = this.getIndexAngle(0);
        let offset, width;
        ctx.save();
        ctx.translate(this.xCenter, this.yCenter);
        ctx.rotate(startAngle);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.ticks.forEach((tick, index2) => {
          if (index2 === 0 && this.min >= 0 && !opts.reverse) {
            return;
          }
          const optsAtIndex = tickOpts.setContext(this.getContext(index2));
          const tickFont = toFont(optsAtIndex.font);
          offset = this.getDistanceFromCenterForValue(this.ticks[index2].value);
          if (optsAtIndex.showLabelBackdrop) {
            ctx.font = tickFont.string;
            width = ctx.measureText(tick.label).width;
            ctx.fillStyle = optsAtIndex.backdropColor;
            const padding2 = toPadding(optsAtIndex.backdropPadding);
            ctx.fillRect(-width / 2 - padding2.left, -offset - tickFont.size / 2 - padding2.top, width + padding2.width, tickFont.size + padding2.height);
          }
          renderText(ctx, tick.label, 0, -offset, tickFont, {
            color: optsAtIndex.color,
            strokeColor: optsAtIndex.textStrokeColor,
            strokeWidth: optsAtIndex.textStrokeWidth
          });
        });
        ctx.restore();
      }
      drawTitle() {
      }
    };
    INTERVALS = {
      millisecond: {
        common: true,
        size: 1,
        steps: 1e3
      },
      second: {
        common: true,
        size: 1e3,
        steps: 60
      },
      minute: {
        common: true,
        size: 6e4,
        steps: 60
      },
      hour: {
        common: true,
        size: 36e5,
        steps: 24
      },
      day: {
        common: true,
        size: 864e5,
        steps: 30
      },
      week: {
        common: false,
        size: 6048e5,
        steps: 4
      },
      month: {
        common: true,
        size: 2628e6,
        steps: 12
      },
      quarter: {
        common: false,
        size: 7884e6,
        steps: 4
      },
      year: {
        common: true,
        size: 3154e7
      }
    };
    UNITS = /* @__PURE__ */ Object.keys(INTERVALS);
    TimeScale = class extends Scale {
      static id = "time";
      static defaults = {
        bounds: "data",
        adapters: {},
        time: {
          parser: false,
          unit: false,
          round: false,
          isoWeekday: false,
          minUnit: "millisecond",
          displayFormats: {}
        },
        ticks: {
          source: "auto",
          callback: false,
          major: {
            enabled: false
          }
        }
      };
      constructor(props) {
        super(props);
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
        this._unit = "day";
        this._majorUnit = void 0;
        this._offsets = {};
        this._normalized = false;
        this._parseOpts = void 0;
      }
      init(scaleOpts, opts = {}) {
        const time = scaleOpts.time || (scaleOpts.time = {});
        const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
        adapter.init(opts);
        mergeIf(time.displayFormats, adapter.formats());
        this._parseOpts = {
          parser: time.parser,
          round: time.round,
          isoWeekday: time.isoWeekday
        };
        super.init(scaleOpts);
        this._normalized = opts.normalized;
      }
      parse(raw, index2) {
        if (raw === void 0) {
          return null;
        }
        return parse(this, raw);
      }
      beforeLayout() {
        super.beforeLayout();
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
      }
      determineDataLimits() {
        const options = this.options;
        const adapter = this._adapter;
        const unit = options.time.unit || "day";
        let { min, max, minDefined, maxDefined } = this.getUserBounds();
        function _applyBounds(bounds) {
          if (!minDefined && !isNaN(bounds.min)) {
            min = Math.min(min, bounds.min);
          }
          if (!maxDefined && !isNaN(bounds.max)) {
            max = Math.max(max, bounds.max);
          }
        }
        if (!minDefined || !maxDefined) {
          _applyBounds(this._getLabelBounds());
          if (options.bounds !== "ticks" || options.ticks.source !== "labels") {
            _applyBounds(this.getMinMax(false));
          }
        }
        min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
        max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
        this.min = Math.min(min, max - 1);
        this.max = Math.max(min + 1, max);
      }
      _getLabelBounds() {
        const arr = this.getLabelTimestamps();
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        if (arr.length) {
          min = arr[0];
          max = arr[arr.length - 1];
        }
        return {
          min,
          max
        };
      }
      buildTicks() {
        const options = this.options;
        const timeOpts = options.time;
        const tickOpts = options.ticks;
        const timestamps = tickOpts.source === "labels" ? this.getLabelTimestamps() : this._generate();
        if (options.bounds === "ticks" && timestamps.length) {
          this.min = this._userMin || timestamps[0];
          this.max = this._userMax || timestamps[timestamps.length - 1];
        }
        const min = this.min;
        const max = this.max;
        const ticks = _filterBetween(timestamps, min, max);
        this._unit = timeOpts.unit || (tickOpts.autoSkip ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min)) : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
        this._majorUnit = !tickOpts.major.enabled || this._unit === "year" ? void 0 : determineMajorUnit(this._unit);
        this.initOffsets(timestamps);
        if (options.reverse) {
          ticks.reverse();
        }
        return ticksFromTimestamps(this, ticks, this._majorUnit);
      }
      afterAutoSkip() {
        if (this.options.offsetAfterAutoskip) {
          this.initOffsets(this.ticks.map((tick) => +tick.value));
        }
      }
      initOffsets(timestamps = []) {
        let start = 0;
        let end = 0;
        let first, last;
        if (this.options.offset && timestamps.length) {
          first = this.getDecimalForValue(timestamps[0]);
          if (timestamps.length === 1) {
            start = 1 - first;
          } else {
            start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
          }
          last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
          if (timestamps.length === 1) {
            end = last;
          } else {
            end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
          }
        }
        const limit = timestamps.length < 3 ? 0.5 : 0.25;
        start = _limitValue(start, 0, limit);
        end = _limitValue(end, 0, limit);
        this._offsets = {
          start,
          end,
          factor: 1 / (start + 1 + end)
        };
      }
      _generate() {
        const adapter = this._adapter;
        const min = this.min;
        const max = this.max;
        const options = this.options;
        const timeOpts = options.time;
        const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, this._getLabelCapacity(min));
        const stepSize = valueOrDefault(options.ticks.stepSize, 1);
        const weekday = minor === "week" ? timeOpts.isoWeekday : false;
        const hasWeekday = isNumber(weekday) || weekday === true;
        const ticks = {};
        let first = min;
        let time, count;
        if (hasWeekday) {
          first = +adapter.startOf(first, "isoWeek", weekday);
        }
        first = +adapter.startOf(first, hasWeekday ? "day" : minor);
        if (adapter.diff(max, min, minor) > 1e5 * stepSize) {
          throw new Error(min + " and " + max + " are too far apart with stepSize of " + stepSize + " " + minor);
        }
        const timestamps = options.ticks.source === "data" && this.getDataTimestamps();
        for (time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++) {
          addTick(ticks, time, timestamps);
        }
        if (time === max || options.bounds === "ticks" || count === 1) {
          addTick(ticks, time, timestamps);
        }
        return Object.keys(ticks).sort(sorter).map((x) => +x);
      }
      getLabelForValue(value) {
        const adapter = this._adapter;
        const timeOpts = this.options.time;
        if (timeOpts.tooltipFormat) {
          return adapter.format(value, timeOpts.tooltipFormat);
        }
        return adapter.format(value, timeOpts.displayFormats.datetime);
      }
      format(value, format) {
        const options = this.options;
        const formats = options.time.displayFormats;
        const unit = this._unit;
        const fmt = format || formats[unit];
        return this._adapter.format(value, fmt);
      }
      _tickFormatFunction(time, index2, ticks, format) {
        const options = this.options;
        const formatter = options.ticks.callback;
        if (formatter) {
          return callback(formatter, [
            time,
            index2,
            ticks
          ], this);
        }
        const formats = options.time.displayFormats;
        const unit = this._unit;
        const majorUnit = this._majorUnit;
        const minorFormat = unit && formats[unit];
        const majorFormat = majorUnit && formats[majorUnit];
        const tick = ticks[index2];
        const major = majorUnit && majorFormat && tick && tick.major;
        return this._adapter.format(time, format || (major ? majorFormat : minorFormat));
      }
      generateTickLabels(ticks) {
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          tick.label = this._tickFormatFunction(tick.value, i, ticks);
        }
      }
      getDecimalForValue(value) {
        return value === null ? NaN : (value - this.min) / (this.max - this.min);
      }
      getPixelForValue(value) {
        const offsets = this._offsets;
        const pos = this.getDecimalForValue(value);
        return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
      }
      getValueForPixel(pixel) {
        const offsets = this._offsets;
        const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return this.min + pos * (this.max - this.min);
      }
      _getLabelSize(label2) {
        const ticksOpts = this.options.ticks;
        const tickLabelWidth = this.ctx.measureText(label2).width;
        const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
        const cosRotation = Math.cos(angle);
        const sinRotation = Math.sin(angle);
        const tickFontSize = this._resolveTickFontOptions(0).size;
        return {
          w: tickLabelWidth * cosRotation + tickFontSize * sinRotation,
          h: tickLabelWidth * sinRotation + tickFontSize * cosRotation
        };
      }
      _getLabelCapacity(exampleTime) {
        const timeOpts = this.options.time;
        const displayFormats = timeOpts.displayFormats;
        const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
        const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [
          exampleTime
        ], this._majorUnit), format);
        const size = this._getLabelSize(exampleLabel);
        const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
        return capacity > 0 ? capacity : 1;
      }
      getDataTimestamps() {
        let timestamps = this._cache.data || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const metas = this.getMatchingVisibleMetas();
        if (this._normalized && metas.length) {
          return this._cache.data = metas[0].controller.getAllParsedValues(this);
        }
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(this));
        }
        return this._cache.data = this.normalize(timestamps);
      }
      getLabelTimestamps() {
        const timestamps = this._cache.labels || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const labels = this.getLabels();
        for (i = 0, ilen = labels.length; i < ilen; ++i) {
          timestamps.push(parse(this, labels[i]));
        }
        return this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps);
      }
      normalize(values) {
        return _arrayUnique(values.sort(sorter));
      }
    };
    TimeSeriesScale = class extends TimeScale {
      static id = "timeseries";
      static defaults = TimeScale.defaults;
      constructor(props) {
        super(props);
        this._table = [];
        this._minPos = void 0;
        this._tableRange = void 0;
      }
      initOffsets() {
        const timestamps = this._getTimestampsForTable();
        const table = this._table = this.buildLookupTable(timestamps);
        this._minPos = interpolate2(table, this.min);
        this._tableRange = interpolate2(table, this.max) - this._minPos;
        super.initOffsets(timestamps);
      }
      buildLookupTable(timestamps) {
        const { min, max } = this;
        const items = [];
        const table = [];
        let i, ilen, prev, curr, next;
        for (i = 0, ilen = timestamps.length; i < ilen; ++i) {
          curr = timestamps[i];
          if (curr >= min && curr <= max) {
            items.push(curr);
          }
        }
        if (items.length < 2) {
          return [
            {
              time: min,
              pos: 0
            },
            {
              time: max,
              pos: 1
            }
          ];
        }
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          next = items[i + 1];
          prev = items[i - 1];
          curr = items[i];
          if (Math.round((next + prev) / 2) !== curr) {
            table.push({
              time: curr,
              pos: i / (ilen - 1)
            });
          }
        }
        return table;
      }
      _generate() {
        const min = this.min;
        const max = this.max;
        let timestamps = super.getDataTimestamps();
        if (!timestamps.includes(min) || !timestamps.length) {
          timestamps.splice(0, 0, min);
        }
        if (!timestamps.includes(max) || timestamps.length === 1) {
          timestamps.push(max);
        }
        return timestamps.sort((a, b) => a - b);
      }
      _getTimestampsForTable() {
        let timestamps = this._cache.all || [];
        if (timestamps.length) {
          return timestamps;
        }
        const data = this.getDataTimestamps();
        const label2 = this.getLabelTimestamps();
        if (data.length && label2.length) {
          timestamps = this.normalize(data.concat(label2));
        } else {
          timestamps = data.length ? data : label2;
        }
        timestamps = this._cache.all = timestamps;
        return timestamps;
      }
      getDecimalForValue(value) {
        return (interpolate2(this._table, value) - this._minPos) / this._tableRange;
      }
      getValueForPixel(pixel) {
        const offsets = this._offsets;
        const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return interpolate2(this._table, decimal * this._tableRange + this._minPos, true);
      }
    };
    scales = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      CategoryScale,
      LinearScale,
      LogarithmicScale,
      RadialLinearScale,
      TimeScale,
      TimeSeriesScale
    });
    registerables = [
      controllers,
      elements,
      plugins,
      scales
    ];
  }
});

// node_modules/chart.js/auto/auto.js
var auto_exports = {};
__export(auto_exports, {
  Animation: () => Animation,
  Animations: () => Animations,
  ArcElement: () => ArcElement,
  BarController: () => BarController,
  BarElement: () => BarElement,
  BasePlatform: () => BasePlatform,
  BasicPlatform: () => BasicPlatform,
  BubbleController: () => BubbleController,
  CategoryScale: () => CategoryScale,
  Chart: () => Chart,
  Colors: () => plugin_colors,
  DatasetController: () => DatasetController,
  Decimation: () => plugin_decimation,
  DomPlatform: () => DomPlatform,
  DoughnutController: () => DoughnutController,
  Element: () => Element,
  Filler: () => index,
  Interaction: () => Interaction,
  Legend: () => plugin_legend,
  LineController: () => LineController,
  LineElement: () => LineElement,
  LinearScale: () => LinearScale,
  LogarithmicScale: () => LogarithmicScale,
  PieController: () => PieController,
  PointElement: () => PointElement,
  PolarAreaController: () => PolarAreaController,
  RadarController: () => RadarController,
  RadialLinearScale: () => RadialLinearScale,
  Scale: () => Scale,
  ScatterController: () => ScatterController,
  SubTitle: () => plugin_subtitle,
  Ticks: () => Ticks,
  TimeScale: () => TimeScale,
  TimeSeriesScale: () => TimeSeriesScale,
  Title: () => plugin_title,
  Tooltip: () => plugin_tooltip,
  _adapters: () => adapters,
  _detectPlatform: () => _detectPlatform,
  animator: () => animator,
  controllers: () => controllers,
  default: () => auto_default,
  defaults: () => defaults,
  elements: () => elements,
  layouts: () => layouts,
  plugins: () => plugins,
  registerables: () => registerables,
  registry: () => registry,
  scales: () => scales
});
var auto_default;
var init_auto = __esm({
  "node_modules/chart.js/auto/auto.js"() {
    init_chart();
    init_chart();
    Chart.register(...registerables);
    auto_default = Chart;
  }
});

// src/core/constants.js
var APP = Object.freeze({
  NAME: "OKey",
  VERSION: "1.0.0",
  APPSCRIPT_VERSION: "1.0.0",
  SCHEMA_VERSION: "1.0.0",
  /** Bumped when the at-rest vault container format changes. */
  VAULT_FORMAT_VERSION: 2,
  /** Bumped when an individual entry's schema changes. */
  ENTRY_SCHEMA_VERSION: 1,
  MAX_ENTRIES: 1e4,
  MAX_SHEETS: 3
});
var KDF = Object.freeze({
  ARGON2_TIME: 3,
  // iterations (t)
  ARGON2_MEMORY_KIB: 65536,
  // 64 MiB (m)
  ARGON2_PARALLELISM: 1,
  // single lane — deterministic across platforms
  ARGON2_HASH_LENGTH: 32,
  // 256-bit output
  PBKDF2_ITERATIONS: 6e5,
  // OWASP 2024 for PBKDF2-HMAC-SHA256
  PBKDF2_HASH: "SHA-256",
  SALT_LENGTH: 32
});
var CRYPTO = Object.freeze({
  ALGORITHM: "AES-GCM",
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  // 96-bit nonce (GCM recommended)
  TAG_LENGTH: 128,
  // 128-bit auth tag (bits)
  SALT_LENGTH: 32
});
var SECURITY = Object.freeze({
  DEFAULT_AUTO_LOCK_SECONDS: 60,
  MIN_AUTO_LOCK_SECONDS: 30,
  MAX_AUTO_LOCK_SECONDS: 1800,
  /** Re-open popup within this window → restore unlocked session without re-typing. */
  SESSION_REUNLOCK_COOLDOWN_MINUTES: 1,
  DEFAULT_CLIPBOARD_CLEAR_SECONDS: 30,
  MIN_CLIPBOARD_CLEAR_SECONDS: 10,
  MAX_CLIPBOARD_CLEAR_SECONDS: 120,
  IDLE_DETECTION_INTERVAL: 15,
  MIN_MASTER_PASSWORD_LENGTH: 4,
  // 4-digit PIN
  MAX_FAILED_UNLOCKS: 30,
  WARN_FAILED_UNLOCKS: 25
});
var SYNC = Object.freeze({
  DEFAULT_INTERVAL_MINUTES: 1440,
  // 24h
  MIN_INTERVAL_MINUTES: 15,
  MAX_INTERVAL_MINUTES: 10080,
  // 7 days (must be ≥ DEFAULT; previously 60 — bug)
  DEBOUNCE_MS: 1e4,
  MAX_RETRIES: 10,
  INITIAL_BACKOFF_MS: 1e3,
  MAX_BACKOFF_MS: 3e5,
  TOMBSTONE_RETENTION_DAYS: 30,
  ALARM_NAME: "okey-sync",
  AUTO_LOCK_ALARM: "okey-auto-lock",
  CLIPBOARD_ALARM: "okey-clipboard-clear"
});
var TOTP = Object.freeze({
  DEFAULT_PERIOD: 30,
  DEFAULT_DIGITS: 6,
  DEFAULT_ALGORITHM: "SHA-1",
  /** Accept codes ±1 step to tolerate clock skew when validating. */
  VALIDATION_WINDOW: 1
});
var PASSWORD_GEN = Object.freeze({
  DEFAULT_LENGTH: 20,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  DEFAULT_UPPERCASE: true,
  DEFAULT_LOWERCASE: true,
  DEFAULT_NUMBERS: true,
  DEFAULT_SYMBOLS: true,
  SYMBOL_SET: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  PASSPHRASE_DEFAULT_WORDS: 5,
  PASSPHRASE_SEPARATOR: "-"
});
var FAVICON = Object.freeze({
  ENABLED: true,
  SIZE: 32,
  REFRESH_AFTER_MS: 7 * 24 * 60 * 60 * 1e3,
  // 7 days
  PROVIDER: "https://www.google.com/s2/favicons"
});
var DEFAULT_SETTINGS = Object.freeze({
  autoLockTimeout: SECURITY.DEFAULT_AUTO_LOCK_SECONDS,
  miniAutoLockTimeout: 300,
  sessionReunlockCooldown: SECURITY.SESSION_REUNLOCK_COOLDOWN_MINUTES,
  clipboardClearTimeout: SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS,
  biometricEnabled: false,
  autoSyncEnabled: true,
  syncIntervalMinutes: SYNC.DEFAULT_INTERVAL_MINUTES,
  showRecents: true,
  recentsMaxCount: 10,
  faviconsEnabled: true,
  autoSubmitEnabled: false,
  autoFillSingleMatch: false,
  theme: "system",
  passwordGeneratorDefaults: {
    length: PASSWORD_GEN.DEFAULT_LENGTH,
    uppercase: PASSWORD_GEN.DEFAULT_UPPERCASE,
    lowercase: PASSWORD_GEN.DEFAULT_LOWERCASE,
    numbers: PASSWORD_GEN.DEFAULT_NUMBERS,
    symbols: PASSWORD_GEN.DEFAULT_SYMBOLS
  }
});
var STORAGE_KEYS = Object.freeze({
  VAULT_DATA: "okey_vault",
  VAULT_SALT: "okey_salt",
  KDF_PARAMS: "okey_kdf_params",
  WRAPPED_BY_MASTER: "okey_wrapped_master",
  WRAPPED_BY_RECOVERY: "okey_wrapped_recovery",
  VAULT_METADATA: "okey_metadata",
  SETTINGS: "okey_settings",
  SHEETS_CONFIG: "okey_sheets",
  OFFLINE_QUEUE: "okey_offline_queue",
  LAST_SYNC_AT: "okey_last_sync",
  RECENTS: "okey_recents",
  THEME: "okey_theme",
  SETUP_COMPLETE: "okey_setup_complete",
  FAVICON_CACHE: "okey_favicon_cache",
  BIOMETRIC_CRED_ID: "okey_biometric_cred_id",
  BIOMETRIC_WRAPPED: "okey_biometric_wrapped",
  SCHEMA_MIGRATED: "okey_schema_migrated",
  CACHED_FOLDERS: "okey_cached_folders",
  FOLDERS_CACHE_TIME: "okey_folders_cache_time",
  FAILED_UNLOCK_ATTEMPTS: "okey_failed_unlocks",
  BACKEND_VERSION_MISMATCH: "okey_backend_version_mismatch",
  BACKEND_CAPABILITIES: "okey_backend_capabilities",
  BACKEND_DASHBOARD: "okey_backend_dashboard",
  BACKEND_ANALYTICS: "okey_backend_analytics",
  ANALYTICS_CACHE_TIME: "okey_analytics_cache_time"
});
var LEGACY_STORAGE_KEYS = Object.freeze({
  vaultsheet_vault: STORAGE_KEYS.VAULT_DATA,
  vaultsheet_salt: STORAGE_KEYS.VAULT_SALT,
  vaultsheet_kdf_params: STORAGE_KEYS.KDF_PARAMS,
  vaultsheet_metadata: STORAGE_KEYS.VAULT_METADATA,
  vaultsheet_settings: STORAGE_KEYS.SETTINGS,
  vaultsheet_sheets: STORAGE_KEYS.SHEETS_CONFIG,
  vaultsheet_offline_queue: STORAGE_KEYS.OFFLINE_QUEUE,
  vaultsheet_last_sync: STORAGE_KEYS.LAST_SYNC_AT,
  vaultsheet_recents: STORAGE_KEYS.RECENTS,
  vaultsheet_theme: STORAGE_KEYS.THEME,
  vaultsheet_setup_complete: STORAGE_KEYS.SETUP_COMPLETE
});
var ENTRY_TYPES = Object.freeze({
  PASSWORD: "password",
  TOTP: "totp"
});
var SHEET_NAMES = Object.freeze({
  VAULT: "OKeyVault",
  META: "OKeyMeta",
  SETTINGS: "OKeySettings",
  ORDER: "OKeyOrder",
  CONFLICTS: "OKeyConflicts"
});

// src/core/encoding.js
var B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var B64_LOOKUP = (() => {
  const t = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64_CHARS.length; i++) t[B64_CHARS.charCodeAt(i)] = i;
  t["=".charCodeAt(0)] = -2;
  return t;
})();
function bytesToBase64(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let out = "";
  let i = 0;
  const len = bytes.length;
  for (; i + 2 < len; i += 3) {
    const n = bytes[i] << 16 | bytes[i + 1] << 8 | bytes[i + 2];
    out += B64_CHARS[n >>> 18 & 63] + B64_CHARS[n >>> 12 & 63] + B64_CHARS[n >>> 6 & 63] + B64_CHARS[n & 63];
  }
  if (len - i === 1) {
    const n = bytes[i] << 16;
    out += B64_CHARS[n >>> 18 & 63] + B64_CHARS[n >>> 12 & 63] + "==";
  } else if (len - i === 2) {
    const n = bytes[i] << 16 | bytes[i + 1] << 8;
    out += B64_CHARS[n >>> 18 & 63] + B64_CHARS[n >>> 12 & 63] + B64_CHARS[n >>> 6 & 63] + "=";
  }
  return out;
}
function base64ToBytes(b64) {
  if (typeof b64 !== "string") throw new TypeError("base64ToBytes expects a string");
  const s = b64.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  let pad = 0;
  if (s.endsWith("==")) pad = 2;
  else if (s.endsWith("=")) pad = 1;
  const usable = s.length - pad;
  const outLen = Math.floor(usable * 6 / 8);
  const out = new Uint8Array(outLen);
  let bits = 0;
  let acc = 0;
  let o = 0;
  for (let i = 0; i < s.length; i++) {
    const v = B64_LOOKUP[s.charCodeAt(i)];
    if (v === -2) break;
    if (v === -1) throw new Error("Invalid Base64 character");
    acc = acc << 6 | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = acc >>> bits & 255;
    }
  }
  return out;
}
function utf8ToBytes(utf8) {
  return new TextEncoder().encode(utf8);
}
function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

// src/core/errors.js
var OKeyError = class extends Error {
  /** @param {string} message @param {string} code */
  constructor(message, code = "OKEY_ERROR") {
    super(message);
    this.name = "OKeyError";
    this.code = code;
  }
};
var DecryptionError = class extends OKeyError {
  constructor(message = "Decryption failed \u2014 wrong key or tampered data") {
    super(message, "DECRYPTION_FAILED");
    this.name = "DecryptionError";
  }
};
var VaultLockedError = class extends OKeyError {
  constructor(message = "Vault is locked") {
    super(message, "VAULT_LOCKED");
    this.name = "VaultLockedError";
  }
};
var FormatError = class extends OKeyError {
  constructor(message = "Unsupported or corrupt data format") {
    super(message, "FORMAT_ERROR");
    this.name = "FormatError";
  }
};
var ValidationError = class extends OKeyError {
  constructor(message = "Validation failed") {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
};
var SyncError = class extends OKeyError {
  constructor(message = "Sync failed", code = "SYNC_ERROR") {
    super(message, code);
    this.name = "SyncError";
  }
};

// src/core/crypto.js
var ENVELOPE_VERSION = 1;
var subtle = () => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new OKeyCryptoUnavailable();
  return c.subtle;
};
var OKeyCryptoUnavailable = class extends Error {
  constructor() {
    super("Web Crypto API (crypto.subtle) is unavailable in this context");
    this.name = "OKeyCryptoUnavailable";
  }
};
function randomBytes(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}
function generateSalt(len = CRYPTO.SALT_LENGTH) {
  return randomBytes(len);
}
function generateDek() {
  return randomBytes(CRYPTO.KEY_LENGTH / 8);
}
async function importAesKey(rawBytes, extractable = false) {
  if (!(rawBytes instanceof Uint8Array) || rawBytes.length !== CRYPTO.KEY_LENGTH / 8) {
    throw new FormatError(`AES key material must be ${CRYPTO.KEY_LENGTH / 8} bytes`);
  }
  return subtle().importKey("raw", rawBytes, { name: CRYPTO.ALGORITHM }, extractable, ["encrypt", "decrypt"]);
}
async function encryptBytes(plaintext, key) {
  const iv = randomBytes(CRYPTO.IV_LENGTH);
  const version2 = new Uint8Array([ENVELOPE_VERSION]);
  const ct = new Uint8Array(
    await subtle().encrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: version2 },
      key,
      plaintext
    )
  );
  const out = new Uint8Array(1 + iv.length + ct.length);
  out[0] = ENVELOPE_VERSION;
  out.set(iv, 1);
  out.set(ct, 1 + iv.length);
  return out;
}
async function decryptBytes(envelope, key) {
  if (!(envelope instanceof Uint8Array) || envelope.length < 1 + CRYPTO.IV_LENGTH + 16) {
    throw new FormatError("Ciphertext envelope too short");
  }
  const version2 = envelope[0];
  if (version2 !== ENVELOPE_VERSION) throw new FormatError(`Unsupported envelope version ${version2}`);
  const iv = envelope.subarray(1, 1 + CRYPTO.IV_LENGTH);
  const ct = envelope.subarray(1 + CRYPTO.IV_LENGTH);
  try {
    const pt = await subtle().decrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: new Uint8Array([version2]) },
      key,
      ct
    );
    return new Uint8Array(pt);
  } catch {
    throw new DecryptionError();
  }
}
async function encryptString(plaintext, key) {
  return bytesToBase64(await encryptBytes(utf8ToBytes(plaintext), key));
}
async function decryptString(b64, key) {
  return bytesToUtf8(await decryptBytes(base64ToBytes(b64), key));
}
async function encryptJson(value, key) {
  return encryptString(JSON.stringify(value), key);
}
async function decryptJson(b64, key) {
  return JSON.parse(await decryptString(b64, key));
}
async function wrapKeyMaterial(dekBytes, kekBytes) {
  const kek = await importAesKey(kekBytes, false);
  return bytesToBase64(await encryptBytes(dekBytes, kek));
}
async function unwrapKeyMaterial(wrappedB64, kekBytes) {
  const kek = await importAesKey(kekBytes, false);
  return decryptBytes(base64ToBytes(wrappedB64), kek);
}
async function hkdf(ikm, salt, info, lengthBytes = 32) {
  const base = await subtle().importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  const bits = await subtle().deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info: utf8ToBytes(info) },
    base,
    lengthBytes * 8
  );
  return new Uint8Array(bits);
}
function secureWipe(...buffers) {
  for (const buf of buffers) {
    if (buf instanceof Uint8Array && buf.length) {
      globalThis.crypto.getRandomValues(buf);
      buf.fill(0);
    }
  }
}

// node_modules/hash-wasm/dist/index.esm.js
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
var Mutex = class {
  constructor() {
    this.mutex = Promise.resolve();
  }
  lock() {
    let begin = () => {
    };
    this.mutex = this.mutex.then(() => new Promise(begin));
    return new Promise((res) => {
      begin = res;
    });
  }
  dispatch(fn) {
    return __awaiter(this, void 0, void 0, function* () {
      const unlock = yield this.lock();
      try {
        return yield Promise.resolve(fn());
      } finally {
        unlock();
      }
    });
  }
};
var _a;
function getGlobal() {
  if (typeof globalThis !== "undefined")
    return globalThis;
  if (typeof self !== "undefined")
    return self;
  if (typeof window !== "undefined")
    return window;
  return global;
}
var globalObject = getGlobal();
var nodeBuffer = (_a = globalObject.Buffer) !== null && _a !== void 0 ? _a : null;
var textEncoder = globalObject.TextEncoder ? new globalObject.TextEncoder() : null;
function hexCharCodesToInt(a, b) {
  return (a & 15) + (a >> 6 | a >> 3 & 8) << 4 | (b & 15) + (b >> 6 | b >> 3 & 8);
}
function writeHexToUInt8(buf, str) {
  const size = str.length >> 1;
  for (let i = 0; i < size; i++) {
    const index2 = i << 1;
    buf[i] = hexCharCodesToInt(str.charCodeAt(index2), str.charCodeAt(index2 + 1));
  }
}
function hexStringEqualsUInt8(str, buf) {
  if (str.length !== buf.length * 2) {
    return false;
  }
  for (let i = 0; i < buf.length; i++) {
    const strIndex = i << 1;
    if (buf[i] !== hexCharCodesToInt(str.charCodeAt(strIndex), str.charCodeAt(strIndex + 1))) {
      return false;
    }
  }
  return true;
}
var alpha = "a".charCodeAt(0) - 10;
var digit = "0".charCodeAt(0);
function getDigestHex(tmpBuffer, input, hashLength) {
  let p = 0;
  for (let i = 0; i < hashLength; i++) {
    let nibble = input[i] >>> 4;
    tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
    nibble = input[i] & 15;
    tmpBuffer[p++] = nibble > 9 ? nibble + alpha : nibble + digit;
  }
  return String.fromCharCode.apply(null, tmpBuffer);
}
var getUInt8Buffer = nodeBuffer !== null ? (data) => {
  if (typeof data === "string") {
    const buf = nodeBuffer.from(data, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  }
  if (nodeBuffer.isBuffer(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.length);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new Error("Invalid data type!");
} : (data) => {
  if (typeof data === "string") {
    return textEncoder.encode(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  throw new Error("Invalid data type!");
};
var base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var base64Lookup = new Uint8Array(256);
for (let i = 0; i < base64Chars.length; i++) {
  base64Lookup[base64Chars.charCodeAt(i)] = i;
}
function encodeBase64(data, pad = true) {
  const len = data.length;
  const extraBytes = len % 3;
  const parts = [];
  const len2 = len - extraBytes;
  for (let i = 0; i < len2; i += 3) {
    const tmp = (data[i] << 16 & 16711680) + (data[i + 1] << 8 & 65280) + (data[i + 2] & 255);
    const triplet = base64Chars.charAt(tmp >> 18 & 63) + base64Chars.charAt(tmp >> 12 & 63) + base64Chars.charAt(tmp >> 6 & 63) + base64Chars.charAt(tmp & 63);
    parts.push(triplet);
  }
  if (extraBytes === 1) {
    const tmp = data[len - 1];
    const a = base64Chars.charAt(tmp >> 2);
    const b = base64Chars.charAt(tmp << 4 & 63);
    parts.push(`${a}${b}`);
    if (pad) {
      parts.push("==");
    }
  } else if (extraBytes === 2) {
    const tmp = (data[len - 2] << 8) + data[len - 1];
    const a = base64Chars.charAt(tmp >> 10);
    const b = base64Chars.charAt(tmp >> 4 & 63);
    const c = base64Chars.charAt(tmp << 2 & 63);
    parts.push(`${a}${b}${c}`);
    if (pad) {
      parts.push("=");
    }
  }
  return parts.join("");
}
function getDecodeBase64Length(data) {
  let bufferLength = Math.floor(data.length * 0.75);
  const len = data.length;
  if (data[len - 1] === "=") {
    bufferLength -= 1;
    if (data[len - 2] === "=") {
      bufferLength -= 1;
    }
  }
  return bufferLength;
}
function decodeBase64(data) {
  const bufferLength = getDecodeBase64Length(data);
  const len = data.length;
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = base64Lookup[data.charCodeAt(i)];
    const encoded2 = base64Lookup[data.charCodeAt(i + 1)];
    const encoded3 = base64Lookup[data.charCodeAt(i + 2)];
    const encoded4 = base64Lookup[data.charCodeAt(i + 3)];
    bytes[p] = encoded1 << 2 | encoded2 >> 4;
    p += 1;
    bytes[p] = (encoded2 & 15) << 4 | encoded3 >> 2;
    p += 1;
    bytes[p] = (encoded3 & 3) << 6 | encoded4 & 63;
    p += 1;
  }
  return bytes;
}
var MAX_HEAP = 16 * 1024;
var WASM_FUNC_HASH_LENGTH = 4;
var wasmMutex = new Mutex();
var wasmModuleCache = /* @__PURE__ */ new Map();
function WASMInterface(binary, hashLength) {
  return __awaiter(this, void 0, void 0, function* () {
    let wasmInstance = null;
    let memoryView = null;
    let initialized = false;
    if (typeof WebAssembly === "undefined") {
      throw new Error("WebAssembly is not supported in this environment!");
    }
    const writeMemory = (data, offset = 0) => {
      memoryView.set(data, offset);
    };
    const getMemory = () => memoryView;
    const getExports = () => wasmInstance.exports;
    const setMemorySize = (totalSize) => {
      wasmInstance.exports.Hash_SetMemorySize(totalSize);
      const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
      const memoryBuffer = wasmInstance.exports.memory.buffer;
      memoryView = new Uint8Array(memoryBuffer, arrayOffset, totalSize);
    };
    const getStateSize = () => {
      const view2 = new DataView(wasmInstance.exports.memory.buffer);
      const stateSize = view2.getUint32(wasmInstance.exports.STATE_SIZE, true);
      return stateSize;
    };
    const loadWASMPromise = wasmMutex.dispatch(() => __awaiter(this, void 0, void 0, function* () {
      if (!wasmModuleCache.has(binary.name)) {
        const asm = decodeBase64(binary.data);
        const promise = WebAssembly.compile(asm);
        wasmModuleCache.set(binary.name, promise);
      }
      const module = yield wasmModuleCache.get(binary.name);
      wasmInstance = yield WebAssembly.instantiate(module, {
        // env: {
        //   emscripten_memcpy_big: (dest, src, num) => {
        //     const memoryBuffer = wasmInstance.exports.memory.buffer;
        //     const memView = new Uint8Array(memoryBuffer, 0);
        //     memView.set(memView.subarray(src, src + num), dest);
        //   },
        //   print_memory: (offset, len) => {
        //     const memoryBuffer = wasmInstance.exports.memory.buffer;
        //     const memView = new Uint8Array(memoryBuffer, 0);
        //     console.log('print_int32', memView.subarray(offset, offset + len));
        //   },
        // },
      });
    }));
    const setupInterface = () => __awaiter(this, void 0, void 0, function* () {
      if (!wasmInstance) {
        yield loadWASMPromise;
      }
      const arrayOffset = wasmInstance.exports.Hash_GetBuffer();
      const memoryBuffer = wasmInstance.exports.memory.buffer;
      memoryView = new Uint8Array(memoryBuffer, arrayOffset, MAX_HEAP);
    });
    const init = (bits = null) => {
      initialized = true;
      wasmInstance.exports.Hash_Init(bits);
    };
    const updateUInt8Array = (data) => {
      let read = 0;
      while (read < data.length) {
        const chunk = data.subarray(read, read + MAX_HEAP);
        read += chunk.length;
        memoryView.set(chunk);
        wasmInstance.exports.Hash_Update(chunk.length);
      }
    };
    const update = (data) => {
      if (!initialized) {
        throw new Error("update() called before init()");
      }
      const Uint8Buffer = getUInt8Buffer(data);
      updateUInt8Array(Uint8Buffer);
    };
    const digestChars = new Uint8Array(hashLength * 2);
    const digest = (outputType, padding2 = null) => {
      if (!initialized) {
        throw new Error("digest() called before init()");
      }
      initialized = false;
      wasmInstance.exports.Hash_Final(padding2);
      if (outputType === "binary") {
        return memoryView.slice(0, hashLength);
      }
      return getDigestHex(digestChars, memoryView, hashLength);
    };
    const save = () => {
      if (!initialized) {
        throw new Error("save() can only be called after init() and before digest()");
      }
      const stateOffset = wasmInstance.exports.Hash_GetState();
      const stateLength = getStateSize();
      const memoryBuffer = wasmInstance.exports.memory.buffer;
      const internalState = new Uint8Array(memoryBuffer, stateOffset, stateLength);
      const prefixedState = new Uint8Array(WASM_FUNC_HASH_LENGTH + stateLength);
      writeHexToUInt8(prefixedState, binary.hash);
      prefixedState.set(internalState, WASM_FUNC_HASH_LENGTH);
      return prefixedState;
    };
    const load = (state) => {
      if (!(state instanceof Uint8Array)) {
        throw new Error("load() expects an Uint8Array generated by save()");
      }
      const stateOffset = wasmInstance.exports.Hash_GetState();
      const stateLength = getStateSize();
      const overallLength = WASM_FUNC_HASH_LENGTH + stateLength;
      const memoryBuffer = wasmInstance.exports.memory.buffer;
      if (state.length !== overallLength) {
        throw new Error(`Bad state length (expected ${overallLength} bytes, got ${state.length})`);
      }
      if (!hexStringEqualsUInt8(binary.hash, state.subarray(0, WASM_FUNC_HASH_LENGTH))) {
        throw new Error("This state was written by an incompatible hash implementation");
      }
      const internalState = state.subarray(WASM_FUNC_HASH_LENGTH);
      new Uint8Array(memoryBuffer, stateOffset, stateLength).set(internalState);
      initialized = true;
    };
    const isDataShort = (data) => {
      if (typeof data === "string") {
        return data.length < MAX_HEAP / 4;
      }
      return data.byteLength < MAX_HEAP;
    };
    let canSimplify = isDataShort;
    switch (binary.name) {
      case "argon2":
      case "scrypt":
        canSimplify = () => true;
        break;
      case "blake2b":
      case "blake2s":
        canSimplify = (data, initParam) => initParam <= 512 && isDataShort(data);
        break;
      case "blake3":
        canSimplify = (data, initParam) => initParam === 0 && isDataShort(data);
        break;
      case "xxhash64":
      // cannot simplify
      case "xxhash3":
      case "xxhash128":
      case "crc64":
        canSimplify = () => false;
        break;
    }
    const calculate = (data, initParam = null, digestParam = null) => {
      if (!canSimplify(data, initParam)) {
        init(initParam);
        update(data);
        return digest("hex", digestParam);
      }
      const buffer = getUInt8Buffer(data);
      memoryView.set(buffer);
      wasmInstance.exports.Hash_Calculate(buffer.length, initParam, digestParam);
      return getDigestHex(digestChars, memoryView, hashLength);
    };
    yield setupInterface();
    return {
      getMemory,
      writeMemory,
      getExports,
      setMemorySize,
      init,
      update,
      digest,
      save,
      load,
      calculate,
      hashLength
    };
  });
}
var mutex$l = new Mutex();
var name$k = "argon2";
var data$k = "AGFzbQEAAAABKQVgAX8Bf2AAAX9gEH9/f39/f39/f39/f39/f38AYAR/f39/AGACf38AAwYFAAECAwQFBgEBAoCAAgYIAX8BQZCoBAsHQQQGbWVtb3J5AgASSGFzaF9TZXRNZW1vcnlTaXplAAAOSGFzaF9HZXRCdWZmZXIAAQ5IYXNoX0NhbGN1bGF0ZQAECvEyBVgBAn9BACEBAkAgAEEAKAKICCICRg0AAkAgACACayIAQRB2IABBgIB8cSAASWoiAEAAQX9HDQBB/wHADwtBACEBQQBBACkDiAggAEEQdK18NwOICAsgAcALcAECfwJAQQAoAoAIIgANAEEAPwBBEHQiADYCgAhBACgCiAgiAUGAgCBGDQACQEGAgCAgAWsiAEEQdiAAQYCAfHEgAElqIgBAAEF/Rw0AQQAPC0EAQQApA4gIIABBEHStfDcDiAhBACgCgAghAAsgAAvcDgECfiAAIAQpAwAiECAAKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAMIBAgDCkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgBCAQIAQpAwCFQiiJIhA3AwAgACAQIAApAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAwgECAMKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAEIBAgBCkDAIVCAYk3AwAgASAFKQMAIhAgASkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDSAQIA0pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAEgECABKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACANIBAgDSkDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAIgBikDACIQIAIpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIA4gECAOKQMAhUIgiSIQNwMAIAogECAKKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACACIBAgAikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDiAQIA4pAwCFQjCJIhA3AwAgCiAQIAopAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACADIAcpAwAiECADKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAPIBAgDykDAIVCIIkiEDcDACALIBAgCykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAyAQIAMpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA8gECAPKQMAhUIwiSIQNwMAIAsgECALKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgACAFKQMAIhAgACkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDyAQIA8pAwCFQiCJIhA3AwAgCiAQIAopAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAAgECAAKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAPIBAgDykDAIVCMIkiEDcDACAKIBAgCikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAEgBikDACIQIAEpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAwgECAMKQMAhUIgiSIQNwMAIAsgECALKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACABIBAgASkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDCAQIAwpAwCFQjCJIhA3AwAgCyAQIAspAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACACIAcpAwAiECACKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACANIBAgDSkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAiAQIAIpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA0gECANKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgAyAEKQMAIhAgAykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDiAQIA4pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAQgECAEKQMAhUIoiSIQNwMAIAMgECADKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAOIBAgDikDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBCAQIAQpAwCFQgGJNwMAC98aAQN/QQAhBEEAIAIpAwAgASkDAIU3A5AIQQAgAikDCCABKQMIhTcDmAhBACACKQMQIAEpAxCFNwOgCEEAIAIpAxggASkDGIU3A6gIQQAgAikDICABKQMghTcDsAhBACACKQMoIAEpAyiFNwO4CEEAIAIpAzAgASkDMIU3A8AIQQAgAikDOCABKQM4hTcDyAhBACACKQNAIAEpA0CFNwPQCEEAIAIpA0ggASkDSIU3A9gIQQAgAikDUCABKQNQhTcD4AhBACACKQNYIAEpA1iFNwPoCEEAIAIpA2AgASkDYIU3A/AIQQAgAikDaCABKQNohTcD+AhBACACKQNwIAEpA3CFNwOACUEAIAIpA3ggASkDeIU3A4gJQQAgAikDgAEgASkDgAGFNwOQCUEAIAIpA4gBIAEpA4gBhTcDmAlBACACKQOQASABKQOQAYU3A6AJQQAgAikDmAEgASkDmAGFNwOoCUEAIAIpA6ABIAEpA6ABhTcDsAlBACACKQOoASABKQOoAYU3A7gJQQAgAikDsAEgASkDsAGFNwPACUEAIAIpA7gBIAEpA7gBhTcDyAlBACACKQPAASABKQPAAYU3A9AJQQAgAikDyAEgASkDyAGFNwPYCUEAIAIpA9ABIAEpA9ABhTcD4AlBACACKQPYASABKQPYAYU3A+gJQQAgAikD4AEgASkD4AGFNwPwCUEAIAIpA+gBIAEpA+gBhTcD+AlBACACKQPwASABKQPwAYU3A4AKQQAgAikD+AEgASkD+AGFNwOICkEAIAIpA4ACIAEpA4AChTcDkApBACACKQOIAiABKQOIAoU3A5gKQQAgAikDkAIgASkDkAKFNwOgCkEAIAIpA5gCIAEpA5gChTcDqApBACACKQOgAiABKQOgAoU3A7AKQQAgAikDqAIgASkDqAKFNwO4CkEAIAIpA7ACIAEpA7AChTcDwApBACACKQO4AiABKQO4AoU3A8gKQQAgAikDwAIgASkDwAKFNwPQCkEAIAIpA8gCIAEpA8gChTcD2ApBACACKQPQAiABKQPQAoU3A+AKQQAgAikD2AIgASkD2AKFNwPoCkEAIAIpA+ACIAEpA+AChTcD8ApBACACKQPoAiABKQPoAoU3A/gKQQAgAikD8AIgASkD8AKFNwOAC0EAIAIpA/gCIAEpA/gChTcDiAtBACACKQOAAyABKQOAA4U3A5ALQQAgAikDiAMgASkDiAOFNwOYC0EAIAIpA5ADIAEpA5ADhTcDoAtBACACKQOYAyABKQOYA4U3A6gLQQAgAikDoAMgASkDoAOFNwOwC0EAIAIpA6gDIAEpA6gDhTcDuAtBACACKQOwAyABKQOwA4U3A8ALQQAgAikDuAMgASkDuAOFNwPIC0EAIAIpA8ADIAEpA8ADhTcD0AtBACACKQPIAyABKQPIA4U3A9gLQQAgAikD0AMgASkD0AOFNwPgC0EAIAIpA9gDIAEpA9gDhTcD6AtBACACKQPgAyABKQPgA4U3A/ALQQAgAikD6AMgASkD6AOFNwP4C0EAIAIpA/ADIAEpA/ADhTcDgAxBACACKQP4AyABKQP4A4U3A4gMQQAgAikDgAQgASkDgASFNwOQDEEAIAIpA4gEIAEpA4gEhTcDmAxBACACKQOQBCABKQOQBIU3A6AMQQAgAikDmAQgASkDmASFNwOoDEEAIAIpA6AEIAEpA6AEhTcDsAxBACACKQOoBCABKQOoBIU3A7gMQQAgAikDsAQgASkDsASFNwPADEEAIAIpA7gEIAEpA7gEhTcDyAxBACACKQPABCABKQPABIU3A9AMQQAgAikDyAQgASkDyASFNwPYDEEAIAIpA9AEIAEpA9AEhTcD4AxBACACKQPYBCABKQPYBIU3A+gMQQAgAikD4AQgASkD4ASFNwPwDEEAIAIpA+gEIAEpA+gEhTcD+AxBACACKQPwBCABKQPwBIU3A4ANQQAgAikD+AQgASkD+ASFNwOIDUEAIAIpA4AFIAEpA4AFhTcDkA1BACACKQOIBSABKQOIBYU3A5gNQQAgAikDkAUgASkDkAWFNwOgDUEAIAIpA5gFIAEpA5gFhTcDqA1BACACKQOgBSABKQOgBYU3A7ANQQAgAikDqAUgASkDqAWFNwO4DUEAIAIpA7AFIAEpA7AFhTcDwA1BACACKQO4BSABKQO4BYU3A8gNQQAgAikDwAUgASkDwAWFNwPQDUEAIAIpA8gFIAEpA8gFhTcD2A1BACACKQPQBSABKQPQBYU3A+ANQQAgAikD2AUgASkD2AWFNwPoDUEAIAIpA+AFIAEpA+AFhTcD8A1BACACKQPoBSABKQPoBYU3A/gNQQAgAikD8AUgASkD8AWFNwOADkEAIAIpA/gFIAEpA/gFhTcDiA5BACACKQOABiABKQOABoU3A5AOQQAgAikDiAYgASkDiAaFNwOYDkEAIAIpA5AGIAEpA5AGhTcDoA5BACACKQOYBiABKQOYBoU3A6gOQQAgAikDoAYgASkDoAaFNwOwDkEAIAIpA6gGIAEpA6gGhTcDuA5BACACKQOwBiABKQOwBoU3A8AOQQAgAikDuAYgASkDuAaFNwPIDkEAIAIpA8AGIAEpA8AGhTcD0A5BACACKQPIBiABKQPIBoU3A9gOQQAgAikD0AYgASkD0AaFNwPgDkEAIAIpA9gGIAEpA9gGhTcD6A5BACACKQPgBiABKQPgBoU3A/AOQQAgAikD6AYgASkD6AaFNwP4DkEAIAIpA/AGIAEpA/AGhTcDgA9BACACKQP4BiABKQP4BoU3A4gPQQAgAikDgAcgASkDgAeFNwOQD0EAIAIpA4gHIAEpA4gHhTcDmA9BACACKQOQByABKQOQB4U3A6APQQAgAikDmAcgASkDmAeFNwOoD0EAIAIpA6AHIAEpA6AHhTcDsA9BACACKQOoByABKQOoB4U3A7gPQQAgAikDsAcgASkDsAeFNwPAD0EAIAIpA7gHIAEpA7gHhTcDyA9BACACKQPAByABKQPAB4U3A9APQQAgAikDyAcgASkDyAeFNwPYD0EAIAIpA9AHIAEpA9AHhTcD4A9BACACKQPYByABKQPYB4U3A+gPQQAgAikD4AcgASkD4AeFNwPwD0EAIAIpA+gHIAEpA+gHhTcD+A9BACACKQPwByABKQPwB4U3A4AQQQAgAikD+AcgASkD+AeFNwOIEEGQCEGYCEGgCEGoCEGwCEG4CEHACEHICEHQCEHYCEHgCEHoCEHwCEH4CEGACUGICRACQZAJQZgJQaAJQagJQbAJQbgJQcAJQcgJQdAJQdgJQeAJQegJQfAJQfgJQYAKQYgKEAJBkApBmApBoApBqApBsApBuApBwApByApB0ApB2ApB4ApB6ApB8ApB+ApBgAtBiAsQAkGQC0GYC0GgC0GoC0GwC0G4C0HAC0HIC0HQC0HYC0HgC0HoC0HwC0H4C0GADEGIDBACQZAMQZgMQaAMQagMQbAMQbgMQcAMQcgMQdAMQdgMQeAMQegMQfAMQfgMQYANQYgNEAJBkA1BmA1BoA1BqA1BsA1BuA1BwA1ByA1B0A1B2A1B4A1B6A1B8A1B+A1BgA5BiA4QAkGQDkGYDkGgDkGoDkGwDkG4DkHADkHIDkHQDkHYDkHgDkHoDkHwDkH4DkGAD0GIDxACQZAPQZgPQaAPQagPQbAPQbgPQcAPQcgPQdAPQdgPQeAPQegPQfAPQfgPQYAQQYgQEAJBkAhBmAhBkAlBmAlBkApBmApBkAtBmAtBkAxBmAxBkA1BmA1BkA5BmA5BkA9BmA8QAkGgCEGoCEGgCUGoCUGgCkGoCkGgC0GoC0GgDEGoDEGgDUGoDUGgDkGoDkGgD0GoDxACQbAIQbgIQbAJQbgJQbAKQbgKQbALQbgLQbAMQbgMQbANQbgNQbAOQbgOQbAPQbgPEAJBwAhByAhBwAlByAlBwApByApBwAtByAtBwAxByAxBwA1ByA1BwA5ByA5BwA9ByA8QAkHQCEHYCEHQCUHYCUHQCkHYCkHQC0HYC0HQDEHYDEHQDUHYDUHQDkHYDkHQD0HYDxACQeAIQegIQeAJQegJQeAKQegKQeALQegLQeAMQegMQeANQegNQeAOQegOQeAPQegPEAJB8AhB+AhB8AlB+AlB8ApB+ApB8AtB+AtB8AxB+AxB8A1B+A1B8A5B+A5B8A9B+A8QAkGACUGICUGACkGICkGAC0GIC0GADEGIDEGADUGIDUGADkGIDkGAD0GID0GAEEGIEBACAkACQCADRQ0AA0AgACAEaiIDIAIgBGoiBSkDACABIARqIgYpAwCFIARBkAhqKQMAhSADKQMAhTcDACADQQhqIgMgBUEIaikDACAGQQhqKQMAhSAEQZgIaikDAIUgAykDAIU3AwAgBEEQaiIEQYAIRw0ADAILC0EAIQQDQCAAIARqIgMgAiAEaiIFKQMAIAEgBGoiBikDAIUgBEGQCGopAwCFNwMAIANBCGogBUEIaikDACAGQQhqKQMAhSAEQZgIaikDAIU3AwAgBEEQaiIEQYAIRw0ACwsL5QcMBX8BfgR/An4BfwF+AX8Bfgd/AX4DfwF+AkBBACgCgAgiAiABQQp0aiIDKAIIIAFHDQAgAygCDCEEIAMoAgAhBUEAIAMoAhQiBq03A7gQQQAgBK0iBzcDsBBBACAFIAEgBUECdG4iCGwiCUECdK03A6gQAkACQAJAAkAgBEUNAEF/IQogBUUNASAIQQNsIQsgCEECdCIErSEMIAWtIQ0gBkF/akECSSEOQgAhDwNAQQAgDzcDkBAgD6chEEIAIRFBACEBA0BBACARNwOgECAPIBGEUCIDIA5xIRIgBkEBRiAPUCITIAZBAkYgEUICVHFxciEUQX8gAUEBakEDcSAIbEF/aiATGyEVIAEgEHIhFiABIAhsIRcgA0EBdCEYQgAhGQNAQQBCADcDwBBBACAZNwOYECAYIQECQCASRQ0AQQBCATcDwBBBkBhBkBBBkCBBABADQZAYQZAYQZAgQQAQA0ECIQELAkAgASAITw0AIAQgGaciGmwgF2ogAWohAwNAIANBACAEIAEbQQAgEVAiGxtqQX9qIRwCQAJAIBQNAEEAKAKACCICIBxBCnQiHGohCgwBCwJAIAFB/wBxIgINAEEAQQApA8AQQgF8NwPAEEGQGEGQEEGQIEEAEANBkBhBkBhBkCBBABADCyAcQQp0IRwgAkEDdEGQGGohCkEAKAKACCECCyACIANBCnRqIAIgHGogAiAKKQMAIh1CIIinIAVwIBogFhsiHCAEbCABIAFBACAZIBytUSIcGyIKIBsbIBdqIAogC2ogExsgAUUgHHJrIhsgFWqtIB1C/////w+DIh0gHX5CIIggG61+QiCIfSAMgqdqQQp0akEBEAMgA0EBaiEDIAggAUEBaiIBRw0ACwsgGUIBfCIZIA1SDQALIBFCAXwiEachASARQgRSDQALIA9CAXwiDyAHUg0AC0EAKAKACCECCyAJQQx0QYB4aiEXIAVBf2oiCkUNAgwBC0EAQgM3A6AQQQAgBEF/aq03A5AQQYB4IRcLIAIgF2ohGyAIQQx0IQhBACEcA0AgCCAcQQFqIhxsQYB4aiEEQQAhAQNAIBsgAWoiAyADKQMAIAIgBCABamopAwCFNwMAIANBCGoiAyADKQMAIAIgBCABQQhyamopAwCFNwMAIAFBCGohAyABQRBqIQEgA0H4B0kNAAsgHCAKRw0ACwsgAiAXaiEbQXghAQNAIAIgAWoiA0EIaiAbIAFqIgRBCGopAwA3AwAgA0EQaiAEQRBqKQMANwMAIANBGGogBEEYaikDADcDACADQSBqIARBIGopAwA3AwAgAUEgaiIBQfgHSQ0ACwsL";
var hash$k = "e4cdc523";
var wasmJson$k = {
  name: name$k,
  data: data$k,
  hash: hash$k
};
var name$j = "blake2b";
var data$j = "AGFzbQEAAAABEQRgAAF/YAJ/fwBgAX8AYAAAAwoJAAECAwECAgABBQQBAQICBg4CfwFBsIsFC38AQYAICwdwCAZtZW1vcnkCAA5IYXNoX0dldEJ1ZmZlcgAACkhhc2hfRmluYWwAAwlIYXNoX0luaXQABQtIYXNoX1VwZGF0ZQAGDUhhc2hfR2V0U3RhdGUABw5IYXNoX0NhbGN1bGF0ZQAIClNUQVRFX1NJWkUDAQrTOAkFAEGACQvrAgIFfwF+AkAgAUEBSA0AAkACQAJAIAFBgAFBACgC4IoBIgJrIgNKDQAgASEEDAELQQBBADYC4IoBAkAgAkH/AEoNACACQeCJAWohBSAAIQRBACEGA0AgBSAELQAAOgAAIARBAWohBCAFQQFqIQUgAyAGQQFqIgZB/wFxSg0ACwtBAEEAKQPAiQEiB0KAAXw3A8CJAUEAQQApA8iJASAHQv9+Vq18NwPIiQFB4IkBEAIgACADaiEAAkAgASADayIEQYEBSA0AIAIgAWohBQNAQQBBACkDwIkBIgdCgAF8NwPAiQFBAEEAKQPIiQEgB0L/flatfDcDyIkBIAAQAiAAQYABaiEAIAVBgH9qIgVBgAJLDQALIAVBgH9qIQQMAQsgBEEATA0BC0EAIQUDQCAFQQAoAuCKAWpB4IkBaiAAIAVqLQAAOgAAIAQgBUEBaiIFQf8BcUoNAAsLQQBBACgC4IoBIARqNgLgigELC78uASR+QQBBACkD0IkBQQApA7CJASIBQQApA5CJAXwgACkDICICfCIDhULr+obav7X2wR+FQiCJIgRCq/DT9K/uvLc8fCIFIAGFQiiJIgYgA3wgACkDKCIBfCIHIASFQjCJIgggBXwiCSAGhUIBiSIKQQApA8iJAUEAKQOoiQEiBEEAKQOIiQF8IAApAxAiA3wiBYVCn9j52cKR2oKbf4VCIIkiC0K7zqqm2NDrs7t/fCIMIASFQiiJIg0gBXwgACkDGCIEfCIOfCAAKQNQIgV8Ig9BACkDwIkBQQApA6CJASIQQQApA4CJASIRfCAAKQMAIgZ8IhKFQtGFmu/6z5SH0QCFQiCJIhNCiJLznf/M+YTqAHwiFCAQhUIoiSIVIBJ8IAApAwgiEHwiFiAThUIwiSIXhUIgiSIYQQApA9iJAUEAKQO4iQEiE0EAKQOYiQF8IAApAzAiEnwiGYVC+cL4m5Gjs/DbAIVCIIkiGkLx7fT4paf9p6V/fCIbIBOFQiiJIhwgGXwgACkDOCITfCIZIBqFQjCJIhogG3wiG3wiHSAKhUIoiSIeIA98IAApA1giCnwiDyAYhUIwiSIYIB18Ih0gDiALhUIwiSIOIAx8Ih8gDYVCAYkiDCAWfCAAKQNAIgt8Ig0gGoVCIIkiFiAJfCIaIAyFQiiJIiAgDXwgACkDSCIJfCIhIBaFQjCJIhYgGyAchUIBiSIMIAd8IAApA2AiB3wiDSAOhUIgiSIOIBcgFHwiFHwiFyAMhUIoiSIbIA18IAApA2giDHwiHCAOhUIwiSIOIBd8IhcgG4VCAYkiGyAZIBQgFYVCAYkiFHwgACkDcCINfCIVIAiFQiCJIhkgH3wiHyAUhUIoiSIUIBV8IAApA3giCHwiFXwgDHwiIoVCIIkiI3wiJCAbhUIoiSIbICJ8IBJ8IiIgFyAYIBUgGYVCMIkiFSAffCIZIBSFQgGJIhQgIXwgDXwiH4VCIIkiGHwiFyAUhUIoiSIUIB98IAV8Ih8gGIVCMIkiGCAXfCIXIBSFQgGJIhR8IAF8IiEgFiAafCIWIBUgHSAehUIBiSIaIBx8IAl8IhyFQiCJIhV8Ih0gGoVCKIkiGiAcfCAIfCIcIBWFQjCJIhWFQiCJIh4gGSAOIBYgIIVCAYkiFiAPfCACfCIPhUIgiSIOfCIZIBaFQiiJIhYgD3wgC3wiDyAOhUIwiSIOIBl8Ihl8IiAgFIVCKIkiFCAhfCAEfCIhIB6FQjCJIh4gIHwiICAiICOFQjCJIiIgJHwiIyAbhUIBiSIbIBx8IAp8IhwgDoVCIIkiDiAXfCIXIBuFQiiJIhsgHHwgE3wiHCAOhUIwiSIOIBkgFoVCAYkiFiAffCAQfCIZICKFQiCJIh8gFSAdfCIVfCIdIBaFQiiJIhYgGXwgB3wiGSAfhUIwiSIfIB18Ih0gFoVCAYkiFiAVIBqFQgGJIhUgD3wgBnwiDyAYhUIgiSIYICN8IhogFYVCKIkiFSAPfCADfCIPfCAHfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgBnwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAOIBd8Ig4gDyAYhUIwiSIPICAgFIVCAYkiFCAZfCAKfCIXhUIgiSIYfCIZIBSFQiiJIhQgF3wgC3wiF3wgBXwiICAPIBp8Ig8gHyAOIBuFQgGJIg4gIXwgCHwiGoVCIIkiG3wiHyAOhUIoiSIOIBp8IAx8IhogG4VCMIkiG4VCIIkiISAdIB4gDyAVhUIBiSIPIBx8IAF8IhWFQiCJIhx8Ih0gD4VCKIkiDyAVfCADfCIVIByFQjCJIhwgHXwiHXwiHiAWhUIoiSIWICB8IA18IiAgIYVCMIkiISAefCIeIBogFyAYhUIwiSIXIBl8IhggFIVCAYkiFHwgCXwiGSAchUIgiSIaICR8IhwgFIVCKIkiFCAZfCACfCIZIBqFQjCJIhogHSAPhUIBiSIPICJ8IAR8Ih0gF4VCIIkiFyAbIB98Iht8Ih8gD4VCKIkiDyAdfCASfCIdIBeFQjCJIhcgH3wiHyAPhUIBiSIPIBsgDoVCAYkiDiAVfCATfCIVICOFQiCJIhsgGHwiGCAOhUIoiSIOIBV8IBB8IhV8IAx8IiKFQiCJIiN8IiQgD4VCKIkiDyAifCAHfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBogHHwiGiAVIBuFQjCJIhUgHiAWhUIBiSIWIB18IAR8IhuFQiCJIhx8Ih0gFoVCKIkiFiAbfCAQfCIbfCABfCIeIBUgGHwiFSAXIBogFIVCAYkiFCAgfCATfCIYhUIgiSIXfCIaIBSFQiiJIhQgGHwgCXwiGCAXhUIwiSIXhUIgiSIgIB8gISAVIA6FQgGJIg4gGXwgCnwiFYVCIIkiGXwiHyAOhUIoiSIOIBV8IA18IhUgGYVCMIkiGSAffCIffCIhIA+FQiiJIg8gHnwgBXwiHiAghUIwiSIgICF8IiEgGyAchUIwiSIbIB18IhwgFoVCAYkiFiAYfCADfCIYIBmFQiCJIhkgJHwiHSAWhUIoiSIWIBh8IBJ8IhggGYVCMIkiGSAfIA6FQgGJIg4gInwgAnwiHyAbhUIgiSIbIBcgGnwiF3wiGiAOhUIoiSIOIB98IAZ8Ih8gG4VCMIkiGyAafCIaIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAh8IhUgI4VCIIkiFyAcfCIcIBSFQiiJIhQgFXwgC3wiFXwgBXwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IAh8IiIgGiAgIBUgF4VCMIkiFSAcfCIXIBSFQgGJIhQgGHwgCXwiGIVCIIkiHHwiGiAUhUIoiSIUIBh8IAZ8IhggHIVCMIkiHCAafCIaIBSFQgGJIhR8IAR8IiAgGSAdfCIZIBUgISAPhUIBiSIPIB98IAN8Ih2FQiCJIhV8Ih8gD4VCKIkiDyAdfCACfCIdIBWFQjCJIhWFQiCJIiEgFyAbIBkgFoVCAYkiFiAefCABfCIZhUIgiSIbfCIXIBaFQiiJIhYgGXwgE3wiGSAbhUIwiSIbIBd8Ihd8Ih4gFIVCKIkiFCAgfCAMfCIgICGFQjCJIiEgHnwiHiAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIB18IBJ8Ih0gG4VCIIkiGyAafCIaIA6FQiiJIg4gHXwgC3wiHSAbhUIwiSIbIBcgFoVCAYkiFiAYfCANfCIXICKFQiCJIhggFSAffCIVfCIfIBaFQiiJIhYgF3wgEHwiFyAYhUIwiSIYIB98Ih8gFoVCAYkiFiAVIA+FQgGJIg8gGXwgCnwiFSAchUIgiSIZICN8IhwgD4VCKIkiDyAVfCAHfCIVfCASfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgBXwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAbIBp8IhogFSAZhUIwiSIVIB4gFIVCAYkiFCAXfCADfCIXhUIgiSIZfCIbIBSFQiiJIhQgF3wgB3wiF3wgAnwiHiAVIBx8IhUgGCAaIA6FQgGJIg4gIHwgC3wiGoVCIIkiGHwiHCAOhUIoiSIOIBp8IAR8IhogGIVCMIkiGIVCIIkiICAfICEgFSAPhUIBiSIPIB18IAZ8IhWFQiCJIh18Ih8gD4VCKIkiDyAVfCAKfCIVIB2FQjCJIh0gH3wiH3wiISAWhUIoiSIWIB58IAx8Ih4gIIVCMIkiICAhfCIhIBogFyAZhUIwiSIXIBt8IhkgFIVCAYkiFHwgEHwiGiAdhUIgiSIbICR8Ih0gFIVCKIkiFCAafCAJfCIaIBuFQjCJIhsgHyAPhUIBiSIPICJ8IBN8Ih8gF4VCIIkiFyAYIBx8Ihh8IhwgD4VCKIkiDyAffCABfCIfIBeFQjCJIhcgHHwiHCAPhUIBiSIPIBggDoVCAYkiDiAVfCAIfCIVICOFQiCJIhggGXwiGSAOhUIoiSIOIBV8IA18IhV8IA18IiKFQiCJIiN8IiQgD4VCKIkiDyAifCAMfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBsgHXwiGyAVIBiFQjCJIhUgISAWhUIBiSIWIB98IBB8IhiFQiCJIh18Ih8gFoVCKIkiFiAYfCAIfCIYfCASfCIhIBUgGXwiFSAXIBsgFIVCAYkiFCAefCAHfCIZhUIgiSIXfCIbIBSFQiiJIhQgGXwgAXwiGSAXhUIwiSIXhUIgiSIeIBwgICAVIA6FQgGJIg4gGnwgAnwiFYVCIIkiGnwiHCAOhUIoiSIOIBV8IAV8IhUgGoVCMIkiGiAcfCIcfCIgIA+FQiiJIg8gIXwgBHwiISAehUIwiSIeICB8IiAgGCAdhUIwiSIYIB98Ih0gFoVCAYkiFiAZfCAGfCIZIBqFQiCJIhogJHwiHyAWhUIoiSIWIBl8IBN8IhkgGoVCMIkiGiAcIA6FQgGJIg4gInwgCXwiHCAYhUIgiSIYIBcgG3wiF3wiGyAOhUIoiSIOIBx8IAN8IhwgGIVCMIkiGCAbfCIbIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAt8IhUgI4VCIIkiFyAdfCIdIBSFQiiJIhQgFXwgCnwiFXwgBHwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IAl8IiIgGyAeIBUgF4VCMIkiFSAdfCIXIBSFQgGJIhQgGXwgDHwiGYVCIIkiHXwiGyAUhUIoiSIUIBl8IAp8IhkgHYVCMIkiHSAbfCIbIBSFQgGJIhR8IAN8Ih4gGiAffCIaIBUgICAPhUIBiSIPIBx8IAd8IhyFQiCJIhV8Ih8gD4VCKIkiDyAcfCAQfCIcIBWFQjCJIhWFQiCJIiAgFyAYIBogFoVCAYkiFiAhfCATfCIahUIgiSIYfCIXIBaFQiiJIhYgGnwgDXwiGiAYhUIwiSIYIBd8Ihd8IiEgFIVCKIkiFCAefCAFfCIeICCFQjCJIiAgIXwiISAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIBx8IAt8IhwgGIVCIIkiGCAbfCIbIA6FQiiJIg4gHHwgEnwiHCAYhUIwiSIYIBcgFoVCAYkiFiAZfCABfCIXICKFQiCJIhkgFSAffCIVfCIfIBaFQiiJIhYgF3wgBnwiFyAZhUIwiSIZIB98Ih8gFoVCAYkiFiAVIA+FQgGJIg8gGnwgCHwiFSAdhUIgiSIaICN8Ih0gD4VCKIkiDyAVfCACfCIVfCANfCIihUIgiSIjfCIkIBaFQiiJIhYgInwgCXwiIiAjhUIwiSIjICR8IiQgFoVCAYkiFiAYIBt8IhggFSAahUIwiSIVICEgFIVCAYkiFCAXfCASfCIXhUIgiSIafCIbIBSFQiiJIhQgF3wgCHwiF3wgB3wiISAVIB18IhUgGSAYIA6FQgGJIg4gHnwgBnwiGIVCIIkiGXwiHSAOhUIoiSIOIBh8IAt8IhggGYVCMIkiGYVCIIkiHiAfICAgFSAPhUIBiSIPIBx8IAp8IhWFQiCJIhx8Ih8gD4VCKIkiDyAVfCAEfCIVIByFQjCJIhwgH3wiH3wiICAWhUIoiSIWICF8IAN8IiEgHoVCMIkiHiAgfCIgIBggFyAahUIwiSIXIBt8IhogFIVCAYkiFHwgBXwiGCAchUIgiSIbICR8IhwgFIVCKIkiFCAYfCABfCIYIBuFQjCJIhsgHyAPhUIBiSIPICJ8IAx8Ih8gF4VCIIkiFyAZIB18Ihl8Ih0gD4VCKIkiDyAffCATfCIfIBeFQjCJIhcgHXwiHSAPhUIBiSIPIBkgDoVCAYkiDiAVfCAQfCIVICOFQiCJIhkgGnwiGiAOhUIoiSIOIBV8IAJ8IhV8IBN8IiKFQiCJIiN8IiQgD4VCKIkiDyAifCASfCIiICOFQjCJIiMgJHwiJCAPhUIBiSIPIBsgHHwiGyAVIBmFQjCJIhUgICAWhUIBiSIWIB98IAt8IhmFQiCJIhx8Ih8gFoVCKIkiFiAZfCACfCIZfCAJfCIgIBUgGnwiFSAXIBsgFIVCAYkiFCAhfCAFfCIahUIgiSIXfCIbIBSFQiiJIhQgGnwgA3wiGiAXhUIwiSIXhUIgiSIhIB0gHiAVIA6FQgGJIg4gGHwgEHwiFYVCIIkiGHwiHSAOhUIoiSIOIBV8IAF8IhUgGIVCMIkiGCAdfCIdfCIeIA+FQiiJIg8gIHwgDXwiICAhhUIwiSIhIB58Ih4gGSAchUIwiSIZIB98IhwgFoVCAYkiFiAafCAIfCIaIBiFQiCJIhggJHwiHyAWhUIoiSIWIBp8IAp8IhogGIVCMIkiGCAdIA6FQgGJIg4gInwgBHwiHSAZhUIgiSIZIBcgG3wiF3wiGyAOhUIoiSIOIB18IAd8Ih0gGYVCMIkiGSAbfCIbIA6FQgGJIg4gFSAXIBSFQgGJIhR8IAx8IhUgI4VCIIkiFyAcfCIcIBSFQiiJIhQgFXwgBnwiFXwgEnwiIoVCIIkiI3wiJCAOhUIoiSIOICJ8IBN8IiIgGyAhIBUgF4VCMIkiFSAcfCIXIBSFQgGJIhQgGnwgBnwiGoVCIIkiHHwiGyAUhUIoiSIUIBp8IBB8IhogHIVCMIkiHCAbfCIbIBSFQgGJIhR8IA18IiEgGCAffCIYIBUgHiAPhUIBiSIPIB18IAJ8Ih2FQiCJIhV8Ih4gD4VCKIkiDyAdfCABfCIdIBWFQjCJIhWFQiCJIh8gFyAZIBggFoVCAYkiFiAgfCADfCIYhUIgiSIZfCIXIBaFQiiJIhYgGHwgBHwiGCAZhUIwiSIZIBd8Ihd8IiAgFIVCKIkiFCAhfCAIfCIhIB+FQjCJIh8gIHwiICAiICOFQjCJIiIgJHwiIyAOhUIBiSIOIB18IAd8Ih0gGYVCIIkiGSAbfCIbIA6FQiiJIg4gHXwgDHwiHSAZhUIwiSIZIBcgFoVCAYkiFiAafCALfCIXICKFQiCJIhogFSAefCIVfCIeIBaFQiiJIhYgF3wgCXwiFyAahUIwiSIaIB58Ih4gFoVCAYkiFiAVIA+FQgGJIg8gGHwgBXwiFSAchUIgiSIYICN8IhwgD4VCKIkiDyAVfCAKfCIVfCACfCIChUIgiSIifCIjIBaFQiiJIhYgAnwgC3wiAiAihUIwiSILICN8IiIgFoVCAYkiFiAZIBt8IhkgFSAYhUIwiSIVICAgFIVCAYkiFCAXfCANfCINhUIgiSIXfCIYIBSFQiiJIhQgDXwgBXwiBXwgEHwiECAVIBx8Ig0gGiAZIA6FQgGJIg4gIXwgDHwiDIVCIIkiFXwiGSAOhUIoiSIOIAx8IBJ8IhIgFYVCMIkiDIVCIIkiFSAeIB8gDSAPhUIBiSINIB18IAl8IgmFQiCJIg98IhogDYVCKIkiDSAJfCAIfCIJIA+FQjCJIgggGnwiD3wiGiAWhUIoiSIWIBB8IAd8IhAgEYUgDCAZfCIHIA6FQgGJIgwgCXwgCnwiCiALhUIgiSILIAUgF4VCMIkiBSAYfCIJfCIOIAyFQiiJIgwgCnwgE3wiEyALhUIwiSIKIA58IguFNwOAiQFBACADIAYgDyANhUIBiSINIAJ8fCICIAWFQiCJIgUgB3wiBiANhUIoiSIHIAJ8fCICQQApA4iJAYUgBCABIBIgCSAUhUIBiSIDfHwiASAIhUIgiSISICJ8IgkgA4VCKIkiAyABfHwiASAShUIwiSIEIAl8IhKFNwOIiQFBACATQQApA5CJAYUgECAVhUIwiSIQIBp8IhOFNwOQiQFBACABQQApA5iJAYUgAiAFhUIwiSICIAZ8IgGFNwOYiQFBACASIAOFQgGJQQApA6CJAYUgAoU3A6CJAUEAIBMgFoVCAYlBACkDqIkBhSAKhTcDqIkBQQAgASAHhUIBiUEAKQOwiQGFIASFNwOwiQFBACALIAyFQgGJQQApA7iJAYUgEIU3A7iJAQvdAgUBfwF+AX8BfgJ/IwBBwABrIgAkAAJAQQApA9CJAUIAUg0AQQBBACkDwIkBIgFBACgC4IoBIgKsfCIDNwPAiQFBAEEAKQPIiQEgAyABVK18NwPIiQECQEEALQDoigFFDQBBAEJ/NwPYiQELQQBCfzcD0IkBAkAgAkH/AEoNAEEAIQQDQCACIARqQeCJAWpBADoAACAEQQFqIgRBgAFBACgC4IoBIgJrSA0ACwtB4IkBEAIgAEEAKQOAiQE3AwAgAEEAKQOIiQE3AwggAEEAKQOQiQE3AxAgAEEAKQOYiQE3AxggAEEAKQOgiQE3AyAgAEEAKQOoiQE3AyggAEEAKQOwiQE3AzAgAEEAKQO4iQE3AzhBACgC5IoBIgVBAUgNAEEAIQRBACECA0AgBEGACWogACAEai0AADoAACAEQQFqIQQgBSACQQFqIgJB/wFxSg0ACwsgAEHAAGokAAv9AwMBfwF+AX8jAEGAAWsiAiQAQQBBgQI7AfKKAUEAIAE6APGKAUEAIAA6APCKAUGQfiEAA0AgAEGAiwFqQgA3AAAgAEH4igFqQgA3AAAgAEHwigFqQgA3AAAgAEEYaiIADQALQQAhAEEAQQApA/CKASIDQoiS853/zPmE6gCFNwOAiQFBAEEAKQP4igFCu86qptjQ67O7f4U3A4iJAUEAQQApA4CLAUKr8NP0r+68tzyFNwOQiQFBAEEAKQOIiwFC8e30+KWn/aelf4U3A5iJAUEAQQApA5CLAULRhZrv+s+Uh9EAhTcDoIkBQQBBACkDmIsBQp/Y+dnCkdqCm3+FNwOoiQFBAEEAKQOgiwFC6/qG2r+19sEfhTcDsIkBQQBBACkDqIsBQvnC+JuRo7Pw2wCFNwO4iQFBACADp0H/AXE2AuSKAQJAIAFBAUgNACACQgA3A3ggAkIANwNwIAJCADcDaCACQgA3A2AgAkIANwNYIAJCADcDUCACQgA3A0ggAkIANwNAIAJCADcDOCACQgA3AzAgAkIANwMoIAJCADcDICACQgA3AxggAkIANwMQIAJCADcDCCACQgA3AwBBACEEA0AgAiAAaiAAQYAJai0AADoAACAAQQFqIQAgBEEBaiIEQf8BcSABSA0ACyACQYABEAELIAJBgAFqJAALEgAgAEEDdkH/P3EgAEEQdhAECwkAQYAJIAAQAQsGAEGAiQELGwAgAUEDdkH/P3EgAUEQdhAEQYAJIAAQARADCwsLAQBBgAgLBPAAAAA=";
var hash$j = "c6f286e6";
var wasmJson$j = {
  name: name$j,
  data: data$j,
  hash: hash$j
};
var mutex$k = new Mutex();
function validateBits$4(bits) {
  if (!Number.isInteger(bits) || bits < 8 || bits > 512 || bits % 8 !== 0) {
    return new Error("Invalid variant! Valid values: 8, 16, ..., 512");
  }
  return null;
}
function getInitParam$1(outputBits, keyBits) {
  return outputBits | keyBits << 16;
}
function createBLAKE2b(bits = 512, key = null) {
  if (validateBits$4(bits)) {
    return Promise.reject(validateBits$4(bits));
  }
  let keyBuffer = null;
  let initParam = bits;
  if (key !== null) {
    keyBuffer = getUInt8Buffer(key);
    if (keyBuffer.length > 64) {
      return Promise.reject(new Error("Max key length is 64 bytes"));
    }
    initParam = getInitParam$1(bits, keyBuffer.length);
  }
  const outputSize = bits / 8;
  return WASMInterface(wasmJson$j, outputSize).then((wasm) => {
    if (initParam > 512) {
      wasm.writeMemory(keyBuffer);
    }
    wasm.init(initParam);
    const obj = {
      init: initParam > 512 ? () => {
        wasm.writeMemory(keyBuffer);
        wasm.init(initParam);
        return obj;
      } : () => {
        wasm.init(initParam);
        return obj;
      },
      update: (data) => {
        wasm.update(data);
        return obj;
      },
      // biome-ignore lint/suspicious/noExplicitAny: Conflict with IHasher type
      digest: (outputType) => wasm.digest(outputType),
      save: () => wasm.save(),
      load: (data) => {
        wasm.load(data);
        return obj;
      },
      blockSize: 128,
      digestSize: outputSize
    };
    return obj;
  });
}
function encodeResult(salt, options, res) {
  const parameters = [
    `m=${options.memorySize}`,
    `t=${options.iterations}`,
    `p=${options.parallelism}`
  ].join(",");
  return `$argon2${options.hashType}$v=19$${parameters}$${encodeBase64(salt, false)}$${encodeBase64(res, false)}`;
}
var uint32View = new DataView(new ArrayBuffer(4));
function int32LE(x) {
  uint32View.setInt32(0, x, true);
  return new Uint8Array(uint32View.buffer);
}
function hashFunc(blake512, buf, len) {
  return __awaiter(this, void 0, void 0, function* () {
    if (len <= 64) {
      const blake = yield createBLAKE2b(len * 8);
      blake.update(int32LE(len));
      blake.update(buf);
      return blake.digest("binary");
    }
    const r = Math.ceil(len / 32) - 2;
    const ret = new Uint8Array(len);
    blake512.init();
    blake512.update(int32LE(len));
    blake512.update(buf);
    let vp = blake512.digest("binary");
    ret.set(vp.subarray(0, 32), 0);
    for (let i = 1; i < r; i++) {
      blake512.init();
      blake512.update(vp);
      vp = blake512.digest("binary");
      ret.set(vp.subarray(0, 32), i * 32);
    }
    const partialBytesNeeded = len - 32 * r;
    let blakeSmall;
    if (partialBytesNeeded === 64) {
      blakeSmall = blake512;
      blakeSmall.init();
    } else {
      blakeSmall = yield createBLAKE2b(partialBytesNeeded * 8);
    }
    blakeSmall.update(vp);
    vp = blakeSmall.digest("binary");
    ret.set(vp.subarray(0, partialBytesNeeded), r * 32);
    return ret;
  });
}
function getHashType(type) {
  switch (type) {
    case "d":
      return 0;
    case "i":
      return 1;
    default:
      return 2;
  }
}
function argon2Internal(options) {
  return __awaiter(this, void 0, void 0, function* () {
    var _a2;
    const { parallelism, iterations, hashLength } = options;
    const password = getUInt8Buffer(options.password);
    const salt = getUInt8Buffer(options.salt);
    const version2 = 19;
    const hashType = getHashType(options.hashType);
    const { memorySize } = options;
    const secret = getUInt8Buffer((_a2 = options.secret) !== null && _a2 !== void 0 ? _a2 : "");
    const [argon2Interface, blake512] = yield Promise.all([
      WASMInterface(wasmJson$k, 1024),
      createBLAKE2b(512)
    ]);
    argon2Interface.setMemorySize(memorySize * 1024 + 1024);
    const initVector = new Uint8Array(24);
    const initVectorView = new DataView(initVector.buffer);
    initVectorView.setInt32(0, parallelism, true);
    initVectorView.setInt32(4, hashLength, true);
    initVectorView.setInt32(8, memorySize, true);
    initVectorView.setInt32(12, iterations, true);
    initVectorView.setInt32(16, version2, true);
    initVectorView.setInt32(20, hashType, true);
    argon2Interface.writeMemory(initVector, memorySize * 1024);
    blake512.init();
    blake512.update(initVector);
    blake512.update(int32LE(password.length));
    blake512.update(password);
    blake512.update(int32LE(salt.length));
    blake512.update(salt);
    blake512.update(int32LE(secret.length));
    blake512.update(secret);
    blake512.update(int32LE(0));
    const segments = Math.floor(memorySize / (parallelism * 4));
    const lanes = segments * 4;
    const param = new Uint8Array(72);
    const H0 = blake512.digest("binary");
    param.set(H0);
    for (let lane = 0; lane < parallelism; lane++) {
      param.set(int32LE(0), 64);
      param.set(int32LE(lane), 68);
      let position = lane * lanes;
      let chunk = yield hashFunc(blake512, param, 1024);
      argon2Interface.writeMemory(chunk, position * 1024);
      position += 1;
      param.set(int32LE(1), 64);
      chunk = yield hashFunc(blake512, param, 1024);
      argon2Interface.writeMemory(chunk, position * 1024);
    }
    const C = new Uint8Array(1024);
    writeHexToUInt8(C, argon2Interface.calculate(new Uint8Array([]), memorySize));
    const res = yield hashFunc(blake512, C, hashLength);
    if (options.outputType === "hex") {
      const digestChars = new Uint8Array(hashLength * 2);
      return getDigestHex(digestChars, res, hashLength);
    }
    if (options.outputType === "encoded") {
      return encodeResult(salt, options, res);
    }
    return res;
  });
}
var validateOptions$3 = (options) => {
  var _a2;
  if (!options || typeof options !== "object") {
    throw new Error("Invalid options parameter. It requires an object.");
  }
  if (!options.password) {
    throw new Error("Password must be specified");
  }
  options.password = getUInt8Buffer(options.password);
  if (options.password.length < 1) {
    throw new Error("Password must be specified");
  }
  if (!options.salt) {
    throw new Error("Salt must be specified");
  }
  options.salt = getUInt8Buffer(options.salt);
  if (options.salt.length < 8) {
    throw new Error("Salt should be at least 8 bytes long");
  }
  options.secret = getUInt8Buffer((_a2 = options.secret) !== null && _a2 !== void 0 ? _a2 : "");
  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error("Iterations should be a positive number");
  }
  if (!Number.isInteger(options.parallelism) || options.parallelism < 1) {
    throw new Error("Parallelism should be a positive number");
  }
  if (!Number.isInteger(options.hashLength) || options.hashLength < 4) {
    throw new Error("Hash length should be at least 4 bytes.");
  }
  if (!Number.isInteger(options.memorySize)) {
    throw new Error("Memory size should be specified.");
  }
  if (options.memorySize < 8 * options.parallelism) {
    throw new Error("Memory size should be at least 8 * parallelism.");
  }
  if (options.outputType === void 0) {
    options.outputType = "hex";
  }
  if (!["hex", "binary", "encoded"].includes(options.outputType)) {
    throw new Error(`Insupported output type ${options.outputType}. Valid values: ['hex', 'binary', 'encoded']`);
  }
};
function argon2id(options) {
  return __awaiter(this, void 0, void 0, function* () {
    validateOptions$3(options);
    return argon2Internal(Object.assign(Object.assign({}, options), { hashType: "id" }));
  });
}
var mutex$j = new Mutex();
var mutex$i = new Mutex();
var mutex$h = new Mutex();
var mutex$g = new Mutex();
var polyBuffer = new Uint8Array(8);
var mutex$f = new Mutex();
var mutex$e = new Mutex();
var mutex$d = new Mutex();
var mutex$c = new Mutex();
var mutex$b = new Mutex();
var mutex$a = new Mutex();
var mutex$9 = new Mutex();
var mutex$8 = new Mutex();
var mutex$7 = new Mutex();
var mutex$6 = new Mutex();
var mutex$5 = new Mutex();
var seedBuffer$2 = new Uint8Array(8);
var mutex$4 = new Mutex();
var seedBuffer$1 = new Uint8Array(8);
var mutex$3 = new Mutex();
var seedBuffer = new Uint8Array(8);
var mutex$2 = new Mutex();
var mutex$1 = new Mutex();
var mutex = new Mutex();

// src/core/kdf.js
var _argon2Ok = null;
async function isArgon2Available() {
  if (_argon2Ok !== null) return _argon2Ok;
  try {
    await argon2id({
      password: "probe",
      salt: new Uint8Array(16),
      parallelism: 1,
      iterations: 1,
      memorySize: 256,
      hashLength: 32,
      outputType: "binary"
    });
    _argon2Ok = true;
  } catch {
    _argon2Ok = false;
  }
  return _argon2Ok;
}
async function getRecommendedKdfParams() {
  if (await isArgon2Available()) {
    return {
      type: "argon2id",
      time: KDF.ARGON2_TIME,
      memoryKiB: KDF.ARGON2_MEMORY_KIB,
      parallelism: KDF.ARGON2_PARALLELISM
    };
  }
  return { type: "pbkdf2", iterations: KDF.PBKDF2_ITERATIONS, hash: KDF.PBKDF2_HASH };
}
async function deriveKek(secret, salt, params = null) {
  const secretBytes = utf8ToBytes(secret);
  try {
    const effective = params || await getRecommendedKdfParams();
    if (effective.type === "argon2id" && await isArgon2Available()) {
      const kek = await argon2id({
        password: secretBytes,
        salt,
        parallelism: effective.parallelism ?? KDF.ARGON2_PARALLELISM,
        iterations: effective.time ?? KDF.ARGON2_TIME,
        memorySize: effective.memoryKiB ?? KDF.ARGON2_MEMORY_KIB,
        hashLength: KDF.ARGON2_HASH_LENGTH,
        outputType: "binary"
      });
      return {
        kek: new Uint8Array(kek),
        kdfParams: {
          type: "argon2id",
          time: effective.time ?? KDF.ARGON2_TIME,
          memoryKiB: effective.memoryKiB ?? KDF.ARGON2_MEMORY_KIB,
          parallelism: effective.parallelism ?? KDF.ARGON2_PARALLELISM
        }
      };
    }
    return derivePbkdf2(secretBytes, salt, effective);
  } finally {
    secureWipe(secretBytes);
  }
}
async function derivePbkdf2(secretBytes, salt, params) {
  const iterations = params?.iterations ?? KDF.PBKDF2_ITERATIONS;
  const hash = params?.hash ?? KDF.PBKDF2_HASH;
  const base = await globalThis.crypto.subtle.importKey("raw", secretBytes, "PBKDF2", false, ["deriveBits"]);
  const bits = await globalThis.crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash }, base, 256);
  return { kek: new Uint8Array(bits), kdfParams: { type: "pbkdf2", iterations, hash } };
}

// node_modules/@noble/hashes/esm/crypto.js
var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes2(data);
  abytes(data);
  return data;
}
var Hash = class {
};
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes2(bytesLength = 32) {
  if (crypto && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto && typeof crypto.randomBytes === "function") {
    return Uint8Array.from(crypto.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view2, byteOffset, value, isLE) {
  if (typeof view2.setBigUint64 === "function")
    return view2.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h3 = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view2.setUint32(byteOffset + h3, wh, isLE);
  view2.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view: view2, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view2, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view: view2, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view2, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view2, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view2, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to2) {
    to2 || (to2 = new this.constructor());
    to2.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to2.destroyed = destroyed;
    to2.finished = finished;
    to2.length = length;
    to2.pos = pos;
    if (length % blockLen)
      to2.buffer.set(buffer);
    return to2;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@noble/hashes/esm/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view2, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view2.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());

// node_modules/@scure/base/lib/esm/index.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function isArrayOf(isString2, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString2) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label2, input) {
  if (typeof input !== "string")
    throw new Error(`${label2}: string expected`);
  return true;
}
function anumber2(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label2, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label2}: array of strings expected`);
}
function anumArr(label2, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label2}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap = (a, b) => (c) => a(b(c));
  const encode = args.map((x) => x.encode).reduceRight(wrap, id);
  const decode = args.map((x) => x.decode).reduce(wrap, id);
  return { encode, decode };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join(separator = "") {
  astr("join", separator);
  return {
    encode: (from2) => {
      astrArr("join.decode", from2);
      return from2.join(separator);
    },
    decode: (to2) => {
      astr("join.decode", to2);
      return to2.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function padding(bits, chr = "=") {
  anumber2(bits);
  astr("padding", chr);
  return {
    encode(data) {
      astrArr("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (; end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
function convertRadix(data, from2, to2) {
  if (from2 < 2)
    throw new Error(`convertRadix: invalid from=${from2}, base cannot be less than 2`);
  if (to2 < 2)
    throw new Error(`convertRadix: invalid to=${to2}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber2(d);
    if (d < 0 || d >= from2)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit2 = digits[i];
      const fromCarry = from2 * carry;
      const digitBase = fromCarry + digit2;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from2 !== carry || digitBase - digit2 !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to2;
      carry = digitBase % to2;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to2 + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from2, to2) => from2 + (to2 - gcd(from2, to2));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from2, to2, padding2) {
  aArr(data);
  if (from2 <= 0 || from2 > 32)
    throw new Error(`convertRadix2: wrong from=${from2}`);
  if (to2 <= 0 || to2 > 32)
    throw new Error(`convertRadix2: wrong to=${to2}`);
  if (/* @__PURE__ */ radix2carry(from2, to2) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from2} to=${to2} carryBits=${/* @__PURE__ */ radix2carry(from2, to2)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from2];
  const mask = powers[to2] - 1;
  const res = [];
  for (const n of data) {
    anumber2(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from2}`);
    carry = carry << from2 | n;
    if (pos + from2 > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from2}`);
    pos += from2;
    for (; pos >= to2; pos -= to2)
      res.push((carry >> pos - to2 & mask) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to2 - pos & mask;
  if (!padding2 && pos >= from2)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num) {
  anumber2(num);
  const _256 = 2 ** 8;
  return {
    encode: (bytes) => {
      if (!isBytes2(bytes))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes), _256, num);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix2(bits, revPadding = false) {
  anumber2(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes) => {
      if (!isBytes2(bytes))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function checksum(len, fn) {
  anumber2(len);
  afn(fn);
  return {
    encode(data) {
      if (!isBytes2(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes2(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var utils = {
  alphabet,
  chain,
  checksum,
  convertRadix,
  convertRadix2,
  radix,
  radix2,
  join,
  padding
};

// node_modules/@scure/bip39/esm/index.js
var isJapanese = (wordlist2) => wordlist2[0] === "\u3042\u3044\u3053\u304F\u3057\u3093";
function nfkd(str) {
  if (typeof str !== "string")
    throw new TypeError("invalid mnemonic type: " + typeof str);
  return str.normalize("NFKD");
}
function normalize(str) {
  const norm = nfkd(str);
  const words = norm.split(" ");
  if (![12, 15, 18, 21, 24].includes(words.length))
    throw new Error("Invalid mnemonic");
  return { nfkd: norm, words };
}
function aentropy(ent) {
  abytes(ent, 16, 20, 24, 28, 32);
}
function generateMnemonic(wordlist2, strength = 128) {
  anumber(strength);
  if (strength % 32 !== 0 || strength > 256)
    throw new TypeError("Invalid entropy");
  return entropyToMnemonic(randomBytes2(strength / 8), wordlist2);
}
var calcChecksum = (entropy) => {
  const bitsLeft = 8 - entropy.length / 4;
  return new Uint8Array([sha256(entropy)[0] >> bitsLeft << bitsLeft]);
};
function getCoder(wordlist2) {
  if (!Array.isArray(wordlist2) || wordlist2.length !== 2048 || typeof wordlist2[0] !== "string")
    throw new Error("Wordlist: expected array of 2048 strings");
  wordlist2.forEach((i) => {
    if (typeof i !== "string")
      throw new Error("wordlist: non-string element: " + i);
  });
  return utils.chain(utils.checksum(1, calcChecksum), utils.radix2(11, true), utils.alphabet(wordlist2));
}
function mnemonicToEntropy(mnemonic, wordlist2) {
  const { words } = normalize(mnemonic);
  const entropy = getCoder(wordlist2).decode(words);
  aentropy(entropy);
  return entropy;
}
function entropyToMnemonic(entropy, wordlist2) {
  aentropy(entropy);
  const words = getCoder(wordlist2).encode(entropy);
  return words.join(isJapanese(wordlist2) ? "\u3000" : " ");
}
function validateMnemonic(mnemonic, wordlist2) {
  try {
    mnemonicToEntropy(mnemonic, wordlist2);
  } catch (e) {
    return false;
  }
  return true;
}

// node_modules/@scure/bip39/esm/wordlists/english.js
var wordlist = `abandon
ability
able
about
above
absent
absorb
abstract
absurd
abuse
access
accident
account
accuse
achieve
acid
acoustic
acquire
across
act
action
actor
actress
actual
adapt
add
addict
address
adjust
admit
adult
advance
advice
aerobic
affair
afford
afraid
again
age
agent
agree
ahead
aim
air
airport
aisle
alarm
album
alcohol
alert
alien
all
alley
allow
almost
alone
alpha
already
also
alter
always
amateur
amazing
among
amount
amused
analyst
anchor
ancient
anger
angle
angry
animal
ankle
announce
annual
another
answer
antenna
antique
anxiety
any
apart
apology
appear
apple
approve
april
arch
arctic
area
arena
argue
arm
armed
armor
army
around
arrange
arrest
arrive
arrow
art
artefact
artist
artwork
ask
aspect
assault
asset
assist
assume
asthma
athlete
atom
attack
attend
attitude
attract
auction
audit
august
aunt
author
auto
autumn
average
avocado
avoid
awake
aware
away
awesome
awful
awkward
axis
baby
bachelor
bacon
badge
bag
balance
balcony
ball
bamboo
banana
banner
bar
barely
bargain
barrel
base
basic
basket
battle
beach
bean
beauty
because
become
beef
before
begin
behave
behind
believe
below
belt
bench
benefit
best
betray
better
between
beyond
bicycle
bid
bike
bind
biology
bird
birth
bitter
black
blade
blame
blanket
blast
bleak
bless
blind
blood
blossom
blouse
blue
blur
blush
board
boat
body
boil
bomb
bone
bonus
book
boost
border
boring
borrow
boss
bottom
bounce
box
boy
bracket
brain
brand
brass
brave
bread
breeze
brick
bridge
brief
bright
bring
brisk
broccoli
broken
bronze
broom
brother
brown
brush
bubble
buddy
budget
buffalo
build
bulb
bulk
bullet
bundle
bunker
burden
burger
burst
bus
business
busy
butter
buyer
buzz
cabbage
cabin
cable
cactus
cage
cake
call
calm
camera
camp
can
canal
cancel
candy
cannon
canoe
canvas
canyon
capable
capital
captain
car
carbon
card
cargo
carpet
carry
cart
case
cash
casino
castle
casual
cat
catalog
catch
category
cattle
caught
cause
caution
cave
ceiling
celery
cement
census
century
cereal
certain
chair
chalk
champion
change
chaos
chapter
charge
chase
chat
cheap
check
cheese
chef
cherry
chest
chicken
chief
child
chimney
choice
choose
chronic
chuckle
chunk
churn
cigar
cinnamon
circle
citizen
city
civil
claim
clap
clarify
claw
clay
clean
clerk
clever
click
client
cliff
climb
clinic
clip
clock
clog
close
cloth
cloud
clown
club
clump
cluster
clutch
coach
coast
coconut
code
coffee
coil
coin
collect
color
column
combine
come
comfort
comic
common
company
concert
conduct
confirm
congress
connect
consider
control
convince
cook
cool
copper
copy
coral
core
corn
correct
cost
cotton
couch
country
couple
course
cousin
cover
coyote
crack
cradle
craft
cram
crane
crash
crater
crawl
crazy
cream
credit
creek
crew
cricket
crime
crisp
critic
crop
cross
crouch
crowd
crucial
cruel
cruise
crumble
crunch
crush
cry
crystal
cube
culture
cup
cupboard
curious
current
curtain
curve
cushion
custom
cute
cycle
dad
damage
damp
dance
danger
daring
dash
daughter
dawn
day
deal
debate
debris
decade
december
decide
decline
decorate
decrease
deer
defense
define
defy
degree
delay
deliver
demand
demise
denial
dentist
deny
depart
depend
deposit
depth
deputy
derive
describe
desert
design
desk
despair
destroy
detail
detect
develop
device
devote
diagram
dial
diamond
diary
dice
diesel
diet
differ
digital
dignity
dilemma
dinner
dinosaur
direct
dirt
disagree
discover
disease
dish
dismiss
disorder
display
distance
divert
divide
divorce
dizzy
doctor
document
dog
doll
dolphin
domain
donate
donkey
donor
door
dose
double
dove
draft
dragon
drama
drastic
draw
dream
dress
drift
drill
drink
drip
drive
drop
drum
dry
duck
dumb
dune
during
dust
dutch
duty
dwarf
dynamic
eager
eagle
early
earn
earth
easily
east
easy
echo
ecology
economy
edge
edit
educate
effort
egg
eight
either
elbow
elder
electric
elegant
element
elephant
elevator
elite
else
embark
embody
embrace
emerge
emotion
employ
empower
empty
enable
enact
end
endless
endorse
enemy
energy
enforce
engage
engine
enhance
enjoy
enlist
enough
enrich
enroll
ensure
enter
entire
entry
envelope
episode
equal
equip
era
erase
erode
erosion
error
erupt
escape
essay
essence
estate
eternal
ethics
evidence
evil
evoke
evolve
exact
example
excess
exchange
excite
exclude
excuse
execute
exercise
exhaust
exhibit
exile
exist
exit
exotic
expand
expect
expire
explain
expose
express
extend
extra
eye
eyebrow
fabric
face
faculty
fade
faint
faith
fall
false
fame
family
famous
fan
fancy
fantasy
farm
fashion
fat
fatal
father
fatigue
fault
favorite
feature
february
federal
fee
feed
feel
female
fence
festival
fetch
fever
few
fiber
fiction
field
figure
file
film
filter
final
find
fine
finger
finish
fire
firm
first
fiscal
fish
fit
fitness
fix
flag
flame
flash
flat
flavor
flee
flight
flip
float
flock
floor
flower
fluid
flush
fly
foam
focus
fog
foil
fold
follow
food
foot
force
forest
forget
fork
fortune
forum
forward
fossil
foster
found
fox
fragile
frame
frequent
fresh
friend
fringe
frog
front
frost
frown
frozen
fruit
fuel
fun
funny
furnace
fury
future
gadget
gain
galaxy
gallery
game
gap
garage
garbage
garden
garlic
garment
gas
gasp
gate
gather
gauge
gaze
general
genius
genre
gentle
genuine
gesture
ghost
giant
gift
giggle
ginger
giraffe
girl
give
glad
glance
glare
glass
glide
glimpse
globe
gloom
glory
glove
glow
glue
goat
goddess
gold
good
goose
gorilla
gospel
gossip
govern
gown
grab
grace
grain
grant
grape
grass
gravity
great
green
grid
grief
grit
grocery
group
grow
grunt
guard
guess
guide
guilt
guitar
gun
gym
habit
hair
half
hammer
hamster
hand
happy
harbor
hard
harsh
harvest
hat
have
hawk
hazard
head
health
heart
heavy
hedgehog
height
hello
helmet
help
hen
hero
hidden
high
hill
hint
hip
hire
history
hobby
hockey
hold
hole
holiday
hollow
home
honey
hood
hope
horn
horror
horse
hospital
host
hotel
hour
hover
hub
huge
human
humble
humor
hundred
hungry
hunt
hurdle
hurry
hurt
husband
hybrid
ice
icon
idea
identify
idle
ignore
ill
illegal
illness
image
imitate
immense
immune
impact
impose
improve
impulse
inch
include
income
increase
index
indicate
indoor
industry
infant
inflict
inform
inhale
inherit
initial
inject
injury
inmate
inner
innocent
input
inquiry
insane
insect
inside
inspire
install
intact
interest
into
invest
invite
involve
iron
island
isolate
issue
item
ivory
jacket
jaguar
jar
jazz
jealous
jeans
jelly
jewel
job
join
joke
journey
joy
judge
juice
jump
jungle
junior
junk
just
kangaroo
keen
keep
ketchup
key
kick
kid
kidney
kind
kingdom
kiss
kit
kitchen
kite
kitten
kiwi
knee
knife
knock
know
lab
label
labor
ladder
lady
lake
lamp
language
laptop
large
later
latin
laugh
laundry
lava
law
lawn
lawsuit
layer
lazy
leader
leaf
learn
leave
lecture
left
leg
legal
legend
leisure
lemon
lend
length
lens
leopard
lesson
letter
level
liar
liberty
library
license
life
lift
light
like
limb
limit
link
lion
liquid
list
little
live
lizard
load
loan
lobster
local
lock
logic
lonely
long
loop
lottery
loud
lounge
love
loyal
lucky
luggage
lumber
lunar
lunch
luxury
lyrics
machine
mad
magic
magnet
maid
mail
main
major
make
mammal
man
manage
mandate
mango
mansion
manual
maple
marble
march
margin
marine
market
marriage
mask
mass
master
match
material
math
matrix
matter
maximum
maze
meadow
mean
measure
meat
mechanic
medal
media
melody
melt
member
memory
mention
menu
mercy
merge
merit
merry
mesh
message
metal
method
middle
midnight
milk
million
mimic
mind
minimum
minor
minute
miracle
mirror
misery
miss
mistake
mix
mixed
mixture
mobile
model
modify
mom
moment
monitor
monkey
monster
month
moon
moral
more
morning
mosquito
mother
motion
motor
mountain
mouse
move
movie
much
muffin
mule
multiply
muscle
museum
mushroom
music
must
mutual
myself
mystery
myth
naive
name
napkin
narrow
nasty
nation
nature
near
neck
need
negative
neglect
neither
nephew
nerve
nest
net
network
neutral
never
news
next
nice
night
noble
noise
nominee
noodle
normal
north
nose
notable
note
nothing
notice
novel
now
nuclear
number
nurse
nut
oak
obey
object
oblige
obscure
observe
obtain
obvious
occur
ocean
october
odor
off
offer
office
often
oil
okay
old
olive
olympic
omit
once
one
onion
online
only
open
opera
opinion
oppose
option
orange
orbit
orchard
order
ordinary
organ
orient
original
orphan
ostrich
other
outdoor
outer
output
outside
oval
oven
over
own
owner
oxygen
oyster
ozone
pact
paddle
page
pair
palace
palm
panda
panel
panic
panther
paper
parade
parent
park
parrot
party
pass
patch
path
patient
patrol
pattern
pause
pave
payment
peace
peanut
pear
peasant
pelican
pen
penalty
pencil
people
pepper
perfect
permit
person
pet
phone
photo
phrase
physical
piano
picnic
picture
piece
pig
pigeon
pill
pilot
pink
pioneer
pipe
pistol
pitch
pizza
place
planet
plastic
plate
play
please
pledge
pluck
plug
plunge
poem
poet
point
polar
pole
police
pond
pony
pool
popular
portion
position
possible
post
potato
pottery
poverty
powder
power
practice
praise
predict
prefer
prepare
present
pretty
prevent
price
pride
primary
print
priority
prison
private
prize
problem
process
produce
profit
program
project
promote
proof
property
prosper
protect
proud
provide
public
pudding
pull
pulp
pulse
pumpkin
punch
pupil
puppy
purchase
purity
purpose
purse
push
put
puzzle
pyramid
quality
quantum
quarter
question
quick
quit
quiz
quote
rabbit
raccoon
race
rack
radar
radio
rail
rain
raise
rally
ramp
ranch
random
range
rapid
rare
rate
rather
raven
raw
razor
ready
real
reason
rebel
rebuild
recall
receive
recipe
record
recycle
reduce
reflect
reform
refuse
region
regret
regular
reject
relax
release
relief
rely
remain
remember
remind
remove
render
renew
rent
reopen
repair
repeat
replace
report
require
rescue
resemble
resist
resource
response
result
retire
retreat
return
reunion
reveal
review
reward
rhythm
rib
ribbon
rice
rich
ride
ridge
rifle
right
rigid
ring
riot
ripple
risk
ritual
rival
river
road
roast
robot
robust
rocket
romance
roof
rookie
room
rose
rotate
rough
round
route
royal
rubber
rude
rug
rule
run
runway
rural
sad
saddle
sadness
safe
sail
salad
salmon
salon
salt
salute
same
sample
sand
satisfy
satoshi
sauce
sausage
save
say
scale
scan
scare
scatter
scene
scheme
school
science
scissors
scorpion
scout
scrap
screen
script
scrub
sea
search
season
seat
second
secret
section
security
seed
seek
segment
select
sell
seminar
senior
sense
sentence
series
service
session
settle
setup
seven
shadow
shaft
shallow
share
shed
shell
sheriff
shield
shift
shine
ship
shiver
shock
shoe
shoot
shop
short
shoulder
shove
shrimp
shrug
shuffle
shy
sibling
sick
side
siege
sight
sign
silent
silk
silly
silver
similar
simple
since
sing
siren
sister
situate
six
size
skate
sketch
ski
skill
skin
skirt
skull
slab
slam
sleep
slender
slice
slide
slight
slim
slogan
slot
slow
slush
small
smart
smile
smoke
smooth
snack
snake
snap
sniff
snow
soap
soccer
social
sock
soda
soft
solar
soldier
solid
solution
solve
someone
song
soon
sorry
sort
soul
sound
soup
source
south
space
spare
spatial
spawn
speak
special
speed
spell
spend
sphere
spice
spider
spike
spin
spirit
split
spoil
sponsor
spoon
sport
spot
spray
spread
spring
spy
square
squeeze
squirrel
stable
stadium
staff
stage
stairs
stamp
stand
start
state
stay
steak
steel
stem
step
stereo
stick
still
sting
stock
stomach
stone
stool
story
stove
strategy
street
strike
strong
struggle
student
stuff
stumble
style
subject
submit
subway
success
such
sudden
suffer
sugar
suggest
suit
summer
sun
sunny
sunset
super
supply
supreme
sure
surface
surge
surprise
surround
survey
suspect
sustain
swallow
swamp
swap
swarm
swear
sweet
swift
swim
swing
switch
sword
symbol
symptom
syrup
system
table
tackle
tag
tail
talent
talk
tank
tape
target
task
taste
tattoo
taxi
teach
team
tell
ten
tenant
tennis
tent
term
test
text
thank
that
theme
then
theory
there
they
thing
this
thought
three
thrive
throw
thumb
thunder
ticket
tide
tiger
tilt
timber
time
tiny
tip
tired
tissue
title
toast
tobacco
today
toddler
toe
together
toilet
token
tomato
tomorrow
tone
tongue
tonight
tool
tooth
top
topic
topple
torch
tornado
tortoise
toss
total
tourist
toward
tower
town
toy
track
trade
traffic
tragic
train
transfer
trap
trash
travel
tray
treat
tree
trend
trial
tribe
trick
trigger
trim
trip
trophy
trouble
truck
true
truly
trumpet
trust
truth
try
tube
tuition
tumble
tuna
tunnel
turkey
turn
turtle
twelve
twenty
twice
twin
twist
two
type
typical
ugly
umbrella
unable
unaware
uncle
uncover
under
undo
unfair
unfold
unhappy
uniform
unique
unit
universe
unknown
unlock
until
unusual
unveil
update
upgrade
uphold
upon
upper
upset
urban
urge
usage
use
used
useful
useless
usual
utility
vacant
vacuum
vague
valid
valley
valve
van
vanish
vapor
various
vast
vault
vehicle
velvet
vendor
venture
venue
verb
verify
version
very
vessel
veteran
viable
vibrant
vicious
victory
video
view
village
vintage
violin
virtual
virus
visa
visit
visual
vital
vivid
vocal
voice
void
volcano
volume
vote
voyage
wage
wagon
wait
walk
wall
walnut
want
warfare
warm
warrior
wash
wasp
waste
water
wave
way
wealth
weapon
wear
weasel
weather
web
wedding
weekend
weird
welcome
west
wet
whale
what
wheat
wheel
when
where
whip
whisper
wide
width
wife
wild
will
win
window
wine
wing
wink
winner
winter
wire
wisdom
wise
wish
witness
wolf
woman
wonder
wood
wool
word
work
world
worry
worth
wrap
wreck
wrestle
wrist
write
wrong
yard
year
yellow
you
young
youth
zebra
zero
zone
zoo`.split("\n");

// src/core/recovery.js
var RECOVERY_INFO = "okey:recovery-kek:v1";
function generateRecoveryMnemonic() {
  return generateMnemonic(wordlist, 256);
}
function mnemonicWords(mnemonic) {
  return mnemonic.trim().toLowerCase().split(/\s+/);
}
function normalizeMnemonic(mnemonic) {
  return mnemonicWords(mnemonic).join(" ");
}
async function deriveRecoveryKek(mnemonic, salt) {
  const normalized = normalizeMnemonic(mnemonic);
  if (!validateMnemonic(normalized, wordlist)) {
    throw new ValidationError("Invalid recovery key");
  }
  const entropy = mnemonicToEntropy(normalized, wordlist);
  return hkdf(entropy, salt, RECOVERY_INFO, 32);
}

// src/core/schema.js
var SENSITIVE_FIELDS = Object.freeze(["username", "password", "totpSecret", "notes", "customFields"]);
var METADATA_FIELDS = Object.freeze([
  "id",
  "domain",
  "entryType",
  "version",
  "isDeleted",
  "updatedAt",
  "displayOrder",
  "isPinned",
  "folder"
]);
var isString = (v) => typeof v === "string";
var clampStr = (v, max) => isString(v) ? v.slice(0, max) : "";
function createEntry(data, genId, nowIso2) {
  const ts = nowIso2();
  const entryType = data.entryType === ENTRY_TYPES.TOTP ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD;
  return {
    id: data.id || genId(),
    domain: clampStr(data.domain, 253).toLowerCase(),
    siteName: clampStr(data.siteName, 200),
    nickname: clampStr(data.nickname, 200),
    entryType,
    folder: clampStr(data.folder, 200),
    tags: sanitizeStringArray(data.tags, 30, 50),
    matchPatterns: sanitizeStringArray(data.matchPatterns, 20, 300),
    isFavorite: !!data.isFavorite,
    isPinned: !!data.isPinned,
    displayOrder: Number.isFinite(data.displayOrder) ? data.displayOrder : 0,
    createdAt: data.createdAt || ts,
    updatedAt: data.updatedAt || ts,
    lastUsedAt: data.lastUsedAt || ts,
    version: Number.isInteger(data.version) && data.version > 0 ? data.version : 1,
    isDeleted: !!data.isDeleted,
    username: clampStr(data.username, 1e3),
    password: clampStr(data.password, 1e4),
    totpSecret: clampStr(data.totpSecret, 1e3).replace(/\s+/g, ""),
    notes: clampStr(data.notes, 2e4),
    customFields: sanitizeCustomFields(data.customFields),
    schemaVersion: APP.ENTRY_SCHEMA_VERSION
  };
}
function sanitizeStringArray(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(isString).map((s) => s.slice(0, maxLen).trim()).filter(Boolean).slice(0, maxItems);
}
function sanitizeCustomFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields.filter((f) => f && isString(f.label)).map((f) => ({ label: f.label.slice(0, 200), value: clampStr(f.value, 1e4), hidden: !!f.hidden })).slice(0, 50);
}
function validateEntry(entry) {
  if (!entry || typeof entry !== "object") throw new ValidationError("Entry must be an object");
  if (!isString(entry.id) || entry.id.length < 8) throw new ValidationError("Entry id is invalid");
  if (!entry.domain && !entry.siteName && !entry.nickname) {
    throw new ValidationError("Entry needs a domain, site name, or nickname");
  }
  if (entry.entryType === ENTRY_TYPES.TOTP && !entry.totpSecret) {
    throw new ValidationError("Authenticator entries require a TOTP secret");
  }
  if (entry.entryType === ENTRY_TYPES.PASSWORD && !entry.password && !entry.totpSecret) {
    throw new ValidationError("At least Password or TOTP field must be entered");
  }
  return true;
}

// src/core/util.js
function generateUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  const h3 = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h3.slice(0, 8)}-${h3.slice(8, 12)}-${h3.slice(12, 16)}-${h3.slice(16, 20)}-${h3.slice(20)}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function deepClone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}
function formatTimeAgo(isoString, nowMs = Date.now()) {
  if (!isoString || isoString.startsWith("1970-01-01")) return "Never";
  const diff = nowMs - new Date(isoString).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h3 = Math.floor(m / 60);
  if (h3 < 24) return `${h3}h ago`;
  const d = Math.floor(h3 / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// src/core/vault.js
var META_KEYS = ["id", "domain", "entryType", "version", "isDeleted", "updatedAt", "displayOrder", "isPinned", "folder"];
var Vault = class {
  /** @param {import('./adapters.js').StorageAdapter} storage */
  constructor(storage) {
    this.storage = storage;
    this._dek = null;
    this._dekKey = null;
    this._entries = [];
    this._unlocked = false;
    this._salt = null;
    this._kdfParams = null;
    this._payloadCache = /* @__PURE__ */ new Map();
  }
  // ---- State ----
  isUnlocked() {
    return this._unlocked && this._dekKey !== null;
  }
  /** @returns {Promise<{ isSetup: boolean, formatVersion: number|null }>} */
  async getState() {
    const s = await this.storage.get([STORAGE_KEYS.SETUP_COMPLETE, STORAGE_KEYS.VAULT_METADATA]);
    return {
      isSetup: !!s[STORAGE_KEYS.SETUP_COMPLETE],
      formatVersion: s[STORAGE_KEYS.VAULT_METADATA]?.formatVersion ?? null
    };
  }
  // ---- Setup / Unlock / Lock ----
  /**
   * First-time vault creation.
   * @param {string} masterPassword
   * @returns {Promise<{ recoveryMnemonic: string }>} the recovery key — show once.
   */
  async setup(masterPassword) {
    assertStrongPassword(masterPassword);
    const salt = generateSalt();
    const kdfParams = await getRecommendedKdfParams();
    const dek = generateDek();
    const { kek: masterKek } = await deriveKek(masterPassword, salt, kdfParams);
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, salt);
    const wrappedMaster = await wrapKeyMaterial(dek, masterKek);
    const wrappedRecovery = await wrapKeyMaterial(dek, recoveryKek);
    secureWipe(masterKek, recoveryKek);
    this._dek = dek;
    this._dekKey = await importAesKey(dek, false);
    this._entries = [];
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._unlocked = true;
    this._payloadCache.clear();
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery,
      [STORAGE_KEYS.VAULT_DATA]: [],
      [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: APP.VAULT_FORMAT_VERSION, createdAt: nowIso() },
      [STORAGE_KEYS.SETUP_COMPLETE]: true
    });
    return { recoveryMnemonic };
  }
  /**
   * Initialize local storage from a remote sheet's key material and test decryption.
   * @param {string} masterPassword 
   * @param {Object} metadata The salt, wrappedMaster, and kdfParams from the sheet
   * @param {Array} entries The encrypted entries from the sheet
   */
  async restoreFromRemote(masterPassword, metadata, entries) {
    if (!metadata || !metadata.salt || !metadata.wrappedMaster) {
      throw new ValidationError("Remote vault does not contain valid key material");
    }
    const salt = base64ToBytes(metadata.salt);
    const kdfParams = metadata.kdfParams;
    const { kek } = await deriveKek(masterPassword, salt, kdfParams);
    let dek;
    try {
      dek = await unwrapKeyMaterial(metadata.wrappedMaster, kek);
    } catch (e) {
      secureWipe(kek);
      throw new DecryptionError("Incorrect master password for the remote vault");
    }
    secureWipe(kek);
    this._dek = dek;
    this._dekKey = await importAesKey(dek, false);
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._unlocked = true;
    this._payloadCache.clear();
    this._entries = await this._decryptRecords(entries || []);
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: metadata.salt,
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: metadata.wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: metadata.wrappedRecovery || "",
      [STORAGE_KEYS.VAULT_DATA]: entries || [],
      [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: metadata.formatVersion || APP.VAULT_FORMAT_VERSION, createdAt: nowIso() },
      [STORAGE_KEYS.SETUP_COMPLETE]: true
    });
  }
  /**
   * Unlock with the master password.
   * @param {string} masterPassword
   * @returns {Promise<void>}
   * @throws {DecryptionError} on wrong password
   */
  async unlock(masterPassword) {
    const c = await this._loadContainer();
    if (!c.salt || !c.wrappedMaster) throw new ValidationError("Vault is not initialized");
    const fails = await this.storage.get(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS) || 0;
    if (fails >= SECURITY.MAX_FAILED_UNLOCKS) {
      throw new Error(`Too many incorrect attempts. Vault has been reset for your security.`);
    }
    const { kek } = await deriveKek(masterPassword, c.salt, c.kdfParams);
    let dek;
    try {
      dek = await unwrapKeyMaterial(c.wrappedMaster, kek);
    } catch (e) {
      secureWipe(kek);
      const newFails = fails + 1;
      await this.storage.set({ [STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS]: newFails });
      if (newFails >= SECURITY.MAX_FAILED_UNLOCKS) {
        const keys = [...Object.values(STORAGE_KEYS), ...Object.keys(LEGACY_STORAGE_KEYS)];
        await this.storage.remove(keys);
        throw new DecryptionError(`Too many incorrect attempts. Vault has been completely wiped for security.`);
      } else if (newFails >= SECURITY.WARN_FAILED_UNLOCKS) {
        throw new DecryptionError(`Incorrect master PIN. WARNING: ${SECURITY.MAX_FAILED_UNLOCKS - newFails} attempts remaining before vault is wiped!`);
      }
      throw new DecryptionError("Incorrect master PIN");
    }
    secureWipe(kek);
    if (fails > 0) {
      await this.storage.remove(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS);
    }
    await this._activateWithDek(dek, c);
  }
  /**
   * Re-activate from a previously exported DEK (session re-unlock / biometric).
   * @param {Uint8Array} dekBytes
   */
  async unlockWithDek(dekBytes) {
    const c = await this._loadContainer();
    await this._activateWithDek(Uint8Array.from(dekBytes), c);
  }
  /** @private */
  async _activateWithDek(dek, container) {
    this._dekKey = await importAesKey(dek, false);
    this._dek = dek;
    this._salt = container.salt;
    this._kdfParams = container.kdfParams;
    this._payloadCache.clear();
    this._entries = await this._decryptRecords(container.records);
    this._unlocked = true;
  }
  /** Wipe all sensitive state from RAM. */
  lock() {
    secureWipe(this._dek);
    this._dek = null;
    this._dekKey = null;
    this._entries = [];
    this._salt = null;
    this._kdfParams = null;
    this._payloadCache.clear();
    this._unlocked = false;
  }
  /**
   * Copy of the raw DEK bytes (for session caching / biometric enrollment).
   * Caller MUST wipe the copy when done.
   * @returns {Uint8Array}
   */
  exportDek() {
    this._assertUnlocked();
    return Uint8Array.from(this._dek);
  }
  // ---- Recovery & key management ----
  /**
   * Recover the DEK using the recovery mnemonic. Leaves the vault unlocked.
   * The caller should immediately prompt for a new master password.
   * @param {string} mnemonic
   */
  async recoverWithMnemonic(mnemonic) {
    const c = await this._loadContainer();
    if (!c.salt || !c.wrappedRecovery) throw new ValidationError("No recovery key is configured");
    const recoveryKek = await deriveRecoveryKek(mnemonic, c.salt);
    let dek;
    try {
      dek = await unwrapKeyMaterial(c.wrappedRecovery, recoveryKek);
    } catch {
      secureWipe(recoveryKek);
      throw new DecryptionError("Recovery key did not match this vault");
    }
    secureWipe(recoveryKek);
    await this._activateWithDek(dek, c);
  }
  /**
   * Set a new master password (vault must be unlocked). Re-wraps the DEK under a
   * fresh salt; entry ciphertext is untouched.
   * @param {string} newPassword
   */
  async changeMasterPassword(newPassword) {
    this._assertUnlocked();
    assertStrongPassword(newPassword);
    const salt = this._salt || generateSalt();
    const kdfParams = this._kdfParams || await getRecommendedKdfParams();
    const { kek } = await deriveKek(newPassword, salt, kdfParams);
    const wrappedMaster = await wrapKeyMaterial(this._dek, kek);
    secureWipe(kek);
    this._salt = salt;
    this._kdfParams = kdfParams;
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster
    });
  }
  /**
   * Regenerate the recovery key (vault must be unlocked). Returns the new
   * mnemonic to display once. Invalidates any previous recovery key.
   * @returns {Promise<{ recoveryMnemonic: string }>}
   */
  async regenerateRecovery() {
    this._assertUnlocked();
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, this._salt);
    const wrappedRecovery = await wrapKeyMaterial(this._dek, recoveryKek);
    secureWipe(recoveryKek);
    await this.storage.set({ [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery });
    return { recoveryMnemonic };
  }
  /**
   * Full re-key: new DEK, re-encrypt every entry, re-wrap under master+recovery.
   * Requires the current master password. Returns a fresh recovery mnemonic.
   * @param {string} masterPassword
   * @returns {Promise<{ recoveryMnemonic: string }>}
   */
  async rekey(masterPassword) {
    this._assertUnlocked();
    const c = await this._loadContainer();
    const { kek: verifyKek } = await deriveKek(masterPassword, c.salt, c.kdfParams);
    try {
      const probe = await unwrapKeyMaterial(c.wrappedMaster, verifyKek);
      secureWipe(probe);
    } catch {
      secureWipe(verifyKek);
      throw new DecryptionError("Incorrect master password");
    }
    secureWipe(verifyKek);
    const newDek = generateDek();
    const salt = generateSalt();
    const kdfParams = await getRecommendedKdfParams();
    const { kek: masterKek } = await deriveKek(masterPassword, salt, kdfParams);
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, salt);
    const wrappedMaster = await wrapKeyMaterial(newDek, masterKek);
    const wrappedRecovery = await wrapKeyMaterial(newDek, recoveryKek);
    secureWipe(masterKek, recoveryKek, this._dek);
    this._dek = newDek;
    this._dekKey = await importAesKey(newDek, false);
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._payloadCache.clear();
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery
    });
    await this._persist();
    return { recoveryMnemonic };
  }
  // ---- CRUD ----
  /**
   * @param {Object} [filters]
   * @param {string} [filters.type]
   * @param {boolean} [filters.favoritesOnly]
   * @param {boolean} [filters.includeDeleted]
   * @returns {import('./schema.js').VaultEntry[]}
   */
  getEntries(filters = {}) {
    if (!this._unlocked) return [];
    let list = this._entries.filter((e) => filters.includeDeleted || !e.isDeleted);
    if (filters.type) list = list.filter((e) => e.entryType === filters.type);
    if (filters.favoritesOnly) list = list.filter((e) => e.isFavorite);
    list = list.slice().sort(entrySort);
    return list.map(deepClone);
  }
  getEntry(id) {
    if (!this._unlocked) return null;
    const e = this._entries.find((x) => x.id === id && !x.isDeleted);
    return e ? deepClone(e) : null;
  }
  _checkDuplicateName(siteName, excludeId = null) {
    const trimmed = (siteName || "").trim().toLowerCase();
    if (!trimmed) return;
    const exists = this._entries.some(
      (e) => !e.isDeleted && e.id !== excludeId && (e.siteName || "").trim().toLowerCase() === trimmed
    );
    if (exists) {
      throw new ValidationError("Name already exists");
    }
  }
  _checkDuplicateCredential(domain, username, excludeId = null) {
    const normDomain = (domain || "").trim().toLowerCase();
    const normUser = (username || "").trim().toLowerCase();
    if (!normDomain || !normUser) return;
    const exists = this._entries.some(
      (e) => !e.isDeleted && e.id !== excludeId && (e.domain || "").trim().toLowerCase() === normDomain && (e.username || "").trim().toLowerCase() === normUser
    );
    if (exists) {
      throw new ValidationError("A credential with this domain and username already exists");
    }
  }
  /** @param {Partial<import('./schema.js').VaultEntry>} data */
  async addEntry(data) {
    this._assertUnlocked();
    if (this._entries.filter((e) => !e.isDeleted).length >= APP.MAX_ENTRIES) {
      throw new ValidationError(`Maximum of ${APP.MAX_ENTRIES} entries reached`);
    }
    const entry = createEntry(
      { ...data, displayOrder: data.displayOrder ?? this._entries.length },
      generateUuid,
      nowIso
    );
    validateEntry(entry);
    this._checkDuplicateName(entry.siteName);
    this._checkDuplicateCredential(entry.domain, entry.username);
    this._entries.push(entry);
    await this._persist();
    return deepClone(entry);
  }
  async updateEntry(id, updates) {
    this._assertUnlocked();
    const e = this._entries.find((x) => x.id === id && !x.isDeleted);
    if (!e) throw new ValidationError("Entry not found");
    const merged = createEntry({ ...e, ...updates, id: e.id, createdAt: e.createdAt }, generateUuid, nowIso);
    merged.updatedAt = nowIso();
    merged.version = e.version + 1;
    validateEntry(merged);
    this._checkDuplicateName(merged.siteName, id);
    this._checkDuplicateCredential(merged.domain, merged.username, id);
    Object.assign(e, merged);
    await this._persist();
    return deepClone(e);
  }
  /** Soft-delete (tombstone retained for sync). */
  async deleteEntry(id) {
    this._assertUnlocked();
    const e = this._entries.find((x) => x.id === id);
    if (!e) throw new ValidationError("Entry not found");
    e.isDeleted = true;
    e.updatedAt = nowIso();
    e.version += 1;
    await this._persist();
  }
  async deleteEntries(ids) {
    this._assertUnlocked();
    const set2 = new Set(ids);
    let changed = false;
    for (const e of this._entries) {
      if (set2.has(e.id) && !e.isDeleted) {
        e.isDeleted = true;
        e.updatedAt = nowIso();
        e.version += 1;
        changed = true;
      }
    }
    if (changed) await this._persist();
  }
  /** Mark an entry used (updates lastUsedAt without bumping sync version). */
  async touchEntry(id) {
    if (!this._unlocked) return;
    const e = this._entries.find((x) => x.id === id);
    if (e) {
      e.lastUsedAt = nowIso();
      this._payloadCache.delete(id);
      await this._persist();
    }
  }
  async reorderEntries(orderUpdates) {
    this._assertUnlocked();
    for (const { id, displayOrder } of orderUpdates) {
      const e = this._entries.find((x) => x.id === id);
      if (e) {
        e.displayOrder = displayOrder;
        e.updatedAt = nowIso();
        e.version += 1;
      }
    }
    await this._persist();
  }
  /**
   * Search across cleartext + decrypted metadata fields.
   * @param {string} query
   */
  search(query) {
    if (!this._unlocked) return [];
    const q = String(query || "").trim().toLowerCase();
    if (!q) return this.getEntries();
    return this._entries.filter((e) => !e.isDeleted).filter(
      (e) => [e.domain, e.siteName, e.nickname, e.username, ...e.tags || []].filter(Boolean).join(" ").toLowerCase().includes(q)
    ).slice().sort(entrySort).map(deepClone);
  }
  /** All non-deleted passwords (for reuse detection in the generator). */
  allPasswords() {
    if (!this._unlocked) return [];
    return this._entries.filter((e) => !e.isDeleted && e.password).map((e) => e.password);
  }
  // ---- Sync surface ----
  /**
   * At-rest records (cleartext metadata + encrypted payload) for pushing to a
   * remote. Safe to transmit: payloads are ciphertext.
   * @returns {Promise<Array>}
   */
  async exportRecords() {
    this._assertUnlocked();
    await this._persist();
    const { [STORAGE_KEYS.VAULT_DATA]: records = [] } = await this.storage.get(STORAGE_KEYS.VAULT_DATA);
    return records;
  }
  /**
   * Merge remote records into the local vault (last-writer-wins by version then
   * updatedAt). Remote payloads are decrypted with the shared DEK.
   * @param {Array} remoteRecords
   * @returns {Promise<{ applied: number }>}
   */
  async mergeRemoteRecords(remoteRecords) {
    this._assertUnlocked();
    const byId = new Map(this._entries.map((e) => [e.id, e]));
    let applied = 0;
    for (const rec of remoteRecords || []) {
      if (!rec || !rec.id) continue;
      const local2 = byId.get(rec.id);
      const remoteNewer = !local2 || rec.version > local2.version || rec.version === local2.version && rec.updatedAt > local2.updatedAt;
      if (!remoteNewer) continue;
      const decoded = await this._recordToEntry(rec);
      if (!decoded) continue;
      if (local2) Object.assign(local2, decoded);
      else {
        this._entries.push(decoded);
        byId.set(decoded.id, decoded);
      }
      applied++;
    }
    if (applied) await this._persist();
    return { applied };
  }
  // ---- Persistence (private) ----
  /** @private */
  async _loadContainer() {
    const s = await this.storage.get([
      STORAGE_KEYS.VAULT_SALT,
      STORAGE_KEYS.KDF_PARAMS,
      STORAGE_KEYS.WRAPPED_BY_MASTER,
      STORAGE_KEYS.WRAPPED_BY_RECOVERY,
      STORAGE_KEYS.VAULT_DATA
    ]);
    return {
      salt: s[STORAGE_KEYS.VAULT_SALT] ? base64ToBytes(s[STORAGE_KEYS.VAULT_SALT]) : null,
      kdfParams: s[STORAGE_KEYS.KDF_PARAMS] || null,
      wrappedMaster: s[STORAGE_KEYS.WRAPPED_BY_MASTER] || null,
      wrappedRecovery: s[STORAGE_KEYS.WRAPPED_BY_RECOVERY] || null,
      records: s[STORAGE_KEYS.VAULT_DATA] || []
    };
  }
  /** @private Decrypt an array of at-rest records into full entries. */
  async _decryptRecords(records) {
    const out = [];
    for (const rec of records) {
      const entry = await this._recordToEntry(rec);
      if (entry) {
        out.push(entry);
        this._payloadCache.set(entry.id, { version: entry.version, record: rec });
      }
    }
    return out;
  }
  /** @private */
  async _recordToEntry(rec) {
    try {
      const payload = rec.payload ? await decryptJson(rec.payload, this._dekKey) : {};
      return createEntry(
        {
          ...payload,
          id: rec.id,
          domain: rec.domain,
          entryType: rec.entryType,
          version: rec.version,
          isDeleted: rec.isDeleted,
          updatedAt: rec.updatedAt,
          displayOrder: rec.displayOrder,
          isPinned: rec.isPinned,
          folder: rec.folder
        },
        generateUuid,
        nowIso
      );
    } catch {
      return null;
    }
  }
  /** @private Encrypt changed entries and persist the records array. */
  async _persist() {
    if (!this._dekKey) throw new VaultLockedError("Cannot persist a locked vault");
    const records = [];
    const liveIds = /* @__PURE__ */ new Set();
    for (const e of this._entries) {
      liveIds.add(e.id);
      const cached = this._payloadCache.get(e.id);
      if (cached && cached.version === e.version) {
        const rec2 = withMeta(e, cached.record.payload);
        records.push(rec2);
        continue;
      }
      const payload = await encryptJson(payloadFields(e), this._dekKey);
      const rec = withMeta(e, payload);
      records.push(rec);
      this._payloadCache.set(e.id, { version: e.version, record: rec });
    }
    for (const id of this._payloadCache.keys()) if (!liveIds.has(id)) this._payloadCache.delete(id);
    await this.storage.set({ [STORAGE_KEYS.VAULT_DATA]: records });
  }
  _assertUnlocked() {
    if (!this.isUnlocked()) throw new VaultLockedError();
  }
};
function entrySort(a, b) {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return (a.nickname || a.siteName || a.domain || "").localeCompare(b.nickname || b.siteName || b.domain || "");
}
function withMeta(entry, payload) {
  const rec = { payload };
  for (const k of META_KEYS) rec[k] = entry[k];
  return rec;
}
function payloadFields(entry) {
  const {
    siteName,
    nickname,
    tags,
    matchPatterns,
    isFavorite,
    createdAt,
    lastUsedAt,
    username,
    password,
    totpSecret,
    notes,
    customFields,
    schemaVersion
  } = entry;
  return {
    siteName,
    nickname,
    tags,
    matchPatterns,
    isFavorite,
    createdAt,
    lastUsedAt,
    username,
    password,
    totpSecret,
    notes,
    customFields,
    schemaVersion
  };
}
function assertStrongPassword(pw) {
  if (typeof pw !== "string" || pw.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) {
    throw new ValidationError(`Master PIN must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits`);
  }
  if (!/^\d+$/.test(pw)) {
    throw new ValidationError("Master PIN must contain only digits");
  }
}

// src/core/sync.js
var EPOCH = "1970-01-01T00:00:00.000Z";
var SyncEngine = class {
  /**
   * @param {import('./adapters.js').StorageAdapter} storage
   * @param {import('./adapters.js').NetworkAdapter} network
   */
  constructor(storage, network) {
    this.storage = storage;
    this.network = network;
  }
  // ---- Sheet profiles ----
  async getProfiles() {
    const { [STORAGE_KEYS.SHEETS_CONFIG]: sheets = [] } = await this.storage.get(STORAGE_KEYS.SHEETS_CONFIG);
    return sheets;
  }
  async getActiveProfile() {
    const sheets = await this.getProfiles();
    return sheets.find((s) => s.isActive) || sheets[0] || null;
  }
  async addProfile({ label: label2, appsScriptUrl, sheetId }) {
    const trimmedUrl = (appsScriptUrl || "").trim();
    if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
      throw new SyncError("Apps Script URL must start with https://script.google.com/", "BAD_URL");
    }
    const sheets = await this.getProfiles();
    if (sheets.length >= APP.MAX_SHEETS) throw new SyncError(`Maximum ${APP.MAX_SHEETS} vaults`, "MAX_SHEETS");
    const trimmedLabel = (label2 || `Vault ${sheets.length + 1}`).trim();
    const duplicateUrl = sheets.find((s) => s.appsScriptUrl.trim() === trimmedUrl);
    if (duplicateUrl) {
      throw new SyncError("A vault with this Apps Script URL already exists", "DUPLICATE_URL");
    }
    const duplicateLabel = sheets.find((s) => s.label.trim().toLowerCase() === trimmedLabel.toLowerCase());
    if (duplicateLabel) {
      throw new SyncError("A vault with this name already exists", "DUPLICATE_LABEL");
    }
    const profile = {
      id: generateUuid(),
      label: trimmedLabel.slice(0, 60),
      appsScriptUrl: trimmedUrl,
      sheetId: sheetId || "",
      isActive: sheets.length === 0,
      lastSyncAt: EPOCH
    };
    sheets.push(profile);
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    if (profile.isActive) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
    }
    return profile;
  }
  async updateProfile(id, patch) {
    const sheets = await this.getProfiles();
    const p = sheets.find((s) => s.id === id);
    if (!p) throw new SyncError("Profile not found", "NOT_FOUND");
    if (patch.label !== void 0) {
      const trimmedLabel = String(patch.label).trim();
      const duplicateLabel = sheets.find((s) => s.id !== id && s.label.trim().toLowerCase() === trimmedLabel.toLowerCase());
      if (duplicateLabel) throw new SyncError("A vault with this name already exists", "DUPLICATE_LABEL");
      p.label = trimmedLabel.slice(0, 60);
    }
    if (patch.appsScriptUrl !== void 0) {
      const trimmedUrl = String(patch.appsScriptUrl).trim();
      if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
        throw new SyncError("Apps Script URL must start with https://script.google.com/", "BAD_URL");
      }
      const duplicateUrl = sheets.find((s) => s.id !== id && s.appsScriptUrl.trim() === trimmedUrl);
      if (duplicateUrl) throw new SyncError("A vault with this Apps Script URL already exists", "DUPLICATE_URL");
      if (p.appsScriptUrl !== trimmedUrl) {
        p.appsScriptUrl = trimmedUrl;
        p.lastSyncAt = EPOCH;
        if (p.isActive) {
          await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
        }
      }
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    return p;
  }
  async removeProfile(id) {
    let sheets = await this.getProfiles();
    const wasActive = sheets.find((s) => s.id === id)?.isActive;
    sheets = sheets.filter((s) => s.id !== id);
    if (wasActive && sheets.length) {
      sheets[0].isActive = true;
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: sheets[0].lastSyncAt || EPOCH });
    } else if (wasActive && !sheets.length) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
  }
  async switchProfile(id) {
    const sheets = await this.getProfiles();
    let activeProfile = null;
    for (const s of sheets) {
      s.isActive = s.id === id;
      if (s.isActive) activeProfile = s;
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    if (activeProfile) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: activeProfile.lastSyncAt || EPOCH });
    }
  }
  // ---- Remote calls ----
  async _call(action, body) {
    const profile = await this.getActiveProfile();
    if (!profile?.appsScriptUrl) throw new SyncError("No vault sheet configured", "NO_PROFILE");
    const token = await this.network.getAuthToken();
    const url = `${profile.appsScriptUrl}?action=${encodeURIComponent(action)}`;
    let res;
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      res = await this.network.fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body || {})
      });
    } catch (e) {
      throw new SyncError(`Network error: ${e.message}`, "NETWORK");
    }
    if (!res.ok) throw new SyncError(`Server returned HTTP ${res.status}`, "HTTP");
    const json = await res.json();
    if (json.status !== "ok") throw new SyncError(json.message || "Sync failed", json.code || "REMOTE");
    return json;
  }
  /** Verify connectivity & auth. */
  async ping() {
    return this._call("ping", {});
  }
  /** Create/repair the Sheet tab structure. */
  async setupSheet() {
    return this._call("initVault", {});
  }
  /** Get or fetch unique folders list. */
  async getFolders(force = false) {
    const cached = await this.storage.get([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
    const list = cached[STORAGE_KEYS.CACHED_FOLDERS] || [];
    const time = cached[STORAGE_KEYS.FOLDERS_CACHE_TIME] || 0;
    const now = Date.now();
    const profile = await this.getActiveProfile();
    if (!profile?.appsScriptUrl) {
      return list;
    }
    if (force || !list.length || now - time > 24 * 60 * 60 * 1e3) {
      try {
        const result = await this._call("getFolders", {});
        if (result && result.folders) {
          await this.storage.set({
            [STORAGE_KEYS.CACHED_FOLDERS]: result.folders,
            [STORAGE_KEYS.FOLDERS_CACHE_TIME]: now
          });
          return result.folders;
        }
      } catch (e) {
        if (e?.code !== "NO_PROFILE") console.error("Failed to fetch folders:", e);
      }
    }
    return list;
  }
  /**
   * Push the (non-sensitive) key material so a new device can unlock from the
   * Sheet. wrappedMaster/wrappedRecovery are useless without the secrets.
   * @param {{salt:string,kdfParams:object,wrappedMaster:string,wrappedRecovery:string}} material
   */
  async pushKeyMaterial(material) {
    return this._call("saveMetadata", {
      metadata: {
        salt: material.salt,
        kdfParams: material.kdfParams,
        wrappedMaster: material.wrappedMaster,
        wrappedRecovery: material.wrappedRecovery,
        formatVersion: APP.VAULT_FORMAT_VERSION
      }
    });
  }
  /** Pull key material + records from the Sheet (device migration / first sync). */
  async pullVault() {
    return this._call("getVault", {});
  }
  /** Push non-sensitive user settings to the Sheet (feedback #14). */
  async pushSettings(settings2) {
    return this._call("saveSettings", { settings: settings2 });
  }
  /** Pull user settings from the Sheet. */
  async pullSettings() {
    const r = await this._call("settings", {});
    return r.settings || {};
  }
  /** Check version compatibility. */
  async checkVersion() {
    try {
      const r = await this._call("version", {});
      return {
        backendVersion: r.version,
        backendSchema: r.schemaVersion,
        localVersion: APP.APPSCRIPT_VERSION,
        localSchema: APP.SCHEMA_VERSION,
        mismatch: r.version !== APP.APPSCRIPT_VERSION || r.schemaVersion !== APP.SCHEMA_VERSION
      };
    } catch (e) {
      if (e.code === "NO_PROFILE") return { mismatch: false };
      throw e;
    }
  }
  /**
   * Fetch vault metadata (salt, kdfParams, wrappedMaster) from a sheet without needing an active profile.
   * Useful for "Restore from Sheet" flow and validating before blind sync.
   * @param {string} [explicitUrl] Optional URL. If omitted, uses the active profile.
   */
  async fetchMetadata(explicitUrl) {
    let url = explicitUrl;
    if (!url) {
      const profile = await this.getActiveProfile();
      if (!profile?.appsScriptUrl) throw new SyncError("No vault sheet configured", "NO_PROFILE");
      url = profile.appsScriptUrl;
    }
    const trimmedUrl = url.trim();
    if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
      throw new SyncError("Apps Script URL must start with https://script.google.com/", "BAD_URL");
    }
    const token = await this.network.getAuthToken();
    const endpoint = `${trimmedUrl}?action=metadata`;
    let res;
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      res = await this.network.fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({})
      });
    } catch (e) {
      throw new SyncError(`Network error: ${e.message}`, "NETWORK");
    }
    if (!res.ok) throw new SyncError(`Server returned HTTP ${res.status}`, "HTTP");
    const json = await res.json();
    if (json.status !== "ok") throw new SyncError(json.message || "Failed to fetch metadata", json.code || "REMOTE");
    return json.metadata || {};
  }
  /** Fetch Vault Dashboard Stats. */
  async fetchDashboard() {
    return this._call("dashboard", {});
  }
  /** Fetch Vault Analytics Stats. */
  async fetchAnalytics() {
    return this._call("analytics", {});
  }
  /**
   * Perform a delta sync for the given vault.
   * @param {import('./vault.js').Vault} vault unlocked vault
   * @returns {Promise<{ pushed:number, pulled:number, conflicts:number }>}
   */
  async sync(vault2) {
    const profile = await this.getActiveProfile();
    const { [STORAGE_KEYS.LAST_SYNC_AT]: globalLastSyncAt = EPOCH } = await this.storage.get(STORAGE_KEYS.LAST_SYNC_AT);
    const lastSyncAt = profile ? profile.lastSyncAt || EPOCH : globalLastSyncAt;
    const records = await vault2.exportRecords();
    const modified = records.filter((r) => (r.updatedAt || EPOCH) > lastSyncAt);
    let result;
    try {
      result = await this._call("syncEntries", { lastSyncAt, entries: modified });
    } catch (e) {
      await this._enqueue(modified);
      throw e;
    }
    const pulled = result.updatedEntries || [];
    const { applied } = await vault2.mergeRemoteRecords(pulled);
    const nextSyncAt = result.serverTimestamp || nowIso();
    if (profile) {
      profile.lastSyncAt = nextSyncAt;
      const sheets = await this.getProfiles();
      const idx = sheets.findIndex((s) => s.id === profile.id);
      if (idx !== -1) {
        sheets[idx] = profile;
        await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
      }
    }
    await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: nextSyncAt });
    return { pushed: modified.length, pulled: applied, conflicts: (result.conflicts || []).length };
  }
  // ---- Offline queue ----
  /** @private */
  async _enqueue(records) {
    if (!records?.length) return;
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.storage.get(STORAGE_KEYS.OFFLINE_QUEUE);
    queue.push({ id: generateUuid(), records, queuedAt: nowIso(), retryCount: 0 });
    await this.storage.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: queue });
  }
  /** Flush the offline queue; returns counts. */
  async flushQueue() {
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.storage.get(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!queue.length) return { processed: 0, dropped: 0, remaining: 0 };
    const remaining = [];
    let processed = 0;
    let dropped = 0;
    for (const item of queue) {
      if (item.retryCount >= SYNC.MAX_RETRIES) {
        dropped++;
        continue;
      }
      try {
        await this._call("syncEntries", { lastSyncAt: EPOCH, entries: item.records });
        processed++;
      } catch {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }
    await this.storage.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: remaining });
    return { processed, dropped, remaining: remaining.length };
  }
};

// src/core/password-generator.js
var LOWER = "abcdefghijklmnopqrstuvwxyz";
var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var DIGITS = "0123456789";
function randIntBelow(max) {
  if (max <= 0) throw new RangeError("max must be > 0");
  const limit = Math.floor(256 / max) * max;
  for (; ; ) {
    const b = randomBytes(1)[0];
    if (b < limit) return b % max;
  }
}
function pick(charset) {
  return charset[randIntBelow(charset.length)];
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randIntBelow(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function generatePassword(options = {}) {
  const length = Math.min(Math.max(options.length ?? PASSWORD_GEN.DEFAULT_LENGTH, 1), PASSWORD_GEN.MAX_LENGTH);
  const uppercase = options.uppercase ?? PASSWORD_GEN.DEFAULT_UPPERCASE;
  const lowercase = options.lowercase ?? PASSWORD_GEN.DEFAULT_LOWERCASE;
  const numbers2 = options.numbers ?? PASSWORD_GEN.DEFAULT_NUMBERS;
  const symbols = options.symbols ?? PASSWORD_GEN.DEFAULT_SYMBOLS;
  const symbolSet = options.symbolSet || PASSWORD_GEN.SYMBOL_SET;
  const classes = [];
  if (lowercase) classes.push(LOWER);
  if (uppercase) classes.push(UPPER);
  if (numbers2) classes.push(DIGITS);
  if (symbols) classes.push(symbolSet);
  if (classes.length === 0) classes.push(LOWER + UPPER + DIGITS);
  const charset = classes.join("");
  const chars = [];
  for (let i = 0; i < classes.length && i < length; i++) chars.push(pick(classes[i]));
  for (let i = chars.length; i < length; i++) chars.push(pick(charset));
  return shuffle(chars).join("");
}
function generatePassphrase(options = {}) {
  const words = Math.max(options.words ?? PASSWORD_GEN.PASSPHRASE_DEFAULT_WORDS, 1);
  const separator = options.separator ?? PASSWORD_GEN.PASSPHRASE_SEPARATOR;
  const capitalize = !!options.capitalize;
  const out = [];
  for (let i = 0; i < words; i++) {
    let w = wordlist[randIntBelow(wordlist.length)];
    if (capitalize) w = w[0].toUpperCase() + w.slice(1);
    out.push(w);
  }
  let phrase = out.join(separator);
  if (options.includeNumber) phrase += separator + randIntBelow(9e3) + 1e3;
  return phrase;
}
function passwordEntropyBits(password) {
  if (!password) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  if (pool === 0) return 0;
  return Math.round(password.length * Math.log2(pool));
}
function passphraseEntropyBits(wordCount, listSize = wordlist.length) {
  return Math.round(wordCount * Math.log2(listSize));
}
function strengthFromEntropy(bits) {
  let level;
  if (bits < 36) level = 1;
  else if (bits < 60) level = 2;
  else if (bits < 80) level = 3;
  else level = 4;
  return { level, label: ["", "Weak", "Fair", "Strong", "Very strong"][level] };
}
function analyzePassword(password) {
  const entropy = passwordEntropyBits(password);
  return { entropy, ...strengthFromEntropy(entropy) };
}

// src/core/totp.js
var BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(base32) {
  const cleaned = String(base32 || "").replace(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new ValidationError("Invalid Base32 character in TOTP secret");
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push(value >>> bits & 255);
    }
  }
  return new Uint8Array(out);
}
var HMAC_HASH = { "SHA-1": "SHA-1", SHA1: "SHA-1", "SHA-256": "SHA-256", SHA256: "SHA-256", "SHA-512": "SHA-512", SHA512: "SHA-512" };
async function hmac(keyBytes, msgBytes, algorithm) {
  const hash = HMAC_HASH[algorithm] || "SHA-1";
  const key = await globalThis.crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash }, false, ["sign"]);
  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, msgBytes));
}
function counterBytes(counter) {
  const buf = new Uint8Array(8);
  let n = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 255;
    n = Math.floor(n / 256);
  }
  return buf;
}
async function hotp(keyBytes, counter, digits = TOTP.DEFAULT_DIGITS, algorithm = TOTP.DEFAULT_ALGORITHM) {
  const hash = await hmac(keyBytes, counterBytes(counter), algorithm);
  const offset = hash[hash.length - 1] & 15;
  const bin = (hash[offset] & 127) << 24 | (hash[offset + 1] & 255) << 16 | (hash[offset + 2] & 255) << 8 | hash[offset + 3] & 255;
  return (bin % 10 ** digits).toString().padStart(digits, "0");
}
async function generateTOTP(secret, opts = {}) {
  const period = opts.period ?? TOTP.DEFAULT_PERIOD;
  const digits = opts.digits ?? TOTP.DEFAULT_DIGITS;
  const algorithm = opts.algorithm ?? TOTP.DEFAULT_ALGORITHM;
  const ts = opts.timestamp ?? Date.now();
  const seconds = Math.floor(ts / 1e3);
  const counter = Math.floor(seconds / period);
  const remaining = period - seconds % period;
  const code = await hotp(base32Decode(secret), counter, digits, algorithm);
  return { code, remaining, period };
}
function parseOtpAuthUri(uri) {
  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new ValidationError("Invalid otpauth URI");
  }
  if (url.protocol !== "otpauth:") throw new ValidationError("Not an otpauth URI");
  const type = url.hostname.toLowerCase();
  const label2 = decodeURIComponent(url.pathname.replace(/^\//, ""));
  let issuer = url.searchParams.get("issuer") || "";
  let account = label2;
  if (label2.includes(":")) {
    const [a, ...rest] = label2.split(":");
    if (!issuer) issuer = a.trim();
    account = rest.join(":").trim();
  }
  return {
    type,
    label: label2,
    issuer,
    account,
    secret: (url.searchParams.get("secret") || "").replace(/\s+/g, ""),
    period: parseInt(url.searchParams.get("period") || "30", 10),
    digits: parseInt(url.searchParams.get("digits") || "6", 10),
    algorithm: (url.searchParams.get("algorithm") || "SHA1").toUpperCase()
  };
}
function isValidTotpSecret(secret) {
  if (!secret || typeof secret !== "string") return false;
  const cleaned = secret.replace(/[\s=]/g, "").toUpperCase();
  return /^[A-Z2-7]+$/.test(cleaned) && cleaned.length >= 16;
}

// src/core/domain-matcher.js
var MULTI_LEVEL_SUFFIXES = /* @__PURE__ */ new Set([
  "co.uk",
  "org.uk",
  "me.uk",
  "gov.uk",
  "ac.uk",
  "co.jp",
  "or.jp",
  "ne.jp",
  "co.kr",
  "com.au",
  "net.au",
  "org.au",
  "gov.au",
  "edu.au",
  "co.nz",
  "org.nz",
  "govt.nz",
  "com.br",
  "com.cn",
  "com.tr",
  "com.mx",
  "com.ar",
  "com.sg",
  "com.hk",
  "com.tw",
  "co.in",
  "co.za",
  "co.id",
  "co.il",
  "com.sa",
  "com.ua",
  "co.th",
  "or.th"
]);
function extractDomain(input) {
  let hostname = input;
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) hostname = new URL(input).hostname;
    else hostname = new URL("https://" + input).hostname;
  } catch {
    return null;
  }
  hostname = hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":") || hostname === "localhost") {
    return hostname;
  }
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_LEVEL_SUFFIXES.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
  return lastTwo;
}
function normalizeDomain(input) {
  if (!input) return "";
  let host;
  try {
    host = new URL(input.includes("://") ? input : "https://" + input).hostname.toLowerCase();
  } catch {
    host = String(input).toLowerCase().replace(/^(https?:\/\/)?/, "").replace(/[/:?#].*$/, "");
  }
  return host.replace(/^www\./, "").replace(/\.$/, "").trim();
}
function getDisplayDomain(url) {
  try {
    let host = new URL(url.includes("://") ? url : "https://" + url).hostname.toLowerCase();
    host = host.replace(/^www\./, "").replace(/\.$/, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    const lastTwo = parts.slice(-2).join(".");
    if (MULTI_LEVEL_SUFFIXES.has(lastTwo)) {
      if (parts.length >= 4) {
        return parts.slice(0, -2).join(".");
      }
      return host;
    }
    if (parts.length >= 3) {
      return parts.slice(0, -1).join(".");
    }
    return host;
  } catch {
    return url;
  }
}
function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/\*/g, ".*");
  return new RegExp("^" + body + "$", "i");
}
function matchDomain(url, entries) {
  let hostname;
  let hostPath;
  try {
    const u = new URL(url.includes("://") ? url : "https://" + url);
    hostname = u.hostname.toLowerCase();
    hostPath = (hostname + u.pathname).replace(/\/$/, "");
  } catch {
    return [];
  }
  const root = extractDomain(url);
  if (!root) return [];
  const matches = [];
  for (const entry of entries) {
    if (!entry || !entry.domain) continue;
    const entryDomain = normalizeDomain(entry.domain);
    let confidence = 0;
    if (Array.isArray(entry.matchPatterns)) {
      for (const pat of entry.matchPatterns) {
        const normPat = pat.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
        if (globToRegExp(normPat).test(hostPath)) {
          confidence = Math.max(confidence, 100);
        }
      }
    }
    if (hostname === entryDomain || hostname.replace(/^www\./, "") === entryDomain) {
      confidence = Math.max(confidence, 95);
    } else if (root === entryDomain) {
      confidence = Math.max(confidence, 88);
    } else if (hostname.endsWith("." + entryDomain)) {
      confidence = Math.max(confidence, 80);
    } else if (entryDomain.endsWith("." + root)) {
      confidence = Math.max(confidence, 70);
    }
    if (confidence > 0) matches.push({ id: entry.id, domain: entry.domain, confidence });
  }
  matches.sort((a, b) => b.confidence - a.confidence || a.domain.localeCompare(b.domain));
  return matches;
}

// src/core/import-export.js
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h3) => h3.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h3, i) => row[h3] = (values[i] || "").trim());
    return row;
  });
}
var tag = (...t) => t.filter(Boolean);
function importChrome(csv) {
  return parseCsv(csv).map((r) => ({
    siteName: r.name || "",
    domain: normalizeDomain(r.url || ""),
    username: r.username || "",
    password: r.password || "",
    entryType: ENTRY_TYPES.PASSWORD,
    tags: tag("imported", "chrome"),
    notes: r.url && r.url !== `https://${normalizeDomain(r.url)}` ? `Original URL: ${r.url}` : ""
  })).filter((e) => e.domain || e.siteName);
}
function importLastPass(csv) {
  return parseCsv(csv).map((r) => ({
    siteName: r.name || "",
    domain: normalizeDomain(r.url || ""),
    username: r.username || "",
    password: r.password || "",
    totpSecret: r.totp || "",
    entryType: r.totp ? ENTRY_TYPES.PASSWORD : ENTRY_TYPES.PASSWORD,
    tags: tag("imported", "lastpass", r.grouping),
    notes: r.extra || "",
    isFavorite: r.fav === "1"
  })).filter((e) => e.domain || e.siteName);
}
function importZohoVault(csv) {
  return parseCsv(csv).map((r) => ({
    siteName: r.secretname || r.name || "",
    domain: normalizeDomain(r.secreturl || r.url || ""),
    username: r.username || "",
    password: r.password || "",
    entryType: ENTRY_TYPES.PASSWORD,
    tags: tag("imported", "zoho", ...r.tags ? r.tags.split(";").map((t) => t.trim()) : []),
    notes: r.notes || ""
  })).filter((e) => e.domain || e.siteName);
}
function importBitwarden(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.encrypted) throw new Error("Encrypted Bitwarden exports are not supported \u2014 export as unencrypted JSON");
  return (data.items || []).filter((it) => it.type === 1 || it.login).map((it) => {
    const login = it.login || {};
    const uri = (login.uris || [])[0]?.uri || "";
    return {
      siteName: it.name || "",
      domain: uri ? normalizeDomain(uri) : "",
      username: login.username || "",
      password: login.password || "",
      totpSecret: login.totp || "",
      entryType: login.totp ? ENTRY_TYPES.PASSWORD : ENTRY_TYPES.PASSWORD,
      tags: tag("imported", "bitwarden"),
      notes: it.notes || "",
      isFavorite: !!it.favorite,
      customFields: (it.fields || []).map((f) => ({ label: f.name || "", value: f.value || "", hidden: f.type === 1 }))
    };
  }).filter((e) => e.domain || e.siteName);
}
function importOtpAuthUris(text) {
  const matches = String(text).match(/otpauth:\/\/totp\/[^\s"']+/g) || [];
  return matches.map((uri) => {
    try {
      const p = parseOtpAuthUri(uri);
      return {
        siteName: p.issuer || p.account || "",
        domain: p.issuer ? normalizeDomain(p.issuer) : "",
        username: p.account || "",
        totpSecret: p.secret,
        entryType: ENTRY_TYPES.TOTP,
        tags: tag("imported", "authenticator"),
        notes: p.issuer ? `Issuer: ${p.issuer}` : ""
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
}
function importOkeyBackup(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.format !== "okey") throw new Error("Not an OKey backup file");
  return data;
}
function csvCell(value) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
function exportCsv(entries) {
  const headers = ["Site Name", "Domain", "Username", "Password", "TOTP Secret", "Notes", "Tags", "Type"];
  const rows = entries.filter((e) => !e.isDeleted).map(
    (e) => [e.siteName, e.domain, e.username, e.password, e.totpSecret, e.notes, (e.tags || []).join("; "), e.entryType].map(csvCell).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
function exportBitwardenJson(entries) {
  const items = entries.filter((e) => !e.isDeleted).map((e) => ({
    type: 1,
    name: e.siteName || e.domain || "Untitled",
    notes: e.notes || null,
    favorite: !!e.isFavorite,
    login: {
      uris: e.domain ? [{ match: null, uri: `https://${e.domain}` }] : [],
      username: e.username || null,
      password: e.password || null,
      totp: e.totpSecret || null
    },
    fields: (e.customFields || []).map((f) => ({ name: f.label, value: f.value, type: f.hidden ? 1 : 0 }))
  }));
  return JSON.stringify({ encrypted: false, folders: [], items }, null, 2);
}
function exportOkeyBackup({ salt, kdfParams, wrappedMaster, wrappedRecovery, records }) {
  return JSON.stringify(
    { format: "okey", version: 2, exportedAt: nowIso(), salt, kdfParams, wrappedMaster, wrappedRecovery, records },
    null,
    2
  );
}

// src/extension/lib/platform.js
var ChromeStorageAdapter = class {
  constructor(area = "local") {
    this.area = chrome.storage[area];
  }
  get(keys) {
    return this.area.get(keys);
  }
  set(items) {
    return this.area.set(items);
  }
  remove(keys) {
    return this.area.remove(keys);
  }
};
var chromeNetwork = {
  fetch: (url, init) => fetch(url, init),
  async getAuthToken(interactive = false) {
    try {
      const result = await chrome.identity.getAuthToken({ interactive });
      return typeof result === "string" ? result : result?.token || null;
    } catch {
      return null;
    }
  }
};

// src/extension/lib/messages.js
var MSG = Object.freeze({
  // Vault lifecycle (status is derived from session presence)
  VAULT_LOCKED: "VAULT_LOCKED",
  LOCK_VAULT: "LOCK_VAULT",
  UNLOCK_VAULT: "UNLOCK_VAULT",
  // Settings
  GET_SETTINGS: "GET_SETTINGS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  // Clipboard
  COPY_TO_CLIPBOARD: "COPY_TO_CLIPBOARD",
  // Sync
  TRIGGER_SYNC: "TRIGGER_SYNC",
  RESCHEDULE_SYNC: "RESCHEDULE_SYNC",
  SYNC_COMPLETE: "SYNC_COMPLETE",
  SYNC_ERROR: "SYNC_ERROR",
  // Site detection / autofill
  GET_CURRENT_SITE: "GET_CURRENT_SITE",
  GET_SITE_CREDENTIALS: "GET_SITE_CREDENTIALS",
  FILL_CREDENTIAL: "FILL_CREDENTIAL",
  OPEN_POPUP: "OPEN_POPUP",
  TOUCH_SESSION: "TOUCH_SESSION",
  ADD_CREDENTIAL: "ADD_CREDENTIAL",
  // Autofill session tracking
  SET_ACTIVE_FILLING_SESSION: "SET_ACTIVE_FILLING_SESSION",
  GET_ACTIVE_FILLING_SESSION: "GET_ACTIVE_FILLING_SESSION",
  CLEAR_ACTIVE_FILLING_SESSION: "CLEAR_ACTIVE_FILLING_SESSION"
});

// src/extension/lib/session.js
var K = {
  DEK: "okey_session_dek",
  EXPIRY: "okey_session_expiry",
  MINI_EXPIRY: "okey_session_mini_expiry",
  VIEW: "okey_session_view",
  POPUP_OPEN: "okey_popup_open"
};
async function cacheDek(dekBytes, autoLockSeconds) {
  const sStore = await chrome.storage.local.get("okey_settings");
  const settings2 = sStore["okey_settings"] || {};
  const extSeconds = clamp(settings2.autoLockTimeout || autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const miniSeconds = Number(settings2.miniAutoLockTimeout) || 300;
  const now = Date.now();
  await chrome.storage.session.set({
    [K.DEK]: bytesToBase64(dekBytes),
    [K.EXPIRY]: now + extSeconds * 1e3,
    [K.MINI_EXPIRY]: now + miniSeconds * 1e3
  });
  const delaySeconds = Math.min(extSeconds, miniSeconds);
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delaySeconds / 60 });
}
async function touchSession(type = "extension") {
  let viewType = type;
  if (typeof type === "number") {
    viewType = "extension";
  }
  const sStore = await chrome.storage.local.get("okey_settings");
  const settings2 = sStore["okey_settings"] || {};
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  if (!s[K.DEK]) return false;
  const now = Date.now();
  const exp = s[K.EXPIRY] || 0;
  const miniExp = s[K.MINI_EXPIRY] || 0;
  if (now >= exp && now >= miniExp) {
    await clearSession();
    return false;
  }
  const autoLockSeconds = viewType === "mini" ? settings2.miniAutoLockTimeout || 300 : settings2.autoLockTimeout || SECURITY.DEFAULT_AUTO_LOCK_SECONDS;
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const newExpiry = now + seconds * 1e3;
  const update = {};
  if (viewType === "mini") {
    update[K.MINI_EXPIRY] = newExpiry;
  } else {
    update[K.EXPIRY] = newExpiry;
  }
  await chrome.storage.session.set(update);
  const finalExp = viewType === "mini" ? exp : newExpiry;
  const finalMiniExp = viewType === "mini" ? newExpiry : miniExp;
  const nextTarget = [];
  if (finalExp > now) nextTarget.push(finalExp);
  if (finalMiniExp > now) nextTarget.push(finalMiniExp);
  if (nextTarget.length > 0) {
    const earliest = Math.min(...nextTarget);
    const delayMinutes = Math.max(0.1, (earliest - now) / 6e4);
    await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delayMinutes });
  }
  return true;
}
async function getCachedDek(type = "extension") {
  let viewType = type;
  if (typeof type === "number") {
    viewType = "extension";
  }
  const sStore = await chrome.storage.local.get("okey_settings");
  const settings2 = sStore["okey_settings"] || {};
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  if (!s[K.DEK]) return null;
  const now = Date.now();
  const expiryKey = viewType === "mini" ? K.MINI_EXPIRY : K.EXPIRY;
  const exp = s[expiryKey] || 0;
  if (exp && now >= exp) {
    const otherExpiryKey = viewType === "mini" ? K.EXPIRY : K.MINI_EXPIRY;
    const otherExp = s[otherExpiryKey] || 0;
    if (now >= otherExp) {
      await clearSession();
    }
    return null;
  }
  const autoLockSeconds = viewType === "mini" ? settings2.miniAutoLockTimeout || 300 : settings2.autoLockTimeout || SECURITY.DEFAULT_AUTO_LOCK_SECONDS;
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const newExpiry = now + seconds * 1e3;
  const update = { [expiryKey]: newExpiry };
  await chrome.storage.session.set(update);
  const finalExp = viewType === "mini" ? s[K.EXPIRY] || 0 : newExpiry;
  const finalMiniExp = viewType === "mini" ? newExpiry : s[K.MINI_EXPIRY] || 0;
  const nextTarget = [];
  if (finalExp > now) nextTarget.push(finalExp);
  if (finalMiniExp > now) nextTarget.push(finalMiniExp);
  if (nextTarget.length > 0) {
    const earliest = Math.min(...nextTarget);
    const delayMinutes = Math.max(0.1, (earliest - now) / 6e4);
    await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delayMinutes });
  }
  return base64ToBytes(s[K.DEK]);
}
async function clearSession() {
  await chrome.storage.session.remove([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  await chrome.alarms.clear(SYNC.AUTO_LOCK_ALARM);
}
async function saveViewState(state) {
  await chrome.storage.session.set({ [K.VIEW]: state });
}
async function getViewState() {
  return (await chrome.storage.session.get(K.VIEW))[K.VIEW] || null;
}
async function setPopupOpen(open) {
  if (open) await chrome.storage.session.set({ [K.POPUP_OPEN]: Date.now() });
  else await chrome.storage.session.remove(K.POPUP_OPEN);
}
function clamp(n, lo, hi) {
  return Math.min(Math.max(Number(n) || lo, lo), hi);
}

// src/extension/popup/popup.js
var local = new ChromeStorageAdapter("local");
var vault = new Vault(local);
var sync = new SyncEngine(local, chromeNetwork);
var app = document.getElementById("app");
var settings = { ...DEFAULT_SETTINGS };
var currentSite = { url: "", title: "", domain: "" };
var view = { name: "loading", tab: "all", entryId: null };
var totpTimer = null;
var selectMode = false;
var selected = /* @__PURE__ */ new Set();
var lastActivityTouch = 0;
var syncStatus = "idle";
var backendVersionMismatch = false;
var backendCapabilities = {};
var dashboardData = null;
async function loadStartupData() {
  const profile = await sync.getActiveProfile();
  if (!profile?.appsScriptUrl) return;
  try {
    const cached = await local.get([
      STORAGE_KEYS.BACKEND_VERSION_MISMATCH,
      STORAGE_KEYS.BACKEND_CAPABILITIES,
      STORAGE_KEYS.BACKEND_DASHBOARD
    ]);
    backendVersionMismatch = cached[STORAGE_KEYS.BACKEND_VERSION_MISMATCH] || false;
    backendCapabilities = cached[STORAGE_KEYS.BACKEND_CAPABILITIES] || {};
    dashboardData = cached[STORAGE_KEYS.BACKEND_DASHBOARD] || null;
    if (view.name === "main") {
      renderMain();
    }
    const [ver, cfg, dash, remoteSettings, health] = await Promise.all([
      sync.checkVersion().catch((err) => {
        console.error("Version check error:", err);
        return null;
      }),
      sync._call("config").catch((err) => {
        console.error("Config check error:", err);
        return null;
      }),
      sync.fetchDashboard().catch((err) => {
        console.error("Dashboard fetch error:", err);
        return null;
      }),
      sync.pullSettings().catch((err) => {
        console.error("Settings pull error:", err);
        return null;
      }),
      sync._call("health").catch((err) => {
        console.error("Health check error:", err);
        return null;
      })
    ]);
    if (ver) {
      backendVersionMismatch = ver.mismatch;
      await local.set({ [STORAGE_KEYS.BACKEND_VERSION_MISMATCH]: backendVersionMismatch });
    }
    if (cfg) {
      backendCapabilities = cfg.features || {};
      await local.set({ [STORAGE_KEYS.BACKEND_CAPABILITIES]: backendCapabilities });
    }
    if (dash) {
      dashboardData = dash;
      await local.set({ [STORAGE_KEYS.BACKEND_DASHBOARD]: dashboardData });
    }
    if (remoteSettings) {
      settings = { ...settings, ...remoteSettings };
      await local.set({ [STORAGE_KEYS.SETTINGS]: settings });
      await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings }).catch(() => {
      });
      if (typeof applyTheme === "function") applyTheme(settings.theme);
    }
    if (health) {
      await local.set({ "okey_backend_health": health });
    }
    if (view.name === "main") {
      renderMain();
    }
  } catch (e) {
    console.error("Startup sync error:", e);
  }
}
async function refreshDashboardAfterSync() {
  try {
    const dash = await sync.fetchDashboard();
    if (dash) {
      dashboardData = dash;
      await local.set({ [STORAGE_KEYS.BACKEND_DASHBOARD]: dashboardData });
      if (view.name === "main") {
        renderMain();
      }
    }
  } catch (e) {
    console.error("Failed to refresh dashboard stats after sync:", e);
  }
}
function updateSyncUI(status) {
  syncStatus = status;
  const dot = document.querySelector(".okey-sync-dot");
  if (dot) {
    dot.className = "okey-sync-dot " + (status === "idle" ? "" : status);
  }
}
function h(tag2, props = {}, ...kids) {
  const e = document.createElement(tag2);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (k === "attrs") for (const [a, av] of Object.entries(v)) e.setAttribute(a, av);
    else if (v !== null && v !== void 0 && v !== false) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  if (tag2 === "input" && e.getAttribute("inputmode") === "numeric" && e.getAttribute("maxlength") === "4") {
    e.addEventListener("input", () => {
      e.value = e.value.replace(/[^0-9]/g, "").slice(0, 4);
    });
  }
  return e;
}
var clear = (node) => {
  node.replaceChildren();
};
var ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="4" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" stroke-width="2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13h10l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  import: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A.5.5 0 0 0 6.33 14h11.34a.5.5 0 0 0 .42-.56l-1.78-.89A2 2 0 0 1 15 10.76V7h-6v3.76zM15 3H9v4h6V3z"/></svg>'
};
function toast(message, type = "info") {
  let c = document.querySelector(".vs-toast-container");
  if (!c) {
    c = h("div", { class: "vs-toast-container" });
    document.body.append(c);
  } else {
    document.body.append(c);
  }
  const t = h("div", { class: `vs-toast vs-toast-${type}` }, message);
  c.append(t);
  setTimeout(() => {
    t.classList.add("vs-toast-exit");
    t.addEventListener("animationend", () => t.remove());
  }, 2600);
}
async function copyValue(text, label2 = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    chrome.runtime.sendMessage({ type: MSG.COPY_TO_CLIPBOARD }).catch(() => {
    });
    toast(`${label2} \xB7 clears in ${settings.clipboardClearTimeout}s`, "success");
  } catch {
    toast("Copy failed", "error");
  }
}
async function faviconFor(domain) {
  if (!settings.faviconsEnabled || !domain) return null;
  const key = STORAGE_KEYS.FAVICON_CACHE;
  const cache = (await local.get(key))[key] || {};
  const hit = cache[domain];
  if (hit && hit.dataUrl && Date.now() - hit.fetchedAt < FAVICON.REFRESH_AFTER_MS) return hit.dataUrl;
  try {
    const res = await fetch(`${FAVICON.PROVIDER}?domain=${encodeURIComponent(domain)}&sz=${FAVICON.SIZE}`);
    if (!res.ok) throw new Error("favicon http");
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve2, reject) => {
      const r = new FileReader();
      r.onload = () => resolve2(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    cache[domain] = { dataUrl, fetchedAt: Date.now() };
    await local.set({ [key]: cache });
    return dataUrl;
  } catch {
    return hit?.dataUrl || null;
  }
}
function initialLetter(entry) {
  const src = entry.nickname || entry.siteName || "";
  if (src) return src.trim()[0].toUpperCase();
  const d = (entry.domain || "").replace(/^www\./, "");
  if (d) return d[0].toUpperCase();
  return "?";
}
function avatarEl(entry) {
  const av = h("div", { class: "vs-avatar" }, initialLetter(entry));
  if (settings.faviconsEnabled && entry.domain) {
    faviconFor(entry.domain).then((url) => {
      if (url) {
        clear(av);
        av.append(h("img", { src: url, alt: "", attrs: { loading: "lazy" } }));
      }
    });
  }
  return av;
}
async function rememberView(patch = {}) {
  await saveViewState({ name: view.name, tab: view.tab, entryId: view.entryId || null, ...patch });
}
async function restoreSavedView(saved) {
  if (saved?.tab) view.tab = saved.tab;
  switch (saved?.name) {
    case "detail":
      return saved.entryId ? renderDetail(saved.entryId) : renderMain();
    case "edit":
      return renderEdit(saved.entryId || null, saved.draft || null, saved.scrollTop || 0);
    case "settings":
      return renderSettings(saved.scrollTop || 0);
    case "generator":
      return renderGenerator(saved.generator || null);
    case "main":
    default:
      return renderMain();
  }
}
function bindActivityTracking() {
  const markActive = () => {
    if (!vault.isUnlocked()) return;
    const now = Date.now();
    if (now - lastActivityTouch < 5e3) return;
    lastActivityTouch = now;
    touchSession(settings.autoLockTimeout).catch(() => {
    });
  };
  ["pointerdown", "keydown", "input", "scroll"].forEach((eventName) => {
    window.addEventListener(eventName, markActive, true);
  });
}
async function boot() {
  await setPopupOpen(true);
  window.addEventListener("pagehide", () => setPopupOpen(false));
  setInterval(() => setPopupOpen(true), 15e3);
  bindActivityTracking();
  settings = (await chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }).catch(() => null))?.settings || { ...DEFAULT_SETTINGS };
  applyTheme(settings.theme);
  currentSite = await chrome.runtime.sendMessage({ type: MSG.GET_CURRENT_SITE }).catch(() => ({})) || {};
  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === MSG.VAULT_LOCKED) {
      vault.lock();
      renderLocked();
    }
  });
  const state = await vault.getState();
  if (!state.isSetup) return renderSetup();
  const dek = await getCachedDek(settings.autoLockTimeout);
  if (dek) {
    try {
      await vault.unlockWithDek(dek);
      dek.fill(0);
      const saved = await getViewState();
      if (saved?.tab) view.tab = saved.tab;
      showFloatingLock();
      loadStartupData().catch((err) => console.error("loadStartupData error:", err));
      return restoreSavedView(saved);
    } catch {
    }
  }
  renderLocked();
}
function applyTheme(theme) {
  const resolved = theme === "system" ? matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}
function renderSetup() {
  view.name = "setup";
  hideFloatingLock();
  clear(app);
  app.append(h(
    "div",
    { class: "okey-view okey-setup-choice" },
    h(
      "div",
      { style: "margin: auto 0; display: flex; flex-direction: column; gap: 12px;" },
      brandHeader(),
      h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Create new vault", onclick: renderCreateVaultSetup }),
      h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", style: "margin-top:4px", text: "Restore from Google Sheet", onclick: renderRestoreFromSheet }),
      h("button", { class: "vs-btn vs-btn-ghost vs-btn-block", style: "margin-top:4px", text: "Restore from Backup file", onclick: renderRestoreVaultSetup }),
      h("p", { class: "vs-faint", text: "Restore from Sheet connects an existing vault to this device. CSV imports can be added later from Settings." })
    )
  ));
}
function renderCreateVaultSetup() {
  view.name = "setup-create";
  clear(app);
  const pw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Create 4-digit master PIN", autofocus: true });
  const pw2 = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Confirm 4-digit master PIN" });
  const btn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Create vault" });
  pw.addEventListener("input", () => {
    if (pw.value.length === 4) pw2.focus();
  });
  pw2.addEventListener("input", () => {
    if (pw2.value.length === 4 && pw.value === pw2.value) btn.click();
  });
  const wrap = h(
    "div",
    { class: "okey-view" },
    viewHeader("Create vault", renderSetup),
    h(
      "div",
      { style: "margin: auto 0; display: flex; flex-direction: column; gap: 12px;" },
      h("p", { class: "vs-muted", text: "Your 4-digit Master PIN encrypts everything locally. We never store it and it can never be recovered. Keep it safe." }),
      h("div", { class: "vs-field" }, pw),
      h("div", { class: "vs-field" }, pw2),
      btn
    )
  );
  app.append(wrap);
  btn.addEventListener("click", async () => {
    if (pw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`At least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits required`, "error");
    if (pw.value !== pw2.value) return toast("PINs do not match", "error");
    btn.disabled = true;
    btn.textContent = "Creating\u2026";
    try {
      const { recoveryMnemonic } = await vault.setup(pw.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      renderRecoveryReveal(recoveryMnemonic, () => renderMain());
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Create vault";
      toast(e.message, "error");
    }
  });
}
function renderRestoreFromSheet() {
  view.name = "setup-restore-sheet";
  clear(app);
  const url = h("input", { class: "vs-input", type: "text", placeholder: "Apps Script URL" });
  const pw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Master PIN" });
  const btn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Connect & Restore" });
  pw.addEventListener("input", () => {
    if (pw.value.length === 4) btn.click();
  });
  btn.addEventListener("click", async () => {
    if (!url.value || !pw.value) return toast("Fill all fields", "error");
    btn.disabled = true;
    btn.textContent = "Connecting...";
    try {
      const trimmedUrl = url.value.trim();
      const meta = await sync.fetchMetadata(trimmedUrl);
      if (!meta || !meta.salt) throw new Error("No vault data found on this sheet.");
      const profile = await sync.addProfile({ label: "Restored Vault", appsScriptUrl: trimmedUrl });
      const remoteData = await sync.pullVault();
      await vault.restoreFromRemote(pw.value, remoteData.metadata, remoteData.entries);
      const remoteSettings = await sync.pullSettings().catch(() => null);
      if (remoteSettings) {
        settings = { ...settings, ...remoteSettings };
        await local.set({ [STORAGE_KEYS.SETTINGS]: settings });
        await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings }).catch(() => {
        });
        if (typeof applyTheme === "function") applyTheme(settings.theme);
      }
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      toast("Vault restored successfully", "success");
      renderMain();
    } catch (e) {
      const profiles = await sync.getProfiles();
      const p = profiles.find((x) => x.appsScriptUrl === url.value.trim());
      if (p) await sync.removeProfile(p.id);
      btn.disabled = false;
      btn.textContent = "Connect & Restore";
      toast(e.message, "error");
    }
  });
  const viewEl = h(
    "div",
    { class: "okey-view" },
    viewHeader("Restore from Sheet", renderSetup),
    h(
      "div",
      { style: "margin: auto 0; display: flex; flex-direction: column; gap: 12px;" },
      h("p", { class: "vs-faint", style: "margin-bottom:12px" }, "Connect to an existing Google Sheet to sync your vault to this device."),
      h("div", { class: "vs-field" }, label("Apps Script URL"), url),
      h("div", { class: "vs-field" }, label("Master PIN"), pw),
      btn
    )
  );
  app.append(viewEl);
}
function renderRestoreVaultSetup() {
  view.name = "setup-restore";
  clear(app);
  const file = h("input", { type: "file", accept: ".json,application/json" });
  const master = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Old master PIN" });
  const recovery = h("textarea", { class: "vs-textarea", rows: 3, placeholder: "Or paste 24-word recovery key" });
  const newPw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "New master PIN after recovery" });
  const meter = strengthMeter();
  newPw.addEventListener("input", () => {
    meter.update(newPw.value);
    if (newPw.value.length === 4) btn.click();
  });
  master.addEventListener("input", () => {
    if (master.value.length === 4) recovery.focus();
  });
  const btn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Restore vault" });
  btn.addEventListener("click", async () => {
    const chosen = file.files[0];
    if (!chosen) return toast("Choose an encrypted OKey backup", "error");
    btn.disabled = true;
    btn.textContent = "Restoring...";
    try {
      const backup = importOkeyBackup(await chosen.text());
      await installOkeyBackup(backup);
      if (master.value) {
        await vault.unlock(master.value);
      } else {
        if (!recovery.value.trim()) throw new Error("Enter the old master PIN or recovery key");
        if (newPw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) throw new Error(`New PIN must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits`);
        await vault.recoverWithMnemonic(recovery.value);
        await vault.changeMasterPassword(newPw.value);
      }
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      toast("Vault restored", "success");
      renderMain();
    } catch (e) {
      await clearRestoredContainer();
      btn.disabled = false;
      btn.textContent = "Restore vault";
      toast(e.code === "DECRYPTION_FAILED" ? "Backup could not be unlocked" : e.message || "Restore failed", "error");
    }
  });
  const settingsView = h(
    "div",
    { class: "okey-view" },
    viewHeader("Restore vault", renderSetup),
    h(
      "div",
      { style: "margin: auto 0; display: flex; flex-direction: column; gap: 12px;" },
      h("div", { class: "vs-field" }, label("Encrypted OKey backup"), file),
      h("div", { class: "vs-field" }, label("Old master PIN", true), master),
      h("div", { class: "vs-field" }, label("Recovery key", true), recovery),
      h("div", { class: "vs-field" }, label("New master PIN", true), newPw, meter.el),
      btn
    )
  );
  app.append(settingsView);
}
async function installOkeyBackup(backup) {
  if (!backup?.salt || !backup?.kdfParams || !backup?.wrappedMaster || !Array.isArray(backup.records)) {
    throw new Error("Backup is missing required encrypted vault data");
  }
  await local.set({
    [STORAGE_KEYS.VAULT_SALT]: backup.salt,
    [STORAGE_KEYS.KDF_PARAMS]: backup.kdfParams,
    [STORAGE_KEYS.WRAPPED_BY_MASTER]: backup.wrappedMaster,
    [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: backup.wrappedRecovery || null,
    [STORAGE_KEYS.VAULT_DATA]: backup.records,
    [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: backup.version || 2, restoredAt: (/* @__PURE__ */ new Date()).toISOString() },
    [STORAGE_KEYS.SETUP_COMPLETE]: true
  });
}
async function clearRestoredContainer() {
  vault.lock();
  await local.remove([
    STORAGE_KEYS.VAULT_SALT,
    STORAGE_KEYS.KDF_PARAMS,
    STORAGE_KEYS.WRAPPED_BY_MASTER,
    STORAGE_KEYS.WRAPPED_BY_RECOVERY,
    STORAGE_KEYS.VAULT_DATA,
    STORAGE_KEYS.VAULT_METADATA,
    STORAGE_KEYS.SETUP_COMPLETE
  ]);
}
function renderRecoveryReveal(mnemonic, done) {
  clear(app);
  const words = mnemonic.split(" ");
  const grid = h(
    "div",
    { class: "okey-recovery-grid" },
    words.map((w, i) => h("div", { class: "okey-recovery-word" }, h("b", { text: String(i + 1) }), w))
  );
  const ack = h("input", { type: "checkbox", class: "okey-checkbox" });
  const cont = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", disabled: true, text: "Continue" });
  ack.addEventListener("change", () => cont.disabled = !ack.checked);
  app.append(h(
    "div",
    { class: "okey-view" },
    h("div", { class: "okey-view-title", text: "Your Recovery Key" }),
    h("div", { class: "okey-warn", text: "These 24 words are the ONLY way to recover your vault if you forget your master PIN. Write them down and store them offline. Anyone with these words can access your vault." }),
    grid,
    h(
      "div",
      { class: "vs-row" },
      h("button", { class: "vs-btn vs-btn-secondary", text: "Copy", onclick: () => copyValue(mnemonic, "Recovery key copied") }),
      h("button", { class: "vs-btn vs-btn-secondary", text: "Download", onclick: () => download("okey-recovery-key.txt", mnemonic) })
    ),
    h("label", { class: "vs-row", style: "margin:14px 0" }, ack, h("span", { text: "I've saved my recovery key somewhere safe" })),
    cont
  ));
  cont.addEventListener("click", done);
}
function renderLocked() {
  clearInterval(totpTimer);
  document.getElementById("okey-lock-overlay")?.remove();
  hideFloatingLock();
  const pw = h("input", { class: "vs-input okey-lock-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Master PIN", autofocus: true });
  const btn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Unlock" });
  const submit = async () => {
    if (!pw.value) return;
    btn.disabled = true;
    btn.textContent = "Unlocking\u2026";
    try {
      await vault.unlock(pw.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      showFloatingLock();
      await restoreSavedView(await getViewState());
      maybeSyncOnUnlock();
      loadStartupData().catch((err) => console.error("loadStartupData error:", err));
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Unlock";
      toast(e.code === "DECRYPTION_FAILED" ? e.message : "Unlock failed", "error");
      pw.select();
    }
  };
  pw.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });
  pw.addEventListener("input", () => {
    if (pw.value.length === 4) submit();
  });
  btn.addEventListener("click", submit);
  const lockCard = h(
    "div",
    { class: "okey-view okey-lock-full" },
    brandHeader(),
    h("div", { class: "vs-field" }, pw),
    btn,
    h("button", { class: "vs-btn vs-btn-ghost vs-btn-block", style: "margin-top:10px", text: "Forgot PIN? Use recovery key", onclick: renderRecover }),
    h("button", { class: "vs-btn vs-btn-ghost vs-btn-block", style: "margin-top:32px;color:white;border:1px solid var(--vs-danger);background:var(--vs-danger)", text: "Reset vault & start fresh", onclick: handleStartFresh })
  );
  clear(app);
  app.append(lockCard);
  requestAnimationFrame(() => pw.focus());
}
async function handleStartFresh() {
  if (confirm("Warning: This will permanently delete all saved passwords and configuration on this device. (This does not delete your Google Sheets data, and you can reconnect later.) Are you sure you want to start fresh?")) {
    vault.lock();
    await clearSession();
    const keys = [...Object.values(STORAGE_KEYS), ...Object.keys(LEGACY_STORAGE_KEYS)];
    await local.remove(keys);
    toast("Vault reset successfully", "success");
    renderSetup();
  }
}
function renderRecover() {
  clear(app);
  const ta = h("textarea", { class: "vs-textarea", placeholder: "Enter your 24-word recovery key, separated by spaces", rows: 4 });
  const np = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "New master PIN" });
  const meter = strengthMeter();
  np.addEventListener("input", () => {
    meter.update(np.value);
    if (np.value.length === 4) btn.click();
  });
  const btn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Recover & set new PIN" });
  btn.addEventListener("click", async () => {
    if (np.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`New PIN: ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits required`, "error");
    btn.disabled = true;
    btn.textContent = "Recovering\u2026";
    try {
      await vault.recoverWithMnemonic(ta.value);
      await vault.changeMasterPassword(np.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      toast("Vault recovered", "success");
      renderMain();
    } catch (e) {
      btn.disabled = false;
      btn.textContent = "Recover & set new PIN";
      toast(e.code === "DECRYPTION_FAILED" ? "Recovery key did not match this vault" : e.message || "Invalid recovery key", "error");
    }
  });
  app.append(h(
    "div",
    { class: "okey-view" },
    viewHeader("Recover vault", renderLocked),
    h(
      "div",
      { style: "margin: auto 0; display: flex; flex-direction: column; gap: 12px;" },
      h("div", { class: "vs-field" }, ta),
      h("div", { class: "vs-field" }, np, meter.el),
      btn
    )
  ));
}
function renderMain() {
  view.name = "main";
  view.entryId = null;
  rememberView();
  clear(app);
  const search = h("input", { class: "vs-input", type: "search", placeholder: "Search\u2026" });
  const header = h(
    "div",
    { class: "okey-header vs-glass" },
    h("div", { class: "okey-logo" }, h("span", { class: "okey-logo-mark", html: ICONS.logo }), "OKey"),
    h("div", { class: "okey-search" }, h("span", { html: ICONS.search }), search),
    iconBtn(ICONS.plus, "Add", () => renderEdit(null)),
    iconBtn(ICONS.dots, "Menu", renderMainMenu)
  );
  const folders = [...new Set(vault.getEntries().map((x) => x.folder).filter(Boolean))].sort();
  const tabsList = ["all", "password", "totp", "favorites", ...folders];
  const tabs = h(
    "div",
    { class: "okey-tabs" },
    ...tabsList.map((t) => h("button", {
      class: "okey-tab",
      "aria-selected": String(view.tab === t),
      onclick: () => {
        view.tab = t;
        renderMain();
      },
      text: tabLabel(t) || t
    }))
  );
  const body = h("div", { class: "okey-body" });
  const footer = renderFooter();
  const updateBanner = backendVersionMismatch ? h("div", { class: "okey-warn", style: "margin: 8px 12px; font-weight: 600;", text: "WARNING: Apps Script backend version mismatch. Please update your Google Sheet Apps Script code." }) : null;
  app.append(...[header, updateBanner, tabs, body, footer].filter(Boolean));
  search.addEventListener("input", () => renderList(body, search.value));
  renderList(body, "");
}
function tabLabel(t) {
  return { all: "All", password: "Logins", totp: "Auth", favorites: "\u2605" }[t];
}
function renderList(body, query) {
  clear(body);
  let entries = vault.getEntries();
  if (view.tab === "favorites") {
    entries = entries.filter((e) => e.isFavorite);
  } else if (view.tab === "totp") {
    entries = entries.filter((e) => e.entryType === "totp" || e.totpSecret && typeof e.totpSecret === "string" && e.totpSecret.trim().length > 0);
  } else if (view.tab === "password") {
    entries = entries.filter((e) => e.entryType === "password");
  } else if (view.tab !== "all") {
    entries = entries.filter((e) => e.folder === view.tab);
  }
  if (query) {
    const q = query.trim().toLowerCase();
    entries = entries.filter(
      (e) => [e.domain, e.siteName, e.nickname, e.username, ...e.tags || []].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }
  if (!query && view.tab === "all" && currentSite.url) {
    const matches = matchDomain(currentSite.url, vault.getEntries());
    if (matches.length) {
      body.append(h("div", { class: "okey-section-title", text: `For ${getDisplayDomain(currentSite.url)}` }));
      matches.slice(0, 4).forEach((m) => {
        const e = vault.getEntry(m.id);
        if (e) body.append(entryRow(e, m.confidence));
      });
      body.append(h("div", { class: "okey-section-title", text: "All items" }));
    }
  }
  body.append(selectToolbar(body, query));
  if (!entries.length) {
    body.append(h("div", { class: "okey-empty", text: query ? "No matches" : "No items yet. Tap + to add one." }));
    return;
  }
  entries.forEach((e) => body.append(entryRow(e)));
  startGlobalTotpTicker();
}
function selectToolbar(body, query) {
  const toggle = h("button", {
    class: "vs-btn vs-btn-ghost vs-btn-sm",
    text: selectMode ? "Done" : "Select",
    onclick: () => {
      selectMode = !selectMode;
      selected.clear();
      renderList(body, query);
    }
  });
  const row = h("div", { class: "vs-row", style: "padding:2px 4px" }, h("div", { class: "vs-spacer" }), toggle);
  if (selectMode) {
    const del = h("button", {
      class: "vs-btn vs-btn-danger vs-btn-sm",
      text: `Delete (${selected.size})`,
      disabled: !selected.size,
      onclick: async () => {
        if (confirm(`Are you sure you want to delete ${selected.size} selected item${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) {
          await vault.deleteEntries([...selected]);
          selectMode = false;
          selected.clear();
          toast("Deleted", "success");
          renderList(body, query);
          scheduleSync();
        }
      }
    });
    const exp = h("button", {
      class: "vs-btn vs-btn-secondary vs-btn-sm",
      text: `Export (${selected.size})`,
      disabled: !selected.size,
      onclick: () => {
        const selectedEntries = [...selected].map((id) => vault.getEntry(id)).filter(Boolean);
        download("okey-selected-export.csv", exportCsv(selectedEntries));
        selectMode = false;
        selected.clear();
        toast("Exported CSV", "success");
        renderList(body, query);
      }
    });
    row.insertBefore(del, row.firstChild);
    row.insertBefore(exp, del.nextSibling);
  }
  return row;
}
function startGlobalTotpTicker() {
  clearInterval(totpTimer);
  async function tick() {
    const containers = document.querySelectorAll(".okey-row-totp-container");
    if (!containers.length) {
      clearInterval(totpTimer);
      return;
    }
    for (const container of containers) {
      const secret = container.dataset.secret;
      const codeSpan = container.querySelector(".okey-row-totp-code");
      const bar = container.querySelector(".okey-row-totp-progress-bar");
      if (!secret || !codeSpan) continue;
      try {
        const { code, remaining, period } = await generateTOTP(secret);
        codeSpan.textContent = code.replace(/(\d{3})(\d{3})/, "$1 $2");
        if (bar) {
          const pct = remaining / period * 100;
          bar.style.transform = `scaleX(${pct / 100})`;
          if (remaining < 6) {
            bar.style.background = "var(--vs-danger)";
            codeSpan.style.color = "var(--vs-danger)";
          } else {
            bar.style.background = "var(--vs-brand)";
            codeSpan.style.color = "var(--vs-brand)";
          }
        }
      } catch {
        codeSpan.textContent = "ERROR";
      }
    }
  }
  tick();
  totpTimer = setInterval(tick, 1e3);
}
function getEntrySubText(e) {
  const titleText = e.nickname || e.siteName || "";
  if (e.domain) {
    const dispDomain = getDisplayDomain(e.domain);
    if (!titleText || titleText.toLowerCase() !== dispDomain.toLowerCase()) {
      return dispDomain;
    }
  }
  if (e.entryType === ENTRY_TYPES.TOTP && !e.domain) {
    return "Authenticator";
  }
  return "";
}
function entryRow(entry, confidence) {
  const sub = getEntrySubText(entry);
  const actions = h("div", { class: "okey-entry-actions" });
  if (entry.username) actions.append(iconBtn(ICONS.user, "Copy username", (ev) => {
    ev.stopPropagation();
    copyValue(entry.username, "Username copied");
  }));
  if (entry.password) actions.append(iconBtn(ICONS.key, "Copy password", (ev) => {
    ev.stopPropagation();
    copyValue(entry.password, "Password copied");
  }));
  if (entry.totpSecret) actions.append(iconBtn(ICONS.clock, "Copy code", async (ev) => {
    ev.stopPropagation();
    const { code } = await generateTOTP(entry.totpSecret);
    copyValue(code, "Code copied");
  }));
  let totpEl = null;
  if (entry.totpSecret) {
    const codeSpan = h("span", { class: "okey-row-totp-code vs-mono", text: "\u2022\u2022\u2022\u2022\u2022\u2022" });
    const progressBar = h("div", { class: "okey-row-totp-progress-bar" });
    const progressEl = h("div", { class: "okey-row-totp-progress" }, progressBar);
    totpEl = h("div", { class: "okey-row-totp-container", attrs: { "data-secret": entry.totpSecret }, onclick: (ev) => {
      ev.stopPropagation();
      copyValue(codeSpan.textContent.replace(/\s/g, ""), "Code copied");
    } }, codeSpan, progressEl);
  }
  const row = h(
    "div",
    { class: "okey-entry" },
    selectMode ? h("input", {
      type: "checkbox",
      class: "okey-checkbox",
      checked: selected.has(entry.id),
      onclick: (ev) => {
        ev.stopPropagation();
        selected.has(entry.id) ? selected.delete(entry.id) : selected.add(entry.id);
        renderMain();
      }
    }) : avatarEl(entry),
    h(
      "div",
      { class: "okey-entry-main" },
      h("div", { class: "okey-entry-title" }, entry.nickname || entry.siteName || getDisplayDomain(entry.domain) || "Untitled"),
      h("div", { class: "okey-entry-sub" }, sub)
    ),
    confidence ? h("span", { class: "okey-confidence", text: confidence >= 95 ? "EXACT" : "MATCH" }) : null,
    totpEl,
    actions
  );
  row.addEventListener("click", () => {
    if (!selectMode) renderDetail(entry.id);
  });
  return row;
}
function renderDetail(id) {
  const entry = vault.getEntry(id);
  if (!entry) return renderMain();
  view.name = "detail";
  view.entryId = id;
  rememberView();
  vault.touchEntry(id);
  clear(app);
  const fields = h("div", {});
  fields.append(detailField("Username", entry.username, true));
  fields.append(passwordField(entry.password));
  if (entry.totpSecret) fields.append(totpField(entry.totpSecret));
  if (entry.domain) fields.append(detailField("Website", entry.domain, true));
  if (entry.folder) fields.append(detailField("Folder", entry.folder, false));
  if (entry.notes) fields.append(detailField("Notes", entry.notes, false));
  (entry.customFields || []).forEach((f) => fields.append(detailField(f.label, f.value, true)));
  if (entry.tags?.length) fields.append(detailField("Tags", entry.tags.join(", "), false));
  fields.append(h("div", {
    class: "vs-faint",
    style: "font-size:11px;margin-top:10px",
    text: `Updated ${formatTimeAgo(entry.updatedAt)} \xB7 used ${formatTimeAgo(entry.lastUsedAt)}`
  }));
  const star = iconBtn(ICONS.star, entry.isFavorite ? "Unfavorite" : "Favorite", async () => {
    await vault.updateEntry(id, { isFavorite: !entry.isFavorite });
    toast(entry.isFavorite ? "Removed favorite" : "Favorited", "success");
    renderDetail(id);
    scheduleSync();
  });
  if (entry.isFavorite) star.style.color = "var(--vs-warning)";
  const pinBtn = iconBtn(ICONS.pin, entry.isPinned ? "Unpin" : "Pin", async () => {
    await vault.updateEntry(id, { isPinned: !entry.isPinned });
    toast(entry.isPinned ? "Unpinned" : "Pinned", "success");
    renderDetail(id);
    scheduleSync();
  });
  if (entry.isPinned) pinBtn.style.color = "var(--vs-brand)";
  app.append(h(
    "div",
    { class: "okey-view" },
    h(
      "div",
      { class: "okey-view-header vs-glass" },
      iconBtn(ICONS.back, "Back", renderMain),
      avatarEl(entry),
      h("div", { class: "okey-view-title", text: entry.nickname || entry.siteName || getDisplayDomain(entry.domain) }),
      star,
      pinBtn,
      iconBtn(ICONS.trash, "Delete", async () => {
        if (confirm("Delete this item?")) {
          await vault.deleteEntry(id);
          toast("Deleted", "success");
          renderMain();
          scheduleSync();
        }
      })
    ),
    fields,
    h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", style: "margin-top:12px", text: "Edit", onclick: () => renderEdit(id) })
  ));
}
function detailField(label2, value, copyable) {
  if (!value) return null;
  const val = h("span", { class: "val", text: value });
  return h(
    "div",
    { class: "okey-detail-field" },
    h("div", { class: "okey-detail-label", text: label2 }),
    h(
      "div",
      { class: "okey-detail-value" },
      val,
      copyable ? iconBtn(ICONS.copy, "Copy", () => copyValue(value, `${label2} copied`)) : null
    )
  );
}
function passwordField(password) {
  if (!password) return null;
  let shown = false;
  const val = h("span", { class: "val vs-mono", text: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" });
  const eye = iconBtn(ICONS.eye, "Reveal", () => {
    shown = !shown;
    val.textContent = shown ? password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  });
  return h(
    "div",
    { class: "okey-detail-field" },
    h("div", { class: "okey-detail-label", text: "Password" }),
    h("div", { class: "okey-detail-value" }, val, eye, iconBtn(ICONS.copy, "Copy", () => copyValue(password, "Password copied")))
  );
}
function totpField(secret) {
  const code = h("span", { class: "okey-totp-code", text: "\u2022\u2022\u2022\u2022\u2022\u2022" });
  const ring = h("svg", { class: "okey-totp-ring", viewBox: "0 0 36 36" });
  ring.innerHTML = '<circle cx="18" cy="18" r="15" fill="none" stroke="var(--vs-bg-elev-3)" stroke-width="3"/><circle class="prog" cx="18" cy="18" r="15" fill="none" stroke="var(--vs-brand)" stroke-width="3" stroke-linecap="round" transform="rotate(-90 18 18)"/>';
  const prog = ring.querySelector(".prog");
  const C = 2 * Math.PI * 15;
  prog.style.strokeDasharray = String(C);
  async function tick() {
    if (!isValidTotpSecret(secret)) {
      code.textContent = "invalid";
      return;
    }
    const { code: c, remaining, period } = await generateTOTP(secret);
    code.textContent = c.replace(/(\d{3})(\d{3})/, "$1 $2");
    prog.style.strokeDashoffset = String(C * (1 - remaining / period));
  }
  clearInterval(totpTimer);
  tick();
  totpTimer = setInterval(tick, 1e3);
  return h(
    "div",
    { class: "okey-detail-field" },
    h("div", { class: "okey-detail-label", text: "One-time code" }),
    h(
      "div",
      { class: "okey-detail-value okey-totp" },
      ring,
      code,
      h("div", { class: "vs-spacer" }),
      iconBtn(ICONS.copy, "Copy code", async () => {
        const { code: c } = await generateTOTP(secret);
        copyValue(c, "Code copied");
      })
    )
  );
}
function renderEdit(id, draft = null, scrollTop = 0) {
  clearInterval(totpTimer);
  const editing = !!id;
  const base = editing ? vault.getEntry(id) : {
    domain: currentSite.domain || normalizeDomain(currentSite.url || ""),
    // feedback #3
    siteName: currentSite.title || "",
    username: "",
    password: "",
    totpSecret: "",
    notes: "",
    tags: [],
    matchPatterns: [],
    customFields: [],
    entryType: ENTRY_TYPES.PASSWORD,
    isFavorite: false
  };
  const e = { ...base, ...draft || {} };
  view.name = "edit";
  view.entryId = id || null;
  clear(app);
  const f = {};
  f.siteName = labeledInput("Site name", e.siteName, true, "e.g. GitHub");
  f.domain = labeledInput("Domain", e.domain, true, "e.g. github.com");
  const activeFolders = [...new Set(vault.getEntries().map((x) => x.folder).filter(Boolean))].sort();
  const folderSelect = h(
    "select",
    { class: "vs-select", style: "width:100%" },
    h("option", { value: "", text: "(None)" }),
    ...activeFolders.map((fld) => h("option", { value: fld, text: fld, selected: e.folder === fld })),
    h("option", { value: "__new__", text: "+ Create new folder...", selected: e.folder && !activeFolders.includes(e.folder) })
  );
  const newFolderInput = h("input", {
    class: "vs-input",
    placeholder: "New folder name",
    style: e.folder && !activeFolders.includes(e.folder) ? "margin-top:8px;display:block" : "margin-top:8px;display:none",
    value: e.folder && !activeFolders.includes(e.folder) ? e.folder : ""
  });
  const collectDraft = () => ({
    siteName: f.siteName.value,
    domain: f.domain.value,
    username: f.username.value,
    password: pwInput.value,
    totpSecret: f.totp.value,
    notes: f.notes.value,
    tags: splitList(f.tags.value),
    matchPatterns: splitList(f.patterns.value),
    displayOrder: Number(f.displayOrder.value) || 0,
    folder: folderSelect.value === "__new__" ? newFolderInput.value : folderSelect.value,
    customFields: [...customWrap.querySelectorAll(".okey-custom-row")].map((r) => ({
      label: r.children[0].value,
      value: r.children[1].value,
      hidden: false
    }))
  });
  const saveDraft = () => rememberView({ draft: collectDraft(), scrollTop: app.querySelector(".okey-view")?.scrollTop || 0 });
  folderSelect.addEventListener("change", () => {
    if (folderSelect.value === "__new__") {
      newFolderInput.style.display = "block";
      newFolderInput.focus();
    } else {
      newFolderInput.style.display = "none";
      newFolderInput.value = "";
    }
    saveDraft();
  });
  newFolderInput.addEventListener("input", saveDraft);
  f.folderField = h(
    "div",
    { class: "vs-field" },
    h("label", { class: "vs-label" }, "Folder", h("span", { class: "vs-optional", text: " (optional)" })),
    folderSelect,
    newFolderInput
  );
  f.username = labeledInput("Username / email", e.username, false);
  const pwInput = h("input", { class: "vs-input", type: "text", value: e.password || "", placeholder: "Password" });
  const genBtn = iconBtn(ICONS.refresh, "Generate", () => {
    pwInput.value = generatePassword(settings.passwordGeneratorDefaults);
    toggleGen();
    saveDraft();
  });
  const toggleGen = () => {
    genBtn.style.display = pwInput.value ? "none" : "inline-flex";
  };
  pwInput.addEventListener("input", toggleGen);
  toggleGen();
  f.totp = labeledInput("TOTP secret", e.totpSecret, false, "Base32 secret (optional)");
  f.notes = h("textarea", { class: "vs-textarea", placeholder: "Notes (optional)" });
  f.notes.value = e.notes || "";
  f.tags = labeledInput("Tags", (e.tags || []).join(", "), false, "comma separated");
  f.patterns = labeledInput("Match URLs", (e.matchPatterns || []).join(", "), false, "e.g. site.com/login/*");
  f.displayOrder = labeledInput("Display order", String(e.displayOrder || 0), false, "0");
  f.displayOrder.input.type = "number";
  const customWrap = h("div", {});
  (e.customFields || []).forEach((cf) => customWrap.append(customRow(cf)));
  const addCustom = h("button", { class: "vs-btn vs-btn-ghost vs-btn-sm", text: "+ Add custom field", onclick: () => {
    customWrap.append(customRow());
    saveDraft();
  } });
  const save = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: editing ? "Save changes" : "Add item" });
  save.addEventListener("click", async () => {
    const chosenFolder = folderSelect.value === "__new__" ? newFolderInput.value.trim() : folderSelect.value.trim();
    const data = {
      siteName: f.siteName.value.trim(),
      domain: normalizeDomain(f.domain.value.trim()),
      username: f.username.value.trim(),
      password: pwInput.value,
      totpSecret: f.totp.value.replace(/\s+/g, ""),
      notes: f.notes.value,
      tags: splitList(f.tags.value),
      matchPatterns: splitList(f.patterns.value),
      displayOrder: Number(f.displayOrder.value) || 0,
      folder: chosenFolder,
      customFields: [...customWrap.querySelectorAll(".okey-custom-row")].map((r) => ({
        label: r.children[0].value.trim(),
        value: r.children[1].value,
        hidden: false
      })).filter((c) => c.label),
      entryType: f.totp.value.trim() && !pwInput.value ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD
    };
    if (!data.siteName && !data.domain) return toast("Add a site name or domain", "error");
    if (data.totpSecret && !isValidTotpSecret(data.totpSecret)) return toast("Invalid TOTP secret", "error");
    try {
      if (editing) await vault.updateEntry(id, data);
      else await vault.addEntry(data);
      toast("Saved", "success");
      scheduleSync();
      editing ? renderDetail(id) : renderMain();
    } catch (err) {
      toast(err.message, "error");
    }
  });
  const editView = h(
    "div",
    { class: "okey-view" },
    viewHeader(editing ? "Edit item" : "Add item", editing ? () => renderDetail(id) : renderMain),
    f.siteName.field,
    f.domain.field,
    f.folderField,
    f.username.field,
    h("div", { class: "vs-field" }, label("Password"), h("div", { class: "vs-input-group" }, pwInput, h("div", { class: "vs-input-affix" }, genBtn))),
    f.totp.field,
    f.patterns.field,
    h("div", { class: "vs-field" }, label("Notes", true), f.notes),
    f.tags.field,
    f.displayOrder.field,
    h("div", { class: "vs-field" }, label("Custom fields", true), customWrap, addCustom),
    save
  );
  editView.addEventListener("input", saveDraft);
  editView.addEventListener("change", saveDraft);
  customWrap.addEventListener("click", () => setTimeout(saveDraft, 0));
  app.append(editView);
  requestAnimationFrame(() => {
    editView.scrollTop = scrollTop || 0;
    saveDraft();
  });
}
function customRow(cf = { label: "", value: "" }) {
  return h(
    "div",
    { class: "okey-custom-row" },
    h("input", { class: "vs-input", placeholder: "Label", value: cf.label || "" }),
    h("input", { class: "vs-input", placeholder: "Value", value: cf.value || "" }),
    iconBtn(ICONS.trash, "Remove", (ev) => ev.currentTarget.parentElement.remove())
  );
}
function renderGenerator(saved = null) {
  clear(app);
  view.name = "generator";
  view.entryId = null;
  let mode = saved?.mode || "password";
  const out = h("div", { class: "okey-generator-output vs-mono" });
  const meter = strengthMeter();
  const len = h("input", { type: "range", min: "8", max: "64", value: saved?.length || "20", style: "width:100%" });
  const opts = { uppercase: true, lowercase: true, numbers: true, symbols: true, ...saved?.opts || {} };
  const checks = ["uppercase", "lowercase", "numbers", "symbols"].map((k) => toggleRow(k[0].toUpperCase() + k.slice(1), opts[k], (v) => {
    opts[k] = v;
    regen();
  }));
  function regen() {
    if (mode === "password") {
      out.textContent = generatePassword({ length: +len.value, ...opts });
      meter.update(out.textContent);
    } else {
      out.textContent = generatePassphrase({ words: Math.max(3, Math.round(+len.value / 4)), capitalize: true });
      meter.set(strengthFromEntropy(passphraseEntropyBits(Math.max(3, Math.round(+len.value / 4)))).level);
    }
    rememberView({ generator: { mode, length: len.value, opts } });
  }
  len.addEventListener("input", regen);
  const modeTabs = h(
    "div",
    { class: "okey-tabs" },
    h("button", { class: "okey-tab", "aria-selected": String(mode === "password"), text: "Password", onclick: (ev) => {
      mode = "password";
      selTab(ev);
      regen();
    } }),
    h("button", { class: "okey-tab", "aria-selected": String(mode === "passphrase"), text: "Passphrase", onclick: (ev) => {
      mode = "passphrase";
      selTab(ev);
      regen();
    } })
  );
  function selTab(ev) {
    [...modeTabs.children].forEach((c) => c.setAttribute("aria-selected", String(c === ev.currentTarget)));
  }
  app.append(h(
    "div",
    { class: "okey-view" },
    viewHeader("Password generator", renderMain),
    modeTabs,
    out,
    meter.el,
    h(
      "div",
      { class: "vs-row", style: "margin:12px 0" },
      h("button", { class: "vs-btn vs-btn-secondary", html: ICONS.refresh, onclick: regen }),
      h("button", { class: "vs-btn vs-btn-primary vs-spacer", text: "Copy", onclick: () => copyValue(out.textContent, "Copied") })
    ),
    h("label", { class: "vs-label", text: "Length" }),
    len,
    ...checks
  ));
  regen();
}
async function populateHealthWidget(healthWidget) {
  const profile = await sync.getActiveProfile();
  if (!profile?.appsScriptUrl) {
    const dot2 = healthWidget.querySelector(".okey-health-dot");
    const text2 = healthWidget.querySelector(".okey-health-status-text");
    const details2 = healthWidget.querySelector(".okey-health-details");
    if (dot2 && text2 && details2) {
      dot2.style.background = "#9ca3af";
      text2.textContent = "Offline (No vault connected)";
      details2.style.display = "none";
    }
    return;
  }
  const cached = await local.get("okey_backend_health");
  const res = cached["okey_backend_health"];
  const dot = healthWidget.querySelector(".okey-health-dot");
  const text = healthWidget.querySelector(".okey-health-status-text");
  const details = healthWidget.querySelector(".okey-health-details");
  if (dot && text && details) {
    if (res && res.status === "ok") {
      dot.style.background = "var(--vs-success)";
      text.textContent = "Active (Connected)";
      details.style.display = "block";
      clear(details);
      details.append(
        h("div", {}, `Apps Script: v${res.version || "1.0.0"}`),
        h("div", {}, `Spreadsheet Count: ${res.vaultEntries ?? 0} entries`),
        h("div", { style: "overflow:hidden; text-overflow:ellipsis; white-space:nowrap;", title: res.sheetUrl }, `Sheet URL: ${res.sheetUrl || "N/A"}`)
      );
    } else {
      dot.style.background = "#9ca3af";
      text.textContent = "Connection status cached at sync/launch";
      details.style.display = "none";
    }
  }
}
function renderSettings(scrollTop = 0) {
  view.name = "settings";
  view.entryId = null;
  rememberView({ scrollTop });
  clear(app);
  const themeSel = h(
    "select",
    { class: "vs-select" },
    ...["system", "dark", "light"].map((t) => h("option", { value: t, selected: settings.theme === t }, t))
  );
  themeSel.addEventListener("change", () => updateSettings({ theme: themeSel.value }).then(() => applyTheme(themeSel.value)));
  const autoLock = numberSetting("Auto-lock (seconds)", settings.autoLockTimeout, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS, (v) => updateSettings({ autoLockTimeout: v }));
  const miniAutoLockOptions = [
    { text: "1m", value: 60 },
    { text: "5m", value: 300 },
    { text: "10m", value: 600 },
    { text: "30m", value: 1800 },
    { text: "1h", value: 3600 },
    { text: "2h", value: 7200 },
    { text: "6h", value: 21600 }
  ];
  const miniLockVal = settings.miniAutoLockTimeout || 300;
  const miniLockSel = h(
    "select",
    { class: "vs-select", style: "width:90px" },
    ...miniAutoLockOptions.map((opt) => h("option", { value: opt.value, selected: Number(miniLockVal) === opt.value }, opt.text))
  );
  miniLockSel.addEventListener("change", () => updateSettings({ miniAutoLockTimeout: Number(miniLockSel.value) }));
  const miniLock = h("div", { class: "okey-setting" }, h("div", { class: "okey-setting-main" }, h("div", { text: "Mini-view auto-lock" })), miniLockSel);
  const clip = numberSetting("Clipboard clear (seconds)", settings.clipboardClearTimeout, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS, SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS, (v) => updateSettings({ clipboardClearTimeout: v }));
  const profileList = h("div", {});
  const lastSyncLabel = h("div", { class: "vs-faint", style: "margin-top:6px", text: "Loading..." });
  const renderProfiles = (list) => {
    clear(profileList);
    if (!list.length) profileList.append(h("div", { class: "vs-faint", text: "No vault connected. Add one to enable sync." }));
    list.forEach((p) => profileList.append(h(
      "div",
      { class: `okey-profile ${p.isActive ? "active" : ""}` },
      h("input", { type: "radio", name: "profile", checked: p.isActive, class: "okey-checkbox", onclick: async () => {
        await sync.switchProfile(p.id);
        renderProfiles(await sync.getProfiles());
      } }),
      h("div", { class: "okey-profile-main" }, h("div", { text: p.label }), h("div", { class: "okey-profile-url", text: p.appsScriptUrl })),
      iconBtn(ICONS.trash, "Remove", async () => {
        await sync.removeProfile(p.id);
        renderProfiles(await sync.getProfiles());
      })
    )));
  };
  const healthWidget = h(
    "div",
    { class: "okey-health-widget vs-glass", style: "padding: 8px 12px; margin-top: 8px; border-radius: 8px; font-size: 11px; border: 1px solid var(--vs-border);" },
    h(
      "div",
      { style: "display:flex; align-items:center; gap:6px; font-weight:600;" },
      h("span", { class: "okey-health-dot", style: "width:8px; height:8px; border-radius:50%; background:#9ca3af;" }),
      h("span", { class: "okey-health-status-text", text: "Checking connection..." })
    ),
    h("div", { class: "okey-health-details vs-faint", style: "margin-top: 6px; display:none; line-height: 1.4;" })
  );
  const viewContainer = h(
    "div",
    { class: "okey-view" },
    viewHeader("Settings", renderMain),
    settingsGroup(
      "Security",
      autoLock,
      miniLock,
      clip,
      h("div", { class: "okey-setting" }, h("div", { class: "okey-setting-main" }, h("div", { text: "Change master PIN" })), h("button", { class: "vs-btn vs-btn-secondary vs-btn-sm", text: "Change", onclick: changeMasterPasswordModal })),
      h("div", { class: "okey-setting" }, h("div", { class: "okey-setting-main" }, h("div", { text: "Theme" })), themeSel)
    ),
    settingsGroup(
      "Autofill Preferences",
      toggleRow("Auto-fill on single match", settings.autoFillSingleMatch, (v) => updateSettings({ autoFillSingleMatch: v })),
      toggleRow("Auto-submit after fill", settings.autoSubmitEnabled, (v) => updateSettings({ autoSubmitEnabled: v })),
      h(
        "div",
        { class: "vs-faint", style: "margin-top: 8px; font-size: 11px; line-height: 1.4;" },
        `Tip: To prevent browser autofill popups from overlapping with OKey, disable the browser's built-in "Offer to save passwords" and "Autofill" settings.`
      )
    ),
    settingsGroup(
      "Connected Sheets",
      profileList,
      h(
        "div",
        { class: "vs-row", style: "margin-top:8px" },
        h("button", { class: "vs-btn vs-btn-secondary vs-spacer", text: "Add vault sheet", onclick: () => addSheetModal(() => renderSettings()) }),
        h("button", { class: "vs-btn vs-btn-primary", text: "Sync now", onclick: async (ev) => {
          const b = ev.currentTarget;
          b.disabled = true;
          b.textContent = "Syncing...";
          try {
            await doManualSync();
          } finally {
            b.disabled = false;
            b.textContent = "Sync now";
          }
        } })
      ),
      lastSyncLabel,
      healthWidget
    ),
    settingsGroup(
      "Recovery",
      h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", text: "View / regenerate recovery key", onclick: viewRecovery })
    ),
    settingsGroup(
      "Backup",
      h(
        "div",
        { class: "vs-row" },
        h("button", { class: "vs-btn vs-btn-secondary vs-spacer", onclick: exportModal }, h("span", { html: ICONS.export }), "Export"),
        h("button", { class: "vs-btn vs-btn-secondary vs-spacer", onclick: importModal }, h("span", { html: ICONS.import }), "Import")
      )
    ),
    settingsGroup(
      "Vault",
      h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", text: "Open password generator", onclick: renderGenerator }),
      h("button", { class: "vs-btn vs-btn-ghost vs-btn-block", style: "margin-top:8px", text: "Lock now", onclick: async () => {
        await clearSession();
        vault.lock();
        renderLocked();
      } }),
      h("div", { class: "vs-faint", style: "text-align:center;margin-top:14px", text: "OKey 1.0.0 \xB7 zero-knowledge \xB7 Argon2id" })
    )
  );
  app.append(viewContainer);
  requestAnimationFrame(() => {
    viewContainer.scrollTop = scrollTop || 0;
  });
  sync.getProfiles().then(renderProfiles).catch(console.error);
  local.get(STORAGE_KEYS.LAST_SYNC_AT).then((res) => {
    const lastSync = res[STORAGE_KEYS.LAST_SYNC_AT];
    const ago = formatTimeAgo(lastSync);
    lastSyncLabel.textContent = ago === "Never" ? "Never synced" : `Last synced ${ago}`;
  }).catch(console.error);
  populateHealthWidget(healthWidget).catch(console.error);
}
function viewRecovery() {
  const pw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Confirm master PIN", autofocus: true });
  modal("Recovery key", [
    h("p", { class: "vs-muted", text: "Regenerate your 24-word recovery key. The old key will stop working." }),
    h("div", { class: "vs-field" }, pw),
    h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Regenerate", onclick: async (ev) => {
      try {
        const probe = new Vault(local);
        await probe.unlock(pw.value);
        probe.lock();
        const { recoveryMnemonic } = await vault.regenerateRecovery();
        closeModal();
        renderRecoveryReveal(recoveryMnemonic, renderSettings);
      } catch {
        toast("Incorrect master PIN", "error");
      }
    } })
  ]);
}
function changeMasterPasswordModal() {
  const currentPw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Current master PIN", autofocus: true });
  const newPw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "New master PIN" });
  const confirmNewPw = h("input", { class: "vs-input", type: "password", inputmode: "numeric", pattern: "[0-9]*", maxlength: 4, placeholder: "Confirm new master PIN" });
  const meter = strengthMeter();
  currentPw.addEventListener("input", () => {
    if (currentPw.value.length === 4) newPw.focus();
  });
  newPw.addEventListener("input", () => {
    meter.update(newPw.value);
    if (newPw.value.length === 4) confirmNewPw.focus();
  });
  confirmNewPw.addEventListener("input", () => {
    if (confirmNewPw.value.length === 4 && newPw.value === confirmNewPw.value) submitBtn.click();
  });
  const submitBtn = h("button", { class: "vs-btn vs-btn-primary vs-btn-block", text: "Change PIN" });
  submitBtn.addEventListener("click", async () => {
    if (newPw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) {
      return toast(`New PIN must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits`, "error");
    }
    if (newPw.value !== confirmNewPw.value) {
      return toast("New PINs do not match", "error");
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating\u2026";
    try {
      const probe = new Vault(local);
      await probe.unlock(currentPw.value);
      probe.lock();
      await vault.changeMasterPassword(newPw.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      if (await sync.getActiveProfile()) {
        const c = await local.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
        await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] }).catch(() => {
        });
      }
      toast("Master PIN changed successfully", "success");
      closeModal();
      await doManualSync();
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Change PIN";
      toast(e.code === "DECRYPTION_FAILED" ? "Incorrect current master PIN" : e.message, "error");
    }
  });
  modal("Change Master PIN", [
    h("div", { class: "vs-field" }, label("Current PIN"), currentPw),
    h("div", { class: "vs-field" }, label("New PIN"), newPw, meter.el),
    h("div", { class: "vs-field" }, label("Confirm New PIN"), confirmNewPw),
    submitBtn
  ]);
  requestAnimationFrame(() => currentPw.focus());
}
function addSheetModal(done) {
  const lbl = h("input", { class: "vs-input", placeholder: "Label (e.g. Personal)" });
  const url = h("input", { class: "vs-input", placeholder: "Apps Script URL (https://script.google.com/\u2026/exec)" });
  modal("Add vault sheet", [
    h("div", { class: "vs-field" }, lbl),
    h("div", { class: "vs-field" }, url),
    h("p", { class: "vs-faint", text: "Deploy the OKey Apps Script as a Web App and paste its /exec URL. See SETUP.md." }),
    h(
      "div",
      { class: "vs-row" },
      h("button", { class: "vs-btn vs-btn-secondary vs-spacer", text: "Setup new sheet", onclick: async (ev) => {
        const b = ev.currentTarget;
        b.disabled = true;
        b.textContent = "Setting up...";
        try {
          await sync.addProfile({ label: lbl.value || "My Vault", appsScriptUrl: url.value.trim() });
          await sync.setupSheet();
          toast("Sheet structure created", "success");
          closeModal();
          done();
        } catch (e) {
          toast(e.message, "error");
          b.disabled = false;
          b.textContent = "Setup new sheet";
        }
      } }),
      h("button", { class: "vs-btn vs-btn-primary vs-spacer", text: "Save", onclick: async (ev) => {
        const b = ev.currentTarget;
        b.disabled = true;
        b.textContent = "Saving...";
        try {
          await sync.addProfile({ label: lbl.value || "My Vault", appsScriptUrl: url.value.trim() });
          toast("Vault added", "success");
          closeModal();
          done();
        } catch (e) {
          toast(e.message, "error");
          b.disabled = false;
          b.textContent = "Save";
        }
      } })
    )
  ]);
}
function exportModal() {
  modal("Export vault", [
    h("div", { class: "okey-warn", style: "font-weight: 600;", text: "WARNING: This JSON file contains your real, unencrypted passwords. Store it securely and delete the file immediately after use." }),
    h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", style: "margin-bottom:8px", onclick: async () => {
      const recs = await vault.exportRecords();
      const c = await local.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
      download("okey-backup.json", exportOkeyBackup({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY], records: recs }));
      closeModal();
    } }, h("span", { html: ICONS.export }), "Encrypted OKey backup (.json)"),
    h("button", { class: "vs-btn vs-btn-secondary vs-btn-block", style: "margin-bottom:8px", onclick: () => {
      download("okey-export.json", exportBitwardenJson(vault.getEntries()));
      closeModal();
    } }, h("span", { html: ICONS.export }), "Plaintext JSON (Bitwarden)"),
    h("button", { class: "vs-btn vs-btn-ghost vs-btn-block", onclick: () => {
      download("okey-export.csv", exportCsv(vault.getEntries()));
      closeModal();
    } }, h("span", { html: ICONS.export }), "Plaintext CSV")
  ]);
}
function importModal() {
  const file = h("input", { type: "file", accept: ".csv,.json,.txt" });
  const fmt = h(
    "select",
    { class: "vs-select" },
    h("option", { value: "chrome" }, "Chrome CSV"),
    h("option", { value: "bitwarden" }, "Bitwarden JSON"),
    h("option", { value: "lastpass" }, "LastPass CSV"),
    h("option", { value: "zoho" }, "Zoho Vault CSV"),
    h("option", { value: "otp" }, "Authenticator (otpauth)")
  );
  modal("Import", [
    h("div", { class: "vs-field" }, label("Format"), fmt),
    h("div", { class: "vs-field" }, file),
    h("button", { class: "vs-btn vs-btn-primary vs-btn-block", onclick: async () => {
      const f = file.files[0];
      if (!f) return toast("Choose a file", "error");
      const text = await f.text();
      try {
        const parser = { chrome: importChrome, bitwarden: importBitwarden, lastpass: importLastPass, zoho: importZohoVault, otp: importOtpAuthUris }[fmt.value];
        const items = parser(text);
        let n = 0;
        for (const it of items) {
          try {
            await vault.addEntry(it);
            n++;
          } catch {
          }
        }
        toast(`Imported ${n} item${n === 1 ? "" : "s"}`, "success");
        closeModal();
        scheduleSync();
        renderMain();
      } catch (e) {
        toast(`Import failed: ${e.message}`, "error");
      }
    } }, h("span", { html: ICONS.import }), "Import")
  ]);
}
function modal(title, children) {
  closeModal();
  const ov = h(
    "div",
    { class: "vs-overlay", id: "okey-modal", onclick: (e) => {
      if (e.target === ov) closeModal();
    } },
    h("div", { class: "vs-modal" }, h("div", { class: "okey-view-title", style: "margin-bottom:10px", text: title }), ...children)
  );
  document.body.append(ov);
}
function closeModal() {
  document.getElementById("okey-modal")?.remove();
}
async function doManualSync() {
  const active = await sync.getActiveProfile();
  if (!active) return toast("Add a vault sheet first", "error");
  toast("Syncing\u2026", "info");
  updateSyncUI("syncing");
  try {
    const remoteMeta = await sync.fetchMetadata();
    const c = await local.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
    if (remoteMeta && remoteMeta.salt) {
      if (remoteMeta.salt !== c[STORAGE_KEYS.VAULT_SALT]) {
        updateSyncUI("err");
        return toast("Vault mismatch! Sheet belongs to a different vault.", "error");
      }
    } else {
      await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] });
    }
    await sync.pushSettings(settings).catch(() => {
    });
    const r = await sync.sync(vault);
    try {
      const remote = await sync.pullSettings();
      if (remote) {
        settings = { ...settings, ...remote };
        await local.set({ [STORAGE_KEYS.SETTINGS]: settings });
        await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings }).catch(() => {
        });
        if (typeof applyTheme === "function") applyTheme(settings.theme);
      }
    } catch (e) {
      console.error("Failed to pull settings after sync:", e);
    }
    try {
      const health = await sync._call("health");
      if (health) {
        await local.set({ "okey_backend_health": health });
      }
    } catch (e) {
      console.error("Failed to get health after sync:", e);
    }
    await local.remove([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
    await sync.getFolders(true).catch(() => {
    });
    await refreshDashboardAfterSync().catch(() => {
    });
    toast(`Synced \xB7 \u2191${r.pushed} \u2193${r.pulled} (${vault.getEntries().length})`, "success");
    updateSyncUI("ok");
    renderMain();
  } catch (e) {
    toast(`Sync failed: ${e.message}`, "error");
    updateSyncUI("err");
  }
}
var syncDebounce = null;
function scheduleSync() {
  clearTimeout(syncDebounce);
  syncDebounce = setTimeout(async () => {
    if (await sync.getActiveProfile()) {
      try {
        await sync.sync(vault);
        await refreshDashboardAfterSync();
      } catch (e) {
        console.error("Scheduled sync failed:", e);
      }
    }
  }, 8e3);
}
async function maybeSyncOnUnlock() {
  if (settings.autoSyncEnabled && await sync.getActiveProfile()) {
    updateSyncUI("syncing");
    sync.sync(vault).then(async () => {
      updateSyncUI("ok");
      await local.remove([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
      await sync.getFolders(true).catch(() => {
      });
      await refreshDashboardAfterSync().catch(() => {
      });
      sync.pullSettings().then(async (remote) => {
        if (remote) {
          settings = { ...settings, ...remote };
          await local.set({ [STORAGE_KEYS.SETTINGS]: settings });
          await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings }).catch(() => {
          });
          if (typeof applyTheme === "function") applyTheme(settings.theme);
        }
      }).catch(() => {
      });
      sync._call("health").then(async (health) => {
        if (health) {
          await local.set({ "okey_backend_health": health });
        }
      }).catch(() => {
      });
    }).catch(() => updateSyncUI("err"));
  }
}
async function updateSettings(patch) {
  settings = { ...settings, ...patch };
  await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings: patch }).catch(() => {
  });
  if (await sync.getActiveProfile()) sync.pushSettings(settings).catch(() => {
  });
}
function brandHeader() {
  return h(
    "div",
    { style: "text-align:center;padding:24px 0 8px" },
    h("div", { class: "okey-logo", style: "justify-content:center;font-size:24px" }, h("span", { html: ICONS.logo }), "OKey"),
    h("div", { class: "vs-faint", style: "margin-top:4px", text: "A premium zero-knowledge password & 2FA manager" })
  );
}
function iconBtn(svg, title, onclick) {
  return h("button", { class: "vs-icon-btn", title, "aria-label": title, html: svg, onclick });
}
function viewHeader(title, back) {
  return h("div", { class: "okey-view-header vs-glass" }, iconBtn(ICONS.back, "Back", back), h("div", { class: "okey-view-title", text: title }));
}
function renderFooter() {
  const syncLabel = h("span", { class: "vs-faint", text: "Never synced" });
  const refreshBtn = iconBtn(ICONS.refresh, "Sync now", async (ev) => {
    ev.stopPropagation();
    refreshBtn.classList.add("spinning");
    await doManualSync();
    refreshBtn.classList.remove("spinning");
  });
  refreshBtn.classList.add("okey-footer-sync-btn");
  local.get(STORAGE_KEYS.LAST_SYNC_AT).then((s) => {
    const lastSync = s[STORAGE_KEYS.LAST_SYNC_AT];
    const ago = formatTimeAgo(lastSync);
    syncLabel.textContent = ago === "Never" ? "Never synced" : `Last synced: ${ago}`;
  });
  return h(
    "div",
    { class: "okey-footer vs-glass" },
    h("span", { class: "okey-sync-dot" + (syncStatus && syncStatus !== "idle" ? " " + syncStatus : "") }),
    h("span", { text: `${vault.getEntries().length} items` }),
    h("div", { class: "vs-spacer" }),
    syncLabel,
    refreshBtn
  );
}
function label(text, optional) {
  return h("label", { class: "vs-label" }, text, optional ? h("span", { class: "vs-optional", text: "(optional)" }) : text ? h("span", { class: "vs-required", text: " *" }) : null);
}
function labeledInput(lbl, value, required, placeholder) {
  const input = h("input", { class: "vs-input", value: value || "", placeholder: placeholder || "" });
  const field = h(
    "div",
    { class: "vs-field" },
    h("label", { class: "vs-label" }, lbl, required ? h("span", { class: "vs-required", text: " *" }) : h("span", { class: "vs-optional", text: "(optional)" })),
    input
  );
  return { input, field, get value() {
    return input.value;
  } };
}
function numberSetting(lbl, value, min, max, onchange) {
  const inp = h("input", { class: "vs-input", type: "number", value, min, max, style: "width:90px" });
  inp.addEventListener("change", () => {
    const v = Math.min(Math.max(+inp.value, min), max);
    inp.value = v;
    onchange(v);
  });
  return h("div", { class: "okey-setting" }, h("div", { class: "okey-setting-main" }, h("div", { text: lbl })), inp);
}
function toggleRow(lbl, checked, onchange) {
  const input = h("input", { type: "checkbox", checked });
  input.addEventListener("change", () => onchange(input.checked));
  return h(
    "div",
    { class: "okey-setting" },
    h("div", { class: "okey-setting-main" }, h("div", { text: lbl })),
    h("label", { class: "vs-toggle" }, input, h("span", { class: "vs-toggle-track" }))
  );
}
function settingsGroup(title, ...children) {
  return h("div", { class: "okey-settings-group" }, h("div", { class: "okey-section-title", text: title }), ...children);
}
function strengthMeter() {
  const bars = [1, 2, 3, 4].map(() => h("span", { class: "vs-strength-bar" }));
  const el = h("div", { class: "vs-strength", attrs: { "data-level": "0" } }, ...bars);
  return { el, update: (pw) => el.setAttribute("data-level", String(analyzePassword(pw).level)), set: (lvl) => el.setAttribute("data-level", String(lvl)) };
}
function splitList(s) {
  return (s || "").split(",").map((x) => x.trim()).filter(Boolean);
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = h("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function showFloatingLock() {
  if (document.getElementById("okey-lock-fab")) return;
  const lockBtn = h("button", {
    id: "okey-lock-fab",
    class: "okey-lock-fab",
    title: "Lock now",
    html: ICONS.logo,
    onclick: async () => {
      await clearSession();
      vault.lock();
      renderLocked();
      window.close();
    }
  });
  document.body.append(lockBtn);
}
function hideFloatingLock() {
  document.getElementById("okey-lock-fab")?.remove();
}
function renderMainMenu(ev) {
  closeModal();
  const menu = h(
    "div",
    { class: "okey-menu-popover vs-glass" },
    h("button", { class: "okey-menu-item", text: "Dashboard", onclick: () => {
      closeModal();
      renderDashboard();
    } }),
    h("button", { class: "okey-menu-item", text: "Analytics", onclick: () => {
      closeModal();
      renderAnalytics();
    } }),
    h("button", { class: "okey-menu-item", text: "Settings", onclick: () => {
      closeModal();
      renderSettings();
    } })
  );
  const rect = ev.currentTarget.getBoundingClientRect();
  menu.style.position = "absolute";
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${document.body.clientWidth - rect.right}px`;
  menu.style.zIndex = "1000";
  const ov = h("div", { class: "vs-overlay", style: "background:transparent", id: "okey-modal", onclick: (e) => {
    if (e.target === ov) closeModal();
  } }, menu);
  document.body.append(ov);
}
async function renderDashboard() {
  view.name = "dashboard";
  view.entryId = null;
  rememberView();
  clear(app);
  const content = h("div", { class: "okey-section-title", style: "margin: 20px", text: "Loading dashboard..." });
  app.append(h(
    "div",
    { class: "okey-view" },
    viewHeader("Dashboard", renderMain),
    content
  ));
  let data = null;
  let health = null;
  let pingInfo = null;
  let offlineQueue = [];
  let connected = false;
  try {
    const queueData = await local.get(STORAGE_KEYS.OFFLINE_QUEUE).catch(() => ({}));
    offlineQueue = queueData[STORAGE_KEYS.OFFLINE_QUEUE] || [];
    const res = await Promise.all([
      sync.fetchDashboard().catch((err) => {
        console.error(err);
        return null;
      }),
      sync._call("health").catch((err) => {
        console.error(err);
        return null;
      }),
      sync.ping().catch((err) => {
        console.error(err);
        return null;
      })
    ]);
    data = res[0];
    health = res[1];
    pingInfo = res[2];
    if (data || health || pingInfo) {
      connected = true;
    }
  } catch (e) {
    console.error("Dashboard fetch error:", e);
  }
  clear(content);
  const profile = await sync.getActiveProfile();
  const fallbackUrl = profile?.sheetId ? `https://docs.google.com/spreadsheets/d/${profile.sheetId}/edit` : profile?.appsScriptUrl || "";
  const statusBadge = h(
    "div",
    {
      class: "vs-glass",
      style: "padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid var(--vs-border);"
    },
    h(
      "div",
      { style: "display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;" },
      h("span", { style: "font-weight:600; font-size:13px;" }, "Vault Status"),
      h(
        "div",
        { style: "display:flex; align-items:center; gap:6px;" },
        h("span", {
          style: `width:8px; height:8px; border-radius:50%; background:${connected ? "var(--vs-success)" : "var(--vs-danger, #ef4444)"}; display:inline-block; animation: vs-pulse 1.5s infinite;`
        }),
        h("span", {
          style: `font-size:11px; font-weight:700; color:${connected ? "var(--vs-success)" : "var(--vs-danger, #ef4444)"};`,
          text: connected ? "ONLINE" : "OFFLINE"
        })
      )
    ),
    h(
      "div",
      { style: "font-size:11px; display:flex; flex-direction:column; gap:4px;" },
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Google Account:" }),
        h("span", { style: "font-weight:500;", text: connected ? pingInfo?.email || health?.email || "Connected" : "Offline" })
      ),
      h(
        "div",
        { style: "display:flex; justify-content:space-between; align-items:center;" },
        h("span", { class: "vs-faint", text: "Spreadsheet:" }),
        connected && health?.sheetUrl || fallbackUrl ? h("a", {
          href: health?.sheetUrl || fallbackUrl,
          target: "_blank",
          style: "color:var(--vs-brand); text-decoration:none; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;",
          text: "Open Spreadsheet \u2197"
        }) : h("span", { class: "vs-faint", text: "N/A" })
      )
    )
  );
  const localVer = APP.VERSION;
  const targetBackendVer = APP.APPSCRIPT_VERSION;
  const actualBackendVer = health?.version || (connected ? "1.0.0" : "Unknown");
  const isMismatch = connected && actualBackendVer !== targetBackendVer;
  const versionCard = h(
    "div",
    {
      class: "vs-glass",
      style: `padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid ${isMismatch ? "var(--vs-danger, #ef4444)" : "var(--vs-border)"};`
    },
    h("div", { style: "font-weight:600; font-size:12px; margin-bottom:8px;", text: "Version Alignment" }),
    h(
      "div",
      { style: "font-size:11px; display:flex; flex-direction:column; gap:4px;" },
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Client App Version:" }),
        h("span", { style: "font-weight:500;", text: `v${localVer}` })
      ),
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Apps Script Backend:" }),
        h("span", {
          style: `font-weight:500; color:${isMismatch ? "var(--vs-danger, #ef4444)" : "inherit"};`,
          text: connected ? `v${actualBackendVer}` : "Offline"
        })
      ),
      isMismatch ? h("div", {
        style: "color:var(--vs-danger, #ef4444); font-size:10px; margin-top:6px; font-weight:600; text-align:center;",
        text: `\u26A0\uFE0F Version Mismatch! Expected backend v${targetBackendVer}. Please redeploy Apps Script.`
      }) : null
    )
  );
  const lastSyncText = data?.lastSync ? formatTimeAgo(data.lastSync) : "Never";
  const syncInfoCard = h(
    "div",
    {
      class: "vs-glass",
      style: "padding: 12px; margin-bottom: 12px; border-radius: 8px; border: 1px solid var(--vs-border);"
    },
    h("div", { style: "font-weight:600; font-size:12px; margin-bottom:8px;", text: "Synchronization & Data" }),
    h(
      "div",
      { style: "font-size:11px; display:flex; flex-direction:column; gap:4px;" },
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Un-synced changes queue:" }),
        h("span", {
          style: `font-weight:600; color:${offlineQueue.length > 0 ? "var(--vs-warning, #f59e0b)" : "inherit"};`,
          text: `${offlineQueue.length} batch(es)`
        })
      ),
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Last Sync Timestamp:" }),
        h("span", { style: "font-weight:500;", text: lastSyncText })
      ),
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Spreadsheet Database Size:" }),
        h("span", { style: "font-weight:500;", text: connected ? `${health?.vaultEntries ?? 0} entries` : "Offline" })
      ),
      h(
        "div",
        { style: "display:flex; justify-content:space-between;" },
        h("span", { class: "vs-faint", text: "Local Decrypted Size:" }),
        h("span", { style: "font-weight:500;", text: `${vault.getEntries().length} entries` })
      )
    )
  );
  const statsGrid = h(
    "div",
    { class: "okey-stat-grid" },
    statBox("Total Items", (connected ? data?.totalEntries : vault.getEntries().length) || 0),
    statBox("Active Items", (connected ? data?.activeEntries : vault.getEntries().filter((e) => !e.isDeleted).length) || 0),
    statBox("Folders", (connected ? data?.folders : [...new Set(vault.getEntries().map((e) => e.folder).filter(Boolean))].length) || 0),
    statBox("Deleted", (connected ? data?.deletedEntries : vault.getEntries().filter((e) => e.isDeleted).length) || 0)
  );
  content.append(statusBadge, versionCard, syncInfoCard, statsGrid);
}
async function renderAnalytics() {
  view.name = "analytics";
  view.entryId = null;
  rememberView();
  clear(app);
  const content = h("div", { class: "okey-section-title", style: "margin: 20px", text: "Loading analytics..." });
  app.append(h(
    "div",
    { class: "okey-view" },
    viewHeader("Analytics", renderMain),
    content
  ));
  try {
    let cachedData = null;
    const cached = await local.get([STORAGE_KEYS.BACKEND_ANALYTICS, STORAGE_KEYS.ANALYTICS_CACHE_TIME]);
    const cacheTime = cached[STORAGE_KEYS.ANALYTICS_CACHE_TIME] || 0;
    const now = Date.now();
    if (cached[STORAGE_KEYS.BACKEND_ANALYTICS] && now - cacheTime < 3 * 60 * 1e3) {
      cachedData = cached[STORAGE_KEYS.BACKEND_ANALYTICS];
    }
    let data;
    if (cachedData) {
      data = cachedData;
    } else {
      data = await sync.fetchAnalytics();
      await local.set({
        [STORAGE_KEYS.BACKEND_ANALYTICS]: data,
        [STORAGE_KEYS.ANALYTICS_CACHE_TIME]: now
      });
    }
    clear(content);
    const types = data.entryTypes || {};
    const folders = data.folders || {};
    const typeCanvas = h("canvas", { style: "max-width:100%; max-height:180px;" });
    const folderCanvas = h("canvas", { style: "max-width:100%; max-height:180px;" });
    content.append(
      h("div", { class: "okey-section-title", text: "Entry Types" }),
      h("div", { style: "margin: 12px 0; display:flex; justify-content:center;" }, typeCanvas),
      h("div", { class: "okey-section-title", style: "margin-top:20px", text: "Folder Distribution" }),
      h("div", { style: "margin: 12px 0;" }, folderCanvas)
    );
    const ChartModule = await Promise.resolve().then(() => (init_auto(), auto_exports));
    const Chart2 = ChartModule.Chart || ChartModule.default;
    const typeLabels = Object.keys(types);
    const typeValues = Object.values(types);
    const folderLabels = Object.keys(folders);
    const folderValues = Object.values(folders);
    if (typeLabels.length > 0) {
      new Chart2(typeCanvas, {
        type: "doughnut",
        data: {
          labels: typeLabels,
          datasets: [{
            data: typeValues,
            backgroundColor: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom", labels: { color: "var(--vs-text)" } }
          }
        }
      });
    } else {
      typeCanvas.replaceWith(h("div", { class: "vs-faint", style: "text-align:center; padding:10px;", text: "No type data available" }));
    }
    if (folderLabels.length > 0) {
      new Chart2(folderCanvas, {
        type: "bar",
        data: {
          labels: folderLabels,
          datasets: [{
            label: "Items",
            data: folderValues,
            backgroundColor: "#2563eb",
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: "var(--vs-text)" }, grid: { color: "var(--vs-border)" } },
            y: { ticks: { color: "var(--vs-text)" }, grid: { color: "var(--vs-border)" } }
          }
        }
      });
    } else {
      folderCanvas.replaceWith(h("div", { class: "vs-faint", style: "text-align:center; padding:10px;", text: "No folder data available" }));
    }
  } catch (e) {
    clear(content);
    content.append(h("div", { class: "vs-faint", style: "margin-top: 20px", text: "Unable to fetch analytics: " + e.message }));
  }
}
function statBox(lbl, val) {
  return h(
    "div",
    { class: "okey-stat-box vs-glass" },
    h("div", { class: "okey-stat-val", text: val }),
    h("div", { class: "okey-stat-lbl", text: lbl })
  );
}
boot();
//# sourceMappingURL=popup.js.map
