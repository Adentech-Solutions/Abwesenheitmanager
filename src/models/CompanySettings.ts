// src/models/CompanySettings.ts
// Company-wide settings including location/state for holidays

import mongoose, { Schema, Document, Model } from 'mongoose';
import { GermanState } from '@/lib/utils/holidays';

export interface ICompanySettings extends Document {
  companyName: string;
  state: GermanState;
  maxConcurrentAbsences: number;
  vacationDaysPerYear: number;
  carryOverDays: number;
  requireApproval: boolean;
  autoApproveAfterDays: number;
  notifyManagerOnRequest: boolean;
  notifyUserOnApproval: boolean;
  workingDays: number[];
  createdAt: Date;
  updatedAt: Date;
}

// ⭐ Interface für statische Methoden
interface ICompanySettingsModel extends Model<ICompanySettings> {
  getSettings(): Promise<ICompanySettings>;
  updateSettings(updates: Partial<ICompanySettings>): Promise<ICompanySettings>;
}

const CompanySettingsSchema = new Schema<ICompanySettings, ICompanySettingsModel>(
  {
    companyName: {
      type: String,
      required: true,
      default: 'Meine Firma',
    },
    state: {
      type: String,
      required: true,
      enum: [
        'BW', 'BY', 'BE', 'BB', 'HB', 'HH', 
        'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 
        'SN', 'ST', 'SH', 'TH'
      ],
      default: 'BY',
    },
    maxConcurrentAbsences: {
      type: Number,
      default: 3,
      min: 1,
    },
    vacationDaysPerYear: {
      type: Number,
      default: 30,
      min: 20,
      max: 40,
    },
    carryOverDays: {
      type: Number,
      default: 5,
      min: 0,
      max: 10,
    },
    requireApproval: {
      type: Boolean,
      default: true,
    },
    autoApproveAfterDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    notifyManagerOnRequest: {
      type: Boolean,
      default: true,
    },
    notifyUserOnApproval: {
      type: Boolean,
      default: true,
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
      validate: {
        validator: function(days: number[]) {
          return days.every(day => day >= 0 && day <= 6);
        },
        message: 'Working days must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
  },
  {
    timestamps: true,
  }
);

// ⭐ Statische Methode: Get or create settings
CompanySettingsSchema.statics.getSettings = async function(this: ICompanySettingsModel) {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({
      companyName: 'Meine Firma',
      state: 'BY',
    });
  }
  
  return settings;
};

// ⭐ Statische Methode: Update settings
CompanySettingsSchema.statics.updateSettings = async function(
  this: ICompanySettingsModel,
  updates: Partial<ICompanySettings>
) {
  let settings = await this.getSettings();
  
  Object.assign(settings, updates);
  await settings.save();
  
  return settings;
};

// ⭐ Export mit korrektem Type
const CompanySettings = (mongoose.models.CompanySettings as ICompanySettingsModel) || 
  mongoose.model<ICompanySettings, ICompanySettingsModel>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;