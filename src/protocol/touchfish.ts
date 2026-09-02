import { encodeKeyboardReport, type Modifier } from '../hid/keyboard'
import { buildFrame, type TouchFishFrame } from './frame'

export const TOUCHFISH_BAUD_RATE = 921600
export const TOUCHFISH_LAYER = 1

export const DEVICE_NAMES: Record<number, string> = {
  1: 'EM-TouchFish III',
  2: 'MX2KEY',
  3: 'EM-PAD',
  4: 'EM-PAD II',
  11: 'EM-OKHUB',
  12: 'EM-TouchFish II',
  13: 'EM-MIX8KEY',
  14: 'EM-GEEKHUB II',
}

export function buildIdentityRequest(): Uint8Array {
  return buildFrame(0x01)
}

export function buildStandardKeyQuery(layer: number, keyIndex: number): Uint8Array {
  return buildFrame(0x02, [layer, keyIndex])
}

export function buildKeyboardWritePacket(
  layer: number,
  keyIndex: number,
  report: Uint8Array,
): Uint8Array {
  if (report.length !== 8) throw new Error('Keyboard report must be exactly 8 bytes')
  return buildFrame(0x12, [layer, keyIndex, ...report])
}

export function buildKeyAssignmentPacket(
  keyIndex: number,
  keyUsages: readonly number[],
  modifiers: readonly Modifier[] = [],
  layer = TOUCHFISH_LAYER,
): Uint8Array {
  return buildKeyboardWritePacket(layer, keyIndex, encodeKeyboardReport(keyUsages, modifiers))
}

export type DeviceIdentity = {
  modelId: number
  modelName: string
  supported: boolean
}

export function parseIdentityResponse(frame: TouchFishFrame): DeviceIdentity | null {
  if (frame.command !== 0x01 || frame.payload.length < 1) return null
  const modelId = frame.payload[0] - 101
  return {
    modelId,
    modelName: DEVICE_NAMES[modelId] ?? `Unknown (${modelId})`,
    supported: modelId === 12,
  }
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join(' ')
}
