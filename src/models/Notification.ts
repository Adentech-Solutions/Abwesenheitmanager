import mongoose, { Schema, Model } from 'mongoose';

export interface INotification {
  userId: string;
  userEmail: string;
  type: 'absence_request' | 'absence_approved' | 'absence_rejected' | 'substitute_assigned' | 'vacation_reminder';
  title: string;
  message: string;
  relatedAbsenceId?: string;
  isRead: boolean;
  sentViaEmail: boolean;
  sentViaTeams: boolean;
  createdAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    type: {
      type: String,
      enum: ['absence_request', 'absence_approved', 'absence_rejected', 'substitute_assigned', 'vacation_reminder'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedAbsenceId: {
      type: String,
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    sentViaEmail: {
      type: Boolean,
      default: false,
    },
    sentViaTeams: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification: Model<INotification> = 
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;