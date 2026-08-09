import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  toBlobURL: vi.fn(),
}))

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    load: mocks.load,
  })),
}))

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: mocks.toBlobURL,
}))

describe('getFFmpeg', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.load.mockReset().mockResolvedValue(undefined)
    mocks.toBlobURL.mockReset().mockImplementation(async (url: string) => `blob:${url}`)
  })

  it('loads the single-threaded core without requesting a nonexistent worker asset', async () => {
    const { getFFmpeg } = await import('../ffmpeg')

    await getFFmpeg()

    expect(mocks.load).toHaveBeenCalledWith({
      coreURL: 'blob:https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js',
      wasmURL: 'blob:https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm',
    })
    expect(mocks.toBlobURL).toHaveBeenCalledTimes(2)
  })

  it('allows retrying after a load failure', async () => {
    mocks.load.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce(undefined)
    const { getFFmpeg } = await import('../ffmpeg')

    await expect(getFFmpeg()).rejects.toThrow('network error')
    await expect(getFFmpeg()).resolves.toBeDefined()

    expect(mocks.load).toHaveBeenCalledTimes(2)
  })
})
