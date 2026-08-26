# Hero videos

Drop hero clips into this folder as `.mp4` (or `.webm` / `.mov`).

`lib/heroVideos.ts` reads this directory, so no code change is needed — any
files here are picked up, shuffled into a random order, and cross-faded by
`components/HeroVideo.tsx`.

Guidance:
- Encode H.264 + AAC MP4 for the widest browser support.
- Ship a version that reads well at both 9:16 (mobile) and 16:9 (desktop);
  the frame crops with `object-fit: cover`, so keep the subject centred.
- Keep each clip short (5-12s) and web-optimised (`-movflags +faststart`).
- Clips play muted and cannot be unmuted, so audio is irrelevant.

With no files here the hero falls back to its poster treatment and the
storefront below is unaffected.
