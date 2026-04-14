import bcrypt from "bcryptjs";
import { pool } from "./pool.js";
import { env } from "../config/env.js";

export const bootstrapDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const adminExists = await pool.query("SELECT id FROM auth_users WHERE email = $1 LIMIT 1", [env.adminEmail]);

  if (adminExists.rowCount === 0) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 10);
    await pool.query(
      "INSERT INTO auth_users (email, password_hash, role) VALUES ($1, $2, 'admin')",
      [env.adminEmail, passwordHash]
    );
  }
};
