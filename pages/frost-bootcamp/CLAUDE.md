# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page marketing site for the Frost bootcamp, built as a static HTML/CSS/JS
page with no build system, no package manager, and no dependencies to install.
The entire page is `index.html`; behaviour lives in `assets/js/main.js`; design
tokens live in `assets/js/tailwind.config.js`.

## Commands

There is no build, lint, or test step. Nothing is compiled — Tailwind runs in the
browser via the Play CDN.

Serve the folder over HTTP rather than opening `index.html` with `file://` (the
self-hosted fonts are preloaded with `crossorigin`, and the CDN behaves better
over http):

```bash
python -m http.server 8000    # then open http://localhost:8000
```

VS Code's Live Server extension works equally well. Any change is picked up on
reload; there is nothing to rebuild.

`python -m http.server` is a poor choice when testing the cohort reel: it is
single-threaded (the 6.5 MB video request blocks every other request) and it
ignores Range requests, which makes Chrome's media loader stall on the video
outright — `readyState` stays at 0 and nothing ever plays. Use Live Server or any
server that answers with `206 Partial Content`.

## Architecture

### Tailwind runs at runtime, and load order is load-bearing

`index.html` head must keep this exact sequence:

1. `<script src="https://cdn.tailwindcss.com">`
2. `<script src="assets/js/tailwind.config.js">` — **plain script, no `defer`, no
   `type="module"`**, so `tailwind.config` is assigned before the CDN generates
   its first stylesheet.
3. `<style type="text/tailwindcss">` — the `@layer` / `@apply` block.

That style block **cannot** be moved into a linked `.css` file. The Play CDN only
compiles `@apply` inside an inline `<style type="text/tailwindcss">`; a linked
file is served as plain CSS and the rules are silently dropped. Moving it out
requires introducing a real Tailwind build step first.

`.vscode/settings.json` disables the "Unknown at rule" CSS lint for the same
reason — the editor's CSS server doesn't understand `@apply`.

### The safelist is not optional

`tailwind.config.js` opens with a `safelist` array. The JIT compiler only sees
classes present in the initial markup, so **every class that `main.js` toggles
must be listed there** or the interactive states (nav underline, track carousel,
accordions, reveals) render unstyled. When adding or changing any
`classList.toggle(...)` in `main.js`, add the class to the safelist in the same
change.

### Design tokens are transcribed from Figma, not invented

Tokens come verbatim from Figma file `pBEFZHOeLXhB2XAfQ7YeYZ`, node `704:627`
("Study 1"). The file has no bound variables, so raw hex values are the source of
truth. Each section in `index.html` is preceded by a banner comment naming its
Figma node and the frame's literal spec, e.g.:

```
TESTIMONIAL — node 704:672 · linear-gradient(to top, #010987, #000)
```

Keep those comments in sync when a section changes, and derive new values from
Figma rather than eyeballing them.

Fluid sizes follow one formula: `clamp(mobile, <figma-px / 1920 * 100>vw, figma-px)`.
The 1920px frame width is also the page's max width (`.shell` caps at `120rem`).

Two consequences of the token setup that regularly trip people up:

- `extend.colors.blue = "#000988"` **replaces Tailwind's entire default blue
  ramp**. `bg-blue-500` and friends do not exist in this project — only `bg-blue`.
  (`blue-lt` `#010987` is a near-identical second stop kept because it is a
  distinct value in the comps.)
- `extend.spacing` adds `gutter` and `block`, which generate the whole spacing
  family: `px-gutter` (the 100px page gutter) and `py-block` (the 150px section
  rhythm) are used on nearly every section.

### Fonts

Aeonik Pro is self-hosted from `assets/fonts/`, wired up in `assets/css/fonts.css`,
and preloaded in the head. It is a single **variable** file: despite its
`-Regular` filename, `AeonikPro-Regular.woff2` carries a `wght` axis over
**100–900**, declared as `font-weight: 100 900`. Any weight utility therefore
works without adding a file, and nothing is ever synthesised. Two things depend
on that range being declared rather than pinned to `400`:

- every `font-*` weight resolves from the one 72 KB file;
- `font-weight` is animatable, which is what lets `.apply-title` interpolate
  400→700 (see the stepper note under Page behaviour).

`AeonikPro-Medium.woff2` and `AeonikPro-Bold.woff2` are still in `assets/fonts/`
but nothing references them — the variable file replaced both. They can be
deleted. No italics are used; a variable italic exists in the source folder if
that changes.

The variable file is metrically near-identical to the statics it replaced —
matching advance widths and vertical metrics — but it carries a much larger
kern-pair set (23,083 vs 9,870) and is a later build, so a few bold strings
render up to ~0.6% narrower than they did on the static files. That is improved
kerning, not a defect; be aware of it if a heading's line breaks ever look
one-word different from an old screenshot.

Note the licensing constraint recorded in `fonts.css`: Aeonik Pro is commercial,
and self-hosting exposes the files publicly, which needs a webfont licence from
CoType Foundry. A desktop licence does not cover this. Publishing the variable
file also exposes the whole 100–900 range rather than three fixed instances,
which some foundries licence separately.

Manrope sits alongside it as a second, separate family — 700 only, latin subset,
reached through its own `font-manrope` utility (`fontFamily.manrope` in the
config) rather than the `sans` stack. It is SIL OFL, so unlike Aeonik it carries
no licensing caveat. The `Manrope` entry inside the `sans` stack is only a
fallback and is never actually reached.

### Page behaviour (`assets/js/main.js`)

One IIFE loaded at the end of `<body>`, so everything it queries already exists.
It covers: mobile drawer, scroll-spy nav, scroll reveal, stat count-up, track
carousel, "how to apply" stepper, FAQ accordion, form validation, and sticky-header
scroll offset.

Conventions worth preserving:

- **ARIA attributes are the state, CSS follows.** `aria-current="true"` drives
  `.track` colour from the inline `@layer components` block; `aria-expanded`
  drives the stepper (both `.apply-title` and, via JS, `.apply-panel`) and the
  FAQ. Styling can't drift out of sync with accessibility state because there is
  only one source of truth.
- **Weight tweens, but the box must not.** Aeonik is loaded as a variable font,
  so `.apply-title` animates `font-weight` 400→700 for real. Interpolating still
  *widens* the text, though, which would shove the description panel for the
  whole 300ms — so `.apply-title` holds a second copy of the label, `.at-bold`,
  pinned at 700 and `visibility: hidden`. It paints nothing and is out of the
  accessibility tree; its only job is to hold the grid cell at bold width while
  `.at-regular` animates inside it. Reuse this shape for any other weight
  transition: animate the visible copy, anchor the box with an invisible one at
  the heavier end.
- **Reduced motion** is read once into `reduced` and gates the reveal animation,
  count-up, and every smooth scroll.
- **Expand/collapse** uses the `grid-rows-[1fr]` / `grid-rows-[0fr]` technique,
  not height animation.
- **The track carousel centres by translating `#track-band`, never by
  scrolling.** Its wrapper is `overflow-hidden` and the band is
  `justify-center`, so the tracks that overflow to the *left* sit at negative
  scrollLeft and are unreachable — `scrollIntoView` can centre the last track
  but never the first. `centreTrack()` therefore sets `transform: translateX()`
  from `offsetLeft`/`offsetWidth`, which are layout values and ignore the
  transform already applied. Keep that absolute: computing a delta from
  `getBoundingClientRect()` reads whatever the 500ms slide is mid-way through
  and drifts on any click that interrupts one. The offset is in pixels, so
  `recentreTrack()` remeasures on resize and once `document.fonts.ready`
  settles.
- `IntersectionObserver` is feature-detected; the fallback path clears the inline
  `opacity` that JS sets on `[data-reveal]` elements, so content never stays
  invisible.
- Content-driven bits read from data attributes: `[data-reveal]`,
  `[data-count]` + `[data-suffix]` (stat count-up), `[data-track]` + `[data-desc]`
  (carousel copy swap).

JS depends on these hooks — renaming them in markup breaks behaviour silently:
`#menu-btn`, `#mobile-nav`, `#pinned-nav .nav-link`, `.track` + `#track-band` +
`#track-desc` + `#track-cta`,
`#apply-steps .apply-step` (with `.apply-panel`; `.apply-title` is
styled from CSS, not queried by JS),
`#faq .faq-trigger` (with `.faq-icon`, `.faq-item`), `#cohort-reel` + `#reel-toggle`
(with `.reel-play` / `.reel-pause`), `#apply-form` + `#form-status` + `#f-why`.

Note `#faqs` is the `<section>` while `#faq` is the inner list `main.js` queries —
they are different elements.

The cohort reel autoplays muted when its panel is 35% into view and pauses on the
way out, and its button hides itself (`opacity-0`) during playback, coming back
via `group-hover:` / `focus-visible:` in the markup — both of those beat
`.opacity-0` on specificity, which is what makes the reveal work. A deliberate
pause is remembered (`userPaused`) so scrolling back in does not restart it.

Form validation is coupled to the field markup shape: `showErr()` walks
`field.closest("div").parentElement` to find the sibling `<p class="err">`. Keep
the `div.flex-col > label + div.border-b > input` + `p.err` nesting when editing
or adding fields. The form does not submit anywhere — it validates and shows a
status message.

## Current state of the page

Five sections plus the footer carry a literal `hidden` class (Your Instructor,
Who Should Join, How To Apply, FAQ, Apply Now, Footer). They are fully built but
toggled off. Removing a `hidden` is how a section goes live; the pinned nav only
links to anchors that are currently visible.

`main.js` is loaded normally at the end of `index.html`. If page interactivity
ever stops working wholesale — drawer, scroll-spy, reveals, count-up, carousel,
accordions, form validation, cohort reel — check that this tag is not commented
out; it spent a while disabled during development.

`index.html.bak` is a pre-Aeonik snapshot that still used Manrope from Google
Fonts. It is a manual backup, not part of the page.
