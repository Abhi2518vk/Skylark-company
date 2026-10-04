import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("all local images load and homepage has no automated accessibility violations", async ({
  page,
}) => {
  await expect(page).toHaveTitle(/Skylark \| Elevator & Escalator Design/);
  await expect(
    page.getByRole("heading", { name: /crafted to elevate/i }),
  ).toBeVisible();
  const images = await page
    .locator("img")
    .evaluateAll((items) => items.map((item) => item.src));
  expect(images.length).toBeGreaterThanOrEqual(9);
  for (const src of new Set(images)) {
    const response = await page.request.get(src);
    expect(response.ok(), src).toBeTruthy();
  }
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});

test("carousel switches images and copy, supports keys, pauses for reduced motion", async ({
  page,
}) => {
  await expect(page.locator("#slidePause")).toHaveCount(0);
  await page.getByRole("button", { name: "Show escalator aesthetics" }).click();
  await expect(
    page.getByRole("heading", { name: /movement, reimagined/i }),
  ).toBeVisible();
  await expect(page.locator(".hero-slide.is-active img")).toHaveAttribute(
    "src",
    "images/escalator-design.webp",
  );
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: /every detail. elevated/i }),
  ).toBeVisible();
  await expect(page.locator(".hero-slide[inert]")).toHaveCount(3);
});

test("filters and every product enquiry preselect the matching solution", async ({
  page,
}) => {
  for (const [category, count] of [
    ["elevators", 7],
    ["escalators", 3],
    ["fabrication", 1],
    ["all", 11],
  ]) {
    await page.locator(`[data-filter="${category}"]`).click();
    await expect(
      page.locator(".product-card:not([hidden]) [data-product]"),
    ).toHaveCount(count);
  }
  for (const button of await page.locator("[data-product]").all()) {
    const title = (await button.innerText()).trim();
    await button.click();
    await expect(page.locator("#productDialog")).toBeVisible();
    await expect(page.locator("#dialogTitle")).toHaveText(title);
    await page.locator("#dialogEnquiry").click();
    await expect(page.locator("#service")).toHaveValue(title);
    await expect(page.locator("#productDialog")).not.toBeVisible();
  }
});

test("mobile menu closes after navigation and Escape, layouts do not overflow", async ({
  page,
}) => {
  for (const width of [
    320, 360, 390, 768, 850, 851, 960, 1100, 1101, 1366, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .locator("#navigation")
    .getByRole("link", { name: "Our products" })
    .click();
  await expect(page.locator("#navigation")).not.toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#navigation")).not.toBeVisible();
});

test("WhatsApp validates consent and phone, encodes details, and handles blocked popups without sending", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.openedEnquiry = null;
    window.open = (url) => {
      window.openedEnquiry = url;
      return null;
    };
  });
  await page.locator("#fullName").fill("Release Test");
  await page.locator("#companyName").fill("Design & Build + Partners");
  await page.locator("#businessEmail").fill("info+enquiry@skylark-sa.com");
  await page.locator("#phone").fill("invalid-phone");
  await page.locator("#service").selectOption("Cabin Interiors");
  await page
    .locator("#message")
    .fill("Design enquiry with symbols & + and a new line\nSecond line.");
  await page.locator(".submit-button").click();
  expect(await page.evaluate(() => window.openedEnquiry)).toBeNull();
  await page.locator('[name="consent"]').check();
  await page.locator(".submit-button").click();
  await expect(page.locator("#phone")).toHaveJSProperty(
    "validationMessage",
    "Enter a valid phone number with 7–15 digits.",
  );
  await page.locator("#phone").fill("+91 70549 29356");
  await page.locator(".submit-button").click();
  const href = await page.locator("#whatsappFallback").getAttribute("href");
  const url = new URL(href);
  expect(url.origin + url.pathname).toBe("https://wa.me/966562993497");
  expect(url.searchParams.get("text")).toContain("Solution: Cabin Interiors");
  expect(url.searchParams.get("text")).toContain(
    "Company: Design & Build + Partners",
  );
  expect(url.searchParams.get("text")).toContain(
    "Business email: info+enquiry@skylark-sa.com",
  );
  expect(url.searchParams.get("text")).toContain(
    "symbols & + and a new line\nSecond line.",
  );
  expect(await page.evaluate(() => window.openedEnquiry)).toBe(href);
  await expect(page.locator("#formStatus")).toContainText("not sent");
  await page
    .locator("#message")
    .fill("An updated enquiry clears the stale prepared link.");
  await expect(page.locator("#whatsappFallback")).not.toBeVisible();
});

test("the real five-second escalator clip loads and loops without another film dialog", async ({
  page,
}) => {
  await expect(page.locator(".film-bottom")).toHaveText(
    "SKYLARK / ESCALATOR DESIGN",
  );
  await expect(
    page
      .locator("#film")
      .getByText(/stock footage|not Skylark project footage/i),
  ).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator("#film").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("#filmPreview").currentTime > 0.1,
  );
  const duration = await page
    .locator("#filmPreview")
    .evaluate((video) => video.duration);
  expect(duration).toBeGreaterThanOrEqual(4.9);
  expect(duration).toBeLessThanOrEqual(5.1);
  await expect(page.locator("#filmDialog, #openFilm, #brandFilm")).toHaveCount(
    0,
  );
  await expect(page.locator("#filmPreview")).toHaveAttribute(
    "poster",
    "images/escalator-motion-poster.webp",
  );
});

test("credits attribute every deployed photograph and adapted film", async ({
  page,
}) => {
  await page.goto("/credits.html");
  await expect(
    page.getByRole("heading", { name: /image credits/i }),
  ).toBeVisible();
  await expect(page.getByText("Aalo Lens", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Stainless-steel bollards" }),
  ).toBeVisible();
  await expect(page.locator(".credits-note")).toContainText(
    "render status is not verified",
  );
  await expect(page.getByText("Pixabay Content License")).toBeVisible();
  await expect(
    page.locator(".credits-table article").filter({
      has: page.getByRole("heading", {
        name: "Five-second escalator film and poster",
      }),
    }),
  ).toContainText("footage, not a Skylark project.");
});

test("every deployed design image has explicit stock or client provenance", async ({
  page,
}) => {
  const images = await page
    .locator("main img")
    .evaluateAll((items) =>
      [
        ...new Set(
          items
            .map((image) => image.getAttribute("src"))
            .filter((src) => src.endsWith(".webp")),
        ),
      ].sort(),
    );
  await page.goto("/credits.html");
  const articles = await page
    .locator(".credits-table article[data-image]")
    .evaluateAll((items) =>
      items.map((article) => ({
        files: article.dataset.image.split(" "),
        isClient: article.dataset.source === "client",
        hasClientDisclosure:
          article.textContent
            .replace(/\s+/g, " ")
            .includes("Provided by the client") &&
          article.textContent
            .replace(/\s+/g, " ")
            .includes("not verified completed Skylark projects") &&
          article.textContent
            .replace(/\s+/g, " ")
            .includes("have not been independently verified"),
        hasSource: !!article.querySelector(
          'a[href^="https://unsplash.com/photos/"], a[href^="https://stocksnap.io/photo/"], a[href^="https://www.flickr.com/photos/"]',
        ),
        hasLicense: /Unsplash License|CC0 1.0 Public Domain Dedication/.test(
          article.textContent,
        ),
      })),
    );
  expect(
    articles.every(
      ({ isClient, hasClientDisclosure, hasSource, hasLicense }) =>
        isClient ? hasClientDisclosure : hasSource && hasLicense,
    ),
  ).toBe(true);
  expect(articles.flatMap(({ files }) => files).sort()).toEqual(images);
});

test("four photographic hero slides fill the background on desktop and mobile", async ({
  page,
}) => {
  for (const width of [390, 960, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (let index = 0; index < 4; index++) {
      await page.locator(`[data-go-slide="${index}"]`).click();
      const bounds = await page
        .locator(".hero-slide.is-active img")
        .evaluate((image) => ({
          imageWidth: image.getBoundingClientRect().width,
          imageHeight: image.getBoundingClientRect().height,
          heroWidth: image.closest(".hero").getBoundingClientRect().width,
          heroHeight: image.closest(".hero").getBoundingClientRect().height,
          objectFit: getComputedStyle(image).objectFit,
        }));
      expect(bounds.imageWidth).toBe(bounds.heroWidth);
      expect(bounds.imageHeight).toBe(bounds.heroHeight);
      expect(bounds.objectFit).toBe("cover");
    }
  }
  await expect(page.locator(".brand-wordmark")).toHaveText(/SKYLARK/);
  await expect(page.locator(".hero .play-small")).toHaveCount(0);
});

test("tablet keeps the intended content width and hero heading scale", async ({
  page,
}) => {
  await page.setViewportSize({ width: 960, height: 900 });
  const tablet = await page.locator(".hero h1").evaluate((heading) => ({
    headingSize: getComputedStyle(heading).fontSize,
    containerWidth: heading.closest(".container").getBoundingClientRect().width,
  }));
  expect(tablet.headingSize).toBe("58px");
  expect(tablet.containerWidth).toBe(888);
});

test("catalogue includes the requested elevator and escalator products", async ({
  page,
}) => {
  const names = (category) =>
    page
      .locator(`[data-category="${category}"] [data-product]`)
      .evaluateAll((buttons) =>
        buttons.map((button) => button.childNodes[0].textContent.trim()),
      );
  expect(await names("elevators")).toEqual([
    "Cabin Interiors",
    "Architraves",
    "Handrail",
    "Ceiling",
    "Door Cladding",
    "Glass Doors",
    "Cabin Flooring",
  ]);
  expect(await names("escalators")).toEqual([
    "Escalator Cladding",
    "Escalator Floor Bollards",
    "Child Safety Guards",
  ]);
  await expect(page.getByText("VIEW PROJECTS", { exact: true })).toHaveCount(0);
  await expect(
    page.locator(".product-list button span[aria-hidden]"),
  ).toHaveCount(0);
  await expect(page.locator(".hero-category-grid a")).toHaveCount(3);
  for (const [category, count] of [
    ["elevators", 7],
    ["escalators", 3],
    ["fabrication", 1],
  ]) {
    await page
      .locator(`.hero-category-grid [data-filter-link="${category}"]`)
      .click();
    await expect(
      page.locator(".product-card:not([hidden]) [data-product]"),
    ).toHaveCount(count);
    await expect(page.locator(`[data-filter="${category}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
});

test("four slides keep every heading and action within laptop and phone bounds", async ({
  page,
}) => {
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [851, 700],
    [960, 700],
    [1100, 700],
    [1101, 700],
    [1366, 650],
    [1920, 900],
  ]) {
    await page.setViewportSize({ width, height });
    for (let index = 0; index < 4; index++) {
      await page.locator(`[data-go-slide="${index}"]`).click();
      const bounds = await page
        .locator(".hero-slide.is-active")
        .evaluate((slide) => {
          const hero = slide.closest(".hero").getBoundingClientRect();
          const content = slide
            .querySelector(".hero-content")
            .getBoundingClientRect();
          const controls = document
            .querySelector(".hero-bottom")
            .getBoundingClientRect();
          return {
            left: content.left,
            right: content.right,
            top: content.top - hero.top,
            bottom: content.bottom,
            controlsTop: controls.top,
            heroHeight: hero.height,
          };
        });
      expect(bounds.left).toBeGreaterThanOrEqual(19);
      expect(bounds.right).toBeLessThanOrEqual(width - 19);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.controlsTop);
      if (width > 850)
        expect(bounds.heroHeight).toBeLessThanOrEqual(
          Math.min(600, height - 79),
        );
    }
  }
  await expect(page.locator(".hero-slide")).toHaveCount(4);
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-slide="0"]')).toHaveClass(/is-active/);
});

for (const width of [390, 1366]) {
  test(`silent film plays on scroll and pauses offscreen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const video = page.locator("#filmPreview");
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveJSProperty("currentTime", 0);
    await page.locator("#film").scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("loop", true);
    await page.waitForFunction(
      () => document.querySelector("#filmPreview").currentTime > 0.1,
    );
    await expect(page.locator("#filmMotion")).toBeHidden();
    await page.locator("#home").scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("paused", true);
    await page.locator("#film").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => !document.querySelector("#filmPreview").paused,
    );
    await expect(page.locator("#filmMotion")).toBeHidden();
  });
}

test("reduced motion keeps preview still but manual play remains available", async ({
  page,
}) => {
  await page.locator("#film").scrollIntoViewIfNeeded();
  await expect(page.locator("#filmPreview")).toHaveJSProperty("paused", true);
  await page.locator("#filmMotion").click();
  await expect(page.locator("#filmPreview")).toHaveJSProperty("paused", false);
});

test("blocked autoplay leaves a working manual play control", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    const video = document.querySelector("#filmPreview");
    video.play = () =>
      Promise.reject(new DOMException("Playback blocked", "NotAllowedError"));
  });
  const video = page.locator("#filmPreview");
  await video.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      video.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return (
          Math.max(
            0,
            Math.min(box.bottom, innerHeight) - Math.max(box.top, 0),
          ) / box.height
        );
      }),
    )
    .toBeGreaterThanOrEqual(0.25);
  await expect(page.locator("#filmMotion")).toBeVisible();
  await expect(page.locator("#filmMotion")).toHaveText("Play video");
  await page.evaluate(() => {
    delete document.querySelector("#filmPreview").play;
  });
  await page.locator("#filmMotion").click();
  await expect(page.locator("#filmPreview")).toHaveJSProperty("paused", false);
});

test("motion section follows company and precedes products without a visible preview button", async ({
  page,
}) => {
  const sections = await page
    .locator("main > section[id]")
    .evaluateAll((items) => items.map((item) => item.id));
  expect(sections.indexOf("film")).toBe(sections.indexOf("company") + 1);
  expect(sections.indexOf("products")).toBe(sections.indexOf("film") + 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const video = page.locator("#filmPreview");
  await video.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("#filmPreview").currentTime > 0.1,
  );
  await expect(page.locator("#filmMotion")).toBeHidden();
});

test("carousel keeps cycling after manual selection and omits decorative numbering", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator('[data-go-slide="1"]').click();
  await expect(page.locator('[data-slide="1"]')).toHaveClass(/is-active/);
  await page.clock.fastForward(6600);
  await expect(page.locator('[data-slide="2"]')).toHaveClass(/is-active/);
  await page.clock.fastForward(6600);
  await expect(page.locator('[data-slide="3"]')).toHaveClass(/is-active/);
  await expect(
    page.locator(
      ".hero-motto, .image-note, .slide-dot span, .hero-category-grid span",
    ),
  ).toHaveCount(0);
  await expect(page.locator(".hero-image")).toHaveCount(4);
});

test("selected category content sits right of its image on desktop and stacks on mobile", async ({
  page,
}) => {
  for (const category of ["elevators", "escalators", "fabrication"]) {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.locator('[data-filter="' + category + '"]').click();
    const card = page.locator(
      '.product-card[data-category="' + category + '"]',
    );
    const desktop = await card.evaluate((node) => ({
      image: node.querySelector("img").getBoundingClientRect().toJSON(),
      heading: node.querySelector("h3").getBoundingClientRect().toJSON(),
      button: node
        .querySelector("[data-product]")
        .getBoundingClientRect()
        .toJSON(),
    }));
    expect(desktop.heading.left).toBeGreaterThan(desktop.image.right);
    expect(desktop.button.left).toBeGreaterThan(desktop.image.right);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await card.evaluate((node) => ({
      image: node.querySelector("img").getBoundingClientRect().toJSON(),
      heading: node.querySelector("h3").getBoundingClientRect().toJSON(),
    }));
    expect(mobile.heading.top).toBeGreaterThanOrEqual(mobile.image.bottom);
    await page.locator('[data-filter="all"]').click();
  }
});

test("capture review screenshots", async ({ page }) => {
  await expect(page.locator(".brand-intro")).toBeHidden();
  await page.setViewportSize({ width: 1366, height: 650 });
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
});
