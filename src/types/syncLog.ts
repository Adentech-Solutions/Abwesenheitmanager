export interface ISyncLog {
    _id: string;
    syncType: 'entra_users' | 'entra_groups' | 'personio_vacation' | 'personio_employees';
    status: 'running' | 'completed' | 'error';
    triggeredBy: 'admin' | 'cron' | 'login';
    triggeredByEmail?: string;
    stats: {
        created: number;
        updated: number;
        deactivated: number;
        skipped: number;
        errors: number;
    };
    errorDetails?: Array<{ userId: string; message: string }>;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
