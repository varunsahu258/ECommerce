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

## If product images are not visible

If the external image host is blocked on your network, the frontend now falls back to built-in SVG placeholder images automatically, so your UI demo will still look complete.

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
kubectl get pods -n ecommerce-demo
kubectl get svc -n ecommerce-demo
kubectl get ingress -n ecommerce-demo
```

## How to show Grafana, Prometheus, Jenkins, Selenium, Kubernetes, and Docker

### 1) Kubernetes status (cluster + app health)

```bash
kubectl config current-context
kubectl get nodes
kubectl get all -n ecommerce-demo
kubectl get hpa -n ecommerce-demo
```

### 2) Prometheus UI

```bash
kubectl port-forward svc/prometheus 9090:9090 -n ecommerce-demo
```

Open `http://localhost:9090`, then run sample query:

```promql
sum(rate(order_service_checkout_success_total[5m]))
```

### 3) Grafana UI

```bash
kubectl port-forward svc/grafana 3000:3000 -n ecommerce-demo
```

Open `http://localhost:3000` and load dashboard **ECommerce Overview** (uid: `ecommerce-overview`).

### 4) Selenium Grid UI

```bash
kubectl port-forward svc/selenium-hub 4444:4444 -n ecommerce-demo
```

Open `http://localhost:4444/ui` to show active nodes and sessions.

To execute smoke tests:

```bash
npm run test:selenium
```

### 5) Jenkins

This repository includes a Jenkins pipeline (`Jenkinsfile`) that runs build, unit tests, API tests, Selenium tests, Docker image build/push, and Kubernetes deploy.

If Jenkins is already running in your lab, open its job UI and show pipeline stages:

- Install & Build
- Unit Tests
- API / Integration Tests
- Selenium Smoke Tests
- Docker Build & Tag
- Kubernetes Deploy

If Jenkins is not running, start a local demo instance:

```bash
docker run --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -d jenkins/jenkins:lts
```

Then open `http://localhost:8080`.

### 6) Docker evidence

Show running containers and images:

```bash
docker ps
docker images | head
```

If using Kubernetes with a local image registry, also show image references:

```bash
kubectl get deploy -n ecommerce-demo -o jsonpath='{range .items[*]}{.metadata.name}{" => "}{range .spec.template.spec.containers[*]}{.image}{" "}{end}{"\n"}{end}'
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
