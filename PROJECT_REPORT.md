# Idilewa Project Report

**Purpose:** A comprehensive product and implementation overview of the Idilewa workspace, its goals, user journeys, pages, design system, and current prototype boundaries.

**Scope:** This report describes the source currently present in the repository. Product language such as "planned," "preview," "sample," and "coming soon" is treated as a status signal, not as a production capability.

## 1. Executive Summary

Idilewa is a culturally grounded, family-oriented learning platform concept. Its central goal is to help children, families, independent learners, educators, and language communities keep African languages close while connecting language learning to culture, oral knowledge, stories, and technology education.

The product brings several learning modes into one web experience:

- Language discovery and structured beginner-to-advanced learning paths.
- Listening, pronunciation, tonal awareness, and sample speech practice.
- Stories and oral traditions, including proverbs (Òwe), praise poetry (Oríkì), and cultural introductions.
- A K-8 coding and STEM space that connects programming ideas to African languages and cultural examples.
- Learner progress and family/tutor discovery concepts, with parent consent as a prerequisite for child-tutor connections.

The repository is best understood as a rich interactive prototype with a growing server-backed boundary, not a fully deployed learning service. The shared client application integrates Supabase Auth and separate translation, Yoruba-code, phoneme-data, and Three.js modules. Sign-up/sign-in require configured Supabase Auth. The Code page supports local African-language lessons and browser-based web previews; additional compiler runtimes require the Vercel API routes and a configured private Judge0 CE service. Production safeguarding, real tutor communication, reviewed language media, and durable learner records remain work to complete.

## 2. Product Intent

### The problem Idilewa aims to address

Language learning can become detached from the family, community, history, and everyday situations that give a language meaning. At the same time, technology education is often presented without the learner's home language or cultural context. Idilewa aims to bring these together in a welcoming learning space where cultural knowledge is treated as living knowledge carried by people, not as decoration or a static chapter.

### Intended outcomes

- Make it easy to begin or reconnect with an African language at an appropriate level.
- Encourage practice through short, understandable steps rather than a single intimidating course.
- Teach listening and pronunciation alongside written words and meanings.
- Place proverbs, stories, oral forms, and cultural context beside language instruction.
- Let young learners encounter computational thinking and STEM in culturally familiar contexts.
- Give families and educators a visible role in supporting children.
- Treat consent, attribution, cultural nuance, and privacy as core product requirements.

### Audiences represented in the product

- Children and young learners, including K-8 coding learners.
- Adults learning independently or reconnecting with a heritage language.
- Parents, guardians, and families learning together.
- Language teachers, tutors, and school educators.
- Elders, storytellers, oral historians, and other culture keepers whose knowledge should be represented with care.

### Product principles visible in the code

- **Culture is integral:** stories, proverbs, identity, and context appear throughout the learning routes.
- **Small, visible steps:** language, level, module, lesson, practice, and reflection are organized into repeatable sequences.
- **Listen before repeating:** the oral-culture pages stress speaker, context, permission, and attribution.
- **Family-first connections:** child-to-tutor flows are designed around named guardian approval.
- **Welcoming progress:** points, streaks, completion indicators, and feedback are framed as encouragement.
- **Prototype honesty:** pages disclose when media, people, payments, AI, or storage are only demonstrations.

## 3. End-to-End Experience

1. **Discover the platform.** The home page introduces language, culture, stories, voice practice, and coding. Audience pages help a learner choose a relevant starting point.
2. **Choose a language.** The language chooser presents available and planned paths. A learner can select a language and level.
3. **Follow a course.** The intended structure is language -> level -> module -> lesson. The code describes three levels and 20 lessons per level, organized into four modules.
4. **Practice.** Lesson views include a prompt, short activity, answers or response fields, feedback, and local progress behavior. The voice trainer adds selectable phrases, tone examples, speed settings, lesson navigation, and a recording/analysis flow.
5. **Explore culture through oral forms.** Learners can move from the oral-traditions overview into stories, proverbs, Oríkì, voice samples, and introductory Ifá/Odu pages. Some experiences gate later steps on a previous comprehension check.
6. **Create with code.** The coding route introduces K-8 curriculum bands, a language-aware code environment, and free STEM lessons. Challenges use points and completion state.
7. **Reflect and continue.** Learners can save sample stories, write a proverb reflection, view progress, and revisit course or culture routes.
8. **Connect with an educator (intended flow).** A child requests family approval; a guardian completes the consent flow and may approve a specific tutor; the child verifies a code; the tutor validates the matching code before seeing an anonymous assignment. In the current demo, these checks are local browser checks and do not establish real identity or secure authorization.

The primary navigation exposes Home, Learn, Voice Trainer, Read & listen, Code, Stories, and About. Additional routes are reachable through in-page links, the platform directory, and the footer.

## 4. Complete Page Inventory

The Vite configuration includes **36 HTML entry files**. Most files are small shells that load the same stylesheet and `app.js`; actual page content is rendered by the shared application based on the URL hash. Page descriptions below reflect the code in the route renderer, not a claim that every proposed production service is live.

### A. Home, discovery, and learning

| Entry / route | Purpose and current experience |
|---|---|
| `index.html` / `index` | Main landing page. Introduces the platform promise, the learning journey, language choices, tonal practice, featured books/stories, audience paths, and calls to explore. It links the language, story, coding, and educator areas. |
| `base.html` / `base` | Platform map/directory. Groups links into Learn & practice, Stories & living culture, and Technology & Idilewa. It is an index of routes rather than a separate curriculum. |
| `languages.html` / `languages` | Language chooser. Four primary paths are listed (Yorùbá, Igbo, Hausa, and Swahili); additional language interests are shown as growing/planned paths, including Twi, Wolof, isiZulu, and Fulfulde. Language-course copy should not be read as proof that all reviewed lesson content exists. |
| `course.html` / `course` | Course selection for a chosen language and level. The intended course shape is three levels, four modules per level, five lessons per module (20 lessons per level). Some language paths deliberately show a pending-content state where reviewed text/audio are not available. |
| `lesson.html` / `lesson` | Individual practice view inside the language curriculum. Provides a focused lesson, response/activity controls, and completion/progress behavior. Route parameters select the language, level, module, and lesson. |
| `kids.html` / `kids` | Audience page for children. Emphasizes short phrases, shared stories, playful practice, and coding, with links into the learning paths. |
| `individuals.html` / `individuals` | Audience page for independent learners and heritage-language reconnection. Suggests choosing a level, listening/practicing, and following interests into culture and code. |
| `schools.html` / `schools` | Audience page for schools and educators. Describes use in classroom learning, curriculum structure, cultural context, and an interest form. The form is preview-only and does not send details. |
| `tutor.html` / `tutor` | General editorial page introducing tutor-led learning, guided conversation, cultural context, and learning-path continuity. It is informational; the actual sample directory is `connect_teachers`. |
| `profile.html` / `profile` | Learner progress dashboard concept. Shows current language/level, completion progress, a learning streak, points, and a timeline. The page explicitly describes progress as saved in the current browser for the prototype. |
| `login.html` / `login` | Simplified sign-in/create-account interface with persona selection (child, adult, parent, educator) and consent-oriented child flow. Auth uses Supabase Auth only when its public URL and anon key are configured; otherwise account submission is disabled and guest exploration remains available. |
| `pricing.html` / `pricing` | Plans preview with monthly/yearly selection and Explorer/Family-style plan concepts. The page calls out that final scope/details are not set; it does not implement a live subscription or payment service. |

### B. Voice, language sound, and pronunciation

| Entry / route | Purpose and current experience |
|---|---|
| `trainer.html` / intended `trainer` | Voice trainer entry shell. The `trainer` hash route is a real app route and renders the trainer, but the standalone HTML shell currently sets its default route to `voice_lessons`, which is not accepted by the router. Opening the shell without a hash therefore falls back to the home route. |
| `voice_lessons.html` / intended `voice_lessons` | A second voice-training entry shell with similar metadata. `voice_lessons` is absent from the app route allowlist or renderer. Its default route consequently falls back to home. Use `#/trainer` for the implemented trainer route. |
| `voices.html` / `voices` | Small voice library of sample greetings for Yorùbá, Igbo, Hausa, and Swahili. Playback uses browser speech behavior; the page says these are prototype samples and that production recordings should be approved by native speakers. |

The trainer UI includes six language choices (Yorùbá, Igbo, Hausa, Kiswahili, isiZulu, and Twi/Akan), beginner/intermediate/advanced tiers, a 60-lesson framing, phrase text and phonetic display, tone/syllable buttons, playback speed selection, lesson navigation, score summaries, and a certificate-progress concept. Current lesson data and scoring are client-side demo data. Any "AI" or native-fluency marketing language should be treated as aspiration, not validation of a production speech model or human-reviewed score.

### C. Stories and living culture

| Entry / route | Purpose and current experience |
|---|---|
| `ere.html` / `ere` | Story shelf with a small set of reading/listening concepts, story cards, save controls, and a link to the story activity. Stories are positioned as shared family experiences. |
| `ere_game.html` / `ere_game` | Story-time activity for "The story that travelled." Includes read/listen controls, short story text, an oral-sharing/attribution reminder, and a comprehension reflection. |
| `oral.html` / `oral` | Gateway to oral traditions. Introduces voice practice, Oríkì, Òwe, and stories/songs; directs learners to the voice library and community/keepers pages. |
| `oral_genre.html` / `oral_genre` | Guided genre index linking to voice training, Oríkì, Òwe, folktales, and spoken word. Explicitly frames its introductions as starting points and calls for consent, context, and attribution. |
| `oriki.html` / `oriki` | Guided introduction to Yorùbá Oríkì as praise poetry and remembrance. Encourages attention to rhythm, speaker, addressee, local context, and asking before repeating. |
| `owe.html` / `owe` | Òwe/proverb overview. Presents one proverb and the four-stage journey: original words, translation/meaning, moral story, and personal reflection. Includes a local-demo proverb contribution route. |
| `owe_add.html` / `owe_add` | Form for a proverb in its original language, meaning/translation, context/attribution, and permission checkbox. Submissions are stored only on the current device in the demo; nothing is sent or published. |
| `owe_detail.html` / `owe_detail` | Translation and meaning lesson for “Sùúrù ni baba ìwà.” Explains that the displayed translation is one common rendering, includes a meaning check, and gates the following story step. |
| `owe_story.html` / `owe_story` | Original classroom story about Dami and an okra seed. It is explicitly not presented as a traditional folktale. Contains a comprehension check and is gated by completion of the meaning step. |
| `owe_reflection.html` / `owe_reflection` | Final step in the proverb activity. After the story check, learners choose a feeling and save a thought/action locally. It warns users not to enter private details and notes that browser users can see saved content. |
| `ifa.html` / `ifa` | General educational introduction to Ifá and Yorùbá knowledge. Stresses community voices, context, and not reducing a living tradition to a quick summary. |
| `ifa_odu.html` / `ifa_odu` | Introductory Odu cultural note. Explicitly non-prescriptive and educational, not spiritual advice; routes learners toward language, community context, and respectful reflection. |
| `guides.html` / `guides` | General cultural-guides page for themes such as greetings, names, customs, food, festivals, and heritage. Uses the shared editorial template and links to language/culture areas. |
| `human.html` / `human` | People-and-community page presenting educators, storytellers, and learners as carriers of language across generations. Uses the shared editorial template. |
| `keepers.html` / `keepers` | Culture-keeper page emphasizing listening, context, attribution, and community agency over what is shared or kept private. Uses the shared editorial template. |

### D. Coding, community, and safeguarding

| Entry / route | Purpose and current experience |
|---|---|
| `coding.html` / `coding` | K-8 Code for Kids/STEM experience. Shows K-2, grades 3-5, and grades 6-8 curriculum bands; code-in-your-language lessons; browser-based HTML/CSS/JavaScript previews; and an IDE that can discover and run installed runtimes through the Vercel API and private Judge0 CE. Compiler availability depends on the deployed runner configuration. |
| `about.html` / `about` | Product story: culture, community language, oral tradition, and technology belong together. Shared editorial layout with cards to related areas. |
| `method.html` / `method` | Learning-method overview that connects listening, practice, and cultural context. Describes a clear progression from language through lesson; links to voice, practice, and oral culture. |
| `connect_teachers.html` / `connect_teachers` | Family/learner-facing sample tutor directory. Filters illustrative educator profiles and teaching focus; requires a guardian-approved code before a demo introduction request. The page expressly says profiles/schedules are sample data and no booking or message is sent. |
| `connect_students.html` / `connect_students` | Tutor-facing safeguarding flow. Requires validation of the guardian-approved code for the named tutor before an anonymous sample learner assignment can open. Example learner cards are fictional/read-only; accepting an assignment does not create a real lesson or message. |
| `consent.html` / `consent` | Guardian-consent demonstration: generate a request reference, guardian form and typed signature, issue a local code, verify a child, and optionally approve a specific tutor. The UI warns that local browser state cannot prove identity or securely authorize a child. |

### E. Shell consistency and route caveat

All HTML entries use a shared page shell with a skip link, header mount point, main-content mount point, mobile-nav mount point, modal/toast roots, `styles.css`, and `app.js`. `vite.config.ts` lists 36 HTML build inputs. The application has its own hash route allowlist and renderer; a valid entry file does not automatically mean its `data-default-route` is recognized by that renderer.

The `trainer` route is in the app allowlist and renders with `#/trainer`. The value `voice_lessons` is not in the allowlist or `renderPage` switch. Both `trainer.html` and `voice_lessons.html` currently declare `data-default-route="voice_lessons"`; their no-hash default is consequently rejected and resolves to `index`. This should be corrected by setting the shell default to `trainer` or explicitly supporting the intended route.

## 5. Design System and Color Palette

The shared CSS tokens are defined near the top of `styles.css`. The visual direction is warm, calm, and nature-rooted: a soft near-white surface, deep green brand signals, dark readable text, and pastel accents used to distinguish content types without making every page feel like a separate product.

| Token | Hex | Intended role |
|---|---|---|
| `--ink` | `#2C3E35` | Charcoal/dark-olive body text and supporting copy. |
| `--green-dark` | `#0E4D34` | Deep-forest headings, major containers, navigation, and high-contrast actions. |
| `--green` / `--green-bright` | `#029A5B` | Vibrant-leaf links, icons, active states, and action highlights. |
| `--mint` / `--blue` / `--lilac` | `#E8F6F0` | Shared mint tint for category cards and clean surfaces. |
| `--ochre` | `#EAA822` | Warm cultural highlights and interactive accents. |
| `--terracotta` | `#D34836` | Cultural badges and warm secondary accents. |
| `--paper` / `--cream` | `#F9FBF9` | Shared off-white canvas and section surfaces. |
| `--muted` | `#58675F` | Supporting copy and descriptions. |
| `--line` | `#DDE9E2` | Fine borders and separators. |

Other recurring design choices:

- Deep forest and vibrant leaf greens establish a shared identity across the core site, AI Conversations, family/tutor portals, coding, and heritage experiences.
- White text on primary action buttons uses the deep-forest shade for legible contrast; vibrant leaf green remains the supporting interactive accent.
- The CSS defines soft green-tinted shadows, a 1200px content width, 22px and 30px radius tokens, and shared button, card, pill, section, and navigation styles.
- A light translucent sticky header, breadcrumbs, clear active navigation, compact uppercase section labels, rounded buttons, stepper flows, and repeated card patterns establish a common interaction language.
- Page backgrounds occasionally use gentle radial/linear effects and illustrations/photography; the core visual system remains light and green rather than dark mode.
- The font stack begins with Inter and falls back to system sans-serif families; no web-font package is declared in `package.json`.
- Responsive breakpoints and a mobile quick-navigation mount exist in the shared layout/CSS. Pages share the same base shell and design tokens.

HTML shells use the shared off-white `#F9FBF9` as their browser theme color to match the stylesheet canvas.

## 6. Interaction and Feature Inventory

### Learning and motivation

- Hash-based navigation with route parameters for language/course selections.
- Stepper components to communicate multi-stage learning flows.
- Course levels, lesson cards, answer feedback, saved lesson responses, and completion state.
- Demo points, streaks, badges, lesson scores, and profile progress.
- Local saving of selected stories, proverb contributions, reflections, coding progress, and trainer state.

### Voice and speech

- A separate `src/translationEngine.js` includes a small English-to-Yorùbá/Igbo/Hausa dictionary and word lexicons, browser speech synthesis, and Web Audio tone generation.
- `src/vowelsConsonantsData.js` defines oral vowels, nasal vowels, consonants, and tone examples.
- The actual app's trainer UI and `app.js` contain their own trainer curriculum and event behavior. The shared app imports the translation and sound-reference modules, but the trainer still uses its own lesson data.
- Browser audio and speech support varies by platform and installed voices. Browser speech output should not be described as a verified native recording.

### Coding and STEM

- The interface includes a K-8 curriculum concept, grade-band cards, free lesson search/category/grade filters, IDE-like input/output, and challenge completion feedback.
- `src/yorubaCodeEngine.js` separately defines Yoruba keyword aliases, color words, lesson examples, transpilation, code execution, and a Yoruba-term speech helper.
- `app.js` imports `yorubaCodeEngine.js` and runs the selected African-language interpreter in a sandboxed preview. HTML/CSS/JavaScript use a sandboxed iframe; compiler runtimes call the Vercel API and private Judge0 CE service.
- Compiler execution is not available from a static GitHub Pages deployment. Browser-preview execution is not equivalent to a hardened remote sandbox; production runner resource limits and access restrictions must be configured on Judge0 as well as at the API boundary.
- `app.js` imports the Three.js scene helpers in `src/threeScene.js`; WebGL availability and reduced-motion preferences still determine rendered behavior.

### Culture, stories, and contribution

- Story shelf and story-game comprehension prompt.
- Oríkì and oral-genre introductions that foreground context and attribution.
- Òwe lesson with gated comprehension steps, an original classroom story, and a personal reflection.
- Local proverb contribution form requiring a consent checkbox.
- An offline learning-helper modal that provides fixed topic-specific prompts; it is not connected to an AI service and does not process questions with a model.

### Family and educator flows

- Persona-based account screen and parent-consent states.
- Tutor filters, sample profile modals, code verification, and learner assignment preview.
- Explicit demo labels and warnings where people, schedules, identities, and connections are illustrative rather than real.

## 7. Technical Architecture

### Runtime and build

- Plain HTML entry shells with a shared client-side JavaScript application in `app.js`.
- CSS in `styles.css` provides global tokens, responsive layout, components, and route-specific styling.
- Vite is the development server and multi-page build tool (`npm run dev`, `npm run build`, `npm run preview`).
- `vite.config.ts` enumerates the HTML entry points; production output is written to `dist/`.
- JavaScript package type is ES modules; the main `app.js` imports relevant `src/` feature modules and is bundled by Vite.

### Main project files

| File or folder | Responsibility |
|---|---|
| `app.js` | Main route renderer, shared navigation, app state, event delegation, page markup, modal logic, and most prototype interactions. |
| `styles.css` | Shared palette, typography, layout, page designs, responsive rules, and motion/visual effects. |
| `src/supabaseClient.js` | Supabase Auth integration and data helpers. Auth requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; learning progress continues to use local app state unless separately wired to remote persistence. |
| `api/code/` | Vercel serverless routes for installed-runtime discovery and bounded code execution through a private Judge0 CE service. |
| `supabase_schema.sql` | Proposed PostgreSQL tables, triggers, indexes, and row-level security policies for profiles, progress, code submissions, voice submissions, and community proverbs. |
| `src/translationEngine.js` | Curated exact phrase entries with explicit plain-letter Yoruba forms where available, browser speech synthesis, and tone oscillator; unsupported phrases are not assembled from word substitutions. |
| `src/vowelsConsonantsData.js` | Yoruba vowel, nasal vowel, consonant, and tone reference data. |
| `src/yorubaCodeEngine.js` | Separate Yoruba code keyword map, lesson data, transpiler, and interpreter. |
| `src/threeScene.js` | Separate Three.js scene/visualizer helpers. |
| `assets/` and `public/assets/` | Images, icons, and other static media used by the interface and build. |
| `vite.config.ts` | Multi-page entry list and relative base configuration. |
| `vercel.json` | Deployment-related configuration exists; deployment behavior should be verified against its current contents and hosting setup. |
| `README.md` | Product overview, local setup, IDE/auth environment configuration, and static-host versus Vercel runtime boundaries. |
| `scratch/` | Development experiments, inspection scripts, and redesign/debugging artifacts; not the main runtime product. |

### State and data boundaries

- The main app saves its demo state under the browser key `idilewa-demo-state`.
- Supabase Auth handles configured sign-in/sign-up; the main app's learning state is still stored in browser state unless a feature is explicitly connected to remote persistence.
- The Vercel compiler API uses server-only `JUDGE0_URL` and optional `JUDGE0_AUTH_TOKEN` settings. Keep Judge0 private and enforce execution quotas at the runner as well as at the API boundary.
- `supabase_schema.sql` contains public profile reads (`USING (true)`) and user-scoped policies for several other tables. The schema is a starting point and needs a security review before real child data is stored.
- Local browser state can be edited, cleared, shared on a device, or lost; it is not an identity, consent, or authorization boundary.

## 8. Safeguarding, Accessibility, and Content Quality

### Safeguarding and privacy present in the prototype

- Child-tutor flows require a parent/guardian step and attempt to limit approval to a named tutor.
- The consent view recommends nicknames and tells users not to enter sensitive child details.
- Reflection content is stored locally and warns that other people using the device can see it.
- Tutor/student views explicitly label examples as fictional/sample and state that the prototype does not send messages or create bookings.
- Cultural pages ask learners to consider consent, attribution, and whether knowledge is appropriate to repeat.

### What those safeguards do not provide yet

- Local codes do not verify a guardian's identity or authority and are not securely issued to another device.
- Browser-side role checks can be bypassed; tutor access must be enforced on a trusted backend.
- No production child-account governance, audit trail, secure one-time token service, or reviewed legal/safeguarding process is implemented by the demo UI.
- Do not put real child data, real credentials, or production tutoring decisions into the local prototype.

### Accessibility foundations visible in the shell

- Skip-to-content link, landmark structure, focus-visible outlines, labelled quick navigation, aria-live toast area, and some modal dialog semantics.
- Buttons and links use recognizable action labels; many icon-only controls include accessible labels.
- Responsive layouts and mobile navigation are intended to support smaller screens.

These foundations do not replace a full accessibility audit. Keyboard-only journeys, screen-reader behavior, contrast across pastel cards, reduced-motion handling, focus restoration, and text scaling should be tested end to end.

### Language and cultural content quality

Language examples, tones, translations, pronunciation, cultural descriptions, and the suitability of child-facing material should be reviewed by fluent speakers and relevant community contributors. The code itself marks some voice content as sample and some translations as one common rendering. Those disclosures should be preserved and expanded as content is authored.

## 9. Current Gaps and Highest-Value Next Steps

1. **Fix and test route defaults.** Align `trainer.html` and `voice_lessons.html` with the actual `trainer` route, or add an explicit supported route. Verify that all 36 built entry files land on the intended view when opened directly.
2. **Choose one runtime integration path.** Connect the visible app to the reusable `src/` engines and the Supabase client, or remove/retire unused duplicate modules. At present, those modules are not wired into `app.js`.
3. **Make demo status consistent.** Clearly label fixed dictionary translation, generated speech, simulated scoring, and sample content; avoid implying model-based AI or verified native fluency unless those services exist and have been evaluated.
4. **Complete reviewed language content.** Identify which courses are truly available for each language, then add community-reviewed text, recordings, dialect/context notes, and attribution before advertising equivalent lesson completeness.
5. **Move child consent and tutor access to a secure backend.** Use server-side identity/authority checks, expiring single-use credentials, tutor-specific authorization, audit logs, and a safeguarding/legal review before connecting real users.
6. **Review the Supabase schema and policies.** Confirm least-privilege RLS, child privacy, public profile fields, consent retention, and data deletion/retention behavior before production.
7. **Define real account, progress, and pricing behavior.** Replace demo login, local-only progress, and preview pricing with documented services and truthful UI states, or keep these features clearly marked as concepts.
8. **Strengthen project documentation and automated checks.** Expand `README.md` with setup, environment configuration, architecture, and status; add route smoke tests, keyboard/accessibility checks, and focused behavior tests.

## 10. How to Run and Verify

From the project root:

```powershell
npm install
npm run dev
```

Build the multi-page site with:

```powershell
npm run build
```

The build command was run during this report update and completed successfully. A successful Vite build confirms that the declared HTML entries bundle; it does not validate that every shell opens the intended route, that language examples are accurate, or that authentication and consent are production-secure.

## 11. Bottom Line

Idilewa aims to be a family- and community-centered digital home for African language learning, living cultural knowledge, oral storytelling, and youth technology education. Its strongest product idea is the combination: a learner should be able to hear a phrase, understand its context, meet a story or proverb, practice a skill, and carry the learning into family or classroom life.

The workspace already demonstrates that idea across a large set of pages and interactions. The next phase is to turn the concept into a dependable service: make route behavior consistent, connect or consolidate the existing engines, commission and review authentic learning materials, and move identity, child consent, tutor access, and long-term progress into secure production infrastructure.