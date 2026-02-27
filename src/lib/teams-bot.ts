// src/lib/teams-bot.ts
//
// Absender-Logik:
// Alle Nachrichten via App (Application Permissions, Chat.ReadWrite.All)
// Card-Inhalt macht den Kontext klar: "Übergabe von Salem Hassan" etc.
//
// Kein TeamsAppInstallation nötig — wir nutzen /chats direkt.

import graphClient from './graph-client';
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Sendet Adaptive Card via Application Permissions (Chat.ReadWrite.All)
// Sucht oder erstellt einen 1:1 Chat zwischen Bot-User und Empfänger
// ─────────────────────────────────────────────────────────────────────────────

async function sendAppBotCard(toUserId: string, cardContent: any): Promise<{ success: boolean; error?: any }> {
  const payload = {
    body: {
      contentType: 'html',
      content: '<attachment id="card"></attachment>',
    },
    attachments: [
      {
        id: 'card',
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: JSON.stringify(cardContent),
      },
    ],
  };

  try {
    // Schritt 1: Existierenden 1:1 Chat suchen
    let chatId: string | null = null;

    try {
      const chatsRes = await graphClient
        .api('/chats')
        .filter(`chatType eq 'oneOnOne'`)
        .expand('members')
        .get();

      const existingChat = chatsRes.value?.find((chat: any) =>
        chat.members?.some((m: any) => m.userId === toUserId)
      );

      if (existingChat) {
        chatId = existingChat.id;
        console.log(`✅ Bestehender Chat gefunden: ${chatId}`);
      }
    } catch (e) {
      console.log('⚠️ Chat-Suche fehlgeschlagen, erstelle neuen Chat...');
    }

    // Schritt 2: Neuen Chat erstellen falls keiner existiert
    if (!chatId) {
      console.log(`📨 Erstelle neuen 1:1 Chat mit User: ${toUserId}`);

      const newChat = await graphClient
        .api('/chats')
        .post({
          chatType: 'oneOnOne',
          members: [
            {
              '@odata.type': '#microsoft.graph.aadUserConversationMember',
              roles: ['owner'],
              'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${toUserId}')`,
            },
          ],
        });

      chatId = newChat.id;
      console.log(`✅ Neuer Chat erstellt: ${chatId}`);
    }

    // Schritt 3: Card senden
    await graphClient.api(`/chats/${chatId}/messages`).post(payload);
    console.log(`✅ Card gesendet an: ${toUserId}`);
    return { success: true };

  } catch (error: any) {
    console.error(`❌ Card senden fehlgeschlagen für ${toUserId}:`, error.message);
    return { success: false, error };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPROVAL NOTIFICATION → Manager (Adele)
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
    approveUrl: `${APP_URL}/api/absences/${absenceDetails.id}/approve?token=${approveToken}`,
    rejectUrl: `${APP_URL}/api/absences/${absenceDetails.id}/reject?token=${rejectToken}`,
    dashboardUrl: `${APP_URL}/dashboard`,
  });

  return sendAppBotCard(managerId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. APPROVAL RESULT → Employee (Salem)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendApprovalResultNotification(
  fromUserId: string,
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
    ...absenceDetails,
    dashboardUrl: `${APP_URL}/dashboard`,
  });

  return sendAppBotCard(toUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HANDOVER NOTIFICATION → Substitute (Alex)
//    Card zeigt: "Übergabe von Salem Hassan"
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

  return sendAppBotCard(substituteUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HANDOVER ACKNOWLEDGED → Employee (Salem)
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
// 5. TRACKER CARD → Substitute (Alex)
// ─────────────────────────────────────────────────────────────────────────────

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
// 6. RETURN PROMPT CARD → Substitute (Alex)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendReturnPromptCard(
  substituteUserId: string,
  absenceDetails: {
    id: string;
    employeeName: string;
    endDate: string;
  }
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
    generateActionUrl: () => `${APP_URL}/api/handover/${absenceDetails.id}/return-summary?token=${token}`,
  });

  return sendAppBotCard(substituteUserId, card);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. WELCOME BACK CARD → Employee (Salem)
//    Card zeigt: "Von Alex Wilber"
// ─────────────────────────────────────────────────────────────────────────────

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

  return sendAppBotCard(employeeUserId, card);
}