import { Router } from 'express';
import {
  submitDeletionRequest,
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
} from '../controllers/deletionRequestController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.use(authenticate);

// Both Admin and Employee can view (filtered horizontally)
router.get('/', getDeletionRequests);

// Employee/Admin submits request
router.post('/', submitDeletionRequest);

// Admin-only approval & rejection
router.post('/:id/approve', authorize('ADMIN'), approveDeletionRequest);
router.post('/:id/reject', authorize('ADMIN'), rejectDeletionRequest);

export default router;
