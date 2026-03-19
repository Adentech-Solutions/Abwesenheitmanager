import React from 'react';
import Wordmark from './Wordmark';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 animate-pulse">
      <Wordmark size={size} theme="light" className="opacity-50" />
      <div className="mt-4 h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-600 animate-[loading-progress_1.5s_infinite_linear]" />
      </div>
      {text && <p className="mt-4 text-sm text-gray-400 font-medium tracking-wide uppercase">{text}</p>}
    </div>
  );
}
