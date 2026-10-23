---
name: cc-clip-factory
description: Turn Creative Commons (CC BY) YouTube videos into captioned 9:16 clips for Reels, Shorts and Facebook. Use when the user asks to find videos to clip, cut reels/shorts from long videos, make a batch of clips, redo a clip's framing, or schedule clip posts. Covers source selection and licensing checks, download, transcription, moment picking, shot-locked face-tracked cropping, captions and credit lines.
---

# CC clip factory

Project folder: `/Users/nevish-302/Development/Projects/count-calories/clip-factory/` (README, scripts, research, results, CHANGELOG, PLAN). Read `README.md` and `research/findings.md` first, `PLAN.md` for what's next. Finished clips go to `~/Downloads/cc-clips/ready/`.

After each unit of work: add a dated entry to `CHANGELOG.md`, update `results/clips-ledger.md` and `PLAN.md`, put new findings in `research/`.

## Rules that matter
- Only CC BY sources. `scripts/dl.py` reads the license from YouTube metadata and skips the rest. Every post needs a credit line (title, creator, link, CC BY).
- Prefer owners licensing their own content: World Economic Forum, independent creators, podcasts that own their footage. The CC flag is uploader-set, so reject music labels, TV/movie clips, news broadcasts.
- Reject: heavy profanity or slurs, burned-in captions or watermarks, non-English audio (Whisper is `small.en`), stock-footage-only videos, studio movie clips.
- Sensitive topics (mental health): supportive tone, add helpline line, no sensational hooks.
- Never bypass YouTube blocks (cookies, token spoofing, proxies). Keep scraping light; a bot check appears after a few hundred requests. Fix 403s by updating yt-dlp and having deno installed.
- Check disk space before downloading (`df -h /System/Volumes/Data`). Sources are 150 MB to 1.3 GB. Delete a source once its clips are cut and the user is happy.
- Don't post or schedule anything without the user's accounts being connected by them; never handle their passwords.

## Workflow
1. Find: `clip-factory/find.sh "topic" 200000` (CC filter, flat search). Pick famous people or strong niches the user names. Check duration (podcasts 20-60 min are best).
2. Download from `clip-factory/work/` (`mkdir -p src tx out`): `python3 -I ../scripts/dl.py ID ...`, move mp4 into `src/`.
3. Transcribe: `python3 -I ../scripts/tx.py ID` (run in the background, about 20 min per hour of audio). Short videos first so the user sees output early.
4. Pick 3-5 clips per long video: 25-90 s, starts on a sentence start and ends on a sentence end, one idea, a hook in the first line, no sponsor reads, profanity masked in captions (`MASK` in build.py) or avoided. Use segment times from `tx/ID.json`.
5. Build: `python3 -I ../scripts/build.py ID START END "HOOK TEXT" outname MODE`
   - `face-left` / `face-right` / `face-mid`: true 9:16 crop. It detects the original shot cuts (AutoFlip approach), holds ONE stationary crop per shot at the median face x, and only fits a slow straight pan if the subject leaves the window. Never track every frame; it looks shaky. `face-left` = guest sits on the left in two-shots.
   - `blur`: 16:9 in the middle over a blurred copy, for screen recordings, slides, whiteboards.
   - Pass real resolution; the script probes it.
6. Verify: extract 4-6 frames across the clip (`ffmpeg -ss T -frames:v 1`), tile them, look at them. Check duration matches START-END. Check hook text, caption position (safe area), face in frame, no burned-in text clash.
7. Deliver: copy to `~/Downloads/cc-clips/ready/`, append caption + credit + hashtags to `results/captions-batch-N.md` and a row to the ledger.

## Known weak spots
- Original edit cutting to a super-wide shot leaves the speaker tiny in vertical; optional zoom-in is on PLAN.md.
- Hollywood podcast clips from batch 1 still use the old per-frame tracking.

## Scheduling (not built yet)
See `research/findings.md` platform facts. YouTube Data API `publishAt` and Facebook Pages scheduled publishing are native; Instagram needs our own scheduler. Needs one-time OAuth / Meta app setup by the user.
