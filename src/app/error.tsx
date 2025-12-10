'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full text-center p-8">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Etwas ist schiefgelaufen!
                </h2>
                <p className="text-gray-600 mb-6">
                    Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => reset()} variant="primary">
                        Erneut versuchen
                    </Button>
                    <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
                        Zum Dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
}
