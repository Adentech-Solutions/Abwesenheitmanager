import { IAbsence } from '@/types/absence';
import { startOfDay, endOfDay } from 'date-fns';

export interface ConflictCheck {
  hasConflict: boolean;
  concurrentAbsences: number;
  maxAllowed: number;
  conflictingUsers: string[];
  conflictingAbsences: IAbsence[];
}

export async function checkAbsenceConflicts(
  startDate: Date,
  endDate: Date,
  teamAbsences: IAbsence[],
  maxConcurrentAbsences: number = 3,
  excludeUserId?: string
): Promise<ConflictCheck> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Filter overlapping absences
  const overlappingAbsences = teamAbsences.filter((absence) => {
    if (absence.status !== 'approved' && absence.status !== 'pending') {
      return false;
    }
    if (excludeUserId && absence.userId === excludeUserId) {
      return false;
    }

    const absenceStart = startOfDay(new Date(absence.startDate));
    const absenceEnd = endOfDay(new Date(absence.endDate));

    return (
      (absenceStart >= start && absenceStart <= end) ||
      (absenceEnd >= start && absenceEnd <= end) ||
      (absenceStart <= start && absenceEnd >= end)
    );
  });

  const concurrentCount = overlappingAbsences.length + 1; // +1 for the new absence
  const hasConflict = concurrentCount > maxConcurrentAbsences;

  return {
    hasConflict,
    concurrentAbsences: concurrentCount,
    maxAllowed: maxConcurrentAbsences,
    conflictingUsers: overlappingAbsences.map((a) => a.userName),
    conflictingAbsences: overlappingAbsences,
  };
}

export function getConflictWarningMessage(conflict: ConflictCheck): string {
  if (!conflict.hasConflict) return '';

  return `⚠️ Warnung: ${conflict.concurrentAbsences} Mitarbeiter sind gleichzeitig abwesend (Maximum: ${conflict.maxAllowed}). Betroffene: ${conflict.conflictingUsers.join(', ')}`;
}
