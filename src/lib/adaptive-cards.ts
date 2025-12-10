
export const createAbsenceRequestCard = (details: {
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    approvalLink: string;
}) => {
    return {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: '🏖️ Neuer Abwesenheitsantrag',
                color: 'Accent'
            },
            {
                type: 'FactSet',
                facts: [
                    {
                        title: 'Mitarbeiter:',
                        value: details.employeeName
                    },
                    {
                        title: 'Art:',
                        value: details.type
                    },
                    {
                        title: 'Zeitraum:',
                        value: `${details.startDate} - ${details.endDate}`
                    },
                    {
                        title: 'Dauer:',
                        value: `${details.totalDays} Tage`
                    },
                    ...(details.reason ? [{ title: 'Grund:', value: details.reason }] : [])
                ]
            },
            {
                type: 'TextBlock',
                text: 'Bitte prüfen und genehmigen Sie diesen Antrag.',
                wrap: true,
                size: 'Small',
                isSubtle: true
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: 'Antrag öffnen & genehmigen',
                url: details.approvalLink,
                style: 'positive'
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4'
    };
};

export const createStatusNotificationCard = (details: {
    status: 'approved' | 'rejected';
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
}) => {
    const isApproved = details.status === 'approved';
    const color = isApproved ? 'Good' : 'Attention';
    const title = isApproved ? '✅ Antrag genehmigt' : '❌ Antrag abgelehnt';

    return {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: title,
                color: color
            },
            {
                type: 'TextBlock',
                text: `Ihr Antrag auf ${details.type} wurde bearbeitet.`,
                wrap: true
            },
            {
                type: 'FactSet',
                facts: [
                    {
                        title: 'Zeitraum:',
                        value: `${details.startDate} - ${details.endDate}`
                    },
                    ...(details.reason ? [{ title: 'Grund/Kommentar:', value: details.reason }] : [])
                ]
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: 'Zum Dashboard',
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://absence-app.com', // Fallback URL
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4'
    };
};
