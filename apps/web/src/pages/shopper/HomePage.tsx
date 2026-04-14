import { useEffect, useState } from "react";
import type { Product } from "@ecommerce/shared";
import { productApi } from "../../api/client";
import { ProductCard } from "../../components/ProductCard";

export const HomePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    productApi
      .list()
      .then(setProducts)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load products."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="panel">Loading catalog...</section>;
  }

  if (error) {
    return <section className="panel error-banner">{error}</section>;
  }

  return (
    <section className="stack">
      <div className="section-header">
        <h2>Catalog</h2>
        <p>
          Seeded products come from <code>product-service</code> and are ready for browse to cart to checkout flows.
        </p>
      </div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
