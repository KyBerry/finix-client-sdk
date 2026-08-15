import { expect, test, type FrameLocator, type Locator, type Page } from "@playwright/test";

const officialScriptUrl = "https://js.finix.com/v/2/finix.js";
const mountSelector = "#finix-payment-form";
const iframeSelector = `${mountSelector} iframe`;

const fieldLabels = [
  "Canary cardholder name",
  "Canary card number",
  "Canary expiration",
  "Canary security code",
] as const;

async function openCanary(page: Page): Promise<FrameLocator> {
  const scriptResponsePromise = page.waitForResponse((response) => response.url() === officialScriptUrl);
  await page.goto("/");

  const scriptResponse = await scriptResponsePromise;
  expect(scriptResponse.ok()).toBe(true);
  await expect(page.locator(`script[src="${officialScriptUrl}"]`)).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("data-finix-instance", "created");
  await expect(page.locator("html")).not.toHaveAttribute("data-finix-error", /.+/);
  await expect(page.locator(iframeSelector)).toHaveCount(1);

  const iframeSource = await page.locator(iframeSelector).getAttribute("src");
  expect(iframeSource).not.toBeNull();
  if (iframeSource === null) {
    throw new Error("Finix PaymentForm iframe did not expose a source URL.");
  }
  expect(new URL(iframeSource).origin).toBe("https://js.finix.com");

  await expect(page.locator("html")).toHaveAttribute("data-finix-on-load-count", "1");
  return page.frameLocator(iframeSelector);
}

async function expectCardFields(frame: FrameLocator): Promise<Record<(typeof fieldLabels)[number], Locator>> {
  const fields = {
    "Canary cardholder name": frame.getByLabel("Canary cardholder name", { exact: true }),
    "Canary card number": frame.getByLabel("Canary card number", { exact: true }),
    "Canary expiration": frame.getByLabel("Canary expiration", { exact: true }),
    "Canary security code": frame.getByLabel("Canary security code", { exact: true }),
  } satisfies Record<(typeof fieldLabels)[number], Locator>;

  for (const label of fieldLabels) {
    await expect(fields[label]).toBeVisible();
  }
  return fields;
}

async function readStyle(locator: Locator, propertyName: string): Promise<string> {
  return locator.evaluate(
    (element, property) => getComputedStyle(element).getPropertyValue(property),
    propertyName,
  );
}

async function expectContained(page: Page): Promise<void> {
  const mountBox = await page.locator(mountSelector).boundingBox();
  const iframeBox = await page.locator(iframeSelector).boundingBox();

  expect(mountBox).not.toBeNull();
  expect(iframeBox).not.toBeNull();
  if (mountBox === null || iframeBox === null) {
    throw new Error("Finix canary could not measure the payment-form container.");
  }

  expect(iframeBox.x).toBeGreaterThanOrEqual(mountBox.x - 1);
  expect(iframeBox.x + iframeBox.width).toBeLessThanOrEqual(mountBox.x + mountBox.width + 1);
  expect(iframeBox.width).toBeLessThanOrEqual(page.viewportSize()?.width ?? iframeBox.width);

  const outerOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(outerOverflow).toBeLessThanOrEqual(1);
}

test("@desktop loads the documented v2 form and exposes lifecycle callbacks", async ({ page }) => {
  const frame = await openCanary(page);
  const fields = await expectCardFields(frame);
  const cardNumber = fields["Canary card number"];

  await expect.poll(() => readStyle(cardNumber, "background-color")).toBe("rgb(234, 242, 255)");
  await expect.poll(() => readStyle(cardNumber, "border-top-color")).toBe("rgb(36, 94, 168)");

  const updatesBeforeFocus = Number(
    (await page.locator("html").getAttribute("data-finix-on-update-count")) ?? "0",
  );
  await cardNumber.focus();

  await expect.poll(() => readStyle(cardNumber, "border-top-color")).toBe("rgb(209, 44, 122)");
  await expect
    .poll(async () => Number((await page.locator("html").getAttribute("data-finix-on-update-count")) ?? "0"))
    .toBeGreaterThan(updatesBeforeFocus);
  await expect(page.locator("html")).toHaveAttribute("data-finix-state-type", "object");
  await expect(page.locator("html")).toHaveAttribute("data-finix-bin-type", "object");
  await expect(page.locator("html")).toHaveAttribute("data-finix-has-errors-type", "boolean");

  await expectContained(page);
});

test("@mobile applies dark overrides and remains horizontally contained", async ({ page }) => {
  const frame = await openCanary(page);
  const fields = await expectCardFields(frame);
  const cardNumber = fields["Canary card number"];

  await expect.poll(() => readStyle(cardNumber, "background-color")).toBe("rgb(20, 33, 61)");
  await expect.poll(() => readStyle(cardNumber, "border-top-color")).toBe("rgb(79, 209, 197)");
  await expectContained(page);
});
