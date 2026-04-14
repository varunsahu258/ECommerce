import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/auth-service/src/services/user-service", () => ({
  ServiceError: class ServiceError extends Error {
    constructor(
      message: string,
      public statusCode: number
    ) {
      super(message);
    }
  },
  registerUser: vi.fn(),
  loginUser: vi.fn()
}));

vi.mock("../../services/product-service/src/services/product-service", () => ({
  listProducts: vi.fn(),
  getProductById: vi.fn(),
  getInventorySnapshot: vi.fn(),
  reserveInventory: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn()
}));

vi.mock("../../services/order-service/src/services/order-service", () => ({
  checkout: vi.fn(),
  listOrders: vi.fn(),
  getAdminSummary: vi.fn()
}));

vi.mock("../../services/order-service/src/middleware/auth", async () => {
  const actual = await vi.importActual<typeof import("../../services/order-service/src/middleware/auth")>(
    "../../services/order-service/src/middleware/auth"
  );
  return {
    ...actual,
    requireRole:
      () =>
      (req: { user?: { id: number; email: string; role: "user" | "admin" } }, _res: unknown, next: () => void) => {
        req.user = {
          id: 1,
          email: "admin@demo.local",
          role: "admin"
        };
        next();
      }
  };
});

vi.mock("../../services/product-service/src/middleware/auth", async () => {
  const actual = await vi.importActual<typeof import("../../services/product-service/src/middleware/auth")>(
    "../../services/product-service/src/middleware/auth"
  );
  return {
    ...actual,
    requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next()
  };
});

vi.mock("../../services/auth-service/src/services/token-service", () => ({
  verifyToken: vi.fn(() => ({
    sub: "1",
    email: "admin@demo.local",
    role: "admin"
  }))
}));

const { createApp: createAuthApp } = await import("../../services/auth-service/src/app");
const { createApp: createProductApp } = await import("../../services/product-service/src/app");
const { createApp: createOrderApp } = await import("../../services/order-service/src/app");
const { loginUser } = await import("../../services/auth-service/src/services/user-service");
const { listProducts } = await import("../../services/product-service/src/services/product-service");
const { checkout, getAdminSummary } = await import("../../services/order-service/src/services/order-service");

describe("public API contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through auth-service", async () => {
    vi.mocked(loginUser).mockResolvedValue({
      token: "token",
      user: {
        id: 1,
        email: "shopper@example.com",
        role: "user"
      }
    });

    const response = await request(createAuthApp()).post("/login").send({
      email: "shopper@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("shopper@example.com");
  });

  it("retrieves products", async () => {
    vi.mocked(listProducts).mockResolvedValue([
      {
        id: 3,
        name: "Telemetry Backpack",
        slug: "telemetry-backpack",
        description: "Backpack",
        category: "Accessories",
        imageUrl: "image",
        price: 74,
        inventory: 31
      }
    ]);

    const response = await request(createProductApp()).get("/");

    expect(response.status).toBe(200);
    expect(response.body[0].name).toBe("Telemetry Backpack");
  });

  it("creates orders and exposes the admin summary", async () => {
    vi.mocked(checkout).mockResolvedValue({
      id: 9,
      userId: 1,
      userEmail: "admin@demo.local",
      total: 74,
      status: "paid",
      paymentMode: "success",
      failureReason: null,
      createdAt: new Date().toISOString(),
      items: []
    });
    vi.mocked(getAdminSummary).mockResolvedValue({
      totalOrders: 9,
      paidOrders: 8,
      failedOrders: 1,
      revenue: 520,
      throughputByDay: []
    });

    const checkoutResponse = await request(createOrderApp()).post("/checkout").send({
      items: [{ productId: 3, quantity: 1 }],
      paymentMode: "success"
    });
    const summaryResponse = await request(createOrderApp()).get("/admin/orders/summary");

    expect(checkoutResponse.status).toBe(201);
    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.failedOrders).toBe(1);
  });
});

