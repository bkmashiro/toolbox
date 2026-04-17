import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'fake-data',
  name: 'Fake Data',
  description: 'Generate realistic fake data using @faker-js/faker: person, address, company, internet, and more',
  category: 'misc',
  tags: ['fake', 'data', 'generate', 'mock', 'test', 'name', 'email', 'address', 'company', 'faker'],
  inputs: [],
  options: [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      default: 'person',
      options: [
        { label: 'Person (name, email, phone, DOB)', value: 'person' },
        { label: 'Address (street, city, zip, country)', value: 'address' },
        { label: 'Company (name, department, role, industry)', value: 'company' },
        { label: 'Internet (username, email, URL, IP, password)', value: 'internet' },
        { label: 'Finance (IBAN, credit card, currency)', value: 'finance' },
        { label: 'Vehicle (manufacturer, model, VIN)', value: 'vehicle' },
      ],
    },
    {
      id: 'locale',
      label: 'Locale',
      type: 'select',
      default: 'en',
      options: [
        { label: 'English (en)', value: 'en' },
        { label: 'German (de)', value: 'de' },
        { label: 'French (fr)', value: 'fr' },
        { label: 'Japanese (ja)', value: 'ja' },
        { label: 'Chinese (zh_CN)', value: 'zh_CN' },
        { label: 'Spanish (es)', value: 'es' },
        { label: 'Portuguese (pt_BR)', value: 'pt_BR' },
      ],
    },
    {
      id: 'count',
      label: 'Count',
      type: 'range',
      default: 10,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      id: 'format',
      label: 'Output Format',
      type: 'select',
      default: 'table',
      options: [
        { label: 'Table (HTML)', value: 'table' },
        { label: 'JSON', value: 'json' },
        { label: 'CSV', value: 'csv' },
      ],
    },
  ],
  output: { type: 'html' },
  apiSupported: false,
  heavyDeps: ['faker'],

  async run(inputs, options) {
    const { faker } = await import('@faker-js/faker') as any;

    const category = options.category as string;
    const count = options.count as number;
    const format = options.format as string;

    const records: Record<string, string>[] = [];

    for (let i = 0; i < count; i++) {
      let rec: Record<string, string> = {};
      if (category === 'person') {
        rec = {
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email(),
          phone: faker.phone.number(),
          gender: faker.person.gender(),
          birthDate: faker.date.birthdate().toISOString().slice(0, 10),
          jobTitle: faker.person.jobTitle(),
        };
      } else if (category === 'address') {
        rec = {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country(),
          countryCode: faker.location.countryCode(),
          latitude: faker.location.latitude().toFixed(6),
          longitude: faker.location.longitude().toFixed(6),
        };
      } else if (category === 'company') {
        rec = {
          name: faker.company.name(),
          suffix: faker.company.name(),
          department: faker.commerce.department(),
          jobArea: faker.person.jobArea(),
          industry: faker.company.buzzVerb(),
          catchPhrase: faker.company.catchPhrase(),
          bs: faker.company.buzzPhrase(),
        };
      } else if (category === 'internet') {
        rec = {
          username: faker.internet.username(),
          email: faker.internet.email(),
          url: faker.internet.url(),
          ip: faker.internet.ip(),
          ipv6: faker.internet.ipv6(),
          mac: faker.internet.mac(),
          userAgent: faker.internet.userAgent(),
        };
      } else if (category === 'finance') {
        rec = {
          iban: faker.finance.iban(),
          bic: faker.finance.bic(),
          creditCardNumber: faker.finance.creditCardNumber(),
          creditCardCVV: faker.finance.creditCardCVV(),
          currency: faker.finance.currencyName(),
          currencyCode: faker.finance.currencyCode(),
          amount: faker.finance.amount(),
        };
      } else if (category === 'vehicle') {
        rec = {
          manufacturer: faker.vehicle.manufacturer(),
          model: faker.vehicle.model(),
          type: faker.vehicle.type(),
          fuel: faker.vehicle.fuel(),
          vin: faker.vehicle.vin(),
          color: faker.color.human(),
          year: String(faker.date.past({ years: 20 }).getFullYear()),
        };
      }
      records.push(rec);
    }

    if (format === 'json') {
      return { type: 'text', data: JSON.stringify(records, null, 2) };
    }

    if (format === 'csv') {
      const headers = Object.keys(records[0] ?? {});
      const rows = records.map(r => headers.map(h => `"${(r[h] ?? '').replace(/"/g, '""')}"`).join(','));
      return { type: 'text', data: [headers.join(','), ...rows].join('\n') };
    }

    // HTML table
    const headers = Object.keys(records[0] ?? {});
    const tableHtml = `
<style>
table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
th, td { border: 1px solid #dee2e6; padding: 6px 10px; text-align: left; }
th { background: #f1f3f5; font-weight: 600; position: sticky; top: 0; }
tr:nth-child(even) { background: #f8f9fa; }
</style>
<table>
<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>
${records.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('\n')}
</tbody>
</table>`;

    return { type: 'html', data: tableHtml };
  },
};

registry.register(tool);
export default tool;
