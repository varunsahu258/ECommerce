import type { CartItem, OrderItem, OrderRecord, OrderSummary } from "@ecommerce/shared";
import { pool } from "../db/pool";
import { ServiceError } from "../middleware/auth";
import { getInventorySnapshot, reserveInventory } from "./product-client";
import { type PaymentMode, simulatePayment } from "./payment-simulator";

interface CheckoutActor {
  id: number;
  email: string;
}

const toNumber = (value: string | number) => Number(value);

const groupOrders = (rows: Array<Record<string, unknown>>): OrderRecord[] => {
  const orders = new Map<number, OrderRecord>();

  rows.forEach((row) => {
    const orderId = Number(row.order_id);
    if (!orders.has(orderId)) {
      orders.set(orderId, {
        id: orderId,
        userId: Number(row.user_id),
        userEmail: String(row.user_email),
        total: toNumber(row.total as string | number),
        status: row.status as "paid" | "payment_failed",
        paymentMode: row.payment_mode as PaymentMode,
        failureReason: (row.failure_reason as string | null) ?? null,
        createdAt: new Date(String(row.created_at)).toISOString(),
        items: []
      });
    }

    const order = orders.get(orderId);
    if (order && row.item_id) {
      order.items.push({
        id: Number(row.item_id),
        productId: Number(row.product_id),
        productName: String(row.product_name),
        price: toNumber(row.price as string | number),
        quantity: Number(row.quantity),
        lineTotal: toNumber(row.line_total as string | number)
      });
    }
  });

  return [...orders.values()];
};

const persistOrder = async (input: {
  userId: number;
  userEmail: string;
  total: number;
  paymentMode: PaymentMode;
  status: "paid" | "payment_failed";
  failureReason: string | null;
  items: OrderItem[];
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const orderResult = await client.query<{ id: number }>(
      `
        INSERT INTO orders (user_id, user_email, total, status, payment_mode, failure_reason)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [input.userId, input.userEmail, input.total, input.status, input.paymentMode, input.failureReason]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of input.items) {
      await client.query(
        `
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, line_total)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [orderId, item.productId, item.productName, item.price, item.quantity, item.lineTotal]
      );
    }

    await client.query("COMMIT");
    return orderId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const checkout = async (
  actor: CheckoutActor,
  items: CartItem[],
  paymentMode: PaymentMode = "success"
): Promise<OrderRecord> => {
  if (items.length === 0) {
    throw new ServiceError("At least one cart item is required for checkout.", 400);
  }

  const normalizedItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity)
  }));

  if (normalizedItems.some((item) => !Number.isFinite(item.productId) || item.quantity <= 0)) {
    throw new ServiceError("Each cart item must include a valid productId and quantity.", 400);
  }

  const inventory = await getInventorySnapshot(normalizedItems.map((item) => item.productId));

  const orderItems: OrderItem[] = normalizedItems.map((item) => {
    const product = inventory.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new ServiceError(`Product ${item.productId} is unavailable.`, 404);
    }

    if (product.inventory < item.quantity) {
      throw new ServiceError(`${product.name} does not have enough inventory for this checkout.`, 409);
    }

    return {
      id: 0,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      lineTotal: Number((product.price * item.quantity).toFixed(2))
    };
  });

  const total = Number(orderItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const payment = simulatePayment(paymentMode);

  if (!payment.success) {
    const orderId = await persistOrder({
      userId: actor.id,
      userEmail: actor.email,
      total,
      paymentMode,
      status: "payment_failed",
      failureReason: payment.failureReason,
      items: orderItems
    });

    return {
      id: orderId,
      userId: actor.id,
      userEmail: actor.email,
      total,
      status: "payment_failed",
      paymentMode,
      failureReason: payment.failureReason,
      createdAt: new Date().toISOString(),
      items: orderItems
    };
  }

  try {
    await reserveInventory(normalizedItems);
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Inventory reservation failed.";
    const orderId = await persistOrder({
      userId: actor.id,
      userEmail: actor.email,
      total,
      paymentMode,
      status: "payment_failed",
      failureReason,
      items: orderItems
    });

    return {
      id: orderId,
      userId: actor.id,
      userEmail: actor.email,
      total,
      status: "payment_failed",
      paymentMode,
      failureReason,
      createdAt: new Date().toISOString(),
      items: orderItems
    };
  }

  const orderId = await persistOrder({
    userId: actor.id,
    userEmail: actor.email,
    total,
    paymentMode,
    status: "paid",
    failureReason: null,
    items: orderItems
  });

  return {
    id: orderId,
    userId: actor.id,
    userEmail: actor.email,
    total,
    status: "paid",
    paymentMode,
    failureReason: null,
    createdAt: new Date().toISOString(),
    items: orderItems
  };
};

export const listOrders = async (userId: number) => {
  const result = await pool.query(
    `
      SELECT
        o.id AS order_id,
        o.user_id,
        o.user_email,
        o.total,
        o.status,
        o.payment_mode,
        o.failure_reason,
        o.created_at,
        oi.id AS item_id,
        oi.product_id,
        oi.product_name,
        oi.price,
        oi.quantity,
        oi.line_total
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC, oi.id ASC
    `,
    [userId]
  );

  return groupOrders(result.rows);
};

export const getAdminSummary = async (): Promise<OrderSummary> => {
  const totalsResult = await pool.query<{
    total_orders: string;
    paid_orders: string;
    failed_orders: string;
    revenue: string;
  }>(
    `
      SELECT
        COUNT(*)::text AS total_orders,
        COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_orders,
        COUNT(*) FILTER (WHERE status = 'payment_failed')::text AS failed_orders,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0)::text AS revenue
      FROM orders
    `
  );

  const throughputResult = await pool.query<{
    day: string;
    total: string;
    paid: string;
    failed: string;
  }>(
    `
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE status = 'paid')::text AS paid,
        COUNT(*) FILTER (WHERE status = 'payment_failed')::text AS failed
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `
  );

  const totals = totalsResult.rows[0];

  return {
    totalOrders: Number(totals?.total_orders ?? 0),
    paidOrders: Number(totals?.paid_orders ?? 0),
    failedOrders: Number(totals?.failed_orders ?? 0),
    revenue: Number(totals?.revenue ?? 0),
    throughputByDay: throughputResult.rows.map((row: { day: string; total: string; paid: string; failed: string }) => ({
      day: row.day,
      total: Number(row.total),
      paid: Number(row.paid),
      failed: Number(row.failed)
    }))
  };
};
