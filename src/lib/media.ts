// Helpers for media references saved by the dashboard: site paths, R2 URLs
// or external links (image files, video files, YouTube, Vimeo).

// Shown when the client clears an image in the dashboard, so no slot renders broken.
export const PLACEHOLDER_IMAGE = '/media/placeholder.webp';
export const orPlaceholder = (src: string | undefined): string => src || PLACEHOLDER_IMAGE;

export type VideoSource = { kind: 'file'; src: string; type: string } | { kind: 'embed'; src: string };

/** Turns a YouTube or Vimeo link into a privacy-friendly embed URL. */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:shorts|embed)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/^\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}?dnt=1` : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** MIME type for a video file URL, used in <source type>. */
export function videoType(src: string): string {
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'webm') return 'video/webm';
  if (ext === 'mov') return 'video/quicktime';
  return 'video/mp4';
}

/** Classifies a video reference as a playable file or an embed. */
export function videoSource(src: string): VideoSource | null {
  if (!src) return null;
  const embed = embedUrl(src);
  if (embed) return { kind: 'embed', src: embed };
  return { kind: 'file', src, type: videoType(src) };
}
