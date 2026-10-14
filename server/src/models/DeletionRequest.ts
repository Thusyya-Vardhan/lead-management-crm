import mongoose, { Document, Schema, Types } from 'mongoose';

export type DeletionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IDeletionRequest extends Document {
  leadId: Types.ObjectId;
  leadName: string;
  leadCompany: string;
  requestedBy: Types.ObjectId;
  reason: string;
  status: DeletionRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const deletionRequestSchema = new Schema<IDeletionRequest>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
    },
    leadName: {
      type: String,
      required: true,
      trim: true,
    },
    leadCompany: {
      type: String,
      required: true,
      trim: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for deletion is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

deletionRequestSchema.index({ requestedBy: 1 });
deletionRequestSchema.index({ status: 1 });

export const DeletionRequest = mongoose.model<IDeletionRequest>(
  'DeletionRequest',
  deletionRequestSchema
);
