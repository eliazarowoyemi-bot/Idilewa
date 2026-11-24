# Ìdíléwa Responsive Navigation Architecture

This specification covers the responsive web product in this repository and
defines native iOS/Android translations for future clients. Native platform
patterns below are design requirements, not claims that native apps ship here.
The web implementation uses the existing route destinations and preserves
browser history as the source of truth for navigation.

## Information architecture

The persistent mobile bottom navigation keeps four high-frequency destinations:

1. **Learn** — Voice Lessons, the language academy, and lesson paths.
2. **Explore** — heritage, oral stories, AI practice, and discovery. The
   Heritage Library is a focused destination within this path; its age-adapted
   journeys lead, with the searchable catalogue below.
3. **Progress** — learner profile and achievements.
4. **Family** — guardian sign-in, learner setup, and family tasks.

Across phone, tablet, and desktop, the primary header keeps **Home**, **Voice
Lessons**, and **Code** visible on the homepage, shared app shell, and public
content pages. On the homepage, Voice Lessons and Code each have a separate
disclosure control for related destinations, as does Home for About, FAQ, and
Pricing; category labels remain direct links to their corresponding
experiences. Public page headers use the same three destinations. Hamburger
directories keep only destinations not already available from those primary
navigation disclosures, grouped into learning/exploration and family links.
Sign-in and Get Started remain in the header on wide screens and move into the
hamburger menu on narrow screens.

## Breakpoints and page composition

| Viewport | Header and primary navigation | Content / secondary navigation |
| --- | --- | --- |
| Wide web, above 1080px | Persistent top header with the three destinations, grouped disclosures, hamburger, sign-in, and primary CTA | 1280px content max; four-column language, feature, and tutor grids |
| Tablet, 761–1080px | Brand/actions row plus a three-column row of visible destinations; menu opens the full directory | Two-column card grids; preserve selected item and scroll position |
| Mobile, up to 760px | Compact brand/menu row plus a three-column destination row; fixed four-item bottom bar retains safe-area padding | Single-column cards; disclosures wrap labels rather than clipping or overlapping |

Navigation state is derived from the route and query/hash state. Mark exactly
one current destination with `aria-current="page"` when the location maps to a
top-level item. Do not mark unrelated links active. Opening a menu or sheet
must not change the current route.

## Public page header scope

The shared app shell and the Home, About, FAQ, and Pricing content headers keep
the three primary destinations visible at compact and wide widths. Their
hamburger directories omit destinations already exposed by the Home, Voice
Lessons, and Code disclosures, retaining only unique exploration and family
destinations. Checkout, account, AI conversation, and focused editor/workspace
flows keep their streamlined headers.

## Pattern usage matrix

| Pattern | Use and limits | Mobile | Tablet | Web |
| --- | --- | --- | --- | --- |
| Global navigation | Primary product destinations; no more than 6 visible desktop links and 4 persistent mobile tabs | App bar + bottom tab bar | Compact app bar + anchored menu / drawer | Persistent top header; grouped menu, breadcrumbs for deep routes |
| Bottom tab bar | Four high-frequency destinations; 3–5 maximum | Fixed, labelled icons, safe-area inset | Replace with top/side navigation when width allows | Do not show |
| Top tabs | Switch among sibling views in one feature; target 2–5 tabs | Fixed for up to 3; horizontally scrollable above 3 | Fixed when they fit; otherwise scroll | Fixed segmented row when it fits |
| Bottom sheet / drawer | Contextual navigation, filters, quick actions; keep a single task in view | Bottom sheet, peek/half/full snaps when content requires; drag handle and explicit close | Right-side drawer or anchored popover | Popover for compact menus; side drawer for longer grouped navigation |
| Hub and spoke | A dashboard launches independent task flows; no lateral jumps inside a focused setup flow | Hub list/cards → spoke; explicit return to hub | Hub dashboard with split-view detail where space permits | Dashboard grid, breadcrumbs, persistent global navigation |
| Gesture navigation | Convenience only; every gesture has a visible action equivalent | Edge-back follows platform/browser history; swipe-down dismisses a sheet by its handle; horizontal paging only for sibling tabs | Trackpad/touch gestures with visible arrows/back/close | Browser back, keyboard, and visible controls; no custom edge-swipe interception |
| Stack navigation | Parent → detail → sub-detail; preserve parent state on return | Push/pop with a visible back button and retained scroll/form state | Detail pane or stacked routes with back control | Breadcrumbs and browser history, with page titles matching the route |

## Component and interaction specifications

### Global header and tab bar

- Desktop header: warm off-white surface, 1px bottom divider, 1280px inner
  width. Home, Voice Lessons, and Code stay visible beside the brand; grouped
  disclosures and the full-directory menu remain keyboard and touch operable.
- Compact header: brand and hamburger share the first row; the three primary
  destinations occupy a separate row with at least 44px targets. The brand
  remains a link to Home; disclosure and menu controls expose `aria-expanded`.
- Bottom bar: four equal columns (Learn, Explore, Progress, Family), outline
  icons when inactive, filled/stronger icon state when active, and a persistent
  text label. Reserve the bottom safe area with `env(safe-area-inset-bottom)`.
- Badge counts must cap at `99+`; expose the full count in the accessible name.
  Do not add badges until there is a real notification source.
- Minimum target size is 44×44 CSS px on web. Aim for 48×48 dp on Android and
  44×44 pt on iOS; do not shrink tap targets to fit more links.

### Top tabs

- Use only for sibling destinations within one feature, never as a replacement
  for global navigation or a route hierarchy.
- Keep labels short and stable. Provide a visible active underline or filled
  pill and expose selection with tab semantics only when the implementation
  also supports arrow-key movement and associated tab panels.
- For scrollable tabs, keep the active item in view after route changes. Swipes
  may page among tabs, but must not be the only way to change tabs.

### Bottom sheets and contextual menus

- Mobile sheet anatomy: dimmed backdrop, visible drag handle, title, explicit
  close button, scrollable content, and safe-area-aware bottom padding.
- Use peek/half/full snap points only when the workflow benefits from them;
  simple navigation menus should open at the height their content requires.
- The web menu sheet may be dismissed with Escape, its close control, backdrop,
  route selection, or a downward drag on the handle. A drag threshold must not
  intercept scrolling or replace the close control.
- Tablet translates a sheet to a right-side drawer or anchored menu. Desktop
  uses a compact popover or a full-height side drawer for longer navigation.
  In all modes, focus returns to the opener after dismissal.

### Hub-and-spoke and stack flows

- Use the learning dashboard and family portal as hubs. A learner or guardian
  selects a task-focused spoke, and a persistent Home/Back path returns to the
  hub.
- During a focused setup or assessment flow, do not add lateral step links.
  Preserve the selected learner, language, filters, form values, and scroll
  position when returning from a detail view.
- Each deeper level gets a contextual title and a visible Back control. Browser
  Back/Forward must match in-app navigation; do not create a second hidden stack.

## Cross-device translation

| Mobile-first behavior | Tablet adaptation | Desktop web adaptation |
| --- | --- | --- |
| Bottom tabs | Retain only when viewport remains compact; otherwise move destinations to a rail or header | Replace with persistent top navigation and breadcrumbs |
| Bottom sheet | Right drawer or anchored popover | Popover for short menus; side drawer for long workflows |
| Pushed detail screen | Split view when the detail and list remain readable | Breadcrumbs, persistent list/detail panes, and browser history |
| Swipe between sibling tabs | Keep visible tabs and trackpad support | Clickable tabs and keyboard navigation |
| Edge-swipe back | Do not block operating-system gestures | Use browser history and explicit Back links |

## Accessibility and edge cases

- Use landmarks (`header`, labelled `nav`, `main`, `footer`) and a skip link.
  Keep DOM and screen-reader focus order aligned with visual order.
- Use native links for navigation and buttons for actions. Provide visible
  `:focus-visible` styles, Escape dismissal, and focus restoration for overlays.
- Do not add application-menu ARIA roles to ordinary site navigation links.
  Use `aria-expanded` on disclosure buttons and `aria-current` on the active
  page.
- Deep links must open the correct route and section directly. Back/Forward
  restores route, filters, and focused learning detail where the feature
  supports it.
- Prevent focus from escaping modal dialogs; do not trap focus in non-modal
  popovers. Announce loading and route errors through a status region.
- Honor `prefers-reduced-motion`: remove reveal/slide transforms and keep state
  changes immediate. Forced-colors mode must retain a visible active outline.
- Avoid gesture conflicts with OS edge navigation. Gestures are optional
  accelerators and always have visible, keyboard-operable controls.
- On narrow screens, test 320px width, long localized labels, browser zoom, and
  safe-area insets. Keep text wrapping instead of clipping.

## Current implementation notes

- The homepage header, three visible primary destinations, grouped menu,
  feature cards, shared footer, app-shell
  bottom navigation, static-page bottom navigation, and mobile dialog sheet are
  implemented in the web project.
- The app-shell navigation is intentionally hidden in dedicated AI/tutor
  workspaces where a full-height task interface takes priority.
- The responsive web implementation is not a native mobile client. iOS and
  Android details above are translation rules for future native interfaces.
