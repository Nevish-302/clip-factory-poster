# Plan

## Next
1. Posting: Instagram works (2 test reels live). Facebook: 22 of 30 Reels scheduled natively on Meta (rerun `node fb-schedule.mjs` for the other 8 after Meta's rate limit clears; then remove SKIP_TARGETS from `schedule/run-sweep.sh` is NOT needed, leave it so the sweep never double-posts Facebook). Open items: (a) check the first Facebook Reel is public after it goes out (app was just published); (b) the user enables the 15-minute sweep (`schedule/com.clipfactory.sweep.plist` into ~/Library/LaunchAgents, then `launchctl bootstrap`), blocked for me by the permission system; (c) regenerate the token that was pasted in chat and re-store it in Keychain. YouTube is blocked by Google's API audit rule: decide between applying for the audit and scheduling in YouTube Studio.
2. Volume: a month at 2/day is about 60 clips. Batches 1 and 2 (30 clips) are scheduled through 6 Nov. Batch 3 (30 clips) is ready in `~/Downloads/cc-clips/batch3-ready/` and will be queued next week: append them to the poster repo's `queue.json` (new `SRC` entries in `schedule/build_queue.py` for ma15, ma18, harari, nadella, mills, karp), upload them with `upload-clips.sh` (adjust the folder), push, run the workflow. Candidates for a batch 4 are in the ledger ("Unused sources").
3. Redo the 4 Hollywood podcast clips with crop v2 (re-download fiyZ09uVfNE, 250 MB). Not urgent.
4. Zoom-in option for wide stage shots (subject too small in vertical).
5. Track results per clip (views, follows) in `results/` to learn which hooks and people work.

## Open questions
- Which platform first: YouTube Shorts or Reels? Monetization eligibility differs and reposted content is demoted on both.
- Whether to add original commentary so the channel counts as transformative.
