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
and preloaded in the head. Only **400, 500 and 700 are shipped, and no italics** —
using a `font-*` utility outside those weights makes the browser synthesise a fake
one. Add the `@font-face` block *and* the `.woff2` file before introducing a new
weight.

Note the licensing constraint recorded in `fonts.css`: Aeonik Pro is commercial,
and self-hosting exposes the files publicly, which needs a webfont licence from
CoType Foundry. A desktop licence does not cover this.

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
  drives the stepper and FAQ. Styling can't drift out of sync with accessibility
  state because there is only one source of truth.
- **Reduced motion** is read once into `reduced` and gates the reveal animation,
  count-up, and every smooth scroll.
- **Expand/collapse** uses the `grid-rows-[1fr]` / `grid-rows-[0fr]` technique,
  not height animation.
- `IntersectionObserver` is feature-detected; the fallback path clears the inline
  `opacity` that JS sets on `[data-reveal]` elements, so content never stays
  invisible.
- Content-driven bits read from data attributes: `[data-reveal]`,
  `[data-count]` + `[data-suffix]` (stat count-up), `[data-track]` + `[data-desc]`
  (carousel copy swap).

JS depends on these hooks — renaming them in markup breaks behaviour silently:
`#menu-btn`, `#mobile-nav`, `#pinned-nav .nav-link`, `.track` + `#track-desc` +
`#track-cta`, `#apply-steps .apply-step` (with `.apply-title` / `.apply-panel`),
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
