import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";
import { createOrderRouter } from "./routes/order-routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export const createApp = () => {
  const app = express();
  const registry = new Registry();
  collectDefaultMetrics({
    prefix: "order_service_",
    register: registry
  });

  const requestCounter = new Counter({
    name: "order_service_http_requests_total",
    help: "Total HTTP requests served by order-service.",
    labelNames: ["method", "path", "status_code"],
    registers: [registry]
  });

  const requestLatency = new Histogram({
    name: "order_service_http_request_duration_seconds",
    help: "Request latency for order-service.",
    labelNames: ["method", "path", "status_code"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [registry]
  });

  const checkoutSuccessCounter = new Counter({
    name: "order_service_checkout_success_total",
    help: "Successful checkout attempts.",
    registers: [registry]
  });

  const checkoutFailureCounter = new Counter({
    name: "order_service_checkout_failure_total",
    help: "Failed checkout attempts.",
    registers: [registry]
  });

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.use((req, res, next) => {
    const timer = requestLatency.startTimer({
      method: req.method,
      path: req.path
    });

    res.on("finish", () => {
      requestCounter.inc({
        method: req.method,
        path: req.path,
        status_code: String(res.statusCode)
      });
      timer({
        status_code: String(res.statusCode)
      });
    });

    next();
  });

  app.get("/healthz", (_req, res) => {
    res.json({
      name: "order-service",
      status: "ok",
      checkedAt: new Date().toISOString()
    });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.send(await registry.metrics());
  });

  app.use("/", createOrderRouter(checkoutSuccessCounter, checkoutFailureCounter));
  app.use(errorHandler);

  return app;
};
