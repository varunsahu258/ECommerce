#!/usr/bin/env python3
"""Basic Selenium web scraping smoke check for the storefront."""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


@dataclass
class ScrapeSummary:
    base_url: str
    title: str
    heading: str
    product_count: int


def build_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,1000")
    return webdriver.Chrome(options=options)


def scrape_homepage(driver: webdriver.Chrome, base_urls: list[str]) -> ScrapeSummary:
    connection_errors: list[str] = []

    for base_url in base_urls:
        try:
            driver.get(base_url)
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))

            page_title = driver.title.strip()
            heading = ""
            for selector in ("h1", "[data-testid='page-title']", ".hero-title"):
                found = driver.find_elements(By.CSS_SELECTOR, selector)
                if found:
                    heading = found[0].text.strip()
                    break

            product_count = len(
                driver.find_elements(By.CSS_SELECTOR, ".product-card, [data-testid='product-card'], .catalog-grid > *")
            )

            if not page_title:
                raise RuntimeError("Page title is empty. Frontend may not have loaded correctly.")

            return ScrapeSummary(base_url=base_url, title=page_title, heading=heading, product_count=product_count)
        except WebDriverException as exc:
            message = str(exc).splitlines()[0]
            if "ERR_CONNECTION_REFUSED" in message:
                connection_errors.append(f"{base_url} -> {message}")
                continue
            raise

    raise RuntimeError(
        "Unable to open storefront in Selenium browser. Tried: "
        + " | ".join(connection_errors)
        + ". Set E2E_BASE_URL to a reachable URL."
    )


def verify_login_page(driver: webdriver.Chrome, base_url: str) -> None:
    login_url = f"{base_url.rstrip('/')}/login"
    driver.get(login_url)
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))

    password_inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    submit_buttons = driver.find_elements(By.CSS_SELECTOR, "button[type='submit']")

    if not password_inputs or not submit_buttons:
        raise RuntimeError("Login page did not render expected password/submit controls.")


def main() -> int:
    default_base_urls = [
        "http://localhost:30080",
        "http://host.docker.internal:30080",
        "http://localhost:5173",
        "http://host.docker.internal:5173",
        "http://ecommerce.local",
    ]
    base_urls = [os.environ["E2E_BASE_URL"]] if os.getenv("E2E_BASE_URL") else default_base_urls
    print(f"[selenium-python] starting smoke scrape. URL candidates: {', '.join(base_urls)}")

    driver: webdriver.Chrome | None = None
    try:
        driver = build_driver()
        summary = scrape_homepage(driver, base_urls)
        verify_login_page(driver, summary.base_url)

        print("[selenium-python] scrape summary")
        print(f"  base_url: {summary.base_url}")
        print(f"  title: {summary.title}")
        print(f"  heading: {summary.heading or '(not found)'}")
        print(f"  product-card-like nodes: {summary.product_count}")
        print("[selenium-python] smoke scrape completed")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[selenium-python] failed: {exc}", file=sys.stderr)
        return 1
    finally:
        if driver is not None:
            driver.quit()


if __name__ == "__main__":
    raise SystemExit(main())
