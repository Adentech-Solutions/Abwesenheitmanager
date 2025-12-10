import { sendTeamsMessageDelegated, sendTeamsAdaptiveCard } from './graph-client-delegated';
import { createAbsenceRequestCard, createStatusNotificationCard } from './adaptive-cards';
import { generateActionToken } from '@/lib/tokens';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send approval notification to manager using delegated permissions
 * This sends the message on behalf of the logged-in user (employee)
 */
export async function sendApprovalNotification(
  fromUserId: string,  // Not used in delegated flow, kept for compatibility
  managerId: string,
  managerEmail: string,
  absenceDetails: {
    id: string; // Added ID for magic links
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    approvalLink: string;
    reason?: string;
  }
) {
  // Generate Magic Links
  const approveToken = generateActionToken({
    absenceId: absenceDetails.id,
    action: 'approve',
    approverId: managerId // The manager who receives this is the approver
  });

  const rejectToken = generateActionToken({
    absenceId: absenceDetails.id,
    action: 'reject',
    approverId: managerId
  });

  const approveUrl = `${APP_URL}/api/approvals/quick?token=${approveToken}`;
  const rejectUrl = `${APP_URL}/api/approvals/quick?token=${rejectToken}`;

  const card = createAbsenceRequestCard({
    ...absenceDetails,
    actions: {
      approveUrl,
      rejectUrl,
      viewUrl: absenceDetails.approvalLink
    }
  });

  try {
    await sendTeamsAdaptiveCard(managerId, card);
    return { success: true };
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    // Fallback? No, just fail for now.
    return { success: false, error };
  }
}

/**
 * Send approval result notification to employee
 */
export async function sendApprovalResultNotification(
  fromUserId: string,  // Not used in delegated flow, kept for compatibility
  toUserId: string,
  status: 'approved' | 'rejected',
  absenceDetails: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }
) {
  const card = createStatusNotificationCard({
    status,
    ...absenceDetails
  });

  try {
    await sendTeamsAdaptiveCard(toUserId, card);
    return { success: true };
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    return { success: false, error };
  }
}