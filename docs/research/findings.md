# Research findings (2026-10-20)

## Is CC content on YouTube enough?
- 15-topic scrape of the CC filter, 1,190 unique videos: 46% over 200k views, 27% over 500k, 16% over 1M. Relevance-ranked, so biased upward. Sample only.
- About half of the 200k+ videos were uploaded in 2025 or later.
- Old figure: 4M CC BY videos on YouTube in 2012 (Creative Commons). No current count exists.
- Cooking and fitness queries return almost nothing in CC.

## Which CC videos are actually safe
- The CC flag is set by the uploader. Many uploads (music labels, TV clips, political broadcasts, a Shia LaBeouf remix) are not the uploader's to license.
- Safe pattern: the owner's own channel licensing its own talks. World Economic Forum is the best find (Musk, Jack Ma, Sundar Pichai, Jensen Huang, Deepika Padukone panels). Also independent creators, podcasts such as Still Here Hollywood.
- Avoid: sources with burned-in captions or watermarks, heavy profanity, non-English audio, stock-footage videos, studio movie clips.
- CC BY requires attribution on every post. CC BY-NC (seen on a 38M-view film) bans commercial use.

## Tools
- yt-dlp must be current plus a JS runtime (deno). Old version: 403 on streams. Bulk metadata scraping (~1,500 requests) triggered a bot check for a while; keep requests low.
- Whisper `small.en` is English only. On a CPU a 1-hour podcast takes about 20 minutes. Check language before transcribing a long file.
- OpenCV Haar cascades (frontal + profile) are enough for face tracking. MediaPipe not installed.
- Reframing approach from Google AutoFlip: detect scene cuts, decide stationary / pan / track per scene, smooth the path. https://research.google/blog/autoflip-open-source-framework-for.html
- Disk filled up twice (video sources are 150 MB to 1.3 GB each). Delete sources once clips are cut.

## Platform facts to verify before relying on them
- YouTube Data API: `videos.insert` with `status.privacyStatus=private` plus `status.publishAt` schedules a public release. Uploads cost 1,600 quota units of 10,000/day (about 6 uploads/day). Projects created since 2020 that have not passed YouTube's API audit get uploads locked to private.
- Facebook Pages API supports scheduled publishing for videos and Reels.
- Instagram Graph API publishes immediately; it has no native scheduled-publish for Reels, so a scheduler we run must post at the time.
- All need one-time human setup: OAuth consent / Meta developer app, Business or Creator account linked to a Facebook Page.
- Platforms demote or demonetize "unoriginal" reposts. CC credit helps legally but not for monetization eligibility.
