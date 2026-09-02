import { encodeKeyboardReport, type Modifier } from '../hid/keyboard'
import { buildFrame, type TouchFishFrame } from './frame'

export const TOUCHFISH_BAUD_RATE = 921600
export const TOUCHFISH_LAYER = 1
export const STANDARD_KEYBOARD_FUNCTION_TYPE = 1

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

export type TouchFishControl = {
  index: number
  id: string
  label: string
  shortLabel: string
  kind: 'key' | 'dial-press' | 'dial-left' | 'dial-right'
}

/**
 * Key indices 1-5 are verified. Query responses from a real EM-TouchFish II
 * also confirm that indices 6-8 are valid configurable controls. Their physical
 * rotary ordering still needs a write test, so the mapping remains isolated
 * here and can be corrected without touching protocol code.
 */
export const TOUCHFISH_CONTROLS: TouchFishControl[] = [
  { index: 1, id: 'key-1', label: 'Key 1', shortLabel: 'Key 1', kind: 'key' },
  { index: 2, id: 'key-2', label: 'Key 2', shortLabel: 'Key 2', kind: 'key' },
  { index: 3, id: 'key-3', label: 'Key 3', shortLabel: 'Key 3', kind: 'key' },
  { index: 4, id: 'key-4', label: 'Key 4', shortLabel: 'Key 4', kind: 'key' },
  { index: 5, id: 'key-5', label: 'Key 5', shortLabel: 'Key 5', kind: 'key' },
  { index: 6, id: 'dial-press', label: '旋钮按下', shortLabel: '按下', kind: 'dial-press' },
  { index: 7, id: 'dial-left', label: '旋钮左转', shortLabel: '左转', kind: 'dial-left' },
  { index: 8, id: 'dial-right', label: '旋钮右转', shortLabel: '右转', kind: 'dial-right' },
]

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

export type StandardKeyRead = {
  layer: number
  controlIndex: number
  report: Uint8Array
  functionType: number
}

/**
 * Real-device capture (command 0x02) established the response payload as:
 *
 *   [layer, controlIndex, keyboardReport[8], functionType]
 *
 * Example Key2/Backspace:
 *   01 02 | 00 00 2a 00 00 00 00 00 | 01
 *
 * The final byte is therefore metadata, not part of the keyboard report. The
 * previous implementation incorrectly took the final eight bytes and decoded
 * that metadata byte as HID usage 0x01.
 */
export function parseStandardKeyResponse(frame: TouchFishFrame): StandardKeyRead | null {
  if (frame.command !== 0x02 || frame.payload.length < 11) return null

  const layer = frame.payload[0]
  const controlIndex = frame.payload[1]
  if (layer < 1 || controlIndex < 1) return null

  return {
    layer,
    controlIndex,
    report: frame.payload.slice(2, 10),
    functionType: frame.payload[10],
  }
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join(' ')
}
