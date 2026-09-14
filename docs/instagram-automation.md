# Instagram automation

Publishing, copywriting and analytics for the Dicey Shoes Instagram account, driven from the
terminal or from GitHub Actions. Everything runs on the Instagram Graph API with no extra
dependencies — Node 18+ and `fetch` only.

## What is here

| File | Purpose |
| --- | --- |
| `lib/instagram.js` | Graph API client: containers, status polling, publishing, insights, comments, quota |
| `lib/instagram-copy.js` | Brand voice: hooks, captions, hashtag tiers, alt text, reply drafts, voice linting |
| `scripts/instagram-publish.mjs` | Publish an image, carousel or Reel; dry runs; content queue |
| `scripts/instagram-insights.mjs` | Read-only performance and engagement report |
| `scripts/instagram-reply.mjs` | Reply to a comment, comment on a post, hide a comment |
| `scripts/instagram-selftest.mjs` | Offline test suite (mocked API, no credentials needed) |
| `data/instagram-queue.json` | Content calendar the publish script can drain |
| `.github/workflows/instagram-publish.yml` | Manual publish + daily queue check |
| `.github/workflows/instagram-insights.yml` | Weekly performance report |

## One-time setup

1. The Instagram account must be a **Business or Creator** account. Personal accounts cannot
   publish through the API.
2. Create a Meta app and add **Instagram**. Either path works:
   - *Instagram API with Instagram Login* — the account authorises directly, tokens come from
     `api.instagram.com`, and requests go to `https://graph.instagram.com` (the default here).
   - *Instagram API with Facebook Login* — the account is linked to a Facebook Page and requests
     go to `https://graph.facebook.com`. Set `IG_API_BASE=https://graph.facebook.com` if you use it.
3. Grant these permissions when authorising:
   - `instagram_business_basic` — profile and media reads
   - `instagram_business_content_publish` — publishing
   - `instagram_business_manage_comments` — comments and replies
   - `instagram_business_manage_insights` — analytics
4. Exchange the short-lived token for a **long-lived token** (60 days) and store it. Refresh it
   before it expires; a refreshed token replaces `IG_ACCESS_TOKEN`.
5. Copy `.env.example` to `.env.local` and fill in the values. For CI, add `IG_USER_ID` and
   `IG_ACCESS_TOKEN` as repository **secrets**; `IG_API_BASE`, `IG_GRAPH_VERSION` and
   `IG_AUTOPUBLISH` are repository **variables**.

## Environment

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `IG_USER_ID` | yes | — | Instagram professional account id (not the @handle) |
| `IG_ACCESS_TOKEN` | yes | — | Long-lived token. Never commit it |
| `IG_API_BASE` | no | `https://graph.instagram.com` | Use `https://graph.facebook.com` for Facebook Login |
| `IG_GRAPH_VERSION` | no | `v23.0` | Pin to the version your app targets |
| `IG_REEL_MAX_SECONDS` | no | `90` | Reel duration cap enforced before upload |
| `IG_HANDLE` | no | `@diceyshoes` | Used in copy |
| `IG_SUPPORT_WHATSAPP` | no | `+1 548 538 2258` | Used in reply drafts |
| `IG_TIMEOUT_MS` | no | `20000` | Per-request timeout |

## Media hosting

Instagram fetches media from a URL you provide, so every asset must be:

- **public https**, no auth, no redirect wall (the script blocks http, localhost and private ranges),
- reachable for the life of the container (24 hours),
- within spec — the preflight `HEAD` check catches 403s, 404s and oversize files before a container
  is ever created.

Host assets in the same R2 bucket the catalog uses, or any public CDN.

## Publishing

```bash
# Single image with a caption generated from the catalog
node scripts/instagram-publish.mjs --type image \
  --image https://cdn.example.com/samba-og.jpg \
  --product samba-og-white-black-gum --dry-run

# Carousel, 2-10 slides
node scripts/instagram-publish.mjs --type carousel \
  --images https://cdn.example.com/1.jpg,https://cdn.example.com/2.jpg \
  --caption "Three angles on the Samba OG." 

# Reel with a cover frame, shared to the feed
node scripts/instagram-publish.mjs --type reel \
  --video https://cdn.example.com/onfeet.mp4 \
  --cover https://cdn.example.com/cover.jpg \
  --release "Space Jam"

# Drain the content calendar
node scripts/instagram-publish.mjs --queue next --queue-write
```

Useful flags: `--dry-run` (validate and preflight only), `--no-probe` (skip the HEAD check),
`--caption-file path.txt`, `--first-comment "..."` / `--no-first-comment`, `--intent drop|feature|restock|news|styling|deal`,
`--collaborators handle1,handle2`, `--location-id 123`, `--json`, `--force`, `--help`.

Behind the scenes every publish is the same two-phase flow:

1. `POST /{ig-user-id}/media` creates a container (children first for a carousel).
2. `GET /{container-id}?fields=status_code` polls until `FINISHED`, failing fast on `ERROR` and
   `EXPIRED`.
3. `POST /{ig-user-id}/media_publish` publishes it.
4. The hashtag block is posted as the first comment, keeping the caption clean.

Quota is checked before publishing and reported after, so you always know how many of the 50
API posts per rolling 24 hours are left.

## Copy and voice

`lib/instagram-copy.js` holds the voice: hooks per intent, catalog-aware detail lines, a tiered
hashtag builder (branded → brand → model → intent → broad) and `voiceCheck()`, which flags
marketing filler, all-caps shouting, emoji spam and stacked punctuation. Captions are
deterministic, so a dry run shows exactly what will be posted.

```bash
node -e "import('./lib/instagram-copy.js').then(m=>console.log(m.captionForRelease('Space Jam').caption))"
```

Write your own caption any time — pass `--caption` or `--caption-file` and the same validation
and voice linting still run.

## Analytics and engagement

```bash
node scripts/instagram-insights.mjs                  # account, top posts, quota
node scripts/instagram-insights.mjs --days 28        # longer window
node scripts/instagram-insights.mjs --what comments  # unanswered comments + reply drafts
node scripts/instagram-insights.mjs --json           # machine readable
```

Posts are ranked by engagement rate — (likes + comments + saves + shares) ÷ reach — so a small
post that punched above its reach is not buried under a big one that did not.

Replies are a separate, explicit step:

```bash
node scripts/instagram-reply.mjs --comment 17912345 --draft "how much?" --username kicksfan --dry-run
node scripts/instagram-reply.mjs --comment 17912345 --message "Sizes are live on site — link in bio."
node scripts/instagram-reply.mjs --comment 17912345 --hide
```

## Constraints enforced before upload

| Rule | Value |
| --- | --- |
| Caption length | 2,200 characters |
| Hashtags / mentions | 30 / 20 per post |
| Carousel slides | 2–10 |
| Feed image aspect ratio | 4:5 to 1.91:1 |
| Feed image formats / size | JPEG, HEIC, HEIF · 8MB |
| Reel duration | 3s to 90s (`IG_REEL_MAX_SECONDS`) |
| Reel aspect ratio | 9:16 (warning outside it) |
| Reel size / format | 1GB · MP4 or MOV, H.264 + AAC |
| Published posts | 50 per rolling 24 hours |
| Container lifetime | 24 hours |

## Error codes you will actually see

| Code | Meaning | Fix |
| --- | --- | --- |
| 190 | Token invalid or expired | Mint a new long-lived token |
| 10 | Missing permission | Re-authorise with the publishing scope |
| 4 / 17 | App or user rate limit | Wait for the window to reset |
| 2207003 / 2207020 | Instagram could not download the media | Re-host on a public https URL |
| 2207026 | Unsupported video format | Re-encode to MP4 H.264 + AAC |
| 9007 / 36003 | Media fails spec | Fix duration, size or aspect ratio |
| 100 | Parameter rejected | Check container fields and media_type |

The publish script prints the code, the fix hint and the `fbtrace_id` for support.

## Tests

```bash
node --test scripts/instagram-selftest.mjs
```

20 offline checks cover validation, the two-phase publish flow, container failure and timeout
handling, token redaction in errors, retry behaviour, quota parsing, hashtag tiering, caption
determinism and reply classification. No credentials or network access required.

## Safety notes

- Tokens are sent as an `Authorization: Bearer` header, never in a URL, and are redacted from
  every error message.
- The scheduled workflow runs the queue in **dry-run mode** unless the repository variable
  `IG_AUTOPUBLISH` is set to `true`.
- Queue items only publish when `status` is `ready` and `publishAt` has passed. Seeded items are
  drafts.
- Nothing in the storefront app publishes to Instagram; there is no public route that can post.
