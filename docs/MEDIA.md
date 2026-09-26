# Adding images and video from the portfolio

Every image slot currently shows a labelled film-stock placeholder. The real photos and videos come from the Tansift portfolio at <https://tansiftproduction66f.myportfolio.com/work>.

## 1. Export the files

From Adobe Portfolio (or the original files), export:

| Slot | Used on | Size | Format |
|------|---------|------|--------|
| Hero poster | Home, top | 1920 × 804 (2.39:1) | JPG or WebP, under 300 KB |
| Hero loop | Home, top | 12–15 s, 1920 wide, no sound | MP4 (H.264), under 6 MB |
| Full showreel | "Watch the reel" button | Any | Vimeo or YouTube link, or MP4 |
| Chapter images | Home, chapters 1 and 2 | 1600 × 900 | JPG or WebP, under 250 KB |
| Service images | Services pages (6) | 1200 × 1500 (4:5) | JPG or WebP, under 250 KB |
| Project covers | Work page | 1200 × 1500 (4:5) | JPG or WebP, under 250 KB |
| Team photo | Studio | 1600 × 1000 | JPG or WebP, under 300 KB |

Compress images before adding them (for example with Squoosh). Keep file names short, lowercase and hyphenated, e.g. `riad-season-opener.webp`.

## 2. Put them in `public/media/`

```
public/media/
  hero-poster.webp
  hero-loop.mp4
  work/riad-season-opener.webp
  services/social.webp
  ...
```

## 3. Point the site at them

- **Hero, chapters, team:** edit `src/data/media.ts`. Set `src` to the new path (e.g. `/media/hero-poster.webp`), set `video` / `fullReelUrl` for the hero, and remove `placeholder: true`.
- **Services:** in `src/data/services.ts`, replace `image: placeholder('social')` with `image: '/media/services/social.webp'`.
- **Projects:** in `src/data/projects.ts`, replace the sample entries with real ones: title (EN/FR), client, category, place and hour (e.g. `Skala du Port · 07:10`), one-line summary, `cover`, and optionally `link` to the Instagram post or video. Delete `sample: true`.

Write alt text that describes what is in the picture (people, place, action), in both languages where the field asks for it.

## Why the images were not copied automatically

The build environment used to create this site could not reach `myportfolio.com`, so the files have to be added by hand, or by a session whose network allows that domain.
