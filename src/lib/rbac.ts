import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { IUser } from '@/types/user';

export type Role = 'employee' | 'manager' | 'admin';

export async function requireRole(
  allowedRoles: Role[]
): Promise<{ user: any; dbUser: IUser }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }

  await connectDB();
  const dbUser = await User.findOne({ email: session.user.email });
  
  if (!dbUser || !allowedRoles.includes(dbUser.role as Role)) {
    throw new Error(`Forbidden - Requires: ${allowedRoles.join(', ')}`);
  }

  return { user: session.user, dbUser };
}

export async function canViewUserData(
  currentUser: IUser,
  targetUserId: string
): Promise<boolean> {
  // Admins can view all
  if (currentUser.role === 'admin') return true;
  
  // Users can view their own data
  if (currentUser.entraId === targetUserId) return true;
  
  // Managers can view their direct reports
  if (currentUser.role === 'manager') {
    await connectDB();
    const targetUser = await User.findOne({ entraId: targetUserId });
    return targetUser?.managerId === currentUser.entraId;
  }
  
  return false;
}

export async function getTeamMemberEmails(managerId: string): Promise<string[]> {
  await connectDB();
  const teamMembers = await User.find({ 
    managerId,
    isActive: true 
  }).select('email');
  
  return teamMembers.map(u => u.email);
}
