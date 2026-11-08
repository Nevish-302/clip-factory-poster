// The whole job in one pure function so it can be tested without Firebase or Meta.
// store: { readQueue() -> {queue, gen}, writeQueue(queue, gen) -> newGen, getClip(file) -> Buffer, deleteClip(file) }
// pub:   { instagram(buf, caption) -> id, facebookScheduled(buf, caption, unixSeconds) -> id }
// Same rules as post-due.mjs / fb-schedule.mjs / prune.mjs: IG posts what is due (max per tick), a clip failing 3 times is parked,
// Facebook is scheduled natively (>= 11 min ahead, stops at first failure), clips are deleted once done everywhere.
export async function tick({ store, pub, now = new Date(), maxIg = 2, fbLimit = 4, maxAttempts = 3, log = console.log }) {
  let { queue, gen } = await store.readQueue();
  const save = async () => { gen = await store.writeQueue(queue, gen); };
  const done = (e) => e.targets.every((t) => e.results[t]);
  const parked = (e, t) => (e.attempts?.[t] ?? 0) >= maxAttempts;
  const stats = { posted: 0, failed: 0, fbScheduled: 0, deleted: 0 };

  // 1. Instagram: everything due, oldest first.
  const dueIg = queue.filter((e) => e.targets.includes("instagram_reel") && !e.results.instagram_reel && !parked(e, "instagram_reel") && new Date(e.scheduledFor) <= now).slice(0, maxIg);
  for (const e of dueIg) {
    try {
      const id = await pub.instagram(await store.getClip(e.file), e.caption);
      e.results.instagram_reel = id; delete e.errors.instagram_reel; stats.posted++;
      log("posted", e.id, id);
    } catch (err) {
      e.errors.instagram_reel = String(err.message).slice(0, 300);
      e.attempts = { ...(e.attempts || {}), instagram_reel: (e.attempts?.instagram_reel ?? 0) + 1 };
      stats.failed++; log("FAILED", e.id, e.errors.instagram_reel);
    }
    if (done(e)) { e.posted = true; e.postedAt = new Date().toISOString(); }
    await save(); // save after every clip so a crash never causes a double post
  }

  // 2. Facebook: schedule natively, stop at first failure (Meta rate-limits uploads).
  let n = 0;
  for (const e of queue) {
    if (n >= fbLimit) break;
    if (e.results.facebook_reel || !e.targets.includes("facebook_reel")) continue;
    const at = Math.floor(new Date(e.scheduledFor).getTime() / 1000);
    if (at < now.getTime() / 1000 + 11 * 60) continue;
    try {
      e.results.facebook_reel = await pub.facebookScheduled(await store.getClip(e.file), e.caption, at);
      e.facebookScheduled = true; delete e.errors.facebook_reel; n++; stats.fbScheduled++;
      log("scheduled on Facebook", e.id);
      await save();
    } catch (err) {
      e.errors.facebook_reel = String(err.message).slice(0, 300); stats.failed++;
      log("FAILED fb", e.id, e.errors.facebook_reel); await save(); break;
    }
  }

  // 3. Delete clips that are done everywhere (Instagram posted AND Facebook scheduled).
  for (const e of queue) {
    if (e.assetDeleted || !done(e)) continue;
    await store.deleteClip(e.file); e.assetDeleted = true; stats.deleted++;
  }
  if (stats.deleted) await save();
  return stats;
}
