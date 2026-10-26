// Debug tool: run Instagram's container + resumable upload + processing check for a video WITHOUT publishing it.
// usage: META_ACCESS_TOKEN=... META_IG_USER_ID=... node ig-probe.mjs file.mp4 [file2.mp4 ...]
// Prints OK or the error per file. Unpublished containers expire on their own after 24 h.
import { readFile } from "node:fs/promises";

const BASE = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v26.0"}`;
const token = process.env.META_ACCESS_TOKEN, ig = process.env.META_IG_USER_ID;
const post = async (p, params) => { const r = await fetch(`${BASE}${p}`, { method: "POST", body: new URLSearchParams(params) }); const d = await r.json(); if (!r.ok) throw new Error(d?.error?.message ?? `HTTP ${r.status}`); return d; };

const chunk = Number(process.env.CHUNK || 0); // bytes; 0 = one request
for (const file of process.argv.slice(2)) {
  try {
    const buf = await readFile(file);
    const c = await post(`/${ig}/media`, { media_type: "REELS", upload_type: "resumable", caption: "probe", access_token: token });
    for (let off = 0; off < buf.length; off += chunk || buf.length) {
      const part = chunk ? buf.subarray(off, off + chunk) : buf;
      const up = await fetch(c.uri, { method: "POST", headers: { Authorization: `OAuth ${token}`, offset: String(off), file_size: String(buf.length), "Content-Type": "application/octet-stream" }, body: part });
      if (!up.ok) throw new Error(`upload ${up.status} at offset ${off}: ${(await up.text()).slice(0, 200)}`);
    }
    let status = "IN_PROGRESS";
    for (let i = 0; i < 30 && status === "IN_PROGRESS"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const s = await (await fetch(`${BASE}/${c.id}?fields=status_code,status&access_token=${token}`)).json();
      status = s.status_code; if (status === "ERROR") throw new Error(`processing error: ${JSON.stringify(s.status)}`);
    }
    console.log("OK  ", file, status);
  } catch (e) { console.log("FAIL", file, String(e.message).slice(0, 220)); }
}
