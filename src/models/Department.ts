import mongoose, { Schema, Document } from 'mongoose';
import { IDepartment } from '@/types/department';

export interface IDepartmentDocument extends Omit<IDepartment, '_id'>, Document {}

const DepartmentSchema = new Schema<IDepartmentDocument>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name for the department'],
            trim: true,
            unique: true,
        },
        entraGroupId: {
            type: String,
            sparse: true,
            unique: true,
        },
        bundesland: {
            type: String,
            required: true,
            enum: ['BW','BY','BE','BB','HB','HH','HE','MV','NI','NW','RP','SL','SN','ST','SH','TH'],
            default: 'BY',
        },
        managerId: {
            type: String,
        },
        managerName: {
            type: String,
        },
        personioId: {
            type: Number,
            index: { sparse: true },
        },
        syncSource: {
            type: String,
            enum: ['manual', 'entra', 'personio', 'scim'],
            default: 'manual',
        },
        memberCount: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DepartmentSchema.index({ bundesland: 1, isActive: 1 });

export default mongoose.models.Department || mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);
