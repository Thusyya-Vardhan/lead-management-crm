import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';

/**
 * Authentication Middleware
 * Validates JWT in the Authorization header (Bearer <token>)
 * and attaches the authenticated user document to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. No token provided.' },
      });
      return;
    }

    // 2. Extract token string (everything after 'Bearer ')
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. Malformed token.' },
      });
      return;
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);

    if(!user || !user.isActive){
      res.status(401).json({
        success: false,
        error: { message: 'Authentication required. Invalid or inactive user' },
      });
      return;
    }

    req.user = user;
    next();

  } catch (error) {
    // Catch JWT expiration or invalid signature errors
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }
};
