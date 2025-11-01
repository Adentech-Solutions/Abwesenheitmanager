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
 * Send a Teams message using delegated permissions (on behalf of logged-in user)
 */
export async function sendTeamsMessageDelegated(
  toUserId: string,
  message: string
) {
  const client = await getDelegatedGraphClient();
  
  try {
    console.log('💬 Sending Teams message (delegated)...');
    console.log('💬 To:', toUserId);

    // Option 1: Try to find existing chat
    try {
      const chatsResponse = await client
        .api('/me/chats')
        .filter(`members/any(m: m/userId eq '${toUserId}')`)
        .get();

      if (chatsResponse.value && chatsResponse.value.length > 0) {
        const chatId = chatsResponse.value[0].id;
        console.log('✅ Found existing chat:', chatId);

        await client
          .api(`/chats/${chatId}/messages`)
          .post({
            body: {
              contentType: 'html',
              content: message,
            },
          });

        console.log('✅ Teams message sent via existing chat');
        return { success: true };
      }
    } catch (error) {
      console.log('⚠️ Could not find existing chat, will create new one...');
    }

    // Option 2: Create new chat
    console.log('🔄 Creating new 1:1 chat...');
    
    const session = await getServerSession(authOptions);
    const fromUserId = session?.user?.id;

    if (!fromUserId) {
      throw new Error('Could not get current user ID from session');
    }

    const newChat = await client
      .api('/chats')
      .post({
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${fromUserId}')`,
          },
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${toUserId}')`,
          },
        ],
      });

    console.log('✅ Chat created:', newChat.id);

    await client
      .api(`/chats/${newChat.id}/messages`)
      .post({
        body: {
          contentType: 'html',
          content: message,
        },
      });

    console.log('✅ Teams message sent via new chat');
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending Teams message (delegated):', error);
    throw error;
  }
}