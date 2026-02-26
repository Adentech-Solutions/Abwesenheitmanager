import { sendTeamsAdaptiveCard } from './graph-client-delegated';
import {
  createAbsenceRequestCard, createStatusNotificationCard, createHandoverCard,
  createHandoverAcknowledgedCard,
  createHandoverTrackerCard,
  createReturnPromptCard,
  createWelcomeBackCard,
} from './adaptive-cards';
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


  const card = createAbsenceRequestCard({
    ...absenceDetails,
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

/**
 * Send handover notification to substitute after absence is approved
 */
export async function sendHandoverNotification(
  fromUserId: string,
  substituteUserId: string,
  absenceDetails: {
    absenceId: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  },
  handoverDetails: {
    items: { id: string; title: string; description?: string; links?: { title: string; url: string }[]; isUrgent: boolean }[];
    generalNotes?: string;
    emergencyContact?: {
      availability: 'unavailable' | 'emergency_only' | 'limited_email';
      phone?: string;
      note?: string;
    };
  }
) {
  // Generate acknowledge magic link
  const acknowledgeToken = generateActionToken({
    absenceId: absenceDetails.absenceId,
    action: 'acknowledge',
    approverId: substituteUserId, // The substitute who acknowledges
    actorId: substituteUserId,
  });

  const acknowledgeUrl = `${APP_URL}/api/handover/${absenceDetails.absenceId}/acknowledge?token=${acknowledgeToken}`;

  const card = createHandoverCard({
    employeeName: absenceDetails.employeeName,
    startDate: absenceDetails.startDate,
    endDate: absenceDetails.endDate,
    totalDays: absenceDetails.totalDays,
    items: handoverDetails.items,
    generalNotes: handoverDetails.generalNotes,
    emergencyContact: handoverDetails.emergencyContact,
    acknowledgeUrl,
  });

  try {
    await sendTeamsAdaptiveCard(substituteUserId, card);
    console.log('✅ Handover notification sent to substitute:', substituteUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send handover notification:', error);
    return { success: false, error };
  }
}

/**
 * Send handover acknowledged notification to employee
 */
export async function sendHandoverAcknowledged(
  fromUserId: string,
  employeeUserId: string,
  substituteName: string
) {
  const card = createHandoverAcknowledgedCard(substituteName);

  try {
    await sendTeamsAdaptiveCard(employeeUserId, card);
    console.log('✅ Handover acknowledged notification sent to employee:', employeeUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send handover acknowledged notification:', error);
    return { success: false, error };
  }
}

/**
 * Send interactive Tracker Card to substitute (Phase 1b)
 */
export async function sendHandoverTrackerCard(
  substituteUserId: string,
  absenceDetails: {
    id: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    items: any[];
  }
) {
  const generateActionUrl = (itemId: string, action: 'mark_done' | 'add_note') => {
    const token = generateActionToken({
      absenceId: absenceDetails.id,
      action: action,
      approverId: substituteUserId,
      actorId: substituteUserId,
      itemId,
    });
    // Add specific endpoint based on action
    const endpoint = action === 'mark_done'
      ? `/api/handover/${absenceDetails.id}/items/${itemId}/done`
      : `/api/handover/${absenceDetails.id}/add-note`;

    return `${APP_URL}${endpoint}?token=${token}`;
  };

  const card = createHandoverTrackerCard({
    absenceId: absenceDetails.id,
    employeeName: absenceDetails.employeeName,
    startDate: new Date(absenceDetails.startDate).toLocaleDateString('de-DE'),
    endDate: new Date(absenceDetails.endDate).toLocaleDateString('de-DE'),
    items: absenceDetails.items,
    generateActionUrl,
  });

  try {
    const response = await sendTeamsAdaptiveCard(substituteUserId, card);
    console.log('✅ Handover Tracker Card sent to substitute:', substituteUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send Handover Tracker Card:', error);
    return { success: false, error };
  }
}

/**
 * Send Return Prompt Card to substitute (Phase 1c)
 */
export async function sendReturnPromptCard(
  substituteUserId: string,
  absenceDetails: {
    id: string;
    employeeName: string;
    endDate: string;
  }
) {
  const generateActionUrl = (action: 'return_summary') => {
    const token = generateActionToken({
      absenceId: absenceDetails.id,
      action: action,
      approverId: substituteUserId,
      actorId: substituteUserId,
    });
    return `${APP_URL}/api/handover/${absenceDetails.id}/return-summary?token=${token}`;
  };

  const card = createReturnPromptCard({
    absenceId: absenceDetails.id,
    employeeName: absenceDetails.employeeName,
    endDate: absenceDetails.endDate,
    generateActionUrl,
  });

  try {
    await sendTeamsAdaptiveCard(substituteUserId, card);
    console.log('✅ Return Prompt Card sent to substitute:', substituteUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send Return Prompt Card:', error);
    return { success: false, error };
  }
}

/**
 * Send Welcome Back Card to employee (Phase 1c)
 */
export async function sendWelcomeBackCard(
  employeeUserId: string,
  details: {
    employeeName: string;
    substituteName: string;
    summary: string;
  }
) {
  const card = createWelcomeBackCard({
    employeeName: details.employeeName,
    substituteName: details.substituteName,
    summary: details.summary,
    openDashboardUrl: `${APP_URL}/dashboard`,
  });

  try {
    await sendTeamsAdaptiveCard(employeeUserId, card);
    console.log('✅ Welcome Back Card sent to employee:', employeeUserId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send Welcome Back Card:', error);
    return { success: false, error };
  }
}