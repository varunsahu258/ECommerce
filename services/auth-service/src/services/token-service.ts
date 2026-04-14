import jwt from "jsonwebtoken";
import type { UserRole } from "@ecommerce/shared";
import { env } from "../config/env.js";

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
}

export const createToken = (claims: JwtClaims) =>
  jwt.sign(claims, env.jwtSecret, {
    expiresIn: "12h"
  });

export const verifyToken = (token: string) => jwt.verify(token, env.jwtSecret) as JwtClaims;
