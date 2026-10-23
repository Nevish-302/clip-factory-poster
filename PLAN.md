# Plan

## Next
1. Posting: Instagram works (2 test reels live). Facebook: 22 of 30 Reels scheduled natively on Meta (rerun `node fb-schedule.mjs` for the other 8 after Meta's rate limit clears; then remove SKIP_TARGETS from `schedule/run-sweep.sh` is NOT needed, leave it so the sweep never double-posts Facebook). Open items: (a) check the first Facebook Reel is public after it goes out (app was just published); (b) the user enables the 15-minute sweep (`schedule/com.clipfactory.sweep.plist` into ~/Library/LaunchAgents, then `launchctl bootstrap`), blocked for me by the permission system; (c) regenerate the token that was pasted in chat and re-store it in Keychain. YouTube is blocked by Google's API audit rule: decide between applying for the audit and scheduling in YouTube Studio.
2. Volume: batches 1, 2 and 3 (60 clips) are queued at 3 a day through 12 Nov. Make batch 4 before then (candidates in docs/results/clips-ledger.md under "Unused sources"), then use `add-batch.mjs` and `upload-clips.sh`. Delete `~/Downloads/cc-clips/batch3-ready/` once batch 3 has posted.
3. Redo the 4 Hollywood podcast clips with crop v2 (re-download fiyZ09uVfNE, 250 MB). Not urgent.
4. Zoom-in option for wide stage shots (subject too small in vertical).
5. Track results per clip (views, follows) in `results/` to learn which hooks and people work.

## Open questions
- Which platform first: YouTube Shorts or Reels? Monetization eligibility differs and reposted content is demoted on both.
- Whether to add original commentary so the channel counts as transformative.
