/**
 * Tool categories. Each tool belongs to exactly one category.
 * The sidebar renders categories in this order.
 */
export type ToolCategory =
  | 'video'
  | 'gif'
  | 'audio'
  | 'image'
  | 'pdf'
  | 'data'
  | 'text'
  | 'crypto'
  | 'network'
  | 'developer'
  | 'math'
  | 'misc';

/**
 * Category metadata for sidebar rendering.
 */
export interface CategoryMeta {
  id: ToolCategory;
  label: string;
  icon: string; // emoji or SVG path
  order: number;
}

/**
 * A single option that a tool exposes in its options panel.
 */
export interface ToolOption {
  /** Unique within this tool's options */
  id: string;
  /** Human-readable label */
  label: string;
  /** Input control type */
  type: 'select' | 'range' | 'number' | 'text' | 'checkbox' | 'textarea' | 'file' | 'multifile' | 'color';
  /** Default value. Type depends on `type`:
   *  - select: string | number (the value of the default option)
   *  - range/number: number
   *  - text/textarea: string
   *  - checkbox: boolean
   *  - file/multifile: null (no default)
   *  - color: string (hex)
   */
  default: unknown;
  /** For select type: the list of options */
  options?: { label: string; value: string | number }[];
  /** For range/number: min value */
  min?: number;
  /** For range/number: max value */
  max?: number;
  /** For range/number: step */
  step?: number;
  /** For file/multifile: accepted MIME types or extensions (e.g. ".srt,.vtt" or "video/*") */
  accept?: string;
  /** Placeholder text for text/textarea */
  placeholder?: string;
  /** Help text shown below the control */
  helpText?: string;
  /** If true, this option is shown in an "Advanced" collapsible section */
  advanced?: boolean;
  /** Conditional visibility: only show this option when another option has a specific value */
  showWhen?: { optionId: string; value: unknown };
}

/**
 * A single input that a tool requires.
 * Tools can have 1+ inputs.
 */
export interface ToolInput {
  /** Unique within this tool's inputs */
  id: string;
  /** Human-readable label */
  label: string;
  /** Input type */
  type: 'file' | 'multifile' | 'text' | 'textarea';
  /** For file/multifile: accepted MIME types or extensions */
  accept?: string;
  /** For file/multifile: max file size in bytes. Default: no limit */
  maxSize?: number;
  /** For text/textarea: placeholder text */
  placeholder?: string;
  /** Whether this input is required. Default: true */
  required?: boolean;
  /** For textarea: number of visible rows. Default: 6 */
  rows?: number;
}

/**
 * Describes what type of output a tool produces.
 */
export interface ToolOutputDescriptor {
  /** Primary output type */
  type: 'file' | 'files' | 'text' | 'json' | 'image' | 'video' | 'audio' | 'html';
  /** For file outputs: default filename */
  defaultFilename?: string;
  /** For file outputs: MIME type */
  defaultMimeType?: string;
}

/**
 * Progress callback signature.
 * @param percent - 0 to 100
 * @param message - optional status message (e.g. "Encoding frame 42/100")
 */
export type ProgressCallback = (percent: number, message?: string) => void;

/**
 * The result of running a tool.
 */
export interface ToolResult {
  /** What type of result this is */
  type: 'file' | 'files' | 'text' | 'json' | 'html';
  /** The result data:
   *  - file: Blob
   *  - files: Blob[]
   *  - text: string
   *  - json: unknown (will be JSON.stringify'd for display)
   *  - html: string (rendered in sandboxed iframe)
   */
  data: Blob | Blob[] | string | unknown;
  /** For single file output: suggested filename */
  filename?: string;
  /** For multi-file output: suggested filenames (parallel array with data) */
  filenames?: string[];
  /** MIME type for file output */
  mimeType?: string;
  /** Data URL string for image/video/audio preview */
  preview?: string;
  /** Human-readable summary shown above the output (e.g. "Compressed from 5.2 MB to 1.1 MB (79% reduction)") */
  summary?: string;
}

/**
 * A tool definition. Each tool file default-exports an object implementing this interface.
 */
export interface Tool {
  /** Unique identifier, used in URL params and API paths. Kebab-case. */
  id: string;
  /** Human-readable name shown in the UI */
  name: string;
  /** One-line description */
  description: string;
  /** Category for sidebar grouping */
  category: ToolCategory;
  /** Search tags (lowercase). Include the category, common synonyms, file extensions. */
  tags: string[];
  /** Input definitions */
  inputs: ToolInput[];
  /** Option definitions */
  options: ToolOption[];
  /** Output descriptor */
  output: ToolOutputDescriptor;
  /** Whether this tool has a CF Pages Functions API endpoint */
  apiSupported: boolean;
  /** Names of heavy dependencies this tool needs (for lazy-load UI hints).
   *  e.g. ['ffmpeg'] shows "This tool requires FFmpeg (~30 MB download)" on first use. */
  heavyDeps?: string[];
  /** The main execution function */
  run(
    inputs: Record<string, File | File[] | string>,
    options: Record<string, unknown>,
    onProgress?: ProgressCallback
  ): Promise<ToolResult>;
}

/**
 * Favorites and recent tools, persisted in localStorage.
 */
export interface UserPreferences {
  favorites: string[]; // tool IDs
  recent: string[]; // tool IDs, most recent first, max 20
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  optionsPanelCollapsed: boolean;
}
