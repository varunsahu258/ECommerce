import { pool } from "./pool";

export const bootstrapDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      total NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('paid', 'payment_failed')),
      payment_mode TEXT NOT NULL CHECK (payment_mode IN ('success', 'failure', 'random')),
      failure_reason TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      quantity INTEGER NOT NULL,
      line_total NUMERIC(10, 2) NOT NULL
    )
  `);
};

