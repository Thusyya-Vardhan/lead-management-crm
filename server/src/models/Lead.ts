import mongoose, { Document, Schema, Types } from 'mongoose';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  assignedTo?: Types.ObjectId | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number; // Mongoose version key for Optimistic Concurrency Control
}

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Lead email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'NEW',
          'CONTACTED',
          'QUALIFIED',
          'PROPOSAL_SENT',
          'CLOSED_WON',
          'CLOSED_LOST',
        ],
        message: '{VALUE} is not a valid lead status',
      },
      default: 'NEW',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Prevents concurrent update overwrites
  }
);

// Index for fast horizontal lookup by assigned employee
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ email: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
