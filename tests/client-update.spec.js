import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";

const saudiWhatsapp = "https://wa.me/966562993497";
const locationUrl = "https://maps.google.com/?q=24.641026,46.780247";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("client cabin gallery contains six distinct optimized images with provenance", async ({
  page,
}) => {
  const gallery = page.locator(".cabin-gallery");
  const images = gallery.locator("img");
  await expect(images).toHaveCount(6);
  const sources = [];
  const hashes = [];
  let bytes = 0;
  for (const image of await images.all()) {
    const source = await image.getAttribute("src");
    sources.push(source);
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((node) => node.decode());
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).not.toHaveAttribute("alt", "");
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveJSProperty("naturalWidth", 960);
    const response = await page.request.get(source);
    expect(response.ok()).toBe(true);
    const body = await response.body();
    bytes += body.length;
    hashes.push(createHash("sha256").update(body).digest("hex"));
    expect(body.length).toBeLessThan(150_000);
  }
  expect(new Set(sources).size).toBe(6);
  expect(new Set(hashes).size).toBe(6);
  expect(bytes).toBeLessThan(600_000);
  await expect(gallery).toContainText(
    "not a verified Skylark project portfolio",
  );
  await page.goto("/credits.html");
  const credit = page.locator('[data-source="client"]');
  expect((await credit.getAttribute("data-image")).split(" ").sort()).toEqual(
    sources.sort(),
  );
  await expect(credit).toContainText("not been independently verified");
});

test("cabin gallery follows product filters without altering product counts", async ({
  page,
}) => {
  for (const [category, visible, count] of [
    ["elevators", true, 7],
    ["escalators", false, 3],
    ["fabrication", false, 1],
    ["all", true, 11],
  ]) {
    await page.locator(`[data-filter="${category}"]`).click();
    await expect(page.locator(".cabin-gallery")).toBeVisible({ visible });
    await expect(page.locator("#productCount")).toHaveText(
      `${count} product${count === 1 ? "" : "s"}`,
    );
  }
});

test("all website WhatsApp links use the supplied Saudi number and maps preserve the exact pin", async ({
  page,
}) => {
  const whatsappLinks = page.locator('a[href^="https://wa.me/"]');
  await expect(whatsappLinks).toHaveCount(4);
  for (const link of await whatsappLinks.all()) {
    await expect(link).toHaveAttribute("href", saudiWhatsapp);
  }
  const mapLinks = page.locator('a[href^="https://maps.google.com/"]');
  await expect(mapLinks).toHaveCount(2);
  for (const link of await mapLinks.all()) {
    await expect(link).toHaveAttribute("href", locationUrl);
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(page.locator('a[href="tel:+966562993497"]')).toHaveCount(2);
  await expect(page.locator('a[href="tel:+917054929356"]')).toHaveCount(1);
  const svg = await (
    await page.request.get("/images/contact-region.svg")
  ).text();
  const marker = await page.evaluate((text) => {
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const dot = doc.querySelector('circle[r="6"]');
    return {
      x: Number(dot.getAttribute("cx")),
      y: Number(dot.getAttribute("cy")),
    };
  }, svg);
  expect(marker.x).toBeCloseTo(((46.780247 - 25) / 72) * 1000, 0);
  expect(marker.y).toBeCloseTo(((44 - 24.641026) / 40) * 500, 0);
  const remoteLoads = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => /maps\.google\.com|wa\.me/.test(entry.name)),
  );
  expect(remoteLoads).toEqual([]);
});

test("gallery stays within phone tablet and desktop bounds", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(".cabin-gallery").scrollIntoViewIfNeeded();
    for (const figure of await page.locator(".cabin-gallery figure").all()) {
      const box = await figure.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    if ([390, 1366].includes(width)) {
      for (const image of await page.locator(".cabin-gallery img").all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((node) => node.decode());
      }
      await page
        .locator(".cabin-gallery")
        .screenshot({ path: `artifacts/client-cabins-${width}.png` });
    }
  }
});

test("client images and Saudi contact links remain usable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await expect(page.locator(".cabin-gallery")).toBeVisible();
    await expect(page.locator(".cabin-gallery img")).toHaveCount(6);
    await expect(page.locator("noscript a")).toHaveAttribute(
      "href",
      saudiWhatsapp,
    );
    await expect(
      page.getByRole("link", { name: "View location on Google Maps" }),
    ).toHaveAttribute("href", locationUrl);
  } finally {
    await context.close();
  }
});
