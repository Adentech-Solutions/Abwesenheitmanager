// src/lib/graph-client.ts - FULLY FIXED

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

const tenantId = process.env.AZURE_AD_TENANT_ID!;
const clientId = process.env.AZURE_AD_CLIENT_ID!;
const clientSecret = process.env.AZURE_AD_CLIENT_SECRET!;

// Create credential
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// Create authentication provider
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default'],
});

// Create Graph client
const graphClient = Client.initWithMiddleware({
  authProvider,
});

export default graphClient;

// ========================================
// Helper Functions for Graph API
// ========================================

// Get user by email
export async function getGraphUser(email: string) {
  try {
    const user = await graphClient
      .api(`/users/${email}`)
      .select('id,displayName,mail,userPrincipalName,givenName,surname,jobTitle,department')
      .get();
    return user;
  } catch (error) {
    console.error('Error fetching user from Graph:', error);
    throw error;
  }
}

// Get user's manager
export async function getUserManager(userId: string) {
  try {
    const manager = await graphClient
      .api(`/users/${userId}/manager`)
      .select('id,displayName,mail')
      .get();

    return manager;
  } catch (error) {
    console.error('Error fetching manager:', error);
    return null;
  }
}

// Get user's direct reports
export async function getUserDirectReports(userId: string) {
  try {
    const reports = await graphClient
      .api(`/users/${userId}/directReports`)
      .select('id,displayName,mail')
      .get();

    return reports.value || [];
  } catch (error) {
    console.error('Error fetching direct reports:', error);
    return [];
  }
}

// Create calendar event
export async function createCalendarEvent(
  userId: string,
  event: {
    subject: string;
    body: string;
    startDateTime: string;
    endDateTime: string;
    isAllDay: boolean;
  }
) {
  try {
    const calendarEvent = {
      subject: event.subject,
      body: {
        contentType: 'HTML',
        content: event.body,
      },
      start: {
        dateTime: event.startDateTime,
        timeZone: 'Europe/Berlin',
      },
      end: {
        dateTime: event.endDateTime,
        timeZone: 'Europe/Berlin',
      },
      isAllDay: event.isAllDay,
      showAs: 'oof', // Out of Office
      categories: ['Absence'],
    };

    const result = await graphClient
      .api(`/users/${userId}/calendar/events`)
      .post(calendarEvent);

    return result;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// 🔧 FIXED: Set automatic replies (Out of Office)
export async function setAutomaticReplies(
  userId: string,
  settings: {
    status: 'disabled' | 'alwaysEnabled' | 'scheduled';  // ✅ KORRIGIERT: Nur gültige Werte!
    internalReplyMessage?: string;
    externalReplyMessage?: string;
    startDateTime?: string;
    endDateTime?: string;
    externalAudience?: 'all' | 'contactsOnly' | 'none';  // ✅ NEU: Externe Empfänger steuern
  }
) {
  try {
    console.log('🤖 Setting automatic replies for user:', userId);
    console.log('📝 Settings:', {
      status: settings.status,
      hasInternal: !!settings.internalReplyMessage,
      hasExternal: !!settings.externalReplyMessage,
      externalAudience: settings.externalAudience,
      startDateTime: settings.startDateTime,
      endDateTime: settings.endDateTime,
    });

    // ✅ Baue korrektes automaticRepliesSetting Object
    const automaticRepliesSetting: any = {
      status: settings.status,  // ✅ Nur 'disabled', 'alwaysEnabled', oder 'scheduled'
    };

    // ✅ INTERNE NACHRICHT
    if (settings.internalReplyMessage) {
      automaticRepliesSetting.internalReplyMessage = settings.internalReplyMessage;
      console.log('✅ Internal reply message set');
    }

    // ✅ EXTERNE NACHRICHT + AUDIENCE
    if (settings.externalReplyMessage) {
      automaticRepliesSetting.externalReplyMessage = settings.externalReplyMessage;
      automaticRepliesSetting.externalAudience = settings.externalAudience || 'all';
      console.log('✅ External reply message set, audience:', automaticRepliesSetting.externalAudience);
    } else {
      // Keine externe Nachricht = keine externen Empfänger
      automaticRepliesSetting.externalAudience = 'none';
      console.log('ℹ️ External replies disabled');
    }

    // ✅ ZEITPLANUNG (nur wenn status === 'scheduled')
    if (settings.status === 'scheduled') {
      if (!settings.startDateTime || !settings.endDateTime) {
        throw new Error('scheduledStartDateTime and scheduledEndDateTime are required when status is "scheduled"');
      }

      // ✅ DateTime Format: ISO ohne 'Z' (wird durch timeZone bestimmt)
      automaticRepliesSetting.scheduledStartDateTime = {
        dateTime: new Date(settings.startDateTime).toISOString().slice(0, -5),  // Remove 'Z'
        timeZone: 'Europe/Berlin',
      };
      automaticRepliesSetting.scheduledEndDateTime = {
        dateTime: new Date(settings.endDateTime).toISOString().slice(0, -5),  // Remove 'Z'
        timeZone: 'Europe/Berlin',
      };
      
      console.log('✅ Scheduled times set:', {
        start: automaticRepliesSetting.scheduledStartDateTime,
        end: automaticRepliesSetting.scheduledEndDateTime,
      });
    }

    console.log('📤 Sending request to Graph API:', JSON.stringify({ automaticRepliesSetting }, null, 2));

    // ✅ API Call mit PATCH
    await graphClient
      .api(`/users/${userId}/mailboxSettings`)
      .patch({
        automaticRepliesSetting,
      });

    console.log('✅ Automatic replies set successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error setting automatic replies:', error);
    console.error('❌ Error details:', error.body || error.message);
    throw error;
  }
}

// 🆕 HELPER: Convert Frontend AutoReplySettings to Graph API format
export function mapAutoReplySettings(
  frontendSettings: {
    enabled: boolean;
    hasSubstitute?: boolean;
    substituteInfo?: {
      name: string;
      email: string;
      phone?: string;
    };
    recipients?: {
      internal: boolean;
      external: boolean;
    };
    timing?: {
      activateImmediately: boolean;
      scheduledDate: Date | string;
      scheduledTime: string;
    };
  },
  startDate: Date | string,
  endDate: Date | string,
  userName: string
): {
  status: 'disabled' | 'alwaysEnabled' | 'scheduled';
  internalReplyMessage?: string;
  externalReplyMessage?: string;
  startDateTime?: string;
  endDateTime?: string;
  externalAudience?: 'all' | 'contactsOnly' | 'none';
} {
  // Wenn disabled, return early
  if (!frontendSettings.enabled) {
    return {
      status: 'disabled',
    };
  }

  // Bestimme Status
  const status = frontendSettings.timing?.activateImmediately 
    ? 'alwaysEnabled' 
    : 'scheduled';

  // Generate Messages
  const internalMessage = generateAutoReplyMessage(
    startDate,
    endDate,
    frontendSettings.hasSubstitute ? frontendSettings.substituteInfo : undefined,
    userName,
    true
  );

  const externalMessage = generateAutoReplyMessage(
    startDate,
    endDate,
    frontendSettings.hasSubstitute ? frontendSettings.substituteInfo : undefined,
    userName,
    false
  );

  // Bestimme externalAudience
  const externalAudience = frontendSettings.recipients?.external 
    ? 'all' 
    : 'none';

  // Build result
  const result: any = {
    status,
    externalAudience,
  };

  // Add messages nur wenn recipients aktiviert
  if (frontendSettings.recipients?.internal !== false) {
    result.internalReplyMessage = internalMessage;
  }

  if (frontendSettings.recipients?.external !== false) {
    result.externalReplyMessage = externalMessage;
  }

  // Add DateTime nur wenn scheduled
  if (status === 'scheduled') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time from timing or use defaults
    const startTime = frontendSettings.timing?.scheduledTime || '00:00';
    const [startHour, startMinute] = startTime.split(':');
    start.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
    
    end.setHours(23, 59, 59, 999);

    result.startDateTime = start.toISOString();
    result.endDateTime = end.toISOString();
  }

  return result;
}

// 🆕 HELPER: Generate Auto-Reply Message
function generateAutoReplyMessage(
  startDate: Date | string,
  endDate: Date | string,
  substitute?: {
    name: string;
    email: string;
    phone?: string;
  },
  userName?: string,
  isInternal: boolean = true
): string {
  const start = new Date(startDate).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  
  const end = new Date(endDate).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let message = `Guten Tag,\n\nvielen Dank für Ihre Nachricht.\n\nIch bin vom ${start} bis ${end} abwesend und habe in dieser Zeit ${isInternal ? 'keinen' : 'eingeschränkten'} Zugriff auf meine E-Mails.`;

  if (substitute?.email) {
    message += `\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an meine Vertretung:\n\n${substitute.name}\nE-Mail: ${substitute.email}`;
    
    if (substitute.phone) {
      message += `\nTel.: ${substitute.phone}`;
    }
  } else {
    message += '\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an mein Team.';
  }

  message += '\n\nIch werde Ihre E-Mail nach meiner Rückkehr bearbeiten.';
  
  if (userName) {
    message += `\n\nMit freundlichen Grüßen\n${userName}`;
  } else {
    message += '\n\nMit freundlichen Grüßen';
  }

  return message;
}

// Send email via Graph API
export async function sendEmail(
  fromUserIdOrEmail: string,
  toEmail: string,
  subject: string,
  body: string
) {
  try {
    console.log('📧 Sending email from:', fromUserIdOrEmail, 'to:', toEmail);

    // ⭐ FIX: Hole die Entra ID wenn Email übergeben wurde
    let fromUserId = fromUserIdOrEmail;

    // Prüfe ob es eine Email ist (enthält @)
    if (fromUserIdOrEmail.includes('@')) {
      console.log('🔍 Converting email to userId...');
      const user = await graphClient
        .api(`/users/${fromUserIdOrEmail}`)
        .select('id')
        .get();
      fromUserId = user.id;
      console.log('✅ Got userId:', fromUserId);
    }

    const message = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: body,
        },
        toRecipients: [
          {
            emailAddress: {
              address: toEmail,
            },
          },
        ],
      },
    };

    // ⭐ Verwende die Entra ID (nicht Email!)
    await graphClient
      .api(`/users/${fromUserId}/sendMail`)
      .post(message);

    console.log('✅ Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

// Send Teams message (Application Permissions - nicht empfohlen für 1:1 Chats)
export async function sendTeamsMessage(
  userId: string,
  message: string
) {
  try {
    console.log('💬 Sending Teams message to userId:', userId);

    // ⭐ FIX: Korrekter Filter - '/me/chats' und 'id' statt 'userId'
    const chatsResponse = await graphClient
      .api('/me/chats')  // ⭐ '/me/chats' statt '/chats'
      .filter(`members/any(m: m/id eq '${userId}')`)  // ⭐ 'id' statt 'userId'
      .expand('members')
      .get();

    let chatId;
    
    if (chatsResponse.value && chatsResponse.value.length > 0) {
      chatId = chatsResponse.value[0].id;
      console.log('✅ Found existing chat:', chatId);
    } else {
      console.log('🔍 No existing chat found, creating new one...');
      
      // Erstelle neuen 1:1 Chat
      const newChat = await graphClient
        .api('/chats')
        .post({
          chatType: 'oneOnOne',
          members: [
            {
              '@odata.type': '#microsoft.graph.aadUserConversationMember',
              roles: ['owner'],
              'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`,
            },
          ],
        });
      
      chatId = newChat.id;
      console.log('✅ Created new chat:', chatId);
    }

    // Nachricht senden
    await graphClient
      .api(`/chats/${chatId}/messages`)
      .post({
        body: {
          contentType: 'html',
          content: message,
        },
      });

    console.log('✅ Teams message sent successfully');
    return { success: true, chatId };
  } catch (error) {
    console.error('❌ Error sending Teams message:', error);
    throw error;
  }
}