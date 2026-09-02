import { TOUCHFISH_BAUD_RATE } from './touchfish'

export class SerialTransport {
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private stopping = false

  onData?: (chunk: Uint8Array) => void
  onError?: (error: unknown) => void
  onDisconnected?: () => void

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.serial)
  }

  async connect(): Promise<void> {
    if (!navigator.serial) {
      throw new Error('当前浏览器不支持 Web Serial，请使用最新版 Chrome 或 Edge。')
    }

    this.port = await navigator.serial.requestPort()
    await this.port.open({
      baudRate: TOUCHFISH_BAUD_RATE,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    })

    if (!this.port.readable || !this.port.writable) {
      throw new Error('串口已打开，但浏览器没有提供可读写数据流。')
    }

    this.reader = this.port.readable.getReader()
    this.writer = this.port.writable.getWriter()
    this.stopping = false
    void this.readLoop()
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.writer) throw new Error('设备尚未连接')
    await this.writer.write(data)
  }

  async disconnect(): Promise<void> {
    this.stopping = true

    if (this.reader) {
      try {
        await this.reader.cancel()
      } catch {
        // Ignore cancellation errors while tearing down a device connection.
      }
      this.reader.releaseLock()
      this.reader = null
    }

    if (this.writer) {
      this.writer.releaseLock()
      this.writer = null
    }

    if (this.port) {
      try {
        await this.port.close()
      } finally {
        this.port = null
      }
    }
  }

  private async readLoop(): Promise<void> {
    try {
      while (!this.stopping && this.reader) {
        const { value, done } = await this.reader.read()
        if (done) break
        if (value?.length) this.onData?.(value)
      }
    } catch (error) {
      if (!this.stopping) this.onError?.(error)
    } finally {
      if (!this.stopping) this.onDisconnected?.()
    }
  }
}
