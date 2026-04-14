import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderRecord } from "@ecommerce/shared";
import { orderApi } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

export const CheckoutPage = () => {
  const { token } = useAuth();
  const { clearCart, items, totalPrice } = useCart();
  const [paymentMode, setPaymentMode] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError("");
    setOrder(null);

    try {
      const result = await orderApi.checkout(token, {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        paymentMode
      });
      setOrder(result);
      if (result.status === "paid") {
        clearCart();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !order) {
    return (
      <section className="panel">
        <h2>Checkout</h2>
        <p>Your cart is empty, so there is nothing to submit yet.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="section-header">
        <h2>Checkout</h2>
        <p>Choose a payment mode to demo success, failure, and alerting scenarios intentionally.</p>
      </div>
      <form className="panel stack" onSubmit={handleSubmit}>
        <label>
          Payment simulation
          <select onChange={(event) => setPaymentMode(event.target.value)} value={paymentMode}>
            <option value="success">Force success</option>
            <option value="failure">Force failure</option>
            <option value="random">Randomized result</option>
          </select>
        </label>
        <div className="order-preview">
          {items.map((item) => (
            <div key={item.productId}>
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <strong>${(item.quantity * item.product.price).toFixed(2)}</strong>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <span>Checkout total</span>
          <strong>${totalPrice.toFixed(2)}</strong>
        </div>
        {error && <p className="error-banner">{error}</p>}
        {order?.status === "payment_failed" && (
          <div className="error-banner">
            Checkout failed intentionally: {order.failureReason}. The cart is preserved so the negative flow is visible.
          </div>
        )}
        {order?.status === "paid" && (
          <div className="success-banner">
            Order #{order.id} completed successfully. <Link to="/orders">View order history</Link>
          </div>
        )}
        <button className="button" disabled={submitting} type="submit">
          {submitting ? "Submitting..." : "Place order"}
        </button>
      </form>
    </section>
  );
};
