import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

type Matrix = number[][];

function parseMatrix(s: string): Matrix {
  const rows = s.trim().split(/\n+/).filter(r => r.trim());
  return rows.map((row, i) => {
    const cells = row.trim().split(/[\t,\s]+/).filter(c => c !== '');
    return cells.map((c, j) => {
      const n = parseFloat(c);
      if (isNaN(n)) throw new Error(`Invalid number at row ${i + 1}, col ${j + 1}: "${c}"`);
      return n;
    });
  });
}

function formatMatrix(m: Matrix): string {
  return m.map(row => row.map(v => {
    const s = parseFloat(v.toPrecision(8)).toString();
    return s.padStart(10);
  }).join('')).join('\n');
}

function addMatrices(a: Matrix, b: Matrix): Matrix {
  const rows = a.length, cols = a[0].length;
  if (b.length !== rows || b[0].length !== cols) throw new Error('Matrices must have the same dimensions');
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

function subtractMatrices(a: Matrix, b: Matrix): Matrix {
  const rows = a.length, cols = a[0].length;
  if (b.length !== rows || b[0].length !== cols) throw new Error('Matrices must have the same dimensions');
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

function multiplyMatrices(a: Matrix, b: Matrix): Matrix {
  const ra = a.length, ca = a[0].length;
  const rb = b.length, cb = b[0].length;
  if (ca !== rb) throw new Error(`Cannot multiply: ${ra}×${ca} and ${rb}×${cb} — inner dimensions must match`);
  return Array.from({ length: ra }, (_, i) =>
    Array.from({ length: cb }, (_, j) =>
      a[i].reduce((sum, _, k) => sum + a[i][k] * b[k][j], 0)
    )
  );
}

function transpose(a: Matrix): Matrix {
  if (!a.length) return [];
  return a[0].map((_, j) => a.map(row => row[j]));
}

function determinant(m: Matrix): number {
  const n = m.length;
  if (m.some(r => r.length !== n)) throw new Error('Determinant requires a square matrix');
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map(row => row.filter((_, c) => c !== j));
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * determinant(minor);
  }
  return det;
}

function inverse(m: Matrix): Matrix {
  const n = m.length;
  if (m.some(r => r.length !== n)) throw new Error('Inverse requires a square matrix');
  const det = determinant(m);
  if (Math.abs(det) < 1e-12) throw new Error('Matrix is singular (determinant is 0) — no inverse exists');

  // Augment [M | I] and row-reduce
  const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);

  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error('Matrix is singular');
    aug[col] = aug[col].map(v => v / pivot);
    for (let r = 0; r < n; r++) {
      if (r !== col) {
        const factor = aug[r][col];
        aug[r] = aug[r].map((v, c) => v - factor * aug[col][c]);
      }
    }
  }

  return aug.map(row => row.slice(n));
}

const tool: Tool = {
  id: 'matrix-calc',
  name: 'Matrix Calculator',
  description: 'Matrix arithmetic: add, subtract, multiply, transpose, determinant, and inverse. Supports up to 5×5 matrices.',
  category: 'math',
  tags: ['matrix', 'calculator', 'linear algebra', 'determinant', 'inverse', 'transpose', 'multiply'],
  inputs: [
    {
      id: 'matrixA',
      label: 'Matrix A (rows, space/comma-separated values)',
      type: 'textarea',
      placeholder: '1 2 3\n4 5 6\n7 8 9',
      rows: 5,
    },
    {
      id: 'matrixB',
      label: 'Matrix B (for add/subtract/multiply)',
      type: 'textarea',
      placeholder: '1 0 0\n0 1 0\n0 0 1',
      rows: 5,
      required: false,
    },
  ],
  options: [
    {
      id: 'operation',
      label: 'Operation',
      type: 'select',
      default: 'transpose',
      options: [
        { label: 'Add (A + B)', value: 'add' },
        { label: 'Subtract (A - B)', value: 'subtract' },
        { label: 'Multiply (A × B)', value: 'multiply' },
        { label: 'Transpose (Aᵀ)', value: 'transpose' },
        { label: 'Determinant (|A|)', value: 'determinant' },
        { label: 'Inverse (A⁻¹)', value: 'inverse' },
      ],
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const rawA = inputs.matrixA as string;
    if (!rawA.trim()) throw new Error('Matrix A is required');

    const A = parseMatrix(rawA);
    const op = options.operation as string;

    let result: string;

    if (op === 'transpose') {
      const T = transpose(A);
      result = `Transpose of A:\n${formatMatrix(T)}`;
    } else if (op === 'determinant') {
      const det = determinant(A);
      result = `det(A) = ${parseFloat(det.toPrecision(10))}`;
    } else if (op === 'inverse') {
      const inv = inverse(A);
      result = `A⁻¹ =\n${formatMatrix(inv)}`;
    } else {
      const rawB = inputs.matrixB as string;
      if (!rawB?.trim()) throw new Error(`Matrix B is required for operation: ${op}`);
      const B = parseMatrix(rawB);

      if (op === 'add') {
        const C = addMatrices(A, B);
        result = `A + B =\n${formatMatrix(C)}`;
      } else if (op === 'subtract') {
        const C = subtractMatrices(A, B);
        result = `A - B =\n${formatMatrix(C)}`;
      } else {
        const C = multiplyMatrices(A, B);
        result = `A × B =\n${formatMatrix(C)}`;
      }
    }

    return { type: 'text', data: result };
  },
};

registry.register(tool);
export default tool;
