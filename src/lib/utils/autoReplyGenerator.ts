// src/lib/utils/autoReplyGenerator.ts
// Auto-Reply Message Generator

import { AutoReplySubstitute } from '@/types/absence';

export interface GenerateAutoReplyParams {
  userName: string;
  startDate: Date;
  endDate: Date;
  substitute?: AutoReplySubstitute;
  userSignature?: string;
}

export interface AutoReplyMessages {
  internal: string;
  external: string;
}

/**
 * Generiert professionelle Auto-Reply Nachrichten
 * für interne und externe Empfänger
 */
export function generateAutoReplyMessage(
  params: GenerateAutoReplyParams
): AutoReplyMessages {
  const { userName, startDate, endDate, substitute, userSignature } = params;

  // Datum formatieren
  const startDateStr = startDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const endDateStr = endDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // BASIS-TEXT (für beide)
  let baseMessage = `Guten Tag,\n\nvielen Dank für Ihre Nachricht.\n\nIch bin vom ${startDateStr} bis ${endDateStr} abwesend und habe in dieser Zeit keinen Zugriff auf meine E-Mails.`;

  // VERTRETUNG (falls vorhanden)
  let substituteSection = '';
  if (substitute && substitute.email) {
    substituteSection = `\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an meine Vertretung:\n\n${substitute.name || 'Vertretung'}\nE-Mail: ${substitute.email}`;
    
    if (substitute.phone) {
      substituteSection += `\nTel.: ${substitute.phone}`;
    }
  } else {
    substituteSection = '\n\nBei dringenden Angelegenheiten wenden Sie sich bitte an mein Team.';
  }

  // RÜCKKEHR
  const returnSection = '\n\nIch werde Ihre E-Mail nach meiner Rückkehr bearbeiten.';

  // GRUSS + SIGNATURE
  const closingSection = '\n\nMit freundlichen Grüßen\n' + userName;
  
  const signatureSection = userSignature 
    ? '\n────────────────────\n' + userSignature 
    : '';

  // EXTERNE NACHRICHT (Formeller)
  const externalMessage = 
    baseMessage + 
    substituteSection + 
    returnSection + 
    closingSection + 
    signatureSection;

  // INTERNE NACHRICHT (Kann etwas weniger formell sein, aber gleich für jetzt)
  const internalMessage = 
    baseMessage + 
    substituteSection + 
    returnSection + 
    closingSection + 
    signatureSection;

  return {
    internal: internalMessage,
    external: externalMessage,
  };
}

/**
 * Erstellt eine Standard-Signatur aus User-Daten
 * (kann später aus Entra ID geholt werden)
 */
export function generateUserSignature(
  userName: string,
  email: string,
  jobTitle?: string,
  department?: string,
  phone?: string
): string {
  let signature = userName;
  
  if (jobTitle) {
    signature += '\n' + jobTitle;
  }
  
  if (department) {
    signature += '\n' + department;
  }
  
  signature += '\n\nE-Mail: ' + email;
  
  if (phone) {
    signature += '\nTel.: ' + phone;
  }
  
  return signature;
}