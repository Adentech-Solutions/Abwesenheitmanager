
export const createAbsenceRequestCard = (details: {
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    approvalLink: string;
    // Handover info (optional)
    handoverItemCount?: number;
    handoverUrgentCount?: number;
    substituteName?: string;
}) => {
    const facts = [
        { title: 'Mitarbeiter:', value: details.employeeName },
        { title: 'Art:', value: details.type },
        { title: 'Zeitraum:', value: `${details.startDate} - ${details.endDate}` },
        { title: 'Dauer:', value: `${details.totalDays} Tage` },
        ...(details.reason ? [{ title: 'Grund:', value: details.reason }] : []),
    ];

    // Add handover summary if present
    if (details.handoverItemCount && details.handoverItemCount > 0) {
        const urgentSuffix = details.handoverUrgentCount
            ? ` (${details.handoverUrgentCount} dringend)`
            : '';
        facts.push({
            title: '📋 Übergabe:',
            value: `${details.handoverItemCount} Vorgänge${urgentSuffix}`,
        });
    }
    if (details.substituteName) {
        facts.push({
            title: 'Vertretung:',
            value: details.substituteName,
        });
    }

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
                facts,
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
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://absence-app.com',
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4'
    };
};

// ========================================
// Handover Adaptive Cards
// ========================================

interface HandoverCardItem {
    id: string;
    title: string;
    description?: string;
    links?: { title: string; url: string }[];
    isUrgent: boolean;
}

/**
 * Full handover document card — sent to substitute after approval
 */
export const createHandoverCard = (details: {
    employeeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    items: HandoverCardItem[];
    generalNotes?: string;
    emergencyContact?: {
        availability: 'unavailable' | 'emergency_only' | 'limited_email';
        phone?: string;
        note?: string;
    };
    acknowledgeUrl: string;
}) => {
    const bodyElements: any[] = [
        {
            type: 'TextBlock',
            size: 'Medium',
            weight: 'Bolder',
            text: `📋 ÜBERGABE von ${details.employeeName}`,
            color: 'Accent',
        },
        {
            type: 'TextBlock',
            text: `${details.startDate} – ${details.endDate} (${details.totalDays} Tage)`,
            isSubtle: true,
            spacing: 'None',
        },
        {
            type: 'TextBlock',
            text: ' ',
            spacing: 'Small',
        },
    ];

    // Urgent items first
    const urgentItems = details.items.filter((i) => i.isUrgent);
    const regularItems = details.items.filter((i) => !i.isUrgent);

    if (urgentItems.length > 0) {
        for (const item of urgentItems) {
            bodyElements.push({
                type: 'TextBlock',
                weight: 'Bolder',
                text: `⚡ ${item.title}`,
                color: 'Attention',
                spacing: 'Medium',
            });
            if (item.description) {
                bodyElements.push({
                    type: 'TextBlock',
                    text: item.description,
                    wrap: true,
                    size: 'Small',
                    spacing: 'None',
                });
            }
            if (item.links && item.links.length > 0) {
                for (const link of item.links) {
                    bodyElements.push({
                        type: 'TextBlock',
                        text: `🔗 [${link.title}](${link.url})`,
                        size: 'Small',
                        spacing: 'None',
                    });
                }
            }
        }
    }

    // Regular items
    if (regularItems.length > 0) {
        for (const item of regularItems) {
            bodyElements.push({
                type: 'TextBlock',
                weight: 'Bolder',
                text: `📌 ${item.title}`,
                spacing: 'Medium',
            });
            if (item.description) {
                bodyElements.push({
                    type: 'TextBlock',
                    text: item.description,
                    wrap: true,
                    size: 'Small',
                    spacing: 'None',
                });
            }
            if (item.links && item.links.length > 0) {
                for (const link of item.links) {
                    bodyElements.push({
                        type: 'TextBlock',
                        text: `🔗 [${link.title}](${link.url})`,
                        size: 'Small',
                        spacing: 'None',
                    });
                }
            }
        }
    }

    // General notes
    if (details.generalNotes) {
        bodyElements.push({
            type: 'TextBlock',
            text: `📝 ${details.generalNotes}`,
            wrap: true,
            spacing: 'Medium',
        });
    }

    // Emergency contact
    if (details.emergencyContact) {
        const ec = details.emergencyContact;
        if (ec.availability === 'emergency_only' && ec.phone) {
            bodyElements.push({
                type: 'TextBlock',
                text: `🚨 Notfall: ${ec.phone}`,
                weight: 'Bolder',
                color: 'Attention',
                spacing: 'Medium',
            });
        } else if (ec.availability === 'limited_email') {
            bodyElements.push({
                type: 'TextBlock',
                text: '📧 Eingeschränkt per E-Mail erreichbar',
                isSubtle: true,
                spacing: 'Medium',
            });
        }
        if (ec.note) {
            bodyElements.push({
                type: 'TextBlock',
                text: ec.note,
                size: 'Small',
                isSubtle: true,
                spacing: 'None',
            });
        }
    }

    return {
        type: 'AdaptiveCard',
        body: bodyElements,
        actions: [
            {
                type: 'Action.OpenUrl',
                title: '✅ Zur Kenntnis genommen',
                url: details.acknowledgeUrl,
                style: 'positive',
            },
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
    };
};

/**
 * Simple acknowledgement confirmation — sent to employee
 */
export const createHandoverAcknowledgedCard = (substituteName: string) => {
    return {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `✅ ${substituteName} hat die Übergabe bestätigt`,
                color: 'Good',
            },
            {
                type: 'TextBlock',
                text: 'Ihre Vertretung hat die Übergabe zur Kenntnis genommen und ist informiert.',
                wrap: true,
                isSubtle: true,
            },
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
    };
};

/**
 * Helper to format absence types in German
 */
export const formatAbsenceTypeGerman = (type: string): string => {
    const types: Record<string, string> = {
        vacation: 'Urlaub',
        sick: 'Krankheit',
        training: 'Fortbildung',
        parental: 'Elternzeit',
    };
    return types[type] || type;
};

/**
 * Interactive Handover Tracker Card (Phase 1b)
 * Sent to substitute after they acknowledge the handover.
 */
export const createHandoverTrackerCard = (details: {
    absenceId: string;
    employeeName: string;
    startDate: string;
    endDate: string;
    items: any[];
    generateActionUrl: (itemId: string, action: 'mark_done' | 'add_note') => string;
}) => {
    const bodyElements: any[] = [
        {
            type: 'TextBlock',
            size: 'Medium',
            weight: 'Bolder',
            text: `📊 Übergabe Tracker: ${details.employeeName}`,
            style: 'heading',
        },
        {
            type: 'TextBlock',
            text: `Zeitraum: ${details.startDate} - ${details.endDate}`,
            isSubtle: true,
            spacing: 'None',
        },
        {
            type: 'TextBlock',
            text: 'Ihre Übergabe-Vorgänge in der Übersicht:',
            wrap: true,
            spacing: 'Medium',
        },
    ];

    if (details.items && details.items.length > 0) {
        for (const item of details.items) {
            const isDone = item.status === 'done';
            const statusIcon = isDone ? '✅' : (item.isUrgent ? '🔴' : '⏳');

            bodyElements.push({
                type: 'Container',
                spacing: 'Medium',
                style: isDone ? 'good' : 'default',
                items: [
                    {
                        type: 'TextBlock',
                        weight: 'Bolder',
                        text: `${statusIcon} ${item.title}`,
                        wrap: true,
                    },
                    {
                        type: 'TextBlock',
                        text: item.description || 'Keine Beschreibung',
                        wrap: true,
                        size: 'Small',
                        spacing: 'Small',
                        isSubtle: isDone,
                    },
                    {
                        type: 'ActionSet',
                        actions: isDone ? [] : [
                            {
                                type: 'Action.OpenUrl',
                                title: '✅ Erledigt',
                                url: details.generateActionUrl(item.id, 'mark_done'),
                            },
                            {
                                type: 'Action.OpenUrl',
                                title: '💬 Notiz',
                                url: details.generateActionUrl(item.id, 'add_note'),
                            }
                        ]
                    }
                ]
            });
        }
    } else {
        bodyElements.push({
            type: 'TextBlock',
            text: 'Keine spezifischen Vorgänge definiert.',
            isSubtle: true,
            spacing: 'Medium',
        });
    }

    return {
        type: 'AdaptiveCard',
        body: bodyElements,
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
    };
};

/**
 * Return Prompt Card (Phase 1c)
 * Sent to substitute shortly before employee returns.
 */
export const createReturnPromptCard = (details: {
    absenceId: string;
    employeeName: string;
    endDate: string;
    generateActionUrl: (action: 'return_summary') => string;
}) => {
    return {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `👋 Rückkehr von ${details.employeeName}`,
                style: 'heading',
            },
            {
                type: 'TextBlock',
                text: `${details.employeeName} kehrt am ${details.endDate} zurück. Bitte schreiben Sie eine kurze Zusammenfassung der Übergabezeit.`,
                wrap: true,
                spacing: 'Medium',
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: '✍️ Zusammenfassung schreiben',
                url: details.generateActionUrl('return_summary'),
                style: 'positive',
            },
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
    };
};

/**
 * Welcome Back Card (Phase 1c)
 * Sent to employee upon return with the substitute's summary.
 */
export const createWelcomeBackCard = (details: {
    employeeName: string;
    substituteName: string;
    summary: string;
    openDashboardUrl: string;
}) => {
    return {
        type: 'AdaptiveCard',
        body: [
            {
                type: 'TextBlock',
                size: 'Medium',
                weight: 'Bolder',
                text: `🎉 Willkommen zurück, ${details.employeeName}!`,
                style: 'heading',
            },
            {
                type: 'TextBlock',
                text: `Ihre Vertretung (${details.substituteName}) hat eine Zusammenfassung für Sie hinterlassen:`,
                wrap: true,
                spacing: 'Medium',
            },
            {
                type: 'Container',
                style: 'emphasis',
                padding: '12px',
                spacing: 'Medium',
                items: [
                    {
                        type: 'TextBlock',
                        text: details.summary,
                        wrap: true,
                    }
                ]
            }
        ],
        actions: [
            {
                type: 'Action.OpenUrl',
                title: 'Zum Dashboard',
                url: details.openDashboardUrl,
            }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4',
    };
};
