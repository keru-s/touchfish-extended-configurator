import { describe, expect, it } from 'vitest'
import { HID, describeKeyboardReport, encodeKeyboardReport } from '../hid/keyboard'
import { FrameParser, buildFrame, decodeFrame } from './frame'
import {
  STANDARD_KEYBOARD_FUNCTION_TYPE,
  buildIdentityRequest,
  buildKeyAssignmentPacket,
  buildStandardKeyQuery,
  parseStandardKeyResponse,
} from './touchfish'

const bytes = (hex: string) => Uint8Array.from(hex.split(' ').map((part) => Number.parseInt(part, 16)))

describe('known protocol packets', () => {
  it('builds the verified identity request', () => {
    expect(buildIdentityRequest()).toEqual(bytes('aa 01 04 ee 9d'))
  })

  it('builds the known standard-key query shape', () => {
    expect(buildStandardKeyQuery(1, 5)).toEqual(bytes('aa 02 06 01 05 ee a6'))
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

describe('real EM-TouchFish II standard-key reads', () => {
  const captured = [
    {
      name: 'Key1 lock screen',
      raw: 'aa 02 0f 01 01 09 00 14 00 00 00 00 00 01 ee c9',
      controlIndex: 1,
      label: '⌃⌘Q',
      functionType: 1,
    },
    {
      name: 'Key2 Backspace',
      raw: 'aa 02 0f 01 02 00 00 2a 00 00 00 00 00 01 ee d7',
      controlIndex: 2,
      label: 'Backspace',
      functionType: 1,
    },
    {
      name: 'Key3 PrintScreen + F13',
      raw: 'aa 02 0f 01 03 00 00 46 68 00 00 00 00 01 ee 5c',
      controlIndex: 3,
      label: 'Print Screen + F13',
      functionType: 1,
    },
    {
      name: 'Key4 Enter',
      raw: 'aa 02 0f 01 04 00 00 28 00 00 00 00 00 01 ee d7',
      controlIndex: 4,
      label: 'Enter',
      functionType: 1,
    },
    {
      name: 'Key5 F20',
      raw: 'aa 02 0f 01 05 00 00 6f 00 00 00 00 00 01 ee 1f',
      controlIndex: 5,
      label: 'F20',
      functionType: 1,
    },
    {
      name: 'rotary press unset',
      raw: 'aa 02 0f 01 06 00 00 00 00 00 00 00 00 00 ee b0',
      controlIndex: 6,
      label: '未设置',
      functionType: 0,
    },
  ] as const

  for (const sample of captured) {
    it(`decodes ${sample.name}`, () => {
      const frame = decodeFrame(bytes(sample.raw))
      expect(frame).not.toBeNull()
      const read = parseStandardKeyResponse(frame!)
      expect(read?.controlIndex).toBe(sample.controlIndex)
      expect(read?.functionType).toBe(sample.functionType)
      expect(describeKeyboardReport(read!.report)).toBe(sample.label)
    })
  }

  it('keeps the final 0x01 as function metadata instead of HID usage', () => {
    const frame = decodeFrame(bytes('aa 02 0f 01 02 00 00 2a 00 00 00 00 00 01 ee d7'))!
    const read = parseStandardKeyResponse(frame)!
    expect([...read.report]).toEqual([0x00, 0x00, HID.Backspace, 0, 0, 0, 0, 0])
    expect(read.functionType).toBe(STANDARD_KEYBOARD_FUNCTION_TYPE)
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
