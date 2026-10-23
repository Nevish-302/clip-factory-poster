# 04 Brand art (anidoodle)

Name used: "Not A Clip Factory" (taken from the user's answer; handle availability on YouTube, Instagram and Facebook was not checked).

## Delivered (in `~/Downloads/cc-clips/brand/`)
- `profile-picture-1080.png` (1080x1080, circle-safe, still reads at about 110 px) for all three platforms
- `youtube-banner-2560x1440.png` (text inside the 1546x423 centre safe area)
- `facebook-cover-1640x624.png` (content in the centre that survives the mobile crop)
- Instagram has no banner image, only the profile picture.

## The design
Flat-vector hand (anidoodle style #8): pen-tool shapes, one flat fill each, crisp edges, cast shadows only. Mark: a speech bubble holding a coral play button, sliced by one diagonal cut, in front of a mustard sun. Palette: navy, cream, coral, mustard, teal in two depths. Tagline: "Big talks. Short clips. Credit always." The user asked for the speckle (grain dots and stars) to be removed: flat fills only.

## Source and re-render
Source: `clip-factory/brand/src/canvas-core/brand.ts` (three films: avatarFilm, ytBannerFilm, fbCoverFilm; entry files `avatar.ts`, `ytbanner.ts`, `fbcover.ts` and `src/hosts/page-*.ts`). From `clip-factory/brand/`: `node tools/still.mjs avatar|ytbanner|fbcover --out out/NAME.png` (it draws each frame twice and prints `reproducible`). Setup was `scaffold.mjs`, `npm install`, `npx playwright-core install chromium`.
To change the name or tagline edit the strings in `lockup()` in brand.ts and re-render.

## Gotchas
- The build looks up a module named after the film in `src/canvas-core/<name>.ts` that exports it under that name.
- A clip of fill that is not clipped to its shape spills across the whole canvas (the bubble shading did): clip each shaded region to its shape.
- Keep text and the sun out of each other's way; check at full size and at avatar size.
- Draw original marks, never existing logos or characters.
