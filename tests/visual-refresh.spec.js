import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("refresh returns to Home from a section link or restored scroll position", async ({
  page,
}) => {
  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: 850 });
    for (const section of ["services", "contact"]) {
      await page.goto(`/?source=enquiry#${section}`);
      await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThan(500);
      await page.reload();
      await expect(page).toHaveURL(/\/?\?source=enquiry$/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(page.locator("#home")).toBeInViewport();
    }
    await page.goto("/");
    await page.locator("#services").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test("normal anchors and browser history still navigate to sections", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('.navigation a[href="#services"]').click();
  await expect(page).toHaveURL(/#services$/);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.locator('.navigation a[href="#services"]').click();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
  await page.goto("/credits.html");
  await page.goBack();
  await expect(page).toHaveURL(/#services$/);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
});

test("every service photo stays compact and the map section fits all screen sizes", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 390, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const service of await page.locator(".services-list details").all()) {
      if (!(await service.evaluate((node) => node.open))) {
        await service.locator("summary").click();
      }
      const image = service.locator("img");
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty("complete", true);
      expect(
        await image.evaluate((node) => node.naturalWidth),
      ).toBeGreaterThanOrEqual(960);
      const box = await image.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(160);
      expect(box.height).toBeLessThanOrEqual(220);
      expect(box.width).toBeLessThanOrEqual(width);
    }
    const locations = page.locator("#locations");
    await locations.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const item of await locations
      .locator("img, .location-cards article")
      .all()) {
      const box = await item.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
});

test("capture refreshed service and location sections", async ({ page }) => {
  await page.goto("/");
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const services = page.locator("#services");
    await services.scrollIntoViewIfNeeded();
    await services
      .locator("details[open] img")
      .evaluate((node) => node.decode());
    await services.screenshot({ path: `artifacts/services-${width}.png` });
    const locations = page.locator("#locations");
    await locations.scrollIntoViewIfNeeded();
    await expect(locations.locator("img")).toHaveJSProperty(
      "naturalWidth",
      1000,
    );
    await locations.screenshot({ path: `artifacts/locations-${width}.png` });
  }
});
