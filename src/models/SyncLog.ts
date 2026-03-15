import mongoose, { Schema, Document } from 'mongoose';
import { ISyncLog } from '@/types/syncLog';

export interface ISyncLogDocument extends Omit<ISyncLog, '_id'>, Document {}

const SyncLogSchema = new Schema<ISyncLogDocument>(
    {
        syncType: {
            type: String,
            required: true,
            enum: ['entra_users', 'entra_groups', 'personio_vacation', 'personio_employees'],
        },
        status: {
            type: String,
            required: true,
            enum: ['running', 'completed', 'error'],
            default: 'running',
        },
        triggeredBy: {
            type: String,
            required: true,
            enum: ['admin', 'cron', 'login'],
        },
        triggeredByEmail: {
            type: String,
        },
        stats: {
            created: { type: Number, default: 0 },
            updated: { type: Number, default: 0 },
            deactivated: { type: Number, default: 0 },
            skipped: { type: Number, default: 0 },
            errors: { type: Number, default: 0 },
        },
        errorDetails: [
            {
                userId: { type: String },
                message: { type: String },
            },
        ],
        startedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
        },
        durationMs: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

SyncLogSchema.index({ syncType: 1, startedAt: -1 });

export default mongoose.models.SyncLog || mongoose.model<ISyncLogDocument>('SyncLog', SyncLogSchema);
