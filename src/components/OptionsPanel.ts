import { Component } from './base';
import type { ToolOption } from '../core/types';
import { DropZone } from './DropZone';

interface OptionsPanelConfig {
  options: ToolOption[];
  values: Record<string, unknown>;
  onChange(optionId: string, value: unknown): void;
}

export class OptionsPanel extends Component {
  private config: OptionsPanelConfig;
  private values: Record<string, unknown>;
  private controlEls: Map<string, HTMLElement> = new Map();
  private dropzones: Map<string, DropZone> = new Map();

  constructor(config: OptionsPanelConfig) {
    super('div', 'options-panel card card-body');
    this.config = config;
    this.values = { ...config.values };
    this.build();
  }

  private build(): void {
    const { options } = this.config;

    const header = document.createElement('div');
    header.className = 'collapsible-header';
    const titleEl = document.createElement('span');
    titleEl.style.fontWeight = 'var(--font-weight-semibold)';
    titleEl.style.fontSize = 'var(--font-size-sm)';
    titleEl.textContent = 'Options';
    const chevron = document.createElement('span');
    chevron.className = 'collapsible-chevron open';
    chevron.textContent = '▼';
    header.appendChild(titleEl);
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.style.marginTop = 'var(--space-3)';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = 'var(--space-3)';

    const normalOptions = options.filter(o => !o.advanced);
    const advancedOptions = options.filter(o => o.advanced);

    for (const opt of normalOptions) {
      const group = this.buildOptionControl(opt);
      body.appendChild(group);
    }

    if (advancedOptions.length > 0) {
      const advSection = this.buildAdvancedSection(advancedOptions);
      body.appendChild(advSection);
    }

    // Toggle collapse
    let isOpen = true;
    header.addEventListener('click', () => {
      isOpen = !isOpen;
      body.style.display = isOpen ? 'flex' : 'none';
      chevron.classList.toggle('open', isOpen);
    });

    this.el.appendChild(header);
    this.el.appendChild(body);

    // Initial conditional visibility
    this.updateConditionals();
  }

  private buildAdvancedSection(opts: ToolOption[]): HTMLElement {
    const section = document.createElement('div');
    const header = document.createElement('div');
    header.className = 'collapsible-header';
    header.style.borderTop = '1px solid var(--color-border)';
    header.style.paddingTop = 'var(--space-2)';
    const title = document.createElement('span');
    title.style.fontSize = 'var(--font-size-xs)';
    title.style.color = 'var(--color-text-muted)';
    title.style.fontWeight = 'var(--font-weight-medium)';
    title.textContent = 'Advanced';
    const chevron = document.createElement('span');
    chevron.textContent = '▼';
    chevron.className = 'collapsible-chevron';
    header.appendChild(title);
    header.appendChild(chevron);

    const body = document.createElement('div');
    body.style.display = 'none';
    body.style.flexDirection = 'column';
    body.style.gap = 'var(--space-3)';
    body.style.marginTop = 'var(--space-2)';

    for (const opt of opts) {
      body.appendChild(this.buildOptionControl(opt));
    }

    let isOpen = false;
    header.addEventListener('click', () => {
      isOpen = !isOpen;
      body.style.display = isOpen ? 'flex' : 'none';
      chevron.classList.toggle('open', isOpen);
    });

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  private buildOptionControl(opt: ToolOption): HTMLElement {
    const group = document.createElement('div');
    group.className = 'form-group';
    group.dataset['optionId'] = opt.id;

    const currentVal = this.values[opt.id] ?? opt.default;

    let control: HTMLElement;

    switch (opt.type) {
      case 'select': {
        const sel = document.createElement('select');
        sel.className = 'form-select';
        (opt.options ?? []).forEach(o => {
          const option = document.createElement('option');
          option.value = String(o.value);
          option.textContent = o.label;
          if (String(o.value) === String(currentVal)) option.selected = true;
          sel.appendChild(option);
        });
        sel.addEventListener('change', () => {
          this.setValue(opt.id, sel.value);
        });
        control = sel;
        break;
      }

      case 'range': {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-range';
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(opt.min ?? 0);
        input.max = String(opt.max ?? 100);
        input.step = String(opt.step ?? 1);
        input.value = String(currentVal);
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'form-range-value';
        valueDisplay.textContent = String(currentVal);
        input.addEventListener('input', () => {
          valueDisplay.textContent = input.value;
          this.setValue(opt.id, Number(input.value));
        });
        wrapper.appendChild(input);
        wrapper.appendChild(valueDisplay);
        control = wrapper;
        break;
      }

      case 'number': {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-input';
        if (opt.min !== undefined) input.min = String(opt.min);
        if (opt.max !== undefined) input.max = String(opt.max);
        if (opt.step !== undefined) input.step = String(opt.step);
        input.value = String(currentVal);
        if (opt.placeholder) input.placeholder = opt.placeholder;
        input.addEventListener('change', () => {
          this.setValue(opt.id, Number(input.value));
        });
        control = input;
        break;
      }

      case 'text': {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.value = String(currentVal ?? '');
        if (opt.placeholder) input.placeholder = opt.placeholder;
        input.addEventListener('input', () => {
          this.setValue(opt.id, input.value);
        });
        control = input;
        break;
      }

      case 'textarea': {
        const ta = document.createElement('textarea');
        ta.className = 'form-textarea';
        ta.value = String(currentVal ?? '');
        if (opt.placeholder) ta.placeholder = opt.placeholder;
        ta.addEventListener('input', () => {
          this.setValue(opt.id, ta.value);
        });
        control = ta;
        break;
      }

      case 'checkbox': {
        const wrapper = document.createElement('label');
        wrapper.className = 'form-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(currentVal);
        input.addEventListener('change', () => {
          this.setValue(opt.id, input.checked);
        });
        const labelText = document.createElement('span');
        labelText.textContent = opt.label;
        labelText.style.fontSize = 'var(--font-size-sm)';
        wrapper.appendChild(input);
        wrapper.appendChild(labelText);
        // Add label inline, skip outer label below
        this.controlEls.set(opt.id, group);
        group.appendChild(wrapper);
        if (opt.helpText) {
          const help = document.createElement('div');
          help.className = 'form-help';
          help.textContent = opt.helpText;
          group.appendChild(help);
        }
        return group;
      }

      case 'color': {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = 'var(--space-2)';
        const input = document.createElement('input');
        input.type = 'color';
        input.value = String(currentVal ?? '#000000');
        input.style.width = '40px';
        input.style.height = '32px';
        input.style.cursor = 'pointer';
        const hexText = document.createElement('span');
        hexText.style.fontSize = 'var(--font-size-xs)';
        hexText.style.fontFamily = 'var(--font-family-mono)';
        hexText.textContent = String(currentVal ?? '#000000');
        input.addEventListener('input', () => {
          hexText.textContent = input.value;
          this.setValue(opt.id, input.value);
        });
        wrapper.appendChild(input);
        wrapper.appendChild(hexText);
        control = wrapper;
        break;
      }

      case 'file':
      case 'multifile': {
        const dz = new DropZone({
          accept: opt.accept,
          multiple: opt.type === 'multifile',
          onFiles: (files) => {
            this.setValue(opt.id, opt.type === 'multifile' ? files : files[0] ?? null);
          },
        });
        this.dropzones.set(opt.id, dz);
        control = dz.getElement();
        break;
      }

      default:
        control = document.createElement('div');
    }

    this.controlEls.set(opt.id, group);

    const label = document.createElement('label');
    label.className = 'form-label';
    label.textContent = opt.label;

    group.appendChild(label);
    group.appendChild(control);

    if (opt.helpText) {
      const help = document.createElement('div');
      help.className = 'form-help';
      help.textContent = opt.helpText;
      group.appendChild(help);
    }

    return group;
  }

  private setValue(id: string, value: unknown): void {
    this.values[id] = value;
    this.config.onChange(id, value);
    this.updateConditionals();
  }

  private updateConditionals(): void {
    for (const opt of this.config.options) {
      if (!opt.showWhen) continue;
      const el = this.controlEls.get(opt.id);
      if (!el) continue;
      const condVal = this.values[opt.showWhen.optionId] ?? this.config.options.find(o => o.id === opt.showWhen!.optionId)?.default;
      const visible = String(condVal) === String(opt.showWhen.value);
      el.style.display = visible ? '' : 'none';
    }
  }

  getValues(): Record<string, unknown> {
    return { ...this.values };
  }

  destroy(): void {
    for (const dz of this.dropzones.values()) {
      dz.destroy();
    }
  }
}
