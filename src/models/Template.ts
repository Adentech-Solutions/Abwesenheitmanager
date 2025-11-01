import mongoose, { Schema, Model } from 'mongoose';

export interface ITemplate {
  _id?: string;
  name: string;
  role: 'employee' | 'manager' | 'executive' | 'all';
  subject?: string;
  content: string;
  includeSubstitute: boolean;
  forExternal: boolean;
  forInternal: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'executive', 'all'],
      default: 'all',
    },
    subject: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    includeSubstitute: {
      type: Boolean,
      default: true,
    },
    forExternal: {
      type: Boolean,
      default: true,
    },
    forInternal: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TemplateSchema.index({ role: 1, isDefault: 1 });

const Template: Model<ITemplate> = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);

export default Template;