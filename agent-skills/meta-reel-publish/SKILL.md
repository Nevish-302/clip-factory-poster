---
name: meta-reel-publish
description: Publish a local video file as a Reel to a Facebook Page and/or an Instagram Business account, via direct Graph API resumable upload. Use when the user asks to post, publish, or upload a Reel/video to Instagram or Facebook, or to automate/schedule that publishing.
---

# Meta Reel Publish

Publishes a pre-rendered `.mp4` as a Reel directly to a Facebook Page and/or
an Instagram Business account, using the Graph API's resumable upload flow.
No public hosting is needed, the file's bytes go straight to Meta.

Built from a real debugging session (see "The Page token quirk" below) —
don't re-derive this from scratch or from memory of the Graph API docs,
use the script.

## When to use this

The user wants to actually publish a video they already have (or just
rendered) to a real Instagram and/or Facebook account. Not for designing or
rendering the video itself, just getting a finished file onto the platform.

## Prerequisites

1. A Meta Business app with a System User that has, at minimum, these
   permissions granted: `instagram_basic`, `instagram_content_publish`,
   `pages_manage_posts`, `pages_read_engagement`. Add
   `instagram_manage_insights` too if the user will also want performance
   data back.
2. That System User's access token (non-expiring, generated in Meta
   Business Suite > Business Settings > System Users).
3. The target Facebook Page's numeric ID.
4. The target Instagram Business Account's numeric ID (the one connected to
   that Page — find it via `GET /{page-id}?fields=instagram_business_account`).

If the user hasn't set this up yet, that's a one-time manual step in Meta
Business Suite on their end; this skill doesn't walk through creating the
app/System User, only publishing once credentials exist.

## The Page token quirk (read this before debugging a #200 error)

Facebook's `/{page-id}/video_reels` endpoint rejects a System User access
token outright with `(#200) Subject does not have permission to post videos
on this target`, **even when that System User has full
CREATE_CONTENT/MANAGE rights on the Page** (verified via
`GET /{system-user-id}/assigned_pages`). It specifically requires the
Page's own Page Access Token, not the System User token.

Instagram publishing has no such requirement; a System User token works
directly for `/{ig-user-id}/media` and `/media_publish`.

**The script already handles this** by deriving the real Page token at
runtime (`GET /{page-id}?fields=access_token` using whatever token you
give it) before every Facebook publish. Just pass the System User token;
don't try to pre-derive or hardcode a separate Page token yourself.

If you ever see `(#200)` again despite this, it is NOT a Business Settings
permission problem (that was a wrong diagnosis once, don't repeat it) —
check that the token being passed is valid and that `derivePageToken`
actually ran (the error would otherwise be different, e.g. an expired-token
error, not `#200`).

## Usage

```bash
META_ACCESS_TOKEN="<system user token>" \
META_PAGE_ID="<page id>" \
META_IG_USER_ID="<ig business account id>" \
node ~/.claude/skills/meta-reel-publish/scripts/publish-reel.mjs \
  --video ./reel.mp4 \
  --caption "Caption text here.

#hashtag1 #hashtag2"
```

Options:
- `--targets facebook,instagram` (default: both). Use `--targets instagram`
  or `--targets facebook` to post to only one. Omit the unneeded env var
  for whichever target you're skipping (e.g. no `META_PAGE_ID` needed for
  an Instagram-only post).
- `--thumb-offset-ms 1000` (default: `1000`). Instagram only. Sets which
  millisecond of the video becomes the profile-grid cover thumbnail,
  instead of defaulting to frame 0. Pick a frame partway into your hook
  beat so the cover reads as a designed thumbnail, not a mid-fade-in frame.

On success, prints `{"facebook_reel": "<id>", "instagram_reel": "<id>"}` to
stdout and exits 0. On failure, prints `{"error": "<message>"}` to stderr
and exits 1.

## Credential handling (always follow this)

- **Never write the access token to a file, a doc, or any persisted
  memory.** Pass it only as an environment variable, inline, in the same
  command that invokes the script.
- If the user pastes a token directly into chat, treat it as exposed in
  that transcript — tell them so, and recommend they regenerate it after
  you're done if it's meant to stay private.
- For a scheduled/repeated posting pipeline (e.g. GitHub Actions), store
  the token in that platform's own secret store (e.g. `gh secret set`),
  never in a tracked file.

## Automating a schedule

This script posts once, synchronously, given a ready video file. To build
a recurring "post whatever's due" pipeline on top of it (reading a
schedule file, tracking what's already posted, retrying failures), see
`references/scheduling-pattern.md` for the pattern used in
`ig-growth-ops/scripts/post-due-reels.mjs`: per-target independent
retries (one platform failing must never block the other), idempotent
reruns, and pulling the video from a durable store (e.g. a GitHub Release
asset) instead of keeping large files in git.

## Reading performance data back

This skill only publishes. For pulling reach/views/watch-time/skip-rate
after the fact, use the Graph API's `/{media-id}/insights` endpoint
directly (needs `instagram_manage_insights` on the token); valid metric
names drift between API versions, check
`GET /{media-id}/insights` with no `metric` param first if you get a
"metric[0] must be one of..." error, it lists the current valid set.
