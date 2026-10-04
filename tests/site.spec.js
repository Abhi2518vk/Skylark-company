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
  await expect(page.locator("#slidePause")).toHaveAttribute(
    "aria-label",
    "Play slideshow",
  );
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
    const title = (await button.innerText()).replace("↗", "").trim();
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
  expect(url.origin + url.pathname).toBe("https://wa.me/917054929356");
  expect(url.searchParams.get("text")).toContain("Solution: Cabin Interiors");
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

test("film actually decodes and advances, and pauses when its dialog closes", async ({
  page,
}) => {
  await page.locator("#openFilm").click();
  await expect(page.locator("#filmDialog")).toBeVisible();
  await page.waitForFunction(
    () => document.querySelector("#brandFilm").currentTime > 0.1,
  );
  const duration = await page
    .locator("#brandFilm")
    .evaluate((video) => video.duration);
  expect(duration).toBeGreaterThan(8.9);
  expect(duration).toBeLessThan(9.2);
  await page.keyboard.press("Escape");
  await expect(page.locator("#brandFilm")).toHaveJSProperty("paused", true);
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
});

test("refined layout preserves an explicit desktop frame and mobile image-first hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const desktop = await page
    .locator(".hero-image")
    .first()
    .evaluate((image) => ({
      pageWidth: window.innerWidth,
      imageWidth: image.getBoundingClientRect().width,
      heroWidth: image.closest(".hero").getBoundingClientRect().width,
    }));
  expect(desktop.imageWidth / desktop.heroWidth).toBeGreaterThan(0.5);
  expect(desktop.imageWidth / desktop.heroWidth).toBeLessThan(0.6);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page
    .locator(".hero-image")
    .first()
    .evaluate((image) => ({
      imageHeight: image.getBoundingClientRect().height,
      heroHeight: image.closest(".hero").getBoundingClientRect().height,
    }));
  expect(mobile.imageHeight / mobile.heroHeight).toBeGreaterThan(0.35);
  expect(mobile.imageHeight / mobile.heroHeight).toBeLessThan(0.4);
  await expect(page.locator(".brand-wordmark")).toHaveText(/SKYLARK/);
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
    await expect(page.locator("#previewToggle")).toHaveText("Pause preview");
    await page.locator("#home").scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("paused", true);
    await page.locator("#film").scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("paused", false);
    await page.locator("#previewToggle").click();
    await expect(video).toHaveJSProperty("paused", true);
    await page.locator("#home").scrollIntoViewIfNeeded();
    await page.locator("#film").scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("paused", true);
    await page.locator("#previewToggle").click();
    await expect(video).toHaveJSProperty("paused", false);
    await page.locator("#openFilm").click();
    await expect(video).toHaveJSProperty("paused", true);
    await page.keyboard.press("Escape");
    await expect(video).toHaveJSProperty("paused", false);
  });
}

test("reduced motion keeps preview still but manual play remains available", async ({
  page,
}) => {
  await page.locator("#film").scrollIntoViewIfNeeded();
  await expect(page.locator("#filmPreview")).toHaveJSProperty("paused", true);
  await page.locator("#previewToggle").click();
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
  await page.locator("#film").scrollIntoViewIfNeeded();
  await expect(page.locator("#previewToggle")).toHaveText("Play preview");
  await page.evaluate(() => {
    delete document.querySelector("#filmPreview").play;
  });
  await page.locator("#previewToggle").click();
  await expect(page.locator("#filmPreview")).toHaveJSProperty("paused", false);
});

test("capture review screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 650 });
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
});
