import { describe, expect, it } from "vitest";
import { coerceMoney, toSlug } from "../services/product-utils.js";

describe("product utilities", () => {
  it("creates URL-friendly slugs", () => {
    expect(toSlug("Circuit Breaker Jacket")).toBe("circuit-breaker-jacket");
  });

  it("rounds money to two decimals", () => {
    expect(coerceMoney(19.999)).toBe(20);
  });
});
