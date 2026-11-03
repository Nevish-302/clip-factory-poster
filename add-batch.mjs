// Append a batch of finished clips to queue.json from a captions file, on the daily slots after the last queued entry.
// usage: node add-batch.mjs --captions docs/results/captions-batch-3.md --sources batch3-sources.json [--slots 09:00,13:00,16:30,20:00,22:00] [--from YYYY-MM-DD] [--dry]
// captions file: sections "## clipname (NNs)" with lines "Hook:", "Caption:", "Hashtags:". sources json: {"prefix": {"title": "...", "url": "..."}} keyed by the part of the clip name before the first "_".
// Clips from the same source are interleaved so one speaker never posts twice in a row. Slots are IST (+05:30).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : process.argv[i + 1]; };
const dry = process.argv.includes("--dry");
const slots = arg("--slots", "09:00,13:00,16:30,20:00,22:00").split(",");
const sources = JSON.parse(fs.readFileSync(path.join(here, arg("--sources")), "utf8"));
const md = fs.readFileSync(path.join(here, arg("--captions")), "utf8");
const qPath = path.join(here, "queue.json");
const queue = JSON.parse(fs.readFileSync(qPath, "utf8"));
const have = new Set(queue.map((e) => e.id));

const clips = [];
for (const m of md.matchAll(/^## (\w+)\b.*?\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) { // (?![\s\S]) is end of input: JS has no \Z
  const id = m[1], body = m[2];
  const field = (n) => (body.match(new RegExp(`^${n}:\\s*(.+)$`, "m")) || [])[1]?.trim();
  const prefix = id.split("_")[0], src = sources[prefix];
  if (!field("Caption") || !src) { console.error("skip (no caption or source):", id); continue; }
  if (have.has(id)) { console.log("already queued:", id); continue; }
  clips.push({ id, prefix, caption: [field("Caption"), `Source: ${src.title} (CC BY) ${src.url}`, field("Hashtags")].filter(Boolean).join("\n\n") });
}

// interleave by source: always take from the source with the most clips left, never the same as the previous one
const groups = {}; clips.forEach((c) => (groups[c.prefix] ||= []).push(c));
const order = []; let last = null;
while (Object.values(groups).some((g) => g.length)) {
  const keys = Object.keys(groups).filter((k) => groups[k].length);
  const pick = keys.filter((k) => k !== last).sort((a, b) => groups[b].length - groups[a].length)[0] ?? keys[0];
  order.push(groups[pick].shift()); last = pick;
}

// fill the first FREE slots from tomorrow (IST) onward: a batch can use the gaps between already queued entries (5 slots a day)
const taken = new Set(queue.map((e) => e.scheduledFor.slice(0, 16)));
const ist = (ms) => new Date(ms + 5.5 * 3600_000).toISOString().slice(0, 10);
let day = arg("--from", ist(Date.now() + 24 * 3600_000));
const next = () => {
  for (;;) {
    for (const s of slots) { const k = `${day}T${s}`; if (!taken.has(k)) { taken.add(k); return `${k}:00+05:30`; } }
    day = ist(new Date(`${day}T12:00:00+05:30`).getTime() + 24 * 3600_000);
  }
};
for (const c of order) {
  const entry = { id: c.id, file: `${c.id}.mp4`, caption: c.caption, scheduledFor: next(), targets: ["instagram_reel", "facebook_reel"], posted: false, results: {}, errors: {} };
  if (dry) console.log("DRY", entry.scheduledFor.slice(0, 16), entry.id); else queue.push(entry);
}
if (!dry) { fs.writeFileSync(qPath + ".tmp", JSON.stringify(queue, null, 2)); fs.renameSync(qPath + ".tmp", qPath); }
console.log(`${order.length} clips ${dry ? "would be " : ""}added; queue now ${dry ? queue.length + order.length : queue.length} entries`);
