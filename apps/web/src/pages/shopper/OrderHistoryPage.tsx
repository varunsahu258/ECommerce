import { useEffect, useState } from "react";
import type { OrderRecord } from "@ecommerce/shared";
import { orderApi } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

export const OrderHistoryPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    orderApi
      .list(token)
      .then(setOrders)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load orders."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <section className="panel">Loading order history...</section>;
  }

  if (error) {
    return <section className="panel error-banner">{error}</section>;
  }

  return (
    <section className="stack">
      <div className="section-header">
        <h2>Order history</h2>
        <p>Orders are persisted in PostgreSQL and read back from `order-service`.</p>
      </div>
      {orders.length === 0 && <div className="panel">No orders yet. Run a checkout flow first.</div>}
      {orders.map((order) => (
        <article className="panel" key={order.id}>
          <div className="order-header">
            <div>
              <h3>Order #{order.id}</h3>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <strong className={order.status === "paid" ? "status-success" : "status-failure"}>
              {order.status}
            </strong>
          </div>
          <div className="stack compact">
            {order.items.map((item) => (
              <div className="order-line" key={`${order.id}-${item.productId}`}>
                <span>
                  {item.productName} x {item.quantity}
                </span>
                <strong>${item.lineTotal.toFixed(2)}</strong>
              </div>
            ))}
          </div>
          {order.failureReason && <p className="error-banner">{order.failureReason}</p>}
        </article>
      ))}
    </section>
  );
};
