---
name: ChatUFO
description: Source-first public research interface for a cited UAP document archive.
colors:
  archive-black: "#020506"
  archive-panel: "#050505"
  archive-panel-raised: "#0A0A0A"
  archive-control: "#0D0D10"
  document-ink: "#DCDCDC"
  archive-muted: "#6B7280"
  evidence-cyan: "#7DD3FC"
  warning-red: "#F04438"
  hairline: "#DCDCDC14"
  input-stroke: "#DCDCDC1A"
  evidence-ring: "#7DD3FC73"
  grid-line: "#DCDCDC0A"
typography:
  display:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.04em"
  title:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "0"
  body:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  label:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  none: "0px"
spacing:
  hairline: "1px"
  compact: "4px"
  control: "8px"
  panel: "16px"
  page-x-mobile: "24px"
  page-x-desktop: "40px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.evidence-cyan}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.evidence-cyan}"
    textColor: "{colors.archive-black}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.archive-muted}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  composer-field:
    backgroundColor: "{colors.archive-panel}"
    textColor: "{colors.document-ink}"
    rounded: "{rounded.none}"
    padding: "12px"
  citation-chip:
    backgroundColor: "{colors.archive-control}"
    textColor: "{colors.evidence-cyan}"
    rounded: "{rounded.none}"
    height: "18px"
  hud-nav:
    backgroundColor: "{colors.archive-black}"
    textColor: "{colors.archive-muted}"
    rounded: "{rounded.none}"
    height: "56px"
---

# Design System: ChatUFO

## 1. Overview

**Creative North Star: "The Public Reading Terminal"**

ChatUFO should feel like a credible public archive wired into a direct query terminal. The system keeps the existing dark, monochrome, cyan, grid, HUD, and page-preview language, but the craft standard is cleaner than a novelty terminal. The documents are the visual material; the interface is the instrument around them.

The product register is restrained. Users are not here to admire an AI assistant or a themed sci-fi site. They are here to ask, scan, inspect, and verify. Every surface should make the next source action obvious: search the archive, open the document, inspect the cited page, read the transcript, or narrow the scope.

The system explicitly rejects generic SaaS AI chat and conspiracy-site spectacle. No glossy assistant avatars, gradient dashboard polish, alien-fantasy dramatics, panic colors, or claims beyond the corpus. Curiosity is allowed; sensationalism is forbidden.

**Key Characteristics:**
- Source-first: citations, page images, snippets, and metadata stay close to every answer.
- Terminal-disciplined: square controls, mono type, uppercase labels, bracketed values, and tight HUD states.
- Flat and inspectable: depth comes from hairlines, panels, alpha states, and document imagery, not decorative shadows.
- Restrained cyan: cyan marks evidence, action, focus, and selection only.
- Atmosphere under control: scanlines, grain, CRT roll, and carousel motion must never fight readability.

## 2. Colors

The palette is a near-black archive field, cool gray document ink, and one cyan evidence color used with restraint.

### Primary
- **Evidence Cyan**: the action and verification color. Use it for active navigation, primary CTAs, citation chips, crop marks, focus borders, selected source cards, command prompts, and active progress ticks. It should appear rarely enough that it reads as evidence, not decoration.

### Secondary
- **Warning Red**: destructive or error state only. It is not a brand accent and must not be used for mystery, urgency, or drama.

### Neutral
- **Archive Black**: the app background and terminal field. It currently maps to the live root background and should stay visually black.
- **Archive Panel**: the main panel and popover surface. Use it for command menus, source rails, composer backgrounds, and preview sidebars.
- **Archive Panel Raised**: subtle layer above the background for muted content blocks, empty states, and skeletons.
- **Archive Control**: secondary control fill for shadcn-derived inputs, tabs, dialog footers, and muted interactive panels.
- **Document Ink**: primary text color. It should read like lit paper on a dark table, not pure white.
- **Archive Muted**: secondary labels, timestamps, metadata, inactive navigation, helper text, and low-priority statuses.
- **Hairline**: the default divider and frame stroke. It is intentionally faint.
- **Input Stroke**: the slightly stronger stroke for input surfaces and disabled state backgrounds.
- **Evidence Ring**: cyan focus and active-state ring color.
- **Grid Line**: faint pixel grid and atmospheric structure.

### Named Rules

**The One Cyan Rule.** Evidence Cyan is the only saturated brand color in normal product screens. If a new feature needs more color, it must be semantic data or a true error/warning/success state.

**The Page Is The Color Rule.** Document thumbnails, page scans, redactions, and transcripts provide most visual richness. Do not compensate with decorative gradients, loud charts, or illustration.

**The No Drama Rule.** Warning Red is reserved for errors and destructive states. Never use red to imply danger, cover-up, alert, disclosure, or conspiracy.

## 3. Typography

**Display Font:** Geist Mono, with ui-monospace, SF Mono, Menlo, monospace fallbacks.
**Body Font:** Geist Mono, with the same fallbacks.
**Label/Mono Font:** Geist Mono.

**Character:** The type system is mono-forward and archival. It should feel like file indexes, terminal prompts, timestamps, and source labels, while keeping long answers and transcripts readable enough for public use.

### Hierarchy
- **Display** (400, 48px, 1.05 line-height): large page headers such as archive and about pages. Use sparingly and keep line breaks deliberate.
- **Headline** (400, 24-30px, 1.15-1.2 line-height): chat empty states, home claims, and major page section headings.
- **Title** (400, 14px, 1.75 line-height): answer text, document summaries, and table titles when the user is reading.
- **Body** (400, 12-13px, 1.7 line-height): transcripts, cited snippets, page summaries, about copy, and document detail prose. Cap prose-heavy blocks around 65-75ch.
- **Label** (400, 9-11px, 0.16-0.24em letter spacing, uppercase): HUD labels, nav, filters, metadata rows, counters, table headers, status badges, and command items.

### Named Rules

**The Reading Override Rule.** Archive labels can be uppercase and spaced out. Answers, transcripts, summaries, and snippets must return to normal-case rhythm when readability matters.

**The Mono Discipline Rule.** Use one family. Do not introduce a friendly SaaS sans, a sci-fi display face, or a newspaper serif unless the entire product direction is deliberately reset.

## 4. Elevation

ChatUFO is flat by default. Depth is conveyed through hairline borders, panel contrast, alpha fills, sticky HUD bars, page imagery, crop marks, and selected states. Shadows appear only in imported overlay primitives such as dialogs and dropdowns; product surfaces should not gain decorative shadow stacks.

### Shadow Vocabulary
- **Cyan Focus Glow** (`inset 0 0 0 1px rgba(125, 211, 252, 0.4), 0 0 24px -8px rgba(125, 211, 252, 0.5)`): reserved for strong focus, active inspection, or selected evidence moments. Use sparingly.
- **Overlay Shadow** (`shadow-md` to `shadow-lg` in Base UI overlays): permitted for command menus, dialogs, dropdowns, and sheets where separation from the page is required.

### Named Rules

**The Flat Archive Rule.** Tables, rails, document cards, empty states, and page grids stay flat at rest. Use a border or a slightly different panel fill before reaching for a shadow.

**The Overlay Exception Rule.** Shadows are allowed when a layer floats above the current task, such as command search or a dialog. They are not a general card style.

## 5. Components

### Buttons

Buttons feel like terminal commands: square, mono, uppercase, bordered, and quiet until acted on.

- **Shape:** square corners (0px). The global product shell overrides rounded inputs and buttons.
- **Primary:** transparent background, Evidence Cyan text and border, uppercase label, 10-11px text, 0.18-0.22em tracking, 8-12px vertical padding, 16-24px horizontal padding.
- **Hover / Focus:** fill with Evidence Cyan and switch text to Archive Black on hover. Focus uses Evidence Ring or a cyan border, not animation-heavy glow.
- **Secondary / Ghost:** transparent background, Hairline border, Archive Muted text, hover to Document Ink with a stronger border. Secondary actions should never look equally loud.
- **Busy:** invert to Document Ink border and foreground with a clear STOP label, as in the chat composer.

### Chips

Chips are evidence markers, not decorative pills.

- **Style:** square or visually square, compact height around 18-24px, mono 9-10px, bracketed or numbered when they represent sources.
- **State:** citation chips use Evidence Cyan on a low-alpha panel fill. Selected source cards use a full cyan border and a faint cyan background, not a color wash.

### Cards / Containers

Containers are frames, not cards in the SaaS sense.

- **Corner Style:** square corners (0px).
- **Background:** Archive Black for the page, Archive Panel for rails and previews, Archive Panel Raised for minor layer separation.
- **Shadow Strategy:** flat by default. Use Hairline borders, divide-y rows, border-y table headers, and alpha fills.
- **Border:** Hairline is the default. Use Evidence Cyan only for current selection, focus, crop marks, and primary action frames.
- **Internal Padding:** compact panels use 12-16px. Page sections use 24px mobile and 40px desktop horizontal rhythm.

### Inputs / Fields

Inputs look like command lines and archive filters.

- **Style:** transparent or low-alpha Archive Panel, Hairline or Input Stroke border, square corners, mono text.
- **Focus:** border shifts to Evidence Cyan. Composer fields can slightly raise panel opacity on focus.
- **Error / Disabled:** error uses Warning Red with low-alpha fill. Disabled states use opacity and muted foreground, never a different hue.

### Navigation

The HUD is sticky, compact, and status-oriented.

- **Style:** 56px top bar, 40px footer, Hairline dividers, background at roughly 85% opacity with backdrop blur only on the top HUD.
- **Typography:** 10px uppercase mono with 0.2em tracking.
- **Default / Hover / Active:** inactive links use Archive Muted, hover uses Document Ink, active uses Evidence Cyan with a leading `>` prompt.
- **Mobile Treatment:** preserve the central task actions first: Chat, Archive, About, command search. Hide secondary coordinate/status text before shrinking labels.

### Signature Component: Source Preview Rail

The source rail is the trust surface. Each source card combines a page thumbnail, numbered marker, page number, document title, and snippet. Active state uses Evidence Cyan border plus a faint cyan fill. The rail should stay visually denser than a marketing card grid because its job is verification, not promotion.

### Signature Component: Document Page Tile

Page tiles are framed scans. Use aspect ratio 3:4, object-top image fit, Hairline border, subtle opacity changes, and page/classification labels over the scan. Avoid decorative overlays that obscure the original document.

### Signature Component: Command Palette

The command palette is the fast path across the archive. It can use an overlay shadow, compact grouped rows, uppercase labels, and a search input. It must stay utilitarian: no modal hero copy, no assistant personality, no empty promotional language.

## 6. Do's and Don'ts

### Do:

- **Do** keep the interface credible and source-first: every generated answer should make citations, source pages, and document context easy to inspect.
- **Do** use Evidence Cyan for active navigation, primary action, focus, selected evidence, citation chips, and crop marks.
- **Do** keep document imagery prominent. Page scans, thumbnails, transcripts, snippets, and metadata are the system's most important visual assets.
- **Do** preserve the current terminal/archive identity, but refine noisy areas when they affect comprehension.
- **Do** respect WCAG AA, visible focus states, keyboard navigation, readable long text, and reduced-motion preferences.
- **Do** use square corners and hairline borders for the product shell.
- **Do** make empty states practical: say what is missing and what action fixes it, such as running ingest or adjusting filters.

### Don't:

- **Don't** make ChatUFO feel like a generic SaaS AI chat product. Avoid glossy assistant branding, padded marketing cards, soft gradient dashboards, oversized testimonial-style claims, and vague productivity language.
- **Don't** make it feel like a conspiracy site. Avoid sensationalism, alien-fantasy imagery, fear cues, dramatic red-alert styling, paranormal theatrics, and copy that implies conclusions the archive does not prove.
- **Don't** overplay the terminal aesthetic until it becomes a gimmick. HUD language should support orientation, source inspection, and archive navigation.
- **Don't** add decorative gradients, gradient text, glassmorphism, bokeh, or soft orb backgrounds.
- **Don't** use new colored side stripes on cards, list items, callouts, or alerts. Use full hairline frames, crop marks, labels, or background tint instead.
- **Don't** use heavy shadows on archive surfaces. Save elevation for true overlays.
- **Don't** introduce multiple accent colors for inactive states. Color means evidence, action, focus, selection, or real semantic state.
- **Don't** let scanlines, CRT roll, grain, blinking cursors, or carousel motion interfere with reading or source verification.
