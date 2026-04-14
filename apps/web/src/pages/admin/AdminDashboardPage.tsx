import { useEffect, useMemo, useState } from "react";
import type { OrderSummary, ServiceHealth } from "@ecommerce/shared";
import { frontendConfig, orderApi, platformApi } from "../../api/client";
import { MetricCard } from "../../components/MetricCard";
import { useAuth } from "../../hooks/useAuth";

const emptySummary: OrderSummary = {
  totalOrders: 0,
  paidOrders: 0,
  failedOrders: 0,
  revenue: 0,
  throughputByDay: []
};

export const AdminDashboardPage = () => {
  const { token } = useAuth();
  const [summary, setSummary] = useState<OrderSummary>(emptySummary);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    Promise.all([orderApi.adminSummary(token), platformApi.health()])
      .then(([nextSummary, nextHealth]) => {
        setSummary(nextSummary);
        setHealth(nextHealth);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard."))
      .finally(() => setLoading(false));
  }, [token]);

  const checkoutSuccessRate = useMemo(() => {
    if (summary.totalOrders === 0) {
      return "0%";
    }

    return `${Math.round((summary.paidOrders / summary.totalOrders) * 100)}%`;
  }, [summary]);

  if (loading) {
    return <section className="panel">Loading admin dashboard...</section>;
  }

  if (error) {
    return <section className="panel error-banner">{error}</section>;
  }

  return (
    <section className="stack">
      <div className="section-header">
        <h2>Admin dashboard</h2>
        <p>Business metrics come from `order-service`; health cards and observability links point to live ops surfaces.</p>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total orders" value={summary.totalOrders} />
        <MetricCard label="Paid orders" tone="success" value={summary.paidOrders} />
        <MetricCard label="Failed checkouts" tone="warning" value={summary.failedOrders} />
        <MetricCard label="Checkout success rate" value={checkoutSuccessRate} />
        <MetricCard label="Revenue" value={`$${summary.revenue.toFixed(2)}`} />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h3>Service health</h3>
          <div className="stack compact">
            {health.map((entry) => (
              <div className="health-row" key={entry.name}>
                <span>{entry.name}</span>
                <strong className={entry.status === "ok" ? "status-success" : "status-failure"}>
                  {entry.status}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Operational links</h3>
          <div className="stack compact">
            <a href={frontendConfig.grafanaUrl} rel="noreferrer" target="_blank">
              Open Grafana dashboard
            </a>
            <a href="/prometheus" rel="noreferrer" target="_blank">
              Open Prometheus
            </a>
            <a href="/api/orders/metrics" rel="noreferrer" target="_blank">
              View order-service metrics
            </a>
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>Order throughput trend</h3>
        <div className="stack compact">
          {summary.throughputByDay.length === 0 && <p>No orders yet. Run checkouts to populate trend data.</p>}
          {summary.throughputByDay.map((entry) => (
            <div className="throughput-row" key={entry.day}>
              <span>{entry.day}</span>
              <div className="throughput-bar">
                <div style={{ width: `${Math.max(entry.total * 18, 12)}px` }} />
              </div>
              <strong>
                {entry.total} total / {entry.failed} failed
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Grafana embed</h3>
        <iframe className="grafana-frame" src={frontendConfig.grafanaUrl} title="Grafana Dashboard" />
      </section>
    </section>
  );
};
