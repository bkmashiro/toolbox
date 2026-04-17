import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

const tool: Tool = {
  id: 'pomodoro',
  name: 'Pomodoro Timer',
  description: 'Start a Pomodoro focus timer with browser notifications when the session ends',
  category: 'misc',
  tags: ['pomodoro', 'timer', 'focus', 'productivity', 'break', 'notification', 'countdown'],
  inputs: [
    {
      id: 'task',
      label: 'Task name (optional)',
      type: 'text',
      placeholder: 'e.g. Write documentation',
      required: false,
    },
  ],
  options: [
    {
      id: 'work',
      label: 'Work duration (minutes)',
      type: 'number',
      default: 25,
      min: 1,
      max: 120,
      step: 1,
    },
    {
      id: 'break',
      label: 'Break duration (minutes)',
      type: 'number',
      default: 5,
      min: 1,
      max: 60,
      step: 1,
    },
  ],
  output: { type: 'text' },
  apiSupported: false,

  async run(inputs, options) {
    const task = (inputs.task as string) || 'Pomodoro';
    const workMin = parseInt((options.work as string) || '25');
    const breakMin = parseInt((options.break as string) || '5');

    if ('Notification' in globalThis && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(`🍅 ${task} complete!`, { body: `Take a ${breakMin}-minute break.` });
      }
    }, workMin * 60 * 1000);

    return {
      type: 'text',
      data: `Timer started!\n\n⏱ ${workMin} min work session for: ${task}\nYou'll get a browser notification when done.\n\nBreak: ${breakMin} min`,
    };
  },
};

registry.register(tool);
export default tool;
