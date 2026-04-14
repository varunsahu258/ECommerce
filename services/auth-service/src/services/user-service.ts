import bcrypt from "bcryptjs";
import type { AuthResponse, AuthUser } from "@ecommerce/shared";
import { pool } from "../db/pool";
import { createToken } from "./token-service";

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const toAuthUser = (row: { id: number; email: string; role: "user" | "admin" }): AuthUser => ({
  id: row.id,
  email: row.email,
  role: row.role
});

export const registerUser = async (email: string, password: string): Promise<AuthResponse> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || password.trim().length < 8) {
    throw new ServiceError("Email and a password with at least 8 characters are required.", 400);
  }

  const existing = await pool.query("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [normalizedEmail]);

  if (existing.rowCount) {
    throw new ServiceError("A user with that email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query<{ id: number; email: string; role: "user" | "admin" }>(
    "INSERT INTO auth_users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
    [normalizedEmail, passwordHash]
  );
  const user = toAuthUser(result.rows[0]);

  return {
    token: createToken({
      sub: String(user.id),
      email: user.email,
      role: user.role
    }),
    user
  };
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await pool.query<{
    id: number;
    email: string;
    role: "user" | "admin";
    password_hash: string;
  }>("SELECT id, email, role, password_hash FROM auth_users WHERE email = $1 LIMIT 1", [normalizedEmail]);

  if (result.rowCount === 0) {
    throw new ServiceError("Invalid email or password.", 401);
  }

  const row = result.rows[0];
  const passwordValid = await bcrypt.compare(password, row.password_hash);

  if (!passwordValid) {
    throw new ServiceError("Invalid email or password.", 401);
  }

  const user = toAuthUser(row);

  return {
    token: createToken({
      sub: String(user.id),
      email: user.email,
      role: user.role
    }),
    user
  };
};
