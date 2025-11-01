'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { signIn } from 'next-auth/react';

export default function HomePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-600 mb-2">🏖️</h1>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Absence Manager</h2>
                    <p className="text-gray-600">Urlaubsverwaltung leicht gemacht</p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="primary"
                        onClick={() => signIn('azure-ad')}
                        className="w-full"
                    >
                        Mit Microsoft anmelden
                    </Button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Melde dich mit deinem Unternehmenskonto an</p>
                </div>
            </div>
        </div>
    );
}