import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
    name: string;
    date: Date;
    isRecurring: boolean; // If true, applies to every year
    states: string[]; // Array of state codes or ['all']
    type: 'public' | 'company'; // Public holiday or company-specific (e.g. Christmas Eve half day)
}

const HolidaySchema = new Schema<IHoliday>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name for the holiday'],
            trim: true,
        },
        date: {
            type: Date,
            required: [true, 'Please provide a date'],
        },
        isRecurring: {
            type: Boolean,
            default: false,
        },
        states: {
            type: [String],
            default: ['all'],
        },
        type: {
            type: String,
            enum: ['public', 'company'],
            default: 'public',
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate holidays on the same date (unless recurring logic is handled differently, but simple unique index helps)
// For recurring, we might need to be careful. Let's just index date for now.
HolidaySchema.index({ date: 1 });

export default mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
