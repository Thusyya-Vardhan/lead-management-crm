import { Request, Response, NextFunction } from 'express';
import { DeletionRequest } from '../models/DeletionRequest.js';
import { Lead } from '../models/Lead.js';

/**
 * POST /api/deletion-requests
 * Submits a deletion request for a lead.
 * Employees can only request deletion of leads assigned to them.
 */
export const submitDeletionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { leadId, reason } = req.body;

    if (!leadId || !reason) {
      res.status(400).json({
        success: false,
        error: { message: 'leadId and reason are required fields' },
      });
      return;
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({ success: false, error: { message: 'Lead not found' } });
      return;
    }

    // Horizontal check for Employee
    if (req.user!.role === 'EMPLOYEE') {
      const isAssigned = lead.assignedTo && lead.assignedTo.equals(req.user!._id);
      if (!isAssigned) {
        res.status(403).json({
          success: false,
          error: { message: 'You can only request deletion for leads assigned to you' },
        });
        return;
      }
    }

    // Check if there is already a PENDING request for this lead
    const existingRequest = await DeletionRequest.findOne({
      leadId: lead._id,
      status: 'PENDING',
    });

    if (existingRequest) {
      res.status(400).json({
        success: false,
        error: { message: 'A pending deletion request already exists for this lead' },
      });
      return;
    }

    const deletionRequest = await DeletionRequest.create({
      leadId: lead._id,
      leadName: lead.name,
      leadCompany: lead.company,
      requestedBy: req.user!._id,
      reason: reason.trim(),
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      deletionRequest,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deletion-requests
 * - ADMIN: Sees all deletion requests
 * - EMPLOYEE: Sees only requests they submitted
 */
export const getDeletionRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    if (req.user!.role === 'EMPLOYEE') {
      filter.requestedBy = req.user!._id;
    }

    // Optional status filter e.g. /api/deletion-requests?status=PENDING
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await DeletionRequest.find(filter)
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      deletionRequests: requests,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/deletion-requests/:id/approve
 * Admin only: Approves the deletion request and deletes the lead from MongoDB
 */
export const approveDeletionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await DeletionRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, error: { message: 'Deletion request not found' } });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: { message: `Request is already ${request.status.toLowerCase()}` },
      });
      return;
    }

    // 1. Delete the lead from database
    await Lead.findByIdAndDelete(request.leadId);

    // 2. Mark request as APPROVED
    request.status = 'APPROVED';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Deletion request approved and lead deleted',
      deletionRequest: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/deletion-requests/:id/reject
 * Admin only: Rejects the request, keeps the lead untouched
 */
export const rejectDeletionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const request = await DeletionRequest.findById(id);
    if (!request) {
      res.status(404).json({ success: false, error: { message: 'Deletion request not found' } });
      return;
    }

    if (request.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: { message: `Request is already ${request.status.toLowerCase()}` },
      });
      return;
    }

    // Mark request as REJECTED (lead stays active in database)
    request.status = 'REJECTED';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Deletion request rejected',
      deletionRequest: request,
    });
  } catch (error) {
    next(error);
  }
};
