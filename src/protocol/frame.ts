import { computeChecksum, hasValidChecksum } from './checksum'

export const FRAME_START = 0xaa
export const FRAME_END = 0xee

export type TouchFishFrame = {
  command: number
  length: number
  payload: Uint8Array
  raw: Uint8Array
}

export type FrameParseResult = {
  frames: TouchFishFrame[]
  discardedBytes: number
  invalidFrames: number
}

export function buildFrame(command: number, payload: readonly number[] = []): Uint8Array {
  const length = payload.length + 4
  const withoutChecksum = Uint8Array.from([
    FRAME_START,
    command & 0xff,
    length & 0xff,
    ...payload.map((value) => value & 0xff),
    FRAME_END,
  ])
  return Uint8Array.from([...withoutChecksum, computeChecksum(withoutChecksum)])
}

export function decodeFrame(raw: Uint8Array): TouchFishFrame | null {
  if (raw.length < 5) return null
  if (raw[0] !== FRAME_START) return null
  if (raw[raw.length - 2] !== FRAME_END) return null
  if (raw[2] + 1 !== raw.length) return null
  if (!hasValidChecksum(raw)) return null

  return {
    command: raw[1],
    length: raw[2],
    payload: raw.slice(3, raw.length - 2),
    raw,
  }
}

export class FrameParser {
  private buffer: number[] = []

  push(chunk: Uint8Array): FrameParseResult {
    this.buffer.push(...chunk)

    const frames: TouchFishFrame[] = []
    let discardedBytes = 0
    let invalidFrames = 0

    while (this.buffer.length > 0) {
      const startIndex = this.buffer.indexOf(FRAME_START)
      if (startIndex === -1) {
        discardedBytes += this.buffer.length
        this.buffer = []
        break
      }

      if (startIndex > 0) {
        discardedBytes += startIndex
        this.buffer.splice(0, startIndex)
      }

      if (this.buffer.length < 3) break

      const length = this.buffer[2]
      const totalLength = length + 1
      if (totalLength < 5) {
        invalidFrames += 1
        this.buffer.shift()
        continue
      }

      if (this.buffer.length < totalLength) break

      const candidate = Uint8Array.from(this.buffer.slice(0, totalLength))
      const frame = decodeFrame(candidate)
      if (!frame) {
        invalidFrames += 1
        this.buffer.shift()
        continue
      }

      frames.push(frame)
      this.buffer.splice(0, totalLength)
    }

    return { frames, discardedBytes, invalidFrames }
  }

  reset(): void {
    this.buffer = []
  }
}
