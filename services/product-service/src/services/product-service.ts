import type { Product } from "@ecommerce/shared";
import { pool } from "../db/pool.js";
import { ServiceError } from "../middleware/auth.js";
import { coerceMoney, toSlug } from "./product-utils.js";

interface ProductMutationInput {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  inventory: number;
}

const toProduct = (row: {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  image_url: string;
  price: string | number;
  inventory: number;
}): Product => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  category: row.category,
  imageUrl: row.image_url,
  price: Number(row.price),
  inventory: row.inventory
});

const validateProductInput = (input: ProductMutationInput) => {
  if (!input.name.trim() || !input.description.trim() || !input.category.trim() || !input.imageUrl.trim()) {
    throw new ServiceError("All product fields are required.", 400);
  }

  if (input.price <= 0 || input.inventory < 0) {
    throw new ServiceError("Price must be positive and inventory cannot be negative.", 400);
  }
};

export const listProducts = async (): Promise<Product[]> => {
  const result = await pool.query(
    "SELECT id, name, slug, description, category, image_url, price, inventory FROM products ORDER BY id ASC"
  );
  return result.rows.map(toProduct);
};

export const getProductById = async (id: number): Promise<Product> => {
  const result = await pool.query(
    "SELECT id, name, slug, description, category, image_url, price, inventory FROM products WHERE id = $1 LIMIT 1",
    [id]
  );

  if (result.rowCount === 0) {
    throw new ServiceError("Product not found.", 404);
  }

  return toProduct(result.rows[0]);
};

export const createProduct = async (input: ProductMutationInput): Promise<Product> => {
  validateProductInput(input);
  const result = await pool.query(
    `
      INSERT INTO products (name, slug, description, category, image_url, price, inventory)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, slug, description, category, image_url, price, inventory
    `,
    [
      input.name.trim(),
      toSlug(input.name),
      input.description.trim(),
      input.category.trim(),
      input.imageUrl.trim(),
      coerceMoney(input.price),
      input.inventory
    ]
  );

  return toProduct(result.rows[0]);
};

export const updateProduct = async (id: number, input: ProductMutationInput): Promise<Product> => {
  validateProductInput(input);
  const result = await pool.query(
    `
      UPDATE products
      SET name = $2,
          slug = $3,
          description = $4,
          category = $5,
          image_url = $6,
          price = $7,
          inventory = $8,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, slug, description, category, image_url, price, inventory
    `,
    [
      id,
      input.name.trim(),
      toSlug(input.name),
      input.description.trim(),
      input.category.trim(),
      input.imageUrl.trim(),
      coerceMoney(input.price),
      input.inventory
    ]
  );

  if (result.rowCount === 0) {
    throw new ServiceError("Product not found.", 404);
  }

  return toProduct(result.rows[0]);
};

export const deleteProduct = async (id: number) => {
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    throw new ServiceError("Product not found.", 404);
  }
};

export const getInventorySnapshot = async (ids: number[]) => {
  if (ids.length === 0) {
    return [];
  }

  const result = await pool.query(
    `
      SELECT id, name, slug, description, category, image_url, price, inventory
      FROM products
      WHERE id = ANY($1::int[])
      ORDER BY id ASC
    `,
    [ids]
  );

  return result.rows.map(toProduct);
};

export const reserveInventory = async (items: Array<{ productId: number; quantity: number }>) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const item of items) {
      const result = await client.query<{ inventory: number }>(
        "SELECT inventory FROM products WHERE id = $1 FOR UPDATE",
        [item.productId]
      );

      if (result.rowCount === 0) {
        throw new ServiceError(`Product ${item.productId} not found.`, 404);
      }

      if (result.rows[0].inventory < item.quantity) {
        throw new ServiceError(`Insufficient inventory for product ${item.productId}.`, 409);
      }
    }

    for (const item of items) {
      await client.query("UPDATE products SET inventory = inventory - $2, updated_at = NOW() WHERE id = $1", [
        item.productId,
        item.quantity
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
