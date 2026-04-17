// Unit definitions for the unit converter tool.
// All conversion factors are multipliers TO the base unit.

export interface UnitDef {
  id: string;
  label: string;
  /** factor to multiply to get base unit; for temperature use fn */
  factor?: number;
  toBase?: (v: number) => number;
  fromBase?: (v: number) => number;
}

export interface UnitCategory {
  id: string;
  label: string;
  baseUnit: string;
  units: UnitDef[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: 'Length',
    baseUnit: 'm',
    units: [
      { id: 'pm', label: 'Picometer (pm)', factor: 1e-12 },
      { id: 'nm', label: 'Nanometer (nm)', factor: 1e-9 },
      { id: 'um', label: 'Micrometer (μm)', factor: 1e-6 },
      { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
      { id: 'm', label: 'Meter (m)', factor: 1 },
      { id: 'km', label: 'Kilometer (km)', factor: 1000 },
      { id: 'in', label: 'Inch (in)', factor: 0.0254 },
      { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
      { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
      { id: 'nmi', label: 'Nautical mile (nmi)', factor: 1852 },
      { id: 'ly', label: 'Light-year (ly)', factor: 9.461e15 },
    ],
  },
  {
    id: 'weight',
    label: 'Weight / Mass',
    baseUnit: 'kg',
    units: [
      { id: 'ug', label: 'Microgram (μg)', factor: 1e-9 },
      { id: 'mg', label: 'Milligram (mg)', factor: 1e-6 },
      { id: 'g', label: 'Gram (g)', factor: 0.001 },
      { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
      { id: 't', label: 'Metric ton (t)', factor: 1000 },
      { id: 'oz', label: 'Ounce (oz)', factor: 0.0283495 },
      { id: 'lb', label: 'Pound (lb)', factor: 0.453592 },
      { id: 'st', label: 'Stone (st)', factor: 6.35029 },
      { id: 'ton_us', label: 'Short ton (US)', factor: 907.185 },
      { id: 'ton_uk', label: 'Long ton (UK)', factor: 1016.05 },
      { id: 'ct', label: 'Carat (ct)', factor: 0.0002 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    baseUnit: 'K',
    units: [
      {
        id: 'C',
        label: 'Celsius (°C)',
        toBase: (v) => v + 273.15,
        fromBase: (v) => v - 273.15,
      },
      {
        id: 'F',
        label: 'Fahrenheit (°F)',
        toBase: (v) => (v - 32) * 5 / 9 + 273.15,
        fromBase: (v) => (v - 273.15) * 9 / 5 + 32,
      },
      {
        id: 'K',
        label: 'Kelvin (K)',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: 'R',
        label: 'Rankine (°R)',
        toBase: (v) => v * 5 / 9,
        fromBase: (v) => v * 9 / 5,
      },
      {
        id: 'De',
        label: 'Delisle (°De)',
        toBase: (v) => 373.15 - v * 2 / 3,
        fromBase: (v) => (373.15 - v) * 3 / 2,
      },
      {
        id: 'N',
        label: 'Newton (°N)',
        toBase: (v) => v * 100 / 33 + 273.15,
        fromBase: (v) => (v - 273.15) * 33 / 100,
      },
      {
        id: 'Re',
        label: 'Réaumur (°Ré)',
        toBase: (v) => v * 5 / 4 + 273.15,
        fromBase: (v) => (v - 273.15) * 4 / 5,
      },
      {
        id: 'Ro',
        label: 'Rømer (°Rø)',
        toBase: (v) => (v - 7.5) * 40 / 21 + 273.15,
        fromBase: (v) => (v - 273.15) * 21 / 40 + 7.5,
      },
    ],
  },
  {
    id: 'area',
    label: 'Area',
    baseUnit: 'm2',
    units: [
      { id: 'mm2', label: 'Square millimeter (mm²)', factor: 1e-6 },
      { id: 'cm2', label: 'Square centimeter (cm²)', factor: 1e-4 },
      { id: 'm2', label: 'Square meter (m²)', factor: 1 },
      { id: 'km2', label: 'Square kilometer (km²)', factor: 1e6 },
      { id: 'ha', label: 'Hectare (ha)', factor: 10000 },
      { id: 'ac', label: 'Acre (ac)', factor: 4046.856 },
      { id: 'in2', label: 'Square inch (in²)', factor: 6.4516e-4 },
      { id: 'ft2', label: 'Square foot (ft²)', factor: 0.092903 },
      { id: 'yd2', label: 'Square yard (yd²)', factor: 0.836127 },
      { id: 'mi2', label: 'Square mile (mi²)', factor: 2.58999e6 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    baseUnit: 'L',
    units: [
      { id: 'ml', label: 'Milliliter (mL)', factor: 0.001 },
      { id: 'cl', label: 'Centiliter (cL)', factor: 0.01 },
      { id: 'dl', label: 'Deciliter (dL)', factor: 0.1 },
      { id: 'L', label: 'Liter (L)', factor: 1 },
      { id: 'm3', label: 'Cubic meter (m³)', factor: 1000 },
      { id: 'in3', label: 'Cubic inch (in³)', factor: 0.016387 },
      { id: 'ft3', label: 'Cubic foot (ft³)', factor: 28.3168 },
      { id: 'tsp', label: 'Teaspoon (US tsp)', factor: 0.00492892 },
      { id: 'tbsp', label: 'Tablespoon (US tbsp)', factor: 0.0147868 },
      { id: 'fl_oz', label: 'Fluid ounce (US fl oz)', factor: 0.0295735 },
      { id: 'cup', label: 'Cup (US)', factor: 0.236588 },
      { id: 'pt', label: 'Pint (US)', factor: 0.473176 },
      { id: 'qt', label: 'Quart (US)', factor: 0.946353 },
      { id: 'gal', label: 'Gallon (US)', factor: 3.78541 },
      { id: 'gal_uk', label: 'Gallon (UK)', factor: 4.54609 },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    baseUnit: 'm/s',
    units: [
      { id: 'm/s', label: 'Meter/second (m/s)', factor: 1 },
      { id: 'km/h', label: 'Kilometer/hour (km/h)', factor: 1 / 3.6 },
      { id: 'mph', label: 'Mile/hour (mph)', factor: 0.44704 },
      { id: 'kn', label: 'Knot (kn)', factor: 0.514444 },
      { id: 'ft/s', label: 'Foot/second (ft/s)', factor: 0.3048 },
      { id: 'mach', label: 'Mach (at sea level)', factor: 340.29 },
      { id: 'c', label: 'Speed of light (c)', factor: 2.998e8 },
      { id: 'cm/s', label: 'Centimeter/second (cm/s)', factor: 0.01 },
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    baseUnit: 'Pa',
    units: [
      { id: 'Pa', label: 'Pascal (Pa)', factor: 1 },
      { id: 'hPa', label: 'Hectopascal (hPa)', factor: 100 },
      { id: 'kPa', label: 'Kilopascal (kPa)', factor: 1000 },
      { id: 'MPa', label: 'Megapascal (MPa)', factor: 1e6 },
      { id: 'bar', label: 'Bar', factor: 100000 },
      { id: 'mbar', label: 'Millibar (mbar)', factor: 100 },
      { id: 'psi', label: 'Pound/square inch (psi)', factor: 6894.757 },
      { id: 'atm', label: 'Atmosphere (atm)', factor: 101325 },
      { id: 'mmHg', label: 'Millimeter of mercury (mmHg)', factor: 133.322 },
      { id: 'inHg', label: 'Inch of mercury (inHg)', factor: 3386.39 },
      { id: 'torr', label: 'Torr', factor: 133.322 },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    baseUnit: 'J',
    units: [
      { id: 'J', label: 'Joule (J)', factor: 1 },
      { id: 'kJ', label: 'Kilojoule (kJ)', factor: 1000 },
      { id: 'MJ', label: 'Megajoule (MJ)', factor: 1e6 },
      { id: 'cal', label: 'Calorie (cal)', factor: 4.184 },
      { id: 'kcal', label: 'Kilocalorie (kcal)', factor: 4184 },
      { id: 'Wh', label: 'Watt-hour (Wh)', factor: 3600 },
      { id: 'kWh', label: 'Kilowatt-hour (kWh)', factor: 3.6e6 },
      { id: 'eV', label: 'Electron-volt (eV)', factor: 1.602e-19 },
      { id: 'BTU', label: 'British thermal unit (BTU)', factor: 1055.06 },
      { id: 'ft_lb', label: 'Foot-pound (ft·lb)', factor: 1.35582 },
      { id: 'erg', label: 'Erg', factor: 1e-7 },
    ],
  },
  {
    id: 'power',
    label: 'Power',
    baseUnit: 'W',
    units: [
      { id: 'mW', label: 'Milliwatt (mW)', factor: 0.001 },
      { id: 'W', label: 'Watt (W)', factor: 1 },
      { id: 'kW', label: 'Kilowatt (kW)', factor: 1000 },
      { id: 'MW', label: 'Megawatt (MW)', factor: 1e6 },
      { id: 'GW', label: 'Gigawatt (GW)', factor: 1e9 },
      { id: 'hp', label: 'Horsepower (hp)', factor: 745.7 },
      { id: 'hp_metric', label: 'Metric horsepower (PS)', factor: 735.499 },
      { id: 'BTU/h', label: 'BTU/hour', factor: 0.293071 },
      { id: 'cal/s', label: 'Calorie/second', factor: 4.184 },
      { id: 'ft_lb/s', label: 'Foot-pound/second', factor: 1.35582 },
    ],
  },
  {
    id: 'data-size',
    label: 'Data Size',
    baseUnit: 'B',
    units: [
      { id: 'b', label: 'Bit (b)', factor: 0.125 },
      { id: 'B', label: 'Byte (B)', factor: 1 },
      { id: 'KB', label: 'Kilobyte (KB)', factor: 1024 },
      { id: 'MB', label: 'Megabyte (MB)', factor: 1048576 },
      { id: 'GB', label: 'Gigabyte (GB)', factor: 1073741824 },
      { id: 'TB', label: 'Terabyte (TB)', factor: 1099511627776 },
      { id: 'PB', label: 'Petabyte (PB)', factor: 1.126e15 },
      { id: 'Kib', label: 'Kibibyte (KiB)', factor: 1024 },
      { id: 'Mib', label: 'Mebibyte (MiB)', factor: 1048576 },
      { id: 'Gib', label: 'Gibibyte (GiB)', factor: 1073741824 },
      { id: 'Tib', label: 'Tebibyte (TiB)', factor: 1099511627776 },
      { id: 'kbps', label: 'Kilobit/second (kbps)', factor: 125 },
      { id: 'Mbps', label: 'Megabit/second (Mbps)', factor: 125000 },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    baseUnit: 's',
    units: [
      { id: 'ns', label: 'Nanosecond (ns)', factor: 1e-9 },
      { id: 'us', label: 'Microsecond (μs)', factor: 1e-6 },
      { id: 'ms', label: 'Millisecond (ms)', factor: 0.001 },
      { id: 's', label: 'Second (s)', factor: 1 },
      { id: 'min', label: 'Minute (min)', factor: 60 },
      { id: 'h', label: 'Hour (h)', factor: 3600 },
      { id: 'd', label: 'Day (d)', factor: 86400 },
      { id: 'wk', label: 'Week (wk)', factor: 604800 },
      { id: 'mo', label: 'Month (avg)', factor: 2629800 },
      { id: 'yr', label: 'Year (yr)', factor: 31557600 },
      { id: 'decade', label: 'Decade', factor: 315576000 },
      { id: 'century', label: 'Century', factor: 3155760000 },
    ],
  },
];

/**
 * Convert a value from one unit to another within the same category.
 */
export function convertUnit(value: number, fromId: string, toId: string, categoryId: string): number | null {
  const cat = UNIT_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;
  const fromUnit = cat.units.find(u => u.id === fromId);
  const toUnit = cat.units.find(u => u.id === toId);
  if (!fromUnit || !toUnit) return null;

  let baseValue: number;
  if (fromUnit.toBase) {
    baseValue = fromUnit.toBase(value);
  } else {
    baseValue = value * (fromUnit.factor ?? 1);
  }

  let result: number;
  if (toUnit.fromBase) {
    result = toUnit.fromBase(baseValue);
  } else {
    result = baseValue / (toUnit.factor ?? 1);
  }

  return result;
}
