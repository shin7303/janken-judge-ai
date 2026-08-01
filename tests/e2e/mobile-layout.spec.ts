import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
] as const;

const routes = ["/", "/settings", "/play", "/history"];

test("primary screens stay usable at adversarial mobile sizes", async ({
  page,
}) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);

      const widths = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(
        widths.content,
        `${route} at ${viewport.width}px`,
      ).toBeLessThanOrEqual(widths.viewport);

      const headerLinks = page.locator("header a, nav a");
      for (let index = 0; index < (await headerLinks.count()); index += 1) {
        const box = await headerLinks.nth(index).boundingBox();
        expect(box?.height, `tap target on ${route}`).toBeGreaterThanOrEqual(
          44,
        );
      }
    }
  }
});

test("the portrait play screen fits its essential UI in one viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play");

  const dimensions = await page.evaluate(() => ({
    pageHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));
  expect(dimensions.pageHeight).toBeLessThanOrEqual(dimensions.viewportHeight);
});
