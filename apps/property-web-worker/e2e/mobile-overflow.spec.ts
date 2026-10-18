import { expect, test, type Page } from "@playwright/test";

const routes = ["/", "/projects", "/projects/eaton-park", "/compare", "/map", "/blog", "/tools", "/admin"];

async function documentOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const rail = document.querySelector(".home-project-rail");
    const railBox = rail?.getBoundingClientRect();
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      railLeft: railBox?.left ?? null,
      railRight: railBox?.right ?? null,
    };
  });
}

for (const width of [390, 414]) {
  test.describe(`mobile width ${width}`, () => {
    test.use({ viewport: { width, height: 844 } });

    for (const path of routes) {
      test(`${path} does not overflow horizontally`, async ({ page }) => {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        if (path === "/") {
          await page.locator(".home-project-rail").waitFor();
        } else {
          await page.locator(".site-main").waitFor();
        }
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        );
        const box = await documentOverflow(page);
        expect(box.scrollWidth, `${path} scrollWidth`).toBeLessThanOrEqual(box.clientWidth);
        if (path === "/") {
          expect(box.railLeft).toBeGreaterThanOrEqual(-1);
          expect(box.railRight).toBeLessThanOrEqual(width + 1);
          await page.locator(".home-project-rail").evaluate((el) => {
            el.scrollLeft = el.scrollWidth;
          });
          await page.locator(".nav-toggle").click();
          const after = await documentOverflow(page);
          expect(after.scrollWidth, `${path} after rail scroll`).toBeLessThanOrEqual(after.clientWidth);
        }
      });
    }
  });
}
