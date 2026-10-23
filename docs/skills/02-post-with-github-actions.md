# 02 Post with GitHub Actions

Goal: post about 2 clips a day for a month without the user's Mac being on and without them uploading anything by hand.

## What each platform allows
- **Facebook Reels: native scheduling.** The Reels endpoint's finish call takes `video_state=SCHEDULED` and `scheduled_publish_time` (unix seconds, at least about 10 minutes ahead). Meta publishes it. Scheduled Reels are hidden from the public Page and show in Meta Business Suite under Content, then Scheduled. Verified with Meta: `published:false`, `publish_status:scheduled`.
- **Instagram Reels: no native scheduling in the API.** It publishes immediately (cap 50 posts per 24 h). A job must post at the slot.
- **YouTube Shorts: not built.** API projects created after July 2020 that have not passed Google's audit force uploads private. Decide: apply for the audit, or schedule in YouTube Studio.
- Meta throttles uploads ("we limit how often you can post"). It hit after 22 scheduled uploads in a row. Stop, retry hours later.

## The system
Repo: `~/Development/Projects/clip-factory-poster` (GitHub `Nevish-302/clip-factory-poster`, private).
- `queue.json`: one entry per clip: `id`, `file`, `caption` (includes the source credit line), `scheduledFor` (2/day at 13:00 and 20:00 IST), `targets`, `results`, `errors`. It is both schedule and state.
- `post-due.mjs`: posts Instagram for entries whose time has passed. Per target independent, safe to re-run, idle runs make no API calls. Downloads each video from the release (`gh release download`), posts, deletes it.
- `fb-schedule.mjs`: schedules Facebook Reels natively, saves after every clip, stops at the first failure and continues next run.
- `publish-reel.mjs`: copy of the meta-reel-publish script, with `--schedule-at <unix>` (Facebook only).
- `.github/workflows/post.yml`: cron (UTC) 07:35 and 08:05 (after the 13:00 IST slot), 14:35 and 15:05 (after 20:00 IST), 20:00 (finish scheduling Facebook). Runs the two scripts, then commits `queue.json` back as state. Concurrency group `post`.
- `prune.mjs`: deletes a clip's video from the release once Instagram is posted and Facebook is scheduled (Meta keeps its own copy), then saves state. It runs as a workflow step before "Save state". The user asked for videos to be deleted after posting.
- Videos live in the `clips-v1` release (30 files, about 590 MB): never commit mp4 files. Do not upload with one big `gh release create` (a 30-file upload timed out, HTTP 408): create the release empty, then run `upload-clips.sh` (one file at a time, 4 retries, skips files already there).
- Next batches: append new entries to `queue.json` (same shape, later `scheduledFor`), upload their videos to the release, push, run `gh workflow run post.yml`. Facebook scheduling is limited to about 29 days ahead (unverified) and Meta throttles after roughly 22 uploads in a row: `fb-schedule.mjs --limit 4` per run keeps under it.
- Few runs a day on purpose: a private repo has 2,000 free minutes a month (a 15-minute cron would use about 2,900).
- GitHub cron can be delayed 10+ minutes; a late run still posts what is due, never twice.

## One-time setup (the user runs these; the permission system blocks Claude from storing secrets and uploading)
```
# secrets, piped from the macOS Keychain (account clipfactory) so nothing is typed or printed
for k in META_ACCESS_TOKEN META_PAGE_ID META_IG_USER_ID; do security find-generic-password -a clipfactory -s $k -w | tr -d '\n' | gh secret set $k --repo Nevish-302/clip-factory-poster; done
# the clips
gh release create clips-v1 --repo Nevish-302/clip-factory-poster --title "clips v1" --notes "30 clips" ~/Downloads/cc-clips/post-ready/*.mp4
# first run, then watch it
gh workflow run post.yml --repo Nevish-302/clip-factory-poster
gh run list --repo Nevish-302/clip-factory-poster --limit 3
```

## Running and checking
- Status: `node post-due.mjs --status`; dry run: `node post-due.mjs --dry --now <ISO>`; Facebook: `node fb-schedule.mjs --dry`.
- Daily: look at the Actions run list and the Facebook Scheduled view; entries with `errors` or long overdue need attention.
- If the token changes: regenerate it, update Keychain (`security add-generic-password -U -a clipfactory -s META_ACCESS_TOKEN -w`) and the repo secret.

## Rules
- Never write the token to a file or memory; Keychain and repo secrets only. A token pasted in chat is exposed: regenerate it.
- Posting, scheduling, uploads and background jobs are real-world actions: do them only with the user's go-ahead that turn. A local launchd job was blocked by the permission system, which is why GitHub Actions is used instead.
- Check the first Facebook Reel is public after it goes out (the app was published only after the first uploads).
- A local `schedule/` folder in clip-factory has the earlier Mac-based version (launchd plist, never installed). Do not run both: the repo's `queue.json` is the source of truth.
