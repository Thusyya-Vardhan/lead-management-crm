import { Request, Response, NextFunction } from 'express';
import { Lead } from '../models/Lead.js';
import { User } from '../models/User.js';

/**
 * POST /api/leads
 * Admin only: Create a new lead and optionally assign it to an employee.
 */
export const createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, company, status, assignedTo, notes } = req.body;

    if (!name || !email || !phone || !company) {
      res.status(400).json({
        success: false,
        error: { message: 'Name, email, phone, and company are required fields' },
      });
      return;
    }

    // If assigning to an employee on creation, verify the assigned user exists
    if (assignedTo) {
      const employee = await User.findById(assignedTo);
      if (!employee) {
        res.status(400).json({
          success: false,
          error: { message: 'Assigned employee does not exist' },
        });
        return;
      }
    }

    const lead = await Lead.create({
      name,
      email: email.toLowerCase().trim(),
      phone,
      company,
      status: status || 'NEW',
      assignedTo: assignedTo || null,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      lead,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leads
 * Authenticated: Fetch leads with Horizontal Authorization
 * - ADMIN: Sees ALL leads
 * - EMPLOYEE: Sees ONLY leads where assignedTo === req.user._id
 */
export const getLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter : Record<string, any> = {};

    if(req.user?.role === 'EMPLOYEE'){
      filter.assignedTo = req.user._id;
    }

    const leads = await Lead.find(filter).populate('assignedTo', 'name email').sort({createdAt: -1});
    res.status(200).json({success: true, count: leads.length, leads: leads});
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/leads/:id
 * Fetch a single lead by ID
 * - ADMIN: Can view any lead
 * - EMPLOYEE: Can ONLY view if assigned to them (otherwise 404)
 */
export const getLeadById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id).populate('assignedTo', 'name email');

    if (!lead) {
      res.status(404).json({ success: false, error: { message: 'Lead not found' } });
      return;
    }

    // Horizontal check for Employee
    if (req.user!.role === 'EMPLOYEE') {
      const isAssigned = lead.assignedTo && (lead.assignedTo as any)._id.equals(req.user!._id);
      if (!isAssigned) {
        // Return 404 rather than 403 to prevent ID enumeration
        res.status(404).json({ success: false, error: { message: 'Lead not found' } });
        return;
      }
    }

    res.status(200).json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/leads/:id
 * Update a lead:
 * - ADMIN: Can update all fields, including reassigning 'assignedTo'
 * - EMPLOYEE: Can update details (status, notes, etc.) of assigned lead, but CANNOT reassign
 * - OCC: Catches VersionError and returns 409 Conflict
 */
export const updateLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      res.status(404).json({ success: false, error: { message: 'Lead not found' } });
      return;
    }

    // Horizontal check for Employee
    if (req.user!.role === 'EMPLOYEE') {
      const isAssigned = lead.assignedTo && lead.assignedTo.equals(req.user!._id);
      if (!isAssigned) {
        res.status(404).json({ success: false, error: { message: 'Lead not found' } });
        return;
      }

      // Employees cannot reassign leads to someone else
      if (req.body.assignedTo !== undefined) {
        res.status(403).json({
          success: false,
          error: { message: 'Employees are not authorized to reassign leads' },
        });
        return;
      }
    }

    // OCC check: If client supplied __v and it doesn't match current DB version, return 409
    if (req.body.__v !== undefined && Number(req.body.__v) !== lead.__v) {
      res.status(409).json({
        success: false,
        error: { message: 'This lead was modified by another user. Please refresh and review latest changes.' },
      });
      return;
    }

    // Apply allowed updates
    const { name, email, phone, company, status, notes, assignedTo } = req.body;
    if (name !== undefined) lead.name = name;
    if (email !== undefined) lead.email = email.toLowerCase().trim();
    if (phone !== undefined) lead.phone = phone;
    if (company !== undefined) lead.company = company;
    if (status !== undefined) lead.status = status;
    if (notes !== undefined) lead.notes = notes;

    // Only Admin can reassign
    if (req.user!.role === 'ADMIN' && assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        lead.assignedTo = null;
      } else {
        const employee = await User.findById(assignedTo);
        if (!employee) {
          res.status(400).json({ success: false, error: { message: 'Assigned employee does not exist' } });
          return;
        }
        lead.assignedTo = employee._id as any;
      }
    }

    // Save with Optimistic Concurrency Control
    await lead.save();

    res.status(200).json({ success: true, lead });
  } catch (error: any) {
    // Catch Mongoose VersionError (Optimistic Concurrency Control)
    if (error.name === 'VersionError') {
      res.status(409).json({
        success: false,
        error: { message: 'This lead was modified by another user. Please refresh and review latest changes.' },
      });
      return;
    }
    next(error);
  }
};

/**
 * DELETE /api/leads/:id
 * Admin only: Direct deletion of a lead
 */
export const deleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      res.status(404).json({ success: false, error: { message: 'Lead not found' } });
      return;
    }

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};
