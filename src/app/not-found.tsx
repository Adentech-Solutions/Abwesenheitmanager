import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full text-center p-8">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                        <FileQuestion className="h-8 w-8 text-yellow-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Seite nicht gefunden
                </h2>
                <p className="text-gray-600 mb-6">
                    Die gesuchte Seite existiert leider nicht oder wurde verschoben.
                </p>
                <Link href="/dashboard">
                    <Button variant="primary">
                        Zurück zum Dashboard
                    </Button>
                </Link>
            </Card>
        </div>
    );
}
