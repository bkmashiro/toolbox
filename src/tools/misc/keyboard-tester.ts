import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'keyboard-tester',
  name: 'Keyboard Tester',
  description: 'Press any key to see its keyCode, key name, code, location, and modifier state in real-time',
  category: 'misc',
  tags: ['keyboard', 'tester', 'keycode', 'key', 'event', 'shortcut', 'modifier', 'input'],
  inputs: [],
  options: [],
  output: { type: 'html' },
  apiSupported: false,

  async run() {
    const html = `
<style>
#kb-container {
  font-family: monospace;
  padding: 16px;
  text-align: center;
  user-select: none;
}
#kb-prompt {
  font-size: 1rem;
  color: #868e96;
  margin-bottom: 16px;
  padding: 24px;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}
#kb-result { display: none; }
#kb-key-badge {
  font-size: 2.5rem;
  font-weight: 700;
  background: #228be6;
  color: #fff;
  border-radius: 8px;
  padding: 8px 24px;
  display: inline-block;
  min-width: 80px;
  margin-bottom: 16px;
}
.kb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-width: 480px;
  margin: 0 auto 16px;
}
.kb-item {
  background: #f1f3f5;
  border-radius: 6px;
  padding: 8px;
  font-size: 0.8rem;
  text-align: left;
}
.kb-label { color: #868e96; font-size: 0.7rem; display: block; margin-bottom: 2px; }
.kb-value { font-weight: 600; word-break: break-all; }
.kb-mods { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.kb-mod { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
.kb-mod-on { background: #d3f9d8; color: #2f9e44; }
.kb-mod-off { background: #e9ecef; color: #868e96; }
#kb-history { margin-top: 16px; text-align: left; max-height: 200px; overflow-y: auto; }
#kb-history-title { font-size: 0.75rem; color: #868e96; margin-bottom: 4px; }
.kb-hist-item { font-size: 0.75rem; padding: 2px 0; border-bottom: 1px solid #f1f3f5; display: flex; gap: 8px; }
</style>

<div id="kb-container" tabindex="0">
  <div id="kb-prompt">
    Click here, then press any key<br>
    <span style="font-size:0.8rem;color:#adb5bd">(click this area to focus it)</span>
  </div>
  <div id="kb-result">
    <div id="kb-key-badge">?</div>
    <div class="kb-grid">
      <div class="kb-item"><span class="kb-label">key</span><div class="kb-value" id="kb-key"></div></div>
      <div class="kb-item"><span class="kb-label">code</span><div class="kb-value" id="kb-code"></div></div>
      <div class="kb-item"><span class="kb-label">keyCode</span><div class="kb-value" id="kb-keycode"></div></div>
      <div class="kb-item"><span class="kb-label">charCode</span><div class="kb-value" id="kb-charcode"></div></div>
      <div class="kb-item"><span class="kb-label">which</span><div class="kb-value" id="kb-which"></div></div>
      <div class="kb-item"><span class="kb-label">location</span><div class="kb-value" id="kb-location"></div></div>
    </div>
    <div class="kb-mods">
      <div class="kb-mod kb-mod-off" id="kb-ctrl">Ctrl</div>
      <div class="kb-mod kb-mod-off" id="kb-shift">Shift</div>
      <div class="kb-mod kb-mod-off" id="kb-alt">Alt</div>
      <div class="kb-mod kb-mod-off" id="kb-meta">Meta/Cmd</div>
    </div>
    <div id="kb-history">
      <div id="kb-history-title">Key history:</div>
    </div>
  </div>
</div>

<script>
const container = document.getElementById('kb-container');
const prompt = document.getElementById('kb-prompt');
const result = document.getElementById('kb-result');
const history = document.getElementById('kb-history');
const locNames = ['Standard','Left','Right','Numpad','','','','Mobile'];

container.addEventListener('keydown', (e) => {
  e.preventDefault();
  prompt.style.display = 'none';
  result.style.display = 'block';

  const badge = document.getElementById('kb-key-badge');
  badge.textContent = e.key.length === 1 ? e.key : e.key;

  document.getElementById('kb-key').textContent = e.key;
  document.getElementById('kb-code').textContent = e.code;
  document.getElementById('kb-keycode').textContent = e.keyCode;
  document.getElementById('kb-charcode').textContent = e.charCode;
  document.getElementById('kb-which').textContent = e.which;
  document.getElementById('kb-location').textContent = locNames[e.location] || e.location;

  const mods = [
    ['kb-ctrl', e.ctrlKey],
    ['kb-shift', e.shiftKey],
    ['kb-alt', e.altKey],
    ['kb-meta', e.metaKey],
  ];
  for (const [id, active] of mods) {
    const el = document.getElementById(id);
    el.className = 'kb-mod ' + (active ? 'kb-mod-on' : 'kb-mod-off');
  }

  const item = document.createElement('div');
  item.className = 'kb-hist-item';
  item.innerHTML = \`<span style="color:#868e96">\${new Date().toLocaleTimeString()}</span><span>\${e.key}</span><span style="color:#adb5bd">\${e.code}</span><span style="color:#adb5bd">kc:\${e.keyCode}</span>\`;
  history.appendChild(item);
  history.scrollTop = history.scrollHeight;
});

container.addEventListener('focus', () => { container.style.outline = '2px solid #228be6'; });
container.addEventListener('blur', () => { container.style.outline = ''; });
container.focus();
</script>`;

    return { type: 'html', data: html };
  },
};

registry.register(tool);
export default tool;
