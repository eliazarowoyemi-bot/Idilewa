# Ìdíléwa Design System

## Surface and intent

Ìdíléwa is a responsive language-learning and cultural learning platform for
learners, families, and educators. The homepage is a **Persuade** surface:
introduce the learning promise, establish cultural warmth, and lead visitors
into a useful first action. Learning, family, and educator routes are
**Operate** surfaces: prioritise clarity, repeatable controls, and preserved
task state.

The visual direction is warm, calm, editorial, and rooted in the existing
forest-and-sage brand. Use real project artwork and language-specific content;
do not add ornamental cultural symbols that are not grounded in the content.

## Tokens

The homepage tokens live in `design-system.css`; the app shell and static-page
tokens live in `styles.css` and `styles/site-footer.css`.

| Purpose | Token / value |
| --- | --- |
| Forest / primary | `#1B4332` |
| Forest hover | `#122E22` |
| Leaf accent | `#2D8A4E` |
| Ink | `#112A20` |
| Muted text | `#4A5D54` |
| Page surface | `#F9FAF8` |
| Sage gradient | `#DCE8DC` to `#C8DEC9` |
| Border | `#E2E8E4` |
| Sans family | Plus Jakarta Sans Variable, with system sans fallbacks |
| Content width | `1280px` maximum |
| Card radius | `20px` |
| Control radius | `9999px` |
| Motion | `150ms` fast, `240ms` standard, `520ms` reveal; disable transforms and transitions for reduced motion |

Plus Jakarta Sans Variable is bundled locally with Fontsource, so the common
font does not require a third-party font request. Keep weights in the
400–800 range and use the shared family token rather than adding page-specific
font stacks.

## Type hierarchy

- **Eyebrow / pill:** 11–12px, weight 700, uppercase, `0.08em` letter spacing,
  forest or leaf green.
- **Homepage H1:** 48–56px at desktop, weight 800, line-height 1.1, tracking
  `-0.02em`; scale down to 36–48px on mobile.
- **Section H2:** 28–32px, weight 700, line-height 1.2.
- **Card H3:** 18–20px, weight 700, line-height 1.25.
- **Body / supporting text:** 15–16px, weight 400–500, line-height 1.5.
- **Utility labels:** 11–14px with clear contrast and no reliance on color alone.

## Component hierarchy and rules

1. **Global shell:** one brand lockup, one primary navigation landmark, one
   active location, and one shared mobile destination bar. Reuse the homepage
   brand asset rather than creating page-specific marks.
2. **Primary actions:** forest fill, white bold label, pill radius, at least
   48px high, with a restrained right arrow when it communicates forward
   progress. Hover darkens and lifts subtly; disabled controls remain visibly
   disabled and do not animate.
3. **Secondary actions:** white or warm-neutral fill, forest label, soft border,
   same 48px height as a paired primary action. Card actions may use a 40px
   minimum when the surrounding card provides adequate separation.
4. **Cards:** white or muted pastel surfaces, 1px soft border, 20px radius,
   consistent 20px grid gap. Language cards use centered 48px artwork, title,
   and short description. Learning-mode cards use a 120px square thumbnail and
   a 36px circular action badge. Tutor cards use a 72px circular portrait and
   a full-width action.
5. **Status and selection:** pair color with text, shape, underline, or icon.
   The selected language, tab, and navigation destination must be exposed
   programmatically as well as visually.

## Homepage and responsive layout

- The top bar is 80px high on desktop, with an off-white surface, thin divider,
  centered 1280px content width, brand at left, navigation in the center, and
  sign-in plus a primary action at right.
- The hero is a two-column 55/45 layout in a sage gradient with a 24px radius.
  Keep the language pill, short headline, concise value proposition, and paired
  actions in the copy column. Center the supplied children-and-device artwork
  in the other column; do not retain decorative captions that compete with it.
- Language and learning-mode grids use four columns on wide screens, two
  columns at tablet widths, and one column on narrow mobile screens.
- Tutor cards use four / two / one columns at the same breakpoints.
- Constrain long-form content to the common 1280px maximum and keep page
  gutters fluid rather than adding horizontal scrolling.
- Feature artwork is meaningful only when it has descriptive alt text. Purely
  decorative thumbnails use empty alt text and are hidden from assistive
  technology.

## Navigation

The complete cross-device pattern matrix, interaction rules, and native
iOS/Android translation are specified in [NAVIGATION.md](./NAVIGATION.md).

## Shared account dialog

Parent, tutor, and child-profile entry points use one responsive native dialog.
The lamp illustration keeps its articulated arm, glow, and pull-cord interaction
while using the forest-and-sage palette; the account form remains available
without requiring animation. Parent signup supports password and Google
registration when the provider is enabled. Tutor authentication continues
through the existing role-aware account services. Child profiles are created
only inside a verified parent session and remain inactive until guardian consent
is confirmed. On narrow screens the illustration sits above a single-column,
scrollable form; at wide screens it shares the dialog with the form.
