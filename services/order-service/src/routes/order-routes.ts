import { Router } from "express";
import { Counter } from "prom-client";
import { type AuthenticatedRequest, requireRole } from "../middleware/auth";
import { checkout, getAdminSummary, listOrders } from "../services/order-service";

export const createOrderRouter = (checkoutSuccessCounter: Counter<string>, checkoutFailureCounter: Counter<string>) => {
  const router = Router();

  router.post("/checkout", requireRole("user", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      const order = await checkout(
        {
          id: req.user!.id,
          email: req.user!.email
        },
        req.body?.items ?? [],
        req.body?.paymentMode ?? "success"
      );

      if (order.status === "paid") {
        checkoutSuccessCounter.inc();
      } else {
        checkoutFailureCounter.inc();
      }

      res.status(order.status === "paid" ? 201 : 202).json(order);
    } catch (error) {
      checkoutFailureCounter.inc();
      next(error);
    }
  });

  router.get("/", requireRole("user", "admin"), async (req: AuthenticatedRequest, res, next) => {
    try {
      res.json(await listOrders(req.user!.id));
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin/orders/summary", requireRole("admin"), async (_req, res, next) => {
    try {
      res.json(await getAdminSummary());
    } catch (error) {
      next(error);
    }
  });

  return router;
};

