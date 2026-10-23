#!/usr/bin/env node
/**
 * Publish a local video file as a Reel to a Facebook Page and/or an
 * Instagram Business account, via the Graph API's resumable upload flow.
 * No public hosting needed, the file is uploaded directly.
 *
 * Usage:
 *   META_PAGE_ID=... META_IG_USER_ID=... META_ACCESS_TOKEN=... \
 *   node publish-reel.mjs --video ./reel.mp4 --caption "My caption #tags" \
 *     [--targets facebook,instagram] [--thumb-offset-ms 1000]
 *
 * Only pass the ids/token you need for the targets you're posting to
 * (e.g. omit META_PAGE_ID and --targets instagram for an IG-only post).
 *
 * Exits 0 and prints a JSON result ({facebook_reel, instagram_reel} ids) on
 * success. Exits 1 and prints the error on failure.
 */
import { readFile } from "node:fs/promises";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v26.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function parseArgs(argv) {
  const out = { targets: ["facebook", "instagram"], thumbOffsetMs: 1000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--video") out.video = argv[++i];
    else if (a === "--caption") out.caption = argv[++i];
    else if (a === "--targets") out.targets = argv[++i].split(",").map((t) => t.trim());
    else if (a === "--thumb-offset-ms") out.thumbOffsetMs = Number(argv[++i]);
    else if (a === "--schedule-at") out.scheduleAt = Number(argv[++i]); // unix seconds, Facebook only (native scheduled Reel)
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!out.video) throw new Error("--video <path> is required");
  if (!out.caption) throw new Error("--caption <text> is required");
  return out;
}

async function graphPost(path, params) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error (${res.status})`);
  return data;
}

async function graphGet(path, params) {
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error (${res.status})`);
  return data;
}

async function resumableUpload(uploadUrl, token, buffer) {
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${token}`,
      offset: "0",
      file_size: String(buffer.length),
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${detail.slice(0, 300)}`);
  }
}

async function awaitContainerReady(containerId, token, deadlineMs = 10 * 60_000, pollMs = 10_000) {
  const deadline = Date.now() + deadlineMs;
  let status = "IN_PROGRESS";
  while (status === "IN_PROGRESS" && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const check = await graphGet(`/${containerId}`, { fields: "status_code", access_token: token });
    status = check.status_code;
  }
  if (status !== "FINISHED") throw new Error(`Container never finished (status: ${status})`);
}

// Facebook's video_reels endpoint rejects a System User access token outright
// with "(#200) Subject does not have permission to post videos on this
// target", even when that System User has full CREATE_CONTENT/MANAGE rights
// on the Page. It needs the Page's own Page Access Token specifically.
// Instagram publishing doesn't have this quirk. This derives the real Page
// token from whatever token you have, so it works either way.
async function derivePageToken(pageId, token) {
  const page = await graphGet(`/${pageId}`, { fields: "access_token", access_token: token });
  if (!page.access_token) throw new Error("Could not derive a Page access token from the given token");
  return page.access_token;
}

async function publishFacebookReel(pageId, token, videoBuffer, caption, scheduleAt) {
  const pageToken = await derivePageToken(pageId, token);
  const start = await graphPost(`/${pageId}/video_reels`, { upload_phase: "start", access_token: pageToken });
  await resumableUpload(start.upload_url, pageToken, videoBuffer);
  const finish = await graphPost(`/${pageId}/video_reels`, {
    upload_phase: "finish",
    video_id: start.video_id,
    video_state: scheduleAt ? "SCHEDULED" : "PUBLISHED",
    ...(scheduleAt ? { scheduled_publish_time: String(scheduleAt) } : {}),
    description: caption,
    access_token: pageToken,
  });
  if (!finish.success) throw new Error("facebook_reel finish did not report success");
  return start.video_id;
}

async function publishInstagramReel(igUserId, token, videoBuffer, caption, thumbOffsetMs) {
  const container = await graphPost(`/${igUserId}/media`, {
    media_type: "REELS",
    upload_type: "resumable",
    caption,
    thumb_offset: String(thumbOffsetMs),
    access_token: token,
  });
  await resumableUpload(container.uri, token, videoBuffer);
  await awaitContainerReady(container.id, token);
  const published = await graphPost(`/${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  return published.id;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN env var is required");
  const videoBuffer = await readFile(args.video);

  const results = {};
  if (args.targets.includes("facebook")) {
    const pageId = process.env.META_PAGE_ID;
    if (!pageId) throw new Error("META_PAGE_ID env var is required for the facebook target");
    results.facebook_reel = await publishFacebookReel(pageId, token, videoBuffer, args.caption, args.scheduleAt);
  }
  if (args.targets.includes("instagram")) {
    if (args.scheduleAt) throw new Error("--schedule-at is Facebook only: the Instagram API publishes immediately");
    const igUserId = process.env.META_IG_USER_ID;
    if (!igUserId) throw new Error("META_IG_USER_ID env var is required for the instagram target");
    results.instagram_reel = await publishInstagramReel(igUserId, token, videoBuffer, args.caption, args.thumbOffsetMs);
  }
  console.log(JSON.stringify(results));
}

main().catch((err) => {
  console.error(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});
