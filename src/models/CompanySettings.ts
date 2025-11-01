import mongoose, { Schema, Model } from 'mongoose';

export interface ICompanySettings {
  _id?: string;
  maxConcurrentAbsences: number;
  teamSize: number;
  defaultVacationDays: number;
  companyHolidays: Array<{
    date: Date;
    name: string;
    recurring: boolean;
  }>;
  workingDays: number[];
  enableBridgeDays: boolean;
  enableIntelligentSuggestions: boolean;
  updatedBy: string;
  updatedAt?: Date;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    maxConcurrentAbsences: {
      type: Number,
      default: 3,
    },
    teamSize: {
      type: Number,
      default: 10,
    },
    defaultVacationDays: {
      type: Number,
      default: 30,
    },
    companyHolidays: [
      {
        date: {
          type: Date,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        recurring: {
          type: Boolean,
          default: true,
        },
      },
    ],
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Monday to Friday
    },
    enableBridgeDays: {
      type: Boolean,
      default: true,
    },
    enableIntelligentSuggestions: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CompanySettings: Model<ICompanySettings> = 
  mongoose.models.CompanySettings || mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;