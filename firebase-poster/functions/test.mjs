import assert from "node:assert";
import { tick } from "./src/core.js";
const mk = (id, at, over = {}) => ({ id, file: id + ".mp4", caption: "c", scheduledFor: at, targets: ["instagram_reel", "facebook_reel"], results: {}, errors: {}, ...over });
function run(queue, pubOver = {}, opts = {}) {
  const calls = { ig: [], fb: [], del: [], writes: 0 };
  let gen = 1;
  const store = {
    readQueue: async () => ({ queue, gen }),
    writeQueue: async (q, g) => { assert.equal(g, gen, "stale generation"); calls.writes++; return ++gen; },
    getClip: async () => Buffer.from("x"), deleteClip: async (f) => calls.del.push(f),
  };
  const pub = { instagram: async (b, c) => { calls.ig.push(c); return "ig" + calls.ig.length; }, facebookScheduled: async (b, c, at) => { calls.fb.push(at); return "fb" + calls.fb.length; }, ...pubOver };
  return tick({ store, pub, log: () => {}, ...opts }).then((s) => ({ s, calls }));
}
const now = new Date("2026-11-08T10:00:00+05:30");
// due IG posts, max 2 per tick, future ones untouched
let q = [mk("a", "2026-11-08T09:00:00+05:30"), mk("b", "2026-11-08T09:30:00+05:30"), mk("c", "2026-11-08T09:45:00+05:30"), mk("d", "2026-11-09T09:00:00+05:30")];
let r = await run(q, {}, { now });
assert.equal(r.s.posted, 2); assert.equal(q[0].results.instagram_reel, "ig1"); assert.ok(!q[2].results.instagram_reel);
// facebook scheduled only for future slots >= 11 min ahead, not past ones
assert.equal(r.s.fbScheduled, 1); assert.ok(q[3].facebookScheduled && !q[0].facebookScheduled);
// failure parks after 3 attempts and does not block others
q = [mk("x", "2026-11-08T09:00:00+05:30"), mk("y", "2026-11-08T09:10:00+05:30")];
const bad = { instagram: async (b, c) => { throw new Error("boom"); } };
for (let i = 0; i < 4; i++) r = await run(q, bad, { now });
assert.equal(q[0].attempts.instagram_reel, 3); assert.match(q[0].errors.instagram_reel, /boom/);
// done everywhere -> posted flag + clip deleted exactly once
q = [mk("z", "2026-11-08T09:00:00+05:30", { results: { facebook_reel: "f" }, facebookScheduled: true })];
r = await run(q, {}, { now }); assert.ok(q[0].posted && q[0].assetDeleted); assert.deepEqual(r.calls.del, ["z.mp4"]);
r = await run(q, {}, { now }); assert.equal(r.calls.del.length, 0);
// nothing due: no uploads
r = await run([mk("n", "2026-11-20T09:00:00+05:30", { results: { facebook_reel: "f" } })], {}, { now }); assert.equal(r.s.posted, 0);
console.log("all tests passed");
