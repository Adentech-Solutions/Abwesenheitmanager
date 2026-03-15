import { getEntraGroups, getGroupMembers } from '@/lib/graph-client';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import SyncLog from '@/models/SyncLog';
import User from '@/models/User';

export async function syncEntraGroups(triggeredBy: 'admin' | 'cron', triggeredByEmail?: string) {
    await connectDB();

    // 1. Create a SyncLog entry
    const syncLog = await SyncLog.create({
        syncType: 'entra_groups',
        status: 'running',
        triggeredBy,
        triggeredByEmail,
        startedAt: new Date(),
        stats: {
            created: 0,
            updated: 0,
            deactivated: 0,
            skipped: 0,
            errors: 0,
        },
        errorDetails: [],
    });

    try {
        // 2. Fetch all groups from Entra ID
        const entraGroups = await getEntraGroups();
        
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const group of entraGroups) {
            try {
                // Find matching department
                const department = await Department.findOne({ entraGroupId: group.id });

                if (department) {
                    // a. Update department name if changed
                    if (department.name !== group.displayName) {
                        department.name = group.displayName;
                    }

                    // b. Call getGroupMembers and update memberCount
                    const members = await getGroupMembers(group.id);
                    department.memberCount = members.length;
                    department.syncSource = 'entra';
                    
                    await department.save();

                    // c. Update Users in DB
                    for (const member of members) {
                        if (!member.mail) continue; // Skip if no email

                        // Find user by email
                        const user = await User.findOne({ email: member.mail.toLowerCase() });
                        
                        if (user) {
                            user.departmentId = department._id.toString();
                            
                            // Ensure entraGroups array exists
                            if (!user.entraGroups) {
                                user.entraGroups = [];
                            }
                            
                            // Add group ID if not already present
                            if (!user.entraGroups.includes(group.id)) {
                                user.entraGroups.push(group.id);
                            }

                            user.lastSyncedAt = new Date();
                            await user.save();
                        }
                    }

                    updatedCount++;
                } else {
                    // Group exists in Entra but not mapped locally -> skipped
                    skippedCount++;
                }
            } catch (groupError: any) {
                console.error(`Error processing group ${group.id}:`, groupError);
                errorCount++;
                syncLog.errorDetails.push({
                    userId: group.id, // Storing group ID in userId field for simplicity
                    message: groupError.message || 'Unknown error processing group'
                });
            }
        }

        // 3. Complete sync log
        syncLog.status = 'completed';
        syncLog.completedAt = new Date();
        syncLog.durationMs = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
        syncLog.stats.updated = updatedCount;
        syncLog.stats.skipped = skippedCount;
        syncLog.stats.errors = errorCount;

        await syncLog.save();
        return syncLog;

    } catch (error: any) {
        console.error('Fatal error during Entra Group sync:', error);
        
        // Update log with fetal error
        syncLog.status = 'error';
        syncLog.completedAt = new Date();
        syncLog.durationMs = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
        syncLog.errorDetails.push({
            userId: 'SYSTEM',
            message: error.message || 'Fatal sync error'
        });
        
        await syncLog.save();
        return syncLog;
    }
}

export async function fetchEntraGroupsPreview() {
    // Simply fetch and return groups without saving or logging
    const groups = await getEntraGroups();
    return groups;
}
