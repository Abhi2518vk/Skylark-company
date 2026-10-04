const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const whatsappNumber = "917054929356";

function initReloadPosition() {
  if (performance.getEntriesByType("navigation")[0]?.type !== "reload") return;
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  window.addEventListener(
    "pagehide",
    () => {
      history.scrollRestoration = restoration;
    },
    { once: true },
  );
  history.replaceState(history.state, "", location.pathname + location.search);
  window.addEventListener(
    "pageshow",
    () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    },
    { once: true },
  );
}

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
  let current = 0;
  let paused = reducedMotion.matches;
  let timer;
  let isVisible = true;
  const schedule = () => {
    window.clearTimeout(timer);
    if (
      !paused &&
      !document.hidden &&
      isVisible &&
      !slides[current].contains(document.activeElement)
    )
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
  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => {
      show(index);
    }),
  );
  hero.addEventListener("focusin", schedule);
  hero.addEventListener("focusout", () => queueMicrotask(schedule));
  hero.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
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
        show(current + (dx < 0 ? 1 : -1));
      }
      touchStart = null;
    },
    { passive: true },
  );
  reducedMotion.addEventListener("change", () => {
    paused = reducedMotion.matches;
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    schedule();
  }).observe(hero);
  schedule();
}

function filterProducts(category) {
  document
    .querySelector(".products-grid")
    .classList.toggle("is-filtered", category !== "all");
  let count = 0;
  document.querySelectorAll(".product-card").forEach((card) => {
    card.hidden = category !== "all" && card.dataset.category !== category;
    if (!card.hidden) count += card.querySelectorAll("[data-product]").length;
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#productCount").textContent =
    `${count} product${count === 1 ? "" : "s"}`;
}

const productDetails = {
  cabins: {
    description:
      "Wall panels, mirrors and finishes developed as one coordinated cabin interior.",
    features: [
      "Stainless steel, glass and veneer options",
      "Panel layouts and fixing details",
      "Equipment load and clearance review",
    ],
  },
  architraves: {
    description:
      "Entrance frames and architraves coordinated with the lift opening and surrounding finishes.",
    features: [
      "Custom jamb and header profiles",
      "Material and finish selection",
      "Site dimensions and fixing details",
    ],
  },
  handrail: {
    description:
      "Handrails that complement the cabin interior and its daily use.",
    features: [
      "Stainless steel profiles and finishes",
      "Position and dimension coordination",
      "Equipment-specific fixing review",
    ],
  },
  ceiling: {
    description:
      "Ceiling panels and lighting layouts coordinated with the cabin design.",
    features: [
      "Decorative ceiling layouts",
      "LED lighting integration",
      "Access, ventilation and weight review",
    ],
  },
  doors: {
    description:
      "Door cladding that connects the elevator entrance to the building interior.",
    features: [
      "Brushed, mirror and decorative finishes",
      "Panel sizing and joint details",
      "Door movement and clearance review",
    ],
  },
  glass: {
    description:
      "Glass door concepts developed around the selected equipment and entrance design.",
    features: [
      "Glass and frame finish selection",
      "Dimensions and hardware coordination",
      "Equipment compatibility and safety review",
    ],
  },
  flooring: {
    description:
      "Cabin flooring selected for appearance, durability and equipment suitability.",
    features: [
      "Stone, marble and resilient finish options",
      "Threshold and floor build-up details",
      "Weight and load review",
    ],
  },
  escalators: {
    description:
      "Side panels, soffits and underside cladding coordinated with the surrounding architecture.",
    features: [
      "Stainless steel and decorative panel options",
      "Panel joints and fixing details",
      "Maintenance access coordination",
    ],
  },
  bollards: {
    description:
      "Floor bollards developed around escalator approaches and the surrounding pedestrian space.",
    features: [
      "Stainless steel profiles and finishes",
      "Site-specific positioning",
      "Floor fixing and dimension review",
    ],
  },
  guards: {
    description:
      "Child safety guard layouts coordinated with the escalator and adjacent building elements.",
    features: [
      "Glass guard and support options",
      "Site-specific dimensions and clearances",
      "Review against applicable project requirements",
    ],
  },
  metalwork: {
    description:
      "Custom metal panels and architectural details developed from your brief.",
    features: [
      "Stainless steel and decorative metal",
      "Cutting, forming and joinery details",
      "Drawing and finish coordination",
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
      const productImage = button.dataset.productImage;
      if (!productImage) return;
      const isDrawing = productImage.endsWith(".svg");
      selectedTitle = button.childNodes[0].textContent.trim();
      document.querySelector("#dialogTitle").textContent = selectedTitle;
      document.querySelector("#dialogCategory").textContent =
        `THE COLLECTION / ${card.dataset.category.toUpperCase()}`;
      document.querySelector("#dialogDescription").textContent =
        detail.description;
      const image = document.querySelector("#dialogImage");
      image.src = productImage;
      image.alt = isDrawing
        ? selectedTitle + " — explanatory component illustration"
        : sourceImage.alt;
      image.classList.toggle("is-illustration", isDrawing);
      document.querySelector("#dialogImageNote").textContent = isDrawing
        ? "Concept illustration — not a fabrication drawing or certified safety design."
        : "Illustrative photograph — not a completed Skylark project.";
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
}

function initFilmPreview() {
  const film = document.querySelector("#filmPreview");
  const toggle = document.querySelector("#filmMotion");
  let inView = false;
  let manualPlay = false;
  let playbackBlocked = false;
  const updateLabel = () => {
    toggle.textContent = "Play video";
    toggle.hidden = !(
      inView &&
      film.paused &&
      (playbackBlocked || reducedMotion.matches)
    );
  };
  const syncPlayback = () => {
    const shouldPlay =
      inView && !document.hidden && (!reducedMotion.matches || manualPlay);
    if (!shouldPlay) {
      film.pause();
      updateLabel();
      return;
    }
    film
      .play()
      .then(() => {
        playbackBlocked = false;
        if (
          !inView ||
          document.hidden ||
          (reducedMotion.matches && !manualPlay)
        )
          film.pause();
        updateLabel();
      })
      .catch(() => {
        playbackBlocked = true;
        updateLabel();
      });
  };
  film.addEventListener("play", updateLabel);
  film.addEventListener("pause", updateLabel);
  toggle.addEventListener("click", () => {
    manualPlay = true;
    playbackBlocked = false;
    syncPlayback();
  });
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
      syncPlayback();
    },
    { threshold: [0, 0.25] },
  ).observe(film);
  document.addEventListener("visibilitychange", syncPlayback);
  reducedMotion.addEventListener("change", () => {
    manualPlay = false;
    syncPlayback();
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
    const company = form.elements.company.value.trim();
    const email = form.elements.email.value.trim();
    const message = form.elements.message.value.trim();
    form.elements.name.setCustomValidity(
      name.length >= 2 ? "" : "Please enter your name.",
    );
    form.elements.company.setCustomValidity(
      company.length >= 2 ? "" : "Please enter your company name.",
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
    const text = `Hello Skylark Elevators And Fabrication Company,\n\nI would like to discuss a requirement:\nName: ${name}\nCompany: ${company}\nBusiness email: ${email}\nPhone: ${phone}\nSolution: ${form.elements.service.value}\n\n${message}`;
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

initReloadPosition();
initNavigation();
initCarousel();
initProducts();
initDialogs();
initFilmPreview();
initEnquiry();
document.querySelector("#year").textContent = new Date().getFullYear();
