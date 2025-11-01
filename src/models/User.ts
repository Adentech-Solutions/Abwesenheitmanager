// ========================================
// FILE: src/models/User.ts
// User MongoDB Model
// ========================================
import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types/user';

interface IUserDocument extends IUser, mongoose.Document {
  updateVacationBalance(days: number): Promise<this>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    entraId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    managerId: {
      type: String,
      index: true,
    },
    managerEmail: {
      type: String,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['employee', 'manager', 'admin'],
      default: 'employee',
    },
    vacationDays: {
      total: {
        type: Number,
        default: 30,
      },
      used: {
        type: Number,
        default: 0,
      },
      remaining: {
        type: Number,
        default: 30,
      },
      carryOver: {
        type: Number,
        default: 0,
      },
    },
    startDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// Methods
UserSchema.methods.updateVacationBalance = function(days: number) {
  this.vacationDays.used += days;
  this.vacationDays.remaining = this.vacationDays.total - this.vacationDays.used;
  return this.save();
};

const User = (mongoose.models.User as Model<IUserDocument>) || mongoose.model<IUserDocument>('User', UserSchema);

export default User;
export type { IUserDocument };