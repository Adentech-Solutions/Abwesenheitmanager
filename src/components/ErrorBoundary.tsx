'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <Card className="max-w-md w-full text-center overflow-hidden border-red-100 shadow-lg">
            <CardHeader className="pt-8 pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center animate-bounce duration-[2000ms] ease-in-out infinite">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Etwas ist schiefgelaufen
              </h2>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu oder wenden Sie sich an den Support, falls das Problem weiterhin besteht.
              </p>
              {this.state.errorMessage && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Fehlermeldung</p>
                  <p className="text-xs text-red-600 font-mono break-all">{this.state.errorMessage}</p>
                </div>
              )}
            </CardContent>

            <CardFooter className="pb-8 pt-4 justify-center">
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
                className="rounded-xl font-bold px-6 shadow-sm group"
              >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Seite neu laden
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
