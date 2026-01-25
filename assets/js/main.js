/* How to use: add class="reveal" to any element and optional data-delay="150" (ms) for staggered reveals. */
document.documentElement.classList.add("js");

const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dots = Array.from(document.querySelectorAll(".hero-dot"));
const prevButton = document.querySelector(".hero-arrow-prev");
const nextButton = document.querySelector(".hero-arrow-next");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");

let index = 0;
let carouselTimer;
const carouselDelayMs = 6000;

const puzzleElements = Array.from(document.querySelectorAll("[data-puzzle]"));
const puzzleTimers = new WeakMap();

const resolvePuzzleImage = (image) => new URL(image, document.baseURI).href;

const getPuzzleImage = (element) => {
  const dataImage = element.dataset.image;
  if (dataImage) return dataImage;

  const img = element.querySelector("img");
  return img ? img.getAttribute("src") : null;
};

const getPuzzleGrid = (element) => {
  const desktopCols = Number(element.dataset.cols) || 8;
  const desktopRows = Number(element.dataset.rows) || 5;
  const mobileCols = Number(element.dataset.colsMobile) || 4;
  const mobileRows = Number(element.dataset.rowsMobile) || 6;

  return mobileBreakpoint.matches
    ? { cols: mobileCols, rows: mobileRows }
    : { cols: desktopCols, rows: desktopRows };
};

const setPuzzleImage = (element) => {
  const image = getPuzzleImage(element);
  if (!image) return null;

  const resolvedImage = resolvePuzzleImage(image);

  element.style.setProperty("--puzzle-image", `url("${resolvedImage}")`);

  return resolvedImage;
};

const loadPuzzleImage = (element) =>
  new Promise((resolve) => {
    const url = setPuzzleImage(element);
    if (!url) {
      resolve(false);
      return;
    }

    const testImage = new Image();
    testImage.onload = () => resolve(true);
    testImage.onerror = () => resolve(false);
    testImage.src = url;
  });

const createPuzzlePieces = async (element) => {
  if (element.dataset.puzzleBuilt === "true" || prefersReducedMotion.matches) {
    return false;
  }

  const loaded = await loadPuzzleImage(element);
  if (!loaded) return false;

  element.classList.add("puzzle-ready");

  // Evitar overlays duplicados si por algún motivo se llama dos veces
  const existing = element.querySelector(":scope > .puzzle-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "puzzle-overlay";
  overlay.setAttribute("aria-hidden", "true");
  element.prepend(overlay);

  const { cols, rows } = getPuzzleGrid(element);
  element.style.setProperty("--puzzle-cols", cols);
  element.style.setProperty("--puzzle-rows", rows);

  const offsetRange = 28;
  const overlap = 1;
  let maxDelay = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const piece = document.createElement("div");
      piece.className = "puzzle-piece";

      piece.style.width = `${100 / cols}%`;
      piece.style.height = `${100 / rows}%`;
      piece.style.left = `calc(${(100 / cols) * col}% - ${overlap / 2}px)`;
      piece.style.top = `calc(${(100 / rows) * row}% - ${overlap / 2}px)`;

      const backgroundX = cols === 1 ? 50 : (100 / (cols - 1)) * col;
      const backgroundY = rows === 1 ? 50 : (100 / (rows - 1)) * row;
      piece.style.backgroundPosition = `${backgroundX}% ${backgroundY}%`;

      const delay = (row + col) * 0.04 + Math.random() * 0.2;
      maxDelay = Math.max(maxDelay, delay);
      piece.style.setProperty("--piece-delay", `${delay.toFixed(2)}s`);
      piece.style.setProperty("--piece-rotate", `${(Math.random() * 18 - 9).toFixed(2)}deg`);
      piece.style.setProperty("--piece-x", `${(Math.random() * 2 - 1) * offsetRange}px`);
      piece.style.setProperty("--piece-y", `${(Math.random() * 2 - 1) * offsetRange}px`);

      overlay.appendChild(piece);
    }
  }

  element.dataset.puzzleMaxDelay = maxDelay.toFixed(2);
  element.dataset.puzzleBuilt = "true";
  return true;
};

const resetPuzzleState = (element) => {
  const existingTimer = puzzleTimers.get(element);
  if (existingTimer) window.clearTimeout(existingTimer);
  puzzleTimers.delete(element);
  element.classList.remove("puzzle-start", "puzzle-revealed", "puzzle-animating", "puzzle-done");
};

const startPuzzle = async (element) => {
  resetPuzzleState(element);
  element.classList.add("puzzle-start");

  if (prefersReducedMotion.matches) {
    setPuzzleImage(element);
    element.classList.add("puzzle-done");
    return;
  }

  if (element.classList.contains("puzzle-revealed")) return;

  const built = await createPuzzlePieces(element);
  if (!built) {
    element.classList.add("puzzle-done");
    return;
  }

  requestAnimationFrame(() => {
    element.classList.add("puzzle-revealed");
    element.classList.add("puzzle-animating");
  });

  const maxDelay = Number(element.dataset.puzzleMaxDelay || 0);
  const animationDuration = 0.9;
  const totalDelayMs = (maxDelay + animationDuration) * 1000 + 150;

  const timer = window.setTimeout(() => {
    element.classList.add("puzzle-done");
  }, totalDelayMs);
  puzzleTimers.set(element, timer);
};

const setupPuzzle = () => {
  if (!puzzleElements.length) return;

  // En reduced-motion, solo seteamos imagen y listo
  if (prefersReducedMotion.matches) {
    puzzleElements.forEach((el) => {
      setPuzzleImage(el);
      el.classList.add("puzzle-done");
    });
    return;
  }

  // Sin IntersectionObserver, igual seteamos imagen
  if (typeof IntersectionObserver === "undefined") {
    puzzleElements.forEach((el) => {
      setPuzzleImage(el);
      el.classList.add("puzzle-done");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          resetPuzzleState(entry.target);
          startPuzzle(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  puzzleElements.forEach((el) => {
    setPuzzleImage(el);

    // Si está en el hero, el reveal se maneja por is-active
    if (el.closest(".hero")) {
      if (el.classList.contains("is-active")) {
        resetPuzzleState(el);
        startPuzzle(el);
      }
      return;
    }

    observer.observe(el);
  });
};

function showSlide(nextIndex) {
  const boundedIndex = ((nextIndex % slides.length) + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    const isActive = i === boundedIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");

    if (slide.hasAttribute("data-puzzle")) {
      if (isActive) {
        startPuzzle(slide);
      } else {
        resetPuzzleState(slide);
      }
    }
  });

  dots.forEach((dot, i) => dot.classList.toggle("active", i === boundedIndex));

  index = boundedIndex;

  if (slides.length > 1) {
    if (carouselTimer) window.clearTimeout(carouselTimer);
    carouselTimer = window.setTimeout(() => {
      const next = (index + 1) % slides.length;
      showSlide(next);
    }, carouselDelayMs);
  }
}

// Slider init
if (slides.length) {
  showSlide(0);
}

if (slides.length > 1) {
  dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i)));

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      const prev = (index - 1 + slides.length) % slides.length;
      showSlide(prev);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const next = (index + 1) % slides.length;
      showSlide(next);
    });
  }
}

// Reveal
const revealElements = Array.from(document.querySelectorAll(".reveal"));

const setupReveal = () => {
  revealElements.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.transitionDelay = `${delay}ms`;
  });

  if (prefersReducedMotion.matches || typeof IntersectionObserver === "undefined") {
    revealElements.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((el) => observer.observe(el));
};

// Smooth scroll
const header = document.querySelector(".site-header");

const setupSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      const headerOffset = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;

      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    });
  });
};

// Banner typing
const setupBannerTyping = () => {
  const tracks = Array.from(document.querySelectorAll(".banner-track[data-words]"));
  if (!tracks.length) return;

  tracks.forEach((track) => {
    const rawWords = track.dataset.words || "";
    const words = rawWords
      .split("|")
      .map((word) => word.trim())
      .filter(Boolean);

    if (!words.length) return;

    const target = track.querySelector(".banner-typing") || track;

    if (prefersReducedMotion.matches) {
      target.textContent = words[0];
      return;
    }

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const type = () => {
      if (!document.body.contains(track)) return;

      const currentWord = words[wordIndex];

      if (deleting) {
        charIndex = Math.max(charIndex - 1, 0);
      } else {
        charIndex = Math.min(charIndex + 1, currentWord.length);
      }

      target.textContent = currentWord.slice(0, charIndex);

      let delay = deleting ? 45 : 70;

      if (!deleting && charIndex === currentWord.length) {
        delay = 1600;
        deleting = true;
      } else if (deleting && charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        delay = 500;
      }

      window.setTimeout(type, delay);
    };

    type();
  });
};

const contactEndpoint =
  "https://default5243832e5a814f3d9656d9f5b8364a.23.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/b8765be95b7d4726b3282a6870e94886/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=OFwPEdmfkd3Aiu5cWEVwlGbmg56Wnz_hgi3w9Lt0yko";

const setFormStatus = (form, message, isError = false) => {
  let status = form.querySelector(".form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    form.appendChild(status);
  }

  status.textContent = message;
  status.classList.toggle("is-error", isError);
};

const setFormDisabled = (form, disabled) => {
  const fields = Array.from(form.querySelectorAll("input, textarea, button"));
  fields.forEach((field) => {
    field.disabled = disabled;
  });
};

const initContactForms = () => {
  const forms = Array.from(document.querySelectorAll(".contact-form"));
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const payload = {
        nombre: form.elements.nombre?.value?.trim() ?? "",
        mail: form.elements.mail?.value?.trim() ?? "",
        telefono: form.elements.telefono?.value?.trim() ?? "",
        Asunto: form.elements.Asunto?.value?.trim() ?? "",
        Mensaje: form.elements.Mensaje?.value?.trim() ?? "",
      };

      const successMessage = form.dataset.successMessage || "Mensaje enviado.";
      const errorMessage = form.dataset.errorMessage || "No se pudo enviar.";

      setFormStatus(form, "");
      setFormDisabled(form, true);

      try {
        const response = await fetch(contactEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        setFormStatus(form, successMessage);
        form.reset();
      } catch (error) {
        setFormStatus(form, errorMessage, true);
      } finally {
        setFormDisabled(form, false);
      }
    });
  });
};

// Parallax
const hero = document.querySelector(".hero");
let parallaxFrame;

const updateParallax = () => {
  if (!hero || prefersReducedMotion.matches || mobileBreakpoint.matches) {
    if (hero) hero.style.setProperty("--parallax-offset", "0px");
    return;
  }

  const rect = hero.getBoundingClientRect();
  const offset = Math.max(-60, Math.min(60, rect.top * -0.08));
  hero.style.setProperty("--parallax-offset", `${offset}px`);
};

const onScroll = () => {
  if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
  parallaxFrame = requestAnimationFrame(updateParallax);
};

// Boot
setupPuzzle();
setupReveal();
setupSmoothScroll();
setupBannerTyping();
initContactForms();
updateParallax();

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateParallax);

if (prefersReducedMotion.addEventListener) {
  prefersReducedMotion.addEventListener("change", updateParallax);
} else if (prefersReducedMotion.addListener) {
  prefersReducedMotion.addListener(updateParallax);
}

if (mobileBreakpoint.addEventListener) {
  mobileBreakpoint.addEventListener("change", updateParallax);
} else if (mobileBreakpoint.addListener) {
  mobileBreakpoint.addListener(updateParallax);
}
