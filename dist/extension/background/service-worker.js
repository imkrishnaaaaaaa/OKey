// src/extension/lib/messages.js
var MSG = Object.freeze({
  // Vault lifecycle (status is derived from session presence)
  VAULT_LOCKED: "VAULT_LOCKED",
  LOCK_VAULT: "LOCK_VAULT",
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
  TOUCH_SESSION: "TOUCH_SESSION"
});

// src/core/constants.js
var APP = Object.freeze({
  NAME: "OKey",
  VERSION: "1.0.0",
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
  MIN_MASTER_PASSWORD_LENGTH: 10
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
  sessionReunlockCooldown: SECURITY.SESSION_REUNLOCK_COOLDOWN_MINUTES,
  clipboardClearTimeout: SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS,
  biometricEnabled: false,
  autoSyncEnabled: true,
  syncIntervalMinutes: SYNC.DEFAULT_INTERVAL_MINUTES,
  showRecents: true,
  recentsMaxCount: 10,
  faviconsEnabled: true,
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
  FOLDERS_CACHE_TIME: "okey_folders_cache_time"
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
  const version = new Uint8Array([ENVELOPE_VERSION]);
  const ct = new Uint8Array(
    await subtle().encrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: version },
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
  const version = envelope[0];
  if (version !== ENVELOPE_VERSION) throw new FormatError(`Unsupported envelope version ${version}`);
  const iv = envelope.subarray(1, 1 + CRYPTO.IV_LENGTH);
  const ct = envelope.subarray(1 + CRYPTO.IV_LENGTH);
  try {
    const pt = await subtle().decrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: new Uint8Array([version]) },
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
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
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
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
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
    const index = i << 1;
    buf[i] = hexCharCodesToInt(str.charCodeAt(index), str.charCodeAt(index + 1));
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
      const view = new DataView(wasmInstance.exports.memory.buffer);
      const stateSize = view.getUint32(wasmInstance.exports.STATE_SIZE, true);
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
var data$k = "AGFzbQEAAAABKQVgAX8Bf2AAAX9gEH9/f39/f39/f39/f39/f38AYAR/f39/AGACf38AAwYFAAECAwQFBgEBAoCAAgYIAX8BQZCoBAsHQQQGbWVtb3J5AgASSGFzaF9TZXRNZW1vcnlTaXplAAAOSGFzaF9HZXRCdWZmZXIAAQ5IYXNoX0NhbGN1bGF0ZQAECvEyBVgBAn9BACEBAkAgAEEAKAKICCICRg0AAkAgACACayIAQRB2IABBgIB8cSAASWoiAEAAQX9HDQBB/wHADwtBACEBQQBBACkDiAggAEEQdK18NwOICAsgAcALcAECfwJAQQAoAoAIIgANAEEAPwBBEHQiADYCgAhBACgCiAgiAUGAgCBGDQACQEGAgCAgAWsiAEEQdiAAQYCAfHEgAElqIgBAAEF/Rw0AQQAPC0EAQQApA4gIIABBEHStfDcDiAhBACgCgAghAAsgAAvcDgECfiAAIAQpAwAiECAAKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAMIBAgDCkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgBCAQIAQpAwCFQiiJIhA3AwAgACAQIAApAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAwgECAMKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAEIBAgBCkDAIVCAYk3AwAgASAFKQMAIhAgASkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDSAQIA0pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAEgECABKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACANIBAgDSkDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAIgBikDACIQIAIpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIA4gECAOKQMAhUIgiSIQNwMAIAogECAKKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACACIBAgAikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDiAQIA4pAwCFQjCJIhA3AwAgCiAQIAopAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACADIAcpAwAiECADKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAPIBAgDykDAIVCIIkiEDcDACALIBAgCykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAyAQIAMpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA8gECAPKQMAhUIwiSIQNwMAIAsgECALKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgACAFKQMAIhAgACkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDyAQIA8pAwCFQiCJIhA3AwAgCiAQIAopAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAUgECAFKQMAhUIoiSIQNwMAIAAgECAAKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAPIBAgDykDAIVCMIkiEDcDACAKIBAgCikDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBSAQIAUpAwCFQgGJNwMAIAEgBikDACIQIAEpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAwgECAMKQMAhUIgiSIQNwMAIAsgECALKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACAGIBAgBikDAIVCKIkiEDcDACABIBAgASkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgDCAQIAwpAwCFQjCJIhA3AwAgCyAQIAspAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIAYgECAGKQMAhUIBiTcDACACIAcpAwAiECACKQMAIhF8IBFCAYZC/v///x+DIBBC/////w+DfnwiEDcDACANIBAgDSkDAIVCIIkiEDcDACAIIBAgCCkDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgByAQIAcpAwCFQiiJIhA3AwAgAiAQIAIpAwAiEXwgEEL/////D4MgEUIBhkL+////H4N+fCIQNwMAIA0gECANKQMAhUIwiSIQNwMAIAggECAIKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAHIBAgBykDAIVCAYk3AwAgAyAEKQMAIhAgAykDACIRfCARQgGGQv7///8fgyAQQv////8Pg358IhA3AwAgDiAQIA4pAwCFQiCJIhA3AwAgCSAQIAkpAwAiEXwgEUIBhkL+////H4MgEEL/////D4N+fCIQNwMAIAQgECAEKQMAhUIoiSIQNwMAIAMgECADKQMAIhF8IBBC/////w+DIBFCAYZC/v///x+DfnwiEDcDACAOIBAgDikDAIVCMIkiEDcDACAJIBAgCSkDACIRfCAQQv////8PgyARQgGGQv7///8fg358IhA3AwAgBCAQIAQpAwCFQgGJNwMAC98aAQN/QQAhBEEAIAIpAwAgASkDAIU3A5AIQQAgAikDCCABKQMIhTcDmAhBACACKQMQIAEpAxCFNwOgCEEAIAIpAxggASkDGIU3A6gIQQAgAikDICABKQMghTcDsAhBACACKQMoIAEpAyiFNwO4CEEAIAIpAzAgASkDMIU3A8AIQQAgAikDOCABKQM4hTcDyAhBACACKQNAIAEpA0CFNwPQCEEAIAIpA0ggASkDSIU3A9gIQQAgAikDUCABKQNQhTcD4AhBACACKQNYIAEpA1iFNwPoCEEAIAIpA2AgASkDYIU3A/AIQQAgAikDaCABKQNohTcD+AhBACACKQNwIAEpA3CFNwOACUEAIAIpA3ggASkDeIU3A4gJQQAgAikDgAEgASkDgAGFNwOQCUEAIAIpA4gBIAEpA4gBhTcDmAlBACACKQOQASABKQOQAYU3A6AJQQAgAikDmAEgASkDmAGFNwOoCUEAIAIpA6ABIAEpA6ABhTcDsAlBACACKQOoASABKQOoAYU3A7gJQQAgAikDsAEgASkDsAGFNwPACUEAIAIpA7gBIAEpA7gBhTcDyAlBACACKQPAASABKQPAAYU3A9AJQQAgAikDyAEgASkD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";
var hash$k = "e4cdc523";
var wasmJson$k = {
  name: name$k,
  data: data$k,
  hash: hash$k
};
var name$j = "blake2b";
var data$j = "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";
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
    const version = 19;
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
    initVectorView.setInt32(16, version, true);
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
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
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
    const { view, buffer, blockLen } = this;
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
        this.process(view, 0);
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
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
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
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
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
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
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
function astr(label, input) {
  if (typeof input !== "string")
    throw new Error(`${label}: string expected`);
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
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label}: array of numbers expected`);
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
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
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
function convertRadix(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber2(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit2 = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit2;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit2 !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
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
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber2(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
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
  return true;
}

// src/core/util.js
function generateUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = b[6] & 15 | 64;
  b[8] = b[8] & 63 | 128;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function deepClone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
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
   * Unlock with the master password.
   * @param {string} masterPassword
   * @returns {Promise<void>}
   * @throws {DecryptionError} on wrong password
   */
  async unlock(masterPassword) {
    const c = await this._loadContainer();
    if (!c.salt || !c.wrappedMaster) throw new ValidationError("Vault is not initialized");
    const { kek } = await deriveKek(masterPassword, c.salt, c.kdfParams);
    let dek;
    try {
      dek = await unwrapKeyMaterial(c.wrappedMaster, kek);
    } catch (e) {
      secureWipe(kek);
      throw new DecryptionError("Incorrect master password");
    }
    secureWipe(kek);
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
    const set = new Set(ids);
    let changed = false;
    for (const e of this._entries) {
      if (set.has(e.id) && !e.isDeleted) {
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
  if (typeof pw !== "string" || pw.length < 10) {
    throw new ValidationError("Master password must be at least 10 characters");
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
  async addProfile({ label, appsScriptUrl, sheetId }) {
    const trimmedUrl = (appsScriptUrl || "").trim();
    if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
      throw new SyncError("Apps Script URL must start with https://script.google.com/", "BAD_URL");
    }
    const sheets = await this.getProfiles();
    if (sheets.length >= APP.MAX_SHEETS) throw new SyncError(`Maximum ${APP.MAX_SHEETS} vaults`, "MAX_SHEETS");
    const trimmedLabel = (label || `Vault ${sheets.length + 1}`).trim();
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
      isActive: sheets.length === 0
    };
    sheets.push(profile);
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
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
      p.appsScriptUrl = trimmedUrl;
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    return p;
  }
  async removeProfile(id) {
    let sheets = await this.getProfiles();
    const wasActive = sheets.find((s) => s.id === id)?.isActive;
    sheets = sheets.filter((s) => s.id !== id);
    if (wasActive && sheets.length) sheets[0].isActive = true;
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
  }
  async switchProfile(id) {
    const sheets = await this.getProfiles();
    for (const s of sheets) s.isActive = s.id === id;
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
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
  async pushSettings(settings) {
    return this._call("saveSettings", { settings });
  }
  /** Pull user settings from the Sheet. */
  async pullSettings() {
    const r = await this._call("getSettings", {});
    return r.settings || {};
  }
  /**
   * Perform a delta sync for the given vault.
   * @param {import('./vault.js').Vault} vault unlocked vault
   * @returns {Promise<{ pushed:number, pulled:number, conflicts:number }>}
   */
  async sync(vault) {
    const { [STORAGE_KEYS.LAST_SYNC_AT]: lastSyncAt = EPOCH } = await this.storage.get(STORAGE_KEYS.LAST_SYNC_AT);
    const records = await vault.exportRecords();
    const modified = records.filter((r) => (r.updatedAt || EPOCH) > lastSyncAt);
    let result;
    try {
      result = await this._call("syncEntries", { lastSyncAt, entries: modified });
    } catch (e) {
      await this._enqueue(modified);
      throw e;
    }
    const pulled = result.updatedEntries || [];
    const { applied } = await vault.mergeRemoteRecords(pulled);
    await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: result.serverTimestamp || nowIso() });
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

// src/extension/lib/migration.js
async function migrateLegacyStorage() {
  const flag = (await chrome.storage.local.get(STORAGE_KEYS.SCHEMA_MIGRATED))[STORAGE_KEYS.SCHEMA_MIGRATED];
  if (flag) return { migrated: 0 };
  const legacyKeys = Object.keys(LEGACY_STORAGE_KEYS);
  const existing = await chrome.storage.local.get(legacyKeys);
  const toSet = {};
  const toRemove = [];
  let migrated = 0;
  for (const [legacy, modern] of Object.entries(LEGACY_STORAGE_KEYS)) {
    if (existing[legacy] !== void 0) {
      toSet[modern] = existing[legacy];
      toRemove.push(legacy);
      migrated++;
    }
  }
  if (migrated) {
    await chrome.storage.local.set(toSet);
    await chrome.storage.local.remove(toRemove);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.SCHEMA_MIGRATED]: true });
  return { migrated };
}

// src/extension/lib/session.js
var K = {
  DEK: "okey_session_dek",
  EXPIRY: "okey_session_expiry",
  VIEW: "okey_session_view",
  POPUP_OPEN: "okey_popup_open"
};
async function hardenSession() {
  try {
    await chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  } catch {
  }
}
async function touchSession(autoLockSeconds = SECURITY.DEFAULT_AUTO_LOCK_SECONDS) {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY]);
  if (!s[K.DEK]) return false;
  if (s[K.EXPIRY] && Date.now() >= s[K.EXPIRY]) {
    await clearSession();
    return false;
  }
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  await chrome.storage.session.set({ [K.EXPIRY]: Date.now() + seconds * 1e3 });
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: seconds / 60 });
  return true;
}
async function getCachedDek(autoLockSeconds = SECURITY.DEFAULT_AUTO_LOCK_SECONDS) {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY]);
  if (!s[K.DEK]) return null;
  if (s[K.EXPIRY] && Date.now() >= s[K.EXPIRY]) {
    await clearSession();
    return null;
  }
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  await chrome.storage.session.set({ [K.EXPIRY]: Date.now() + seconds * 1e3 });
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: seconds / 60 });
  return base64ToBytes(s[K.DEK]);
}
async function clearSession() {
  await chrome.storage.session.remove([K.DEK, K.EXPIRY]);
  await chrome.alarms.clear(SYNC.AUTO_LOCK_ALARM);
}
async function isPopupOpen() {
  const v = (await chrome.storage.session.get(K.POPUP_OPEN))[K.POPUP_OPEN];
  return !!v && Date.now() - v < 3e4;
}
function clamp(n, lo, hi) {
  return Math.min(Math.max(Number(n) || lo, lo), hi);
}

// src/extension/background/service-worker.js
var local = new ChromeStorageAdapter("local");
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onStartup.addListener(hardenSession);
chrome.runtime.onMessage.addListener(onMessage);
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.idle.setDetectionInterval(SECURITY.IDLE_DETECTION_INTERVAL);
chrome.idle.onStateChanged.addListener(onIdle);
async function onInstalled(details) {
  await hardenSession();
  await migrateLegacyStorage();
  if (details.reason === "install") {
    const cur = await local.get(STORAGE_KEYS.SETTINGS);
    if (!cur[STORAGE_KEYS.SETTINGS]) await local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
  }
  await scheduleSyncAlarm();
}
async function scheduleSyncAlarm() {
  const settings = await getSettings();
  await chrome.alarms.create(SYNC.ALARM_NAME, {
    periodInMinutes: clampInterval(settings.syncIntervalMinutes)
  });
}
function onMessage(message, sender, sendResponse) {
  (async () => {
    try {
      sendResponse(await route(message, sender));
    } catch (err) {
      sendResponse({ success: false, error: err.message, code: err.code });
    }
  })();
  return true;
}
async function route(message) {
  switch (message.type) {
    case MSG.GET_SETTINGS:
      return { success: true, settings: await getSettings() };
    case MSG.UPDATE_SETTINGS:
      return updateSettings(message.settings);
    case MSG.COPY_TO_CLIPBOARD:
      return scheduleClipboardClear();
    case MSG.GET_CURRENT_SITE:
      return getCurrentSite();
    case MSG.GET_SITE_CREDENTIALS:
      return getSiteCredentials(message.url);
    case MSG.TRIGGER_SYNC:
      return backgroundSync();
    case MSG.LOCK_VAULT:
      await clearSession();
      broadcast(MSG.VAULT_LOCKED);
      return { success: true };
    case MSG.TOUCH_SESSION:
      const settings = await getSettings();
      await touchSession(settings.autoLockTimeout);
      return { success: true };
    case MSG.RESCHEDULE_SYNC:
      await scheduleSyncAlarm();
      return { success: true };
    default:
      return { success: false, error: `Unknown message: ${message.type}` };
  }
}
async function getSettings() {
  const s = await local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...s[STORAGE_KEYS.SETTINGS] || {} };
}
async function updateSettings(patch) {
  const merged = { ...await getSettings(), ...patch };
  await local.set({ [STORAGE_KEYS.SETTINGS]: merged });
  if (patch.syncIntervalMinutes) await scheduleSyncAlarm();
  return { success: true, settings: merged };
}
async function scheduleClipboardClear() {
  const settings = await getSettings();
  const secs = clampClip(settings.clipboardClearTimeout);
  await chrome.alarms.create(SYNC.CLIPBOARD_ALARM, { delayInMinutes: secs / 60 });
  return { success: true, clearInSeconds: secs };
}
async function getCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return { success: true, url: tab?.url || "", title: tab?.title || "", domain: extractDomain(tab?.url || "") };
  } catch {
    return { success: false, error: "No active tab" };
  }
}
async function getSiteCredentials(url) {
  const vault = await openTransientVault();
  if (!vault) return { success: true, locked: true, matches: [], others: [] };
  const all = vault.getEntries({ type: "password" });
  const ranked = matchDomain(url, all);
  const rankedIds = new Set(ranked.map((m) => m.id));
  const toCred = (e) => ({
    id: e.id,
    siteName: e.siteName || e.domain,
    domain: e.domain,
    username: e.username,
    password: e.password,
    hasTotp: !!e.totpSecret
  });
  const matches = ranked.map((m) => toCred(all.find((e) => e.id === m.id))).filter(Boolean);
  const others = all.filter((e) => !rankedIds.has(e.id)).slice(0, 8).map(toCred);
  vault.lock();
  return { success: true, locked: false, matches, others };
}
async function backgroundSync() {
  if (await isPopupOpen()) return { success: false, skipped: "popup-open" };
  const vault = await openTransientVault();
  if (!vault) return { success: false, skipped: "locked" };
  try {
    const engine = new SyncEngine(local, chromeNetwork);
    const result = await engine.sync(vault);
    broadcast(MSG.SYNC_COMPLETE, { result });
    return { success: true, ...result };
  } catch (err) {
    broadcast(MSG.SYNC_ERROR, { error: err.message });
    return { success: false, error: err.message };
  } finally {
    vault.lock();
  }
}
async function openTransientVault() {
  const settings = await getSettings();
  const dek = await getCachedDek(settings.autoLockTimeout);
  if (!dek) return null;
  const vault = new Vault(local);
  try {
    await vault.unlockWithDek(dek);
    return vault;
  } catch {
    return null;
  } finally {
    dek.fill(0);
  }
}
async function onAlarm(alarm) {
  switch (alarm.name) {
    case SYNC.AUTO_LOCK_ALARM:
      await clearSession();
      broadcast(MSG.VAULT_LOCKED);
      break;
    case SYNC.CLIPBOARD_ALARM:
      await clearClipboard();
      break;
    case SYNC.ALARM_NAME:
      await backgroundSync();
      break;
  }
}
async function clearClipboard() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => navigator.clipboard.writeText("").catch(() => {
        })
      });
    }
  } catch {
  }
}
async function onIdle(state) {
  if (state === "locked") {
    await clearSession();
    broadcast(MSG.VAULT_LOCKED);
  }
}
function broadcast(type, extra = {}) {
  chrome.runtime.sendMessage({ type, ...extra }).catch(() => {
  });
}
function clampInterval(m) {
  return Math.min(Math.max(Number(m) || SYNC.DEFAULT_INTERVAL_MINUTES, SYNC.MIN_INTERVAL_MINUTES), SYNC.MAX_INTERVAL_MINUTES);
}
function clampClip(s) {
  return Math.min(Math.max(Number(s) || SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS), SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS);
}
//# sourceMappingURL=service-worker.js.map
