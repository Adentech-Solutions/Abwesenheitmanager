'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { MessageSquare, Mail, ClipboardList, ShieldCheck } from 'lucide-react';
import Wordmark from '@/components/shared/Wordmark';

const FeatureItem = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: string }) => (
  <div className={cn("flex items-start gap-4 animate-in fade-in slide-in-from-left-8 duration-700 fill-mode-both", delay)}>
    <div className="p-2.5 rounded-xl bg-white/10 ring-1 ring-white/20">
      <Icon className="h-5 w-5 text-primary-400" />
    </div>
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Panel: Brand & Features (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Wordmark size="lg" theme="dark" className="mb-2" />
          <p className="text-xl text-primary-400 font-medium">Dein Team. Immer im Bild.</p>
        </div>

        <div className="space-y-10 relative z-10 max-w-md">
          <FeatureItem 
            icon={MessageSquare}
            title="Teams Bot Integration"
            description="Beantrage und genehmige Urlaube direkt in Microsoft Teams mit interaktiven Adaptive Cards."
            delay="delay-300"
          />
          <FeatureItem 
            icon={Mail}
            title="Intelligenter Auto-Reply"
            description="Automatische Synchronisation deiner Abwesenheit mit Outlook und Generierung professioneller Abwesenheitsnotizen."
            delay="delay-[450ms]"
          />
          <FeatureItem 
            icon={ClipboardList}
            title="Strukturierte Übergaben"
            description="Stelle sicher, dass alle Aufgaben während deiner Abwesenheit klar verteilt und dokumentiert sind."
            delay="delay-[600ms]"
          />
        </div>

        <div className="relative z-10 text-gray-500 text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Secure Enterprise Authentication via Microsoft Entra ID
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Mobile Only Header */}
          <div className="lg:hidden text-center space-y-2">
            <Wordmark size="lg" theme="light" />
            <p className="text-gray-600 font-medium">Dein Team. Immer im Bild.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900">Willkommen zurück</h2>
              <p className="text-sm text-gray-500 mt-1">
                Melde dich mit deinem Unternehmenskonto an, um fortzufahren.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => signIn('azure-ad')}
              className="w-full bg-[#0078d4] hover:bg-[#006cc0] text-white py-6 rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" fill="currentColor"/>
              </svg>
              Mit Microsoft anmelden
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Enterprise Ready</span>
              </div>
            </div>
            
            <p className="text-xs text-center text-gray-400 leading-relaxed">
              Durch die Anmeldung stimmst du unseren <br />
              <span className="underline cursor-pointer hover:text-gray-600">Nutzungsbedingungen</span> und <span className="underline cursor-pointer hover:text-gray-600">Datenschutzrichtlinien</span> zu.
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Probleme beim Anmelden? <a href="#" className="text-primary-600 font-semibold hover:underline">Support kontaktieren</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}