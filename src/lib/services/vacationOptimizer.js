"use strict";
// src/lib/services/vacationOptimizer.ts
// Smart vacation suggestion engine (Brückentag-Optimizer)
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVacationSuggestions = getVacationSuggestions;
var date_fns_1 = require("date-fns");
var locale_1 = require("date-fns/locale");
var holidays_1 = require("@/lib/utils/holidays");
// ---------- Utilities ----------
function toLocalISO(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return "".concat(y, "-").concat(m, "-").concat(d);
}
function gte(a, b) { return (0, date_fns_1.isSameDay)(a, b) || (0, date_fns_1.isAfter)(a, b); }
function lte(a, b) { return (0, date_fns_1.isSameDay)(a, b) || (0, date_fns_1.isBefore)(a, b); }
function daysInclusive(start, end) {
    return (0, date_fns_1.differenceInCalendarDays)(end, start) + 1;
}
function fmtShort(date) {
    return (0, date_fns_1.format)(date, 'EEEEEE dd. MMM', { locale: locale_1.de });
}
function stars(eff) {
    if (eff >= 3.5)
        return 5;
    if (eff >= 2.5)
        return 4;
    if (eff >= 2.0)
        return 3;
    if (eff >= 1.5)
        return 2;
    return 1;
}
function buildAbsenceSet(absences) {
    var s = new Set();
    for (var _i = 0, absences_1 = absences; _i < absences_1.length; _i++) {
        var a = absences_1[_i];
        var c = (0, date_fns_1.startOfDay)(a.startDate);
        var e = (0, date_fns_1.startOfDay)(a.endDate);
        while (lte(c, e)) {
            s.add(toLocalISO(c));
            c = (0, date_fns_1.addDays)(c, 1);
        }
    }
    return s;
}
function overlaps(start, end, absSet) {
    var c = (0, date_fns_1.startOfDay)(start);
    var e = (0, date_fns_1.startOfDay)(end);
    while (lte(c, e)) {
        if (absSet.has(toLocalISO(c)))
            return true;
        c = (0, date_fns_1.addDays)(c, 1);
    }
    return false;
}
function workingDaysBetweenExclusive(a, b, hSet) {
    var start = (0, date_fns_1.addDays)(a, 1);
    var end = (0, date_fns_1.subDays)(b, 1);
    if ((0, date_fns_1.isAfter)(start, end))
        return 0;
    var count = 0;
    var c = (0, date_fns_1.startOfDay)(start);
    while (lte(c, end)) {
        if (!(0, date_fns_1.isWeekend)(c) && !hSet.has(toLocalISO(c)))
            count++;
        c = (0, date_fns_1.addDays)(c, 1);
    }
    return count;
}
function getVacDaysInRange(start, end, hSet) {
    var result = [];
    var c = (0, date_fns_1.startOfDay)(start);
    while (lte(c, end)) {
        if (!(0, date_fns_1.isWeekend)(c) && !hSet.has(toLocalISO(c)))
            result.push(c);
        c = (0, date_fns_1.addDays)(c, 1);
    }
    return result;
}
function expandWeekends(start, end) {
    var s = (0, date_fns_1.startOfDay)(start);
    var e = (0, date_fns_1.startOfDay)(end);
    while ((0, date_fns_1.isWeekend)((0, date_fns_1.subDays)(s, 1)))
        s = (0, date_fns_1.subDays)(s, 1);
    while ((0, date_fns_1.isWeekend)((0, date_fns_1.addDays)(e, 1)))
        e = (0, date_fns_1.addDays)(e, 1);
    return { start: s, end: e };
}
// ---------- Main ----------
function getVacationSuggestions(options) {
    var state = options.state, remainingDays = options.remainingDays, existingAbsences = options.existingAbsences, _a = options.maxResults, maxResults = _a === void 0 ? 10 : _a;
    var tomorrow = (0, date_fns_1.addDays)((0, date_fns_1.startOfDay)(new Date()), 1);
    var year = tomorrow.getFullYear();
    var maxDate = new Date(year + 1, 2, 31);
    var holidays = __spreadArray(__spreadArray([], (0, holidays_1.getGermanHolidays)(year, state), true), (0, holidays_1.getGermanHolidays)(year + 1, state), true).map(function (h) { return (__assign(__assign({}, h), { date: (0, date_fns_1.startOfDay)(h.date) })); })
        .filter(function (h) { return gte(h.date, tomorrow) && lte(h.date, maxDate); })
        .sort(function (a, b) { return a.date.getTime() - b.date.getTime(); });
    var hSet = new Set(holidays.map(function (h) { return toLocalISO(h.date); }));
    var absSet = buildAbsenceSet(existingAbsences);
    var suggestions = [];
    var coveredDates = new Map();
    function tryAdd(s, vacDays, freeStart, freeEnd) {
        if (s.urlaubstage <= 0 || s.urlaubstage > remainingDays)
            return false;
        if (s.freieTage < s.urlaubstage || s.effizienz < 1.5)
            return false;
        if (vacDays.some(function (d) { return !gte(d, tomorrow); }))
            return false;
        if (overlaps(freeStart, freeEnd, absSet))
            return false;
        suggestions.push(s);
        return true;
    }
    // ---- KATEGORIE 1: BRÜCKENTAGE (1 Tag → 4 frei) ----
    for (var _i = 0, holidays_2 = holidays; _i < holidays_2.length; _i++) {
        var h = holidays_2[_i];
        var wd = h.date.getDay();
        var vDay = null;
        var fStart = void 0;
        var fEnd = void 0;
        if (wd === 1) { // Mo: Fr davor frei
            vDay = (0, date_fns_1.subDays)(h.date, 3);
            fStart = vDay;
            fEnd = h.date;
        }
        else if (wd === 2) { // Di: Mo frei
            vDay = (0, date_fns_1.subDays)(h.date, 1);
            fStart = (0, date_fns_1.subDays)(vDay, 2);
            fEnd = h.date;
        }
        else if (wd === 4) { // Do: Fr frei
            vDay = (0, date_fns_1.addDays)(h.date, 1);
            fStart = h.date;
            fEnd = (0, date_fns_1.addDays)(vDay, 2);
        }
        else if (wd === 5) { // Fr: Mo danach frei
            vDay = (0, date_fns_1.addDays)(h.date, 3);
            fStart = h.date;
            fEnd = vDay;
        }
        if (!vDay)
            continue;
        if ((0, date_fns_1.isWeekend)(vDay) || hSet.has(toLocalISO(vDay)))
            continue;
        var sug = {
            id: "brueckentag-".concat(toLocalISO(h.date)),
            startDate: toLocalISO(fStart), endDate: toLocalISO(fEnd),
            urlaubstage: 1, freieTage: 4, effizienz: 4.0, sterne: 5,
            feiertag: h.name,
            beschreibung: "Nimm ".concat(fmtShort(vDay), " frei"),
            typ: 'brueckentag',
            urlaubstageDetails: [fmtShort(vDay)],
            feiertageImZeitraum: ["".concat(fmtShort(h.date), " \u2013 ").concat(h.name)],
        };
        if (tryAdd(sug, [vDay], fStart, fEnd)) {
            coveredDates.set(toLocalISO(h.date), 4.0);
        }
    }
    // ---- KATEGORIE 2: VERLÄNGERTE WOCHE ----
    for (var _b = 0, holidays_3 = holidays; _b < holidays_3.length; _b++) {
        var h = holidays_3[_b];
        var wd = h.date.getDay();
        if (wd === 3) {
            // Mittwoch: 2 Optionen je 2 Urlaubstage → 5 Tage
            var opts = [
                { vd: [(0, date_fns_1.subDays)(h.date, 2), (0, date_fns_1.subDays)(h.date, 1)], s: (0, date_fns_1.subDays)(h.date, 4), e: h.date, label: 'A' },
                { vd: [(0, date_fns_1.addDays)(h.date, 1), (0, date_fns_1.addDays)(h.date, 2)], s: h.date, e: (0, date_fns_1.addDays)(h.date, 4), label: 'B' },
            ];
            for (var _c = 0, opts_1 = opts; _c < opts_1.length; _c++) {
                var o = opts_1[_c];
                if (o.vd.some(function (d) { return (0, date_fns_1.isWeekend)(d) || hSet.has(toLocalISO(d)); }))
                    continue;
                var eff_1 = daysInclusive(o.s, o.e) / o.vd.length;
                tryAdd({
                    id: "kombination-".concat(toLocalISO(h.date), "-").concat(o.label),
                    startDate: toLocalISO(o.s), endDate: toLocalISO(o.e),
                    urlaubstage: o.vd.length, freieTage: daysInclusive(o.s, o.e),
                    effizienz: eff_1, sterne: stars(eff_1),
                    feiertag: h.name,
                    beschreibung: "Nimm ".concat(o.vd.map(fmtShort).join(' + '), " frei"),
                    typ: 'kombination',
                    urlaubstageDetails: o.vd.map(fmtShort),
                    feiertageImZeitraum: ["".concat(fmtShort(h.date), " \u2013 ").concat(h.name)],
                }, o.vd, o.s, o.e);
            }
            continue;
        }
        // Mo/Di/Do/Fr: 4 Urlaubstage → 9 Tage
        var vDays = void 0;
        var fS = void 0;
        var fE = void 0;
        if (wd === 1) {
            vDays = [(0, date_fns_1.addDays)(h.date, 1), (0, date_fns_1.addDays)(h.date, 2), (0, date_fns_1.addDays)(h.date, 3), (0, date_fns_1.addDays)(h.date, 4)];
            fS = (0, date_fns_1.subDays)(h.date, 2);
            fE = (0, date_fns_1.addDays)(h.date, 6);
        }
        else if (wd === 2) {
            vDays = [(0, date_fns_1.subDays)(h.date, 1), (0, date_fns_1.addDays)(h.date, 1), (0, date_fns_1.addDays)(h.date, 2), (0, date_fns_1.addDays)(h.date, 3)];
            fS = (0, date_fns_1.subDays)(h.date, 3);
            fE = (0, date_fns_1.addDays)(h.date, 5);
        }
        else if (wd === 4) {
            vDays = [(0, date_fns_1.subDays)(h.date, 3), (0, date_fns_1.subDays)(h.date, 2), (0, date_fns_1.subDays)(h.date, 1), (0, date_fns_1.addDays)(h.date, 1)];
            fS = (0, date_fns_1.subDays)(h.date, 5);
            fE = (0, date_fns_1.addDays)(h.date, 3);
        }
        else if (wd === 5) {
            vDays = [(0, date_fns_1.subDays)(h.date, 4), (0, date_fns_1.subDays)(h.date, 3), (0, date_fns_1.subDays)(h.date, 2), (0, date_fns_1.subDays)(h.date, 1)];
            fS = (0, date_fns_1.subDays)(h.date, 6);
            fE = (0, date_fns_1.addDays)(h.date, 2);
        }
        else {
            continue;
        }
        if (vDays.some(function (d) { return (0, date_fns_1.isWeekend)(d) || hSet.has(toLocalISO(d)); }))
            continue;
        var freieTage = daysInclusive(fS, fE);
        var eff = freieTage / vDays.length;
        tryAdd({
            id: "kombination-".concat(toLocalISO(h.date)),
            startDate: toLocalISO(fS), endDate: toLocalISO(fE),
            urlaubstage: vDays.length,
            freieTage: freieTage,
            effizienz: eff, sterne: stars(eff),
            feiertag: h.name,
            beschreibung: "Nimm ".concat(fmtShort(vDays[0]), "\u2013").concat(fmtShort(vDays[vDays.length - 1]), " frei"),
            typ: 'kombination',
            urlaubstageDetails: vDays.map(fmtShort),
            feiertageImZeitraum: ["".concat(fmtShort(h.date), " \u2013 ").concat(h.name)],
        }, vDays, fS, fE);
    }
    // ---- KATEGORIE 3: FEIERTAGS-CLUSTER ----
    var clusters = [];
    var cur = [];
    for (var _d = 0, holidays_4 = holidays; _d < holidays_4.length; _d++) {
        var h = holidays_4[_d];
        if (cur.length === 0) {
            cur.push(h);
            continue;
        }
        var gap = workingDaysBetweenExclusive(cur[cur.length - 1].date, h.date, hSet);
        if (gap <= 5) {
            cur.push(h);
        }
        else {
            clusters.push(cur);
            cur = [h];
        }
    }
    if (cur.length > 0)
        clusters.push(cur);
    console.log('[VacationOptimizer] Clusters found:', clusters.map(function (c) { return ({
        holidays: c.map(function (h) { return "".concat(toLocalISO(h.date), " ").concat(h.name); }),
        count: c.length,
    }); }));
    for (var _e = 0, clusters_1 = clusters; _e < clusters_1.length; _e++) {
        var cluster = clusters_1[_e];
        if (cluster.length < 2)
            continue;
        var first = cluster[0];
        var last = cluster[cluster.length - 1];
        var _f = expandWeekends(first.date, last.date), eS = _f.start, eE = _f.end;
        var vacDays = getVacDaysInRange(eS, eE, hSet);
        console.log("[VacationOptimizer] Cluster ".concat(first.name, "\u2013").concat(last.name, ":"), {
            expanded: "".concat(toLocalISO(eS), " to ").concat(toLocalISO(eE)),
            vacDaysNeeded: vacDays.length,
            freieTage: daysInclusive(eS, eE),
            remainingDays: remainingDays,
        });
        if (vacDays.length === 0 || vacDays.length > 6 || vacDays.length > remainingDays)
            continue;
        var freieTage = daysInclusive(eS, eE);
        var eff = freieTage / vacDays.length;
        if (overlaps(eS, eE, absSet))
            continue;
        if (vacDays.some(function (d) { return !gte(d, tomorrow); }))
            continue;
        var feiertageImZeitraum = cluster.map(function (h) { return "".concat(fmtShort(h.date), " \u2013 ").concat(h.name); });
        tryAdd({
            id: "cluster-".concat(toLocalISO(first.date), "-").concat(toLocalISO(last.date)),
            startDate: toLocalISO(eS), endDate: toLocalISO(eE),
            urlaubstage: vacDays.length,
            freieTage: freieTage,
            effizienz: eff, sterne: stars(eff),
            feiertag: cluster.map(function (h) { return h.name; }).join(', '),
            beschreibung: "".concat(first.name, " bis ").concat(last.name, ": nimm ").concat(vacDays.map(function (d) { return (0, date_fns_1.format)(d, 'dd. MMM', { locale: locale_1.de }); }).join(', '), " frei"),
            typ: 'cluster',
            urlaubstageDetails: vacDays.map(fmtShort),
            feiertageImZeitraum: feiertageImZeitraum,
        }, vacDays, eS, eE);
    }
    // Sort: sterne desc, then date asc
    return suggestions
        .filter(function (s) { return s.sterne >= 2; })
        .sort(function (a, b) { return b.sterne !== a.sterne ? b.sterne - a.sterne : a.startDate.localeCompare(b.startDate); })
        .slice(0, maxResults);
}
