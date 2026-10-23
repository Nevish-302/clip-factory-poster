import { rng, type Ctx, type Env, type P } from "./core";
import type { Film } from "./film";

// FLAT VECTOR · "Not A Clip Factory" brand set (profile picture, YouTube banner, Facebook cover).
// MEDIUM: pen-tool paths, one flat fill each, crisp edges, no strokes. Shadows are cast shapes with
// a transparency ramp. Grain is a raster speckle clipped to the shade side only.
// MARK: a speech bubble (talks) holding a play button (video), sliced by one clean diagonal cut
// (clip). It is an original mark: no letterform, no existing logo.
// LIGHT: one low sun, upper right. Every shadow falls to the lower left and ramps to nothing.
// PALETTE: navy, cream, coral, mustard, teal in two depths. Same swatches in all three pieces.

const C = { navy: "#13213c", navyD: "#0d1830", cream: "#fff4e0", creamS: "#f0dcbc", coral: "#ff5a3c", coralS: "#d9432a", mustard: "#ffc145", mustardS: "#f0a82a", teal: "#2ec4b6", tealD: "#1f8f86", tealDD: "#16665f" };

const path = (c: Ctx, pts: P[]) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
const fill = (c: Ctx, pts: P[], color: string | CanvasGradient) => { path(c, pts); c.fillStyle = color; c.fill(); };
const rr = (x0: number, y0: number, x1: number, y1: number, r: number): P[] => {
  const out: P[] = [];
  const corner = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * (Math.PI / 2); out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  corner(x1 - r, y0 + r, -Math.PI / 2); corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI);
  return out;
};
// speckle painted in one broad pass over a shape, clipped to it (the grain brush)
const grain = (c: Ctx, pts: P[], box: [number, number, number, number], color: string, n: number, seed: number, size: number) => {
  const r = rng(seed); c.save(); path(c, pts); c.clip(); c.fillStyle = color;
  for (let i = 0; i < n; i++) { const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]); c.fillRect(x, y, size * (0.5 + r()), size * (0.5 + r())); }
  c.restore();
};

// ---------------------------------------------------------------- the mark
const mark = (c: Ctx, cx: number, cy: number, r: number, seed: number) => {
  // sun disc behind, upper right
  c.beginPath(); c.arc(cx + 0.12 * r, cy - 0.08 * r, 1.22 * r, 0, Math.PI * 2); c.fillStyle = C.mustard; c.fill();
  c.save(); c.beginPath(); c.arc(cx + 0.12 * r, cy - 0.08 * r, 1.22 * r, 0, Math.PI * 2); c.clip();
  fill(c, [[cx - 1.4 * r, cy + 0.5 * r], [cx + 1.5 * r, cy - 0.3 * r], [cx + 1.5 * r, cy + 1.5 * r], [cx - 1.4 * r, cy + 1.5 * r]], C.mustardS); // the shade side of the disc
  c.restore();

  const bub = rr(cx - r, cy - 0.74 * r, cx + r, cy + 0.5 * r, 0.3 * r);
  const tail: P[] = [[cx - 0.62 * r, cy + 0.42 * r], [cx - 0.88 * r, cy + 0.98 * r], [cx - 0.1 * r, cy + 0.46 * r]];
  // long shadow, thrown lower-left from the bubble's lower edge, ramped to nothing
  const sx = -1.1 * r, sy = 0.62 * r;
  const sh: P[] = [[cx + 0.7 * r, cy + 0.5 * r], [cx - 0.9 * r, cy + 0.98 * r], [cx - 0.9 * r + sx, cy + 0.98 * r + sy], [cx + 0.7 * r + sx, cy + 0.5 * r + sy]];
  const g = c.createLinearGradient(cx, cy + 0.5 * r, cx + sx, cy + 0.5 * r + sy); g.addColorStop(0, "rgba(8,14,30,0.42)"); g.addColorStop(1, "rgba(8,14,30,0)");
  fill(c, sh, g);

  // the cut: a diagonal that splits the bubble into two halves, nudged apart
  const L0: P = [cx - 0.05 * r, cy - 1.2 * r], L1: P = [cx + 0.42 * r, cy + 1.2 * r];
  const half = (side: 1 | -1, dx: number, dy: number, shade: boolean) => {
    c.save(); c.translate(dx, dy);
    c.beginPath(); c.moveTo(L0[0], L0[1]); c.lineTo(L1[0], L1[1]);
    if (side === 1) { c.lineTo(cx + 2 * r, cy + 2 * r); c.lineTo(cx + 2 * r, cy - 2 * r); } else { c.lineTo(cx - 2 * r, cy + 2 * r); c.lineTo(cx - 2 * r, cy - 2 * r); }
    c.closePath(); c.clip();
    fill(c, bub, C.cream); fill(c, tail, C.cream);
    // shade side of the bubble (its lower part, away from the sun), clipped to the bubble and its tail
    for (const shape of [bub, tail]) {
      c.save(); path(c, shape); c.clip();
      fill(c, [[cx - 2 * r, cy + 0.14 * r], [cx + 2 * r, cy + 0.02 * r], [cx + 2 * r, cy + 2 * r], [cx - 2 * r, cy + 2 * r]], C.creamS);
      c.restore();
    }
    c.restore();
  };
  half(1, 0.05 * r, -0.03 * r, true);
  half(-1, -0.05 * r, 0.03 * r, true);

  // the play button, coral, bridging the cut
  const tri: P[] = [[cx - 0.2 * r, cy - 0.46 * r], [cx - 0.2 * r, cy + 0.2 * r], [cx + 0.42 * r, cy - 0.13 * r]];
  fill(c, [[tri[0][0] - 0.01 * r, tri[0][1] + 0.05 * r], [tri[1][0] - 0.01 * r, tri[1][1] + 0.05 * r], [tri[2][0], tri[2][1] + 0.05 * r]], C.coralS);
  fill(c, tri, C.coral);
};

// ---------------------------------------------------------------- scenery for the wide pieces
const scenery = (c: Ctx, W: number, H: number, seed: number) => {
  c.fillStyle = C.navy; c.fillRect(0, 0, W, H);
  // big low sun off to the right
  c.beginPath(); c.arc(W * 0.9, H * 0.8, H * 0.22, 0, Math.PI * 2); c.fillStyle = C.mustard; c.fill();
  // layered hills, far to near, atmospheric
  const hill = (base: number, amp: number, ph: number, color: string, shade: string, gseed: number) => {
    const pts: P[] = []; const N = 40;
    for (let i = 0; i <= N; i++) { const x = (i / N) * W; pts.push([x, base - amp * (0.55 * Math.sin(i / N * 5.2 + ph) + 0.45 * Math.sin(i / N * 11.3 + ph * 2))]); }
    const poly: P[] = [...pts, [W, H], [0, H]];
    fill(c, poly, color);
  };
  hill(H * 0.80, H * 0.10, 0.6, C.tealD, "rgba(10,60,56,0.35)", seed + 1);
  hill(H * 0.88, H * 0.09, 2.1, C.tealDD, "rgba(5,35,40,0.40)", seed + 2);
  hill(H * 0.96, H * 0.07, 4.0, C.navyD, "rgba(0,0,0,0.30)", seed + 3);
};

// ---------------------------------------------------------------- text
const fit = (c: Ctx, text: string, maxW: number, start: number, weight = 900, track = 0) => {
  let s = start; for (; s > 8; s -= 2) { c.font = `${weight} ${s}px "Helvetica Neue", Arial, sans-serif`; (c as any).letterSpacing = `${track * s}px`; if (c.measureText(text).width <= maxW) break; }
  return s;
};
const text = (c: Ctx, t: string, x: number, y: number, size: number, color: string, weight = 900, track = 0, shadow = 0) => {
  c.font = `${weight} ${size}px "Helvetica Neue", Arial, sans-serif`; (c as any).letterSpacing = `${track * size}px`; c.textBaseline = "alphabetic"; c.textAlign = "left";
  if (shadow) { c.fillStyle = "rgba(8,14,30,0.55)"; c.fillText(t, x - shadow, y + shadow); } // cast shadow, lower left like everything else
  c.fillStyle = color; c.fillText(t, x, y);
};

// lockup inside a safe box: mark left, words right, centred vertically in the box
const lockup = (c: Ctx, box: [number, number, number, number], seed: number) => {
  const [x0, y0, x1, y1] = box, h = y1 - y0, w = x1 - x0;
  const r = h * 0.40, mcx = x0 + r * 1.35, mcy = y0 + h * 0.5 - h * 0.03;
  mark(c, mcx, mcy, r, seed);
  const tx = mcx + r * 1.55, maxW = x1 - tx;
  const s2 = fit(c, "CLIP FACTORY", maxW, h * 0.42, 900, 0.01);
  const s1 = s2 * 0.52, s3 = Math.min(fit(c, "Big talks. Short clips. Credit always.", maxW, s2 * 0.30, 600, 0.01), s2 * 0.30);
  const total = s1 + s2 * 0.95 + s3 * 1.9, top = y0 + (h - total) / 2 + s1 * 0.85;
  text(c, "NOT A", tx + s2 * 0.02, top, s1, C.mustard, 900, 0.14, s1 * 0.04);
  text(c, "CLIP FACTORY", tx, top + s2 * 0.98, s2, C.cream, 900, 0.01, s2 * 0.035);
  // coral underline bar, flat, with its own cast shadow
  const by = top + s2 * 0.98 + s3 * 0.9;
  fill(c, [[tx, by], [tx + maxW * 0.18, by], [tx + maxW * 0.18, by + s3 * 0.22], [tx, by + s3 * 0.22]], C.coral);
  text(c, "Big talks. Short clips. Credit always.", tx, by + s3 * 1.3, s3, C.creamS, 600, 0.01);
};

// ---------------------------------------------------------------- the three pieces
const wrap = (title: string, W: number, H: number, draw: (c: Ctx, W: number, H: number) => void): Film => ({
  meta: { title, W, H, fps: 30, bpm: 60, durationFrames: 1 },
  assets: { images: {} },
  shots: [{ id: title, start: 0, end: 1, draw: (ctx: Ctx, _f: number, env: Env) => { ctx.setTransform(env.scale, 0, 0, env.scale, 0, 0); draw(ctx, env.W, env.H); } }],
});

export const avatarFilm = wrap("avatar", 1080, 1080, (c, W, H) => {
  c.fillStyle = C.navy; c.fillRect(0, 0, W, H);
  // a teal and deep-teal ground inside the circle-safe area so the mark sits on something
  c.save(); c.beginPath(); c.arc(W / 2, H / 2, W * 0.5, 0, Math.PI * 2); c.clip();
  c.fillStyle = C.navy; c.fillRect(0, 0, W, H);
  fill(c, [[0, H * 0.78], [W * 0.3, H * 0.70], [W * 0.62, H * 0.76], [W, H * 0.66], [W, H], [0, H]], C.tealD);
  fill(c, [[0, H * 0.88], [W * 0.4, H * 0.82], [W * 0.75, H * 0.88], [W, H * 0.8], [W, H], [0, H]], C.tealDD);
  c.restore();
  mark(c, W * 0.50, H * 0.46, W * 0.285, 21);
});
export const ytBannerFilm = wrap("ytbanner", 2560, 1440, (c, W, H) => {
  scenery(c, W, H, 5);
  lockup(c, [507 + 20, 508 + 10, 2053 - 20, 931 - 10], 9); // inside YouTube's all-device safe area (1546 x 423, centred)
});
export const fbCoverFilm = wrap("fbcover", 1640, 624, (c, W, H) => {
  scenery(c, W, H, 7);
  lockup(c, [300, 70, 1340, 554], 11); // central area survives the mobile crop
});
