import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  console.log('🔍 Full Session:', JSON.stringify(session, null, 2));
  
  return NextResponse.json({
    status: 'ok',
    sessionExists: !!session,
    email: session?.user?.email || 'NO EMAIL',
    userId: (session?.user as any)?.id || 'NO USER ID',
    hasAccessToken: !!session?.accessToken,
    accessTokenPreview: session?.accessToken 
      ? `${(session.accessToken as string).substring(0, 20)}...` 
      : 'MISSING',
  });
}