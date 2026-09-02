/* Page behaviour: mobile drawer, scroll-spy nav, track carousel, accordions,
   scroll-reveal and form validation.
   Loaded at the end of <body> so every element it queries already exists. */

(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Mobile drawer ─────────────────────────────────────────────── */
  const menuBtn = $("#menu-btn"),
    mobileNav = $("#mobile-nav");
  const setMenu = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileNav.classList.toggle("grid-rows-[1fr]", open);
    mobileNav.classList.toggle("grid-rows-[0fr]", !open);
    const [a, b, c] = menuBtn.children;
    a.classList.toggle("translate-y-2", open);
    a.classList.toggle("rotate-45", open);
    b.classList.toggle("opacity-0", open);
    c.classList.toggle("-translate-y-2", open);
    c.classList.toggle("-rotate-45", open);
  };
  menuBtn.addEventListener("click", () =>
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true"),
  );
  $$("#mobile-nav a").forEach((a) =>
    a.addEventListener("click", () => setMenu(false)),
  );

  /* ── Scroll-spy: active nav item (cyan 4px underline, per Figma) ── */
  const links = $$("#pinned-nav .nav-link");
  const targets = links.map((l) => $(l.getAttribute("href"))).filter(Boolean);
  const setActive = (id) =>
    links.forEach((l) => {
      const on = l.getAttribute("href") === "#" + id;
      l.classList.toggle("opacity-40", !on);
      l.classList.toggle("border-b-4", on);
      l.classList.toggle("border-cyan", on);
    });
  setActive("intro");

  if ("IntersectionObserver" in window) {
    const seen = new Map();
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.intersectionRatio));
        const best = [...seen.entries()].sort((a, b) => b[1] - a[1])[0];
        if (best && best[1] > 0) setActive(best[0]);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-100px 0px -50% 0px",
      },
    );
    targets.forEach((t) => spy.observe(t));

    /* ── Reveal on scroll ────────────────────────────────────────── */
    if (!reduced) {
      const reveal = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("animate-fade-up");
            obs.unobserve(e.target);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      $$("[data-reveal]").forEach((el) => {
        el.style.opacity = "0";
        reveal.observe(el);
      });
      document.addEventListener(
        "animationstart",
        (e) => {
          if (e.animationName === "fade-up") e.target.style.opacity = "";
        },
        true,
      );
    } else {
      $$("[data-reveal]").forEach((el) => (el.style.opacity = ""));
    }

    /* ── Stat count-up ───────────────────────────────────────────── */
    if (!reduced) {
      const nf = new Intl.NumberFormat("en-US");
      const counter = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target,
              end = +el.dataset.count,
              suffix = el.dataset.suffix || "";
            const t0 = performance.now(),
              dur = 1400;
            const tick = (now) => {
              const p = Math.min((now - t0) / dur, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              el.textContent = nf.format(Math.round(end * eased)) + suffix;
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.unobserve(el);
          });
        },
        { threshold: 0.6 },
      );
      $$("[data-count]").forEach((el) => counter.observe(el));
    }
  } else {
    $$("[data-reveal]").forEach((el) => (el.style.opacity = ""));
  }

  /* ── Track carousel ──────────────────────────────────────────────
Active track = solid #000988; neighbours = #060d2a @ 10%.
Selecting a track updates the description and CTA label.       */
  const tracks = $$(".track"),
    trackDesc = $("#track-desc"),
    trackCta = $("#track-cta"),
    band = $("#track-band");

  /* Centring translates the band; it does not scroll the wrapper. The wrapper
     is overflow-hidden and the band is justify-center, so whatever overflows to
     the LEFT sits at negative scrollLeft and no amount of scrolling can reach
     it — scrollIntoView can centre the last track but never the first. The
     band already carries transition-transform duration-500 for this. */
  if (reduced) band.style.transition = "none";
  const centreTrack = (btn) => {
    // offsetLeft/offsetWidth are layout positions and ignore transforms, so the
    // result is absolute rather than a delta off the current position. Measuring
    // getBoundingClientRect() here would read whatever the 500ms slide happens
    // to be showing and drift on every click that interrupts one.
    const wrap = band.parentElement,
      centre = btn.offsetLeft - wrap.offsetLeft + btn.offsetWidth / 2;
    band.style.transform = `translateX(${wrap.clientWidth / 2 - centre}px)`;
  };

  const selectTrack = (btn) => {
    tracks.forEach((t) => {
      const on = t === btn;
      on
        ? t.setAttribute("aria-current", "true")
        : t.removeAttribute("aria-current");
    });
    trackDesc.textContent = btn.dataset.desc;
    trackCta.textContent = "Apply for " + btn.dataset.track;
    centreTrack(btn);
  };
  tracks.forEach((t) => t.addEventListener("click", () => selectTrack(t)));

  /* The offset is measured in pixels, so it has to be remeasured whenever the
     band's width changes: on resize, and once the real font has replaced the
     fallback metrics it was first measured against. */
  const recentreTrack = () => {
    const active = tracks.find((t) => t.getAttribute("aria-current") === "true");
    if (active) centreTrack(active);
  };
  addEventListener("resize", recentreTrack);
  if (document.fonts) document.fonts.ready.then(recentreTrack);

  /* ── "How to apply" stepper ──────────────────────────────────── */
  $$("#apply-steps .apply-step").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("#apply-steps .apply-step").forEach((other) => {
        const on = other === btn;
        other.setAttribute("aria-expanded", String(on));
        // .apply-title styling follows aria-expanded in CSS — nothing to do here.
        const panel = $(".apply-panel", other),
          inner = panel.firstElementChild;
        panel.classList.toggle("grid-rows-[1fr]", on);
        panel.classList.toggle("grid-rows-[0fr]", !on);
        inner.classList.toggle("opacity-100", on);
        inner.classList.toggle("opacity-0", !on);
      });
    });
  });

  /* ── FAQ accordion ───────────────────────────────────────────── */
  $$("#faq .faq-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      $$("#faq .faq-trigger").forEach((other) => {
        const on = other === btn && !open;
        other.setAttribute("aria-expanded", String(on));
        const panel = other.parentElement.nextElementSibling;
        panel.classList.toggle("grid-rows-[1fr]", on);
        panel.classList.toggle("grid-rows-[0fr]", !on);
        $(".faq-icon", other).classList.toggle("rotate-180", !on);
        other.closest(".faq-item").classList.toggle("pb-8", on);
        other.closest(".faq-item").classList.toggle("pb-6", !on);
      });
    });
  });

  /* ── Cohort reel ────────────────────────────────
Starts itself once the panel is a third of the way into view and pauses on the
way out, so the 6.5 MB file is never fetched for someone who never scrolls this
far. It has to start muted — no browser allows autoplay with sound — which is
why the sound button stays visible while play/pause only shows on hover.
A deliberate pause wins: once the viewer stops it, scrolling back in won't
start it again.                                                          */
  const reel = $("#cohort-reel"),
    reelBtn = $("#reel-toggle"),
    soundBtn = $("#reel-sound");
  if (reel && reelBtn) {
    const playIcon = $(".reel-play", reelBtn),
      pauseIcon = $(".reel-pause", reelBtn);
    // play() rejects if the browser blocks it; leave the poster up and move on.
    const playReel = () => reel.play().catch(() => {});
    let userPaused = false;

    const syncReel = () => {
      const playing = !reel.paused && !reel.ended;
      playIcon.classList.toggle("hidden", playing);
      pauseIcon.classList.toggle("hidden", !playing);
      reelBtn.setAttribute(
        "aria-label",
        (playing ? "Pause" : "Play") + " cohort reel",
      );
    };

    reelBtn.addEventListener("click", () => {
      userPaused = !reel.paused && !reel.ended;
      if (userPaused) reel.pause();
      else playReel();
    });
    ["play", "pause", "ended"].forEach((e) =>
      reel.addEventListener(e, syncReel),
    );
    syncReel();

    if (soundBtn) {
      const mutedIcon = $(".reel-muted", soundBtn),
        unmutedIcon = $(".reel-unmuted", soundBtn);
      const syncSound = () => {
        mutedIcon.classList.toggle("hidden", !reel.muted);
        unmutedIcon.classList.toggle("hidden", reel.muted);
        soundBtn.setAttribute(
          "aria-label",
          (reel.muted ? "Unmute" : "Mute") + " cohort reel",
        );
      };
      soundBtn.addEventListener("click", () => {
        reel.muted = !reel.muted;
      });
      reel.addEventListener("volumechange", syncSound);
      syncSound();
    }

    /* Threshold stays low because the panel is taller than a short viewport —
   at 0.35 of 989px it still trips on any screen that can show the section. */
    if (!reduced && "IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (!e.isIntersecting) reel.pause();
            else if (!userPaused) playReel();
          }),
        { threshold: 0.35 },
      ).observe(reel);
    }
  }

  /* ── Application form ────────────────────────────────────────── */
  const form = $("#apply-form"),
    status = $("#form-status");
  const showErr = (field, msg) => {
    const wrap = field.closest("div").parentElement,
      err = $(".err", wrap);
    field.closest("div").classList.toggle("border-white", !msg);
    field.closest("div").classList.toggle("border-cyan", !!msg);
    if (!err) return;
    err.textContent = msg || "";
    err.classList.toggle("hidden", !msg);
  };
  const validate = (field) => {
    const v = field.value.trim();
    if (!v) return (showErr(field, "This field is required."), false);
    if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return (showErr(field, "Enter a valid email address."), false);
    if (
      field.type === "url" &&
      !/^([a-z][a-z0-9+.-]*:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(v)
    )
      return (showErr(field, "Enter a valid link."), false);
    return (showErr(field, ""), true);
  };
  const fields = $$("#apply-form [required]");
  fields.forEach((f) => {
    f.addEventListener("blur", () => validate(f));
    f.addEventListener("input", () => {
      if ($(".err", f.closest("div").parentElement)?.textContent) validate(f);
    });
  });

  // Auto-grow the "why" textarea
  const why = $("#f-why");
  why.addEventListener("input", () => {
    why.style.height = "auto";
    why.style.height = why.scrollHeight + "px";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = fields.map(validate).every(Boolean);
    status.classList.remove("opacity-0");
    if (!ok) {
      status.textContent = "Please fix the highlighted fields.";
      status.className = "text-body text-cyan transition-opacity duration-300";
      fields.find((f) => !validate(f))?.focus();
      return;
    }
    status.textContent = "Application received. We’ll be in touch by email.";
    status.className = "text-body text-cyan transition-opacity duration-300";
    form.reset();
    fields.forEach((f) => showErr(f, ""));
  });

  /* ── Smooth-scroll offset for the sticky header ──────────────── */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href") === "#") return;
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const offset = $("header").offsetHeight;
    window.scrollTo({
      top: target.getBoundingClientRect().top + scrollY - offset,
      behavior: reduced ? "auto" : "smooth",
    });
  });
})();
