import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

vi.mock("../services/order-service", () => ({
  checkout: vi.fn(),
  listOrders: vi.fn(),
  getAdminSummary: vi.fn()
}));

vi.mock("../middleware/auth", async () => {
  const actual = await vi.importActual<typeof import("../middleware/auth.js")>("../middleware/auth.js");
  return {
    ...actual,
    requireRole:
      () =>
      (req: { user?: { id: number; email: string; role: "user" | "admin" } }, _res: unknown, next: () => void) => {
        req.user = {
          id: 8,
          email: "shopper@example.com",
          role: "admin"
        };
        next();
      }
  };
});

const { checkout, getAdminSummary, listOrders } = await import("../services/order-service.js");

describe("order routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a checkout order", async () => {
    vi.mocked(checkout).mockResolvedValue({
      id: 1,
      userId: 8,
      userEmail: "shopper@example.com",
      total: 99,
      status: "paid",
      paymentMode: "success",
      failureReason: null,
      createdAt: new Date().toISOString(),
      items: []
    });

    const response = await request(createApp()).post("/checkout").send({
      items: [{ productId: 1, quantity: 1 }]
    });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("paid");
  });

  it("lists a user's orders", async () => {
    vi.mocked(listOrders).mockResolvedValue([]);

    const response = await request(createApp()).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns an admin summary", async () => {
    vi.mocked(getAdminSummary).mockResolvedValue({
      totalOrders: 5,
      paidOrders: 4,
      failedOrders: 1,
      revenue: 320,
      throughputByDay: []
    });

    const response = await request(createApp()).get("/admin/orders/summary");

    expect(response.status).toBe(200);
    expect(response.body.totalOrders).toBe(5);
  });
});
