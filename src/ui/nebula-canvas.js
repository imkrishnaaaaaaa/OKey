/**
 * OKey UI — living Bloom background (light).
 * Pastel washes + soft floating specks + pointer parallax.
 * One rAF loop, pauses when tab hidden, static frame under reduced-motion.
 */

const TAU = Math.PI * 2;

function makeCloudSprite(color, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function mountNebula(canvas) {
  if (!canvas) return { destroy() {} };
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, Hh = 0, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth || innerWidth;
    Hh = canvas.clientHeight || innerHeight;
    canvas.width = W * dpr;
    canvas.height = Hh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  /* floating specks */
  const rnd = mulberry(20260823);
  const specks = Array.from({ length: 46 }, () => ({
    x: rnd(), y: rnd(),
    r: 1 + rnd() * 1.8,
    depth: 0.25 + rnd() * 0.75,
    ph: rnd() * TAU,
    sp: 0.4 + rnd() * 0.9,
  }));

  /* pastel washes — kept in the purple family */
  const sprites = [
    { img: makeCloudSprite('rgba(134,118,240,0.16)'), s: 1.15, x: 0.18, y: 0.10, ax: 0.05, ay: 0.04, t: 26e3, ph: 0 },
    { img: makeCloudSprite('rgba(183,171,255,0.18)'), s: 1.35, x: 0.85, y: 0.28, ax: 0.06, ay: 0.03, t: 34e3, ph: 2 },
    { img: makeCloudSprite('rgba(233,229,255,0.30)'), s: 1.05, x: 0.55, y: 0.95, ax: 0.04, ay: 0.05, t: 42e3, ph: 4 },
    { img: makeCloudSprite('rgba(243,241,255,0.42)'), s: 0.9,  x: 0.08, y: 0.82, ax: 0.05, ay: 0.04, t: 30e3, ph: 1 },
  ];

  /* pointer parallax */
  let px = 0, py = 0, tx = 0, ty = 0;
  function onPointer(e) {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
  }
  addEventListener('pointermove', onPointer, { passive: true });

  let raf = 0, last = performance.now();
  function frame(now) {
    last = now;
    px += (tx - px) * 0.04;
    py += (ty - py) * 0.04;

    ctx.clearRect(0, 0, W, Hh);

    for (const c of sprites) {
      const t = now / c.t + c.ph;
      const cxp = (c.x + Math.sin(t) * c.ax - px * 0.03) * W;
      const cyp = (c.y + Math.cos(t * 0.8) * c.ay - py * 0.03) * Hh;
      const w = Math.max(W, Hh) * c.s * 0.9;
      ctx.globalAlpha = 1;
      ctx.drawImage(c.img, cxp - w / 2, cyp - w / 2, w, w);
    }

    for (const s of specks) {
      const tw = 0.5 + 0.5 * Math.sin(s.ph + now / 1000 * s.sp);
      const sx = (s.x * W - px * 14 * s.depth + W) % W;
      const sy = (s.y * Hh - py * 14 * s.depth + Hh) % Hh;
      ctx.globalAlpha = 0.10 + s.depth * 0.22 * tw;
      ctx.fillStyle = 'rgba(122, 106, 230, 0.9)';
      ctx.beginPath();
      ctx.arc(sx, sy, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (!reduced) raf = requestAnimationFrame(frame);
  }

  if (reduced) {
    frame(performance.now());
  } else {
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(frame); }
    });
  }

  return {
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
    },
  };
}

/* tiny deterministic PRNG so the sky is the same beautiful sky every boot */
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
