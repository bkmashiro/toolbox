import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { ProgressCallback } from './types';

let instance: FFmpeg | null = null;
let loading: Promise<FFmpeg> | null = null;

/**
 * Get the FFmpeg singleton. First call downloads the WASM core (~30 MB)
 * and shows progress via the callback. Subsequent calls return immediately.
 */
export async function getFFmpeg(
  onProgress?: ProgressCallback
): Promise<FFmpeg> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress, time }) => {
      onProgress?.(Math.round(progress * 100), `Processing... ${(time / 1_000_000).toFixed(1)}s`);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    instance = ffmpeg;
    return ffmpeg;
  })();

  return loading;
}

/**
 * Helper: write a File to FFmpeg's virtual FS.
 */
export async function writeInputFile(ffmpeg: FFmpeg, name: string, file: File): Promise<void> {
  const data = new Uint8Array(await file.arrayBuffer());
  await ffmpeg.writeFile(name, data);
}

/**
 * Helper: read a file from FFmpeg's virtual FS and return as Blob.
 */
export async function readOutputFile(ffmpeg: FFmpeg, name: string, mimeType: string): Promise<Blob> {
  const data = await ffmpeg.readFile(name);
  const buf = data instanceof Uint8Array ? data.buffer.slice(0) : data;
  return new Blob([buf as ArrayBuffer], { type: mimeType });
}

/**
 * Helper: clean up files from FFmpeg's virtual FS.
 */
export async function cleanupFiles(ffmpeg: FFmpeg, names: string[]): Promise<void> {
  for (const name of names) {
    try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
  }
}
