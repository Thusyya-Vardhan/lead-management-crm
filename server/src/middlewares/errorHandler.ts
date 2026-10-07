//Centralized JSON error handler
import { Request, Response, NextFunction } from "express";

export interface AppError extends Error{
    statusCode?: number;
    details? : unknown;
}

export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
) :void => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    console.error(`[Error] ${statusCode} - ${err.message}`);

    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || "Internal Server Error",
            ...(err.details ? { details: err.details } : {}),
            ...(!isProduction && err.stack ? {stack:err.stack} : {}),
        },
    });
}