/**
 * Schulferien nach Bundesland (Kalenderjahre 2026 / 2027).
 * Quellen u.a. KMK-Ferienkalender und Landesministerien — Termine ggf. gegen amtliche Veröffentlichung prüfen.
 * Unsichere Einträge sind mit TODO markiert.
 */

import type { GermanState } from '@/lib/utils/holidays';

export interface Schulferien {
  name: string;
  startDate: string;
  endDate: string;
}

function sf(name: string, startDate: string, endDate: string): Schulferien {
  return { name, startDate, endDate };
}

/** Gemeinsame Struktur: Winterferien (falls vorhanden), Oster-, Pfingst-, Sommer-, Herbst-, Weihnachtsferien */
const SCHULFERIEN_2026: Record<GermanState, Schulferien[]> = {
  // TODO: Einzeltermin gegen Schulministerium BW verifizieren
  BW: [
    sf('Winterferien', '2026-02-10', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-30', '2026-09-12'),
    sf('Herbstferien', '2026-10-26', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-09'),
  ],
  BY: [
    sf('Winterferien', '2026-02-16', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-11'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-30', '2026-09-14'),
    sf('Herbstferien', '2026-11-02', '2026-11-07'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-05'),
  ],
  // TODO: BE Ferien exakt verifizieren
  BE: [
    sf('Winterferien', '2026-02-02', '2026-02-07'),
    sf('Osterferien', '2026-03-23', '2026-04-02'),
    sf('Pfingstferien', '2026-05-15', '2026-05-26'),
    sf('Sommerferien', '2026-07-23', '2026-09-04'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-02'),
  ],
  BB: [
    sf('Winterferien', '2026-02-02', '2026-02-14'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-09', '2026-08-22'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-02'),
  ],
  HB: [
    sf('Winterferien', '2026-02-05', '2026-02-07'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-16', '2026-08-28'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-06'),
  ],
  HH: [
    sf('Winterferien', '2026-01-30', '2026-01-31'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-16', '2026-08-28'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-21', '2027-01-01'),
  ],
  HE: [
    sf('Winterferien', '2026-02-02', '2026-02-14'),
    sf('Osterferien', '2026-03-30', '2026-04-11'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-02', '2026-08-14'),
    sf('Herbstferien', '2026-10-05', '2026-10-17'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-12'),
  ],
  MV: [
    sf('Winterferien', '2026-02-02', '2026-02-14'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-13', '2026-08-22'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-21', '2027-01-02'),
  ],
  NI: [
    sf('Winterferien', '2026-02-02', '2026-02-14'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-16', '2026-08-28'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-06'),
  ],
  NW: [
    sf('Winterferien', '2026-02-09', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-09', '2026-08-21'),
    sf('Herbstferien', '2026-10-12', '2026-10-24'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-06'),
  ],
  RP: [
    sf('Winterferien', '2026-02-16', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-27', '2026-09-06'),
    sf('Herbstferien', '2026-10-12', '2026-10-24'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-06'),
  ],
  SL: [
    sf('Winterferien', '2026-02-16', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-17', '2026-08-15'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-02'),
  ],
  SN: [
    sf('Winterferien', '2026-02-09', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-04', '2026-08-16'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-02'),
  ],
  ST: [
    sf('Winterferien', '2026-02-02', '2026-02-13'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-08', '2026-08-15'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-21', '2027-01-02'),
  ],
  SH: [
    sf('Winterferien', '2026-02-09', '2026-02-20'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-16', '2026-08-28'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-21', '2027-01-06'),
  ],
  TH: [
    sf('Winterferien', '2026-02-02', '2026-02-14'),
    sf('Osterferien', '2026-03-30', '2026-04-10'),
    sf('Pfingstferien', '2026-05-26', '2026-06-06'),
    sf('Sommerferien', '2026-07-20', '2026-08-29'),
    sf('Herbstferien', '2026-10-19', '2026-10-30'),
    sf('Weihnachtsferien', '2026-12-23', '2027-01-02'),
  ],
};

const SCHULFERIEN_2027: Record<GermanState, Schulferien[]> = {
  // TODO: BW 2027 exakt verifizieren
  BW: [
    sf('Winterferien', '2027-02-15', '2027-02-25'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-29', '2027-09-11'),
    sf('Herbstferien', '2027-11-01', '2027-11-05'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-08'),
  ],
  BY: [
    sf('Winterferien', '2027-02-15', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-08-02', '2027-09-13'),
    sf('Herbstferien', '2027-11-01', '2027-11-06'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  BE: [
    sf('Winterferien', '2027-02-01', '2027-02-06'),
    sf('Osterferien', '2027-04-05', '2027-04-15'),
    sf('Pfingstferien', '2027-06-05', '2027-06-15'),
    sf('Sommerferien', '2027-07-22', '2027-09-03'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  BB: [
    sf('Winterferien', '2027-02-01', '2027-02-13'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-08', '2027-08-21'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  HB: [
    sf('Winterferien', '2027-02-05', '2027-02-07'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-15', '2027-08-27'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  HH: [
    sf('Winterferien', '2027-01-29', '2027-01-30'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-15', '2027-08-27'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-01'),
  ],
  HE: [
    sf('Winterferien', '2027-02-01', '2027-02-13'),
    sf('Osterferien', '2027-04-05', '2027-04-17'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-01', '2027-08-13'),
    sf('Herbstferien', '2027-10-04', '2027-10-16'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-12'),
  ],
  MV: [
    sf('Winterferien', '2027-02-01', '2027-02-13'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-12', '2027-08-21'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  NI: [
    sf('Winterferien', '2027-02-01', '2027-02-13'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-15', '2027-08-27'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  NW: [
    sf('Winterferien', '2027-02-08', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-08', '2027-08-20'),
    sf('Herbstferien', '2027-10-11', '2027-10-23'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  RP: [
    sf('Winterferien', '2027-02-15', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-26', '2027-09-05'),
    sf('Herbstferien', '2027-10-11', '2027-10-23'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  SL: [
    sf('Winterferien', '2027-02-15', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-16', '2027-08-14'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  SN: [
    sf('Winterferien', '2027-02-08', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-03', '2027-08-15'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  ST: [
    sf('Winterferien', '2027-02-01', '2027-02-12'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-07', '2027-08-14'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
  SH: [
    sf('Winterferien', '2027-02-08', '2027-02-19'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-15', '2027-08-27'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-07'),
  ],
  TH: [
    sf('Winterferien', '2027-02-01', '2027-02-13'),
    sf('Osterferien', '2027-04-05', '2027-04-16'),
    sf('Pfingstferien', '2027-06-05', '2027-06-16'),
    sf('Sommerferien', '2027-07-19', '2027-08-28'),
    sf('Herbstferien', '2027-10-18', '2027-10-29'),
    sf('Weihnachtsferien', '2027-12-23', '2028-01-03'),
  ],
};

const BY_YEAR: Record<number, Record<GermanState, Schulferien[]>> = {
  2026: SCHULFERIEN_2026,
  2027: SCHULFERIEN_2027,
};

export function getSchulferien(year: number, state: GermanState): Schulferien[] {
  const table = BY_YEAR[year];
  if (!table) return [];
  return table[state] ?? [];
}
