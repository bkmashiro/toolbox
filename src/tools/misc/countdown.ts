import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'countdown',
  name: 'Countdown',
  description: 'Countdown timer (to a target date or duration) and stopwatch with lap times',
  category: 'misc',
  tags: ['countdown', 'timer', 'stopwatch', 'lap', 'clock', 'alarm'],
  inputs: [],
  options: [
    {
      id: 'mode',
      label: 'Mode',
      type: 'select',
      default: 'stopwatch',
      options: [
        { label: 'Stopwatch', value: 'stopwatch' },
        { label: 'Countdown Timer', value: 'countdown' },
      ],
    },
    {
      id: 'hours',
      label: 'Hours',
      type: 'number',
      default: 0,
      min: 0,
      max: 23,
      step: 1,
      showWhen: { optionId: 'mode', value: 'countdown' },
    },
    {
      id: 'minutes',
      label: 'Minutes',
      type: 'number',
      default: 5,
      min: 0,
      max: 59,
      step: 1,
      showWhen: { optionId: 'mode', value: 'countdown' },
    },
    {
      id: 'seconds',
      label: 'Seconds',
      type: 'number',
      default: 0,
      min: 0,
      max: 59,
      step: 1,
      showWhen: { optionId: 'mode', value: 'countdown' },
    },
    {
      id: 'alarmSound',
      label: 'Play alarm when done',
      type: 'checkbox',
      default: true,
      showWhen: { optionId: 'mode', value: 'countdown' },
    },
  ],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs, options) {
    const mode = options.mode as string;
    const totalSecs = mode === 'countdown'
      ? (options.hours as number) * 3600 + (options.minutes as number) * 60 + (options.seconds as number)
      : 0;
    const alarmSound = options.alarmSound as boolean;

    const html = `
<style>
#cd-wrap { text-align: center; padding: 24px; font-family: monospace; }
#cd-time { font-size: 4rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 16px; color: #212529; }
.cd-btn {
  padding: 8px 20px; border-radius: 999px; border: none; cursor: pointer;
  font-weight: 600; font-size: 0.875rem; transition: all 150ms; margin: 0 4px;
}
.cd-btn-primary { background: #228be6; color: #fff; }
.cd-btn-primary:hover { background: #1c7ed6; }
.cd-btn-secondary { background: #e9ecef; color: #495057; }
.cd-btn-secondary:hover { background: #dee2e6; }
.cd-btn-danger { background: #e03131; color: #fff; }
.cd-btn-danger:hover { background: #c92a2a; }
#cd-laps { max-height: 200px; overflow-y: auto; margin-top: 16px; font-size: 0.8rem; }
.cd-lap-item { padding: 4px 0; border-bottom: 1px solid #f1f3f5; display: flex; justify-content: space-between; }
#cd-status { font-size: 0.85rem; color: #868e96; margin-bottom: 12px; }
</style>

<div id="cd-wrap">
  <div id="cd-status">${mode === 'countdown' ? 'Countdown' : 'Stopwatch'}</div>
  <div id="cd-time">00:00:00.000</div>
  <div id="cd-controls">
    <button class="cd-btn cd-btn-primary" id="cd-start">Start</button>
    ${mode === 'stopwatch' ? '<button class="cd-btn cd-btn-secondary" id="cd-lap">Lap</button>' : ''}
    <button class="cd-btn cd-btn-secondary" id="cd-reset">Reset</button>
  </div>
  <div id="cd-laps"></div>
</div>

<script>
const MODE = ${JSON.stringify(mode)};
const TOTAL_MS = ${totalSecs * 1000};
const ALARM = ${alarmSound};

let running = false;
let startTime = null;
let elapsed = 0;
let raf = null;
let lapCount = 0;
let lapStart = 0;

const timeEl = document.getElementById('cd-time');
const startBtn = document.getElementById('cd-start');
const resetBtn = document.getElementById('cd-reset');
const lapBtn = document.getElementById('cd-lap');
const lapsEl = document.getElementById('cd-laps');
const statusEl = document.getElementById('cd-status');

function fmt(ms) {
  const sign = ms < 0 ? '-' : '';
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return sign + [h, m, s].map(v => String(v).padStart(2, '0')).join(':') + '.' + String(cs).padStart(2, '0') + '0';
}

function tick() {
  const now = Date.now();
  const curr = elapsed + (now - startTime);
  if (MODE === 'countdown') {
    const remaining = TOTAL_MS - curr;
    if (remaining <= 0) {
      timeEl.textContent = '00:00:00.00';
      timeEl.style.color = '#e03131';
      statusEl.textContent = 'Done!';
      running = false;
      startBtn.textContent = 'Start';
      if (ALARM) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
      return;
    }
    timeEl.textContent = fmt(remaining);
    timeEl.style.color = remaining < 10000 ? '#e03131' : '#212529';
  } else {
    timeEl.textContent = fmt(curr);
  }
  raf = requestAnimationFrame(tick);
}

startBtn.addEventListener('click', () => {
  if (running) {
    running = false;
    elapsed += Date.now() - startTime;
    startBtn.textContent = 'Resume';
    cancelAnimationFrame(raf);
  } else {
    if (MODE === 'countdown' && elapsed === 0 && TOTAL_MS === 0) return;
    running = true;
    startTime = Date.now();
    startBtn.textContent = 'Pause';
    raf = requestAnimationFrame(tick);
  }
});

resetBtn.addEventListener('click', () => {
  running = false;
  cancelAnimationFrame(raf);
  elapsed = 0;
  lapCount = 0;
  lapStart = 0;
  startBtn.textContent = 'Start';
  timeEl.style.color = '#212529';
  timeEl.textContent = MODE === 'countdown' ? fmt(TOTAL_MS) : '00:00:00.000';
  statusEl.textContent = MODE === 'countdown' ? 'Countdown' : 'Stopwatch';
  lapsEl.innerHTML = '';
});

if (lapBtn) {
  lapBtn.addEventListener('click', () => {
    if (!running) return;
    lapCount++;
    const curr = elapsed + (Date.now() - startTime);
    const lapTime = curr - lapStart;
    lapStart = curr;
    const item = document.createElement('div');
    item.className = 'cd-lap-item';
    item.innerHTML = '<span>Lap ' + lapCount + '</span><span>' + fmt(lapTime) + '</span><span style="color:#868e96">' + fmt(curr) + '</span>';
    lapsEl.prepend(item);
  });
}

// Initialize display
timeEl.textContent = MODE === 'countdown' ? fmt(TOTAL_MS) : '00:00:00.00';
</script>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
