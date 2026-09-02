# EM-TouchFish II Hardware Test Checklist

This checklist is for validating the first browser vertical slice against a real TF05 / EM-TouchFish II.

## Prerequisites

- macOS
- Chrome or Edge with Web Serial support
- EM-TouchFish II connected by USB
- repository branch `feat/initial-v1`

Run locally:

```bash
npm install
npm run dev
```

Open the local Vite URL in Chrome / Edge.

## 1. Device identity

1. Click **连接设备**.
2. Choose the TF05 serial port.
3. Confirm the page changes to:

```text
已识别：EM-TouchFish II
Model 12
```

4. Open **开发者 / Serial Debug** and confirm the exchange contains:

```text
TX   aa 01 04 ee 9d
RX   aa 01 05 71 ee 0f
```

If model 12 is not detected, do not continue with writes.

## 2. F13 write

Use a physical key whose existing assignment is safe to overwrite.

1. Select the matching Key index in the UI.
2. Choose **F13**.
3. Click **写入 Key X**.
4. Confirm the debug panel shows a `0x12` frame.
5. Press the physical TF05 key and verify macOS receives F13.

Known verified packet for Key3 -> F13:

```text
aa 12 0e 01 03 00 00 68 00 00 00 00 00 ee 24
```

## 3. F14 write

Repeat with F14.

Known verified packet for Key5 -> F14:

```text
aa 12 0e 01 05 00 00 69 00 00 00 00 00 ee 27
```

This packet has already been manually validated before this web UI implementation.

## 4. F20 proxy write

1. Select a physical key.
2. In the Mac tab select **Fn / Globe**.
3. Confirm the pending assignment explains that the device will emit F20.
4. Click **写入 Key X**.
5. Before enabling the macOS mapping, verify the key behaves as F20 if possible.

Expected Key5 -> F20 packet:

```text
aa 12 0e 01 05 00 00 6f 00 00 00 00 00 ee 2d
```

## 5. Fn / Globe mapping

Run:

```bash
hidutil property --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x70000006F,"HIDKeyboardModifierMappingDst":0xFF00000003}]}'
```

Press the TF05 key configured as Fn / Globe and verify the target macOS voice-input application reacts exactly as it does to a physical Fn / Globe key.

Restore the global mapping if needed:

```bash
hidutil property --set '{"UserKeyMapping":[]}'
```

## 6. Mac shortcut preset

Test at least one preset whose effect is easy to observe, for example:

- Spotlight: Command + Space
- Screenshot Selection: Command + Shift + 4
- Lock Screen: Control + Command + Q (only test when convenient)

Verify the physical TF05 key triggers exactly one shortcut and no extra key.

## 7. Custom shortcut

Configure a harmless custom shortcut such as Command + C or Command + A.

Verify:

- modifier byte is encoded correctly
- only the selected primary key is sent
- no stale modifier remains held after the key press

## Pass criteria

The first vertical slice passes hardware validation when:

- model 12 identity is detected reliably
- F13 works
- F14 works
- F20 works as the Fn proxy
- at least one Mac preset works
- at least one custom shortcut works
- reconnecting the device still permits identity detection and writing
- no firmware / bootloader behavior is triggered

## Capture on failure

If any step fails, copy the **Serial Debug** output and record:

- selected physical Key index
- selected assignment
- expected behavior
- actual behavior
- macOS version
- browser + version

Do not experiment with unknown commands to diagnose a failure.
