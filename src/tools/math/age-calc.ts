import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const ZODIAC_SIGNS = [
  { sign: 'Capricorn',   start: [12, 22], end: [1,  19] },
  { sign: 'Aquarius',    start: [1,  20], end: [2,  18] },
  { sign: 'Pisces',      start: [2,  19], end: [3,  20] },
  { sign: 'Aries',       start: [3,  21], end: [4,  19] },
  { sign: 'Taurus',      start: [4,  20], end: [5,  20] },
  { sign: 'Gemini',      start: [5,  21], end: [6,  20] },
  { sign: 'Cancer',      start: [6,  21], end: [7,  22] },
  { sign: 'Leo',         start: [7,  23], end: [8,  22] },
  { sign: 'Virgo',       start: [8,  23], end: [9,  22] },
  { sign: 'Libra',       start: [9,  23], end: [10, 22] },
  { sign: 'Scorpio',     start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
];

const CHINESE_ZODIAC = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];

function getZodiac(month: number, day: number): string {
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return z.sign;
    if (sm === 12 && em === 1) {
      if (month === 12 && day >= sd) return z.sign;
      if (month === 1 && day <= ed) return z.sign;
    }
  }
  return 'Unknown';
}

function getChineseZodiac(year: number): string {
  return CHINESE_ZODIAC[(year - 4) % 12];
}

const tool: Tool = {
  id: 'age-calc',
  name: 'Age Calculator',
  description: 'Calculate age from birth date: years/months/days, next birthday, zodiac, and Chinese zodiac',
  category: 'math',
  tags: ['age', 'birthday', 'calculator', 'zodiac', 'chinese', 'birth', 'date'],
  inputs: [
    {
      id: 'birthDate',
      label: 'Birth Date',
      type: 'text',
      placeholder: 'e.g. 1990-05-15 or May 15, 1990',
    },
  ],
  options: [
    {
      id: 'referenceDate',
      label: 'Reference Date (defaults to today)',
      type: 'text',
      default: '',
      placeholder: 'Leave blank for today',
    },
  ],
  output: { type: 'json' },
  apiSupported: false,

  async run(inputs, options) {
    const raw = (inputs.birthDate as string).trim();
    if (!raw) throw new Error('Please enter a birth date');

    const birth = new Date(raw);
    if (isNaN(birth.getTime())) throw new Error(`Invalid date: "${raw}"`);

    const refRaw = (options.referenceDate as string)?.trim();
    const ref = refRaw ? new Date(refRaw) : new Date();
    if (isNaN(ref.getTime())) throw new Error('Invalid reference date');

    if (birth > ref) throw new Error('Birth date must be before reference date');

    // Calculate years, months, days
    let years = ref.getFullYear() - birth.getFullYear();
    let months = ref.getMonth() - birth.getMonth();
    let days = ref.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const totalDays = Math.floor((ref.getTime() - birth.getTime()) / 86400000);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = totalDays * 24;

    // Next birthday
    let nextBirthday = new Date(ref.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday <= ref) {
      nextBirthday.setFullYear(ref.getFullYear() + 1);
    }
    const daysToNextBirthday = Math.ceil((nextBirthday.getTime() - ref.getTime()) / 86400000);

    const zodiac = getZodiac(birth.getMonth() + 1, birth.getDate());
    const chineseZodiac = getChineseZodiac(birth.getFullYear());

    const result = {
      age: { years, months, days },
      totalDays,
      totalWeeks,
      totalHoursApprox: totalHours,
      nextBirthday: nextBirthday.toISOString().slice(0, 10),
      daysUntilNextBirthday: daysToNextBirthday,
      zodiacSign: zodiac,
      chineseZodiac: `${chineseZodiac} (${birth.getFullYear()})`,
      birthDate: birth.toISOString().slice(0, 10),
      referenceDate: ref.toISOString().slice(0, 10),
    };

    return {
      type: 'json',
      data: result,
      summary: `Age: ${years} years, ${months} months, ${days} days`,
    };
  },
};

registry.register(tool);
export default tool;
