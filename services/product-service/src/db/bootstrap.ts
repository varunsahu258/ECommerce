import { pool } from "./pool";

const seedProducts = [
  {
    name: "Edge Runner Sneakers",
    category: "Footwear",
    description: "Breathable knit sneakers for fast-moving demo shoppers.",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    price: 89.99,
    inventory: 24,
    slug: "edge-runner-sneakers"
  },
  {
    name: "Circuit Breaker Jacket",
    category: "Outerwear",
    description: "Lightweight technical shell with a clean engineer-friendly look.",
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    price: 129.5,
    inventory: 16,
    slug: "circuit-breaker-jacket"
  },
  {
    name: "Telemetry Backpack",
    category: "Accessories",
    description: "Organized backpack with dedicated laptop and lab gear compartments.",
    image_url: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80",
    price: 74,
    inventory: 31,
    slug: "telemetry-backpack"
  },
  {
    name: "Observability Mug",
    category: "Home",
    description: "Ceramic mug for long deploy days and suspicious dashboards.",
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    price: 18.95,
    inventory: 80,
    slug: "observability-mug"
  }
];

export const bootstrapDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      inventory INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await pool.query("SELECT id FROM products LIMIT 1");

  if (existing.rowCount === 0) {
    for (const product of seedProducts) {
      await pool.query(
        `
          INSERT INTO products (name, slug, description, category, image_url, price, inventory)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [product.name, product.slug, product.description, product.category, product.image_url, product.price, product.inventory]
      );
    }
  }
};

