import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export const CartPage = () => {
  const { items, removeItem, totalPrice, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <section className="panel">
        <h2>Your cart is empty</h2>
        <p>Add a product from the catalog to start a checkout flow.</p>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="section-header">
        <h2>Cart</h2>
        <p>State is stored locally, then posted to `order-service` during checkout.</p>
      </div>
      <div className="stack">
        {items.map((item) => (
          <article className="cart-row" key={item.productId}>
            <div>
              <h3>{item.product.name}</h3>
              <p>${item.product.price.toFixed(2)} each</p>
            </div>
            <div className="cart-row__controls">
              <input
                aria-label={`Quantity for ${item.product.name}`}
                max={item.product.inventory}
                min={1}
                onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                type="number"
                value={item.quantity}
              />
              <strong>${(item.product.price * item.quantity).toFixed(2)}</strong>
              <button className="button button--ghost" onClick={() => removeItem(item.productId)} type="button">
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="panel cart-summary">
        <span>Total</span>
        <strong>${totalPrice.toFixed(2)}</strong>
        <Link className="button" to="/checkout">
          Continue to checkout
        </Link>
      </div>
    </section>
  );
};

