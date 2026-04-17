/**
 * Shared PDF utility helpers for pdf-lib and pdfjs-dist tools.
 */

/**
 * Load a File as a PDFDocument using pdf-lib.
 */
export async function loadPDFLib(file: File) {
  const { PDFDocument } = await import('pdf-lib');
  const buffer = await file.arrayBuffer();
  return PDFDocument.load(buffer);
}

/**
 * Parse a page range string like "1-3, 5, 7-9" into a 0-based index array.
 * Pages are 1-indexed in the input string.
 * @param rangeStr - e.g. "1-3, 5, 7-9"
 * @param total - total number of pages in the document
 * @returns sorted unique 0-based page indices
 */
export function parsePageRange(rangeStr: string, total: number): number[] {
  if (!rangeStr || rangeStr.trim().toLowerCase() === 'all') {
    return Array.from({ length: total }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const rangeParts = part.split('-').map((s) => s.trim());
    if (rangeParts.length === 1) {
      const n = parseInt(rangeParts[0], 10);
      if (!isNaN(n) && n >= 1 && n <= total) {
        indices.add(n - 1);
      }
    } else if (rangeParts.length === 2) {
      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(total, end); i++) {
          indices.add(i - 1);
        }
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Render a single pdfjs page to a canvas at the given scale.
 * Returns the canvas element.
 */
export async function renderPageToCanvas(
  page: import('pdfjs-dist').PDFPageProxy,
  scale: number
): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
  return canvas;
}

/**
 * Get a Uint8Array from a pdf-lib PDFDocument.
 */
export async function savePDFLib(doc: import('pdf-lib').PDFDocument): Promise<Blob> {
  const bytes = await doc.save();
  return new Blob([bytes], { type: 'application/pdf' });
}
