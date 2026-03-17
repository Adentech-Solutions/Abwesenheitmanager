import mongoose, { Schema, Document, Model } from 'mongoose';
import { IIntegrationConfig } from '@/types/integrationConfig';
import { encrypt, decrypt } from '@/lib/utils/encryption';

export interface IIntegrationConfigDocument extends Omit<IIntegrationConfig, '_id'>, Document {}

interface IIntegrationConfigModel extends Model<IIntegrationConfigDocument> {
    getConfig(provider: string): Promise<IIntegrationConfigDocument | null>;
    setCredentials(provider: string, clientId: string, clientSecret: string, adminEmail: string): Promise<IIntegrationConfigDocument>;
    getDecryptedSecret(provider: string): Promise<{ clientId: string; clientSecret: string } | null>;
}

const IntegrationConfigSchema = new Schema<IIntegrationConfigDocument, IIntegrationConfigModel>(
    {
        provider: {
            type: String,
            required: true,
            unique: true,
            enum: ['personio', 'entra_id', 'teams_bot'],
        },
        isEnabled: {
            type: Boolean,
            default: false,
        },
        credentials: {
            clientId: { type: String },
            clientSecretEncrypted: { type: String },
            accessToken: { type: String },
            tokenExpiresAt: { type: Date },
        },
        settings: {
            autoSyncEnabled: { type: Boolean, default: false },
            syncIntervalHours: { type: Number, default: 24 },
            writeBackEnabled: { type: Boolean, default: true },
        },
        lastTestedAt: { type: Date },
        lastTestResult: {
            success: { type: Boolean },
            message: { type: String },
            details: { type: Schema.Types.Mixed },
        },
        configuredBy: { type: String },
        configuredAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Static Methods
IntegrationConfigSchema.statics.getConfig = async function (provider: string) {
    return this.findOne({ provider }).exec();
};

IntegrationConfigSchema.statics.setCredentials = async function (
    provider: string,
    clientId: string,
    clientSecret: string,
    adminEmail: string
) {
    const clientSecretEncrypted = encrypt(clientSecret);
    
    return this.findOneAndUpdate(
        { provider },
        {
            $set: {
                'credentials.clientId': clientId,
                'credentials.clientSecretEncrypted': clientSecretEncrypted,
                configuredBy: adminEmail,
                configuredAt: new Date(),
            },
        },
        { new: true, upsert: true }
    ).exec();
};

IntegrationConfigSchema.statics.getDecryptedSecret = async function (provider: string) {
    const config = await this.findOne({ provider }).exec();
    
    if (!config || !config.credentials || !config.credentials.clientId || !config.credentials.clientSecretEncrypted) {
        return null;
    }
    
    try {
        const clientSecret = decrypt(config.credentials.clientSecretEncrypted);
        return {
            clientId: config.credentials.clientId,
            clientSecret,
        };
    } catch (error) {
        console.error(`Error decrypting credentials for provider ${provider}:`, error);
        return null;
    }
};

const IntegrationConfig = (mongoose.models.IntegrationConfig as IIntegrationConfigModel) || 
    mongoose.model<IIntegrationConfigDocument, IIntegrationConfigModel>('IntegrationConfig', IntegrationConfigSchema);

export default IntegrationConfig;
