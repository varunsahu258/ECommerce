import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

export const AppShell = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { totalItems } = useCart();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <Link className="brand" to="/">
            Signal Shop
          </Link>
          <p className="brand-copy">React storefront, admin pulse, and Kubernetes-native backend demo.</p>
        </div>
        <nav className="topbar__nav">
          <NavLink to="/">Store</NavLink>
          <NavLink to="/cart">Cart ({totalItems})</NavLink>
          {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          {!isAuthenticated && <NavLink to="/login">Login</NavLink>}
          {!isAuthenticated && <NavLink to="/register">Register</NavLink>}
          {isAuthenticated && (
            <button className="button button--ghost" onClick={logout} type="button">
              Logout
            </button>
          )}
        </nav>
      </header>
      <main className="page">
        <section className="hero">
          <div>
            <div className="eyebrow">Engineer-Facing Demo Platform</div>
            <h1>Shopper flows, admin observability, and service telemetry in one local-first stack.</h1>
            <p>
              Seeded admin login: <code>admin@demo.local</code> / <code>Admin1234!</code>
            </p>
          </div>
          {user ? (
            <div className="hero__status">
              <span>Signed in as</span>
              <strong>{user.email}</strong>
              <small>{user.role.toUpperCase()}</small>
            </div>
          ) : (
            <div className="hero__status">
              <span>Session</span>
              <strong>Guest</strong>
              <small>Browse freely, authenticate to checkout.</small>
            </div>
          )}
        </section>
        <Outlet />
      </main>
    </div>
  );
};

