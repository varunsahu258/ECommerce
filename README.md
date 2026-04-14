# Full-Stack E-Commerce Platform on Kubernetes

Engineer-facing demo platform with a React storefront/admin UI, three Node.js + Express services, PostgreSQL persistence, Jenkins CI/CD, Selenium smoke coverage, and Prometheus/Grafana observability.

## Project Status

✅ **Implementation is complete for demo purposes**:

- Auth flow (register/login + JWT roles)
- Product catalog browsing + admin product management
- Checkout + order history + admin order summary
- Health and metrics endpoints on each backend service
- Automated unit/API tests and Selenium smoke tests
- Kubernetes manifests + monitoring stack (Prometheus/Grafana)

If you need to present this in front of a professor, use the runbook below.

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
### 1) Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 15+ (local) **or** a running PostgreSQL pod in Kubernetes

### 2) Setup

```bash
cp .env.example .env
npm install
```

### 3) Start PostgreSQL (local option)

```bash
docker run --name ecommerce-postgres \
  -e POSTGRES_DB=ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

### 4) Start all applications (4 terminals)

- Terminal 1:
   - `npm run dev:auth`
- Terminal 2:
   - `npm run dev:product`
- Terminal 3:
   - `npm run dev:order`
- Terminal 4:
   - `npm run dev:web`

### 5) Open the app

- Frontend: `http://localhost:5173`
- APIs (examples):
  - `http://localhost:4001/healthz`
  - `http://localhost:4002/healthz`
  - `http://localhost:4003/healthz`

---

## Professor Demo Script (What is happening)

Use this order while presenting:

1. **Register/Login (Auth Service)**  
   Explain that `auth-service` validates credentials, stores users, and returns JWT with role claim.
2. **Browse Products (Product Service)**  
   Explain that product catalog is fetched from `product-service`.
3. **Add to Cart + Checkout (Order Service orchestration)**  
   Explain that checkout goes to `order-service`, which:
   - reserves/validates inventory via `product-service`
   - runs payment simulation
   - stores order + items in PostgreSQL
4. **View Orders**  
   Show shopper order history and admin summary page.
5. **Observability**  
   Show `/metrics` on a backend and explain Prometheus scraping + Grafana dashboards.

---

## Complete Command Checklist (quick copy)

```bash
# 0) One-time setup
cp .env.example .env
npm install

# 1) Database
docker run --name ecommerce-postgres \
  -e POSTGRES_DB=ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# 2) Start services + frontend (run in separate terminals)
npm run dev:auth
npm run dev:product
npm run dev:order
npm run dev:web

# 3) Optional verification
npm run test:unit
npm run test:api
```

## Testing

- `npm run test:unit`
- `npm run test:api`
- `npm run test:selenium`

## Kubernetes

The root `k8s/` directory includes manifests for the frontend, services, PostgreSQL, ingress, autoscaling, Prometheus, Grafana, and Selenium Grid. The Jenkins pipeline deploys them with:

```bash
kubectl apply -f k8s/ -R
```

After deployment, use:

```bash
kubectl get pods -n ecommerce
kubectl get svc -n ecommerce
kubectl get ingress -n ecommerce
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
