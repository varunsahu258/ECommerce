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

Open `http://localhost:3000/grafana` and login with:

- user: `admin`
- password: `admin` (from `k8s/01-config.yaml` secret `GRAFANA_ADMIN_PASSWORD`)

Then load dashboard **ECommerce Overview** (uid: `ecommerce-overview`).

### 4) Selenium Grid UI

```bash
kubectl port-forward svc/selenium-hub 4444:4444 -n ecommerce-demo
```

If `/ui` is blank in your browser, open one of these directly:

- `http://localhost:4444/ui/`
- `http://localhost:4444/ui/index.html#/`

Also verify Grid status JSON:

- `http://localhost:4444/status`

To execute smoke tests:

```bash
npm run test:selenium
```

`npm run test:selenium` now sets `RUN_SELENIUM_SMOKE=1` so tests do not get silently skipped.

If your browser session is in Docker/Selenium Grid and cannot reach `localhost`, set:

```bash
E2E_BASE_URL=http://host.docker.internal:5173 npm run test:selenium
```

If you're running against Kubernetes ingress:

```bash
E2E_BASE_URL=http://ecommerce.local npm run test:selenium
```

### 5) Jenkins

This repository includes a Jenkins pipeline (`Jenkinsfile`) that runs build, unit tests, API tests, Selenium tests, Docker image build/push, and Kubernetes deploy.

If you accidentally deleted your Docker Jenkins container, recreate it with:

```bash
./docker/jenkins/recreate-container.sh
```

You can override defaults if needed, for example:

```bash
JENKINS_HTTP_PORT=18080 JENKINS_CONTAINER_NAME=jenkins-lab ./docker/jenkins/recreate-container.sh
```

> If your Jenkins log fails with `npm: not found`, use the latest `Jenkinsfile` from this repo.  
> It now has a **Prepare Node.js Runtime** stage that downloads a `.tar.gz` Node.js 20 build into the workspace before running `npm install` (so it does not require `xz`), and it auto-detects `x64` vs `arm64` to avoid QEMU loader errors.

If Jenkins is showing only the **InitialAdminPassword** page, do this first-time setup:

1. Get unlock password:

```bash
docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

2. Open `http://localhost:8080` and paste that password.
3. Click **Install suggested plugins**.
4. Create your admin user and save.
5. Go to **Manage Jenkins → Plugins** and ensure these are installed:
   - Pipeline
   - Git
   - Docker Pipeline
   - NodeJS (optional now, because the pipeline bootstraps Node.js itself)
6. Go to **Manage Jenkins → Tools**:
   - Add NodeJS (optional)
   - Add Git (if not auto-detected)
7. Create Pipeline job:
   - **New Item** → name: `ecommerce-platform` → **Pipeline**
   - In **Pipeline** section choose **Pipeline script from SCM**
   - SCM: **Git**
   - Repo URL: your repo URL
   - Branch: `*/main` (or your working branch)
   - Script path: `Jenkinsfile`
   - Save and click **Build Now**

If Docker commands fail in Jenkins container, run Jenkins with Docker socket mounted:

```bash
docker rm -f jenkins
docker run --name jenkins \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -d jenkins/jenkins:lts
```

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
```

## Quick troubleshooting (common demo blockers)

### Selenium tests are skipped

- Confirm script uses `RUN_SELENIUM_SMOKE=1` (already configured in `tests/package.json`).
- Ensure Selenium Hub is ready:

```bash
kubectl get pods -n ecommerce-demo | grep selenium
kubectl logs -n ecommerce-demo deploy/selenium-hub --tail=50
```

### Selenium UI is blank at `http://localhost:4444/ui`

1. Try `http://localhost:4444/ui/` or `http://localhost:4444/ui/index.html#/`.
2. Check Grid health endpoint:

```bash
curl -s http://localhost:4444/status
```

3. Confirm pods are Ready and node is registered:

```bash
kubectl get pods -n ecommerce-demo | grep selenium
kubectl logs -n ecommerce-demo deploy/selenium-hub --tail=80
kubectl logs -n ecommerce-demo deploy/selenium-chrome --tail=80
```

4. Restart Selenium components if needed:

```bash
kubectl rollout restart deploy/selenium-hub -n ecommerce-demo
kubectl rollout restart deploy/selenium-chrome -n ecommerce-demo
```

### Selenium test fails with `net::ERR_CONNECTION_REFUSED` at `browser.get(...)`

This usually means Selenium browser cannot reach your app URL (network mismatch between host and container).

Use one of these:

```bash
# app running with npm run dev:web on host machine
E2E_BASE_URL=http://host.docker.internal:5173 npm run test:selenium

# app running through Kubernetes ingress
E2E_BASE_URL=http://ecommerce.local npm run test:selenium
```

### Grafana UI not loading

1. Confirm Grafana pod is running:

```bash
kubectl get pods -n ecommerce-demo | grep grafana
kubectl logs -n ecommerce-demo deploy/grafana --tail=80
```

2. Use the correct URL for port-forward mode:  
   `http://localhost:3000/grafana` (not just `/`).
3. Validate ingress path mode (if using ingress):  
   `http://ecommerce.local/grafana`
4. If login fails, verify secret value:

```bash
kubectl get secret platform-secrets -n ecommerce-demo -o jsonpath='{.data.GRAFANA_ADMIN_PASSWORD}' | base64 --decode && echo
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
