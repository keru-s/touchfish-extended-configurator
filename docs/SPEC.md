# TouchFish Extended Configurator — V1 Spec

## 1. Product goal

Build a lightweight static web configurator for ELEKSMAKER EM-TouchFish II / TF05. It complements, rather than replaces, the official configurator.

The product focuses on keyboard mappings that are missing or awkward in the official UI:

- F13–F24
- macOS shortcuts
- custom modifier shortcuts
- Fn / Globe via an F20 proxy

For RGB, lighting, mouse, touch and other device-specific features, link users back to https://key.eleksmaker.com/.

## 2. UX model

Follow the official configurator's simple interaction model:

1. Connect device.
2. Click one physical TF05 key.
3. Click a target keyboard key or action.
4. Review the pending assignment.
5. Click **写入 Key X**.

Avoid drag-and-drop and avoid exposing HID/protocol terminology in the default UI.

The default UI should contain:

- device connection / identity state
- simplified TF05 physical layout
- Standard Keyboard tab
- Mac tab
- Custom Shortcut tab
- pending assignment preview
- explicit per-key write button
- official configurator link

## 3. Required V1 mappings

### Standard keyboard

Support common keyboard usages including:

- Escape
- F1–F24
- A–Z
- 0–9
- Enter / Tab / Space / Backspace / Delete
- Insert / Home / End / PageUp / PageDown
- arrows
- common punctuation
- NumPad keys where practical
- modifiers through the custom shortcut editor

F13–F24 must be visible, not hidden in an advanced menu.

### macOS presets

At minimum:

| Action | Mapping |
| --- | --- |
| Fn / Globe | F20 proxy + macOS hidutil mapping |
| Lock Screen | Control + Command + Q |
| Spotlight | Command + Space |
| Screenshot Full Screen | Command + Shift + 3 |
| Screenshot Selection | Command + Shift + 4 |
| Screenshot Toolbar | Command + Shift + 5 |
| App Switcher | Command + Tab |
| Copy | Command + C |
| Paste | Command + V |
| Cut | Command + X |
| Undo | Command + Z |
| Redo | Command + Shift + Z |
| Select All | Command + A |
| Close | Command + W |

### Custom shortcuts

Default UX supports modifier(s) + one primary key:

- Control
- Shift
- Option / Alt
- Command / GUI

The underlying HID report supports up to six non-modifier usages, but V1 does not need an advanced chord editor.

## 4. Fn / Globe

Use F20 (`Keyboard Usage 0x6F`) as the reserved proxy key.

Device-side assignment:

```text
TF05 physical key -> F20
```

macOS mapping:

```bash
hidutil property --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x70000006F,"HIDKeyboardModifierMappingDst":0xFF00000003}]}'
```

This approach is based on the same Apple Fn / Globe destination usage used by HD838A/remote-mic-app. The mapping mechanism was manually validated on the user's Mac with F14 -> Fn / Globe; V1 switches the proxy to F20 to reduce collisions.

V1 may use the global mapping. Device-specific `hidutil --matching` is a later enhancement.

## 5. Explicit non-goals

Do not implement in V1:

- firmware flashing / firmware upgrade
- bootloader operations
- custom firmware
- Fn firmware layers
- RGB / lighting
- touch configuration
- rotary dial configuration
- mouse protocol unless separately verified
- arbitrary macros / scripts
- native macOS helper
- Karabiner integration
- backend / accounts / telemetry

Unknown device commands must never be sent speculatively.

## 6. Verified current Web Serial protocol

### Transport

```text
baudRate: 921600
dataBits: 8
stopBits: 1
parity: none
```

### Frame

```text
AA COMMAND LENGTH PAYLOAD... EE CHECKSUM
```

`LENGTH` is the number of bytes before the checksum, so total frame bytes are `LENGTH + 1`.

Checksum:

```text
sum(all bytes except final checksum byte) & 0xFF
```

### Identity

Request:

```text
AA 01 04 EE 9D
```

Verified EM-TouchFish II response:

```text
AA 01 05 71 EE 0F
```

Official parser semantics:

```text
modelId = payload[0] - 101
0x71 = 113
113 - 101 = 12
12 = EM-TouchFish II
```

Known device IDs from the official web bundle:

```text
1  EM-TouchFish III
2  MX2KEY
3  EM-PAD
4  EM-PAD II
11 EM-OKHUB
12 EM-TouchFish II
13 EM-MIX8KEY
14 EM-GEEKHUB II
```

V1 officially supports model 12 only. Other detected models should be treated as unsupported / experimental.

### Standard key query

Command `0x02`.

Example for layer 1 / physical key index 3:

```text
AA 02 06 01 03 EE A4
```

Response decoding is not yet required for the first vertical slice.

### Standard keyboard write

Command `0x12`.

```text
AA 12 0E layer keyIndex keyboardReport[8] EE checksum
```

The 8-byte keyboard report is the classic keyboard report shape:

```text
byte 0: modifier bitfield
byte 1: reserved
byte 2..7: up to six non-modifier usages
```

Verified packets:

Key3 -> F13 (`0x68`):

```text
AA 12 0E 01 03 00 00 68 00 00 00 00 00 EE 24
```

Key5 -> F14 (`0x69`):

```text
AA 12 0E 01 05 00 00 69 00 00 00 00 00 EE 27
```

Both F13 and F14 were manually tested on a real EM-TouchFish II. Key5 -> F14 was confirmed to produce only F14.

Extended function usages:

```text
F13 0x68
F14 0x69
F15 0x6A
F16 0x6B
F17 0x6C
F18 0x6D
F19 0x6E
F20 0x6F
F21 0x70
F22 0x71
F23 0x72
F24 0x73
```

Modifiers:

```text
0xE0 Left Control
0xE1 Left Shift
0xE2 Left Alt / Option
0xE3 Left GUI / Command
0xE4 Right Control
0xE5 Right Shift
0xE6 Right Alt
0xE7 Right GUI
```

## 7. Parser requirements

Serial reads are byte-stream chunks, not frame boundaries. The parser must support:

- frames split across multiple reads
- multiple frames in one read
- leading noise before `0xAA`
- malformed length / terminator
- checksum validation

Never assume one `reader.read()` equals one complete frame.

## 8. Write-result semantics

The current reverse engineering has not established a reliable write ACK contract for command `0x12`.

Therefore V1 must distinguish:

- **serial write succeeded / command sent**
- **device confirmed write** (not yet available)

Do not claim a device ACK unless one has actually been parsed and verified.

## 9. Architecture

Preferred stack:

```text
Vite + React + TypeScript
```

Static deployment only; no backend.

Suggested modules:

```text
src/
  protocol/
    checksum.ts
    frame.ts
    serialTransport.ts
    touchfish.ts
  hid/
    keyboard.ts
    presets.ts
  types/
    webserial.d.ts
  App.tsx
  styles.css
```

## 10. Implementation order

### Phase 1 — vertical slice

- checksum
- buffered frame parser
- Web Serial transport
- identity request / parse
- standard keyboard write packet builder
- unit tests using known packets
- minimal UI that can write F13 / F14 / F20

### Phase 2 — product UI

- simplified physical TF05 key layout
- complete keyboard picker
- Mac presets
- custom shortcut editor
- Fn / Globe instructions
- error / reconnect states

### Phase 3 — polish

- richer debug log
- optional query / current assignment decoding once response format is verified
- responsive layout
- GitHub Pages deployment

## 11. Reference repositories

Reference only; do not retain their incompatible protocol layers:

- https://github.com/Jackadminx/Keyboard_nano_client — historical EleksMaker client semantics
- https://github.com/Jackadminx/Keyboard_nano — historical firmware/HID architecture
- https://github.com/Keylab-dev/zumap — modern configurator UI patterns
- https://github.com/the-via/app — key picker / configurator UX
- https://github.com/qmk/qmk_configurator — keyboard key taxonomy
- https://github.com/HD838A/remote-mic-app — macOS Fn / Globe HID mapping reference

## 12. Acceptance criteria

V1 is considered ready for initial public testing when:

1. Chrome/Edge can connect to a real EM-TouchFish II through Web Serial.
2. Identity response resolves model 12.
3. A user can select a physical key and assign F13–F24.
4. Mac preset packets use verified standard keyboard reports only.
5. Fn / Globe writes F20 and shows the working `hidutil` command.
6. Custom modifier + primary-key shortcuts encode correctly.
7. Known packet unit tests pass.
8. Parser tests cover split / combined / noisy / invalid streams.
9. No firmware or unknown commands exist in the application.
10. The official configurator is linked for out-of-scope features.
