// Isolated codebase "poster": one scheduled function that posts the clip queue. It imports nothing from the app's functions,
// reads/writes only its own bucket, uses its own secret and service account, and never throws (a failure only logs).
import { onSchedule } from "firebase-functions/v2/scheduler";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { tick } from "./src/core.js";
import { makePublisher } from "./src/meta.js";

initializeApp();
const TOKEN = defineSecret("CLIP_META_ACCESS_TOKEN");
const BUCKET = process.env.CLIP_BUCKET || `${process.env.GCLOUD_PROJECT}-clip-poster`;

function gcsStore() {
  const bucket = getStorage().bucket(BUCKET);
  const qf = bucket.file("queue.json");
  return {
    async readQueue() {
      const [m] = await qf.getMetadata();
      const [buf] = await bucket.file("queue.json", { generation: m.generation }).download();
      return { queue: JSON.parse(buf.toString()), gen: m.generation };
    },
    async writeQueue(queue, gen) {
      await qf.save(JSON.stringify(queue, null, 2), { contentType: "application/json", preconditionOpts: { ifGenerationMatch: gen } });
      return (await qf.getMetadata())[0].generation;
    },
    async getClip(file) { return (await bucket.file(`clips/${file}`).download())[0]; },
    async deleteClip(file) { await bucket.file(`clips/${file}`).delete({ ignoreNotFound: true }); },
  };
}

export const clipPosterTick = onSchedule(
  {
    schedule: "*/30 8-22 * * *", // every 30 min, 08:00-22:30 IST: covers the 09:00, 13:00, 16:30, 20:00 and 22:00 slots
    timeZone: "Asia/Kolkata",
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 1800,
    maxInstances: 1,
    retryCount: 0,
    secrets: [TOKEN],
    serviceAccount: "clip-poster", // dedicated least-privilege account, created at activation
  },
  async () => {
    try {
      const pub = makePublisher({ token: TOKEN.value(), pageId: process.env.CLIP_META_PAGE_ID, igUserId: process.env.CLIP_META_IG_USER_ID });
      console.log("tick", JSON.stringify(await tick({ store: gcsStore(), pub })));
    } catch (err) {
      console.error("clipPosterTick failed:", err?.message || err); // swallow: nothing else depends on this
    }
  },
);
