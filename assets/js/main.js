/* How to use: add class="reveal" to any element and optional data-delay="150" (ms) for staggered reveals. */
const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dots = Array.from(document.querySelectorAll(".hero-dot"));
const prevButton = document.querySelector(".hero-arrow-prev");
const nextButton = document.querySelector(".hero-arrow-next");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");
let index = 0;
const puzzleRows = 5;
const puzzleCols = 5;

const buildPuzzlePieces = () => {
  if (prefersReducedMotion.matches) {
    return;
  }

  slides.forEach((slide) => {
    const puzzle = document.createElement("div");
    puzzle.className = "hero-puzzle";
    puzzle.setAttribute("aria-hidden", "true");
    slide.prepend(puzzle);

    slide.style.setProperty("--puzzle-rows", puzzleRows);
    slide.style.setProperty("--puzzle-cols", puzzleCols);

    for (let row = 0; row < puzzleRows; row += 1) {
      for (let col = 0; col < puzzleCols; col += 1) {
        const piece = document.createElement("div");
        piece.className = "hero-piece";
        piece.style.width = `${100 / puzzleCols}%`;
        piece.style.height = `${100 / puzzleRows}%`;
        piece.style.left = `${(100 / puzzleCols) * col}%`;
        piece.style.top = `${(100 / puzzleRows) * row}%`;
        piece.style.backgroundPosition = `${(100 / (puzzleCols - 1)) * col}% ${(100 / (puzzleRows - 1)) * row}%`;
        piece.style.setProperty("--piece-delay", `${Math.random() * 0.4}s`);
        piece.style.setProperty("--piece-rotate", `${(Math.random() * 50 - 25).toFixed(2)}deg`);
        puzzle.appendChild(piece);
      }
    }
  });
};

const triggerPuzzleAnimation = (slide) => {
  if (prefersReducedMotion.matches) {
    return;
  }

  slide.classList.remove("is-animating");
  void slide.offsetWidth;
  slide.classList.add("is-animating");
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
  const activeSlide = slides[nextIndex];
  if (activeSlide) {
    triggerPuzzleAnimation(activeSlide);
  }
}

buildPuzzlePieces();

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

setupReveal();
setupSmoothScroll();
updateParallax();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateParallax);
prefersReducedMotion.addEventListener("change", updateParallax);
mobileBreakpoint.addEventListener("change", updateParallax);
