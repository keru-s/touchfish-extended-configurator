import { HID, type Modifier } from './keyboard'

export type Assignment = {
  id: string
  name: string
  description?: string
  keys: number[]
  modifiers: Modifier[]
  requiresFnMapping?: boolean
}

export const FN_HIDUTIL_COMMAND =
  `hidutil property --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x70000006F,"HIDKeyboardModifierMappingDst":0xFF00000003}]}'`

export const MAC_PRESETS: Assignment[] = [
  {
    id: 'fn-globe',
    name: 'Fn / Globe',
    description: '适用于 macOS 听写及支持 Fn / Globe 的语音输入工具',
    keys: [HID.F20],
    modifiers: [],
    requiresFnMapping: true,
  },
  { id: 'lock-screen', name: '锁定屏幕', keys: [HID.Q], modifiers: ['control', 'command'] },
  { id: 'spotlight', name: 'Spotlight', keys: [HID.Space], modifiers: ['command'] },
  { id: 'screenshot-full', name: '截全屏', keys: [HID.Digit3], modifiers: ['command', 'shift'] },
  { id: 'screenshot-selection', name: '截取区域', keys: [HID.Digit4], modifiers: ['command', 'shift'] },
  { id: 'screenshot-toolbar', name: '截图工具栏', keys: [HID.Digit5], modifiers: ['command', 'shift'] },
  { id: 'app-switcher', name: '切换应用', keys: [HID.Tab], modifiers: ['command'] },
  { id: 'copy', name: '复制', keys: [HID.C], modifiers: ['command'] },
  { id: 'paste', name: '粘贴', keys: [HID.V], modifiers: ['command'] },
  { id: 'cut', name: '剪切', keys: [HID.X], modifiers: ['command'] },
  { id: 'undo', name: '撤销', keys: [HID.Z], modifiers: ['command'] },
  { id: 'redo', name: '重做', keys: [HID.Z], modifiers: ['command', 'shift'] },
  { id: 'select-all', name: '全选', keys: [HID.A], modifiers: ['command'] },
  { id: 'close', name: '关闭窗口 / 标签页', keys: [HID.W], modifiers: ['command'] },
]
