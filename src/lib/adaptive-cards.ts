// src/lib/adaptive-cards.ts
// Redesigned: richer manager card, better visual hierarchy

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
export const formatAbsenceTypeGerman = (type: string): string => {
    const types: Record<string, string> = {
        vacation: '🏖️ Urlaub',
        sick: '🤒 Krankheit',
        training: '📚 Fortbildung',
        parental: '👶 Elternzeit',
    };
    return types[type] || type;
};

const typeColor = (type: string): string => {
    const colors: Record<string, string> = {
        vacation: 'accent',
        sick: 'attention',
        training: 'good',
        parental: 'warning',
    };
    return colors[type] || 'default';
};

// ─────────────────────────────────────────────
// 1. APPROVAL REQUEST CARD → Manager (REDESIGNED)
// ─────────────────────────────────────────────
export const createAbsenceRequestCard = (details: {
    id?: string;
    employeeName: string;
    type: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
    approvalLink?: string;
    approveUrl?: string;
    rejectUrl?: string;
    dashboardUrl?: string;
    remainingDays?: number;
    handoverEnabled?: boolean;
    handoverItemCount?: number;
    handoverUrgentCount?: number;
    substituteName?: string;
    department?: string;
    jobTitle?: string;
}) => {
    const typeLabel = formatAbsenceTypeGerman(details.type);
    const urgentText = details.handoverUrgentCount
        ? ` (${details.handoverUrgentCount} dringend)`
        : '';

    const body: any[] = [
        // ── Header Banner ──
        {
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: '📋 Neuer Urlaubsantrag',
                                    weight: 'Bolder',
                                    size: 'Large',
                                    color: 'Default',
                                },
                                {
                                    type: 'TextBlock',
                                    text: `Von **${details.employeeName}**`,
                                    spacing: 'None',
                                    isSubtle: true,
                                    wrap: true,
                                },
                            ],
                        },
                        {
                            type: 'Column',
                            width: 'auto',
                            items: [
                                {
                                    type: 'TextBlock',
                                    text: typeLabel,
                                    weight: 'Bolder',
                                    size: 'Medium',
                                    horizontalAlignment: 'Right',
                                },
                            ],
                        },
                    ],
                },
            ],
        },

        // ── Abwesenheitsdetails ──
        {
            type: 'Container',
            spacing: 'Medium',
            items: [
                {
                    type: 'TextBlock',
                    text: 'ABWESENHEITSDETAILS',
                    weight: 'Bolder',
                    size: 'Small',
                    color: 'Accent',
                    spacing: 'None',
                },
                {
                    type: 'FactSet',
                    spacing: 'Small',
                    facts: [
                        { title: '📅 Zeitraum:', value: `${details.startDate} → ${details.endDate}` },
                        { title: '⏱️ Dauer:', value: `**${details.totalDays} Arbeitstage**` },
                        ...(details.remainingDays !== undefined
                            ? [{ title: '🏖️ Resturlaub danach:', value: `${details.remainingDays} Tage` }]
                            : []),
                        ...(details.department
                            ? [{ title: '🏢 Abteilung:', value: details.department }]
                            : []),
                        ...(details.jobTitle
                            ? [{ title: '💼 Position:', value: details.jobTitle }]
                            : []),
                    ],
                },
            ],
        },

        // ── Begründung (wenn vorhanden) ──
        ...(details.reason ? [{
            type: 'Container',
            style: 'emphasis',
            spacing: 'Small',
            items: [
                { type: 'TextBlock', text: '💬 Begründung', weight: 'Bolder', size: 'Small' },
                { type: 'TextBlock', text: details.reason, wrap: true, spacing: 'Small' },
            ],
        }] : []),

        // ── Vertretung & Übergabe ──
        ...(details.substituteName || details.handoverEnabled ? [{
            type: 'Container',
            spacing: 'Medium',
            items: [
                {
                    type: 'TextBlock',
                    text: 'VERTRETUNG & ÜBERGABE',
                    weight: 'Bolder',
                    size: 'Small',
                    color: 'Accent',
                    spacing: 'None',
                },
                {
                    type: 'FactSet',
                    spacing: 'Small',
                    facts: [
                        ...(details.substituteName
                            ? [{ title: '👤 Vertretung:', value: details.substituteName }]
                            : [{ title: '👤 Vertretung:', value: 'Nicht festgelegt' }]),
                        ...(details.handoverEnabled
                            ? [{ title: '📋 Übergabe:', value: `${details.handoverItemCount || 0} Aufgaben${urgentText}` }]
                            : [{ title: '📋 Übergabe:', value: 'Nicht konfiguriert' }]),
                    ],
                },
            ],
        }] : []),

        // ── Trennlinie ──
        { type: 'Container', spacing: 'Medium', style: 'default', items: [{ type: 'TextBlock', text: ' ', spacing: 'None' }] },

        // ── Hinweistext ──
        {
            type: 'TextBlock',
            text: 'Bitte prüfen Sie den Antrag und treffen Sie eine Entscheidung:',
            wrap: true,
            isSubtle: true,
            size: 'Small',
            spacing: 'Small',
        },
    ];

    const actions: any[] = [];

    if (details.approveUrl || details.approvalLink) {
        actions.push({
            type: 'Action.OpenUrl',
            title: '✅ Genehmigen',
            url: details.approveUrl || details.approvalLink,
            style: 'positive',
        });
    }
    if (details.rejectUrl) {
        actions.push({
            type: 'Action.OpenUrl',
            title: '❌ Ablehnen',
            url: details.rejectUrl,
            style: 'destructive',
        });
    }
    if (details.dashboardUrl) {
        actions.push({
            type: 'Action.OpenUrl',
            title: '📊 Im Dashboard öffnen',
            url: details.dashboardUrl,
        });
    }

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body,
        actions,
    };
};

// ─────────────────────────────────────────────
// 2. STATUS NOTIFICATION → Employee
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
                        type: 'TextBlock',
                        text: isApproved ? '✅ Antrag genehmigt!' : '❌ Antrag abgelehnt',
                        weight: 'Bolder',
                        size: 'Large',
                        color: 'Light',
                    },
                    {
                        type: 'TextBlock',
                        text: isApproved
                            ? 'Ihr Urlaubsantrag wurde genehmigt.'
                            : 'Ihr Urlaubsantrag wurde leider abgelehnt.',
                        isSubtle: true,
                        spacing: 'None',
                        color: 'Light',
                    },
                ],
            },
            {
                type: 'FactSet',
                spacing: 'Medium',
                facts: [
                    { title: 'Art:', value: formatAbsenceTypeGerman(details.type) },
                    { title: 'Zeitraum:', value: `${details.startDate} → ${details.endDate}` },
                    ...(details.reason ? [{ title: 'Hinweis:', value: details.reason }] : []),
                ],
            },
            ...(isApproved ? [{
                type: 'TextBlock',
                text: '📅 Ihr Kalender wurde aktualisiert und Ihre automatische Abwesenheitsnotiz wird zum Startzeitpunkt aktiviert.',
                wrap: true,
                isSubtle: true,
                size: 'Small',
                spacing: 'Medium',
            }] : []),
        ],
        actions: details.dashboardUrl ? [
            { type: 'Action.OpenUrl', title: '📊 Zum Dashboard', url: details.dashboardUrl },
        ] : [],
    };
};

// ─────────────────────────────────────────────
// 3. HANDOVER CARD → Substitute
// ─────────────────────────────────────────────
export const createHandoverCard = (details: {
    employeeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    items: {
        id: string;
        title: string;
        description?: string;
        links?: { title: string; url: string }[];
        isUrgent: boolean;
        priority?: 'high' | 'medium' | 'low';
        dueDate?: string;
    }[];
    generalNotes?: string;
    emergencyContact?: {
        availability: 'unavailable' | 'emergency_only' | 'limited_email';
        phone?: string;
        note?: string;
    };
    acknowledgeUrl: string;
}) => {
    const availabilityText: Record<string, string> = {
        unavailable: '🔴 Nicht erreichbar',
        emergency_only: '🟡 Nur im Notfall',
        limited_email: '🟠 Eingeschränkt per E-Mail',
    };

    const urgentItems = details.items.filter(i => i.isUrgent || i.priority === 'high');
    const normalItems = details.items.filter(i => !i.isUrgent && i.priority !== 'high');

    const body: any[] = [
        // Header
        {
            type: 'Container',
            style: 'warning',
            bleed: true,
            items: [
                {
                    type: 'TextBlock',
                    text: `📋 Übergabe von ${details.employeeName}`,
                    weight: 'Bolder',
                    size: 'Large',
                },
                {
                    type: 'TextBlock',
                    text: `${details.startDate} – ${details.endDate} · ${details.totalDays} Tage`,
                    isSubtle: true,
                    spacing: 'None',
                },
            ],
        },

        // Erreichbarkeit
        ...(details.emergencyContact ? [{
            type: 'Container',
            spacing: 'Medium',
            items: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                { type: 'TextBlock', text: 'ERREICHBARKEIT', weight: 'Bolder', size: 'Small', color: 'Accent' },
                                {
                                    type: 'TextBlock',
                                    text: availabilityText[details.emergencyContact.availability] || '🔴 Nicht erreichbar',
                                    spacing: 'Small',
                                },
                                ...(details.emergencyContact.phone ? [{
                                    type: 'TextBlock',
                                    text: `📞 ${details.emergencyContact.phone}`,
                                    size: 'Small',
                                    spacing: 'None',
                                }] : []),
                                ...(details.emergencyContact.note ? [{
                                    type: 'TextBlock',
                                    text: details.emergencyContact.note,
                                    size: 'Small',
                                    isSubtle: true,
                                    wrap: true,
                                    spacing: 'None',
                                }] : []),
                            ],
                        },
                    ],
                },
            ],
        }] : []),

        // Allgemeine Hinweise
        ...(details.generalNotes ? [{
            type: 'Container',
            style: 'emphasis',
            spacing: 'Medium',
            items: [
                { type: 'TextBlock', text: '📝 Allgemeine Hinweise', weight: 'Bolder', size: 'Small' },
                { type: 'TextBlock', text: details.generalNotes, wrap: true, spacing: 'Small' },
            ],
        }] : []),
    ];

    // Dringende Aufgaben zuerst
    if (urgentItems.length > 0) {
        body.push({
            type: 'TextBlock',
            text: `🔴 DRINGENDE AUFGABEN (${urgentItems.length})`,
            weight: 'Bolder',
            size: 'Small',
            color: 'Attention',
            spacing: 'Medium',
        });
        for (const item of urgentItems) {
            body.push({
                type: 'Container',
                style: 'attention',
                spacing: 'Small',
                items: [
                    { type: 'TextBlock', text: `⚡ ${item.title}`, weight: 'Bolder', wrap: true },
                    ...(item.description ? [{ type: 'TextBlock', text: item.description, wrap: true, size: 'Small', spacing: 'Small' }] : []),
                    ...(item.dueDate ? [{ type: 'TextBlock', text: `📅 Fällig: ${item.dueDate}`, size: 'Small', color: 'Attention', spacing: 'None' }] : []),
                ],
            });
        }
    }

    // Normale Aufgaben
    if (normalItems.length > 0) {
        body.push({
            type: 'TextBlock',
            text: `📋 AUFGABEN (${normalItems.length})`,
            weight: 'Bolder',
            size: 'Small',
            spacing: 'Medium',
        });
        for (const item of normalItems) {
            body.push({
                type: 'Container',
                spacing: 'Small',
                items: [
                    { type: 'TextBlock', text: `✓ ${item.title}`, weight: 'Bolder', wrap: true },
                    ...(item.description ? [{ type: 'TextBlock', text: item.description, wrap: true, size: 'Small', spacing: 'Small', isSubtle: true }] : []),
                ],
            });
        }
    }

    body.push({
        type: 'TextBlock',
        text: 'Bitte bestätigen Sie, dass Sie die Übergabe zur Kenntnis genommen haben.',
        wrap: true,
        isSubtle: true,
        size: 'Small',
        spacing: 'Medium',
    });

    return {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        body,
        actions: [
            { type: 'Action.OpenUrl', title: '✅ Zur Kenntnis genommen', url: details.acknowledgeUrl, style: 'positive' },
        ],
    };
};

// ─────────────────────────────────────────────
// 4. HANDOVER ACKNOWLEDGED → Employee
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
                { type: 'TextBlock', text: '✅ Übergabe bestätigt', weight: 'Bolder', size: 'Large', color: 'Light' },
                { type: 'TextBlock', text: `Von ${substituteName}`, isSubtle: true, spacing: 'None', color: 'Light' },
            ],
        },
        {
            type: 'TextBlock',
            text: `**${substituteName}** hat Ihre Übergabe zur Kenntnis genommen und wird Ihre Aufgaben während Ihrer Abwesenheit übernehmen.`,
            wrap: true,
            spacing: 'Medium',
        },
        {
            type: 'TextBlock',
            text: 'Gute Erholung! 🌴',
            wrap: true,
            spacing: 'Small',
            size: 'Medium',
        },
    ],
    actions: [],
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
    const doneCount = details.items.filter(i => i.status === 'done').length;
    const totalCount = details.items.length;
    const progressText = `${doneCount}/${totalCount} erledigt`;

    const bodyElements: any[] = [
        {
            type: 'Container',
            style: 'emphasis',
            bleed: true,
            items: [
                {
                    type: 'ColumnSet',
                    columns: [
                        {
                            type: 'Column',
                            width: 'stretch',
                            items: [
                                { type: 'TextBlock', text: `📊 Übergabe: ${details.employeeName}`, weight: 'Bolder', size: 'Medium' },
                                { type: 'TextBlock', text: `${details.startDate} – ${details.endDate}`, isSubtle: true, spacing: 'None' },
                            ],
                        },
                        {
                            type: 'Column',
                            width: 'auto',
                            items: [
                                { type: 'TextBlock', text: progressText, weight: 'Bolder', horizontalAlignment: 'Right', color: doneCount === totalCount ? 'Good' : 'Default' },
                            ],
                        },
                    ],
                },
            ],
        },
    ];

    for (const item of details.items) {
        const isDone = item.status === 'done';
        const isUrgent = item.isUrgent || item.priority === 'high';
        const icon = isDone ? '✅' : isUrgent ? '🔴' : '⏳';

        bodyElements.push({
            type: 'Container',
            spacing: 'Medium',
            style: isDone ? 'good' : isUrgent ? 'attention' : 'default',
            items: [
                { type: 'TextBlock', weight: 'Bolder', text: `${icon} ${item.title}`, wrap: true },
                ...(item.description ? [{ type: 'TextBlock', text: item.description, wrap: true, size: 'Small', spacing: 'Small', isSubtle: isDone }] : []),
                ...(item.dueDate && !isDone ? [{ type: 'TextBlock', text: `📅 Fällig: ${item.dueDate}`, size: 'Small', color: 'Attention', spacing: 'None' }] : []),
                {
                    type: 'ActionSet',
                    actions: isDone ? [] : [
                        { type: 'Action.OpenUrl', title: '✅ Erledigt', url: details.generateActionUrl(item.id, 'mark_done') },
                        { type: 'Action.OpenUrl', title: '💬 Notiz hinzufügen', url: details.generateActionUrl(item.id, 'add_note') },
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
            text: `**${details.employeeName}** kehrt morgen zurück. Bitte schreiben Sie eine kurze Zusammenfassung der Übergabezeit — was ist passiert, was ist noch offen?`,
            wrap: true,
            spacing: 'Medium',
        },
        {
            type: 'TextBlock',
            text: 'Das hilft beim reibungslosen Wiedereinstieg.',
            wrap: true,
            isSubtle: true,
            size: 'Small',
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
                { type: 'TextBlock', text: `🎉 Willkommen zurück, ${details.employeeName}!`, weight: 'Bolder', size: 'Large', color: 'Light' },
                { type: 'TextBlock', text: `Zusammenfassung von ${details.substituteName}`, isSubtle: true, spacing: 'None', color: 'Light' },
            ],
        },
        {
            type: 'TextBlock',
            text: 'Ihre Vertretung hat folgende Zusammenfassung hinterlassen:',
            wrap: true,
            spacing: 'Medium',
        },
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