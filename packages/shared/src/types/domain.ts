export type UserRole = "user" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  inventory: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
  product?: Product;
}

export interface CheckoutRequest {
  items: CartItem[];
  paymentMode?: "success" | "failure" | "random";
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: number;
  userId: number;
  userEmail: string;
  total: number;
  status: "paid" | "payment_failed";
  paymentMode: "success" | "failure" | "random";
  failureReason: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderSummary {
  totalOrders: number;
  paidOrders: number;
  failedOrders: number;
  revenue: number;
  throughputByDay: Array<{
    day: string;
    total: number;
    paid: number;
    failed: number;
  }>;
}

export interface ServiceHealth {
  name: string;
  status: "ok" | "degraded";
  checkedAt: string;
}

