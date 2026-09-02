# TouchFish Extended Configurator

一个面向 **ELEKSMAKER EM-TouchFish II / TF05（摸鱼二代）** 的轻量 Web Serial 按键配置扩展页面。

项目目标不是替代官方配置器，而是补齐官方 UI 暂未开放或不方便配置的键盘能力：

- F13–F24
- macOS 常用快捷键
- 自定义组合键（Control / Shift / Option / Command + Key）
- Fn / Globe：设备侧写入 F20，再通过 macOS `hidutil` 映射为 Apple Fn / Globe

RGB、灯效、鼠标、触摸等功能继续使用 [ELEKSMAKER 官方配置器](https://key.eleksmaker.com/)。

## 当前状态

第一轮实现包含：

- Web Serial 921600 / 8N1 连接
- EM-TouchFish II 身份识别
- 已验证的 `AA ... EE checksum` 帧编码与流式解析
- 标准键盘写入命令 `0x12`
- F1–F24、字母、导航键等基础 HID Usage
- Mac 常用快捷预设
- Fn / Globe（F20 代理键）
- 自定义组合键编辑器
- 协议层单元测试
- GitHub Pages 构建配置

> 当前版本还需要在真实 TF05 上完成浏览器端端到端验证。写入完成提示目前表示“串口写入指令已成功发送”，不代表设备返回了已确认的 ACK。

## 本地运行

```bash
npm install
npm run dev
```

测试：

```bash
npm test
```

构建：

```bash
npm run build
```

## 浏览器

Web Serial 主要支持 Chromium 系浏览器。建议使用最新版 Chrome 或 Edge。

## Fn / Globe

V1 使用 **F20 (`0x6F`)** 作为代理键。将某个 TF05 按键设置为 Fn / Globe 后，在 macOS 执行：

```bash
hidutil property --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x70000006F,"HIDKeyboardModifierMappingDst":0xFF00000003}]}'
```

恢复全局 UserKeyMapping：

```bash
hidutil property --set '{"UserKeyMapping":[]}'
```

后续可进一步研究通过 `hidutil --matching` 将映射限定到 TF05。

## 安全边界

本项目不会实现：

- 固件升级 / 刷写
- Bootloader 操作
- 未知命令探测式写入
- RGB / 灯效
- 原生 macOS Helper
- Karabiner 依赖

协议资料与产品范围见 [`docs/SPEC.md`](docs/SPEC.md)。

## License

MIT
