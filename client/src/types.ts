export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export type DeletionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DeletionRequest {
  _id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  requestedBy: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  status: DeletionStatus;
  createdAt: string;
}
