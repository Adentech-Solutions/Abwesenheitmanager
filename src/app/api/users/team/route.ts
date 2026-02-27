// src/app/api/users/team/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/rbac';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import graphClient from '@/lib/graph-client';

export async function GET(request: NextRequest) {
    try {
        const { user, dbUser } = await requireRole(['employee', 'manager', 'admin']);

        await connectDB();

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('q');

        // ─────────────────────────────────────────
        // 1. DB Suche
        // ─────────────────────────────────────────
        const query: any = {
            isActive: true,
            email: { $ne: dbUser.email },
        };

        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
            ];
        } else {
            const orConditions: any[] = [];
            if (dbUser.department) orConditions.push({ department: dbUser.department });
            if (dbUser.managerId) orConditions.push({ managerId: dbUser.managerId });
            if (dbUser.role === 'manager') orConditions.push({ managerId: dbUser.entraId });
            if (dbUser.role !== 'admin' && orConditions.length > 0) query.$or = orConditions;
        }

        const dbMembers = await User.find(query)
            .select('entraId email name department jobTitle')
            .sort({ name: 1 })
            .limit(100);

        const formatted = dbMembers.map((m) => ({
            userId: m.entraId,
            email: m.email,
            name: m.name,
            department: m.department || undefined,
            jobTitle: m.jobTitle || undefined,
            source: 'db',
        }));

        // ─────────────────────────────────────────
        // 2. Graph API Fallback — nur bei Suchanfrage und wenn DB leer
        // ─────────────────────────────────────────
        if (searchQuery && searchQuery.trim().length >= 2 && formatted.length === 0) {
            console.log('🔍 No DB results, trying Graph API for:', searchQuery);

            try {
                // Suche in Microsoft 365 Users
                const graphResults = await graphClient
                    .api('/users')
                    .filter(
                        `startsWith(displayName,'${searchQuery}') or startsWith(mail,'${searchQuery}') or startsWith(userPrincipalName,'${searchQuery}')`
                    )
                    .select('id,displayName,mail,userPrincipalName,jobTitle,department')
                    .top(10)
                    .get();

                const graphUsers = graphResults.value || [];

                const graphFormatted = graphUsers
                    .filter((u: any) => {
                        const email = u.mail || u.userPrincipalName || '';
                        return email.toLowerCase() !== dbUser.email.toLowerCase();
                    })
                    .map((u: any) => ({
                        userId: u.id,
                        email: u.mail || u.userPrincipalName || '',
                        name: u.displayName || u.mail || '',
                        department: u.department || undefined,
                        jobTitle: u.jobTitle || undefined,
                        source: 'graph', // Markierung dass User nicht in DB ist
                    }));

                console.log(`✅ Graph API found ${graphFormatted.length} users for query: ${searchQuery}`);

                return NextResponse.json({ members: graphFormatted });
            } catch (graphError: any) {
                console.error('❌ Graph API fallback failed:', graphError.message);
                // Kein Fehler werfen — einfach leeres Ergebnis zurückgeben
                return NextResponse.json({ members: [] });
            }
        }

        return NextResponse.json({ members: formatted });

    } catch (error: any) {
        console.error('Error fetching team members:', error);
        if (error.message === 'Unauthorized' || error.message.startsWith('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}