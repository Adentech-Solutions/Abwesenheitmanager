export interface IIntegrationConfig {
    _id: string;
    provider: 'personio' | 'entra_id' | 'teams_bot';
    isEnabled: boolean;
    credentials?: {
        clientId?: string;
        clientSecretEncrypted?: string;
        accessToken?: string;
        tokenExpiresAt?: Date;
    };
    settings?: {
        autoSyncEnabled: boolean;
        syncIntervalHours: number;
        writeBackEnabled: boolean;
    };
    lastTestedAt?: Date;
    lastTestResult?: {
        success: boolean;
        message?: string;
        details?: any;
    };
    configuredBy?: string;
    configuredAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
