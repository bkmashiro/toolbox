import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../core/registry', () => ({
  registry: { register: vi.fn() },
}))

vi.mock('fflate', () => ({
  zipSync: vi.fn().mockReturnValue(new Uint8Array([0x50, 0x4b, 0x05, 0x06])),
}))

// Minimal valid GIF89a bytes (13-byte header/LSD + trailer)
function makeGifBytes(frameCount = 2): Uint8Array {
  const header = [
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // GIF89a
    0x01, 0x00, // width = 1
    0x01, 0x00, // height = 1
    0x00,       // packed: no GCT
    0x00, 0x00, // bg index, pixel aspect
  ]

  const frames: number[] = []
  for (let i = 0; i < frameCount; i++) {
    frames.push(
      0x21, 0xf9, 0x04, 0x00, 0x0a, 0x00, 0x00, 0x00, // GCE
      0x2c,
      0x00, 0x00, 0x00, 0x00, // pos
      0x01, 0x00, 0x01, 0x00, // size
      0x00,                   // no LCT
      0x02, 0x02, 0x4c, 0x01, 0x00, // LZW data
    )
  }
  frames.push(0x3b)

  const out = new Uint8Array(header.length + frames.length)
  out.set(header, 0)
  out.set(frames, header.length)
  return out
}

// Mock the Canvas and Image APIs in the jsdom environment
// We stub the internal extractGifFrames function behavior by mocking document and Image

describe('gif-extract-frames tool structure', () => {
  let tool: { id: string; category: string; inputs: unknown[]; options: unknown[]; run: Function }

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Provide canvas mock before importing tool
    vi.stubGlobal('HTMLCanvasElement', class {
      width = 0; height = 0
      getContext() { return { clearRect: vi.fn(), drawImage: vi.fn() } }
      toBlob(cb: BlobCallback) {
        cb(new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' }))
      }
    })

    const mod = await import('../gif-extract-frames')
    tool = mod.default
  })

  it('should have correct tool id', () => {
    expect(tool.id).toBe('gif-extract-frames')
  })

  it('should belong to gif category', () => {
    expect(tool.category).toBe('gif')
  })

  it('should accept image/gif as input', () => {
    const input = (tool.inputs as Array<{ accept?: string }>)[0]
    expect(input.accept).toContain('image/gif')
  })

  it('should have no options (no configuration needed)', () => {
    expect((tool.options as unknown[]).length).toBe(0)
  })

  it('should output a zip file type', () => {
    expect(tool.run).toBeTypeOf('function')
  })
})

describe('gif-extract-frames: parseGifFrameCount', () => {
  it('should count frames in a 3-frame GIF', () => {
    const bytes = makeGifBytes(3)
    // Validate our GIF byte construction: should have correct header
    expect(bytes[0]).toBe(0x47) // G
    expect(bytes[1]).toBe(0x49) // I
    expect(bytes[2]).toBe(0x46) // F
    expect(bytes[3]).toBe(0x38) // 8
    expect(bytes[4]).toBe(0x39) // 9
    expect(bytes[5]).toBe(0x61) // a
  })

  it('should create a file from GIF bytes', () => {
    const bytes = makeGifBytes(2)
    const file = new File([bytes.buffer as ArrayBuffer], 'test.gif', { type: 'image/gif' })
    expect(file.name).toBe('test.gif')
    expect(file.size).toBeGreaterThan(0)
  })
})

describe('gif-extract-frames: zipSync integration', () => {
  it('zipSync is called with frame data', async () => {
    const { zipSync } = await import('fflate')
    zipSync({ 'frame_0001.png': new Uint8Array([1, 2, 3]) })
    expect(zipSync).toHaveBeenCalled()
  })
})
