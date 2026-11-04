# 05. Originality layer (added 2026-11-04)

Why: Instagram's April 2026 policy demotes "mostly unoriginal" accounts to followers only. Captions, watermarks and credits do not count; our own commentary, voiceover and new text or graphics do. The exact threshold is not published, so this is a measured experiment, not a guarantee. We never use evasion tricks (mirroring, pitch shifting, speed changes, crops that cut the speaker): they damage the clip and are detection evasion, not originality.

What `tools/clip-pipeline/build.py` adds (overlays only, same length, no extra encode):
1. **Our take**: one line of our own commentary in a boxed card, shown for 4.5 s from about 42 percent of the clip. Env `TAKE`. Must be our own sentence (why it matters / what to do), not a quote of the speaker.
2. **Our end line**: last 2.6 s, our own closing line. Env `END` (e.g. "Follow for one clip a day." or a question that invites comments).
3. **Label + brand tag** at the top: `TAG | NOT A CLIP FACTORY`. Env `TAG` (speaker or topic).
4. **Progress bar** across the top that fills over the clip (a visible element of our own).
5. Existing: on-screen hook, word-by-word captions, credit line in the caption.
Turn off with `ORIG=0`. Skipped automatically under 12 s.

Placement: tag y=70, hook y=135 (clear of the head; was 230 until batch 6), captions about y=1310, take/end card about y=1490, bottom 320 px left clear.

Usage: `TAKE="..." END="..." TAG="SADHGURU" python3 -I build.py ID START END "HOOK" outname MODE`

Next levels if this does not move reach (try one at a time, measure per batch):
- Own voiceover intro (3-5 s, TTS or recorded) before or over the first seconds. Strongest signal, changes the clip most.
- Split screen / reaction framing with our own graphics.
- Series branding ("Day N").

How to judge: compare average views per clip of layered batches (4+) against batches 1-3 (no layer, average 68 views). Need 15+ clips per side and 3 days of age before concluding. Note that insights are not readable by the token yet; use the profile page HTML (see CHANGELOG 2026-11-04).
