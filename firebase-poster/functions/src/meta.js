// Graph API publishing, ported from ../../publish-reel.mjs (same flow, takes a Buffer and a config object instead of env/argv).
const base = (v) => `https://graph.facebook.com/${v || "v26.0"}`;

async function post(B, path, params) {
  const res = await fetch(`${B}${path}`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error (${res.status})`);
  return data;
}
async function get(B, path, params) {
  const res = await fetch(`${B}${path}?${new URLSearchParams(params)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error (${res.status})`);
  return data;
}
async function upload(url, token, buf) {
  const res = await fetch(url, { method: "POST", headers: { Authorization: `OAuth ${token}`, offset: "0", file_size: String(buf.length), "Content-Type": "application/octet-stream" }, body: buf });
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 300)}`);
}

export function makePublisher({ token, pageId, igUserId, version }) {
  const B = base(version);
  return {
    async instagram(buf, caption, thumbOffsetMs = 1000) {
      const c = await post(B, `/${igUserId}/media`, { media_type: "REELS", upload_type: "resumable", caption, thumb_offset: String(thumbOffsetMs), access_token: token });
      await upload(c.uri, token, buf);
      let status = "IN_PROGRESS";
      const end = Date.now() + 10 * 60_000;
      while (status === "IN_PROGRESS" && Date.now() < end) {
        await new Promise((r) => setTimeout(r, 10_000));
        status = (await get(B, `/${c.id}`, { fields: "status_code", access_token: token })).status_code;
      }
      if (status !== "FINISHED") throw new Error(`Container never finished (status: ${status})`);
      return (await post(B, `/${igUserId}/media_publish`, { creation_id: c.id, access_token: token })).id;
    },
    // Facebook's video_reels endpoint needs the Page's own token (a System User token gets error #200).
    async facebookScheduled(buf, caption, scheduleAtSeconds) {
      const page = await get(B, `/${pageId}`, { fields: "access_token", access_token: token });
      if (!page.access_token) throw new Error("Could not derive a Page access token");
      const pt = page.access_token;
      const s = await post(B, `/${pageId}/video_reels`, { upload_phase: "start", access_token: pt });
      await upload(s.upload_url, pt, buf);
      const f = await post(B, `/${pageId}/video_reels`, { upload_phase: "finish", video_id: s.video_id, video_state: "SCHEDULED", scheduled_publish_time: String(scheduleAtSeconds), description: caption, access_token: pt });
      if (!f.success) throw new Error("facebook_reel finish did not report success");
      return s.video_id;
    },
  };
}
