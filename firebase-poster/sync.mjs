// Mirror between this repo's queue.json / the GitHub release and the poster bucket.
//   node sync.mjs push   -> upload clips for every unposted entry that is missing in the bucket, then queue.json (use after add-batch.mjs)
//   node sync.mjs pull   -> download the bucket's queue.json over ./queue.json (do this before add-batch.mjs; the function owns results)
// Needs gcloud logged in. Bucket: gs://<project>-clip-poster
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync as sh } from "node:child_process";
const B = `gs://${process.env.GCLOUD_PROJECT || "gymapp-c9c34"}-clip-poster`;
const q = path.join(import.meta.dirname, "..", "queue.json");
const g = (...a) => sh("gcloud", ["storage", ...a], { stdio: "inherit" });
if (process.argv[2] === "pull") { g("cp", `${B}/queue.json`, q); process.exit(0); }
if (process.argv[2] !== "push") { console.error("usage: node sync.mjs push|pull"); process.exit(1); }
const queue = JSON.parse(fs.readFileSync(q, "utf8"));
const have = new Set(sh("gcloud", ["storage", "ls", `${B}/clips/`], { encoding: "utf8" }).split("\n").map((l) => l.split("/").pop()).filter(Boolean));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clips-"));
for (const e of queue) {
  if (e.assetDeleted || (e.targets.every((t) => e.results[t])) || have.has(e.file)) continue;
  sh("gh", ["release", "download", "clips-v1", "--repo", "Nevish-302/clip-factory-poster", "--pattern", e.file, "--dir", tmp, "--clobber"], { stdio: "inherit" });
  g("cp", path.join(tmp, e.file), `${B}/clips/${e.file}`); fs.rmSync(path.join(tmp, e.file));
}
g("cp", q, `${B}/queue.json`);
