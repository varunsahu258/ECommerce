# Architecture Notes

## Flow

`GitHub -> Jenkins -> Docker -> Kubernetes -> Prometheus/Grafana`

Python Selenium (headless Chrome) is used inside CI for browser smoke-scraping checks against the deployed ingress endpoint.

## Service Boundaries

- `auth-service`
  - owns users and credentials
  - issues JWTs with `user` or `admin` role claims
- `product-service`
  - owns product catalog and inventory counts
  - offers admin CRUD plus inventory lookup/reservation endpoints used by checkout
- `order-service`
  - owns orders and order items
  - coordinates checkout, payment simulation, and admin summaries

## Data Model

- Shared PostgreSQL instance for local-first simplicity
- Service-owned tables:
  - `auth_users`
  - `products`
  - `orders`
  - `order_items`

## Frontend Surfaces

- Shopper routes:
  - `/`
  - `/products/:id`
  - `/cart`
  - `/checkout`
  - `/orders`
- Admin route:
  - `/admin`

## Deployment Model

- Ingress exposes a single host/path surface
- React calls services through `/api/*`
- Services communicate internally via Kubernetes service DNS
- Prometheus scrapes `/metrics`
- Grafana exposes dashboards through ingress
