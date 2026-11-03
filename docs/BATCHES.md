# Batch roster (started 2026-11-04)

Rule from the user: two source videos per batch, run one batch at a time in the background so other work is not blocked; post 4-5 times a day (slots IST 09:00, 13:00, 16:30, 20:00, 22:00, filled by `add-batch.mjs` from tomorrow into free slots); everything is noted here, in CHANGELOG.md and in captions-batch-N.md; every new clip carries the originality layer (docs/skills/05).

Selection filter (from the 2026-11-04 analysis of 35 reels): a clip qualifies only if (1) the claim fits one sentence a non-fan finds relevant to their own life, or it is a personal story with a turn; (2) the on-screen hook states the claim or consequence, never "X on Y"; (3) it makes sense in the first 5 s with no setup; (4) it is not a framework, prediction or industry trivia. Winners: concrete human moment plus a repeatable line. Losers: labels and abstractions.

Skipped on purpose: comedy (Walter Latham/Bernie Mac, owner unclear), politics, K-pop, news, fitness/cooking (no speech), physics animations, Plainly Difficult documentaries (stock footage), and anything not owner-licensed.

Mental-health videos (Psych2Go): supportive tone, helpline line, no sensational hooks.

| # | Group | Videos (id) | Status |
|---|---|---|---|
| 4 | Sadhguru (life wisdom) | cxoQdEhHaT8 never get angry; 4ZQkYSpmOdU handle hard times | done 2026-11-04: 5 clips (3 + 2), queued 5-7 Nov. Learned: Haar face detection misses turbans (crop drifted off him), fixed with env FIXX (fixed crop centre) in build.py for the fixed-camera video; video 2 has many wide/B-roll cutaways, so blur mode was used and one clip with a stock-footage montage was dropped. Needed a fresh yt-dlp (system one, 2024.10, failed 'format not available') and faster-whisper, both in a temporary python3.12 venv. Two videos credited separately (prefixes sadhguru, sadhgurub). |
| 5 | Study tips | 3NSkk31vFbU Kharma Medic; la7FzGdz1Sc Dr. Cellini | done 2026-11-04: 8 clips (3 + 5), queued 7-11 Nov. Learned: Kharma's vlog cuts to B-roll every few seconds, so two of five picks were dropped and one trimmed; check a frame strip (one frame per 3 s) before accepting. Cellini leans out of the Haar crop: FIXX=0.5 fixed it. findwords prints start and end: use the phrase end for the cut-out and the phrase start for the first word. Prefixes kharma, cellini. |
| 6 | Happiness talks | xnLoToJVQH4 TEDx Gen Kelsang Nyema; cUkZLttONGM INKtalks Aisha Chaudhary | pending |
| 7 | Psychology | 4hG9wI5-_Lc 8 psychological tricks; C07DdQbnFMs 9 little habits (Psych2Go, blur mode) | pending |
| 8 | Career | qKBubKO-798 Fisher interview tips; u9BoG1n1948 mayuko salary negotiation | pending |
| 9 | Public speaking | c8_BIamLESg Conor Neill; V8eLdbKXGzk Project IDEA | pending |
| 10 | Startup + leadership | CBYhVcO4WgI YC Lecture 1; 3EYU3VTI3IU Mattis (Marines) | pending |
| 11 | Minimalism | XC3Stj33Gts and FqTkiLxIE9Y (Robin Greenfield) | pending |
| 12 | English / IELTS | ELxGmf9f_ZM IELTS Advantage speaking secrets; one more from that channel | pending |

Per batch: dl (license check) -> tx -> pick 3-5 moments per video with the filter -> build with TAKE/END/TAG -> verify frames -> ig-encode -> upload to release clips-v1 -> captions-batch-N.md + sources json -> add-batch.mjs -> commit and push -> delete sources -> update this table, CHANGELOG, ledger.

## Added 2026-11-04: anime and pop culture (best 5 of each)
Risk note: these are video essays over studio footage. The CC BY flag only covers the creator's own commentary, not the anime/film/game clips, so Meta can mute or remove reels. Mitigation per clip: choose moments where the narrator's idea carries it, use blur mode, keep clips short, check how much studio footage is on screen, and watch the first posted ones for mutes or claims before doing more. If two of the first batch get muted or removed, stop this track. No profanity titles, no music/AMV/fan-animation sources, no dubbed full-episode recaps.

Picked because they are story or life-lesson framed (matches what worked) and have 300K+ views. Order is a suggestion; move a batch earlier if you want the anime test sooner.

| # | Group | Videos (id) | Status |
|---|---|---|---|
| 13 | Anime (Sage's Rain) | 8_FenWC9Bc4 Philosophy of Madara Uchiha (2.2M); zhxtBW0HIbc Itachi, a sacrifice for love (1M, 6 min) | pending |
| 14 | Anime (Sage's Rain) | 4D6as7R0OGM Morality of Itachi (640K); wNB05gdWRkI How Naruto failed its female characters (984K) | pending |
| 15 | Anime + Star Wars (Beghast) | HrTKzAlZ3Q4 How one anime fixed isekai's main issue (1.3M); hL4IfoQzSSE De-infantilizing Star Wars (4.3M) | pending |
| 16 | Pop culture | UZoh4wv9Txs Master Eli, ranking the Jedi Council (1.1M); vU0MYIoZ0Xc Excess Cinema, Tamil mass movie vs Bollywood drama (459K, relevant to an Indian audience) | pending |
| 17 | Pop culture | ZM_EszgRD64 Jack's Movie Reviews, Baby Driver: a lesson in storytelling (369K); one new Still Here Hollywood Podcast episode (owner-licensed interviews; search the channel for the best story episode, NOT the Erik Estrada one: its source had burned-in captions) | pending, second id to find |

Not picked: GrandLineReview (One Piece, mostly rankings/lists), KakashiHatake0800 (long lore), NoahBoahCoah (profanity), Bunaye (animation praise, heavy footage), game lore (Choo-Choo Charles, TLOU2, Outlast), The Prism, David Lynch interview (uploader is not the owner), Pokemon, Marvel.
