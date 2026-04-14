import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp as createAuthApp } from "../../services/auth-service/src/app";
import { createApp as createProductApp } from "../../services/product-service/src/app";
import { createApp as createOrderApp } from "../../services/order-service/src/app";

describe("health and metrics surfaces", () => {
  it("exposes health checks for all services", async () => {
    const [auth, product, order] = await Promise.all([
      request(createAuthApp()).get("/healthz"),
      request(createProductApp()).get("/healthz"),
      request(createOrderApp()).get("/healthz")
    ]);

    expect(auth.status).toBe(200);
    expect(product.status).toBe(200);
    expect(order.status).toBe(200);
  });

  it("exposes metrics for all services", async () => {
    const auth = await request(createAuthApp()).get("/metrics");
    const product = await request(createProductApp()).get("/metrics");
    const order = await request(createOrderApp()).get("/metrics");

    expect(auth.text).toContain("auth_service_http_requests_total");
    expect(product.text).toContain("product_service_http_requests_total");
    expect(order.text).toContain("order_service_http_requests_total");
  });
});

