# Adding images and video from the portfolio

Every image slot currently shows a **generated preview image** from `public/media/preview/` (illustrated film stills of Essaouira scenes, plus an 8-second `hero-loop.webm`), labelled "Preview" on the site. They exist so the layout and animations can be checked; replace each one with a real file. The real photos and videos come from the Tansift portfolio at <https://tansiftproduction66f.myportfolio.com/work>.

## 1. Export the files

From Adobe Portfolio (or the original files), export:

| Slot | Used on | Size | Format |
|------|---------|------|--------|
| Hero poster | Home, top | 1920 × 804 (2.39:1) | JPG or WebP, under 300 KB |
| Hero loop | Home, top | 12–15 s, 1920 wide, no sound | MP4 (H.264) for all browsers, under 6 MB |
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

The easiest way is the dashboard ([DASHBOARD.md](DASHBOARD.md)): **Choose / upload** in any photo or video field uploads to Cloudflare R2 and converts to WebP/WebM, or accepts a link. Files placed in `public/media/` can also be used by typing their path (e.g. `/media/hero-poster.webp`) in the field.

- **Hero, chapters, team:** dashboard → **Hero & page images** (`content/media.json`).
- **Services:** dashboard → **Services**, field *Image* (`content/services.json`).
- **Projects:** dashboard → **Projects** (`content/projects.json`). Replace the samples with real work: title (EN/FR), client, category, place and hour (e.g. `Skala du Port · 07:10`), one-line summary, cover, and optionally a link to the Instagram post or video. Untick *Sample*.

An empty image field shows a Tansift placeholder instead of a broken image.

Write alt text that describes what is in the picture (people, place, action), in both languages where the field asks for it.

## Removing the preview images

Once every slot points at a real file, delete `public/media/preview/` and `public/media/placeholders/`, and untick *Placeholder* on each slot in **Hero & page images**.

## Why the images were not copied automatically

The build environment used to create this site could not reach `myportfolio.com`, so the files have to be added by hand, or by a session whose network allows that domain.
