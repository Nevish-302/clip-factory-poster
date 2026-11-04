# Plan

## Next
0. Roster batches 4-17 are all done; next is the Final scheduling pass below (batches 16 and 17 both landed). Anime/pop culture history: (batch 13 anime clips post 23-25 Nov: check them for mutes or claims before doing batches 16-17; read the risk note in docs/BATCHES.md) (batch 8 career is done in parallel, batch 9 public speaking done). Batches 6, 7 and 9 are queued (see CHANGELOG). Reuse the python3.12 venv (yt-dlp 2026.10.26 + faster-whisper) or recreate it. Run at most 3-4 builds at once; upload-clips.sh can hang on one file when the machine is loaded: start a manual `gh release upload` for the missing clip.
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
