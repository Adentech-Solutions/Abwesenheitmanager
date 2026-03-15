export interface IDepartment {
    _id: string;
    name: string;
    entraGroupId?: string;
    bundesland: 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' | 'HE' | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' | 'SN' | 'ST' | 'SH' | 'TH';
    managerId?: string;
    managerName?: string;
    personioId?: number;
    syncSource: 'manual' | 'entra' | 'personio' | 'scim';
    memberCount: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
