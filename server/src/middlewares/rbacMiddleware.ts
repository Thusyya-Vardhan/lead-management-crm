import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } })
      return;
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ success: false, error: { message: 'Access denied: Insufficient permissions' } })
      return;
    }
    next();

  };
};
