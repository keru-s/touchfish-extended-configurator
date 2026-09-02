import { useMemo, useRef, useState } from 'react'
import { HID, type Modifier } from './hid/keyboard'
import { FN_HIDUTIL_COMMAND, MAC_PRESETS, type Assignment } from './hid/presets'
import { FrameParser } from './protocol/frame'
import { SerialTransport } from './protocol/serialTransport'
import {
  buildIdentityRequest,
  buildKeyAssignmentPacket,
  parseIdentityResponse,
  toHex,
  type DeviceIdentity,
} from './protocol/touchfish'

type Tab = 'keyboard' | 'mac' | 'custom'

type LogEntry = {
  direction: 'TX' | 'RX' | 'INFO'
  message: string
}

const PHYSICAL_KEYS = [1, 2, 3, 4, 5]

const FUNCTION_KEYS = Array.from({ length: 24 }, (_, index) => ({
  label: `F${index + 1}`,
  usage: index < 12 ? HID.F1 + index : HID.F13 + (index - 12),
}))

const LETTER_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  label: letter,
  usage: HID[letter as keyof typeof HID] as number,
}))

const NUMBER_KEYS = [
  ['1', HID.Digit1], ['2', HID.Digit2], ['3', HID.Digit3], ['4', HID.Digit4], ['5', HID.Digit5],
  ['6', HID.Digit6], ['7', HID.Digit7], ['8', HID.Digit8], ['9', HID.Digit9], ['0', HID.Digit0],
] as const

const COMMON_KEYS = [
  ['Esc', HID.Escape],
  ['Tab', HID.Tab],
  ['Enter', HID.Enter],
  ['Space', HID.Space],
  ['Backspace', HID.Backspace],
  ['Delete', HID.Delete],
  ['Home', HID.Home],
  ['End', HID.End],
  ['Page Up', HID.PageUp],
  ['Page Down', HID.PageDown],
  ['←', HID.ArrowLeft],
  ['↓', HID.ArrowDown],
  ['↑', HID.ArrowUp],
  ['→', HID.ArrowRight],
] as const

function makeKeyAssignment(label: string, usage: number): Assignment {
  return { id: `key-${usage}`, name: label, keys: [usage], modifiers: [] }
}

function formatModifiers(modifiers: readonly Modifier[]): string {
  const glyph: Record<Modifier, string> = {
    control: '⌃',
    shift: '⇧',
    option: '⌥',
    command: '⌘',
  }
  return modifiers.map((modifier) => glyph[modifier]).join('')
}

export default function App() {
  const transportRef = useRef<SerialTransport | null>(null)
  const parserRef = useRef(new FrameParser())
  const [connected, setConnected] = useState(false)
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null)
  const [selectedKey, setSelectedKey] = useState(1)
  const [pending, setPending] = useState<Assignment | null>(null)
  const [sessionAssignments, setSessionAssignments] = useState<Record<number, string>>({})
  const [tab, setTab] = useState<Tab>('keyboard')
  const [status, setStatus] = useState('尚未连接设备')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [customModifiers, setCustomModifiers] = useState<Modifier[]>(['command'])
  const [customUsage, setCustomUsage] = useState<number>(HID.C)

  const serialSupported = SerialTransport.isSupported()

  const customOptions = useMemo(
    () => [...LETTER_KEYS, ...NUMBER_KEYS.map(([label, usage]) => ({ label, usage })), ...FUNCTION_KEYS],
    [],
  )

  const appendLog = (entry: LogEntry) => {
    setLogs((current) => [...current.slice(-79), entry])
  }

  const handleIncoming = (chunk: Uint8Array) => {
    appendLog({ direction: 'RX', message: toHex(chunk) })
    const result = parserRef.current.push(chunk)
    if (result.invalidFrames || result.discardedBytes) {
      appendLog({
        direction: 'INFO',
        message: `parser: discarded=${result.discardedBytes}, invalid=${result.invalidFrames}`,
      })
    }
    for (const frame of result.frames) {
      const device = parseIdentityResponse(frame)
      if (device) {
        setIdentity(device)
        setStatus(device.supported ? `已识别：${device.modelName}` : `检测到未验证设备：${device.modelName}`)
      }
    }
  }

  const connect = async () => {
    try {
      const transport = new SerialTransport()
      transport.onData = handleIncoming
      transport.onError = (error) => {
        appendLog({ direction: 'INFO', message: `serial error: ${String(error)}` })
        setStatus('串口读取发生错误')
      }
      transport.onDisconnected = () => {
        setConnected(false)
        setStatus('设备连接已断开')
      }
      await transport.connect()
      transportRef.current = transport
      parserRef.current.reset()
      setConnected(true)
      setIdentity(null)
      setStatus('已连接，正在识别设备…')

      const request = buildIdentityRequest()
      appendLog({ direction: 'TX', message: toHex(request) })
      await transport.write(request)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  const disconnect = async () => {
    try {
      await transportRef.current?.disconnect()
    } finally {
      transportRef.current = null
      setConnected(false)
      setIdentity(null)
      setStatus('尚未连接设备')
    }
  }

  const writePending = async () => {
    if (!pending || !transportRef.current) return
    if (identity && !identity.supported) {
      setStatus('当前设备不是已验证的 EM-TouchFish II，已阻止写入。')
      return
    }

    try {
      const packet = buildKeyAssignmentPacket(selectedKey, pending.keys, pending.modifiers)
      appendLog({ direction: 'TX', message: toHex(packet) })
      await transportRef.current.write(packet)
      setSessionAssignments((current) => ({ ...current, [selectedKey]: pending.name }))
      setStatus(`Key ${selectedKey} 的写入指令已发送：${pending.name}`)
    } catch (error) {
      setStatus(`写入失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const toggleModifier = (modifier: Modifier) => {
    setCustomModifiers((current) =>
      current.includes(modifier) ? current.filter((item) => item !== modifier) : [...current, modifier],
    )
  }

  const useCustomShortcut = () => {
    const option = customOptions.find((item) => item.usage === customUsage)
    const keyLabel = option?.label ?? `0x${customUsage.toString(16)}`
    setPending({
      id: 'custom',
      name: `${formatModifiers(customModifiers)}${keyLabel}`,
      description: '自定义组合键',
      keys: [customUsage],
      modifiers: customModifiers,
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ELEKSMAKER TF05 / EM-TouchFish II</p>
          <h1>TouchFish Extended Configurator</h1>
          <p className="subtitle">官方配置器的轻量按键扩展：F13–F24、Mac 快捷键、Fn / Globe。</p>
        </div>
        <div className="topbar-actions">
          <a className="secondary-button" href="https://key.eleksmaker.com/" target="_blank" rel="noreferrer">
            官方配置器 ↗
          </a>
          {connected ? (
            <button className="secondary-button" onClick={disconnect}>断开设备</button>
          ) : (
            <button className="primary-button" onClick={connect} disabled={!serialSupported}>连接设备</button>
          )}
        </div>
      </header>

      {!serialSupported && (
        <div className="warning-banner">当前浏览器不支持 Web Serial，请使用最新版 Chrome 或 Edge。</div>
      )}

      <div className="status-line">
        <span className={`status-dot ${connected ? 'connected' : ''}`} />
        <strong>{status}</strong>
        {identity && <span className="device-pill">Model {identity.modelId}</span>}
      </div>

      <main className="workspace">
        <section className="device-card panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">STEP 1</span>
              <h2>选择 TouchFish 按键</h2>
            </div>
            <span className="muted">当前 Key {selectedKey}</span>
          </div>

          <div className="touchfish-layout">
            <div className="key-grid">
              {PHYSICAL_KEYS.slice(0, 4).map((key) => (
                <button
                  key={key}
                  className={`physical-key ${selectedKey === key ? 'selected' : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span>Key {key}</span>
                  <small>{sessionAssignments[key] ?? '未读取'}</small>
                </button>
              ))}
            </div>
            <div className="dial-column">
              <div className="dial" aria-label="Dial visual placeholder"><span /></div>
              <button
                className={`physical-key compact ${selectedKey === 5 ? 'selected' : ''}`}
                onClick={() => setSelectedKey(5)}
              >
                <span>Key 5</span>
                <small>{sessionAssignments[5] ?? '未读取'}</small>
              </button>
            </div>
          </div>
          <p className="helper-text">“未读取”表示当前版本尚未反解设备已有配置；写入后会显示本次会话中的设置。</p>
        </section>

        <section className="mapping-card panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">STEP 2</span>
              <h2>选择目标功能</h2>
            </div>
          </div>

          <div className="tabs">
            <button className={tab === 'keyboard' ? 'active' : ''} onClick={() => setTab('keyboard')}>标准键盘</button>
            <button className={tab === 'mac' ? 'active' : ''} onClick={() => setTab('mac')}>Mac</button>
            <button className={tab === 'custom' ? 'active' : ''} onClick={() => setTab('custom')}>自定义组合键</button>
          </div>

          {tab === 'keyboard' && (
            <div className="picker-scroll">
              <h3>Function</h3>
              <div className="key-picker function-picker">
                {FUNCTION_KEYS.map(({ label, usage }) => (
                  <button key={label} onClick={() => setPending(makeKeyAssignment(label, usage))}>{label}</button>
                ))}
              </div>

              <h3>Common</h3>
              <div className="key-picker">
                {COMMON_KEYS.map(([label, usage]) => (
                  <button key={label} onClick={() => setPending(makeKeyAssignment(label, usage))}>{label}</button>
                ))}
              </div>

              <h3>Letters</h3>
              <div className="key-picker letters">
                {LETTER_KEYS.map(({ label, usage }) => (
                  <button key={label} onClick={() => setPending(makeKeyAssignment(label, usage))}>{label}</button>
                ))}
              </div>

              <h3>Numbers</h3>
              <div className="key-picker">
                {NUMBER_KEYS.map(([label, usage]) => (
                  <button key={label} onClick={() => setPending(makeKeyAssignment(label, usage))}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {tab === 'mac' && (
            <div className="preset-grid">
              {MAC_PRESETS.map((preset) => (
                <button key={preset.id} className="preset-card" onClick={() => setPending(preset)}>
                  <strong>{preset.name}</strong>
                  <span>{preset.description ?? `${formatModifiers(preset.modifiers)} keyboard shortcut`}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'custom' && (
            <div className="custom-editor">
              <h3>Modifiers</h3>
              <div className="modifier-row">
                {(['control', 'shift', 'option', 'command'] as Modifier[]).map((modifier) => (
                  <button
                    key={modifier}
                    className={customModifiers.includes(modifier) ? 'active' : ''}
                    onClick={() => toggleModifier(modifier)}
                  >
                    {modifier === 'control' ? '⌃ Control' : modifier === 'shift' ? '⇧ Shift' : modifier === 'option' ? '⌥ Option' : '⌘ Command'}
                  </button>
                ))}
              </div>
              <label className="select-label">
                Primary key
                <select value={customUsage} onChange={(event) => setCustomUsage(Number(event.target.value))}>
                  {customOptions.map((option) => (
                    <option key={`${option.label}-${option.usage}`} value={option.usage}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button className="secondary-button" onClick={useCustomShortcut}>使用此组合键</button>
            </div>
          )}
        </section>

        <aside className="write-card panel">
          <span className="section-label">STEP 3</span>
          <h2>确认并写入</h2>
          <div className="assignment-summary">
            <span>物理按键</span>
            <strong>Key {selectedKey}</strong>
          </div>
          <div className="assignment-summary">
            <span>准备写入</span>
            <strong>{pending?.name ?? '尚未选择'}</strong>
            {pending?.description && <small>{pending.description}</small>}
          </div>

          {pending?.requiresFnMapping && (
            <div className="fn-card">
              <strong>Fn / Globe 需要一次 macOS 映射</strong>
              <p>设备侧会写入很少使用的 F20。然后在 Terminal 执行：</p>
              <code>{FN_HIDUTIL_COMMAND}</code>
              <button
                className="text-button"
                onClick={() => navigator.clipboard.writeText(FN_HIDUTIL_COMMAND)}
              >
                复制命令
              </button>
            </div>
          )}

          <button
            className="primary-button write-button"
            disabled={!connected || !pending || Boolean(identity && !identity.supported)}
            onClick={writePending}
          >
            写入 Key {selectedKey}
          </button>
          <p className="helper-text">当前仅确认串口写入成功，不宣称设备已返回写入 ACK。</p>
        </aside>
      </main>

      <details className="debug-panel panel">
        <summary>开发者 / Serial Debug</summary>
        <div className="debug-actions">
          <button className="text-button" onClick={() => setLogs([])}>清空日志</button>
        </div>
        <pre>{logs.length ? logs.map((entry) => `${entry.direction.padEnd(4)} ${entry.message}`).join('\n') : '暂无串口日志'}</pre>
      </details>

      <footer>
        <span>灯效、RGB、鼠标与触摸功能暂不重复实现。</span>
        <a href="https://key.eleksmaker.com/" target="_blank" rel="noreferrer">前往 ELEKSMAKER 官方配置器 →</a>
      </footer>
    </div>
  )
}
