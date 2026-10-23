# 03 Meta setup and gotchas

## Accounts (found via the Graph API, 2026-10-22)
- Facebook Page "Not a clip Factory": id 1397014833495300
- Instagram Business account `@notaclipfactory`: id 17841417343562675 (linked to the Page)
- Both IDs and the token are in the macOS Keychain (account `clipfactory`, items META_ACCESS_TOKEN, META_PAGE_ID, META_IG_USER_ID). Lookups: `GET /me/accounts?fields=id,name,instagram_business_account`.

## Creating the app
- App type Business, attached to the Business portfolio that owns the Page and Instagram account.
- Use cases: "Manage messaging & content on Instagram" and "Manage everything on your Page". Skip the rest. Only one Instagram setup per app (Instagram Login or Facebook Login); ours uses the Facebook Login route with a System User token.
- System User in Business Settings, assigned the Page and Instagram assets. Token permissions needed: `instagram_basic`, `instagram_content_publish`, `pages_manage_posts`, `pages_read_engagement`, **`pages_show_list`** (missing at first, see below).
- The user published the app (Live mode) on 2026-10-23.

## Errors we hit and the fix
| Error | Cause | Fix |
|---|---|---|
| Facebook `(#200) Subject does not have permission to post videos ... lack of pages_show_list permission` | token had no `pages_show_list` | add it to the Page use case, generate a new System User token |
| Facebook `(#200)` with a System User token | `video_reels` needs the Page's own token | the script derives it (`GET /{page-id}?fields=access_token`); just pass the System User token |
| Instagram `ProcessingFailedError` at upload, not retriable, only some clips | encoding profile from my build script | re-encode: High, level 4.0, 30 fps, GOP 60, AAC 44.1 kHz, faststart (now the default in build.py) |
| "We limit how often you can post" | Meta upload throttle after about 22 Reel uploads in a row | stop, retry hours later; `fb-schedule.mjs` resumes where it stopped |
| Posts invisible on the Facebook Page | scheduled Reels are hidden until their time | check Business Suite, Content, Scheduled |

## Facts to remember
- Instagram Graph API caps API-published posts at 50 per 24 h and has no scheduled-publish option; the check endpoint is `GET /{ig-id}/content_publishing_limit`.
- Posts made by an app in development mode can be visible only to people with roles on the app; verify public visibility of the first Reel after the app went Live.
- Tokens: never in a file, a doc or memory. Pass as an env var inline or via Keychain / repo secrets. A token pasted into chat is exposed: regenerate and revoke the old one (done once on 2026-10-23, the second token is also in chat history, regenerate again when the system is running).
- First live posts (Instagram, 2026-10-22): jackma_beach_04 https://www.instagram.com/reel/DezlRdCjUwd/ and huang_code_03 (reel id 18118983344089582).
- The `meta-reel-publish` skill script (`~/.claude/skills/meta-reel-publish/scripts/publish-reel.mjs`) now has `--schedule-at <unix>` for Facebook.
