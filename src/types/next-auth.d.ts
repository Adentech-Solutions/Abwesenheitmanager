// src/types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: 'RefreshAccessTokenError';
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: 'employee' | 'manager' | 'admin';
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpires?: number;
    error?: 'RefreshAccessTokenError';
    // ✅ Cached in JWT — kein DB-Call pro Request mehr nötig
    role?: 'employee' | 'manager' | 'admin';
    entraId?: string;
  }
}