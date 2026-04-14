import type { NextFunction, Request, Response } from "express";
import { ServiceError } from "../services/user-service.js";

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ServiceError) {
    res.status(error.statusCode).json({
      error: error.message
    });
    return;
  }

  res.status(500).json({
    error: "Unexpected auth-service error."
  });
};
