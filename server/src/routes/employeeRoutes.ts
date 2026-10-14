import { Router } from 'express';
import { getEmployees, createEmployee } from '../controllers/employeeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

const router = Router();

// All employee management routes require Admin privileges
router.use(authenticate, authorize('ADMIN'));

router.get('/', getEmployees);
router.post('/', createEmployee);

export default router;
