import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-prod';

export interface ActionTokenPayload {
    absenceId: string;
    action: 'approve' | 'reject' | 'acknowledge' | 'mark_done' | 'add_note' | 'return_summary';
    approverId: string; // Legacy — kept for backwards compat
    actorId?: string;   // Preferred — the user performing the action
    itemId?: string;    // For mark_done action — the handover item ID
    expiresAt: number;
}

/**
 * Generate a secure signed token for an action
 */
export function generateActionToken(payload: Omit<ActionTokenPayload, 'expiresAt'>): string {
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days expiration
    const fullPayload: ActionTokenPayload = { ...payload, expiresAt };

    const data = JSON.stringify(fullPayload);
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(data)
        .digest('hex');

    // Token = base64(data) + '.' + signature
    const encodedData = Buffer.from(data).toString('base64url');
    return `${encodedData}.${signature}`;
}

/**
 * Verify and decode an action token
 */
export function verifyActionToken(token: string): ActionTokenPayload | null {
    try {
        const [encodedData, signature] = token.split('.');
        if (!encodedData || !signature) return null;

        const data = Buffer.from(encodedData, 'base64url').toString();

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(data)
            .digest('hex');

        // Constant time comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );

        if (!isValid) return null;

        const payload = JSON.parse(data) as ActionTokenPayload;

        if (Date.now() > payload.expiresAt) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
