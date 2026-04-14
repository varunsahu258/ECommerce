import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "@ecommerce/shared";
import { productApi } from "../../api/client";
import { useCart } from "../../hooks/useCart";

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) {
      return;
    }

    productApi
      .getById(Number(productId))
      .then(setProduct)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load product."))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <section className="panel">Loading product...</section>;
  }

  if (!product || error) {
    return <section className="panel error-banner">{error || "Product not found."}</section>;
  }

  return (
    <section className="detail-layout">
      <img className="detail-layout__image" src={product.imageUrl} alt={product.name} />
      <div className="panel">
        <div className="eyebrow">{product.category}</div>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="detail-meta">
          <strong>${product.price.toFixed(2)}</strong>
          <span>{product.inventory} in stock</span>
        </div>
        <div className="detail-actions">
          <input
            aria-label="Quantity"
            max={product.inventory}
            min={1}
            onChange={(event) => setQuantity(Number(event.target.value))}
            type="number"
            value={quantity}
          />
          <button
            className="button"
            onClick={() => {
              addItem(product, quantity);
              setMessage("Added to cart.");
            }}
            type="button"
          >
            Add to cart
          </button>
        </div>
        {message && <p className="success-banner">{message}</p>}
      </div>
    </section>
  );
};
