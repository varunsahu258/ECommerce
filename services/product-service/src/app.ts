import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";
import { createProductRouter } from "./routes/product-routes.js";
import { errorHandler } from "./middleware/error-handler.js";

export const createApp = () => {
  const app = express();
  const registry = new Registry();
  collectDefaultMetrics({
    prefix: "product_service_",
    register: registry
  });

  const requestCounter = new Counter({
    name: "product_service_http_requests_total",
    help: "Total HTTP requests served by product-service.",
    labelNames: ["method", "path", "status_code"],
    registers: [registry]
  });

  const requestLatency = new Histogram({
    name: "product_service_http_request_duration_seconds",
    help: "Request latency for product-service.",
    labelNames: ["method", "path", "status_code"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
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
      name: "product-service",
      status: "ok",
      checkedAt: new Date().toISOString()
    });
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.send(await registry.metrics());
  });

  app.use("/", createProductRouter());
  app.use(errorHandler);

  return app;
};
