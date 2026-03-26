import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields =
        (err.meta?.target as string[])?.join(", ") ?? "unknown field";
      res.status(409).json({
        error: "UniqueConstraintViolation",
        message: `A record with this ${fields} already exists.`,
        statusCode: 409,
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        error: "RecordNotFound",
        message: "The requested record was not found.",
        statusCode: 404,
      });
      return;
    }

    res.status(400).json({
      error: "DatabaseError",
      message: `Database error: ${err.code}`,
      statusCode: 400,
    });
    return;
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: "ValidationError",
      message: "Invalid data provided to the database.",
      statusCode: 400,
    });
    return;
  }

  // App errors with explicit statusCode
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500
      ? "An unexpected server error occurred."
      : err.message;

  if (statusCode === 500) {
    console.error("[Server Error]", err);
  }

  res.status(statusCode).json({
    error: err.name ?? "ServerError",
    message,
    statusCode,
  });
}

export function createError(
  message: string,
  statusCode: number,
  name?: string
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.name = name ?? "AppError";
  return err;
}
