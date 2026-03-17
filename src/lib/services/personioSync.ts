import { 
    getEmployees, 
    getAbsenceBalance, 
    getAbsenceTypes, 
    createAbsencePeriod, 
    deleteAbsencePeriod 
} from '@/lib/services/personioClient';
import User from '@/models/User';
import Absence from '@/models/Absence';
import SyncLog from '@/models/SyncLog';
import IntegrationConfig from '@/models/IntegrationConfig';
import connectDB from '@/lib/mongodb';
import { format } from 'date-fns';

export async function syncPersonioEmployees(triggeredBy: 'admin' | 'cron', triggeredByEmail?: string) {
    await connectDB();

    const syncLog = await SyncLog.create({
        syncType: 'personio_employees',
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
        const personioEmployees = await getEmployees();
        
        for (const emp of personioEmployees) {
            try {
                if (!emp.email) {
                    syncLog.stats.skipped++;
                    continue;
                }

                const user = await User.findOne({ email: emp.email.toLowerCase() });
                
                if (user) {
                    // Update the mapping ID
                    user.personioId = emp.id;

                    if (user.vacationDays && user.vacationDays.source === 'personio') {
                        // Fully sync vacation balances
                        const balances = await getAbsenceBalance(emp.id);
                        
                        // Look for a balance matching paid vacation
                        const vacationBalance = balances.find(b => 
                            (b.category && b.category.includes('paid_vacation')) || 
                            (b.name && b.name.toLowerCase().includes('urlaub'))
                        );

                        // Personio returns absence_entitlement value on the employee directly
                        const entitlement = emp.absence_entitlement || 0;
                        const effectiveBalance = vacationBalance ? vacationBalance.balance : 0;
                        const usedTicks = Math.max(0, entitlement - effectiveBalance);

                        user.vacationDays.total = entitlement;
                        user.vacationDays.remaining = effectiveBalance;
                        user.vacationDays.used = usedTicks;

                        user.lastSyncedAt = new Date();
                        await user.save();
                        
                        syncLog.stats.updated++;
                    } else {
                        // User maps correctly, but their source isn't managed by Personio
                        // Save just the personioId and advance without touching balances
                        await user.save();
                        syncLog.stats.skipped++;
                    }
                } else {
                    // Local user doesn't exist yet via Entra sync
                    syncLog.stats.skipped++;
                }

            } catch (userError: any) {
                console.error(`Error processing Personio employee ${emp.id} (${emp.email}):`, userError);
                syncLog.stats.errors++;
                syncLog.errorDetails.push({
                    userId: String(emp.id),
                    message: userError.message || 'Error processing individual user'
                });
            }
        }

        syncLog.status = 'completed';
        syncLog.completedAt = new Date();
        syncLog.durationMs = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
        await syncLog.save();

        return syncLog;

    } catch (error: any) {
        console.error('Fatal error during Personio Employee sync:', error);
        
        syncLog.status = 'error';
        syncLog.completedAt = new Date();
        syncLog.durationMs = syncLog.completedAt.getTime() - syncLog.startedAt.getTime();
        syncLog.errorDetails.push({
            userId: 'SYSTEM',
            message: error.message || 'Fatal sync error fetching employees'
        });
        
        await syncLog.save();
        return syncLog;
    }
}

export async function writeBackAbsenceToPersonio(absence: any, dbUser: any) {
    if (!dbUser.personioId) {
        return { success: false, reason: 'no_mapping' };
    }
    
    // Write back only formal vacations
    if (absence.type !== 'vacation') {
        return { success: false, reason: 'not_vacation' };
    }

    try {
        await connectDB();
        const config = await IntegrationConfig.getConfig('personio');
        
        if (!config || !config.isEnabled || !config.settings?.writeBackEnabled) {
            return { success: false, reason: 'write_back_disabled' };
        }

        const absenceTypes = await getAbsenceTypes();
        const vacationType = absenceTypes.find(t => t.category === 'paid_vacation');
        
        if (!vacationType) {
            return { success: false, reason: 'no_vacation_type_found_in_personio' };
        }

        const result = await createAbsencePeriod({
            employee_id: dbUser.personioId,
            absence_type_id: vacationType.id,
            start_date: format(new Date(absence.startDate), 'yyyy-MM-dd'),
            end_date: format(new Date(absence.endDate), 'yyyy-MM-dd'),
            half_day_start: absence.isHalfDay && absence.halfDayPeriod === 'morning',
            half_day_end: absence.isHalfDay && absence.halfDayPeriod === 'afternoon',
            comment: 'Genehmigt via Absence Manager',
            skip_approval: true
        });

        // Save mapping permanently
        await Absence.findByIdAndUpdate(absence._id, {
            personioAbsenceId: result.id.toString()
        });

        return { success: true, personioAbsenceId: result.id };
    } catch (error: any) {
        console.error('Fire-and-forget WriteBack failed for Personio:', error);
        return { success: false, reason: error.message || 'error' };
    }
}

export async function cancelAbsenceInPersonio(absence: any) {
    if (!absence.personioAbsenceId) {
        return { success: false, reason: 'no_personio_id' };
    }

    try {
        await connectDB();
        const config = await IntegrationConfig.getConfig('personio');
        
        if (!config || !config.isEnabled) {
            return { success: false, reason: 'not_configured' };
        }

        const result = await deleteAbsencePeriod(absence.personioAbsenceId);

        if (result.success) {
            await Absence.findByIdAndUpdate(absence._id, {
                $unset: { personioAbsenceId: 1 }
            });
            return { success: true };
        } else {
            return { success: false, reason: result.error };
        }

    } catch (error: any) {
        console.error('Cancellation sync failed for Personio:', error);
        return { success: false, reason: error.message || 'error' };
    }
}
