/* Tailwind Play CDN configuration.
   Must load AFTER <script src="https://cdn.tailwindcss.com"> and as a plain
   (non-defer, non-module) script, so `tailwind.config` is set before the CDN
   generates its first stylesheet. */

/* ------------------------------------------------------------------
Design tokens extracted verbatim from Figma node 704:627 "Study 1"
(file pBEFZHOeLXhB2XAfQ7YeYZ). get_variable_defs returned {} — the
file has no bound variables, so raw hex values are the source of truth.
Fluid type: clamp(mobile, <figma-px / 1920 * 100>vw, figma-px).
------------------------------------------------------------------ */
tailwind.config = {
  /* Utilities that only ever appear via JS class toggles. The JIT can't see
 them in the initial markup, so they must be safelisted or the active
 states (track carousel, accordions, nav underline) render unstyled. */
  safelist: [
    "grid-rows-[1fr]",
    "grid-rows-[0fr]",
    "opacity-0",
    "opacity-25",
    "opacity-40",
    "opacity-100",
    "group-hover:opacity-50",
    "font-bold",
    "text-navy",
    "text-black",
    "border-b-4",
    "border-cyan",
    "border-white",
    "rotate-180",
    "translate-y-2",
    "-translate-y-2",
    "rotate-45",
    "-rotate-45",
    "animate-fade-up",
    "hidden",
    "pb-6",
    "pb-8",
    "text-body",
    "text-cyan",
    "transition-opacity",
    "duration-300",
  ],
  theme: {
    extend: {
      colors: {
        cyan: "#00ffff", // nav CTA + submit button
        navy: "#060d2a", // primary dark text
        ink: "#1c2139", // number-tag background
        blue: "#000988", // instructor bg + active track
        "blue-lt": "#010987", // testimonial gradient stop
        coal: "#010104", // footer bg
        off: "#fafafa", // light section bg
        steel: "#828694", // muted label
        smoke: "#676767", // muted display copy
        graphite: "#242424", // track description
        slate: "#71839d", // form label
        deep: "#0a143f", // submit label / step copy
      },
      fontFamily: {
        // Only 700 is shipped — see assets/css/fonts.css before using another weight.
        manrope: ["Manrope", "system-ui", "sans-serif"],
        sans: [
          "Aeonik Pro",
          "Manrope",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }] — all from Figma
        display: [
          "clamp(2.5rem, 10.42vw, 12.5rem)",
          { lineHeight: "0.87", letterSpacing: "-0.03em" },
        ], // 200px / .87 / -6px
        h1: [
          "clamp(2.5rem,  5.21vw,  6.25rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em" },
        ], // 100px / 1.2 / -2px
        h2: [
          "clamp(2.25rem, 4.17vw,  5rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em" },
        ], //  80px / 1.2 / -1.6px
        h3: [
          "clamp(2rem,    3.33vw,  4rem)",
          { lineHeight: "1.2", letterSpacing: "-0.02em" },
        ], //  64px / 1.2 / -1.28px
        stat: [
          "clamp(3rem,    5vw,     6rem)",
          { lineHeight: "normal", letterSpacing: "-0.03em" },
        ], // 96px / -2.88px
        lead: [
          "clamp(1.5rem,  1.67vw,  2rem)",
          { lineHeight: "1.4", letterSpacing: "-0.02em" },
        ], //  32px / 1.4 / -0.64px
        q: [
          "clamp(1.25rem, 1.25vw,  1.5rem)",
          { lineHeight: "1.15", letterSpacing: "-0.02em" },
        ], //  24px / 1.15 / -0.48px
        "stat-l": [
          "clamp(1.25rem, 1.25vw,  1.5rem)",
          { lineHeight: "1.4", letterSpacing: "-0.02em" },
        ], //  24px / 1.4 / -0.48px
        sub: [
          "clamp(1.125rem,1.15vw,  1.375rem)",
          { lineHeight: "1.4", letterSpacing: "-0.02em" },
        ], //  22px / 1.4 / -0.44px
        body: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.02em" }], //  18px / 1.4 / -0.36px
        nav: ["1.125rem", { lineHeight: "1", letterSpacing: "0" }], //  18px / none
        eyebrow: ["1rem", { lineHeight: "1.1", letterSpacing: "0.1em" }], //  16px / 1.1 / 1.6px
        field: ["1rem", { lineHeight: "1" }], //  16px
        flabel: ["0.875rem", { lineHeight: "1" }], //  14px
        hint: ["0.75rem", { lineHeight: "1.5" }], //  12px
      },
      spacing: {
        gutter: "clamp(1.5rem, 5.21vw, 6.25rem)", // 100px page gutter
        block: "clamp(4.5rem, 7.8125vw, 9.375rem)", // 150px section padding
      },
      screens: { "3xl": "1920px" },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
};
