export function computeChecksum(bytes: ArrayLike<number>): number {
  let sum = 0
  for (let index = 0; index < bytes.length; index += 1) {
    sum = (sum + bytes[index]) & 0xff
  }
  return sum
}

export function hasValidChecksum(frame: Uint8Array): boolean {
  if (frame.length < 2) return false
  const expected = computeChecksum(frame.subarray(0, frame.length - 1))
  return frame[frame.length - 1] === expected
}
