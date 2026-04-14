import type { AuthResponse, OrderRecord, OrderSummary, Product, ServiceHealth } from "@ecommerce/shared";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
const grafanaUrl =
  import.meta.env.VITE_GRAFANA_URL ??
  "/grafana/d/ecommerce-overview/ecommerce-overview?orgId=1&kiosk";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown, token?: string) {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const frontendConfig = {
  grafanaUrl
};

export const authApi = {
  register: (email: string, password: string) =>
    request<AuthResponse>("/auth/register", "POST", {
      email,
      password
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", "POST", {
      email,
      password
    }),
  me: (token: string) => request<{ user: AuthResponse["user"] }>("/auth/me", "GET", undefined, token)
};

export const productApi = {
  list: () => request<Product[]>("/products"),
  getById: (id: number) => request<Product>(`/products/${id}`)
};

export const orderApi = {
  checkout: (token: string, payload: { items: Array<{ productId: number; quantity: number }>; paymentMode: string }) =>
    request<OrderRecord>("/orders/checkout", "POST", payload, token),
  list: (token: string) => request<OrderRecord[]>("/orders", "GET", undefined, token),
  adminSummary: (token: string) => request<OrderSummary>("/orders/admin/orders/summary", "GET", undefined, token)
};

export const platformApi = {
  health: async (): Promise<ServiceHealth[]> =>
    Promise.all([
      request<ServiceHealth>("/auth/healthz"),
      request<ServiceHealth>("/products/healthz"),
      request<ServiceHealth>("/orders/healthz")
    ])
};
