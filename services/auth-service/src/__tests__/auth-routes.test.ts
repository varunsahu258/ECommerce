import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

vi.mock("../services/user-service", () => ({
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

vi.mock("../services/token-service", () => ({
  verifyToken: vi.fn(() => ({
    sub: "7",
    email: "admin@demo.local",
    role: "admin"
  }))
}));

const { loginUser, registerUser } = await import("../services/user-service.js");

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a user", async () => {
    vi.mocked(registerUser).mockResolvedValue({
      token: "token",
      user: {
        id: 1,
        email: "new@example.com",
        role: "user"
      }
    });

    const response = await request(createApp()).post("/register").send({
      email: "new@example.com",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("new@example.com");
  });

  it("logs in an existing user", async () => {
    vi.mocked(loginUser).mockResolvedValue({
      token: "token",
      user: {
        id: 1,
        email: "shopper@example.com",
        role: "user"
      }
    });

    const response = await request(createApp()).post("/login").send({
      email: "shopper@example.com",
      password: "password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("token");
  });

  it("returns profile details from a valid token", async () => {
    const response = await request(createApp())
      .get("/me")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("admin");
  });
});
