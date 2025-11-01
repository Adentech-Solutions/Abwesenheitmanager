// ========================================
// FILE: src/middleware.ts
// Next.js Middleware for Authentication
// ========================================
import { withAuth } from 'next-auth/middleware';

// Exportiere die withAuth Middleware
export default withAuth({
  pages: {
    signIn: '/',
  },
});

// Matcher Config - NUR für Pages, NICHT für API Routes!
export const config = {
  matcher: [
    // Pages die Auth brauchen
    '/dashboard/:path*',
    '/manager/:path*',
    '/admin/:path*',
    '/absences/:path*',
    
    // ❌ KEINE API ROUTES HIER!
    // API Routes machen Auth selbst mit getServerSession()
  ],
};