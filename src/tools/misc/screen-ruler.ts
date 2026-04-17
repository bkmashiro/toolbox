import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'screen-ruler',
  name: 'Screen Ruler',
  description: 'On-screen pixel ruler with draggable handles to measure distances',
  category: 'misc',
  tags: ['ruler', 'screen', 'pixel', 'measure', 'distance', 'px', 'cm', 'inch'],
  inputs: [],
  options: [
    {
      id: 'unit',
      label: 'Unit',
      type: 'select',
      default: 'px',
      options: [
        { label: 'Pixels (px)', value: 'px' },
        { label: 'Centimeters (cm)', value: 'cm' },
        { label: 'Inches (in)', value: 'in' },
      ],
    },
  ],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs, options) {
    const unit = options.unit as string;

    const html = `
<style>
#ruler-wrap { padding: 16px; font-family: monospace; }
#ruler-info { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; color: #228be6; }
#ruler-bar {
  position: relative;
  height: 64px;
  background: repeating-linear-gradient(90deg, transparent, transparent 9px, #dee2e6 9px, #dee2e6 10px);
  background-color: #f1f3f5;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: crosshair;
  touch-action: none;
}
#ruler-highlight {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(34, 139, 230, 0.12);
  border: 2px solid rgba(34, 139, 230, 0.4);
  pointer-events: none;
}
.ruler-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #228be6;
  cursor: col-resize;
  touch-action: none;
}
.ruler-handle:hover { background: #1c7ed6; }
.ruler-handle::after {
  content: attr(data-label);
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  white-space: nowrap;
  color: #228be6;
}
#ruler-ticks {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
}
.tick { position: absolute; top: 0; background: #adb5bd; width: 1px; }
.tick-major { height: 16px; }
.tick-minor { height: 8px; }
.tick-label {
  position: absolute;
  font-size: 9px;
  color: #868e96;
  top: 18px;
  transform: translateX(-50%);
  white-space: nowrap;
}
</style>

<div id="ruler-wrap">
  <div id="ruler-info">Drag the handles to measure</div>
  <div id="ruler-bar">
    <div id="ruler-ticks"></div>
    <div id="ruler-highlight"></div>
    <div class="ruler-handle" id="handle-a" data-label="A" style="left:20px"></div>
    <div class="ruler-handle" id="handle-b" data-label="B" style="left:200px"></div>
  </div>
</div>

<script>
const unit = ${JSON.stringify(unit)};
const bar = document.getElementById('ruler-bar');
const info = document.getElementById('ruler-info');
const highlight = document.getElementById('ruler-highlight');
const ticks = document.getElementById('ruler-ticks');
const handleA = document.getElementById('handle-a');
const handleB = document.getElementById('handle-b');

// Render tick marks
function renderTicks() {
  const w = bar.clientWidth;
  ticks.innerHTML = '';
  const step = 50; // pixels between major ticks
  for (let x = 0; x <= w; x += 10) {
    const major = x % step === 0;
    const tick = document.createElement('div');
    tick.className = 'tick ' + (major ? 'tick-major' : 'tick-minor');
    tick.style.left = x + 'px';
    ticks.appendChild(tick);
    if (major && x > 0) {
      const lbl = document.createElement('div');
      lbl.className = 'tick-label';
      lbl.style.left = x + 'px';
      lbl.textContent = x + 'px';
      ticks.appendChild(lbl);
    }
  }
}
renderTicks();
window.addEventListener('resize', renderTicks);

function getPos(handle) {
  return parseInt(handle.style.left) || 0;
}

function updateDisplay() {
  const a = getPos(handleA);
  const b = getPos(handleB);
  const dist = Math.abs(b - a);
  const left = Math.min(a, b);
  const right = Math.max(a, b);
  highlight.style.left = left + 'px';
  highlight.style.width = (right - left) + 'px';

  let display = dist + ' px';
  if (unit === 'cm') {
    const dpi = window.devicePixelRatio * 96;
    display += ' = ' + (dist / (dpi / 2.54)).toFixed(2) + ' cm';
  } else if (unit === 'in') {
    const dpi = window.devicePixelRatio * 96;
    display += ' = ' + (dist / dpi).toFixed(3) + ' in';
  }
  info.textContent = 'Distance: ' + display;
}
updateDisplay();

function makeDraggable(handle) {
  let dragging = false, startX, startLeft;
  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startLeft = getPos(handle);
    e.preventDefault();
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const barRect = bar.getBoundingClientRect();
    const newLeft = Math.max(0, Math.min(bar.clientWidth - 4, startLeft + e.clientX - startX));
    handle.style.left = newLeft + 'px';
    updateDisplay();
  });
  window.addEventListener('mouseup', () => { dragging = false; });
}
makeDraggable(handleA);
makeDraggable(handleB);
</script>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
