import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    key: string;
    value: any;
    description?: string;
    category: 'general' | 'absence' | 'notification';
}

const SettingsSchema = new Schema<ISettings>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        description: String,
        category: {
            type: String,
            enum: ['general', 'absence', 'notification'],
            default: 'general',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
