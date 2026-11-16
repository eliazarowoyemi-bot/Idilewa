# Deployment — idilewa.com on Vercel

Reference state as of the last deployment. Keep this file in sync when DNS or the
Vercel project changes.

## Hosting facts

| Item | Value |
| :--- | :--- |
| Production host | Vercel |
| Vercel team | `idilewa1` (`team_jzWxJAvAEblhtwFiugbn6pYA`) |
| Vercel project | `idilewa` (`prj_5fqiqzVLmDyVhIiieubEKiJJ7Tj7`) |
| Production alias | https://idilewa.vercel.app |
| Source repository | https://github.com/eliazarowoyemi-bot/Idilewa (`main`) |
| DNS host | 123-reg / `ns0.phase8.net`, `ns1.phase8.net`, `ns2.phase8.net` |
| Canonical origin | `https://www.idilewa.com` (`APP_BASE_URL`) |

## Step 1 — Attach the domain to the project (required)

The project **does not currently own `idilewa.com`**. Vercel answers the domain
with `DEPLOYMENT_NOT_FOUND` (HTTP 404) because no project is mapped to the
hostname, and the CLI refuses to attach it:

```
vercel domains add idilewa.com idilewa
# Error: Not authorized to use idilewa.com (403)
```

A brand-new domain can be added with the same command, so this is **not** a
permission problem — `idilewa.com` is claimed by a *different Vercel scope*
(the old deployment targets `idilewa-com-tapee2.vercel.app` and
`idilewa-nwxk3xs7i-tapee2.vercel.app` point at a team named `tapee2`).

Fix one of these ways, then continue:

1. **Release it from the owning scope** — sign in to the Vercel account/team
   that owns `idilewa.com` (`tapee2`, or the personal account used for the
   earlier deployments) → **Domains** → select `idilewa.com` and
   `www.idilewa.com` → **Remove**. Then, inside team `idilewa1` → project
   `idilewa` → **Settings → Domains**, add both.
2. **Prove ownership instead** — if the dashboard for `idilewa1` shows the TXT
   challenge, make `_vercel` match the record the dashboard requests (see
   Step 2), then press **Verify**. Ownership verification transfers the domain
   to `idilewa1` automatically.

## Step 2 — DNS records

Replace the values below with the exact ones the Vercel dashboard prints after
the domain is added; the apex value is stable, the `www` target is
project-specific.

| Host | Type | Value | Notes |
| :--- | :--- | :--- | :--- |
| `@` | `A` | `216.198.79.1` | Vercel anycast address — already correct |
| `www` | `CNAME` | `<hash>.vercel-dns-017.com` | Currently `d46bc70b0c0880ee.vercel-dns-017.com`, which belongs to the **old** project and must be replaced. `cname.vercel-dns.com` also works as a generic target. |
| `_vercel` | `TXT` | `vc-domain-verify=idilewa.com,<token>` | Only while Vercel asks for ownership verification. |

### Known DNS problems to clean up

`_vercel.idilewa.com` currently resolves to two TXT values:

```
"vc-domain-verify=idilewa.com,b61f25b8839a9cf5cd36"        # keep, or replace with the value the dashboard shows
"vc-domain-verify=://idilewa.com,47d1fc404b806637b434a"    # BROKEN — delete it
```

The second value contains a stray `://`, so it can never match what Vercel
expects. Delete that row. Keep exactly one TXT value, copied verbatim from the
dashboard (no `https://`, no trailing slash, no quotes).

## Deploy

```bash
npm install
npm run build                # local sanity check
npx vercel --prod --yes      # build and promote on Vercel
```

`.vercel/` is gitignored; `vercel link --yes --project idilewa` recreates the
local link on a fresh clone.

## Verify

```powershell
nslookup -type=TXT _vercel.idilewa.com 8.8.8.8
nslookup idilewa.com 8.8.8.8
nslookup www.idilewa.com 8.8.8.8
vercel domains ls
```

Expected: `idilewa.com` → `216.198.79.1`, `www` → a `vercel-dns-0xx.com`
CNAME, `vercel domains ls` lists both names, and both URLs return `200`
(`idilewa.com` answers `308` to `https://www.idilewa.com/...`).

A `404` whose body reads `The deployment could not be found on Vercel.
DEPLOYMENT_NOT_FOUND` means the hostname reached Vercel but is not attached to
the project — go back to Step 1.
