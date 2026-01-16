/* How to use: add class="reveal" to any element and optional data-delay="150" (ms) for staggered reveals. */
const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dots = Array.from(document.querySelectorAll(".hero-dot"));
const prevButton = document.querySelector(".hero-arrow-prev");
const nextButton = document.querySelector(".hero-arrow-next");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");
let index = 0;
const puzzleElements = Array.from(document.querySelectorAll("[data-puzzle]"));

const getPuzzleImage = (element) => {
  const dataImage = element.dataset.image;
  if (dataImage) {
    return dataImage;
  }
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
  if (!image) {
    return;
  }
  element.style.setProperty("--puzzle-image", `url("${image}")`);
  if (!element.style.backgroundImage) {
    element.style.backgroundImage = "var(--puzzle-image)";
  }
};

const createPuzzlePieces = (element) => {
  if (element.dataset.puzzleBuilt === "true" || prefersReducedMotion.matches) {
    return;
  }

  setPuzzleImage(element);
  element.classList.add("puzzle-ready");

  const overlay = document.createElement("div");
  overlay.className = "puzzle-overlay";
  overlay.setAttribute("aria-hidden", "true");
  element.prepend(overlay);

  const { cols, rows } = getPuzzleGrid(element);
  element.style.setProperty("--puzzle-cols", cols);
  element.style.setProperty("--puzzle-rows", rows);

  const offsetRange = 28;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const piece = document.createElement("div");
      piece.className = "puzzle-piece";
      piece.style.width = `${100 / cols}%`;
      piece.style.height = `${100 / rows}%`;
      piece.style.left = `${(100 / cols) * col}%`;
      piece.style.top = `${(100 / rows) * row}%`;

      const backgroundX = cols === 1 ? 50 : (100 / (cols - 1)) * col;
      const backgroundY = rows === 1 ? 50 : (100 / (rows - 1)) * row;
      piece.style.backgroundPosition = `${backgroundX}% ${backgroundY}%`;

      const delay = (row + col) * 0.04 + Math.random() * 0.2;
      piece.style.setProperty("--piece-delay", `${delay.toFixed(2)}s`);
      piece.style.setProperty("--piece-rotate", `${(Math.random() * 18 - 9).toFixed(2)}deg`);
      piece.style.setProperty("--piece-x", `${(Math.random() * 2 - 1) * offsetRange}px`);
      piece.style.setProperty("--piece-y", `${(Math.random() * 2 - 1) * offsetRange}px`);
      overlay.appendChild(piece);
    }
  }

  element.dataset.puzzleBuilt = "true";
};

const revealPuzzle = (element) => {
  if (prefersReducedMotion.matches) {
    return;
  }
  createPuzzlePieces(element);
  requestAnimationFrame(() => element.classList.add("puzzle-revealed"));
};

const setupPuzzle = () => {
  if (!puzzleElements.length) {
    return;
  }

  if (prefersReducedMotion.matches) {
    puzzleElements.forEach((element) => setPuzzleImage(element));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealPuzzle(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  puzzleElements.forEach((element) => {
    setPuzzleImage(element);
    observer.observe(element);
  });
};

function showSlide(nextIndex) {
  slides.forEach((slide, i) => {
    slide.style.display = i === nextIndex ? "grid" : "none";
    slide.classList.toggle("is-active", i === nextIndex);
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === nextIndex);
  });
  index = nextIndex;
}

dots.forEach((dot, i) => {
  dot.addEventListener("click", () => showSlide(i));
});

prevButton.addEventListener("click", () => {
  const prev = (index - 1 + slides.length) % slides.length;
  showSlide(prev);
});

nextButton.addEventListener("click", () => {
  const next = (index + 1) % slides.length;
  showSlide(next);
});

showSlide(0);
setInterval(() => {
  const next = (index + 1) % slides.length;
  showSlide(next);
}, 6000);

const revealElements = Array.from(document.querySelectorAll(".reveal"));
const setupReveal = () => {
  revealElements.forEach((element) => {
    const delay = Number(element.dataset.delay || 0);
    element.style.transitionDelay = `${delay}ms`;
  });

  if (prefersReducedMotion.matches) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
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

  revealElements.forEach((element) => observer.observe(element));
};

const header = document.querySelector(".site-header");
const setupSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (!target) {
        return;
      }
      event.preventDefault();
      const headerOffset = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
      window.scrollTo({ top: targetPosition, behavior: "smooth" });
    });
  });
};

const hero = document.querySelector(".hero");
let parallaxFrame;
const updateParallax = () => {
  if (!hero || prefersReducedMotion.matches || mobileBreakpoint.matches) {
    hero?.style.setProperty("--parallax-offset", "0px");
    return;
  }

  const rect = hero.getBoundingClientRect();
  const offset = Math.max(-60, Math.min(60, rect.top * -0.08));
  hero.style.setProperty("--parallax-offset", `${offset}px`);
};

const onScroll = () => {
  if (parallaxFrame) {
    cancelAnimationFrame(parallaxFrame);
  }
  parallaxFrame = requestAnimationFrame(updateParallax);
};

setupPuzzle();
setupReveal();
setupSmoothScroll();
updateParallax();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateParallax);
prefersReducedMotion.addEventListener("change", updateParallax);
mobileBreakpoint.addEventListener("change", updateParallax);
