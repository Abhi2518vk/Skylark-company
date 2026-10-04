import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
});

test("company values and technical explanation have no decorative numbering", async ({
  page,
}) => {
  await expect(page.locator("#company .lead")).toContainText("Saudi Arabia");
  await expect(page.locator(".principles article")).toHaveCount(3);
  for (const name of ["OUR VISION", "OUR MISSION", "OUR VALUES"]) {
    await expect(
      page.locator(".principles").getByText(name, { exact: true }),
    ).toBeVisible();
  }
  for (const label of await page.locator(".eyebrow").allTextContents()) {
    expect(label.trim()).not.toMatch(/^\d+\s*\//);
  }
  await expect(page.locator(".service-index")).toHaveCount(0);
  await expect(page.locator("#services")).toContainText(
    "moving-part clearances",
  );
  await expect(page.locator("#services")).toContainText(
    "responsible project professionals",
  );
  await expect(page.locator("#film")).not.toContainText("Five seconds of");
});

test("each product has its own relevant deployed illustration or photograph", async ({
  page,
}) => {
  const sources = [];
  for (const button of await page.locator("[data-product]").all()) {
    const source = await button.getAttribute("data-product-image");
    sources.push(source);
    const response = await page.request.get(source);
    expect(response.ok(), source).toBeTruthy();
    await button.click();
    const image = page.locator("#dialogImage");
    await expect(image).toHaveAttribute("src", source);
    await expect(image).not.toHaveAttribute("alt", "");
    await image.evaluate((node) => node.decode());
    if (source.endsWith(".svg")) {
      expect(response.headers()["content-type"]).toContain("image/svg+xml");
      await expect(image).toHaveClass(/is-illustration/);
      await expect(page.locator("#dialogImageNote")).toContainText(
        "not a fabrication drawing",
      );
    } else {
      await expect(image).not.toHaveClass(/is-illustration/);
      await expect(page.locator("#dialogImageNote")).toContainText(
        "not a completed Skylark project",
      );
    }
    await page.getByRole("button", { name: "Close product details" }).click();
  }
  expect(new Set(sources).size).toBe(11);
  await page.goto("/credits.html");
  const credited = await page
    .locator("[data-artwork]")
    .getAttribute("data-artwork");
  expect(credited.split(" ").sort()).toEqual(
    sources.filter((src) => src.endsWith(".svg")).sort(),
  );
});

test("contact map distinguishes company country from telephone contact", async ({
  page,
}) => {
  await expect(page.locator(".company-location strong")).toHaveText(
    "Saudi Arabia",
  );
  const map = page.locator(".contact-map");
  await expect(map).toContainText("Saudi Arabia — company location");
  await expect(map).toContainText("India — +91 contact number");
  await expect(map).toContainText("not street addresses");
  const mapImage = map.locator("img");
  await expect(mapImage).toHaveAttribute("src", "images/contact-region.svg");
  await expect(mapImage).not.toHaveAttribute("loading", "lazy");
  await expect(mapImage).toHaveJSProperty("complete", true);
  await expect(mapImage).toHaveJSProperty("naturalWidth", 800);
  const response = await page.request.get("/images/contact-region.svg");
  expect(response.ok()).toBeTruthy();
  const svg = await response.text();
  expect(svg).toContain("Saudi Arabia");
  expect(svg).toContain("India");
  expect(svg).not.toMatch(/<script|https?:\/\/(?!www\.w3\.org)/);
  for (const width of [320, 390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await map.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  await page.goto("/credits.html");
  await expect(page.locator("[data-map]")).toContainText(
    "Original schematic locator",
  );
});

test("company and business email validate before preparing an enquiry", async ({
  page,
}) => {
  await page.evaluate(() => {
    window.openedEnquiry = null;
    window.open = (url) => {
      window.openedEnquiry = url;
      return null;
    };
  });
  await page.locator("#fullName").fill("Client Test");
  await page.locator("#phone").fill("+91 70549 29356");
  await page.locator("#service").selectOption("Architraves");
  await page
    .locator("#message")
    .fill("Architrave enquiry for a project in Saudi Arabia.");
  await page.locator('[name="consent"]').check();
  await page.locator(".submit-button").click();
  expect(
    await page
      .locator("#companyName")
      .evaluate((node) => node.validity.valueMissing),
  ).toBe(true);
  expect(await page.evaluate(() => window.openedEnquiry)).toBeNull();
  await page.locator("#companyName").fill("   ");
  await page.locator("#businessEmail").fill("info@skylark-sa.com");
  await page.locator(".submit-button").click();
  await expect(page.locator("#companyName")).toHaveJSProperty(
    "validationMessage",
    "Please enter your company name.",
  );
  await page.locator("#companyName").fill("Design Team");
  await page.locator("#businessEmail").fill("not-an-email");
  await page.locator(".submit-button").click();
  expect(
    await page
      .locator("#businessEmail")
      .evaluate((node) => node.validity.typeMismatch),
  ).toBe(true);
  expect(await page.evaluate(() => window.openedEnquiry)).toBeNull();
  await page.locator("#businessEmail").fill("info@skylark-sa.com");
  await page.locator(".submit-button").click();
  const prepared = new URL(
    await page.locator("#whatsappFallback").getAttribute("href"),
  );
  expect(prepared.searchParams.get("text")).toContain("Company: Design Team");
  expect(prepared.searchParams.get("text")).toContain(
    "Business email: info@skylark-sa.com",
  );
  await expect(page.locator("#formStatus")).toContainText("not sent");
  await page.locator("#businessEmail").fill("info+updated@skylark-sa.com");
  await expect(page.locator("#whatsappFallback")).toBeHidden();
});

test("logo introduction fades out without JavaScript or waiting for video", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  try {
    await page.route(/\.(mp4|webm)$/, (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const intro = page.locator(".brand-intro");
    await expect(intro).toHaveAttribute("aria-hidden", "true");
    await expect(intro).toHaveCSS("pointer-events", "none");
    await expect(intro).toHaveCSS("animation-duration", "1.1s");
    await expect(intro).toBeHidden();
    await page.getByRole("link", { name: "Explore our solutions" }).click();
    await expect(page).toHaveURL(/#products$/);
  } finally {
    await context.close();
  }
});

test("logo introduction is skipped for reduced motion and keyboard focus", async ({
  page,
}) => {
  await expect(page.locator(".brand-intro")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await expect(page.locator(".brand-intro")).toBeHidden();
});
