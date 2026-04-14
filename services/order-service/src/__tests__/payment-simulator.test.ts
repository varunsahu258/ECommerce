import { describe, expect, it } from "vitest";
import { simulatePayment } from "../services/payment-simulator.js";

describe("payment simulator", () => {
  it("always succeeds in success mode", () => {
    expect(simulatePayment("success").success).toBe(true);
  });

  it("always fails in failure mode", () => {
    const result = simulatePayment("failure");
    expect(result.success).toBe(false);
    expect(result.failureReason).toMatch(/Simulated payment failure/);
  });
});
