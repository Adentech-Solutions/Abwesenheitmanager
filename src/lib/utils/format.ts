export function formatAbsenceType(type: string): string {
  const types: Record<string, string> = {
    vacation: 'Urlaub',
    sick: 'Krankheit',
    training: 'Fortbildung',
    parental: 'Elternzeit',
  };
  return types[type] || type;
}

export function formatAbsenceStatus(status: string): string {
  const statuses: Record<string, string> = {
    pending: 'Ausstehend',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
    cancelled: 'Storniert',
  };
  return statuses[status] || status;
}

export function formatUserRole(role: string): string {
  const roles: Record<string, string> = {
    employee: 'Mitarbeiter',
    manager: 'Vorgesetzter',
    admin: 'Administrator',
  };
  return roles[role] || role;
}

export function formatDays(days: number): string {
  return days === 1 ? '1 Tag' : `${days} Tage`;
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}