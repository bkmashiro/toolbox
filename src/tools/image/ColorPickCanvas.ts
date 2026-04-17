import './color-pick.css';

export interface PickedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    default: h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export class ColorPickCanvas {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private crosshair: HTMLDivElement;
  private swatch: HTMLDivElement;
  private valuesEl: HTMLDivElement;
  private ctx: CanvasRenderingContext2D;
  private imgW = 0;
  private imgH = 0;

  private onPick?: (color: PickedColor) => void;

  constructor(parent: HTMLElement, imageSrc: string, opts: { onPick?: (c: PickedColor) => void } = {}) {
    this.onPick = opts.onPick;

    this.container = document.createElement('div');
    this.container.className = 'color-pick-container';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'color-pick-image';
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;

    this.crosshair = document.createElement('div');
    this.crosshair.className = 'color-pick-crosshair';

    const preview = document.createElement('div');
    preview.className = 'color-pick-preview';

    this.swatch = document.createElement('div');
    this.swatch.className = 'color-pick-swatch';
    this.swatch.style.background = '#ccc';

    this.valuesEl = document.createElement('div');
    this.valuesEl.className = 'color-pick-values';
    this.valuesEl.textContent = 'Click image to pick a color';

    preview.appendChild(this.swatch);
    preview.appendChild(this.valuesEl);

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.crosshair);
    parent.appendChild(this.container);
    parent.appendChild(preview);

    const img = new Image();
    img.onload = () => {
      // Scale for display
      const maxW = parent.clientWidth || 800;
      const scale = Math.min(1, maxW / img.naturalWidth);
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      this.canvas.style.width = `${Math.round(img.naturalWidth * scale)}px`;
      this.canvas.style.height = `${Math.round(img.naturalHeight * scale)}px`;
      this.imgW = img.naturalWidth;
      this.imgH = img.naturalHeight;
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = imageSrc;

    this.bindEvents();
  }

  private bindEvents() {
    const onPointerMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      this.crosshair.style.display = 'block';
      this.crosshair.style.left = `${cx}px`;
      this.crosshair.style.top = `${cy}px`;
    };

    const onClick = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.imgW / rect.width;
      const scaleY = this.imgH / rect.height;
      const px = Math.round((e.clientX - rect.left) * scaleX);
      const py = Math.round((e.clientY - rect.top) * scaleY);

      const pixel = this.ctx.getImageData(px, py, 1, 1).data;
      const r = pixel[0], g = pixel[1], b = pixel[2];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      const hsl = rgbToHsl(r, g, b);
      const color: PickedColor = { hex, rgb: { r, g, b }, hsl };

      this.swatch.style.background = hex;
      this.valuesEl.innerHTML = `
        <span title="Click to copy">HEX: ${hex.toUpperCase()}</span>
        <span title="Click to copy">RGB: rgb(${r}, ${g}, ${b})</span>
        <span title="Click to copy">HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)</span>
      `;

      this.valuesEl.querySelectorAll('span').forEach((span) => {
        span.addEventListener('click', () => {
          navigator.clipboard?.writeText(span.textContent?.split(': ')[1] ?? '');
        });
      });

      this.onPick?.(color);
    };

    const onLeave = () => {
      this.crosshair.style.display = 'none';
    };

    this.canvas.addEventListener('mousemove', onPointerMove);
    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('mouseleave', onLeave);
  }

  destroy() {
    this.container.remove();
  }
}
