export const PERMISSIONS = {
  'absences.create': 'Abwesenheiten erstellen',
  'absences.read.own': 'Eigene Abwesenheiten sehen',
  'absences.read.team': 'Team-Abwesenheiten sehen',
  'absences.read.all': 'Alle Abwesenheiten sehen',
  'absences.approve': 'Abwesenheiten genehmigen',
  'users.read': 'Benutzer anzeigen',
  'users.write': 'Benutzer bearbeiten',
  'users.vacation.write': 'Urlaubstage ändern',
  'departments.read': 'Abteilungen anzeigen',
  'departments.write': 'Abteilungen verwalten',
  'settings.read': 'Einstellungen anzeigen',
  'settings.write': 'Einstellungen ändern',
  'sync.trigger': 'Synchronisation auslösen',
  'audit.read': 'Audit Logs lesen',
  'analytics.read': 'Analytics sehen',
  'reports.export': 'Reports exportieren',
  'integrations.manage': 'Integrationen verwalten',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  employee: [
    'absences.create', 
    'absences.read.own',
  ],
  teamlead: [
    'absences.create', 
    'absences.read.own', 
    'absences.read.team',
    'departments.read',
  ],
  manager: [
    'absences.create', 
    'absences.read.own', 
    'absences.read.team',
    'absences.approve', 
    'users.read', 
    'analytics.read',
    'departments.read',
  ],
  hr_manager: [
    'absences.create', 
    'absences.read.own', 
    'absences.read.team',
    'absences.read.all',
    'absences.approve',
    'users.read', 
    'users.write',
    'users.vacation.write',
    'departments.read',
    'departments.write',
    'analytics.read',
    'reports.export',
  ],
  admin: Object.keys(PERMISSIONS) as Permission[],
};

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  employee: 'Mitarbeiter',
  teamlead: 'Team Lead',
  manager: 'Manager',
  hr_manager: 'HR-Manager',
  admin: 'Administrator',
};

export const SYSTEM_ROLES = ['employee', 'manager', 'admin'] as const;
export const ALL_ROLES = ['employee', 'teamlead', 'manager', 'hr_manager', 'admin'] as const;
