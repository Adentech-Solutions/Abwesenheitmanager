import { NextRequest } from 'next/server';
import AuditLog from '@/models/AuditLog';
import connectDB from '@/lib/mongodb';

export async function auditLog(
    userId: string,
    userEmail: string,
    action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected' | 'viewed' | 'login' | 'logout',
    entityType: 'absence' | 'user' | 'settings' | 'template',
    entityId: string,
    changes: { field: string; oldValue: any; newValue: any }[] | undefined,
    request?: NextRequest
) {
    try {
        await connectDB();

        let ipAddress = '';
        let userAgent = '';

        if (request) {
            ipAddress = request.headers.get('x-forwarded-for') || request.ip || '';
            userAgent = request.headers.get('user-agent') || '';
        }

        await AuditLog.create({
            userId,
            userEmail,
            action,
            entityType,
            entityId,
            changes,
            ipAddress,
            userAgent,
            timestamp: new Date(),
        });

        console.log(`📝 Audit Log: ${action} ${entityType} ${entityId} by ${userEmail}`);
    } catch (error) {
        console.error('❌ Failed to create audit log:', error);
        // Don't throw error to avoid blocking the main action
    }
}
