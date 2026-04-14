import { Link } from "react-router-dom";
import type { Product } from "@ecommerce/shared";

export const ProductCard = ({ product }: { product: Product }) => (
  <article className="product-card">
    <img className="product-card__image" src={product.imageUrl} alt={product.name} />
    <div className="product-card__content">
      <div className="eyebrow">{product.category}</div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-card__footer">
        <strong>${product.price.toFixed(2)}</strong>
        <Link className="button button--ghost" to={`/products/${product.id}`}>
          View details
        </Link>
      </div>
    </div>
  </article>
);
