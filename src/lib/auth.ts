// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

const AZURE_TOKEN_URL = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;

/**
 * Refreshes the Microsoft access token using the stored refresh token.
 * Returns updated token fields or throws on failure.
 */
async function refreshAccessToken(token: any) {
  try {
    console.log('🔄 Refreshing access token...');

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      refresh_token: token.refreshToken,
      scope: 'openid profile email User.Read User.ReadBasic.All User.Read.All Chat.ReadWrite offline_access',
    });

    const response = await fetch(AZURE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('❌ Token refresh failed:', refreshedTokens);
      throw new Error(refreshedTokens.error_description || 'Failed to refresh token');
    }

    console.log('✅ Access token refreshed successfully');

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      // Microsoft may or may not return a new refresh token — keep old one as fallback
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      // Store expiry: expires_in is in seconds, convert to ms timestamp
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    // Return token with error flag — the client will be forced to re-login
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read User.ReadBasic.All User.Read.All Chat.ReadWrite offline_access',
          response_type: 'code',
        },
      },
      checks: ['pkce', 'state'],
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('🔵 SignIn Callback Started');
      console.log('📧 User Email:', user.email);
      console.log('🔑 Account Access Token:', account?.access_token ? 'EXISTS' : 'MISSING');

      try {
        const { default: connectDB } = await import('@/lib/mongodb');
        const { default: User } = await import('@/models/User');
        const { getUserManager, getUserDirectReports } = await import('@/lib/graph-client');

        await connectDB();

        let correctUserId = account?.providerAccountId || user.id;
        let department = null;
        let jobTitle = null;
        let graphUserData = null;

        try {
          if (account?.access_token) {
            const graphRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,department,jobTitle', {
              headers: { Authorization: `Bearer ${account.access_token}` },
            });

            if (graphRes.ok) {
              graphUserData = await graphRes.json();
            }
          }

          if (!graphUserData) {
            const { getGraphUser } = await import('@/lib/graph-client');
            graphUserData = await getGraphUser(user.email);
          }

          if (graphUserData) {
            correctUserId = graphUserData.id;
            department = graphUserData.department || null;
            jobTitle = graphUserData.jobTitle || null;
          }
        } catch (e: any) {
          console.error('Could not fetch extra graph details:', e.message);
        }

        let managerId = null;
        let managerEmail = null;
        try {
          const manager = await getUserManager(correctUserId);
          if (manager) {
            managerId = manager.id;
            managerEmail = manager.mail;
          }
        } catch (error: any) {
          console.log('⚠️ Manager check error:', error.message);
        }

        let role: 'employee' | 'manager' | 'admin' = 'employee';
        try {
          const directReports = await getUserDirectReports(correctUserId);
          if (directReports && directReports.length > 0) {
            role = 'manager';
          }
        } catch (error: any) {
          console.log('⚠️ Direct reports error:', error.message);
        }

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            entraId: correctUserId,
            email: user.email,
            name: user.name || user.email,
            firstName: user.name ? user.name.split(' ')[0] : '',
            lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
            department,
            jobTitle,
            role,
            managerId,
            managerEmail,
            vacationDays: { total: 30, used: 0, remaining: 30, carryOver: 0 },
            isActive: true,
          });
        } else {
          // ⚠️ Only update role if NOT already admin — prevent admin role overwrite
          if (existingUser.role !== 'admin') {
            existingUser.role = role;
          }
          existingUser.managerId = managerId;
          existingUser.managerEmail = managerEmail;
          existingUser.entraId = correctUserId;
          if (department) existingUser.department = department;
          if (jobTitle) existingUser.jobTitle = jobTitle;
          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error('❌ Error in signIn:', error);
        return true;
      }
    },

    async jwt({ token, account, profile }) {
      // Initial sign in — store tokens and expiry
      if (account) {
        console.log('🟡 JWT: Initial sign-in, storing tokens');
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          // expires_at from Azure is in seconds (Unix timestamp)
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000, // fallback: 1h
        };
      }

      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.id = profile.sub;
      }

      // Token still valid — return as-is (with 60s buffer)
      const expiresAt = token.accessTokenExpires as number | undefined;
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        console.log('🟡 JWT: Token still valid');
        return token;
      }

      // Token expired or no expiry stored — refresh it
      console.log('🟡 JWT: Token expired, attempting refresh...');
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;

        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
        }

        // Surface token error to client so it can trigger re-login
        if (token.error) {
          (session as any).error = token.error;
        }

        try {
          const { default: connectDB } = await import('@/lib/mongodb');
          const { default: User } = await import('@/models/User');
          await connectDB();

          const dbUser = await User.findOne({ email: token.email }).lean();
          if (dbUser) {
            (session.user as any).role = dbUser.role;
            (session.user as any).id = dbUser.entraId;
          }
        } catch (error) {
          console.error('Error loading user in session:', error);
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: false, // Disable in production to reduce log noise
};