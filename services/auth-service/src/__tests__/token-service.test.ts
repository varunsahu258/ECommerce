import { describe, expect, it } from "vitest";
import { createToken, verifyToken } from "../services/token-service.js";

describe("token-service", () => {
  it("creates and verifies a token with role claims", () => {
    const token = createToken({
      sub: "42",
      email: "shopper@example.com",
      role: "user"
    });

    const claims = verifyToken(token);

    expect(claims.sub).toBe("42");
    expect(claims.email).toBe("shopper@example.com");
    expect(claims.role).toBe("user");
  });
});
