import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { IUser } from '@/types/user';
import { Permission } from '@/types/permissions';

export type Role = 'employee' | 'teamlead' | 'manager' | 'hr_manager' | 'admin';

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
  // Admins & HR Managers can view all
  if (currentUser.role === 'admin' || currentUser.role === 'hr_manager') return true;
  
  // Users can view their own data
  if (currentUser.entraId === targetUserId) return true;
  
  // Managers and Teamleads need to fetch the target user to check relation
  if (currentUser.role === 'manager' || currentUser.role === 'teamlead') {
    await connectDB();
    const targetUser = await User.findOne({ entraId: targetUserId });
    if (!targetUser) return false;

    if (currentUser.role === 'manager') {
      return targetUser.managerId === currentUser.entraId;
    }
    
    if (currentUser.role === 'teamlead') {
      return !!(currentUser.department && targetUser.department === currentUser.department);
    }
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

export async function getDepartmentMemberEmails(department?: string): Promise<string[]> {
  if (!department) return [];
  await connectDB();
  const members = await User.find({ 
    department,
    isActive: true 
  }).select('email');
  return members.map(u => u.email);
}

export async function requirePermission(
  requiredPermissions: Permission[]
): Promise<{ user: any; dbUser: IUser }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error('Unauthorized');

  await connectDB();
  const dbUser = await User.findOne({ email: session.user.email });
  if (!dbUser) throw new Error('Unauthorized');

  const { DEFAULT_ROLE_PERMISSIONS } = await import('@/types/permissions');
  const Role = (await import('@/models/Role')).default;

  let userPermissions: string[];
  if (DEFAULT_ROLE_PERMISSIONS[dbUser.role]) {
    userPermissions = DEFAULT_ROLE_PERMISSIONS[dbUser.role];
  } else {
    const customRole = await Role.findOne({ name: dbUser.role, isActive: true });
    userPermissions = customRole?.permissions || DEFAULT_ROLE_PERMISSIONS['employee'];
  }

  if (!requiredPermissions.every(p => userPermissions.includes(p))) {
    throw new Error(`Forbidden - Requires: ${requiredPermissions.join(', ')}`);
  }

  return { user: session.user, dbUser };
}
