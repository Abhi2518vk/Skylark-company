const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const whatsappNumber = "917054929356";

function initNavigation() {
  const menu = document.querySelector(".navigation");
  const toggle = document.querySelector(".menu-toggle");
  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  };
  toggle.addEventListener("click", () =>
    setOpen(toggle.getAttribute("aria-expanded") !== "true"),
  );
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setOpen(false);
  });
  window
    .matchMedia("(max-width: 850px)")
    .addEventListener("change", () => setOpen(false));
  menu.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget) && event.relatedTarget !== toggle)
      setOpen(false);
  });
  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries.find((entry) => entry.isIntersecting);
      if (!current) return;
      menu.querySelectorAll("a").forEach((link) => {
        const active = link.hash === `#${current.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-15% 0px -70% 0px" },
  );
  document
    .querySelectorAll("main > section[id]")
    .forEach((section) => observer.observe(section));
}

function initCarousel() {
  const hero = document.querySelector(".hero");
  const slides = [...hero.querySelectorAll(".hero-slide")];
  const dots = [...hero.querySelectorAll("[data-go-slide]")];
  const pause = document.querySelector("#slidePause");
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  let isVisible = true;
  const updatePause = () => {
    pause.setAttribute("aria-pressed", String(paused));
    pause.setAttribute(
      "aria-label",
      paused ? "Play slideshow" : "Pause slideshow",
    );
    pause.textContent = paused ? "▶" : "Ⅱ";
  };
  const schedule = () => {
    window.clearTimeout(timer);
    if (!paused && !document.hidden && isVisible)
      timer = window.setTimeout(() => show(current + 1), 6500);
  };
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
      dots[i].classList.toggle("is-active", active);
      dots[i].setAttribute("aria-pressed", String(active));
    });
    schedule();
  };
  const stop = () => {
    paused = true;
    updatePause();
    schedule();
  };
  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => {
      stop();
      show(index);
    }),
  );
  pause.addEventListener("click", () => {
    paused = !paused;
    updatePause();
    schedule();
  });
  hero.addEventListener("focusin", (event) => {
    if (event.target !== pause) stop();
  });
  hero.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    stop();
    show(current + (event.key === "ArrowRight" ? 1 : -1));
    dots[current].focus();
  });
  let touchStart = null;
  hero.addEventListener(
    "touchstart",
    (event) => {
      touchStart = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    },
    { passive: true },
  );
  hero.addEventListener(
    "touchend",
    (event) => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart.x;
      const dy = event.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        stop();
        show(current + (dx < 0 ? 1 : -1));
      }
      touchStart = null;
    },
    { passive: true },
  );
  reducedMotion.addEventListener("change", stop);
  document.addEventListener("visibilitychange", schedule);
  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    schedule();
  }).observe(hero);
  updatePause();
  schedule();
}

function filterProducts(category) {
  let count = 0;
  document.querySelectorAll(".product-card").forEach((card) => {
    card.hidden = category !== "all" && card.dataset.category !== category;
    if (!card.hidden) count += 1;
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#productCount").textContent =
    `${count} considered solution${count === 1 ? "" : "s"}`;
}

const productDetails = {
  cabins: {
    description:
      "A coordinated approach to the entire cabin, from wall panels and mirrors to the ceiling above. Develop an interior that feels like a natural continuation of the building.",
    features: [
      "Decorative stainless steel, mirror and veneer options",
      "Glass cabin concepts and coordinated panel layouts",
      "Material weight, fixing and clearance review",
    ],
  },
  doors: {
    description:
      "Bring a distinct identity to every arrival. Custom door skins, entrance frames and architraves connect the elevator with the surrounding architectural finishes.",
    features: [
      "Hairline, mirror and decorative metal finishes",
      "Custom jambs, headers and entrance detailing",
      "Door movement and fixation coordination",
    ],
  },
  escalators: {
    description:
      "Create a consistent visual language around escalators with coordinated side panels, soffits and underside cladding. Each detail responds to the surrounding interior.",
    features: [
      "Outer and under-escalator cladding concepts",
      "Material and joint alignment development",
      "Coordination with equipment access and maintenance needs",
    ],
  },
  finishes: {
    description:
      "Bring the cabin together with considered lighting, tactile handrails and a floor finish that complements the interior. Small choices make a lasting impression.",
    features: [
      "Decorative ceiling and LED lighting concepts",
      "Stainless steel handrail profiles and finishes",
      "Stone, marble and resilient flooring options, subject to load review",
    ],
  },
  guards: {
    description:
      "Discuss glass guards and floor bollards as part of an integrated escalator setting. Layout, dimensions and fixings are developed for the site and reviewed against applicable requirements.",
    features: [
      "Child-safety guard design coordination",
      "Bollard positioning and architectural finishes",
      "Site-specific dimensions and fixing details",
    ],
  },
  metalwork: {
    description:
      "Translate architectural ideas into custom metal elements. From decorative panels to precision-formed components, we develop the details around your design brief.",
    features: [
      "Custom stainless steel and decorative metal elements",
      "Laser-cut patterns, formed panels and bespoke joinery",
      "Drawing, material and finish coordination before fabrication",
    ],
  },
};

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("dialog-open");
}

function initProducts() {
  document
    .querySelectorAll("[data-filter]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        filterProducts(button.dataset.filter),
      ),
    );
  document
    .querySelectorAll("[data-filter-link]")
    .forEach((link) =>
      link.addEventListener("click", () =>
        filterProducts(link.dataset.filterLink),
      ),
    );
  const dialog = document.querySelector("#productDialog");
  let selectedTitle = "";
  document.querySelectorAll("[data-product]").forEach((button) =>
    button.addEventListener("click", () => {
      const card = button.closest(".product-card");
      const detail = productDetails[button.dataset.product];
      const sourceImage = card.querySelector("img");
      selectedTitle = card
        .querySelector("h3")
        .textContent.replace(/\s+/g, " ")
        .trim();
      document.querySelector("#dialogTitle").textContent = selectedTitle;
      document.querySelector("#dialogCategory").textContent =
        `THE COLLECTION / ${card.dataset.category.toUpperCase()}`;
      document.querySelector("#dialogDescription").textContent =
        detail.description;
      const image = document.querySelector("#dialogImage");
      image.src = sourceImage.getAttribute("src");
      image.alt = sourceImage.alt;
      document.querySelector("#dialogFeatures").replaceChildren(
        ...detail.features.map((feature) => {
          const item = document.createElement("li");
          item.textContent = feature;
          return item;
        }),
      );
      openDialog(dialog);
    }),
  );
  document.querySelector("#dialogEnquiry").addEventListener("click", () => {
    document.querySelector("#service").value = selectedTitle;
    dialog.close();
    document.querySelector("#fullName").focus({ preventScroll: true });
  });
}

function initDialogs() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close-dialog]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom)
      )
        dialog.close();
    });
    dialog.addEventListener("close", () =>
      document.body.classList.remove("dialog-open"),
    );
  });
  const film = document.querySelector("#brandFilm");
  const dialog = document.querySelector("#filmDialog");
  const status = document.querySelector("#videoStatus");
  document.querySelector("#openFilm").addEventListener("click", () => {
    openDialog(dialog);
    status.textContent = "";
    film.play().catch(() => {
      status.textContent =
        "Use the player’s play button to start the film. If playback is unavailable, the design inspiration images remain available above.";
    });
  });
  dialog.addEventListener("close", () => film.pause());
  film.addEventListener("error", () => {
    status.textContent =
      "The film could not load. Please try again or explore the design inspiration images above.";
  });
}

function initEnquiry() {
  const form = document.querySelector("#enquiryForm");
  const fallback = document.querySelector("#whatsappFallback");
  const status = document.querySelector("#formStatus");
  form.addEventListener("input", (event) => {
    event.target.setCustomValidity("");
    fallback.hidden = true;
    fallback.href = `https://wa.me/${whatsappNumber}`;
    status.textContent = "";
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const message = form.elements.message.value.trim();
    form.elements.name.setCustomValidity(
      name.length >= 2 ? "" : "Please enter your name.",
    );
    const digitCount = phone.replace(/\D/g, "").length;
    const validPhone =
      /^[+\d\s().-]+$/.test(phone) && digitCount >= 7 && digitCount <= 15;
    form.elements.phone.setCustomValidity(
      validPhone ? "" : "Enter a valid phone number with 7–15 digits.",
    );
    form.elements.message.setCustomValidity(
      message.length >= 10
        ? ""
        : "Please add at least 10 characters about your requirements.",
    );
    if (!form.reportValidity()) return;
    const text = `Hello Skylark Elevators And Fabrication Company,\n\nI would like to discuss a requirement:\nName: ${name}\nPhone: ${phone}\nSolution: ${form.elements.service.value}\n\n${message}`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    fallback.href = url;
    fallback.hidden = false;
    window.open(url, "_blank", "noopener,noreferrer");
    status.textContent =
      "Your message is prepared, not sent. Review it in WhatsApp and press Send. If a new tab did not open, use the link below.";
  });
  document.querySelector('a[href="#privacy"]').addEventListener("click", () => {
    document.querySelector("#privacy").open = true;
  });
}

function initReveals() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => observer.observe(element));
}

initNavigation();
initCarousel();
initProducts();
initDialogs();
initEnquiry();
initReveals();
document.querySelector("#year").textContent = new Date().getFullYear();
