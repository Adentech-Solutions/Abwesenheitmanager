// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email User.Read User.ReadBasic.All User.Read.All Chat.ReadWrite offline_access',
          // prompt: 'consent',  // ← ENTFERNT! Das erzwingt Consent bei jedem Login
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
        const { getGraphUser, getUserManager, getUserDirectReports } = await import('@/lib/graph-client');

        await connectDB();
        console.log('✅ MongoDB connected');

        let correctUserId = account?.providerAccountId || user.id;

        // Get extended details from GraphUser if available
        let department = null;
        let jobTitle = null;
        let graphUserData = null;

        try {
          if (account?.access_token) {
            console.log('🌐 Fetching user details using Delegated Token...');
            const graphRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,department,jobTitle', {
              headers: {
                Authorization: `Bearer ${account.access_token}`
              }
            });

            if (graphRes.ok) {
              graphUserData = await graphRes.json();
              console.log('✅ Graph /me success:', JSON.stringify(graphUserData));
            } else {
              console.error('❌ Graph /me failed:', graphRes.status, await graphRes.text());
            }
          }

          // Fallback to Service Principal if Delegated failed or no token
          if (!graphUserData) {
            console.log('⚠️ Fallback to Service Principal for user details...');
            const { getGraphUser } = await import('@/lib/graph-client');
            graphUserData = await getGraphUser(user.email);
          }

          if (graphUserData) {
            correctUserId = graphUserData.id; // Confirm ID
            department = graphUserData.department || null;
            jobTitle = graphUserData.jobTitle || null;
            console.log(`🔍 Extracted - Dept: ${department}, Job: ${jobTitle}`);
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
            console.log('✅ Manager found:', managerEmail);
          }
        } catch (error: any) {
          console.log('⚠️ Manager check error:', error.message);
        }

        let role: 'employee' | 'manager' | 'admin' = 'employee';
        try {
          const directReports = await getUserDirectReports(correctUserId);
          if (directReports && directReports.length > 0) {
            role = 'manager';
            console.log('👔 User is MANAGER');
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
            firstName: user.name ? user.name.split(' ')[0] : '', // Attempt to split name
            lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
            department: department,
            jobTitle: jobTitle,
            role: role,
            managerId: managerId,
            managerEmail: managerEmail,
            vacationDays: {
              total: 30,
              used: 0,
              remaining: 30,
              carryOver: 0,
            },
            isActive: true,
          });
          console.log('✅ User created');
        } else {
          existingUser.role = role;
          existingUser.managerId = managerId;
          existingUser.managerEmail = managerEmail;
          existingUser.entraId = correctUserId;
          // Sync latest from Entra
          if (department) existingUser.department = department;
          if (jobTitle) existingUser.jobTitle = jobTitle;

          await existingUser.save();
          console.log('✅ User updated');
        }

        return true;
      } catch (error) {
        console.error('❌ Error in signIn:', error);
        return true;
      }
    },

    async jwt({ token, account, profile }) {
      console.log('🟡 JWT Callback');
      console.log('🟡 Account exists:', !!account);
      console.log('🟡 Account access_token:', account?.access_token ? 'EXISTS' : 'MISSING');

      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        console.log('🟡 ✅ Stored access token in JWT:', token.accessToken ? 'YES' : 'NO');
      }

      if (profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.id = profile.sub;
      }

      console.log('🟡 JWT token.accessToken:', token.accessToken ? 'EXISTS' : 'MISSING');
      return token;
    },

    async session({ session, token }) {
      console.log('🟢 Session Callback');
      console.log('🟢 Token.accessToken:', token.accessToken ? 'EXISTS' : 'MISSING');

      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;

        // ⭐ Access Token zur Session hinzufügen
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
          console.log('🟢 ✅ Added accessToken to session');
        } else {
          console.log('🟢 ❌ NO ACCESS TOKEN IN TOKEN');
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

      console.log('🟢 Final session.accessToken:', session.accessToken ? 'EXISTS' : 'MISSING');
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
  debug: true,
};