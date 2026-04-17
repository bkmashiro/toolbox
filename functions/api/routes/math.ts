import { Hono } from 'hono';

const mathRoutes = new Hono();

// Unit conversion data (minimal, shared with frontend unit-data.ts logic)
const UNIT_FACTORS: Record<string, Record<string, number | null>> = {
  length: { pm: 1e-12, nm: 1e-9, um: 1e-6, mm: 0.001, cm: 0.01, m: 1, km: 1000, 'in': 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 },
  weight: { ug: 1e-9, mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.0283495, lb: 0.453592, st: 6.35029 },
  area: { mm2: 1e-6, cm2: 1e-4, m2: 1, km2: 1e6, ha: 10000, ac: 4046.856, in2: 6.4516e-4, ft2: 0.092903, yd2: 0.836127 },
  volume: { ml: 0.001, L: 1, m3: 1000, tsp: 0.00492892, tbsp: 0.0147868, fl_oz: 0.0295735, cup: 0.236588, pt: 0.473176, qt: 0.946353, gal: 3.78541 },
  speed: { 'm/s': 1, 'km/h': 1/3.6, mph: 0.44704, kn: 0.514444, 'ft/s': 0.3048, mach: 340.29 },
  pressure: { Pa: 1, hPa: 100, kPa: 1000, MPa: 1e6, bar: 100000, psi: 6894.757, atm: 101325, mmHg: 133.322 },
  energy: { J: 1, kJ: 1000, MJ: 1e6, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3.6e6, BTU: 1055.06 },
  power: { W: 1, kW: 1000, MW: 1e6, hp: 745.7 },
  'data-size': { b: 0.125, B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
  time: { ns: 1e-9, us: 1e-6, ms: 0.001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, mo: 2629800, yr: 31557600 },
};

// Temperature handled separately
function convertTemperature(value: number, from: string, to: string): number | null {
  const toKelvin: Record<string, (v: number) => number> = {
    C: (v) => v + 273.15,
    F: (v) => (v - 32) * 5/9 + 273.15,
    K: (v) => v,
    R: (v) => v * 5/9,
  };
  const fromKelvin: Record<string, (v: number) => number> = {
    C: (v) => v - 273.15,
    F: (v) => (v - 273.15) * 9/5 + 32,
    K: (v) => v,
    R: (v) => v * 9/5,
  };
  if (!toKelvin[from] || !fromKelvin[to]) return null;
  return fromKelvin[to](toKelvin[from](value));
}

// GET /api/unit-convert?value=1&from=km&to=mi&category=length
mathRoutes.get('/unit-convert', (c) => {
  try {
    const valueStr = c.req.query('value') ?? '';
    const from = c.req.query('from') ?? '';
    const to = c.req.query('to') ?? '';
    const category = c.req.query('category') ?? '';

    const value = parseFloat(valueStr);
    if (isNaN(value)) return c.json({ ok: false, error: 'Invalid value' }, 400);

    let result: number | null;
    if (category === 'temperature') {
      result = convertTemperature(value, from, to);
    } else {
      const cat = UNIT_FACTORS[category];
      if (!cat) return c.json({ ok: false, error: `Unknown category: ${category}` }, 400);
      const fromFactor = cat[from];
      const toFactor = cat[to];
      if (fromFactor == null || toFactor == null) {
        return c.json({ ok: false, error: `Unknown unit(s): from=${from}, to=${to}` }, 400);
      }
      const base = value * fromFactor;
      result = base / toFactor;
    }

    if (result === null) return c.json({ ok: false, error: 'Conversion failed' }, 400);
    return c.json({ ok: true, result: parseFloat(result.toPrecision(10)) });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/percentage-calc?mode=of&x=25&y=200
mathRoutes.get('/percentage-calc', (c) => {
  try {
    const mode = c.req.query('mode') ?? 'of';
    const x = parseFloat(c.req.query('x') ?? '');
    const y = parseFloat(c.req.query('y') ?? '');
    if (isNaN(x) || isNaN(y)) return c.json({ ok: false, error: 'x and y must be numbers' }, 400);

    let result: number;
    if (mode === 'of') {
      result = (x / 100) * y;
    } else if (mode === 'what') {
      if (y === 0) return c.json({ ok: false, error: 'y cannot be 0' }, 400);
      result = (x / y) * 100;
    } else if (mode === 'change') {
      if (x === 0) return c.json({ ok: false, error: 'x (start value) cannot be 0' }, 400);
      result = ((y - x) / Math.abs(x)) * 100;
    } else {
      return c.json({ ok: false, error: 'mode must be one of: of, what, change' }, 400);
    }

    return c.json({ ok: true, result: parseFloat(result.toPrecision(10)) });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/roman-numeral?n=42 or ?roman=XLII
mathRoutes.get('/roman-numeral', (c) => {
  try {
    const nStr = c.req.query('n') ?? c.req.query('value') ?? '';
    const romanStr = c.req.query('roman') ?? '';

    const ROMAN_VALUES: [string, number][] = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
      ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
    ];

    function toRoman(n: number): string {
      if (n < 1 || n > 3999) throw new Error('Number must be 1–3999');
      let result = '';
      for (const [sym, val] of ROMAN_VALUES) {
        while (n >= val) { result += sym; n -= val; }
      }
      return result;
    }

    function fromRoman(s: string): number {
      const map: Record<string, number> = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 };
      let result = 0;
      for (let i = 0; i < s.length; i++) {
        const curr = map[s[i]];
        const next = map[s[i+1]] ?? 0;
        result += curr < next ? -curr : curr;
      }
      return result;
    }

    if (nStr) {
      const n = parseInt(nStr);
      if (isNaN(n)) return c.json({ ok: false, error: 'Invalid integer' }, 400);
      return c.json({ ok: true, result: toRoman(n) });
    } else if (romanStr) {
      const upper = romanStr.toUpperCase();
      if (!/^[MDCLXVI]+$/.test(upper)) return c.json({ ok: false, error: 'Invalid Roman numeral characters' }, 400);
      return c.json({ ok: true, result: fromRoman(upper) });
    } else {
      return c.json({ ok: false, error: 'Provide either n (integer) or roman (Roman numeral)' }, 400);
    }
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/statistics?numbers=1,2,3,4,5
mathRoutes.get('/statistics', (c) => {
  try {
    const raw = c.req.query('numbers') ?? '';
    if (!raw.trim()) return c.json({ ok: false, error: 'numbers parameter is required' }, 400);

    const nums = raw.split(/[,\n]+/).map(s => s.trim()).filter(s => s).map(s => {
      const n = parseFloat(s);
      if (isNaN(n)) throw new Error(`Invalid number: "${s}"`);
      return n;
    });

    if (nums.length === 0) return c.json({ ok: false, error: 'No valid numbers found' }, 400);

    const sorted = [...nums].sort((a, b) => a - b);
    const n = nums.length;
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = nums.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;

    const q = (p: number) => {
      const pos = (sorted.length - 1) * p;
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
    };

    const freq: Record<number, number> = {};
    for (const v of nums) freq[v] = (freq[v] ?? 0) + 1;
    const maxFreq = Math.max(...Object.values(freq));
    const mode = maxFreq === 1 ? null : Object.entries(freq).filter(([, f]) => f === maxFreq).map(([k]) => parseFloat(k));

    return c.json({
      ok: true,
      result: {
        count: n, sum, min: sorted[0], max: sorted[n-1],
        mean: parseFloat(mean.toPrecision(12)),
        median: q(0.5), mode,
        stdDev: parseFloat(Math.sqrt(variance).toPrecision(12)),
        Q1: q(0.25), Q3: q(0.75),
      },
    });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

// GET /api/number-format?number=1234567.89&format=standard&locale=en-US&decimals=2
mathRoutes.get('/number-format', (c) => {
  try {
    const numStr = c.req.query('number') ?? '';
    const format = c.req.query('format') ?? 'standard';
    const locale = c.req.query('locale') ?? 'en-US';
    const decimals = parseInt(c.req.query('decimals') ?? '2');
    const n = parseFloat(numStr);
    if (isNaN(n)) return c.json({ ok: false, error: 'Invalid number' }, 400);

    let result: string;
    if (format === 'scientific') {
      result = n.toExponential(decimals);
    } else if (format === 'compact') {
      result = n.toLocaleString(locale, { notation: 'compact', maximumFractionDigits: decimals } as Intl.NumberFormatOptions);
    } else {
      result = n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    return c.json({ ok: true, result });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 400);
  }
});

export { mathRoutes };
