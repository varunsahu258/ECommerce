import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@ecommerce/shared";
import { env } from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      next(new ServiceError("Authentication required.", 401));
      return;
    }

    try {
      const claims = jwt.verify(header.slice("Bearer ".length), env.jwtSecret) as {
        sub: string;
        email: string;
        role: UserRole;
      };

      req.user = {
        id: Number(claims.sub),
        email: claims.email,
        role: claims.role
      };

      if (!roles.includes(req.user.role)) {
        throw new ServiceError("Insufficient permissions.", 403);
      }

      next();
    } catch (error) {
      next(error instanceof ServiceError ? error : new ServiceError("Invalid token.", 401));
    }
  };
