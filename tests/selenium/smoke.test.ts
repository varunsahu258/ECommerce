import { afterEach, describe, expect, it } from "vitest";
import { Builder, By, until, WebDriver } from "selenium-webdriver";

const seleniumUrl = process.env.SELENIUM_GRID_URL ?? "http://localhost:4444/wd/hub";
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:30080";

let driver: WebDriver | undefined;

const createDriver = async () => {
  driver = await new Builder().forBrowser("chrome").usingServer(seleniumUrl).build();
  return driver;
};

const ready = Boolean(process.env.RUN_SELENIUM_SMOKE);

describe("selenium smoke flows", () => {
  afterEach(async () => {
    if (driver) {
      await driver.quit();
      driver = undefined;
    }
  });

  it.skipIf(!ready)("completes login -> add to cart -> checkout success", async () => {
    const browser = await createDriver();

    await browser.get(baseUrl);
    await browser.findElement(By.linkText("Login")).click();
    await browser.findElement(By.css("input[type='email']")).clear();
    await browser.findElement(By.css("input[type='email']")).sendKeys("admin@demo.local");
    await browser.findElement(By.css("input[type='password']")).clear();
    await browser.findElement(By.css("input[type='password']")).sendKeys("Admin1234!");
    await browser.findElement(By.css("button[type='submit']")).click();

    await browser.wait(until.elementLocated(By.linkText("View details")), 10000);
    await browser.findElement(By.linkText("View details")).click();
    await browser.findElement(By.css(".detail-actions .button")).click();
    await browser.findElement(By.partialLinkText("Cart")).click();
    await browser.findElement(By.linkText("Continue to checkout")).click();
    await browser.findElement(By.css("button[type='submit']")).click();

    const successBanner = await browser.wait(until.elementLocated(By.css(".success-banner")), 10000);
    expect(await successBanner.getText()).toContain("completed successfully");
  });

  it.skipIf(!ready)("shows a visible failed-checkout path", async () => {
    const browser = await createDriver();

    await browser.get(`${baseUrl}/login`);
    await browser.findElement(By.css("input[type='email']")).clear();
    await browser.findElement(By.css("input[type='email']")).sendKeys("admin@demo.local");
    await browser.findElement(By.css("input[type='password']")).clear();
    await browser.findElement(By.css("input[type='password']")).sendKeys("Admin1234!");
    await browser.findElement(By.css("button[type='submit']")).click();

    await browser.wait(until.elementLocated(By.linkText("View details")), 10000);
    await browser.findElement(By.linkText("View details")).click();
    await browser.findElement(By.css(".detail-actions .button")).click();
    await browser.findElement(By.partialLinkText("Cart")).click();
    await browser.findElement(By.linkText("Continue to checkout")).click();
    await browser.findElement(By.css("select")).sendKeys("Force failure");
    await browser.findElement(By.css("button[type='submit']")).click();

    const failureBanner = await browser.wait(until.elementLocated(By.css(".error-banner")), 10000);
    expect(await failureBanner.getText()).toContain("Checkout failed intentionally");
  });
});
