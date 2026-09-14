---
name: instagram
description: Publish Dicey Shoes posts, carousels and Reels to Instagram, write voice-matched captions, hashtag blocks and first comments, read engagement and insights, and draft replies to comments. Use when the user asks to post to Instagram, write IG copy, check Instagram performance or quota, or handle comments and DMs.
---

# Instagram automation for Dicey Shoes

Everything runs through the scripts in this repo. Do not call the Graph API by hand, and do not
add a publishing route to the storefront app.

## Before anything else

Check that credentials exist (`IG_USER_ID`, `IG_ACCESS_TOKEN`). If they are missing, point the
user at `docs/instagram-automation.md` — they need a Business/Creator account, a Meta app with
the `instagram_business_*` scopes and a long-lived token. Do not invent placeholder values.

## The one rule about publishing

**Always dry run first, show the user the exact caption and assets, and wait for an explicit
"post it" before running the live command.** A published post is public immediately and cannot be
edited afterwards — only deleted. The same applies to comment replies.

```bash
node scripts/instagram-publish.mjs --type image --image <https url> --product <slug> --dry-run
```

The dry run prints the caption, the first comment, the character/hashtag counts, voice warnings
and a `HEAD` preflight of every asset. Fix anything it flags before going live, then rerun the
same command without `--dry-run`.

## Commands

| Task | Command |
| --- | --- |
| Single image | `node scripts/instagram-publish.mjs --type image --image URL [--product SLUG\|--release NAME\|--caption "..."]` |
| Carousel (2–10) | `node scripts/instagram-publish.mjs --type carousel --images URL1,URL2,...` |
| Reel (≤90s, 9:16) | `node scripts/instagram-publish.mjs --type reel --video URL --cover URL` |
| Next queued post | `node scripts/instagram-publish.mjs --queue next --queue-write` |
| Performance | `node scripts/instagram-insights.mjs --days 7` |
| Comments to answer | `node scripts/instagram-insights.mjs --what comments` |
| Reply | `node scripts/instagram-reply.mjs --comment ID --message "..."` |
| Hide a comment | `node scripts/instagram-reply.mjs --comment ID --hide` |
| Offline tests | `node --test scripts/instagram-selftest.mjs` |

Add `--json` to any script when you need to parse the result rather than read it.

## Writing the copy

Generate a first draft from real data rather than from imagination:

- `--product <catalog-slug>` pulls the name, price, sizes and stock status from `lib/products.js`.
- `--release <name>` pulls the date, price and source from `lib/releases-daily.js`.
- `--intent drop|feature|restock|news|styling|deal` picks the hook shape.

Then edit it. The voice, in short: lead with the shoe, one idea per line, name the colorway and
the price, at most two emoji, no marketing filler, hashtags in the first comment and never in the
caption. `voiceCheck()` in `lib/instagram-copy.js` enforces the mechanical half of that and runs
automatically on every publish and reply.

When the user supplies their own caption, keep it. Report warnings, do not silently rewrite.

## Media rules worth knowing before you promise a post

- Assets must be public https URLs Instagram can fetch — not localhost, not a signed URL that
  expires, not an authenticated bucket path.
- Feed images: 4:5 to 1.91:1, JPEG/HEIC/HEIF, under 8MB.
- Reels: 3–90s, 9:16, MP4 (H.264 + AAC), under 1GB.
- Carousels: 2–10 slides.
- 50 API posts per rolling 24 hours; the publish script checks the remaining quota first.

If the user has a local file, tell them it needs hosting first (the R2 bucket used by the catalog
works) — there is no direct file upload in the Graph API.

## Reading performance

`scripts/instagram-insights.mjs` ranks recent posts by engagement rate (likes + comments + saves +
shares ÷ reach), not raw likes. When the user asks "how is the account doing", give them the
window totals, the top performer and one concrete observation tied to what the post actually was
(format, intent, time) — not generic advice.

## Comments

`--what comments` lists comments with no reply from the account, classifies each one (price,
sizing, availability, shipping, authenticity, hype, negative) and drafts an on-voice reply. Show
the drafts, let the user pick or edit, then send with `scripts/instagram-reply.mjs`. Never send a
batch of replies without confirmation.

## The content calendar

`data/instagram-queue.json` holds planned posts. An item publishes only when `status` is `ready`
and `publishAt` has passed; drafts are ignored. Adding an item means filling in the media URL,
the copy source (`product`, `release` or `caption`) and the schedule, then flipping the status.

The daily workflow drains the queue in dry-run mode unless the repository variable
`IG_AUTOPUBLISH` is `true`, so adding a `ready` item is not on its own enough to make the account
post by itself.

## When something fails

The script prints the Instagram error code, a fix hint and the `fbtrace_id`. The common ones:
190 means the token expired, 2207003/2207020 mean Instagram could not download the media,
9007/36003 mean the media fails spec, 4/17 mean a rate limit. The full table is in
`docs/instagram-automation.md`.

A container that reports `ERROR` or `EXPIRED` is dead — create a new one, do not retry the
publish call against it.
