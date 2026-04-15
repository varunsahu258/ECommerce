import { afterEach, describe, expect, it } from "vitest";
import { Builder, By, until, WebDriver } from "selenium-webdriver";

const seleniumUrl = process.env.SELENIUM_GRID_URL ?? "http://localhost:4444/wd/hub";
const defaultBaseUrls = ["http://localhost:30080", "http://host.docker.internal:30080", "http://localhost:5173", "http://host.docker.internal:5173", "http://ecommerce.local"];
const baseUrls = process.env.E2E_BASE_URL ? [process.env.E2E_BASE_URL] : defaultBaseUrls;
const strictSelenium = process.env.RUN_SELENIUM_SMOKE_STRICT === "1";

let driver: WebDriver | undefined;

const createDriver = async (): Promise<WebDriver | undefined> => {
  try {
    driver = await new Builder().forBrowser("chrome").usingServer(seleniumUrl).build();
    return driver;
  } catch (error) {
    if (!strictSelenium) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[selenium-smoke] Selenium Grid unreachable at ${seleniumUrl}: ${errorMessage}`);
      return undefined;
    }

    throw error;
  }
};

const navigateWithFallback = async (browser: WebDriver, path = "/"): Promise<boolean> => {
  const connectionErrors: string[] = [];

  for (const baseUrl of baseUrls) {
    const targetUrl = new URL(path, baseUrl).toString();
    try {
      await browser.get(targetUrl);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      connectionErrors.push(`${targetUrl} -> ${errorMessage}`);
      const isConnectionError = /ERR_CONNECTION_REFUSED|net::ERR_|ECONNREFUSED/i.test(errorMessage);

      if (!isConnectionError) {
        throw error;
      }
    }
  }

  const message = `Unable to open app in Selenium browser. Tried: ${connectionErrors.join(" | ")}. Set E2E_BASE_URL to a browser-reachable URL.`;

  if (!strictSelenium) {
    // In demo/local setups this commonly means app URL is not up yet.
    // Keep selenium command non-blocking unless caller requests strict mode.
    console.warn(`[selenium-smoke] ${message}`);
    return false;
  }

  throw new Error(message);
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
    if (!browser) {
      return;
    }

    await navigateWithFallback(browser);
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
  }, 30000);

  it.skipIf(!ready)("shows a visible failed-checkout path", async () => {
    const browser = await createDriver();
    if (!browser) {
      return;
    }

    await navigateWithFallback(browser, "/login");
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
  }, 30000);
});
