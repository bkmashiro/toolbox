# ManyTool

> A growing collection of browser-based utility tools — everything runs client-side, no data leaves your browser.

[![Live](https://img.shields.io/badge/Live-manytool.pages.dev-blue?style=flat-square)](https://manytool.pages.dev)

No login. No uploads to a server. Open the page and start working.

---

## What it is

ManyTool is a single-page app with 167 tools across 12 categories. Each tool is self-contained and runs entirely in the browser using WebAssembly, Web APIs, and JavaScript libraries. Files you process stay on your machine.

---

## Tool Categories

| Category | Tools | Examples |
|----------|------:|---------|
| Data | 24 | JSON/YAML/TOML/XML/CSV conversion, SQL formatter, JSON Schema, protobuf, ZIP, XLSX |
| Developer | 20 | Base64, hex, color convert, cron parser, CSS tools, HTML/Markdown preview, TypeScript compiler, WCAG contrast, EyeDropper |
| Image | 21 | Convert, compress, resize, crop, EXIF, QR, barcode, SVG optimize, sprite sheet, background removal, OCR, upscale |
| Misc | 16 | Fake data, emoji search, Unicode lookup, file hash, TTS, STT, Pomodoro, screen ruler |
| Crypto | 15 | Hash, HMAC, bcrypt, AES, RSA, JWT (decode/sign/debug), PGP, password gen, UUID, OTP, cert decode |
| Text | 14 | Case convert, diff, regex tester, word frequency, line tools, Morse code, binary, string similarity |
| Math | 11 | Unit convert, statistics, matrix, date/age calc, timezone, number-to-words |
| Network | 12 | IP info/calc, DNS lookup, WHOIS, URL parse/encode, headers check, cURL generator, ping |
| PDF | 12 | Merge, split, compress, rotate, extract text/pages, images↔PDF, watermark, page numbers, protect |
| Audio | 6 | Convert, trim, merge, normalize, speed, ID3 tags |
| GIF | 6 | Make, extract frames, optimize, reverse, speed, crop |
| Video | 10 | Convert, trim, compress, screenshot, speed, reverse, add subtitle, extract audio/frames, GIF export |

---

## Highlights

### AI-powered (runs locally, no API key)
- **Background removal** — [@imgly/background-removal](https://github.com/imgly/background-removal-js), runs a segmentation model in-browser via WebAssembly
- **OCR** — [Tesseract.js](https://tesseract.projectnaptha.com/), extracts text from images client-side
- **Image upscale** — super-resolution upscaling without a server

### FFmpeg in the browser
- Video, audio, and GIF tools use [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) with multi-threading via `SharedArrayBuffer`
- Full FFmpeg pipeline — convert, trim, compress, add subtitles, normalize audio — no server involved

### PDF operations
- Merge, split, compress, rotate, watermark, add page numbers, password-protect
- Powered by [pdf-lib](https://pdf-lib.js.org/)

### Archive & spreadsheet
- ZIP create/extract via [JSZip](https://stuk.github.io/jszip/)
- XLSX↔JSON/CSV via [SheetJS](https://sheetjs.com/)

### Web Speech API
- **TTS** — text-to-speech using the browser's built-in synthesis
- **STT** — speech-to-text using the browser's recognition API

### Design & developer tools
- **WCAG contrast checker** — evaluates foreground/background color pairs against AA/AAA thresholds
- **EyeDropper** — picks colors directly from the screen using the EyeDropper API
- **CSS tools** — gradient builder, box-shadow editor, border-radius generator, unit converter
- **JWT** — decode, sign, and debug tokens; inspect headers and payloads

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | [Vite](https://vitejs.dev/) + TypeScript |
| Hosting | [Cloudflare Pages](https://pages.cloudflare.com/) |
| Video/Audio/GIF | [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) |
| OCR | [Tesseract.js](https://github.com/naptha/tesseract.js) |
| Background removal | [@imgly/background-removal](https://github.com/imgly/background-removal-js) |
| PDF | [pdf-lib](https://github.com/Hopding/pdf-lib) |
| Archives | [JSZip](https://github.com/Stuk/jszip) |
| Spreadsheets | [SheetJS](https://github.com/SheetJS/sheetjs) |
| Speech | Web Speech API (browser native) |

---

## Development

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm test         # run tests with vitest
```

Requires a browser that supports `SharedArrayBuffer` for FFmpeg multi-threading (Chrome/Edge recommended; Firefox works with the right headers).

---

## Adding a Tool

1. Create a file under `src/tools/<category>/<tool-id>.ts`
2. Register it in `src/tools/manifest.ts` with an import
3. The tool module should call the tool registry's `register()` function (see any existing tool for the pattern)

Tool files export metadata (id, name, description, category, tags) and a render function that receives a container element. No framework — plain DOM or whatever library makes sense for the tool.

---

## License

See [LICENSE](./LICENSE).
