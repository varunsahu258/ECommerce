import { Router } from "express";
import { Counter } from "prom-client";
import { loginUser, registerUser, ServiceError } from "../services/user-service";
import { verifyToken } from "../services/token-service";

export const createAuthRouter = (authFailureCounter: Counter<string>) => {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      const response = await registerUser(email ?? "", password ?? "");
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      const response = await loginUser(email ?? "", password ?? "");
      res.json(response);
    } catch (error) {
      if (error instanceof ServiceError && error.statusCode === 401) {
        authFailureCounter.inc();
      }
      next(error);
    }
  });

  router.get("/me", async (req, res, next) => {
    try {
      const header = req.header("authorization");
      if (!header?.startsWith("Bearer ")) {
        throw new ServiceError("Missing bearer token.", 401);
      }

      const claims = verifyToken(header.slice("Bearer ".length));
      res.json({
        user: {
          id: Number(claims.sub),
          email: claims.email,
          role: claims.role
        }
      });
    } catch (error) {
      next(new ServiceError("Invalid or expired token.", 401));
    }
  });

  return router;
};

