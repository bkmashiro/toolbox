import type { CategoryMeta } from './types';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'video',     label: 'Video',     icon: '🎬', order: 0 },
  { id: 'gif',       label: 'GIF',       icon: '🎞️', order: 1 },
  { id: 'audio',     label: 'Audio',     icon: '🎵', order: 2 },
  { id: 'image',     label: 'Image',     icon: '🖼️', order: 3 },
  { id: 'pdf',       label: 'PDF',       icon: '📄', order: 4 },
  { id: 'data',      label: 'Data',      icon: '📊', order: 5 },
  { id: 'text',      label: 'Text',      icon: '📝', order: 6 },
  { id: 'crypto',    label: 'Crypto',    icon: '🔐', order: 7 },
  { id: 'network',   label: 'Network',   icon: '🌐', order: 8 },
  { id: 'developer', label: 'Developer', icon: '💻', order: 9 },
  { id: 'math',      label: 'Math',      icon: '🔢', order: 10 },
  { id: 'misc',      label: 'Misc',      icon: '🧰', order: 11 },
];
