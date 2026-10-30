import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const routes = ["/", "/games", "/discover", "/build-lab", "/news", "/community", "/locker", "/login"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];
const expectedStagingOrigin = "https://ztzcpnyxgwhcdktpbxdq.supabase.co";
const cloudSyncedMessage = "Thư viện đã được đồng bộ với tài khoản LevelUP.";

async function waitForEnabledButton(page, selector) {
  await page.waitForFunction((target) => {
    const button = document.querySelector(target);
    return button instanceof HTMLButtonElement && !button.disabled;
  }, selector, { timeout: 20_000 });
}

async function waitForCatalogResponse(page, action) {
  const responsePromise = page.waitForResponse((response) => {
    try {
      return new URL(response.url()).pathname === "/api/games" &&
        response.request().method() === "GET";
    } catch {
      return false;
    }
  }, { timeout: 20_000 });
  await action();
  const response = await responsePromise;
  assert.equal(response.status(), 200, `Catalog request returned HTTP ${response.status()}.`);
}

async function waitForCloudSync(page) {
  const syncing = page.locator(".library-sync-hint").filter({ hasText: "Đang đồng bộ" });
  await syncing.waitFor({ state: "visible", timeout: 10_000 });
  await page.getByText(cloudSyncedMessage, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });
}

async function guestLibraryJourney(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  await page.goto(`${baseUrl}/games`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const firstCard = page.locator(".game-card").first();
  await firstCard.waitFor({ state: "visible", timeout: 20_000 });
  const title = (await firstCard.locator(".game-card-cover-copy h3").innerText()).trim();
  const gameHref = await firstCard.locator("a.game-card-link").getAttribute("href");
  const gameSlug = gameHref?.split("/").filter(Boolean).at(-1);
  assert.ok(title && gameSlug, "The seeded/staging catalog must expose a game card with a stable slug.");

  const saveButton = firstCard.locator(".library-save-btn");
  await waitForEnabledButton(page, ".game-card .library-save-btn");
  await saveButton.click();
  await page.waitForFunction(() => {
    const button = document.querySelector(".game-card .library-save-btn");
    return button?.textContent?.includes("Đã lưu") ?? false;
  }, null, { timeout: 10_000 });

  const favoriteButton = firstCard.locator(".library-favorite-btn");
  await favoriteButton.click();
  await page.waitForFunction(() => document.querySelector(".game-card .library-favorite-btn")?.getAttribute("aria-pressed") === "true", null, { timeout: 10_000 });
  assert.equal(await favoriteButton.getAttribute("aria-pressed"), "true", "Guest favorite toggle should update immediately.");
  const savedEntry = await page.evaluate((slug) => {
    try {
      const raw = localStorage.getItem("levelup:game-library:v1");
      return raw ? JSON.parse(raw)[slug] ?? null : null;
    } catch {
      return null;
    }
  }, gameSlug);
  assert.equal(savedEntry?.status, "wishlist", "Guest save should persist the wishlist status.");
  assert.equal(savedEntry?.isFavorite, true, "Guest favorite should persist in browser storage.");

  await page.goto(`${baseUrl}/locker`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const savedCard = page.locator(".game-card").filter({ hasText: title }).first();
  await savedCard.waitFor({ state: "visible", timeout: 20_000 });
  await page.locator(".locker-toolbar").getByRole("button", { name: /Yêu thích/ }).click();
  await savedCard.waitFor({ state: "visible", timeout: 10_000 });
  assert.match(await page.locator(".results-count").innerText(), /1 game trong danh sách này/i);

  await page.locator(".locker-toolbar").getByRole("button", { name: /Muốn chơi/ }).click();
  await savedCard.waitFor({ state: "visible", timeout: 10_000 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".game-card").filter({ hasText: title }).first().waitFor({ state: "visible", timeout: 20_000 });

  const isolatedPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await isolatedPage.goto(`${baseUrl}/locker`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await isolatedPage.getByRole("heading", { name: /Tủ game đang chờ tựa game đầu tiên/ })
    .waitFor({ state: "visible", timeout: 20_000 });
  await isolatedPage.close();
  await page.close();
  console.log("Guest Game Locker journey passed: save, favorite, filters, reload persistence, and isolated browser storage.");
}

async function discoveryJourney(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const initialCatalogResponse = page.waitForResponse((response) => {
    try {
      return new URL(response.url()).pathname === "/api/games" && response.request().method() === "GET";
    } catch {
      return false;
    }
  }, { timeout: 20_000 });
  await page.goto(`${baseUrl}/discover`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const initialResponse = await initialCatalogResponse;
  assert.equal(initialResponse.status(), 200, `Initial discovery catalog returned HTTP ${initialResponse.status()}.`);
  await page.locator(".discovery-studio").waitFor({ state: "visible", timeout: 20_000 });
  await page.locator(".discovery-result-grid .game-card").first().waitFor({ state: "visible", timeout: 20_000 });

  await waitForCatalogResponse(page, () => page.locator(".discovery-mode").filter({ hasText: "Competitive" }).first().click());
  const competitive = page.locator(".discovery-mode").filter({ hasText: "Competitive" }).first();
  assert.equal(await competitive.getAttribute("aria-pressed"), "true");

  const firstGenreChip = page.locator(".discovery-chip").first();
  await firstGenreChip.waitFor({ state: "visible", timeout: 10_000 });
  await waitForCatalogResponse(page, () => firstGenreChip.click());
  assert.equal(await firstGenreChip.getAttribute("aria-pressed"), "true");

  const platform = page.locator("#discovery-platform");
  const firstPlatform = await platform.locator("option").nth(1).getAttribute("value");
  assert.ok(firstPlatform, "The catalog must provide at least one platform filter.");
  await waitForCatalogResponse(page, () => platform.selectOption(firstPlatform));
  assert.equal(await platform.inputValue(), firstPlatform);

  await waitForCatalogResponse(page, () => page.locator(".discovery-panel-footer").getByRole("button", { name: /Đặt lại radar/ }).click());
  assert.equal(await platform.inputValue(), "");
  assert.equal(await page.locator(".discovery-mode[aria-pressed='true']").innerText().then((text) => text.includes("Mở mọi cánh cửa")), true);
  assert.equal(await page.locator(".discovery-chip[aria-pressed='true']").count(), 0);

  const loadMore = page.getByRole("button", { name: /Quét thêm/ });
  if (await loadMore.count()) {
    const beforeCount = Number(await page.locator(".discovery-result-counter strong").innerText());
    await waitForCatalogResponse(page, () => loadMore.click());
    await page.waitForFunction((previous) => {
      const current = Number(document.querySelector(".discovery-result-counter strong")?.textContent);
      return Number.isFinite(current) && current > previous;
    }, beforeCount, { timeout: 20_000 });
    console.log("Game Discovery pagination passed against the configured catalog.");
  } else {
    console.log("Game Discovery pagination skipped: the CI fixture catalog fits within one 48-game page; configure levelup-dev browser secrets to exercise real-catalog pagination.");
  }

  const search = page.locator(".discovery-search input");
  await waitForCatalogResponse(page, () => search.fill("valorant"));
  await page.locator(".discovery-recommendation").filter({ hasText: /VALORANT/i }).first()
    .waitFor({ state: "visible", timeout: 20_000 });
  await page.close();
  console.log("Game Discovery journey passed: mood, genre, platform, reset, and server-backed search.");
}

async function authenticatedLibraryJourney(browser) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const email = process.env.LEVELUP_E2E_EMAIL ?? "";
  const password = process.env.LEVELUP_E2E_PASSWORD ?? "";
  const hasAnyAccountCredential = Boolean(email || password);

  if (!hasAnyAccountCredential) {
    console.log("Authenticated Game Locker journey skipped: dedicated staging account secrets are not configured.");
    return;
  }

  assert.ok(url && key && email && password, "Authenticated Game Locker smoke requires staging URL, publishable key, email, and password.");
  assert.equal(new URL(url).origin, expectedStagingOrigin, "Refusing authenticated browser writes outside levelup-dev.");

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator(".auth-submit").click();
    await page.getByText("Đăng nhập thành công.", { exact: true }).waitFor({ state: "visible", timeout: 20_000 });

    await page.goto(`${baseUrl}/games`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const firstCard = page.locator(".game-card").first();
    await firstCard.waitFor({ state: "visible", timeout: 20_000 });
    const title = (await firstCard.locator(".game-card-cover-copy h3").innerText()).trim();
    const detailHref = await firstCard.locator("a.game-card-link").getAttribute("href");
    assert.ok(detailHref?.startsWith("/games/"), "A catalog card must link to a game detail page.");

    await page.goto(`${baseUrl}${detailHref}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const statusGroup = page.locator(".library-status-group");
    await statusGroup.waitFor({ state: "visible", timeout: 20_000 });
    await waitForEnabledButton(page, ".library-status-group .library-status-btn");
    await page.getByText(cloudSyncedMessage, { exact: true }).waitFor({ state: "visible", timeout: 20_000 });

    const initialPressed = statusGroup.locator(".library-status-btn[aria-pressed='true']");
    const initialStatus = (await initialPressed.count()) ? (await initialPressed.first().innerText()).trim() : null;
    const targetStatus = initialStatus === "Muốn chơi" ? "Đang chơi" : "Muốn chơi";
    await statusGroup.getByRole("button", { name: targetStatus, exact: true }).click();
    await waitForCloudSync(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await statusGroup.waitFor({ state: "visible", timeout: 20_000 });
    await waitForEnabledButton(page, ".library-status-group .library-status-btn");
    assert.equal((await page.locator(".library-status-btn[aria-pressed='true']").first().innerText()).trim(), targetStatus,
      "Signed-in library status must survive a page reload.");

    if (initialStatus) {
      await statusGroup.getByRole("button", { name: initialStatus, exact: true }).click();
    } else {
      await page.locator(".library-remove-btn").click();
    }
    await waitForCloudSync(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await statusGroup.waitFor({ state: "visible", timeout: 20_000 });
    await waitForEnabledButton(page, ".library-status-group .library-status-btn");
    if (initialStatus) {
      assert.equal((await page.locator(".library-status-btn[aria-pressed='true']").first().innerText()).trim(), initialStatus,
        "The staging account's original library status must be restored.");
    } else {
      assert.equal(await page.locator(".library-status-btn[aria-pressed='true']").count(), 0,
        "The temporary status must be removed from the dedicated staging account.");
    }

    const favorite = page.locator(".game-library-control-full .library-favorite-btn");
    const initialFavorite = (await favorite.getAttribute("aria-pressed")) === "true";
    await favorite.click();
    await waitForCloudSync(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await statusGroup.waitFor({ state: "visible", timeout: 20_000 });
    await waitForEnabledButton(page, ".library-status-group .library-status-btn");
    const toggledFavorite = page.locator(".game-library-control-full .library-favorite-btn");
    assert.equal((await toggledFavorite.getAttribute("aria-pressed")) === "true", !initialFavorite,
      "Signed-in favorite state must survive a page reload.");
    await toggledFavorite.click();
    await waitForCloudSync(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await statusGroup.waitFor({ state: "visible", timeout: 20_000 });
    await waitForEnabledButton(page, ".library-status-group .library-status-btn");
    assert.equal((await page.locator(".game-library-control-full .library-favorite-btn").getAttribute("aria-pressed")) === "true", initialFavorite,
      "The original favorite state must be restored after the test.");

    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator(".auth-signout").click();
    await page.getByText("Bạn đã đăng xuất.", { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
    console.log(`Authenticated Game Locker journey passed for the dedicated staging account (${title}); original status/favorite values restored.`);
  } finally {
    await page.close();
  }
}

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

  await guestLibraryJourney(browser);
  await discoveryJourney(browser);
  await authenticatedLibraryJourney(browser);
} finally {
  await browser.close();
}

console.log(`Browser smoke passed for ${routes.length} routes across ${viewports.length} viewport sizes.`);
