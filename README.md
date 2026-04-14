# Full-Stack E-Commerce Platform on Kubernetes

Engineer-facing demo platform with a React storefront/admin UI, three Node.js + Express services, PostgreSQL persistence, Jenkins CI/CD, Selenium smoke coverage, and Prometheus/Grafana observability.

## Workspace Layout

- `apps/web`: shopper and admin React application
- `services/auth-service`: registration, login, JWT issuance, role claims
- `services/product-service`: catalog read/admin CRUD and inventory reservation
- `services/order-service`: checkout flow, simulated payments, order history, admin summaries
- `packages/shared`: TypeScript domain types shared across the stack
- `tests`: API contract smoke tests and Selenium e2e flows
- `k8s`: Kubernetes manifests for app, data, ingress, monitoring, and Selenium Grid
- `docker`: supporting Docker/Grafana/Postgres assets

## Locked Public Paths

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders/checkout`
- `GET /api/orders`
- `GET /api/orders/admin/orders/summary`
- `GET /api/*/metrics`

## Local Development

1. Install dependencies with `npm install`.
2. Start PostgreSQL locally or in Kubernetes using the credentials from `.env.example`.
3. Run the services:
   - `npm run dev:auth`
   - `npm run dev:product`
   - `npm run dev:order`
   - `npm run dev:web`

## Testing

- `npm run test:unit`
- `npm run test:api`
- `npm run test:selenium`

## Kubernetes

The root `k8s/` directory includes manifests for the frontend, services, PostgreSQL, ingress, autoscaling, Prometheus, Grafana, and Selenium Grid. The Jenkins pipeline deploys them with:

```bash
kubectl apply -f k8s/ -R
```

## Observability

Each backend service exposes:

- `/healthz`
- `/metrics`

Prometheus scrapes the services and Grafana ships with a starter dashboard for:

- request rate / error rate / latency
- checkout success vs failure
- auth failures
- order throughput trend
- pod health / restart visibility

