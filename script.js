/* =====================================================================
   Savoia Collection — interaction & motion layer
   Stack: GSAP 3 + ScrollTrigger + Lenis (loaded from CDN, see index.html).
   If the libraries are unavailable, or the visitor prefers reduced
   motion, the page falls back to the original lightweight behaviour.
   ===================================================================== */
(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector("[data-header]");
  const counters = document.querySelectorAll("[data-count]");
  const contactForm = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const portfolioItems = [...document.querySelectorAll(".portfolio-item")];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const motion = hasGSAP && !reduceMotion;
  const gsap = window.gsap;

  let lenis = null;

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */

  // Splits an element's text into masked words (and optionally chars).
  // The original text stays available to assistive tech via .sr-only.
  function split(el, { chars = false, mask = true } = {}) {
    if (!el || el._split) return el ? el._split : { words: [], chars: [] };
    const text = el.textContent.replace(/\s+/g, " ").trim();
    const words = [];
    const charNodes = [];

    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;

    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    text.split(" ").forEach((word, i, all) => {
      const inner = document.createElement("span");
      inner.className = mask ? "split-word__inner" : "split-plain";

      if (chars) {
        [...word].forEach((c) => {
          const ch = document.createElement("span");
          ch.className = "split-char";
          ch.textContent = c;
          inner.append(ch);
          charNodes.push(ch);
        });
      } else {
        inner.textContent = word;
      }

      if (mask) {
        const outer = document.createElement("span");
        outer.className = "split-word";
        outer.append(inner);
        visual.append(outer);
      } else {
        visual.append(inner);
      }
      if (i < all.length - 1) visual.append(" ");
      words.push(inner);
    });

    el.textContent = "";
    el.append(sr, visual);
    el._split = { words, chars: charNodes };
    return el._split;
  }

  function animateCounter(counter) {
    const target = Number(counter.dataset.count);
    const duration = 1600;
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      counter.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  /* ------------------------------------------------------------------
     Markup enhancements (safe with or without motion)
     ------------------------------------------------------------------ */

  // Rolling text for the navigation links
  document.querySelectorAll(".site-nav a, .site-footer a").forEach((link) => {
    const label = link.textContent.trim();
    if (!link.hasAttribute("aria-label")) link.setAttribute("aria-label", label);
    link.innerHTML = `<span class="roll"><span class="roll__inner"><span>${label}</span><span aria-hidden="true">${label}</span></span></span>`;
  });

  // Animated underline for form fields
  contactForm.querySelectorAll("input, select, textarea").forEach((field) => {
    const line = document.createElement("span");
    line.className = "field-line";
    line.setAttribute("aria-hidden", "true");
    field.after(line);
  });

  // In-page anchors: smooth scroll (Lenis when active) without breaking URLs/history
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (hash === "#") return;
      const target = hash === "#top" ? 0 : document.querySelector(hash);
      if (target === null) return; // unknown anchor: let the browser behave as before
      event.preventDefault();
      scrollToTarget(target);
      if (location.hash !== hash) history.pushState(null, "", hash);
      if (target !== 0) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });

  /* ------------------------------------------------------------------
     Contact form (original behaviour preserved)
     ------------------------------------------------------------------ */
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get("name").toString().trim();
    formStatus.textContent = `${name}, richiesta ricevuta. Ti contatteremo con una shortlist riservata.`;
    contactForm.reset();
    if (motion) {
      gsap.fromTo(formStatus, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out" });
    }
  });

  /* ------------------------------------------------------------------
     Portfolio accordion
     ------------------------------------------------------------------ */
  function setOpen(item, open) {
    const summary = item.querySelector(".portfolio-item__summary");
    const panel = item.querySelector(".portfolio-item__expanded");
    if (!panel) return;

    item.classList.toggle("is-open", open);
    summary.setAttribute("aria-expanded", String(open));
    summary.dataset.cursorLabel = open ? "Close" : "Open";

    if (open) {
      // make sure the visible slide (and the next one) are fetched now
      const imgs = item.querySelectorAll(".portfolio-carousel__track img");
      [imgs[0], imgs[1]].forEach((img) => img && (img.loading = "eager"));
    }

    if (!motion) {
      panel.style.height = open ? "auto" : "0px";
      return;
    }

    gsap.killTweensOf(panel);
    const inner = panel.querySelector(".portfolio-item__expanded-inner");
    const textBits = inner.querySelectorAll(".portfolio-item__text p, .portfolio-item__text li");
    const carousel = inner.querySelector(".portfolio-carousel");

    if (open) {
      gsap.fromTo(
        panel,
        { height: panel.offsetHeight },
        {
          height: "auto",
          duration: 1.1,
          ease: "expo.inOut",
          onComplete: () => {
            ScrollTrigger.refresh();
            const rect = item.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
              scrollToTarget(item);
            }
          },
        }
      );
      gsap.fromTo(
        textBits,
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.06, delay: 0.35, ease: "expo.out" }
      );
      gsap.fromTo(
        carousel,
        { clipPath: "inset(0% 0% 100% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, delay: 0.25, ease: "expo.inOut", clearProps: "clipPath" }
      );
      gsap.fromTo(
        carousel.querySelector("img.is-active"),
        { scale: 1.25 },
        { scale: 1, duration: 1.8, delay: 0.25, ease: "expo.out", clearProps: "transform" }
      );
    } else {
      gsap.to(panel, {
        height: 0,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => ScrollTrigger.refresh(),
      });
    }
  }

  portfolioItems.forEach((item, index) => {
    const summary = item.querySelector(".portfolio-item__summary");
    const panel = item.querySelector(".portfolio-item__expanded");

    // The summary row becomes the accessible toggle
    item.removeAttribute("tabindex");
    panel.id = panel.id || `residence-panel-${index + 1}`;
    summary.setAttribute("role", "button");
    summary.setAttribute("tabindex", "0");
    summary.setAttribute("aria-expanded", "false");
    summary.setAttribute("aria-controls", panel.id);
    summary.dataset.cursorLabel = "Open";

    const toggle = document.createElement("span");
    toggle.className = "portfolio-item__toggle";
    toggle.setAttribute("aria-hidden", "true");
    item.append(toggle);

    const toggleItem = () => {
      const willOpen = !item.classList.contains("is-open");
      portfolioItems.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) setOpen(other, false);
      });
      setOpen(item, willOpen);
    };

    summary.addEventListener("click", toggleItem);
    toggle.addEventListener("click", toggleItem);
    summary.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleItem();
    });
  });

  /* ------------------------------------------------------------------
     Carousels: buttons + swipe/drag + keyboard, clip-path transitions
     ------------------------------------------------------------------ */
  document.querySelectorAll("[data-carousel]").forEach((carousel) => {
    const track = carousel.querySelector(".portfolio-carousel__track");
    const images = [...carousel.querySelectorAll("img")];
    const previousButton = carousel.querySelector(".portfolio-carousel__button--prev");
    const nextButton = carousel.querySelector(".portfolio-carousel__button--next");
    if (!images.length || !previousButton || !nextButton) return;

    let activeIndex = 0;
    const pad = (n) => String(n).padStart(2, "0");

    const meta = document.createElement("div");
    meta.className = "portfolio-carousel__meta";
    meta.setAttribute("aria-hidden", "true");
    meta.innerHTML = `<span data-current>01</span><span class="portfolio-carousel__bar"><i></i></span><span>${pad(images.length)}</span>`;
    carousel.append(meta);
    const current = meta.querySelector("[data-current]");
    const bar = meta.querySelector(".portfolio-carousel__bar");

    track.dataset.cursorLabel = "Drag";

    function updateMeta() {
      current.textContent = pad(activeIndex + 1);
      bar.style.setProperty("--progress", (activeIndex + 1) / images.length);
    }
    updateMeta();

    function showImage(index, direction) {
      const previous = images[activeIndex];
      activeIndex = (index + images.length) % images.length;
      const next = images[activeIndex];
      if (next === previous) return;
      next.loading = "eager";
      const neighbour = images[(activeIndex + direction + images.length) % images.length];
      if (neighbour) neighbour.loading = "eager";

      if (motion) {
        gsap.killTweensOf(images);
        gsap.set(images, { clearProps: "clipPath,transform,zIndex" });
        gsap.set(previous, { clipPath: "inset(0% 0% 0% 0%)", zIndex: 1 });
        gsap.to(previous, { xPercent: direction > 0 ? -14 : 14, duration: 1.2, ease: "expo.inOut" });
        gsap.fromTo(
          next,
          {
            clipPath: direction > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
            xPercent: direction > 0 ? 12 : -12,
            scale: 1.12,
            zIndex: 2,
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            xPercent: 0,
            scale: 1,
            duration: 1.2,
            ease: "expo.inOut",
            onComplete: () => gsap.set(images, { clearProps: "clipPath,transform,zIndex" }),
          }
        );
      }

      previous.classList.remove("is-active");
      next.classList.add("is-active");
      updateMeta();
    }

    previousButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showImage(activeIndex - 1, -1);
    });

    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      showImage(activeIndex + 1, 1);
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") showImage(activeIndex - 1, -1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1, 1);
    });

    // swipe (touch) and drag (mouse)
    let startX = null;
    track.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
    });
    window.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const delta = event.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 40) return;
      showImage(activeIndex + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
    });
    track.addEventListener("pointercancel", () => {
      startX = null;
    });
  });

  /* ------------------------------------------------------------------
     Fallback (no GSAP, or reduced motion): original reveal + counters
     ------------------------------------------------------------------ */
  if (!motion) {
    root.classList.remove("is-loading");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.14 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (reduceMotion) entry.target.textContent = entry.target.dataset.count;
          else animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));
    return;
  }

  /* ==================================================================
     MOTION MODE
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("has-motion");

  /* --- Smooth scroll ------------------------------------------------ */
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* --- Header: hide on scroll down, reveal on scroll up ------------ */
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      const goingDown = y > lastY;
      header.classList.toggle("is-hidden", goingDown && y > window.innerHeight * 0.6);
      lastY = y;
    },
  });

  /* --- Scroll progress --------------------------------------------- */
  const progress = document.querySelector("[data-progress]");
  const setProgress = gsap.quickSetter(progress, "scaleX");
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => setProgress(self.progress),
  });

  /* --- Section indicator (hero dots, now fixed) -------------------- */
  const dotsWrap = document.querySelector(".hero__dots");
  const dots = [...dotsWrap.children];
  document.body.append(dotsWrap);
  [".hero", "#gallery", ".portfolio", "#contact"].forEach((selector, i) => {
    const section = document.querySelector(selector);
    if (!section || !dots[i]) return;
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (!self.isActive) return;
        dots.forEach((d, j) => d.classList.toggle("is-active", j === i));
      },
    });
  });
  dots[0].classList.add("is-active");

  /* --- Intro + hero entrance --------------------------------------- */
  const intro = document.querySelector("[data-intro]");
  const introBrand = intro.querySelector(".intro__brand");
  const introLine = intro.querySelector(".intro__line");
  const hero = document.querySelector(".hero");
  const heroMedia = hero.querySelector(".hero__media");
  const heroLines = [...hero.querySelectorAll(".hero__title > span")];
  const heroChars = heroLines.flatMap((line) => split(line, { chars: true }).chars);
  const amenitiesLabel = hero.querySelector(".amenities__label");
  const amenitiesLine = hero.querySelector(".amenities__line");
  const amenitiesWords = split(amenitiesLine, { mask: false }).words;
  const brandChars = split(introBrand, { chars: true }).chars;

  root.classList.add("intro-running");
  root.classList.remove("is-loading");
  if (lenis) lenis.stop();

  gsap.set(heroChars, { yPercent: 115 });
  gsap.set([header.children, amenitiesLabel], { opacity: 0, y: -14 });
  gsap.set(dots, { scale: 0 });

  // Wait (briefly) for the hero image so the curtain never opens on an empty frame
  const heroImageReady = new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = "assets/img/ville/02_Ville.jpg";
    if (img.complete) resolve();
    setTimeout(resolve, 1400);
  });

  const introIn = gsap
    .timeline({ defaults: { ease: "expo.out" } })
    .from(brandChars, { yPercent: 110, duration: 0.8, stagger: 0.04 })
    .to(introLine, { scaleX: 1, duration: 0.7, ease: "expo.inOut" }, 0.1);

  Promise.all([introIn.then(), heroImageReady]).then(() => {
    gsap
      .timeline({
        defaults: { ease: "expo.out" },
        onComplete: () => {
          root.classList.remove("intro-running");
          intro.remove();
          gsap.set(header.children, { clearProps: "transform,opacity" });
        },
      })
      .to(brandChars, { yPercent: -110, duration: 0.5, stagger: 0.02, ease: "power3.in" })
      .to(introLine, { scaleX: 0, transformOrigin: "right", duration: 0.5, ease: "power3.in" }, "<")
      .to(intro, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.15")
      .add(() => lenis && lenis.start(), "-=0.5")
      .fromTo(heroMedia, { scale: 1.32 }, { scale: 1.02, duration: 2.4 }, "<0.15")
      .to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.03 }, "<0.35")
      .to(header.children, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, "<0.3")
      .to(dots, { scale: 1, duration: 0.8, stagger: 0.06 }, "<")
      .to(amenitiesLabel, { opacity: 1, y: 0, duration: 1.1 }, "<0.1");
  });

  /* --- Responsive scroll choreography ------------------------------ */
  const mm = gsap.matchMedia();

  mm.add(
    {
      desktop: "(min-width: 981px)",
      mobile: "(max-width: 980px)",
    },
    (ctx) => {
      const { desktop } = ctx.conditions;

      // HERO — parallax image, title lines drift apart, shade deepens
      gsap.to(heroMedia, {
        yPercent: desktop ? 16 : 8,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
      });

      if (desktop) {
        heroLines.forEach((line, i) => {
          gsap.to(line, {
            x: () => (i === 0 ? -1 : 1) * window.innerWidth * 0.07,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: true, invalidateOnRefresh: true },
          });
        });
      }

      // Amenities line — word by word "ink" reveal tied to scroll
      gsap.fromTo(
        amenitiesWords,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: amenitiesLine, start: "top 88%", end: "bottom 50%", scrub: true },
        }
      );

      // Stats — rise in, then count
      const stats = hero.querySelectorAll(".hero__stats article");
      gsap.from(stats, {
        y: 70,
        opacity: 0,
        duration: 1.4,
        stagger: 0.12,
        ease: "expo.out",
        scrollTrigger: { trigger: ".hero__stats", start: "top 88%", once: true },
      });
      counters.forEach((counter) => {
        ScrollTrigger.create({
          trigger: counter,
          start: "top 90%",
          once: true,
          onEnter: () => animateCounter(counter),
        });
      });

      // STANDARD — cinematic crop that opens up + inner parallax
      const canvas = document.querySelector(".standard__canvas");
      const media = canvas.querySelector("[data-standard-media]");
      const mediaImg = media.querySelector("img");
      const standardLines = [...canvas.querySelectorAll("h2 > span")];
      const askLink = canvas.querySelector(".round-link");

      gsap.fromTo(
        media,
        { clipPath: desktop ? "inset(16% 18% 16% 18%)" : "inset(10% 8% 10% 8%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: { trigger: canvas, start: "top 80%", end: "center 55%", scrub: 0.6 },
        }
      );
      gsap.fromTo(
        mediaImg,
        { yPercent: -7, scale: 1.22 },
        {
          yPercent: 7,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: canvas, start: "top bottom", end: "bottom top", scrub: true },
        }
      );

      const standardWords = standardLines.map((line) => split(line).words);
      const standardTl = gsap.timeline({
        scrollTrigger: { trigger: canvas, start: "top 72%", once: true },
      });
      standardWords.forEach((words, i) => {
        standardTl.from(words, { yPercent: 115, duration: 1.3, ease: "expo.out" }, i * 0.11);
      });
      standardTl.from(askLink, { scale: 0, rotate: -90, duration: 1.2, ease: "expo.out" }, 0.5);

      if (desktop) {
        standardLines.forEach((line, i) => {
          gsap.to(line, {
            x: (i % 2 ? 1 : -1) * 36,
            ease: "none",
            scrollTrigger: { trigger: canvas, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      }

      // PORTFOLIO — title reveal, rows draw their rule then slide in
      const portfolioTitle = document.querySelector(".portfolio__title");
      const portfolioHeading = portfolioTitle.querySelector("h2");
      gsap
        .timeline({ scrollTrigger: { trigger: portfolioTitle, start: "top 80%", once: true } })
        .from(portfolioTitle.querySelector(":scope > span"), { y: 20, opacity: 0, duration: 1, ease: "expo.out" })
        .from(split(portfolioHeading).words, { yPercent: 115, duration: 1.3, stagger: 0.08, ease: "expo.out" }, 0.05);

      portfolioItems.forEach((item) => {
        // (children keep their CSS hover transforms, so only the row wrapper is tweened)
        const summary = item.querySelector(".portfolio-item__summary");
        const toggle = item.querySelector(".portfolio-item__toggle");
        gsap
          .timeline({ scrollTrigger: { trigger: item, start: "top 90%", once: true } })
          .fromTo(item, { "--line": 0 }, { "--line": 1, duration: 1.4, ease: "expo.inOut" })
          .from(summary, { yPercent: 60, opacity: 0, duration: 1.3, ease: "expo.out", clearProps: "transform,opacity" }, 0.15)
          .from(toggle, { opacity: 0, duration: 1, clearProps: "opacity" }, 0.5);
      });

      // CONTACT — headline words, copy, form fields cascade
      const contactIntro = document.querySelector(".contact__intro");
      gsap
        .timeline({ scrollTrigger: { trigger: ".contact", start: "top 75%", once: true } })
        .from(contactIntro.querySelector(":scope > span"), { y: 20, opacity: 0, duration: 1, ease: "expo.out" })
        .from(split(contactIntro.querySelector("h2")).words, { yPercent: 115, duration: 1.3, stagger: 0.06, ease: "expo.out" }, 0.05)
        .from(contactIntro.querySelector("p"), { y: 24, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.4)
        .from(contactForm.querySelectorAll("label, .submit-button"), { y: 36, opacity: 0, duration: 1.1, stagger: 0.07, ease: "expo.out" }, 0.25);

      // FOOTER
      gsap.from(".site-footer > *", {
        y: 20,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "expo.out",
        scrollTrigger: { trigger: ".site-footer", start: "top 95%", once: true },
      });
    }
  );

  /* --- Desktop-only pointer interactions --------------------------- */
  if (finePointer) {
    root.classList.add("has-cursor");

    // Custom cursor: precise dot + trailing ring with contextual labels
    const cursor = document.querySelector("[data-cursor]");
    const dot = cursor.querySelector(".cursor__dot");
    const ring = cursor.querySelector(".cursor__ring");
    const label = cursor.querySelector("[data-cursor-label]");
    const dotX = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    gsap.set([dot, ring], { x: -100, y: -100 });

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        dotX(event.clientX);
        dotY(event.clientY);
        ringX(event.clientX);
        ringY(event.clientY);
      },
      { passive: true }
    );

    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));

    document.addEventListener("pointerover", (event) => {
      const t = event.target;
      const labelled = t.closest("[data-cursor-label]");
      const field = t.closest("input, textarea, select");
      const interactive = t.closest("a, button, [role='button']");

      cursor.classList.toggle("is-hidden", Boolean(field));
      if (labelled && !t.closest("button")) {
        label.textContent = labelled.dataset.cursorLabel;
        cursor.classList.add("has-label");
        cursor.classList.remove("is-hover");
      } else {
        cursor.classList.remove("has-label");
        cursor.classList.toggle("is-hover", Boolean(interactive));
      }
    });

    // keep the label in sync after a click toggles Open/Close
    document.addEventListener("click", (event) => {
      const labelled = event.target.closest("[data-cursor-label]");
      if (labelled && cursor.classList.contains("has-label")) label.textContent = labelled.dataset.cursorLabel;
    });

    // Magnetic elements
    document.querySelectorAll(".round-link, .site-nav a, .brand, .submit-button").forEach((el) => {
      const strength = el.classList.contains("round-link") ? 0.45 : 0.22;
      const inner = el.querySelector("span");
      el.addEventListener("pointermove", (event) => {
        const r = el.getBoundingClientRect();
        const x = (event.clientX - (r.left + r.width / 2)) * strength;
        const y = (event.clientY - (r.top + r.height / 2)) * strength;
        gsap.to(el, { x, y, duration: 0.6, ease: "power3.out" });
        if (inner && el.classList.contains("round-link")) {
          gsap.to(inner, { x: x * 0.4, y: y * 0.4, duration: 0.6, ease: "power3.out" });
        }
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.35)" });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.35)" });
      });
    });

    // Hover preview: a floating frame trailing the cursor over closed residences
    const preview = document.querySelector("[data-preview]");
    const previewInner = preview.querySelector("[data-preview-inner]");
    const pX = gsap.quickTo(preview, "x", { duration: 0.8, ease: "power3" });
    const pY = gsap.quickTo(preview, "y", { duration: 0.8, ease: "power3" });
    const pR = gsap.quickTo(preview, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    let previewOn = false;
    let previewImgs = null;
    let shownIndex = -1;

    function buildPreview() {
      if (previewImgs) return;
      previewImgs = portfolioItems.map((item) => {
        const source = item.querySelector(".portfolio-carousel__track img");
        const img = document.createElement("img");
        img.alt = "";
        img.decoding = "async";
        img.src = source ? source.getAttribute("src") : "";
        previewInner.append(img);
        gsap.set(img, { yPercent: 100 });
        return img;
      });
    }

    function showPreview(index) {
      buildPreview();
      if (!previewOn) {
        previewOn = true;
        gsap.to(preview, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out", overwrite: "auto" });
      }
      if (index === shownIndex) return;
      const incoming = previewImgs[index];
      const outgoing = previewImgs[shownIndex];
      gsap.set(incoming, { zIndex: 2 });
      if (outgoing) gsap.set(outgoing, { zIndex: 1 });
      gsap.fromTo(incoming, { yPercent: index > shownIndex ? 100 : -100, scale: 1.3 }, { yPercent: 0, scale: 1, duration: 0.9, ease: "expo.out" });
      shownIndex = index;
    }

    function hidePreview() {
      if (!previewOn) return;
      previewOn = false;
      gsap.to(preview, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.6, ease: "expo.out", overwrite: "auto" });
    }

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType !== "mouse") return;
        pX(event.clientX + 190);
        pY(event.clientY);
        const velocity = gsap.utils.clamp(-12, 12, (event.clientX - lastX) * 0.6);
        pR(velocity);
        lastX = event.clientX;
      },
      { passive: true }
    );

    portfolioItems.forEach((item, index) => {
      const summary = item.querySelector(".portfolio-item__summary");
      summary.addEventListener("pointerenter", () => {
        if (!item.classList.contains("is-open")) showPreview(index);
      });
      summary.addEventListener("pointerleave", hidePreview);
      summary.addEventListener("click", hidePreview);
    });
  }

  // Images/fonts can shift layout: recompute trigger positions once everything is in
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
