// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

const AZURE_TOKEN_URL = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;

// ─── Token Refresh ────────────────────────────────────────────────────────────
async function refreshAccessToken(token: any) {
  try {
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
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Token refresh failed');
    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + data.expires_in * 1000,
    };
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

// ✅ Re-sync user data from Graph every 24h max
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
    // ─── signIn: only on actual login, not every request ─────────────────────
    async signIn({ user, account }: any) {
      if (!account?.access_token || !user?.email) return true;

      try {
        const { default: connectDB } = await import('@/lib/mongodb');
        const { default: User } = await import('@/models/User');
        await connectDB();

        const existingUser = await User.findOne({ email: user.email })
          .select('role entraId updatedAt')
          .lean() as any;

        // ✅ PERF: synced recently → skip all Graph API calls
        if (existingUser?.updatedAt) {
          const age = Date.now() - new Date(existingUser.updatedAt).getTime();
          if (age < SYNC_INTERVAL_MS) {
            console.log('⚡ SignIn: skipping Graph — synced recently');
            return true;
          }
        }

        // First login or stale → fetch from Graph
        console.log('🔵 SignIn: fetching from Graph API');

        let correctUserId = account.providerAccountId || user.id;
        let department: string | null = null;
        let jobTitle: string | null = null;

        try {
          const res = await fetch(
            'https://graph.microsoft.com/v1.0/me?$select=id,department,jobTitle',
            { headers: { Authorization: `Bearer ${account.access_token}` } }
          );
          if (res.ok) {
            const g = await res.json();
            correctUserId = g.id || correctUserId;
            department = g.department || null;
            jobTitle = g.jobTitle || null;
          }
        } catch (e: any) {
          console.warn('⚠️ Graph /me failed:', e.message);
        }

        // Manager lookup (non-critical)
        let managerId: string | null = null;
        let managerEmail: string | null = null;
        try {
          const { getUserManager } = await import('@/lib/graph-client');
          const manager = await getUserManager(correctUserId);
          if (manager) { managerId = manager.id; managerEmail = manager.mail; }
        } catch { /* non-critical */ }

        if (!existingUser) {
          // NEW user: determine role from direct reports
          let role: 'employee' | 'manager' | 'admin' = 'employee';
          try {
            const { getUserDirectReports } = await import('@/lib/graph-client');
            const reports = await getUserDirectReports(correctUserId);
            if (reports?.length > 0) role = 'manager';
          } catch { /* non-critical */ }

          await User.create({
            entraId: correctUserId,
            email: user.email,
            name: user.name || user.email,
            firstName: user.name?.split(' ')[0] || '',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            department,
            jobTitle,
            role,
            managerId,
            managerEmail,
            vacationDays: { total: 30, used: 0, remaining: 30, carryOver: 0 },
            isActive: true,
          });
          console.log('✅ New user created');
        } else {
          // ✅ EXISTING user: NEVER touch role — only sync metadata
          await User.updateOne(
            { email: user.email },
            {
              $set: {
                entraId: correctUserId,
                managerId,
                managerEmail,
                ...(department && { department }),
                ...(jobTitle && { jobTitle }),
              },
            }
          );
          console.log('✅ User metadata synced (role untouched)');
        }
      } catch (error) {
        console.error('❌ SignIn error:', error);
      }

      return true;
    },

    // ─── jwt: keep lean — role cached here avoids DB on every request ─────────
    async jwt({ token, account }) {
      if (account) {
        // Initial login: load role once into JWT
        try {
          const { default: connectDB } = await import('@/lib/mongodb');
          const { default: User } = await import('@/models/User');
          await connectDB();
          const dbUser = await User.findOne({ email: token.email })
            .select('role entraId')
            .lean() as any;
          if (dbUser) {
            token.role = dbUser.role;
            token.entraId = dbUser.entraId;
          }
        } catch { /* will fall back in session callback */ }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        };
      }

      // Token still valid (60s buffer)
      const exp = token.accessTokenExpires as number | undefined;
      if (exp && Date.now() < exp - 60_000) return token;

      return refreshAccessToken(token);
    },

    // ─── session: reads from JWT — zero DB calls per request ─────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;

        if (token.accessToken) session.accessToken = token.accessToken as string;
        if (token.error) (session as any).error = token.error;

        // ✅ PERF: role + id from JWT cache — no DB query
        if (token.role) (session.user as any).role = token.role;
        if (token.entraId) (session.user as any).id = token.entraId;

        // Fallback: JWT cache empty (e.g. server restart) → single DB lookup
        if (!token.role) {
          try {
            const { default: connectDB } = await import('@/lib/mongodb');
            const { default: User } = await import('@/models/User');
            await connectDB();
            const dbUser = await User.findOne({ email: token.email })
              .select('role entraId')
              .lean() as any;
            if (dbUser) {
              (session.user as any).role = dbUser.role;
              (session.user as any).id = dbUser.entraId;
            }
          } catch (error) {
            console.error('Session fallback DB lookup failed:', error);
          }
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
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  debug: false,
};