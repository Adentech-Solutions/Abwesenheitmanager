import { sendTeamsMessageDelegated } from './graph-client-delegated';

/**
 * Send approval notification to manager using delegated permissions
 * This sends the message on behalf of the logged-in user (employee)
 */
export async function sendApprovalNotification(
  fromUserId: string,  // Not used in delegated flow, kept for compatibility
  managerId: string,
  managerEmail: string,
  absenceDetails: {
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    approvalLink: string;
  }
) {
  const message = `
    <h3>🏖️ Neuer Abwesenheitsantrag</h3>
    <p><strong>Von:</strong> ${absenceDetails.employeeName}</p>
    <p><strong>Art:</strong> ${absenceDetails.type}</p>
    <p><strong>Zeitraum:</strong> ${absenceDetails.startDate} - ${absenceDetails.endDate}</p>
    <p><strong>Dauer:</strong> ${absenceDetails.totalDays} Tage</p>
    <p><a href="${absenceDetails.approvalLink}">Jetzt genehmigen</a></p>
  `;

  try {
    await sendTeamsMessageDelegated(managerId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
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
  const statusEmoji = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'genehmigt' : 'abgelehnt';

  const message = `
    <h3>${statusEmoji} Abwesenheitsantrag ${statusText}</h3>
    <p><strong>Art:</strong> ${absenceDetails.type}</p>
    <p><strong>Zeitraum:</strong> ${absenceDetails.startDate} - ${absenceDetails.endDate}</p>
    ${absenceDetails.reason ? `<p><strong>Grund:</strong> ${absenceDetails.reason}</p>` : ''}
  `;

  try {
    await sendTeamsMessageDelegated(toUserId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
    return { success: false, error };
  }
}