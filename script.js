const header = document.querySelector("[data-header]");
const reveals = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.92);
}

function animateCounter(counter) {
  const target = Number(counter.dataset.count);
  const duration = 1200;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(target * eased);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

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

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.5 }
);

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });
reveals.forEach((element) => revealObserver.observe(element));
counters.forEach((counter) => counterObserver.observe(counter));

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = formData.get("name").toString().trim();

  formStatus.textContent = `${name}, richiesta ricevuta. Ti contatteremo con una shortlist riservata.`;
  contactForm.reset();
});

const portfolioItems = document.querySelectorAll(".portfolio-item");
const portfolioCarousels = document.querySelectorAll("[data-carousel]");

portfolioItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    const clickedCarouselButton = event.target.closest(".portfolio-carousel__button");

    if (clickedCarouselButton) return;

    portfolioItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove("is-open");
      }
    });

    item.classList.toggle("is-open");
  });

  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();

    portfolioItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove("is-open");
      }
    });

    item.classList.toggle("is-open");
  });
});

portfolioCarousels.forEach((carousel) => {
  const images = carousel.querySelectorAll("img");
  const previousButton = carousel.querySelector(".portfolio-carousel__button--prev");
  const nextButton = carousel.querySelector(".portfolio-carousel__button--next");

  if (!images.length || !previousButton || !nextButton) return;

  let activeIndex = 0;

  function showImage(index) {
    images[activeIndex].classList.remove("is-active");
    activeIndex = (index + images.length) % images.length;
    images[activeIndex].classList.add("is-active");
  }

  previousButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showImage(activeIndex - 1);
  });

  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showImage(activeIndex + 1);
  });
});