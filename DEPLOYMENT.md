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

## Step 1 — Fix the `_vercel` TXT record (the actual blocker)

`vercel domains verify idilewa.com` reports:

```
DNS Configuration    ✔ Valid Configuration (A record)
Project              ☐ Verification Needed for idilewa
Ownership            ☐ Not accessible under idilewa1

Last attempt: Domain _vercel.idilewa.com has incorrect TXT Record.
Expecting "vc-domain-verify=idilewa.com,722f42c870be84a523c3"
```

The TXT values currently in DNS (`b61f25b8839a9cf5cd36` and the malformed
`://idilewa.com,47d1fc404b806637b434a`) belong to **older verification
attempts**, so ownership can never be proven. At the DNS provider, **delete
both existing `_vercel` TXT rows** and add exactly one:

| Host | Type | Value |
| :--- | :--- | :--- |
| `_vercel` | `TXT` | `vc-domain-verify=idilewa.com,722f42c870be84a523c3` |

Enter the value verbatim: no `https://`, no `://`, no quotes, no trailing slash.

Then re-run the check and attach the domain:

```bash
vercel domains verify idilewa.com     # Ownership should become ✔
vercel domains add idilewa.com idilewa
```

If Vercel prints a **different** token after a new attempt, use the newest value
it reports — the expected token is the one Vercel echoes back in
`Last attempt: ... Expecting "..."`.

`idilewa.com` is currently registered under another Vercel context (the old
deployment aliases `idilewa-com-tapee2.vercel.app` /
`idilewa-nwxk3xs7i-tapee2.vercel.app` point at a team named `tapee2`), which is
why the CLI answers `Error: The domain idilewa.com already exists under a
different context.` Verifying ownership with the TXT record above transfers it
to `idilewa1`. Alternatively, sign in to that other scope → **Domains** →
remove `idilewa.com` and `www.idilewa.com`, then add them to `idilewa1` →
project `idilewa` → **Settings → Domains**.

## Step 2 — DNS records

| Host | Type | Value | Notes |
| :--- | :--- | :--- | :--- |
| `@` | `A` | `216.198.79.1` | Vercel anycast address — already correct and verified |
| `www` | `CNAME` | `<hash>.vercel-dns-017.com` | Currently `d46bc70b0c0880ee.vercel-dns-017.com`, which belongs to the **old** project. Replace it with the value Vercel shows once `www.idilewa.com` is added. `cname.vercel-dns.com` also works as a generic target. |
| `_vercel` | `TXT` | `vc-domain-verify=idilewa.com,<token>` | One value only, copied verbatim from Vercel. Removable after verification. |

Both `idilewa.com` and `www.idilewa.com` must be added to the project. The apex
answers `308` to `https://www.idilewa.com/...` (see `redirects` in
`vercel.json`), so a broken `www` makes the apex appear broken too — finish the
`www` CNAME before going live.


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
