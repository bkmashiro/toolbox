import './image-crop.css';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

type HandleName = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

interface CropCanvasOptions {
  aspectRatio?: AspectRatio;
  onChange?: (rect: CropRect) => void;
}

export class CropCanvas {
  private container: HTMLDivElement;
  private img: HTMLImageElement;
  private selection: HTMLDivElement;
  private handles: Map<HandleName, HTMLDivElement> = new Map();

  private imgW = 0;
  private imgH = 0;
  private rect: CropRect = { x: 0, y: 0, w: 0, h: 0 };
  private aspectRatio: AspectRatio = 'free';
  private onChange?: (rect: CropRect) => void;

  private dragHandle: HandleName | null = null;
  private dragStart = { mx: 0, my: 0, rx: 0, ry: 0, rw: 0, rh: 0 };

  constructor(parent: HTMLElement, imageSrc: string, options: CropCanvasOptions = {}) {
    this.aspectRatio = options.aspectRatio ?? 'free';
    this.onChange = options.onChange;

    this.container = document.createElement('div');
    this.container.className = 'crop-container';

    this.img = document.createElement('img');
    this.img.className = 'crop-image';
    this.img.src = imageSrc;
    this.img.onload = () => this.init();

    this.selection = document.createElement('div');
    this.selection.className = 'crop-selection';

    const overlay = document.createElement('div');
    overlay.className = 'crop-overlay';

    const handleNames: HandleName[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    for (const name of handleNames) {
      const h = document.createElement('div');
      h.className = `crop-handle crop-handle-${name}`;
      h.dataset['handle'] = name;
      this.selection.appendChild(h);
      this.handles.set(name, h);
    }

    this.container.appendChild(this.img);
    this.container.appendChild(overlay);
    overlay.appendChild(this.selection);

    parent.appendChild(this.container);

    this.bindEvents();
  }

  private init() {
    this.imgW = this.img.offsetWidth;
    this.imgH = this.img.offsetHeight;

    const padding = 20;
    this.rect = {
      x: padding,
      y: padding,
      w: this.imgW - padding * 2,
      h: this.imgH - padding * 2,
    };
    this.applyAspect();
    this.render();
  }

  private bindEvents() {
    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const { x: mx, y: my } = this.getPointer(e);
      const target = e.target as HTMLElement;
      const handle = target.dataset['handle'] as HandleName | undefined;

      if (handle) {
        this.dragHandle = handle;
      } else if (target === this.selection) {
        this.dragHandle = 'move';
      } else {
        return;
      }

      this.dragStart = {
        mx,
        my,
        rx: this.rect.x,
        ry: this.rect.y,
        rw: this.rect.w,
        rh: this.rect.h,
      };
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.dragHandle) return;
      e.preventDefault();
      const { x: mx, y: my } = this.getPointer(e);
      const dx = mx - this.dragStart.mx;
      const dy = my - this.dragStart.my;
      this.applyDrag(dx, dy);
      this.render();
    };

    const onUp = () => {
      this.dragHandle = null;
    };

    this.container.addEventListener('mousedown', onDown);
    this.container.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  private getPointer(e: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    const t = e.touches[0];
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }

  private applyDrag(dx: number, dy: number) {
    const s = this.dragStart;
    const { imgW, imgH } = this;

    let { rx, ry, rw, rh } = s;

    if (this.dragHandle === 'move') {
      rx = Math.max(0, Math.min(imgW - rw, rx + dx));
      ry = Math.max(0, Math.min(imgH - rh, ry + dy));
      this.rect = { x: rx, y: ry, w: rw, h: rh };
      return;
    }

    const h = this.dragHandle!;
    if (h.includes('e')) rw = Math.max(10, Math.min(imgW - rx, rw + dx));
    if (h.includes('s')) rh = Math.max(10, Math.min(imgH - ry, rh + dy));
    if (h.includes('w')) {
      const nw = Math.max(10, rw - dx);
      rx = rx + rw - nw;
      rw = nw;
    }
    if (h.includes('n')) {
      const nh = Math.max(10, rh - dy);
      ry = ry + rh - nh;
      rh = nh;
    }

    this.rect = { x: rx, y: ry, w: rw, h: rh };
    this.applyAspect();
  }

  private applyAspect() {
    if (this.aspectRatio === 'free') return;
    const ratios: Record<string, number> = {
      '1:1': 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '3:2': 3 / 2,
    };
    const ratio = ratios[this.aspectRatio];
    if (!ratio) return;
    this.rect.h = Math.round(this.rect.w / ratio);
  }

  private render() {
    const { x, y, w, h } = this.rect;
    this.selection.style.left = `${x}px`;
    this.selection.style.top = `${y}px`;
    this.selection.style.width = `${w}px`;
    this.selection.style.height = `${h}px`;
    this.onChange?.(this.getCropRect());
  }

  setAspectRatio(ar: AspectRatio) {
    this.aspectRatio = ar;
    this.applyAspect();
    this.render();
  }

  /** Returns crop rect in natural image coordinates (accounting for display scaling) */
  getCropRect(): CropRect {
    const scaleX = (this.img.naturalWidth || this.imgW) / (this.imgW || 1);
    const scaleY = (this.img.naturalHeight || this.imgH) / (this.imgH || 1);
    return {
      x: Math.round(this.rect.x * scaleX),
      y: Math.round(this.rect.y * scaleY),
      w: Math.round(this.rect.w * scaleX),
      h: Math.round(this.rect.h * scaleY),
    };
  }

  destroy() {
    this.container.remove();
  }
}
