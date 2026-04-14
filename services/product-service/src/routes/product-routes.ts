import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getInventorySnapshot,
  getProductById,
  listProducts,
  reserveInventory,
  updateProduct
} from "../services/product-service.js";
import { requireRole } from "../middleware/auth.js";

export const createProductRouter = () => {
  const router = Router();

  router.get("/", async (_req, res, next) => {
    try {
      res.json(await listProducts());
    } catch (error) {
      next(error);
    }
  });

  router.get("/inventory", async (req, res, next) => {
    try {
      const ids = String(req.query.ids ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));

      res.json(await getInventorySnapshot(ids));
    } catch (error) {
      next(error);
    }
  });

  router.post("/inventory/reserve", async (req, res, next) => {
    try {
      const items = ((req.body?.items as Array<{ productId: number; quantity: number }>) ?? []).map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }));
      await reserveInventory(items);
      res.status(202).json({
        status: "reserved"
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      res.json(await getProductById(Number(req.params.id)));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRole("admin"), async (req, res, next) => {
    try {
      res.status(201).json(await createProduct(req.body));
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", requireRole("admin"), async (req, res, next) => {
    try {
      res.json(await updateProduct(Number(req.params.id), req.body));
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", requireRole("admin"), async (req, res, next) => {
    try {
      await deleteProduct(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
