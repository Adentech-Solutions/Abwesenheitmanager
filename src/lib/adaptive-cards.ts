// src/lib/adaptive-cards.ts

// ─────────────────────────────────────────────
// 1. APPROVAL REQUEST CARD → Manager
// ─────────────────────────────────────────────

export const createAbsenceRequestCard = (details: {
    id?: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    approvalLink?: string;   // legacy
    approveUrl?: string;     // magic link
    rejectUrl?: string;      // magic link
    dashboardUrl?: string;
    remainingDays?: number;
    handoverEnabled?: boolean;
    handoverItemCount?: number;
    handoverUrgentCount?: number;
    substituteName?: string;
}) => {
    const facts: { title: string; value: string }[] = [
        { title: 'Art:', value: details.type },
        { title: 'Zeitraum:', value: `${details.startDate} → ${details.endDate}` },
        { title: 'Dauer:', value: `${details.totalDays} Arbeitstage` },
    ];
    if (details.remainingDays !== undefined) facts.push({ title: 'Resturlaub danach:', value: `${details.remainingDays} Tage` });
    if (details.reason) facts.push({ title: 'Begründung:', value: details.reason });
    if (details.substituteName) facts.push({ title: 'Vertretung:', value: details.substituteName });
    if (details.handoverEnabled && details.handoverItemCount) {
        const urgentSuffix = details.handoverUrgentCount ? ` (${details.handoverUrgentCount} dringend)` : '';
        facts.push({ title: 'Übergabe:', value: `${details.handoverItemCount} Aufgaben${urgentSuffix}` });
    }

    const approveUrl = details.approveUrl || details.approvalLink || '';
    const rejectUrl = details.rejectUrl || '';
    const dashboardUrl = details.dashboardUrl || process.env.NEXT_PUBLIC_APP_URL || '';

    const actions: any[] = [];
    if (approveUrl) actions.push({ type: 'Action.OpenUrl', title: '✅ Genehmigen', url: approveUrl, style: 'positive' });
    if (rejectUrl) actions.push({ type: 'Action.OpenUrl', title: '❌ Ablehnen', url: rejectUrl, style: 'destructive' });
    if (dashboardUrl) actions.push({ type: 'Action.OpenUrl', title: 'Im Dashboard öffnen', url: dashboardUrl });

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body: [
            {
                type: 'Container',
                style: 'emphasis',
                bleed: true,
                items: [
                    {
                        type: 'ColumnSet',
                        columns: [
                            { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: '🏖️', size: 'ExtraLarge' }] },
                            {
                                type: 'Column', width: 'stretch', items: [
                                    { type: 'TextBlock', text: 'Neuer Urlaubsantrag', weight: 'Bolder', size: 'Medium' },
                                    { type: 'TextBlock', text: `Von ${details.employeeName}`, isSubtle: true, spacing: 'None' },
                                ]
                            },
                        ],
                    },
                ],
            },
            { type: 'FactSet', facts, spacing: 'Medium' },
        ],
        actions,
    };
};

// ─────────────────────────────────────────────
// 2. STATUS NOTIFICATION CARD → Employee
// ─────────────────────────────────────────────

export const createStatusNotificationCard = (details: {
    status: 'approved' | 'rejected';
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    dashboardUrl?: string;
}) => {
    const isApproved = details.status === 'approved';
    const dashboardUrl = details.dashboardUrl || process.env.NEXT_PUBLIC_APP_URL || '';

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body: [
            {
                type: 'Container',
                style: isApproved ? 'good' : 'attention',
                bleed: true,
                items: [
                    {
                        type: 'ColumnSet',
                        columns: [
                            { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: isApproved ? '✅' : '❌', size: 'ExtraLarge' }] },
                            {
                                type: 'Column', width: 'stretch', items: [
                                    { type: 'TextBlock', text: isApproved ? 'Antrag genehmigt' : 'Antrag abgelehnt', weight: 'Bolder', size: 'Medium' },
                                    { type: 'TextBlock', text: isApproved ? 'Ihr Urlaubsantrag wurde genehmigt.' : 'Ihr Urlaubsantrag wurde leider abgelehnt.', isSubtle: true, spacing: 'None' },
                                ]
                            },
                        ],
                    },
                ],
            },
            {
                type: 'FactSet',
                spacing: 'Medium',
                facts: [
                    { title: 'Art:', value: details.type },
                    { title: 'Zeitraum:', value: `${details.startDate} → ${details.endDate}` },
                    ...(details.reason ? [{ title: isApproved ? 'Hinweis:' : 'Grund:', value: details.reason }] : []),
                ],
            },
        ],
        actions: dashboardUrl
            ? [{ type: 'Action.OpenUrl', title: '📊 Zum Dashboard', url: dashboardUrl }]
            : [],
    };
};

// ─────────────────────────────────────────────
// 3. HANDOVER CARD → Substitute
// ─────────────────────────────────────────────

interface HandoverCardItem {
    id: string;
    title: string;
    description?: string;
    links?: { title: string; url: string }[];
    isUrgent: boolean;
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
}

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
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
                {
                    type: 'ColumnSet',
                    columns: [
                        { type: 'Column', width: 'auto', items: [{ type: 'TextBlock', text: '📋', size: 'ExtraLarge' }] },
                        {
                            type: 'Column', width: 'stretch', items: [
                                { type: 'TextBlock', text: `Übergabe von ${details.employeeName}`, weight: 'Bolder', size: 'Medium' },
                                { type: 'TextBlock', text: `${details.startDate} – ${details.endDate} · ${details.totalDays} Tage`, isSubtle: true, spacing: 'None' },
                            ]
                        },
                    ],
                },
            ],
        },
    ];

    // Erreichbarkeit
    if (details.emergencyContact) {
        const ec = details.emergencyContact;
        const ecText =
            ec.availability === 'unavailable' ? '🔕 Nicht erreichbar' :
                ec.availability === 'emergency_only' ? `🚨 Nur Notfälle${ec.phone ? `: ${ec.phone}` : ''}` :
                    '📧 Eingeschränkt per E-Mail';

        bodyElements.push({
            type: 'Container',
            style: ec.availability === 'unavailable' ? 'default' : 'attention',
            spacing: 'Medium',
            items: [
                { type: 'TextBlock', text: ecText, weight: 'Bolder', wrap: true },
                ...(ec.note ? [{ type: 'TextBlock', text: ec.note, size: 'Small', isSubtle: true, spacing: 'None' }] : []),
            ],
        });
    }

    // Aufgaben — hohe Priorität zuerst
    if (details.items.length > 0) {
        bodyElements.push({ type: 'TextBlock', text: `Aufgaben (${details.items.length})`, weight: 'Bolder', spacing: 'Medium' });

        const sorted = [...details.items].sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.priority ?? (a.isUrgent ? 'high' : 'medium')] ?? 1)
                - (order[b.priority ?? (b.isUrgent ? 'high' : 'medium')] ?? 1);
        });

        for (const item of sorted) {
            const isHigh = item.priority === 'high' || item.isUrgent;
            const isMed = item.priority === 'medium';
            const icon = isHigh ? '⚡' : isMed ? '📌' : '✓';

            bodyElements.push({
                type: 'Container',
                style: isHigh ? 'attention' : 'default',
                spacing: 'Small',
                items: [
                    { type: 'TextBlock', text: `${icon} ${item.title}`, weight: 'Bolder', wrap: true },
                    ...(item.description ? [{ type: 'TextBlock', text: item.description, size: 'Small', wrap: true, spacing: 'None' }] : []),
                    ...(item.dueDate ? [{ type: 'TextBlock', text: `Fällig: ${item.dueDate}`, size: 'Small', isSubtle: true, spacing: 'None' }] : []),
                ],
            });
        }
    }

    // Allgemeine Hinweise
    if (details.generalNotes) {
        bodyElements.push({
            type: 'Container',
            style: 'emphasis',
            spacing: 'Medium',
            items: [
                { type: 'TextBlock', text: 'Allgemeine Hinweise', weight: 'Bolder' },
                { type: 'TextBlock', text: details.generalNotes, wrap: true, spacing: 'None' },
            ],
        });
    }

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body: bodyElements,
        actions: [
            { type: 'Action.OpenUrl', title: '✅ Zur Kenntnis genommen', url: details.acknowledgeUrl, style: 'positive' },
        ],
    };
};

// ─────────────────────────────────────────────
// 4. HANDOVER ACKNOWLEDGED CARD → Employee
// ─────────────────────────────────────────────

export const createHandoverAcknowledgedCard = (substituteName: string) => ({
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
        {
            type: 'Container',
            style: 'good',
            bleed: true,
            items: [
                { type: 'TextBlock', text: `✅ ${substituteName} hat die Übergabe bestätigt`, weight: 'Bolder', size: 'Medium' },
                { type: 'TextBlock', text: 'Ihre Vertretung hat die Übergabe zur Kenntnis genommen und ist informiert.', isSubtle: true, spacing: 'None' },
            ],
        },
    ],
});

// ─────────────────────────────────────────────
// 5. HANDOVER TRACKER CARD → Substitute
// ─────────────────────────────────────────────

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
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
                { type: 'TextBlock', text: `📊 Übergabe Tracker: ${details.employeeName}`, weight: 'Bolder', size: 'Medium' },
                { type: 'TextBlock', text: `Zeitraum: ${details.startDate} – ${details.endDate}`, isSubtle: true, spacing: 'None' },
            ],
        },
        { type: 'TextBlock', text: 'Ihre Übergabe-Vorgänge in der Übersicht:', spacing: 'Medium', wrap: true },
    ];

    for (const item of details.items) {
        const isDone = item.status === 'done';
        const isUrgent = item.isUrgent || item.priority === 'high';
        const icon = isDone ? '✅' : isUrgent ? '🔴' : '⏳';

        bodyElements.push({
            type: 'Container',
            spacing: 'Medium',
            style: isDone ? 'good' : 'default',
            items: [
                { type: 'TextBlock', weight: 'Bolder', text: `${icon} ${item.title}`, wrap: true },
                ...(item.description ? [{ type: 'TextBlock', text: item.description, wrap: true, size: 'Small', spacing: 'Small', isSubtle: isDone }] : []),
                {
                    type: 'ActionSet',
                    actions: isDone ? [] : [
                        { type: 'Action.OpenUrl', title: '✅ Erledigt', url: details.generateActionUrl(item.id, 'mark_done') },
                        { type: 'Action.OpenUrl', title: '💬 Notiz', url: details.generateActionUrl(item.id, 'add_note') },
                    ],
                },
            ],
        });
    }

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body: bodyElements,
    };
};

// ─────────────────────────────────────────────
// 6. RETURN PROMPT CARD → Substitute
// ─────────────────────────────────────────────

export const createReturnPromptCard = (details: {
    absenceId: string;
    employeeName: string;
    endDate: string;
    generateActionUrl: (action: 'return_summary') => string;
}) => ({
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
        {
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
                { type: 'TextBlock', text: `👋 Rückkehr von ${details.employeeName}`, weight: 'Bolder', size: 'Medium' },
                { type: 'TextBlock', text: `Rückkehr am ${details.endDate}`, isSubtle: true, spacing: 'None' },
            ],
        },
        {
            type: 'TextBlock',
            text: `${details.employeeName} kehrt bald zurück. Bitte schreiben Sie eine kurze Zusammenfassung der Übergabezeit, damit der Wiedereinstieg reibungslos klappt.`,
            wrap: true,
            spacing: 'Medium',
        },
    ],
    actions: [
        { type: 'Action.OpenUrl', title: '✍️ Zusammenfassung schreiben', url: details.generateActionUrl('return_summary'), style: 'positive' },
    ],
});

// ─────────────────────────────────────────────
// 7. WELCOME BACK CARD → Employee
// ─────────────────────────────────────────────

export const createWelcomeBackCard = (details: {
    employeeName: string;
    substituteName: string;
    summary: string;
    openDashboardUrl: string;
}) => ({
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
        {
            type: 'Container',
            style: 'good',
            bleed: true,
            items: [
                { type: 'TextBlock', text: `🎉 Willkommen zurück, ${details.employeeName}!`, weight: 'Bolder', size: 'Medium' },
                { type: 'TextBlock', text: `Von ${details.substituteName}`, isSubtle: true, spacing: 'None' },
            ],
        },
        { type: 'TextBlock', text: 'Ihre Vertretung hat folgende Zusammenfassung hinterlassen:', wrap: true, spacing: 'Medium' },
        {
            type: 'Container',
            style: 'emphasis',
            spacing: 'Small',
            items: [{ type: 'TextBlock', text: details.summary, wrap: true }],
        },
    ],
    actions: [
        { type: 'Action.OpenUrl', title: '📊 Zum Dashboard', url: details.openDashboardUrl },
    ],
});

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

export const formatAbsenceTypeGerman = (type: string): string => {
    const types: Record<string, string> = {
        vacation: 'Urlaub', sick: 'Krankheit', training: 'Fortbildung', parental: 'Elternzeit',
    };
    return types[type] || type;
};