'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Heart,
  Plane,
  Users,
  ArrowLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getGermanHolidays, type GermanState } from '@/lib/utils/holidays';
import { parseLocalDate } from '@/lib/utils/localDate';
import type { PlannerCriteria, YearPlan, PlannedDay } from '@/lib/services/yearPlanner';

const PRIORITY_OPTIONS = [
  {
    id: 'family',
    label: 'Zeit mit Familie',
    hint: 'Schulferien, gemeinsame Wochen',
    icon: Users,
  },
  {
    id: 'maxDays',
    label: 'Maximale freie Tage',
    hint: 'Brückentage & Feiertage clever nutzen',
    icon: Calendar,
  },
  {
    id: 'recovery',
    label: 'Regelmäßige Erholung',
    hint: 'Nie zu lange ohne Pause',
    icon: Heart,
  },
  {
    id: 'longVacation',
    label: 'Langer Haupturlaub',
    hint: '2–3 Wochen am Stück',
    icon: Plane,
  },
] as const;

const SEASONS = [
  { id: 'oster', label: 'Ostern', months: [2, 3] },
  { id: 'pfingst', label: 'Pfingsten', months: [4, 5] },
  { id: 'sommer', label: 'Sommer', months: [5, 6, 7, 8] },
  { id: 'herbst', label: 'Herbst', months: [9, 10] },
  { id: 'weihnacht', label: 'Winter', months: [11] },
] as const;

const MONTHS_OPTIONS = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

const STRATEGY_LABELS: Record<string, string> = {
  christmas: 'Weihnachten/Neujahr frei',
  longWeekends: 'Verlängerte Wochenenden (Fr/Mo frei)',
  recoveryGaps: 'Erholungslücken füllen (max. 8 Wo. ohne Pause)',
  schoolHolidays: 'Schulferien-Wochen (bei Familie)',
};

function buildCriteria(
  priorities: string[],
  selectedMonths: number[],
  mainDays: number,
  strategyOrder: string[]
): PlannerCriteria {
  const considerSchoolHolidays = priorities.includes('family');
  const takeBridgeDays = priorities.includes('maxDays');

  const mainVacation =
    selectedMonths.length === 0
      ? null
      : { months: selectedMonths, days: mainDays };

  return {
    priorities,
    mainVacation,
    remainingStrategy: strategyOrder,
    takeBridgeDays,
    considerSchoolHolidays,
  };
}

function monthHolidayCount(year: number, month: number, state: GermanState): number {
  return getGermanHolidays(year, state).filter((h) => h.date.getMonth() === month).length;
}

function dayStyle(d: PlannedDay): string {
  switch (d.type) {
    case 'urlaub':
      return 'bg-primary-600 text-white';
    case 'feiertag':
      return 'bg-primary-100 text-primary-800';
    case 'schulferien':
      return 'bg-success-100 text-success-800';
    case 'wochenende':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-white text-gray-800 border border-gray-100';
  }
}

export default function YearPlannerPage() {
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();

  const [step, setStep] = useState(1);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([5, 6, 7, 8]); // Default summer
  const [mainDays, setMainDays] = useState(10);
  const [strategyOrder, setStrategyOrder] = useState<string[]>([
    'christmas',
    'longWeekends',
    'recoveryGaps',
    'schoolHolidays',
  ]);
  const [criteria, setCriteria] = useState<PlannerCriteria | null>(null);
  const [showResult, setShowResult] = useState(false);

  const { data: bootstrap } = useQuery({
    queryKey: ['absences', 'planner-bootstrap', year],
    queryFn: async () => {
      const c = encodeURIComponent(
        JSON.stringify({
          priorities: [],
          mainVacation: null,
          remainingStrategy: ['christmas'],
          takeBridgeDays: false,
          considerSchoolHolidays: false,
        })
      );
      const res = await fetch(`/api/absences/planner?year=${year}&criteria=${c}`);
      if (!res.ok) throw new Error('Bootstrap fehlgeschlagen');
      return res.json() as Promise<{
        state: GermanState;
        remainingDays: number;
      }>;
    },
    staleTime: 60_000,
  });

  const criteriaKey = criteria ? JSON.stringify(criteria) : '';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['absences', 'planner', year, criteriaKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('year', String(year));
      if (criteria) params.set('criteria', JSON.stringify(criteria));
      const res = await fetch(`/api/absences/planner?${params.toString()}`);
      if (!res.ok) throw new Error('Plan konnte nicht geladen werden');
      return res.json() as Promise<{
        year: number;
        state: GermanState;
        remainingDays: number;
        plan: YearPlan;
      }>;
    },
    enabled: showResult && criteria !== null,
  });

  const plan = data?.plan;
  const state = data?.state ?? bootstrap?.state ?? 'BY';



  const moveStrategy = (index: number, dir: -1 | 1) => {
    setStrategyOrder((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const togglePriority = (id: string) => {
    setPriorities((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const remainingAfterMain = useMemo(() => {
    const total = data?.remainingDays ?? bootstrap?.remainingDays ?? 30;
    const bridges = priorities.includes('maxDays') ? 5 : 0;
    const main = selectedMonths.length === 0 ? 0 : mainDays;
    return Math.max(0, total - bridges - main);
  }, [data?.remainingDays, bootstrap?.remainingDays, priorities, selectedMonths, mainDays]);

  const handleGenerate = useCallback(() => {
    const c = buildCriteria(priorities, selectedMonths, mainDays, strategyOrder);
    setCriteria(c);
    setShowResult(true);
    try {
      localStorage.setItem(`freyetag-planner-criteria-${year}`, JSON.stringify(c));
      localStorage.setItem(`freyetag-planner-has-plan-${year}`, '1');
    } catch {
      /* ignore */
    }
  }, [priorities, selectedMonths, mainDays, strategyOrder, year]);

  const applyMutation = useMutation({
    mutationFn: async (p: YearPlan) => {
      const res = await fetch('/api/absences/planner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: p }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Anträge konnten nicht erstellt werden');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Anträge wurden eingereicht');
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      queryClient.invalidateQueries({ queryKey: ['absences', 'stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const daysByMonth = useMemo(() => {
    if (!plan?.days) return Array.from({ length: 12 }, () => [] as PlannedDay[]);
    const arr: PlannedDay[][] = Array.from({ length: 12 }, () => []);
    for (const d of plan.days) {
      const m = parseLocalDate(d.date).getMonth();
      arr[m].push(d);
    }
    return arr;
  }, [plan]);

  const resetWizard = () => {
    setShowResult(false);
    setCriteria(null);
    setStep(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild className="transition-all hover:shadow-md">
            <Link href="/absences">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary-600" />
              Jahresplaner
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Plane deine Urlaubstage für {year} — in drei Schritten
            </p>
          </div>
        </div>

        {!showResult && (
          <>
            {step === 1 && (
              <Card hover={false} className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Was ist dir bei deinem Urlaub am wichtigsten?
                  </CardTitle>
                  <p className="text-sm text-gray-500">Mehrfachauswahl möglich</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {PRIORITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = priorities.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => togglePriority(opt.id)}
                          className={cn(
                            'text-left rounded-xl border p-4 transition-all hover:shadow-md',
                            active
                              ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-200'
                              : 'border-gray-200 bg-white'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-gray-900">{opt.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{opt.hint}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end mt-8">
                    <Button
                      className="transition-all hover:shadow-md"
                      onClick={() => setStep(2)}
                    >
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card hover={false} className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Wann soll dein größter Urlaub sein?</CardTitle>
                  <p className="text-sm text-gray-500">
                    Wähle einen oder mehrere Monate als Wunschzeitraum aus
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Schnellauswahl
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SEASONS.map((s) => (
                        <Button
                          key={s.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            'transition-all hover:shadow-md',
                            JSON.stringify(s.months) === JSON.stringify(selectedMonths) &&
                              'bg-primary-50 border-primary-200 text-primary-700'
                          )}
                          onClick={() => setSelectedMonths([...s.months])}
                        >
                          {s.label}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          'transition-all hover:shadow-md',
                          selectedMonths.length === 0 &&
                            'bg-primary-50 border-primary-200 text-primary-700'
                        )}
                        onClick={() => setSelectedMonths([])}
                      >
                        Egal
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Monate einzeln steuern
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {MONTHS_OPTIONS.map((name, index) => {
                        const active = selectedMonths.includes(index);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              setSelectedMonths((prev) =>
                                prev.includes(index)
                                  ? prev.filter((m) => m !== index)
                                  : [...prev, index].sort((a, b) => a - b)
                              )
                            }
                            className={cn(
                              'px-3 py-2 text-sm rounded-lg border transition-all text-center',
                              active
                                ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'
                            )}
                          >
                            {name.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Länge des Haupturlaubs</span>
                      <Badge variant="secondary" className="px-2 py-1">
                        {mainDays} Arbeitstage am Stück
                      </Badge>
                    </div>
                    <Slider
                      min={3}
                      max={21}
                      step={1}
                      value={[mainDays]}
                      onValueChange={(v) => setMainDays(v[0] ?? 10)}
                      className="w-full"
                    />
                    <p className="text-[11px] text-gray-400">
                      Tipp: 5 Tage entsprechen ca. 1 Woche, 10 Tage ca. 2 Wochen inkl. Wochenenden.
                    </p>
                  </div>

                  <div className="text-sm text-gray-600 bg-primary-50/50 rounded-xl p-4 border border-primary-100/50 flex gap-3 items-start">
                    <div className="p-2 bg-white rounded-lg border border-primary-100 shadow-sm shrink-0">
                      <Calendar className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      {selectedMonths.length === 0 ? (
                        <p>
                          <strong>Kein fester Zeitraum:</strong> Der Planer verteilt deine Tage nach
                          maximaler Effizienz über das ganze Jahr.
                        </p>
                      ) : (
                        <p>
                          <strong>Deine Auswahl:</strong> Der Haupturlaub wird bevorzugt in
                          {selectedMonths.length === 1 ? ' den ' : ' einen der '} Monate{' '}
                          {selectedMonths
                            .map((m) => MONTHS_OPTIONS[m])
                            .join(', ')
                            .replace(/, ([^,]*)$/, ' oder $1')}{' '}
                          gelegt.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="hover:shadow-md"
                    >
                      Zurück
                    </Button>
                    <Button onClick={() => setStep(3)} className="hover:shadow-md">
                      Weiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card hover={false} className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Was soll mit den restlichen Tagen passieren?</CardTitle>
                  <p className="text-sm text-gray-500">
                    Du hast noch ca.{' '}
                    <span className="font-semibold text-gray-900">{remainingAfterMain}</span> Tage nach
                    Haupturlaub und Brückentagen (Schätzung)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
                    Reihenfolge (oben = höchste Priorität)
                  </p>
                  <ul className="space-y-2">
                    {strategyOrder.map((key, i) => (
                      <li
                        key={key}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-50 disabled:opacity-30"
                            disabled={i === 0}
                            onClick={() => moveStrategy(i, -1)}
                            aria-label="Nach oben"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-gray-50 disabled:opacity-30"
                            disabled={i === strategyOrder.length - 1}
                            onClick={() => moveStrategy(i, 1)}
                            aria-label="Nach unten"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="text-sm text-gray-800 flex-1">
                          {STRATEGY_LABELS[key] ?? key}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(2)} className="hover:shadow-md">
                      Zurück
                    </Button>
                    <Button
                      onClick={() => {
                        handleGenerate();
                      }}
                      className="hover:shadow-md"
                    >
                      Plan anzeigen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {showResult && (
          <>
            {isLoading || isFetching ? (
              <div className="space-y-6 animate-pulse">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : plan ? (
              <>
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Kalender {year}</h2>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {daysByMonth.map((monthDays, mi) => (
                        <MonthGrid
                          key={mi}
                          year={year}
                          month={mi}
                          days={monthDays}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-xl bg-gray-900 text-gray-50 p-6 space-y-4 shadow-lg">
                      <h3 className="font-semibold text-white">Zusammenfassung</h3>
                      <ul className="text-sm space-y-2 text-gray-200">
                        <li>
                          <span className="text-primary-300">{plan.urlaubstageGeplant}</span> Urlaubstage
                          im Kalender
                        </li>
                        <li>
                          <span className="text-primary-300">{plan.feiertage}</span> Feiertage
                        </li>
                        <li>
                          <span className="text-primary-300">{plan.freieTagGesamt}</span> freie Tage
                          gesamt (inkl. Wochenenden)
                        </li>
                        <li className="pt-2 border-t border-gray-700">
                          Noch <span className="text-warning-300">{plan.urlaubstageUebrig}</span> Urlaubstage
                          laut Plan verfügbar
                        </li>
                      </ul>
                      <div className="flex flex-wrap gap-2 text-xs pt-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-primary-600" /> Urlaub
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-primary-100" /> Feiertag
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-success-100" /> Schulferien
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-gray-100" /> Wochenende
                        </span>
                      </div>
                    </div>
                    <Card hover={false} className="hover:shadow-md transition-all">
                      <CardHeader>
                        <CardTitle className="text-base">Geplante Blöcke</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {plan.blocks.length === 0 ? (
                          <p className="text-sm text-gray-500">Keine zusammenhängenden Blöcke</p>
                        ) : (
                          plan.blocks.map((b, i) => (
                            <p key={i} className="text-sm text-gray-700">
                              {format(parseLocalDate(b.startDate), 'd. MMM', { locale: de })} –{' '}
                              {format(parseLocalDate(b.endDate), 'd. MMM', { locale: de })}: {b.reason} (
                              {b.urlaubstage} Urlaubstage)
                            </p>
                          ))
                        )}
                      </CardContent>
                    </Card>
                    <div className="flex flex-col gap-3">
                      <Button
                        className="w-full bg-success-600 hover:bg-success-700 transition-all hover:shadow-md"
                        disabled={applyMutation.isPending}
                        onClick={() => applyMutation.mutate(plan)}
                      >
                        Plan übernehmen — alle Anträge erstellen
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full hover:shadow-md"
                        onClick={() => {
                          resetWizard();
                        }}
                      >
                        Plan anpassen
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Keine Daten</p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function MonthGrid({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: PlannedDay[];
}) {
  const byDate = useMemo(() => {
    const m = new Map<string, PlannedDay>();
    for (const d of days) m.set(d.date, d);
    return m;
  }, [days]);

  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (monthStart.getDay() + 6) % 7;
  const title = format(monthStart, 'MMMM', { locale: de });

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      <p className="text-sm font-semibold text-gray-900 capitalize mb-2">{title}</p>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center text-gray-400 mb-1">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dayNum, i) => {
          if (dayNum === null) {
            return <div key={`pad-${i}`} className="aspect-square rounded-sm" />;
          }
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const pd = byDate.get(iso);
          return (
            <div
              key={iso}
              title={pd?.reason || iso}
              className={cn(
                'aspect-square rounded-sm text-[10px] flex items-center justify-center',
                pd ? dayStyle(pd) : 'bg-gray-50 text-gray-300'
              )}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}
