// Monkey actions. Each action performs one random interaction on the page and returns what it did,
// or { skipped: "reason" } when there is nothing to act on. Use the seeded `faker` it receives for
// every random choice, so the same seed always produces the same sequence of events.
export const actions = {
  async clickLink(page, { faker, origin }) {
    const links = await page.locator("a[href]").evaluateAll(
      (anchors, appOrigin) =>
        anchors
          .map((anchor, index) => ({ index, href: anchor.href, visible: anchor.checkVisibility() }))
          .filter((link) => link.visible && new URL(link.href).origin === appOrigin),
      origin,
    );
    if (links.length === 0) return { skipped: "no hay enlaces visibles" };
    const link = faker.helpers.arrayElement(links);
    await page.locator("a[href]").nth(link.index).click();
    return { target: link.href };
  },
};
