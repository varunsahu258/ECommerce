import type { Product } from "@ecommerce/shared";
import { env } from "../config/env.js";
import { ServiceError } from "../middleware/auth.js";

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ServiceError(payload?.error ?? `Product service request failed with ${response.status}.`, response.status);
  }

  return (await response.json()) as T;
};

export const getInventorySnapshot = async (productIds: number[]) => {
  const response = await fetch(
    `${env.productServiceUrl}/inventory?ids=${encodeURIComponent(productIds.join(","))}`
  );
  return toJson<Product[]>(response);
};

export const reserveInventory = async (items: Array<{ productId: number; quantity: number }>) => {
  const response = await fetch(`${env.productServiceUrl}/inventory/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items
    })
  });

  return toJson<{ status: string }>(response);
};
