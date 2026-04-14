import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";

vi.mock("../services/product-service", () => ({
  listProducts: vi.fn(),
  getProductById: vi.fn(),
  getInventorySnapshot: vi.fn(),
  reserveInventory: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn()
}));

vi.mock("../middleware/auth", async () => {
  const actual = await vi.importActual<typeof import("../middleware/auth")>("../middleware/auth");
  return {
    ...actual,
    requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next()
  };
});

const { listProducts, getProductById } = await import("../services/product-service");

describe("product routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists products", async () => {
    vi.mocked(listProducts).mockResolvedValue([
      {
        id: 1,
        name: "Observability Mug",
        slug: "observability-mug",
        description: "Mug",
        category: "Home",
        imageUrl: "image",
        price: 18.95,
        inventory: 80
      }
    ]);

    const response = await request(createApp()).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it("fetches a single product", async () => {
    vi.mocked(getProductById).mockResolvedValue({
      id: 2,
      name: "Telemetry Backpack",
      slug: "telemetry-backpack",
      description: "Backpack",
      category: "Accessories",
      imageUrl: "image",
      price: 74,
      inventory: 31
    });

    const response = await request(createApp()).get("/2");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
  });
});
