import { sendEmail as graphSendEmail } from './graph-client';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  fromUserId?: string;
  fromEmail?: string;  // ⭐ NEU: Email als Alternative
}

export async function sendNotificationEmail(options: EmailOptions) {
  try {
    // ⭐ Verwende fromEmail oder fromUserId
    const sender = options.fromEmail || options.fromUserId;
    
    if (!sender) {
      throw new Error('Either fromEmail or fromUserId must be provided');
    }

    await graphSendEmail(sender, options.to, options.subject, options.body);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export function generateApprovalEmailBody(
  employeeName: string,
  absenceType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  approvalLink: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0078d4;">🏖️ Neuer Abwesenheitsantrag</h2>
        
        <p>Hallo,</p>
        
        <p><strong>${employeeName}</strong> hat einen neuen Abwesenheitsantrag gestellt:</p>
        
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Art:</td>
            <td style="padding: 8px;">${absenceType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Von:</td>
            <td style="padding: 8px;">${startDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Bis:</td>
            <td style="padding: 8px;">${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Tage:</td>
            <td style="padding: 8px;">${totalDays}</td>
          </tr>
        </table>
        
        <p>
          <a href="${approvalLink}" 
             style="background-color: #0078d4; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Antrag prüfen
          </a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Diese E-Mail wurde automatisch vom Abwesenheitsmanagement-System generiert.
        </p>
      </body>
    </html>
  `;
}