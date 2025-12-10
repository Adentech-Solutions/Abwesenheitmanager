import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId: string;
    userEmail: string;
    action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'viewed' | 'login' | 'logout';
    entityType: 'absence' | 'user' | 'settings' | 'template';
    entityId: string;
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: true },
        action: { type: String, required: true, index: true },
        entityType: { type: String, required: true, index: true },
        entityId: { type: String, required: true },
        changes: [
            {
                field: String,
                oldValue: Schema.Types.Mixed,
                newValue: Schema.Types.Mixed,
            },
        ],
        ipAddress: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now, index: true },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt automatically
    }
);

// Index for efficient querying
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = (mongoose.models.AuditLog as Model<IAuditLog>) || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
