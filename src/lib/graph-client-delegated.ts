// src/lib/graph-client-delegated.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Creates a Graph Client using the logged-in user's access token (Delegated Permissions)
 * This is required for sending Teams messages as Application permissions don't allow it
 */
export async function getDelegatedGraphClient() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    throw new Error('No access token available. User must be authenticated.');
  }

  return Client.init({
    authProvider: (done) => {
      done(null, session.accessToken as string);
    },
  });
}

/**
 * Get or create a 1:1 chat between the current user and a target user.
 *
 * KEY INSIGHT: Microsoft Graph automatically returns the existing chat
 * if a 1:1 chat between the two users already exists — no need to search first.
 * This is the reliable, recommended approach.
 *
 * Docs: https://learn.microsoft.com/en-us/graph/api/chat-get?view=graph-rest-1.0
 */
async function getOrCreateOneOnOneChat(
  client: Client,
  myId: string,
  toUserId: string
): Promise<string> {
  try {
    // POST to /chats — Microsoft returns existing chat if already exists
    const chat = await client.api('/chats').post({
      chatType: 'oneOnOne',
      members: [
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${myId}')`,
        },
        {
          '@odata.type': '#microsoft.graph.aadUserConversationMember',
          roles: ['owner'],
          'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${toUserId}')`,
        },
      ],
    });

    console.log('✅ Chat ready (new or existing):', chat.id);
    return chat.id;
  } catch (error: any) {
    // Handle the case where Microsoft returns 409 Conflict (chat already exists)
    // and includes the existing chat ID in the error body
    if (error.statusCode === 409 && error.body) {
      try {
        const body = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        const existingChatId = body?.error?.innerError?.existingChatId
          || body?.innerError?.existingChatId;

        if (existingChatId) {
          console.log('✅ Chat already exists (409), using existing:', existingChatId);
          return existingChatId;
        }
      } catch (parseError) {
        console.error('⚠️ Could not parse 409 error body:', parseError);
      }
    }
    throw error;
  }
}

/**
 * Send a Teams message using delegated permissions (on behalf of logged-in user)
 */
export async function sendTeamsMessageDelegated(
  toUserId: string,
  message: string
) {
  const client = await getDelegatedGraphClient();

  try {
    console.log('💬 Sending Teams message (delegated) to:', toUserId);

    const me = await client.api('/me').select('id').get();
    const chatId = await getOrCreateOneOnOneChat(client, me.id, toUserId);

    await client.api(`/chats/${chatId}/messages`).post({
      body: {
        contentType: 'html',
        content: message,
      },
    });

    console.log('✅ Teams message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending Teams message (delegated):', error);
    throw error;
  }
}

/**
 * Send an Adaptive Card to a user via Teams 1:1 chat
 */
export async function sendTeamsAdaptiveCard(
  toUserId: string,
  cardContent: any
) {
  const client = await getDelegatedGraphClient();

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
    console.log('💬 Sending Teams Adaptive Card (delegated) to:', toUserId);

    const me = await client.api('/me').select('id').get();

    // Skip self-messaging
    if (toUserId === me.id) {
      console.log('⚠️ Skipping: Cannot send Teams message to self.');
      return { success: true, skipped: true };
    }

    const chatId = await getOrCreateOneOnOneChat(client, me.id, toUserId);

    await client.api(`/chats/${chatId}/messages`).post(payload);

    console.log('✅ Adaptive Card sent successfully via chat:', chatId);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send Adaptive Card:', error);
    return { success: false, error };
  }
}