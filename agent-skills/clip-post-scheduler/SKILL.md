---
name: clip-post-scheduler
description: Schedule and publish the finished clip-factory clips to Instagram Reels, Facebook Reels and (when allowed) YouTube Shorts, about 2 per day. Use when the user asks to post, schedule, queue, check posting status, retry failures, rebuild the schedule, or set up posting credentials for the clips in ~/Downloads/cc-clips/ready.
---

# Clip post scheduler

Builds on `cc-clip-factory` (makes the clips) and `meta-reel-publish` (posts one Reel to a Facebook Page / Instagram Business account). Folder: `/Users/nevish-302/Development/Projects/count-calories/clip-factory/schedule/`.

## Pieces
- `build_queue.py [YYYY-MM-DD]` builds `queue.json` from the ready clips and `results/captions-batch-*.md`: 2 posts/day (13:00 and 20:00 IST), interleaved so one speaker never posts twice in a row. Each caption gets a "Source ... (CC BY) URL" line; the Deepika clips keep the helpline line. Refuses to overwrite a queue that already has posts unless `--force`.
- `post-due.mjs` sweeps the queue: posts entries whose time has passed, per platform independently, safe to re-run. Flags: `--dry`, `--status`, `--now ISO`, `--max N` (default 2 per sweep).
- `run-sweep.sh` reads credentials from the macOS Keychain (account `clipfactory`; items `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`) and runs the sweep. To run it on a schedule, a launchd job (every 15 minutes) is needed. That job is NOT created or installed until the user agrees in that turn.

## Rules
- Never write tokens to a file, doc, memory or chat. The user stores them in Keychain themselves (prompts, hidden): `! security add-generic-password -a clipfactory -s META_ACCESS_TOKEN -w`. If a token is pasted in chat, tell them it is exposed and should be regenerated.
- Never post, install a background job, create a repo, or upload anything without the user's go-ahead in that turn. A dry run (`--dry`) is always fine.
- Instagram API caps at 50 posts per 24 h and has no native scheduling: our sweep is the scheduler. Create the post close to its time.
- The Mac must be awake. A missed sweep posts late on the next run (never twice).
- YouTube: API projects created after 2020 that have not passed Google's audit force uploads private. Not built; see research/findings.md. Do not work around it; ask the user whether to apply for the audit or schedule Shorts in YouTube Studio.
- Sensitive clips (mental health) keep their helpline line.

## Workflow
1. Preview: `node post-due.mjs --status`, `node post-due.mjs --dry --now <ISO>`.
2. First live test: post ONE clip with `meta-reel-publish` to the real accounts (the user watches it appear) before enabling any sweep.
3. Enable the sweep only after step 2 works and the user says go. Check `sweep.log` and `--status` daily; any entry with `errors` or overdue needs attention.
4. After new clips are made: update the ready folder and captions, then rebuild with `python3 -I build_queue.py <start-date>` (only if nothing has posted yet; otherwise append entries by hand).
5. Log work in `clip-factory/CHANGELOG.md` and `PLAN.md`.
