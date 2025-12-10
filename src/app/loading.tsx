import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Laden...</p>
            </div>
        </div>
    );
}
