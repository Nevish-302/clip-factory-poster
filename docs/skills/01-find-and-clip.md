# 01 Find and clip

Goal: turn long Creative Commons (CC BY) YouTube videos into captioned 9:16 clips. Scripts live in `clip-factory/scripts/`; run them from `clip-factory/work/` (`mkdir -p src tx out`).

## Choosing sources
- Only CC BY. `scripts/dl.py` reads the license from YouTube's metadata and skips anything else. `./find.sh "topic" 200000` searches YouTube's CC filter (one request).
- The CC flag is set by the uploader. Safe pattern: the owner licensing its own content. Best find: the World Economic Forum channel (Musk, Pichai, Huang, Jack Ma, Deepika Padukone). Also independent creators and podcasts that own their footage (Still Here Hollywood).
- Reject: heavy profanity or slurs (Million Dollaz), non-English audio (The97sPodcast, Swahili: English-only Whisper gives gibberish), burned-in captions or watermarks (Erik Estrada excerpt), stock-footage-only videos, studio movie clips, music labels, TV and news broadcasts.
- CC BY needs a credit on every post: title, creator, link, "CC BY".
- Sample of the CC filter (15 topics, 1,190 videos): 46% over 200k views, 27% over 500k, 16% over 1M; about half uploaded in 2025 or later. Cooking and fitness have almost nothing.

## Tooling gotchas
- yt-dlp must be current and a JS runtime (deno) installed, or YouTube streams return 403. Do not bypass bot checks with cookies, token spoofing or proxies. Bulk scraping (about 1,500 requests) triggers a bot check for a while: keep requests low.
- Transcription: `scripts/tx.py` uses faster-whisper `small.en` on CPU, about 20 minutes per hour of audio, and decodes audio with ffmpeg (PyAV version mismatch). Run it in the background, short videos first so something is ready to show.
- Disk: sources are 150 MB to 1.3 GB. Check `df -h /System/Volumes/Data` first and delete sources once clips are approved. The disk filled completely twice and stopped every tool.
- zsh does not split a variable into words: use a shell function, not `B="python3 ..."; $B args`.

## Picking moments
Read the transcript, pick 3 to 5 per long video: 25 to 90 s, one idea, starts on a sentence start, ends on a sentence end, hook in the first line, no sponsor reads. The end time must fall between the last wanted word's end and the next word's start (use `w` word timestamps in `tx/ID.json`): twice a clip ended on the next sentence's first word.

Exact boundaries: `python3 -I ../scripts/findwords.py VIDEO_ID "words of the phrase" LO HI` prints the phrase's start and end time and the next word's start. Start a clip at the first word's start; end it at the last word's end, and never later than the next word's start (a clip that ends later shows the next sentence's first word, as happened in 4 of 5 Nadella clips). Punctuation is ignored and apostrophes are dropped ("you're" is "youre"). If a long phrase is not found, search a shorter one.

Pick moments that stand alone, in a 30 to 70 second range, with a clear hook line: a surprising fact, a story, a rule of thumb, a joke. Skip sponsor reads, introductions and political attacks. Mixed shots (speaker, host, audience, slides) are normal: the crop follows the original edit.

## Building a clip
`python3 -I ../scripts/build.py VIDEO_ID START END "HOOK TEXT" outname MODE`
- `face-big` (largest face, best default; needed when audience faces are behind the speaker), `face-left`, `face-right`, `face-mid`: true 9:16 crop.
- `blur`: 16:9 in the middle over a blurred copy, for screen recordings, slides, whiteboards.
- Crop rule (AutoFlip approach): detect the original shot cuts, hold ONE stationary crop per shot at the median face x, pan only if the subject leaves the window. Tracking every frame looks shaky (the user complained). Wide stage shots leave the speaker small in vertical.
- The script reads the real source size (a 720p source once came out half-length because 1920x1080 was assumed).
- Captions: 3 words per page, active word yellow, hook line for the first 3 seconds, bold sans with outline, profanity masked.
- Encoding: High profile, level 4.0, 30 fps, GOP 60, yuv420p, AAC 44.1 kHz, faststart. A clip encoded without these was rejected by Instagram (ProcessingFailedError) and passed after re-encoding.

## Checks before delivering
Tile 4 to 6 frames across the clip and look; confirm the duration equals END minus START; read the last caption line from the `.ass` file to catch cut-off endings; check hook text, face in frame, caption position. Output to `~/Downloads/cc-clips/ready/`; re-encode to `post-ready/` for posting; append caption, credit and hashtags to `results/captions-batch-N.md` and a row to `results/clips-ledger.md`.

## Sensitive content
Mental-health clips (Deepika Padukone): supportive wording, a helpline line in every caption (India Tele-MANAS 14416, US 988, findahelpline.com).

## Results so far
30 clips: Musk 9, Pichai 4, Huang 4, Jack Ma 4, Deepika 2, Hollywood podcast 4 (old per-frame crop), AI explainer and ChatGPT tutorial 3 (blur layout).
