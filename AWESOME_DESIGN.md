# Ìdíléwa Design System 2.0

The single source of truth for interface work on idilewa.com. It distils the
UI/UX Pro Max, Impeccable and Taste Skill standards into rules that apply to
**this** codebase.

Implementation lives in two places:

| Layer | File |
| --- | --- |
| Tokens, components, motion, responsive rules | `design-system.css` (loaded after the page's inline `<style>`) |
| Interactive behaviour (dropdown, drawer, scroll reveal, slideshow state) | `src/siteNav.js` |

---

## 1. Stack reality (read this first)

Ìdíléwa is a **static HTML/CSS/JS site**: 32 `.html` pages, `app.js` (vanilla
router + renderers), `styles.css`, and Vite only as a bundler. There is **no
React, no JSX, no Tailwind, no Framer Motion, no lucide-react** in
`package.json`.

Every rule below is therefore expressed in vanilla terms:

| Principle | Standard expression (React/Tailwind) | Ìdíléwa expression |
| --- | --- | --- |
| Motion | Framer Motion springs, `layoutId` | CSS `transition` / `@keyframes` with shared easing tokens |
| Icons | `lucide-react` components | Inline `<svg>` in markup, or `mask-image` data-URIs in CSS |
| Tokens | `tailwind.config.js` theme | CSS custom properties in `:root` |
| Variants | `cva` / class maps | BEM-ish `.id-btn--primary` modifiers |
| Stagger | `staggerChildren` | `--id-delay` custom property + `IntersectionObserver` |

Do **not** add React-only packages to this repository. A dependency that no
bundle imports is a bug, not a feature.

---

## 2. Colour tokens

One accent family, one neutral family, one warm paper background. No neon.

| Token | Value | Use |
| --- | --- | --- |
| `--id-forest` | `#14532d` | Primary actions, active states, focus rings |
| `--id-forest-600` | `#166534` | Accent text on light surfaces |
| `--id-emerald-950` | `#052e1c` | Display headlines |
| `--id-cream` | `#faf8f5` | Page background, drawer surface |
| `--id-ivory` | `#fffdfa` | Cards and menus |
| `--id-stone-200` | `#e7e2d9` | Hairline borders |
| `--id-ink` | `#132a1f` | Body copy on light |
| `--id-ink-soft` | `#4c6156` | Secondary copy, inactive nav |
| `--id-clay` | `#b08968` | Reserved for heritage accents only |

Hard rules:

- Maximum **one** accent hue per view. No gradient rainbows, no `#80e52d`-style
  lime glows, no drop shadows in a second hue.
- Elevation uses neutral tinted shadows, never coloured glows.
- Text on tinted surfaces must clear WCAG AA (4.5:1). `--id-ink-soft` on
  `--id-ivory` passes; `--id-stone-300` on white does not — never use stone for
  text.

---

## 3. Typography

- Display: `letter-spacing: -0.028em`, `line-height: 1.03`, weight 700+.
- Body: `line-height: 1.55`, measure capped at `36ch` for hero copy and `64ch`
  for long-form.
- Section eyebrows: `11.5px`, weight 620, `letter-spacing: 0.075em`,
  `text-transform: uppercase`.
- Never centre-align paragraphs longer than one line.
- No decorative all-caps body copy, no letter-spacing on lowercase body text.

---

## 4. Buttons — exactly three tiers

```html
<button class="id-btn id-btn--primary">Get Started <svg class="id-btn__icon">…</svg></button>
<button class="id-btn id-btn--outline">Chat with tutor</button>
<button class="id-btn id-btn--ghost">Sign in</button>
```

| Tier | Class | Semantics |
| --- | --- | --- |
| Primary | `.id-btn--primary` | One per view. Deep forest gradient, inset highlight, lift on hover. |
| Secondary / Outline | `.id-btn--outline` | Adjacent actions. White fill, hairline border, inverts to forest on hover. |
| Tertiary / Ghost | `.id-btn--ghost` | Low-commitment actions (Sign in, filters, dismiss). No border until hover. |

Requirements for every button:

- `min-height: 44px` (touch target), horizontal padding ≥ 16px.
- `:active` scale `0.98`; `:hover` translateY(−1px) at most.
- `:focus-visible` → 2px forest outline with 3px offset.
- Icon-only controls use `.id-icon-btn` + `aria-label`.
- **Zero** raw Unicode arrows (`→`, `›`) or emoji inside buttons and nav links.
  Use `.id-btn__icon` SVG or a `::after` mask.

---

## 5. Navigation

- Sticky, translucent: `rgba(250,248,245,.82)` + `backdrop-filter: blur(14px)`.
- Exactly five primary links: Home, Languages (dropdown), AI Chat, Coding,
  Tutorship. Everything else lives in the drawer.
- Links are text + underline indicator (`::after` scaleX), never pill-shaped.
- Dropdown animates `opacity` + `translateY(-6px) scale(.98)` → `1` with
  `--id-ease-spring`; `aria-expanded` is the single source of truth.
- Drawer is the deliberate secondary navigation at **every** breakpoint:
  5 links (How It Works, Pricing, Explore, Translate & Listen, My Progress) plus
  a Sign in / Get Started footer. It locks body scroll, traps Tab, closes on
  Escape, backdrop click and link activation, and restores focus to the
  trigger.
- Icon-only menu button carries `aria-controls` + `aria-expanded`.

---

## 6. Cards & pills

**Cards** (`.featureTile`, `.tutorCard`)

- Ivory surface, `1px` stone border, `--id-radius-lg` (20px).
- Two-layer shadow: `--id-shadow-ambient` at rest, `--id-shadow-lift` on hover.
- Hover: `translateY(-3px)` + border shifts to `rgba(20,83,45,.2)`. No scale
  beyond `1.01`, no rotation, no glow.
- One quiet affordance in the top-right corner: monochrome arrow mask at 30%
  opacity, 85% on hover.
- Iconography is a 42px tinted chip containing a masked SVG — never an emoji
  glyph at 45px.

**Pills** (`.tutorFilters`)

- Container: `rgba(19,42,31,.045)` track, 999px radius, 5px inset padding.
- Inactive: transparent, `--id-ink-soft`. Active: white surface + soft shadow.
- State is expressed with `aria-pressed`, not a `.active` class alone.
- Transitions are colour/shadow only; pills never jump or resize on select.

---

## 7. Motion specification

| Token | Value | Use |
| --- | --- | --- |
| `--id-dur-fast` | `150ms` | Press feedback |
| `--id-dur` | `240ms` | Hover, colour, hairline morphs |
| `--id-dur-slow` | `520ms` | Drawer slide, entrance reveals |
| `--id-ease` | `cubic-bezier(.32,.72,0,1)` | Most transitions |
| `--id-ease-spring` | `cubic-bezier(.22,1.4,.36,1)` | Drawer and dropdown only |

- Entrances: `opacity 0 → 1` with `translate3d(0,16px,0) → 0`, staggered by
  `--id-delay` (0–3, 70ms apart) and triggered once by `IntersectionObserver`.
- Animate `opacity` and `transform` only. Never animate `width`, `height`,
  `top` or `left` on interactive elements.
- Every transition must have a `prefers-reduced-motion: reduce` escape hatch;
  `design-system.css` already collapses all of them to `1ms`.
- No looping/attention-seeking animation. No parallax. No spinner where a
  skeleton or a static state will do.

---

## 8. Anti-slop rules

Reject any of these in review:

1. Neon or lime gradients, coloured glow shadows, glassmorphism for its own sake.
2. Emoji as UI iconography inside buttons, tiles, nav or alerts.
3. Raw Unicode arrows (`→`, `↗`, `›`) as affordances — use SVG.
4. Developer notes rendered as body copy (stack names, "demo", "placeholder",
   "this is a prototype"). Move them to discreet micro-copy at ≤11.5px with
   0.7 opacity, or delete them.
5. Filler verbs: "Elevate", "Unleash", "Revolutionize", "Seamlessly". Write what
   the product actually does.
6. Centred hero paragraphs, three-column feature grids with stock icons and no
   hierarchy, "Welcome to X" openers.
7. More than one primary button per section.
8. Decorative dividers, tick-marks, sparkles or badges that carry no information.

Voice: warm, specific, unhurried. Yorùbá diacritics must be preserved exactly
(`Ìdíléwa`, `Yorùbá`, `Ẹ káàbọ̀`) — never stripped to ASCII in user-facing copy.

---

## 9. Accessibility checklist

Ship nothing until all are true:

- [ ] Every interactive element is reachable by keyboard and has a visible
      `:focus-visible` ring.
- [ ] Icon-only buttons have `aria-label`; toggles expose `aria-expanded` /
      `aria-pressed`.
- [ ] The drawer is a labelled `role="dialog"` with `aria-modal="true"`, locks
      scroll, traps Tab and restores focus.
- [ ] Text contrast ≥ 4.5:1 (large text ≥ 3:1).
- [ ] Touch targets ≥ 44×44px with ≥ 8px separation.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] Images have `alt`; decorative art uses `alt=""` / `aria-hidden="true"`.
- [ ] Nothing relies on colour alone to communicate state.

---

## 10. Adding things

**New page**

1. Reuse the header markup from `index.html` (`data-id-nav` … `#idDrawer`).
2. Link `design-system.css` after the page's own styles.
3. Load `src/siteNav.js` as a module before `</body>`.
4. Add the route to `vite.config.js` inputs if it is a build entry.

**New button variant** — extend the three tiers instead of inventing a fourth.
If a genuinely new tier is needed, document it here first.

**New icon** — inline `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` in markup, or
add a `--id-i-*` mask variable in `design-system.css` for pseudo-element use.

---

## 11. Verification

```powershell
npm test          # node --test suite: a11y, screens, routes, AI provider contracts, language-lab engine
npm run build     # Vite must exit 0; index CSS ~38 kB, siteNav JS ~3 kB
```

Manual pass before merge: 1440px, 1024px, 768px, 375px; keyboard-only
navigation of the header and drawer; dropdown open/close via Escape; hover and
focus states on all three button tiers; reduced-motion enabled.

