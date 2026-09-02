export type Modifier = 'control' | 'shift' | 'option' | 'command'

export const MODIFIER_BIT: Record<Modifier, number> = {
  control: 1 << 0,
  shift: 1 << 1,
  option: 1 << 2,
  command: 1 << 3,
}

export const HID = {
  A: 0x04,
  B: 0x05,
  C: 0x06,
  D: 0x07,
  E: 0x08,
  F: 0x09,
  G: 0x0a,
  H: 0x0b,
  I: 0x0c,
  J: 0x0d,
  K: 0x0e,
  L: 0x0f,
  M: 0x10,
  N: 0x11,
  O: 0x12,
  P: 0x13,
  Q: 0x14,
  R: 0x15,
  S: 0x16,
  T: 0x17,
  U: 0x18,
  V: 0x19,
  W: 0x1a,
  X: 0x1b,
  Y: 0x1c,
  Z: 0x1d,
  Digit1: 0x1e,
  Digit2: 0x1f,
  Digit3: 0x20,
  Digit4: 0x21,
  Digit5: 0x22,
  Digit6: 0x23,
  Digit7: 0x24,
  Digit8: 0x25,
  Digit9: 0x26,
  Digit0: 0x27,
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Grave: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  CapsLock: 0x39,
  F1: 0x3a,
  F2: 0x3b,
  F3: 0x3c,
  F4: 0x3d,
  F5: 0x3e,
  F6: 0x3f,
  F7: 0x40,
  F8: 0x41,
  F9: 0x42,
  F10: 0x43,
  F11: 0x44,
  F12: 0x45,
  PrintScreen: 0x46,
  ScrollLock: 0x47,
  Pause: 0x48,
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,
  NumLock: 0x53,
  NumpadSlash: 0x54,
  NumpadMultiply: 0x55,
  NumpadMinus: 0x56,
  NumpadPlus: 0x57,
  NumpadEnter: 0x58,
  Numpad1: 0x59,
  Numpad2: 0x5a,
  Numpad3: 0x5b,
  Numpad4: 0x5c,
  Numpad5: 0x5d,
  Numpad6: 0x5e,
  Numpad7: 0x5f,
  Numpad8: 0x60,
  Numpad9: 0x61,
  Numpad0: 0x62,
  NumpadDot: 0x63,
  F13: 0x68,
  F14: 0x69,
  F15: 0x6a,
  F16: 0x6b,
  F17: 0x6c,
  F18: 0x6d,
  F19: 0x6e,
  F20: 0x6f,
  F21: 0x70,
  F22: 0x71,
  F23: 0x72,
  F24: 0x73,
} as const

const USAGE_LABELS: Record<number, string> = {
  [HID.Enter]: 'Enter',
  [HID.Escape]: 'Esc',
  [HID.Backspace]: 'Backspace',
  [HID.Tab]: 'Tab',
  [HID.Space]: 'Space',
  [HID.Minus]: '-',
  [HID.Equal]: '=',
  [HID.BracketLeft]: '[',
  [HID.BracketRight]: ']',
  [HID.Backslash]: '\\',
  [HID.Semicolon]: ';',
  [HID.Quote]: "'",
  [HID.Grave]: '`',
  [HID.Comma]: ',',
  [HID.Period]: '.',
  [HID.Slash]: '/',
  [HID.CapsLock]: 'Caps Lock',
  [HID.PrintScreen]: 'Print Screen',
  [HID.ScrollLock]: 'Scroll Lock',
  [HID.Pause]: 'Pause',
  [HID.Insert]: 'Insert',
  [HID.Home]: 'Home',
  [HID.PageUp]: 'Page Up',
  [HID.Delete]: 'Delete',
  [HID.End]: 'End',
  [HID.PageDown]: 'Page Down',
  [HID.ArrowRight]: '→',
  [HID.ArrowLeft]: '←',
  [HID.ArrowDown]: '↓',
  [HID.ArrowUp]: '↑',
}

for (let i = 0; i < 26; i += 1) USAGE_LABELS[HID.A + i] = String.fromCharCode(65 + i)
for (let i = 0; i < 9; i += 1) USAGE_LABELS[HID.Digit1 + i] = String(i + 1)
USAGE_LABELS[HID.Digit0] = '0'
for (let i = 0; i < 12; i += 1) USAGE_LABELS[HID.F1 + i] = `F${i + 1}`
for (let i = 0; i < 12; i += 1) USAGE_LABELS[HID.F13 + i] = `F${i + 13}`
for (let i = 0; i < 9; i += 1) USAGE_LABELS[HID.Numpad1 + i] = `Numpad ${i + 1}`
USAGE_LABELS[HID.Numpad0] = 'Numpad 0'
USAGE_LABELS[HID.NumpadSlash] = 'Numpad /'
USAGE_LABELS[HID.NumpadMultiply] = 'Numpad *'
USAGE_LABELS[HID.NumpadMinus] = 'Numpad -'
USAGE_LABELS[HID.NumpadPlus] = 'Numpad +'
USAGE_LABELS[HID.NumpadEnter] = 'Numpad Enter'
USAGE_LABELS[HID.NumpadDot] = 'Numpad .'

export function modifierByte(modifiers: readonly Modifier[]): number {
  return modifiers.reduce((value, modifier) => value | MODIFIER_BIT[modifier], 0)
}

export function encodeKeyboardReport(
  keyUsages: readonly number[],
  modifiers: readonly Modifier[] = [],
): Uint8Array {
  if (keyUsages.length > 6) {
    throw new Error('Keyboard report supports at most six non-modifier usages')
  }

  const report = new Uint8Array(8)
  report[0] = modifierByte(modifiers)
  keyUsages.forEach((usage, index) => {
    report[index + 2] = usage & 0xff
  })
  return report
}

export type DecodedKeyboardReport = {
  modifierMask: number
  modifiers: Modifier[]
  keyUsages: number[]
}

export function decodeKeyboardReport(report: Uint8Array): DecodedKeyboardReport {
  if (report.length !== 8) throw new Error('Keyboard report must be exactly 8 bytes')

  const modifiers = (Object.entries(MODIFIER_BIT) as [Modifier, number][])
    .filter(([, bit]) => (report[0] & bit) !== 0)
    .map(([modifier]) => modifier)

  return {
    modifierMask: report[0],
    modifiers,
    keyUsages: [...report.slice(2)].filter((usage) => usage !== 0),
  }
}

export function keyboardUsageLabel(usage: number): string {
  return USAGE_LABELS[usage] ?? `HID 0x${usage.toString(16).padStart(2, '0').toUpperCase()}`
}

export function describeKeyboardReport(report: Uint8Array): string {
  const decoded = decodeKeyboardReport(report)
  if (decoded.modifierMask === 0 && decoded.keyUsages.length === 0) return '未设置'

  const leftGlyphs: Record<Modifier, string> = {
    control: '⌃',
    shift: '⇧',
    option: '⌥',
    command: '⌘',
  }
  const prefix = decoded.modifiers.map((modifier) => leftGlyphs[modifier]).join('')
  const rightModifierBits = decoded.modifierMask & 0xf0
  const rightSuffix = rightModifierBits ? ` + modifier 0x${rightModifierBits.toString(16).toUpperCase()}` : ''
  const keys = decoded.keyUsages.map(keyboardUsageLabel).join(' + ')
  return `${prefix}${keys || 'Modifier'}${rightSuffix}`
}
