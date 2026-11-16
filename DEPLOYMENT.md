# Deployment — idilewa.com on Vercel

Reference state as of the last deployment. Keep this file in sync when DNS or the
Vercel project changes.

## Hosting facts

| Item | Value |
| :--- | :--- |
| Production host | Vercel |
| Vercel team | `idilewa1` (`team_jzWxJAvAEblhtwFiugbn6pYA`) |
| Vercel project | `idilewa` (`prj_5fqiqzVLmDyVhIiieubEKiJJ7Tj7`) |
| Production aliases | `https://idilewa.com`, `https://www.idilewa.com`, `https://idilewa.vercel.app` |
| Source repository | https://github.com/eliazarowoyemi-bot/Idilewa (`main`) |
| DNS host | 123-reg / `ns0.phase8.net`, `ns1.phase8.net`, `ns2.phase8.net` |
| Canonical origin | `https://idilewa.com` (apex); `www` redirects here |

## Current status (verified 2026-11-16)

| Host | Vercel status | Live behaviour |
| :--- | :--- | :--- |
| `idilewa.com` | ✔ Valid Configuration — verified for project `idilewa` | `200` on every route |
| `www.idilewa.com` | ⚠ Verification Required | `307` → `https://idilewa.com/...`, then `200` |
| `idilewa.vercel.app` | ✔ Valid Configuration | `200` |

`vercel domains verify idilewa.com` answers:

```
Success! Valid Configuration: idilewa.com is configured (A record) and verified for project idilewa
```

## Step 1 — Clear the `www` verification badge (only remaining task)

`vercel domains verify www.idilewa.com` reports `Verification Needed for idilewa`
/ `Not accessible under idilewa1` and asks for one DNS record:

| Host | Type | Value |
| :--- | :--- | :--- |
| `_vercel` | `TXT` | `vc-domain-verify=www.idilewa.com,d5cfe3c0646b78ad4810` |

Keep the existing apex row (`vc-domain-verify=idilewa.com,722f42c870be84a523c3`):
TXT allows several values at one name. Enter the new value verbatim — no
`https://`, no `://`, no quotes, no trailing slash. Delete the old malformed
`vc-domain-verify=://idilewa.com,...` row if it is still present.

Then press **Refresh** on the `www.idilewa.com` row in **Settings → Domains**, or
run:

```bash
vercel domains verify www.idilewa.com
```

If Vercel prints a different token on a later attempt, use the newest value — the
expected one is always echoed in `Last attempt: ... missing required TXT Record
"..."`. The badge is cosmetic today because `www` already redirects to the apex,
but it leaves the domain only partially attached.

## DNS records at 123-reg

| Host | Type | Value | Notes |
| :--- | :--- | :--- | :--- |
| `@` | `A` | `216.198.79.1` | Vercel anycast address — `✔ Valid Configuration` |
| `www` | `CNAME` | `d46bc70b0c0880ee.vercel-dns-017.com` | Resolves through Vercel and `307`s to the apex. Leave as-is unless Vercel prints a new target. |
| `_vercel` | `TXT` | `vc-domain-verify=idilewa.com,722f42c870be84a523c3` | Apex ownership — verified; removable once `www` verifies. |
| `_vercel` | `TXT` | `vc-domain-verify=www.idilewa.com,d5cfe3c0646b78ad4810` | Pending — see Step 1. |

## Do not re-add an apex → www redirect

`vercel.json` must **not** redirect `idilewa.com` to `www.idilewa.com`. Vercel's
domain settings already send `www` → apex with a `307`, so an app-level
apex → `www` rule produces an infinite redirect loop on every non-root path:

```
https://idilewa.com/pricing  → 308 → https://www.idilewa.com/pricing
                             → 307 → https://idilewa.com/pricing  → …
```

That state made every deep link fail with `ERR_TOO_MANY_REDIRECTS` while `/`
still returned `200`, which hid the bug during spot checks. To make `www`
canonical instead, first set `www.idilewa.com` as the primary domain in
**Settings → Domains**; never add the redirect rule on its own.

## Deploy

```bash
npm install
npm run build                # local sanity check
npx vercel --prod --yes      # build and promote on Vercel
```

`.vercel/` is gitignored; `vercel link --yes --project idilewa` recreates the
local link on a fresh clone. `.vercelignore` excludes `.env*`, so builds use the
Vercel project environment variables rather than your local `.env`.

The browser bundle reads Supabase config through `envPrefix` in `vite.config.js`
(`VITE_SUPABASE_URL` → `SUPABASE_URL` → `SUPABASE_PUBLIC_URL` →
`NEXT_PUBLIC_SUPABASE_URL`, plus the matching anon keys). Production supplies
`SUPABASE_URL` and `SUPABASE_ANON_KEY`, which is why client auth works without
`VITE_*` variables.

## Verify

```powershell
vercel domains verify idilewa.com
vercel domains verify www.idilewa.com
nslookup -type=TXT _vercel.idilewa.com 8.8.8.8

foreach ($p in '/', '/pricing', '/login', '/creative-studio') {
  curl.exe -s -o NUL -L --max-redirs 4 -w '%{http_code} hops=%{num_redirects}\n' "https://idilewa.com$p"
  curl.exe -s -o NUL -L --max-redirs 4 -w '%{http_code} hops=%{num_redirects}\n' "https://www.idilewa.com$p"
}
```

Expected: both `verify` commands report `Valid Configuration`, and every route
returns `200` with `hops=0` on the apex and `hops=1` on `www`. A `hops=4`, or
`curl: (47) Maximum (4) redirects followed`, means the redirect loop above has
come back.

A `404` whose body reads `The deployment could not be found on Vercel.
DEPLOYMENT_NOT_FOUND` means the hostname reached Vercel but is not attached to
the project.

## Server env vars (Vercel Production)

Verified 2026-11-16 with `npx vercel env ls production --scope idilewa1`.
`POSTGRES_*`, `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` were already present;
these application variables were added on top of them (all stored **Encrypted**,
marked sensitive so `vercel env pull` will not print them back):

| Variable | Value / source | Unblocks |
| :--- | :--- | :--- |
| `APP_BASE_URL` | `https://idilewa.com` | `getProductionOrigin()` no longer throws `503 Guardian approval is not configured yet` |
| `GUARDIAN_TOKEN_SECRET` | 32-byte random hex, generated once and kept in local `.env` | Signing guardian-consent and educator-invite links |
| `PLOTWEAVER_API_KEY` | `pw_dev_…` from local `.env` | `/api/plotweaver/*` — voices, transcription, translation |

Still missing — each needs a real credential, there is **no safe default**:

| Variable | Effect while missing |
| :--- | :--- |
| `GEMINI_API_KEY` (or `GOOGLE_AI_API_KEY`) | `POST /api/ai/conversation` falls back to Ollama and returns `503 Live AI chat is not configured. Add a private HTTPS Ollama host and model…` |
| `OLLAMA_BASE_URL` (optional `OLLAMA_MODEL`, `OLLAMA_EMBEDDING_MODEL`, `OLLAMA_API_KEY`) | Only used when `AI_PROVIDER=ollama` or when no Gemini key is set; production requires `https:` |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Welcome and verification emails are skipped |
| `JUDGE0_URL`, `JUDGE0_AUTH_TOKEN` | `GET /api/code/languages` returns `503` |
| `GOOGLE_TRANSLATE_API_KEY` | Server-side translation unavailable |
| `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_REDIRECT_URI` | Canva Connect stays disabled |

Deliberately **not** uploaded:

| Name | Why |
| :--- | :--- |
| `ZOO_API_KEY` | Local Continue/MCP credential (`.continue/mcpServers/new-mcp-server.yaml`). No application code reads it — it is not an `idilewa` runtime variable. |
| `GITHUB_TOKEN`, `VERCEL_TOKEN` | Local CLI tokens; never project environment variables |
| `AI_RATE_LIMIT_HMAC_KEY` | Optional — `api/ai/conversation.js` falls back to `SUPABASE_SERVICE_ROLE_KEY` |

Rotate or add a value with:

```bash
npx vercel env add <NAME> production --scope idilewa1 --force --value '<value>' --sensitive
```

Then redeploy: **environment changes do not reach an existing deployment**, so a
new production build is required before the API sees them.

## AI provider — Gemini

`/api/ai/conversation` and `/api/ai/knowledge` dispatch on `resolveAiProvider()`
in `src/server/aiConversation.js`:

1. `AI_PROVIDER=gemini` → Gemini (REST, `src/server/geminiProvider.js`).
2. `AI_PROVIDER=ollama` → self-hosted Ollama (HTTPS only in production).
3. Unset → Gemini **if** `GEMINI_API_KEY`/`GOOGLE_AI_API_KEY` is present,
   otherwise Ollama.

So adding the key alone is enough to switch provider; `AI_PROVIDER=gemini` just
pins the choice explicitly (and disables the fallback).

```bash
npx vercel env add AI_PROVIDER production --scope idilewa1 --value gemini --sensitive
npx vercel env add GEMINI_API_KEY production --scope idilewa1 --sensitive   # paste key
npx vercel env add GEMINI_MODEL production --scope idilewa1 --value gemini-flash-latest --sensitive
npx vercel env ls production --scope idilewa1
npx vercel --prod --yes --scope idilewa1
```

`GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash` in code. Pin the
rolling alias `gemini-flash-latest` in production so a dated SKU retirement does
not take chat down again (`gemini-2.5-flash` already answers `404 no longer
available` for newly issued keys).

Verify:

```powershell
curl.exe -s -o NUL -w '%{http_code}\n' -X POST https://idilewa.com/api/ai/conversation `
  -H 'Content-Type: application/json' -d '{\"language\":\"yo\",\"message\":\"Báwo ni?\"}'
```

`200` means Gemini answered; `503` with *"rejected this deployment's
credentials"* means the key is invalid (`400 API_KEY_INVALID` from Google);
`503` mentioning Ollama means no Gemini key reached the function.

**Outstanding (2026-11-16):** the key currently in local `.env`
(`AQ.Ab8RN6…`) is rejected by Google with `API_KEY_INVALID` for both the
`x-goog-api-key` header and the `?key=` query parameter. A valid key from
<https://aistudio.google.com/apikey> must be uploaded before chat can serve
live traffic; until then the endpoint keeps returning the Ollama `503`.

## SEO files

`public/robots.txt` and `public/sitemap.xml` are copied into the static build.
`vercel.json` sets `cleanUrls: true`, so `/about.html` answers `308` → `/about`;
both files therefore advertise clean URLs only (never `<page>.html`). When a new
public page is added at the repo root as `<name>.html`, add
`https://idilewa.com/<name>` to the sitemap and re-run the route sweep.

