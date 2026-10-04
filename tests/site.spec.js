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
  expect(images.length).toBeGreaterThan(10);
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
  await expect(page.locator(".hero-slide[inert]")).toHaveCount(2);
});

test("filters and every product enquiry preselect the matching solution", async ({
  page,
}) => {
  for (const [category, count] of [
    ["elevators", 3],
    ["escalators", 2],
    ["fabrication", 1],
    ["all", 6],
  ]) {
    await page.locator(`[data-filter="${category}"]`).click();
    await expect(page.locator(".product-card:not([hidden])")).toHaveCount(
      count,
    );
  }
  for (const card of await page.locator(".product-card").all()) {
    const title = (await card.locator("h3").innerText())
      .replace(/\s+/g, " ")
      .trim();
    await card.locator(".product-image").click();
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
  for (const width of [360, 390, 768, 1440]) {
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
  await page.locator("#service").selectOption("Cabin interiors");
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
  expect(url.searchParams.get("text")).toContain("Solution: Cabin interiors");
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
  expect(
    await page.locator("#brandFilm").evaluate((video) => video.duration),
  ).toBe(9);
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
  expect(mobile.imageHeight / mobile.heroHeight).toBeGreaterThan(0.4);
  expect(mobile.imageHeight / mobile.heroHeight).toBeLessThan(0.5);
  await expect(page.locator(".brand-wordmark")).toHaveText(/SKYLARK/);
});

test("all six product cards use distinct, category-relevant media", async ({
  page,
}) => {
  const sources = await page
    .locator(".product-card img")
    .evaluateAll((images) => images.map((image) => image.getAttribute("src")));
  expect(new Set(sources).size).toBe(6);
  expect(sources).toEqual([
    "images/cabin.webp",
    "images/entrance.webp",
    "images/escalator-design.webp",
    "images/finishes.webp",
    "images/guards.webp",
    "images/metalwork.webp",
  ]);
});

test("capture review screenshots", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
});
