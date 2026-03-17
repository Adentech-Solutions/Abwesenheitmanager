import axios from 'axios';
import IntegrationConfig from '@/models/IntegrationConfig';

interface PersonioEmployee {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    department: string | null;
    hire_date: string | null;
    vacation_day_balance: number;
    absence_entitlement: number;
    holiday_calendar: string | null;
}

interface PersonioAbsenceBalance {
    id: number;
    name: string;
    category: string;
    balance: number;
}

interface PersonioAbsenceType {
    id: number;
    name: string;
    unit: string;
    category: string;
}

interface CreateAbsencePayload {
    employee_id: number;
    absence_type_id: number;
    start_date: string;
    end_date: string;
    half_day_start?: boolean;
    half_day_end?: boolean;
    comment?: string;
    skip_approval: boolean;
}

const PERSONIO_API_V1 = 'https://api.personio.de/v1';
const PERSONIO_API_V2 = 'https://api.personio.de/v2';

let cachedToken: string | null = null;
let cachedAbsenceTypes: PersonioAbsenceType[] | null = null;

/**
 * Helper to fetch credentials either from DB or env variables.
 */
async function getCredentials(customClientId?: string, customClientSecret?: string) {
    if (customClientId && customClientSecret) {
        return { clientId: customClientId, clientSecret: customClientSecret };
    }

    const config = await IntegrationConfig.getDecryptedSecret('personio');
    if (config && config.clientId && config.clientSecret) {
        return config;
    }

    if (process.env.PERSONIO_CLIENT_ID && process.env.PERSONIO_CLIENT_SECRET) {
        return {
            clientId: process.env.PERSONIO_CLIENT_ID,
            clientSecret: process.env.PERSONIO_CLIENT_SECRET
        };
    }

    throw new Error('Personio not configured. Missing Client ID or Secret.');
}

/**
 * Authenticates with Personio API to retrieve a Bearer token.
 */
export async function authenticate(customClientId?: string, customClientSecret?: string): Promise<string> {
    const { clientId, clientSecret } = await getCredentials(customClientId, customClientSecret);

    try {
        const response = await axios.post(
            `${PERSONIO_API_V2}/auth/token`,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
            }
        );

        cachedToken = response.data.data.token;
        return cachedToken as string;
    } catch (error: any) {
        if (error.response?.status === 429) {
            throw new Error(`Personio Rate Limit Exceeded. Retry-After: ${error.response.headers['retry-after']}`);
        }
        throw new Error(`Personio Authentication Failed: ${error.response?.data?.error?.message || error.message}`);
    }
}

/**
 * Creates an Axios instance with interceptors to automatically handling tokens and retries.
 */
function createApiClient(customClientId?: string, customClientSecret?: string) {
    const client = axios.create({
        headers: {
            Accept: 'application/json',
            'X-Personio-App-ID': 'absence-manager',
        },
    });

    client.interceptors.request.use(async (config) => {
        if (!cachedToken) {
            await authenticate(customClientId, customClientSecret);
        }
        config.headers.Authorization = `Bearer ${cachedToken}`;
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // Retry on 401
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;
                await authenticate(customClientId, customClientSecret);
                originalRequest.headers.Authorization = `Bearer ${cachedToken}`;
                return client(originalRequest);
            }

            // Throw rate limits with retry-after context
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'];
                throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
            }

            return Promise.reject(error);
        }
    );

    return client;
}

export async function getEmployees(): Promise<PersonioEmployee[]> {
    const api = createApiClient();
    const employees: PersonioEmployee[] = [];
    let offset = 0;
    const limit = 200;
    let hasMore = true;

    try {
        while (hasMore) {
            const response = await api.get(`${PERSONIO_API_V1}/company/employees`, {
                params: { offset, limit }
            });

            const data = response.data.data;
            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            for (const item of data) {
                const attrs = item.attributes;
                employees.push({
                    id: attrs.id?.value,
                    first_name: attrs.first_name?.value,
                    last_name: attrs.last_name?.value,
                    email: attrs.email?.value,
                    department: attrs.department?.value?.attributes?.name || null,
                    hire_date: attrs.hire_date?.value,
                    vacation_day_balance: attrs.vacation_day_balance?.value || 0,
                    absence_entitlement: attrs.absence_entitlement?.value || { value: 0 }, // May vary by setup, simplifying
                    holiday_calendar: attrs.holiday_calendar?.value?.attributes?.name || null,
                });
            }

            offset += limit;
            hasMore = offset < response.data.metadata.total_elements;
        }

        return employees;
    } catch (error: any) {
        throw new Error(`Failed to fetch Personio employees: ${error.message}`);
    }
}

export async function getEmployeeById(personioId: number): Promise<any> {
    const api = createApiClient();
    try {
        const response = await api.get(`${PERSONIO_API_V1}/company/employees/${personioId}`);
        return response.data.data.attributes;
    } catch (error: any) {
        throw new Error(`Failed to fetch Personio employee ${personioId}: ${error.message}`);
    }
}

export async function getAbsenceBalance(personioId: number): Promise<PersonioAbsenceBalance[]> {
    const api = createApiClient();
    try {
        // Must use V1 for absence balances
        const response = await api.get(`${PERSONIO_API_V1}/company/employees/${personioId}/absences/balance`);
        const balances = response.data.data;
        return balances.map((b: any) => ({
            id: b.attributes.id,
            name: b.attributes.name,
            category: b.attributes.category,
            balance: b.attributes.balance,
        }));
    } catch (error: any) {
        throw new Error(`Failed to fetch absence balances for employee ${personioId}: ${error.message}`);
    }
}

export async function getAbsenceTypes(): Promise<PersonioAbsenceType[]> {
    if (cachedAbsenceTypes) return cachedAbsenceTypes;

    const api = createApiClient();
    try {
        const response = await api.get(`${PERSONIO_API_V2}/absence-types`);
        const types = response.data.data.map((t: any) => ({
            id: t.id,
            name: t.attributes.name,
            unit: t.attributes.unit,
            category: t.attributes.category,
        }));
        cachedAbsenceTypes = types;
        return types;
    } catch (error: any) {
        throw new Error(`Failed to fetch Personio absence types: ${error.message}`);
    }
}

export async function createAbsencePeriod(data: CreateAbsencePayload): Promise<any> {
    const api = createApiClient();
    try {
        // Personio requires dates to be exactly YYYY-MM-DD strings
        const response = await api.post(`${PERSONIO_API_V2}/absence-periods`, {
            employee_id: data.employee_id,
            absence_type_id: data.absence_type_id,
            start_date: data.start_date,
            end_date: data.end_date,
            half_day_start: data.half_day_start || false,
            half_day_end: data.half_day_end || false,
            comment: data.comment || '',
            skip_approval: true, // As requested, always true
        });

        return response.data.data;
    } catch (error: any) {
        throw new Error(`Failed to create absence period in Personio: ${error.response?.data?.error?.message || error.message}`);
    }
}

export async function deleteAbsencePeriod(personioAbsenceId: string): Promise<{ success: boolean; error?: string }> {
    const api = createApiClient();
    try {
        await api.delete(`${PERSONIO_API_V2}/absence-periods/${personioAbsenceId}`);
        return { success: true };
    } catch (error: any) {
        if (error.response?.status === 404) {
            // Treat as success if already deleted
            return { success: true };
        }
        return { success: false, error: error.message };
    }
}

export async function testConnection(clientId?: string, clientSecret?: string) {
    try {
        // We initialize the API explicitly setting custom credentials if provided (so it doesn't fail accessing Env or DB)
        const api = createApiClient(clientId, clientSecret);
        
        // Ensure authentication works
        await authenticate(clientId, clientSecret);

        // Fetch absence types
        const types = await api.get(`${PERSONIO_API_V2}/absence-types`);
        
        // Check Employee Read access
        const employeesReq = await api.get(`${PERSONIO_API_V1}/company/employees`, { params: { limit: 1 } });
        
        return {
            success: true,
            employeeCount: employeesReq.data.metadata?.total_elements || 0,
            absenceTypeCount: types.data?.data?.length || 0,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
