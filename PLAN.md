# Plan

## Next
0. Batch 7 (Psych2Go: 4hG9wI5-_Lc, C07DdQbnFMs) per docs/BATCHES.md: narrated animations with no face, so use blur mode; supportive tone, helpline line in mental-health captions, no sensational hooks. Batch 6 is queued (see CHANGELOG). Reuse the python3.12 venv (yt-dlp 2026.10.26 + faster-whisper) or recreate it. Keep hooks to one line (about 22 characters) and run at most 3-4 builds at once.
1. Posting runs on GitHub Actions (see HANDOFF.md). Open items: (a) the user adds `instagram_manage_insights` to the Meta app and regenerates the token, so reach and views can be read (stats are limited to likes and comments without it); (b) regenerate the token that was pasted in chat twice, then update Keychain and the repo secret; (c) check the first posts are public; (d) YouTube Shorts is blocked by Google's API audit rule: decide between applying for the audit and scheduling in YouTube Studio.
2. Volume: batches 1, 2 and 3 (60 clips) are queued at 3 a day through 12 Nov. Make batch 4 before then (candidates in docs/results/clips-ledger.md under "Unused sources"), then use `add-batch.mjs` and `upload-clips.sh`. Delete `~/Downloads/cc-clips/batch3-ready/` once batch 3 has posted.
3. Redo the 4 Hollywood podcast clips with crop v2 (re-download fiyZ09uVfNE, 250 MB). Not urgent.
4. Zoom-in option for wide stage shots (subject too small in vertical).
5. Track results per clip (views, follows) in `results/` to learn which hooks and people work.

## Open questions
- Which platform first: YouTube Shorts or Reels? Monetization eligibility differs and reposted content is demoted on both.
- Whether to add original commentary so the channel counts as transformative.

## Final scheduling pass (requested 2026-11-04, run after the last batch lands)
Goal: 4-5 posts a day in total across all batches (slots IST 09:00, 13:00, 16:30, 20:00, 22:00), no gaps, enough clips queued to cover it.
1. `node post-due.mjs --status`, then count unposted entries per IST day; list days with fewer than 4 or more than 5.
2. Fill the gaps by re-slotting only entries that are not posted and not already scheduled natively on Facebook (facebookScheduled false); never move a posted or FB-scheduled entry. Keep one speaker/source from posting twice in a row.
3. Check runway: unposted clips divided by 5 = days covered. If under 14 days, queue more batches or add sources.
4. Confirm post.yml cron still covers 08:30-23:00 IST, FB scheduling `--limit 4` keeps up, and release storage is fine. Write the result in CHANGELOG.md.
