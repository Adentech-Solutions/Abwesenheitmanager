"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Quick test for getGermanHolidays
const holidays_1 = require("../src/lib/utils/holidays");
const holidays = (0, holidays_1.getGermanHolidays)(2026, 'BY');
const christiHimmelfahrt = holidays.find(h => h.name === 'Christi Himmelfahrt');
if (christiHimmelfahrt) {
    console.log('Christi Himmelfahrt 2026:', christiHimmelfahrt.date.toISOString().split('T')[0]);
    console.log('Weekday:', christiHimmelfahrt.date.toLocaleDateString('de-DE', { weekday: 'long' }));
}
else {
    console.log('Christi Himmelfahrt not found');
}
