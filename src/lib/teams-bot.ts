// src/app/api/teams-bot.ts
//
// FIXED: AclCheckFailed → Chat-Erstellung via Delegated Permissions (bevorzugt)
// Fallback: Application Permissions (Bot → User)
//
import graphClient from './graph-client';
import { getDelegatedGraphClient } from './graph-client-delegated';
import {
  createAbsenceRequestCard,
  createStatusNotificationCard,
  createHandoverCard,
  createHandoverAcknowledgedCard,
  createHandoverTrackerCard,
  createReturnPromptCard,
  createWelcomeBackCard,
} from './adaptive-cards';
import { generateActionToken } from '@/lib/tokens';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let _botUserIdCache: string | null = null;

async function getBotUserId(): Promise<string> {
  if (_botUserIdCache) return _botUserIdCache;
  if (process.env.AZURE_BOT_USER_ID) {
    _botUserIdCache = process.env.AZURE_BOT_USER_ID;
    return _botUserIdCache;
  }
  try {
    const sp = await graphClient
      .api(`/servicePrincipals`)
      .filter(`appId eq '${process.env.AZURE_AD_CLIENT_ID}'`)
      .select('id,displayName')
      .get();
    if (sp.value?.[0]?.id) {
      _botUserIdCache = sp.value[0].id;
      return _botUserIdCache!;
    }
  } catch (e: any) {
    console.error('Bot User ID lookup failed:', e.message);
  }
  throw new Error('AZURE_BOT_USER_ID nicht gesetzt');
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE HELPER: Adaptive Card senden
// Strategie 1: Delegated (im Namen des eingeloggten Users) → kein AclCheckFailed
// Strategie 2: Application Permissions (Fallback)
// ─────────────────────────────────────────────────────────────────────────────
async function sendAppBotCard(
  toUserId: string,
  cardContent: any
): Promise<{ success: boolean; error?: any }> {
  const payload = {
    body: { contentType: 'html', content: '<attachment id="card"></attachment>' },
    attachments: [{
      id: 'card',
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: JSON.stringify(cardContent),
    }],
  };

  // STRATEGIE 1: Delegated Permissions (bevorzugt)
  try {
    const client = await getDelegatedGraphClient();
    const me = await client.api('/me').select('id').get();

    if (toUserId === me.id) {
      return { success: true };
    }

    let chatId: string;
    try {
      const chat = await client.api('/chats').post({
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${me.id}')`,
          },
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${toUserId}')`,
          },
        ],
      });
      chatId = chat.id;
    } catch (err: any) {
      if (err.statusCode === 409 && err.body) {
        const body = typeof err.body === 'string' ? JSON.parse(err.body) : err.body;
        const existingId = body?.error?.innerError?.existingChatId || body?.innerError?.existingChatId;
        if (existingId) {
          chatId = existingId;
        } else throw err;
      } else throw err;
    }

    await client.api(`/chats/${chatId}/messages`).post(payload);
    return { success: true };

  } catch (delegatedError: any) {
    console.warn('Delegated send failed, falling back to Application Permissions:', delegatedError.message);
  }

  // STRATEGIE 2: Application Permissions (Fallback)
  try {
    const botUserId = await getBotUserId();
    let chatId: string | null = null;

    try {
      const chatsRes = await graphClient
        .api('/chats')
        .filter(`chatType eq 'oneOnOne'`)
        .expand('members')
        .get();
      const existingChat = chatsRes.value?.find((chat: any) =>
        chat.members?.some((m: any) => m.userId === toUserId) &&
        chat.members?.some((m: any) => m.userId === botUserId)
      );
      if (existingChat) chatId = existingChat.id;
    } catch {
      // Chat lookup failed — will create a new one below
    }

    if (!chatId) {
      const newChat = await graphClient.api('/chats').post({
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${botUserId}')`,
          },
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${toUserId}')`,
          },
        ],
      });
      chatId = newChat.id;
    }

    await graphClient.api(`/chats/${chatId}/messages`).post(payload);
    return { success: true };

  } catch (appError: any) {
    console.error(`Failed to send card to ${toUserId}:`, appError.message);
    return { success: false, error: appError };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPROVAL NOTIFICATION → Manager
// ─────────────────────────────────────────────────────────────────────────────
export async function sendApprovalNotification(
  fromUserId: string,
  managerId: string,
  managerEmail: string,
  absenceDetails: {
    id: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    approvalLink: string;
    reason?: string;
    remainingDays?: number;
    handoverEnabled?: boolean;
    handoverItemCount?: number;
    handoverUrgentCount?: number;
    substituteName?: string;
  }
) {
  const approveToken = generateActionToken({ absenceId: absenceDetails.id, action: 'approve', approverId: managerId });
  const rejectToken = generateActionToken({ absenceId: absenceDetails.id, action: 'reject', approverId: managerId });

  const card = createAbsenceRequestCard({
    ...absenceDetails,
    approveUrl: `${APP_URL}/api/approvals/quick?token=${approveToken}`,
    rejectUrl: `${APP_URL}/api/approvals/quick?token=${rejectToken}`,
    dashboardUrl: `${APP_URL}/dashboard`,
  });

  return sendAppBotCard(managerId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. APPROVAL RESULT → Employee
// ─────────────────────────────────────────────────────────────────────────────
export async function sendApprovalResultNotification(
  fromUserId: string,
  toUserId: string,
  status: 'approved' | 'rejected',
  absenceDetails: { type: string; startDate: string; endDate: string; reason?: string }
) {
  const card = createStatusNotificationCard({
    status,
    ...absenceDetails,
    dashboardUrl: `${APP_URL}/dashboard`,
  });
  return sendAppBotCard(toUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HANDOVER NOTIFICATION → Substitute
// ─────────────────────────────────────────────────────────────────────────────
export async function sendHandoverNotification(
  employeeUserId: string,
  substituteUserId: string,
  absenceDetails: {
    absenceId: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  },
  handoverDetails: {
    items: {
      id: string;
      title: string;
      description?: string;
      links?: { title: string; url: string }[];
      isUrgent: boolean;
      priority?: 'high' | 'medium' | 'low';
      dueDate?: string;
    }[];
    generalNotes?: string;
    emergencyContact?: {
      availability: 'unavailable' | 'emergency_only' | 'limited_email';
      phone?: string;
      note?: string;
    };
  }
) {
  const acknowledgeToken = generateActionToken({
    absenceId: absenceDetails.absenceId,
    action: 'acknowledge',
    approverId: substituteUserId,
    actorId: substituteUserId,
  });

  const card = createHandoverCard({
    employeeName: absenceDetails.employeeName,
    startDate: absenceDetails.startDate,
    endDate: absenceDetails.endDate,
    totalDays: absenceDetails.totalDays,
    items: handoverDetails.items,
    generalNotes: handoverDetails.generalNotes,
    emergencyContact: handoverDetails.emergencyContact,
    acknowledgeUrl: `${APP_URL}/api/handover/${absenceDetails.absenceId}/acknowledge?token=${acknowledgeToken}`,
  });

  return sendAppBotCard(substituteUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HANDOVER ACKNOWLEDGED → Employee
// ─────────────────────────────────────────────────────────────────────────────
export async function sendHandoverAcknowledged(
  fromUserId: string,
  employeeUserId: string,
  substituteName: string
) {
  const card = createHandoverAcknowledgedCard(substituteName);
  return sendAppBotCard(employeeUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRACKER CARD → Substitute
// ─────────────────────────────────────────────────────────────────────────────
export async function sendHandoverTrackerCard(
  substituteUserId: string,
  absenceDetails: { id: string; employeeName: string; startDate: string; endDate: string; items: any[] }
) {
  const generateActionUrl = (itemId: string, action: 'mark_done' | 'add_note') => {
    const token = generateActionToken({
      absenceId: absenceDetails.id,
      action,
      approverId: substituteUserId,
      actorId: substituteUserId,
      itemId,
    });
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

  return sendAppBotCard(substituteUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RETURN PROMPT CARD → Substitute
// ─────────────────────────────────────────────────────────────────────────────
export async function sendReturnPromptCard(
  substituteUserId: string,
  absenceDetails: { id: string; employeeName: string; endDate: string }
) {
  const token = generateActionToken({
    absenceId: absenceDetails.id,
    action: 'return_summary',
    approverId: substituteUserId,
    actorId: substituteUserId,
  });

  const card = createReturnPromptCard({
    absenceId: absenceDetails.id,
    employeeName: absenceDetails.employeeName,
    endDate: absenceDetails.endDate,
    generateActionUrl: () =>
      `${APP_URL}/api/handover/${absenceDetails.id}/return-summary?token=${token}`,
  });

  return sendAppBotCard(substituteUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. WELCOME BACK CARD → Employee
// ─────────────────────────────────────────────────────────────────────────────
export async function sendWelcomeBackCard(
  employeeUserId: string,
  details: { employeeName: string; substituteName: string; summary: string }
) {
  const card = createWelcomeBackCard({
    employeeName: details.employeeName,
    substituteName: details.substituteName,
    summary: details.summary,
    openDashboardUrl: `${APP_URL}/dashboard`,
  });

  return sendAppBotCard(employeeUserId, card);
}