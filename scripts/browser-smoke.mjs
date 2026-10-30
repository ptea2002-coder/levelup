import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const routes = ["/", "/games", "/discover", "/build-lab", "/news", "/community", "/locker", "/login"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const route of routes) {
      pageErrors.length = 0;
      const response = await page.goto(`${baseUrl}${route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      assert.ok(response, `${route} at ${viewport.name}: navigation returned no response.`);
      assert.ok(
        response.status() < 400,
        `${route} at ${viewport.name}: HTTP ${response.status()}.`,
      );
      await page.locator("body").waitFor();
      await page.waitForTimeout(200);

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert.equal(
        hasHorizontalOverflow,
        false,
        `${route} at ${viewport.width}px has horizontal page overflow.`,
      );
      assert.deepEqual(
        pageErrors,
        [],
        `${route} at ${viewport.name} raised browser runtime errors: ${pageErrors.join("; ")}`,
      );
    }

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`Browser smoke passed for ${routes.length} routes across ${viewports.length} viewport sizes.`);
