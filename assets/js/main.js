const slides = Array.from(document.querySelectorAll(".hero-slide"));
const dots = Array.from(document.querySelectorAll(".hero-dot"));
let index = 0;

function showSlide(nextIndex) {
  slides.forEach((slide, i) => {
    slide.style.display = i === nextIndex ? "grid" : "none";
  });
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === nextIndex);
  });
  index = nextIndex;
}

dots.forEach((dot, i) => {
  dot.addEventListener("click", () => showSlide(i));
});

showSlide(0);
setInterval(() => {
  const next = (index + 1) % slides.length;
  showSlide(next);
}, 6000);
