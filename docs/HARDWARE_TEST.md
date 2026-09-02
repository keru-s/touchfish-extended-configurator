# EM-TouchFish II Hardware Test Checklist

This checklist validates the browser configurator against a real TF05 / EM-TouchFish II.

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
3. Confirm the page detects:

```text
EM-TouchFish II
Model 12
```

4. Open **开发者 / Serial Debug** and confirm the identity exchange contains:

```text
TX   aa 01 04 ee 9d
RX   aa 01 05 71 ee 0f
```

If model 12 is not detected, do not continue with writes.

## 2. Existing standard-key assignments

After model 12 is detected, the page now automatically sends read-only standard keyboard queries (`command 0x02`) for controls 1 through 8.

Verify at least two controls that already contain known keyboard / shortcut assignments before refreshing the page.

Expected behavior:

- the assignment reappears after reconnect / page refresh
- simple keys display by name, for example `Backspace`, `Enter`, `F14`
- known Mac presets are recognized, for example `锁定屏幕`, `Spotlight`, `Fn / Globe`
- a control using a non-keyboard official type (media / mouse / macro) may still show `未读取到标准键盘配置`; those protocol families are intentionally not guessed yet

Known query shape for Key 5:

```text
aa 02 06 01 05 ee a6
```

If the page sends the queries but no assignment is decoded, copy the exact `RX` frame from **Serial Debug**. That frame is enough to adjust the read parser without probing unknown commands.

## 3. F13 write

Use a physical key whose existing assignment is safe to overwrite.

1. Select the matching control in the UI.
2. Choose **F13**.
3. Click the write button.
4. Confirm the debug panel shows a `0x12` frame.
5. Press the physical TF05 key and verify macOS receives F13.

Known verified packet for Key3 -> F13:

```text
aa 12 0e 01 03 00 00 68 00 00 00 00 00 ee 24
```

## 4. F14 write

Repeat with F14.

Known verified packet for Key5 -> F14:

```text
aa 12 0e 01 05 00 00 69 00 00 00 00 00 ee 27
```

This packet was manually validated before the web UI implementation.

## 5. F20 proxy write

1. Select a physical control.
2. In the Mac tab select **Fn / Globe**.
3. Confirm the pending assignment explains that the device will emit F20.
4. Write the assignment.
5. Before enabling the macOS mapping, verify the control behaves as F20 if practical.

Expected Key5 -> F20 packet:

```text
aa 12 0e 01 05 00 00 6f 00 00 00 00 00 ee 2d
```

## 6. Fn / Globe mapping

Run:

```bash
hidutil property --set '{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0x70000006F,"HIDKeyboardModifierMappingDst":0xFF00000003}]}'
```

Press the TF05 control configured as Fn / Globe and verify the target macOS voice-input application reacts exactly as it does to a physical Fn / Globe key.

Restore the global mapping if needed:

```bash
hidutil property --set '{"UserKeyMapping":[]}'
```

## 7. Rotary controls

The official configurator exposes three separately assignable rotary actions. The web UI now exposes:

```text
index 6 -> 旋钮按下
index 7 -> 旋钮左转
index 8 -> 旋钮右转
```

The five normal key indices (1-5) are already verified. The 6/7/8 rotary ordering is isolated in one table and must be confirmed on the real device before the PR leaves draft.

Use harmless, distinct assignments so mistakes are obvious:

```text
旋钮按下 -> F13
旋钮左转 -> F14
旋钮右转 -> F15
```

Then test each physical action separately.

Pass if:

- pressing the knob emits only F13
- turning left emits only F14 per detent
- turning right emits only F15 per detent
- Key 1-5 behavior is unchanged

If the ordering differs, do not try random protocol commands. Record which physical action received each assignment; only the `TOUCHFISH_CONTROLS` index table needs changing.

## 8. Mac shortcut preset

Test at least one preset whose effect is easy to observe, for example:

- Spotlight: Command + Space
- Screenshot Selection: Command + Shift + 4
- Lock Screen: Control + Command + Q (only test when convenient)

Verify the physical TF05 control triggers exactly one shortcut and no extra key.

## 9. Custom shortcut

Configure a harmless custom shortcut such as Command + C or Command + A.

Verify:

- modifier byte is encoded correctly
- only the selected primary key is sent
- no stale modifier remains held after the key press

## Pass criteria

The current V1 branch passes hardware validation when:

- model 12 identity is detected reliably
- existing standard keyboard mappings survive refresh / reconnect and are decoded correctly
- F13 works
- F14 works
- F20 works as the Fn proxy
- rotary press / left / right indices are confirmed or corrected
- at least one Mac preset works
- at least one custom shortcut works
- reconnecting the device still permits identity detection, reading and writing
- no firmware / bootloader behavior is triggered

## Capture on failure

If any step fails, copy the **Serial Debug** output and record:

- selected physical control
- selected assignment
- expected behavior
- actual behavior
- macOS version
- browser + version

For assignment-read failures, include the full `RX` frame following the corresponding `aa 02 ...` query.

Do not experiment with unknown commands to diagnose a failure.
