import Wordmark from '@/components/shared/Wordmark';

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <Wordmark size="lg" theme="light" className="opacity-50" />
                <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 animate-[loading-progress_1.5s_infinite_linear]" />
                </div>
            </div>
        </div>
    );
}
