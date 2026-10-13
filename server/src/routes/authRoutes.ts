import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);

// RBAC Verification Test Route
router.get('/test/admin-only', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin! You have admin access.', user: req.user });
});

export default router;
