import { describe, expect, it } from 'vitest'
import { HID, encodeKeyboardReport } from '../hid/keyboard'
import { FrameParser, buildFrame } from './frame'
import { buildIdentityRequest, buildKeyAssignmentPacket } from './touchfish'

const bytes = (hex: string) => Uint8Array.from(hex.split(' ').map((part) => Number.parseInt(part, 16)))

describe('known protocol packets', () => {
  it('builds the verified identity request', () => {
    expect(buildIdentityRequest()).toEqual(bytes('aa 01 04 ee 9d'))
  })

  it('builds the verified Key5 -> F14 packet', () => {
    expect(buildKeyAssignmentPacket(5, [HID.F14])).toEqual(
      bytes('aa 12 0e 01 05 00 00 69 00 00 00 00 00 ee 27'),
    )
  })

  it('builds the expected Key5 -> F20 proxy packet', () => {
    expect(buildKeyAssignmentPacket(5, [HID.F20])).toEqual(
      bytes('aa 12 0e 01 05 00 00 6f 00 00 00 00 00 ee 2d'),
    )
  })

  it('encodes modifier shortcuts in the HID modifier byte', () => {
    expect([...encodeKeyboardReport([HID.Q], ['control', 'command'])]).toEqual([
      0x09, 0x00, HID.Q, 0, 0, 0, 0, 0,
    ])
  })
})

describe('FrameParser', () => {
  it('parses a frame split across reads', () => {
    const parser = new FrameParser()
    const first = parser.push(bytes('aa 01'))
    expect(first.frames).toHaveLength(0)

    const second = parser.push(bytes('05 71 ee 0f'))
    expect(second.frames).toHaveLength(1)
    expect([...second.frames[0].payload]).toEqual([0x71])
  })

  it('parses multiple frames from one read', () => {
    const parser = new FrameParser()
    const result = parser.push(
      Uint8Array.from([...buildFrame(0x01, [0x71]), ...buildFrame(0x02, [0x01, 0x03])]),
    )
    expect(result.frames.map((frame) => frame.command)).toEqual([0x01, 0x02])
  })

  it('discards leading garbage', () => {
    const parser = new FrameParser()
    const result = parser.push(Uint8Array.from([0x00, 0x55, ...buildFrame(0x01, [0x71])]))
    expect(result.discardedBytes).toBe(2)
    expect(result.frames).toHaveLength(1)
  })

  it('rejects a bad checksum and resynchronizes', () => {
    const parser = new FrameParser()
    const bad = bytes('aa 01 05 71 ee 10')
    const good = buildFrame(0x01, [0x71])
    const result = parser.push(Uint8Array.from([...bad, ...good]))
    expect(result.invalidFrames).toBeGreaterThan(0)
    expect(result.frames).toHaveLength(1)
  })
})
