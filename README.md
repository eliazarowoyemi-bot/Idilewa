# Idilewa — Preserving African Culture. Promoting Technology.

A family- and community-centered web application for African language learning, oral traditions, cultural storytelling, and K–8 indigenous coding and STEM.

---

## 1. Product Purpose & Philosophy

Idilewa connects language acquisition with oral memory, listening, cultural context, and future-facing technology education.
Culture is treated as **living knowledge carried by people** across generations—not as static decoration.

The experience unifies:
- **Language Discovery:** Foundation learning for Yorùbá, Igbo, Hausa, and Kiswahili, alongside planned paths for Twi, Wolof, isiZulu, and Fulfulde.
- **African Voice Trainer & Sound Studio:** 60 structured lessons across Beginner, Intermediate, and Advanced tiers, Do-Re-Mi tone melodies, and phonetic visualizers.
- **Living Stories & Oral Traditions:** Òwe (proverbs), Oríkì (praise poetry & remembrance), Ifá educational overviews, and intergenerational family stories.
- **Code for Kids (K–8 STEM):** Indigenous coding environment (*ÈdèKoodu*) with turtle graphics, bilingual keyword maps, and grade-band curriculums.
- **Family & Educator Stewardship:** Parent/guardian consent demonstrations and tutor discovery with privacy-conscious safeguarding.

---

## 2. Design System & Tokens

The visual identity is warm, calm, editorial, and rooted in nature. It strictly adheres to the project's designated design tokens:

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Deep Forest Green** | `#0E4D34` | Main headings, major containers, navigation, and high-contrast actions |
| **Vibrant Leaf Green** | `#029A5B` | Brand accent for links, icons, active states, and action highlights |
| **Mint Tint** | `#E8F6F0` | Soft category cards and spacing surfaces |
| **Warm Ochre Gold** | `#EAA822` | Cultural highlights and interactive accents |
| **Terracotta Red** | `#D34836` | Cultural badges and warm secondary accents |
| **Off-White** | `#F9FBF9` | Shared page canvas and browser theme color |
| **Charcoal / Dark Olive** | `#2C3E35` | Body text and secondary copy |

- **Typography:** Inter-first sans-serif stack (`Inter, system-ui, -apple-system, sans-serif`).
- **Layout:** Maximum container width around `1200px`, soft green-tinted shadows, `22px` / `30px` rounded cards and buttons.
- **Header:** Light translucent sticky navigation with active link indicators and instant search overlay.
- **Responsive layouts:** Shared and standalone pages adapt to phone, tablet, and desktop widths without horizontal page overflow.

---

## 3. 3D Engine & Interactive Scroll Experience

The application incorporates a restrained, performant Three.js 3D engine integrated directly into the live application runtime (`src/threeScene.js`):

1. **Family Living View homepage hero:**
   - Shows the family learning together as the single homepage hero visual.
   - Includes interactive language-greeting and story hotspots.
2. **Scroll-Driven 5-Pillar Visual Journey:**
   - Landing page visual timeline smoothly transitioning across:
     - **Pillar 01 (Èdè):** Language & Everyday Speech
     - **Pillar 02 (Ohùn):** Voice & Tonal Melody Studio
     - **Pillar 03 (Òwe & Oríkì):** Oral Traditions & Attributed Wisdom
     - **Pillar 04 (Ìtàn):** Stories That Travel & Family Reading
     - **Pillar 05 (Koodu):** Indigenous STEM & Code for Kids
3. **Route 3D Stages:**
   - **Coding (`#/coding`):** 3D Yoruba Hologram Matrix Cube & Rotating Glyphs (`init3DCodingCanvas`).
   - **Stories (`#/ere`, `#/oral`):** 3D Sacred Story Drum, Cowrie Shell & Magic Story Orb (`init3DStoryCanvas`).
   - **Auth & Consent (`#/login`, `#/consent`):** 3D Sacred Shield & Gateway Key (`init3DAuthCanvas`).
   - **Audio Studio (`#/trainer`):** 3D Waveform Audio Visualizer (`init3DAudioVisualizer`).
4. **Interactive 3D Perspective Card Tilt (`init3DTiltEngine`):**
   - Dynamic 3D depth and radial light glare on cards during mouse hover.
5. **Accessibility & Fallbacks:**
   - **WebGL Fallback:** If WebGL is unavailable or fails, gracefully displays an accessible cultural fallback card (`.webgl-fallback-stage`).
   - **prefers-reduced-motion:** Fully respects user motion preferences. Disables continuous spin loops, eliminates hover tilts, and renders static 3D models with instant transitions.

---

## 4. Architecture & Module Integration

The application is bundled with Vite as an ES module web application:

- **`app.js`:** Central routing, state management, UI rendering, event delegation, and module coordinator.
- **`src/threeScene.js`:** Three.js 3D scene engine, orbit controls, audio visualizer, card tilt engine, and WebGL fallbacks.
- **`src/translationEngine.js`:** Multi-language dictionary, word lexicons, and Web Audio API tone pitch synthesizer (`playTonePitch` for Dò-Re-Mí).
- **`src/plotweaverClient.js` and `api/plotweaver/[...path].js`:** Browser client and server-side proxy for Plotweaver speech, voice discovery/cloning, translation, and transcription; the API key stays on the server.
- **`src/yorubaCodeEngine.js`:** *ÈdèKoodu* Yoruba coding keywords, curriculum lessons, transpiler, turtle graphics canvas, and safe sandbox executor (`executeYorubaCode`).
- **`src/vowelsConsonantsData.js`:** Yoruba oral vowels, nasal vowels, consonants, and tone pitch reference guides with interactive soundboard.
- **`src/supabaseClient.js`:** Supabase authentication and database persistence layer with local browser storage offline-first fallback.
- **`styles.css`:** Curated design tokens, responsive breakpoints, typography, 3D scroll animations, and accessibility styles.

### Family portal

The parent experience is available at `parents.html` (`#/families`) and includes dedicated parent sign-up and sign-in, a guardian-approved family dashboard, learner progress, connection updates, and account settings. Parent account confirmation returns to the protected `parent-dashboard` route. Learner data is loaded from the authenticated `/api/dashboard/parent` endpoint; direct teacher messaging is not enabled.

## 5. Page & Route Inventory (37 HTML Entries)

All 37 HTML entries declared in the active `vite.config.js` are supported:

| Group | Route | Purpose & Key Features |
| :--- | :--- | :--- |
| **Home & Discovery** | `#/index` (`index.html`) | Story-led landing page with an app preview and direct links to language and culture learning. |
| | `#/base` (`base.html`) | Complete platform directory classified by learning, culture, and technology. |
| | `#/languages` (`languages.html`) | Primary paths (Yorùbá, Igbo, Hausa, Swahili) + growing paths + interactive soundboard. |
| | `#/course` (`course.html`) | Language course tracks (3 levels, 4 modules per level, 5 lessons per module). |
| | `#/lesson` (`lesson.html`) | Focused lesson practice, prompts, answer validation, and progress rewards. |
| | `#/kids` (`kids.html`) | Child-centered learning portal with playful stories and coding. |
| | `#/individuals` (`individuals.html`) | Independent learner & heritage reconnection pathways. |
| | `#/schools` (`schools.html`) | Classroom educator guide with preview-only school interest inquiry. |
| | `#/tutor` (`tutor.html`) | Tutor Portal with public introduction, educator sign-in/invitation signup, dashboard, learner connection requests, consent, lesson, messages, profile, availability, and settings interfaces. |
| | `#/profile` (`profile.html`) | Learner progress dashboard, points, streaks, badges (stored in local browser state). |
| | `#/login` (`login.html`) | Persona-based authentication (child, adult, parent, educator) with 3D shield and Supabase notice. |
| | `#/pricing` (`pricing.html`) | Preview family/explorer plans; explicitly non-billing demonstration. |
| **Voice & Speech** | `#/trainer` (`trainer.html`) | Voice African Language Trainer: 6 languages, 60 audio lessons, Do-Re-Mi soundboard, 3D visualizer. |
| | `#/voice_lessons` (`voice_lessons.html`) | Route alias & standalone shell resolving to the Voice Trainer studio. |
| | `#/voices` (`voices.html`) | Sample greeting library for Yorùbá, Igbo, Hausa, and Swahili with Plotweaver speech audio where supported. |
| **Culture & Stories** | `#/ere` (`ere.html`) | Living story shelf featuring shared family tales and save controls. |
| | `#/ere_game` (`ere_game.html`) | “The story that travelled” interactive reading and comprehension reflection. |
| | `#/heritage` (hash route) | Responsive Stories, Culture & Riddles experience with story listening, lesson quizzes, festival learning, riddles, saved progress, streaks, and profile screens. |
| | `#/oral` (`oral.html`) | Oral traditions gateway (Oríkì, Òwe, spoken word, and song). |
| | `#/oral_genre` (`oral_genre.html`) | Guided genre index linking attribution, speaker context, and consent. |
| | `#/oriki` (`oriki.html`) | Yorùbá praise poetry & remembrance, exploring rhythm, speaker, and permission. |
| | `#/owe` (`owe.html`) | Proverb gateway: original text, translations, stories, and reflection journey. |
| | `#/owe_add` (`owe_add.html`) | Proverb contribution form with consent checkbox (stored on current device only). |
| | `#/owe_detail` (`owe_detail.html`) | Proverb breakdown for *“Sùúrù ni baba ìwà”* (noted as one common rendering). |
| | `#/owe_story` (`owe_story.html`) | Educational classroom story about Dami & the okra seed (explicitly not a traditional folktale). |
| | `#/owe_reflection` (`owe_reflection.html`) | Personal reflection step with explicit privacy notice. |
| | `#/ifa` (`ifa.html`) | Educational context for Ifá and Yorùbá knowledge systems (not spiritual advice). |
| | `#/ifa_odu` (`ifa_odu.html`) | Cultural note on Odu poetry with community attribution guidance. |
| | `#/guides` (`guides.html`) | Living culture guides: greetings, naming traditions, customs, and festivals. |
| | `#/human` (`human.html`) | People and community portal highlighting educators and culture bearers. |
| | `#/keepers` (`keepers.html`) | Culture keepers page foregrounding attribution, privacy, and community agency. |
| **Coding & STEM** | `#/coding` (`coding.html`) | Code for Kids (K–8): grade bands, African-language coding lessons, browser HTML/CSS/JavaScript previews, and additional compiler runtimes when the private runner is configured. |
| **Community & Safety**| `#/about` (`about.html`) | Origin story and philosophy of Idilewa. |
| | `#/method` (`method.html`) | Pedagogical progression connecting listening, cultural context, and practice. |
| | `#/connect_teachers` (`connect_teachers.html`)| Sample tutor directory requiring parent-approved code (demo-only, no live bookings). |
| | `#/connect_students` (`connect_students.html`)| Tutor-facing view for sample student assignments with guardian verification. |
| | `#/consent` (`consent.html`) | Guardian consent demonstration issuing local verification codes with safety disclosures. |

---

## 6. Prototype Boundaries & Safeguarding Disclosures

To ensure transparency and protect learner privacy:
1. **Speech & Fluency:** Plotweaver provides text-to-speech and supported-language transcription. Transcription returns recognized text only; it does not evaluate pronunciation, tone, or fluency. Provider language coverage differs by service, so the interface loads available languages and does not promise support for every African language in every feature.
2. **Authentication & Data Storage:** Sign-up, email-code verification, sign-in and sign-out use Supabase Auth when configured. Account metadata and learner-record APIs are available, but not every progress, code or voice interaction in the app is yet connected to remote storage; unconnected state remains browser-local. Remote account/database delivery has not been verified against the production project.
3. **Child Safeguarding & Consent:** Child sign-up requires a guardian email approval request and one-time code through the Vercel API. The educator path requires a server-verified, single-use invitation. Both paths remain unavailable until their database migration and server email settings are configured. This workflow does not replace legal identity verification or educator background checks; live tutoring remains disabled.
4. **Payments & Subscriptions:** Pricing cards are preview concepts only. No live financial transactions or payment gateways are configured.
5. **Cultural Attribution:** Proverbs, Oríkì, and Ifá introductions are educational overviews and explicitly emphasize community permission, speaker context, and oral attribution.

---

## 7. Running & Building Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Multi-Page Production Build
```bash
npm run build
```
Vite bundles all 37 HTML entry points and compiles assets to the `dist/` directory.

### IDE and authentication services

The Code page runs Yorùbá/Igbo/Hausa/Kiswahili lessons and HTML, CSS, and JavaScript previews in the browser. Additional compiler languages are available only when the app is deployed with its Vercel API routes and a reachable private Judge0 CE service. The API reports installed languages rather than promising that every allowlisted runtime is installed.

In Code Studio, drag the divider above the console to resize the output panel, or focus it and use the arrow keys. The chosen height is saved in the current browser.

Configure these values in `.env.local` for the Vite client and in the deployment environment settings:

```dotenv
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
JUDGE0_URL=https://your-private-judge0-service.example
JUDGE0_AUTH_TOKEN=your-private-runner-token
```

`VITE_CONVEX_URL`, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are public client configuration, not secrets. The client forwards the current Supabase access token to Convex and refreshes it when required. `convex/auth.config.ts` configures Convex to verify Idilewa Supabase tokens using the Supabase JWKS endpoint and ES256 signing key; do not copy a private JWT signing key into the app. For existing deployments, `SUPABASE_PUBLIC_URL` and `SUPABASE_ANON_KEY` are also supported by the Supabase client. `JUDGE0_URL` and `JUDGE0_AUTH_TOKEN` are server-side secrets and must never use the `VITE_` prefix or be placed in browser code. Keep Judge0 private and configure execution time and memory limits.

Run `npx convex dev` in one terminal to deploy Convex functions and auth configuration to the configured development deployment, then run `npm run dev` in another terminal for the Vite app. The `convex/auth.whoami` query can be used to verify that a Supabase session is recognized by Convex. This auth bridge does not itself migrate Supabase tables or the existing Vercel API routes; keep those services active until their Convex replacements and data migration are separately implemented and validated.

The production canonical site is `https://www.idilewa.com`. The Vercel project redirects its apex and stable Vercel aliases to this hostname; use the DNS records shown in the Vercel domain settings for both `idilewa.com` and `www.idilewa.com`.

Use `vercel dev` to exercise the Vercel API routes locally; plain `npm run dev` serves the Vite front end and does not provide `/api/code/*`. GitHub Pages can host the static front end, but not these API routes, so compiler languages and configured Supabase sign-in require the Vercel deployment. Treat GitHub Pages as a static preview unless its workflow is intentionally migrated.

### Supabase account setup and operations

The migration files in this repository are not proof that a remote database has been provisioned. In the intended Supabase project, link the repository and apply pending migrations in order:

1. `supabase/migrations/20261016000000_initial_schema.sql` (base tables and owner-only profile access).
2. `supabase/migrations/20261016010000_guardian_consent.sql` (guardian approval and child account checks).
3. `supabase/migrations/20261017000000_account_security_and_educator_invites.sql` (role protection and one-time educator invitations).

Run `supabase link --project-ref <project-ref>` and `supabase db push --linked` after verifying the target project. Do not enable account registration until the migrations complete successfully; deployment does not apply database migrations. Never test account creation against production with an unowned test address.

Enable Supabase email confirmation, configure the branded confirmation template to use `{{ .ConfirmationURL }}`, and allow `https://www.idilewa.com/auth-callback.html` in Auth redirect settings. Set the minimum password length to 12 in the Supabase Auth password policy. The app enforces 12–128 characters plus uppercase, lowercase, number and symbol at sign-up and password recovery; existing sign-in passwords are not blocked by that client-side minimum. Adults sign in with email and password; child sign-in uses a parent-issued one-time passcode, and password recovery uses a one-time code. Account roles are checked against the private profile after authentication. Actual inbox delivery depends on the Supabase SMTP/provider configuration and must be tested using a mailbox you control. Keep local and production auth configuration pointed at their intended projects; accounts do not transfer between Supabase projects.

New child registration stays paused until guardian approval email delivery has a sender on a domain verified in Resend. Existing child accounts can still sign in; adult and invited educator registration remain available. Do not set `RESEND_FROM_EMAIL` to a public mailbox address such as Gmail.

Configure these server-only Vercel variables for welcome emails, guardian approvals and educator invites:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
GUARDIAN_TOKEN_SECRET=use-a-random-secret-of-at-least-32-characters
APP_BASE_URL=https://your-production-domain.example
RESEND_API_KEY=your-email-provider-api-key
RESEND_FROM_EMAIL=Idilewa <no-reply@your-verified-domain.example>
```

After Supabase creates an account, the app requests a welcome email from `/api/auth/welcome`. The server verifies the new account through Supabase and sends the message through Resend to the email address on that account; it does not depend on the user remaining signed in. The responsive welcome message introduces Idilewa and four ways to begin: language learning, voice practice, stories and culture, and coding/STEM. Its sign-in link returns the user to the canonical production login page. Supabase still sends the separate sign-up verification code, so configure its Auth email template to use `{{ .Token }}` as described above. A failed welcome-email delivery is reported without discarding the newly created account.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `GUARDIAN_TOKEN_SECRET` or the Resend key in a `VITE_` variable. Verify the sender domain and rate-limit policies before launch. Set `APP_BASE_URL` to the canonical HTTPS site origin. With `GUARDIAN_TOKEN_SECRET` set to the same secret in your shell, run `node scripts/create-educator-invite.mjs`; provide the printed SQL to a trusted Supabase operator, then share the code with the intended educator once. The database consumes it atomically during account creation.

Before serving real users, configure automated database backups/PITR for the selected Supabase plan, document retention and deletion policies, restrict production access, and test restoring a backup into a separate project. Schedule review of database logs, Auth/email delivery, API errors and rate limits. These operational controls are project/provider settings and are not established by the repository alone.

Lesson completion and code attempts use the account-backed Supabase tables when a user is signed in; database failures are shown rather than silently treated as successful saves. The client also exposes remote voice-record methods, but the current voice score is simulated and is not persisted or a verified assessment. Guest records and significant learning UI state remain local, so cross-device continuity for every activity is not yet complete.

### Translation service

The voice studio uses its curated phrasebook for exact English-to-language matches, then calls the server-side Plotweaver translation proxy for supported source/target languages. Configure `PLOTWEAVER_API_KEY` in Vercel's Production and Preview environments (or migrate the existing `Idilewa` variable to that name); never expose it in a `VITE_` variable or browser bundle. Plotweaver's current translation endpoint supports Yorùbá, Hausa, Igbo, Nigerian Pidgin and English; it does not currently provide translation for every language in its speech catalogue. Text-to-speech and voice cloning use the languages enabled for the key. Speech-to-text currently supports Yorùbá, Hausa, Igbo, Nigerian Pidgin and English. The voice page loads the available language lists from Plotweaver instead of claiming unsupported languages work. Machine translation can miss idiom, context and tone marks; fluent-speaker review is recommended for important text.

### Plotweaver voice services

The `/api/plotweaver/*` Vercel function keeps the API key server-side and proxies language/voice discovery, speech generation, translation, transcription and voice cloning. For local API testing use `vercel dev`; Vite's static development server cannot execute Vercel functions. The voice library, lesson vowels/consonants, lesson playback, free-text speech generator, phrase translation/dictation and recorded lesson transcription use this proxy. Yorùbá vowel-sequence playback selects a recommended native Yorùbá voice from Plotweaver and does not substitute device speech if that voice is unavailable. Generated audio and recordings are not stored by Idilewa; recordings are sent to Plotweaver for the requested transcription or voice-clone operation.

Voice cloning requires an explicit ownership/permission confirmation and a clean 4–8 second clip. The public application limits uploads to 4 MB to fit serverless request-size limits; non-Nigerian voice samples require an exact transcript. Created voice IDs are saved only in the current browser’s local state; the public API does not expose clone enumeration or deletion. Plotweaver usage may incur charges, so configure provider-side usage limits and monitor consumption. The API endpoint is public; CORS only governs browser access and is not authentication. Do not upload a child’s or another person’s voice without their informed permission. Set `IDILEWA_ALLOWED_ORIGINS` to the exact GitHub Pages frontend origin if using a separate static site; keep API and frontend on the same trusted deployment where possible.

The GitHub Pages workflow publishes only the static frontend and cannot host `/api/plotweaver/*`. For the requested “both” deployment, the Vercel project must host the API functions, and its URL should be set as `VITE_PLOTWEAVER_API_BASE_URL` for the Pages build. Configure the key separately in Vercel; GitHub Pages must never receive the API key. Confirm the actual Pages origin and Vercel project environment before enabling paid API calls.

### Preview Production Build
```bash
npm run preview
```
Serves the production bundle at `http://localhost:4173`.
