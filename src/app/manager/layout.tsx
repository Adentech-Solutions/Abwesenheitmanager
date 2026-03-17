import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect('/');
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || !['manager', 'teamlead', 'hr_manager', 'admin'].includes(user.role)) {
        redirect('/dashboard');
    }

    return <>{children}</>;
}
