import { describe, it, expect, beforeAll } from 'vitest';

let tool: typeof import('../csv-to-json').default;

beforeAll(async () => {
  tool = (await import('../csv-to-json')).default;
});

describe('csv-to-json', () => {
  it('converts CSV with header row to array of objects', async () => {
    const csv = 'name,age\nAlice,30\nBob,25';
    const result = await tool.run({ csv }, { delimiter: ',', header: true, typeInference: false, indent: '2' });
    const data = JSON.parse(result.data as string);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Alice');
    expect(data[0].age).toBe('30');
  });

  it('infers number types with typeInference', async () => {
    const csv = 'name,age\nAlice,30';
    const result = await tool.run({ csv }, { delimiter: ',', header: true, typeInference: true, indent: '2' });
    const data = JSON.parse(result.data as string);
    expect(typeof data[0].age).toBe('number');
    expect(data[0].age).toBe(30);
  });

  it('supports semicolon delimiter', async () => {
    const csv = 'name;age\nAlice;30';
    const result = await tool.run({ csv }, { delimiter: ';', header: true, typeInference: false, indent: '2' });
    const data = JSON.parse(result.data as string);
    expect(data[0].name).toBe('Alice');
  });

  it('converts CSV without header row', async () => {
    const csv = 'Alice,30\nBob,25';
    const result = await tool.run({ csv }, { delimiter: ',', header: false, typeInference: false, indent: '2' });
    const data = JSON.parse(result.data as string);
    expect(Array.isArray(data[0])).toBe(true);
    expect(data[0][0]).toBe('Alice');
  });

  it('produces minified JSON with indent 0', async () => {
    const csv = 'a,b\n1,2';
    const result = await tool.run({ csv }, { delimiter: ',', header: true, typeInference: false, indent: '0' });
    expect(result.data as string).not.toContain('\n  ');
  });
});
