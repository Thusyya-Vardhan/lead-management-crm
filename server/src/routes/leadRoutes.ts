import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from '../controllers/leadController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';

const router = Router();

// All lead routes require an authenticated user
router.use(authenticate);

// GET /api/leads - Admins see all; Employees see assigned only
router.get('/', getLeads);

// POST /api/leads - Admin only creates leads
router.post('/', authorize('ADMIN'), createLead);

// GET /api/leads/:id - Admin can view any; Employee can only view assigned
router.get('/:id', getLeadById);

// PATCH /api/leads/:id - Admin updates all + reassigns; Employee updates assigned only (no reassign)
router.patch('/:id', updateLead);

// DELETE /api/leads/:id - Admin only direct delete
router.delete('/:id', authorize('ADMIN'), deleteLead);

export default router;
