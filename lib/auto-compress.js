/**
 * Fast check whether a text blob contains at least minLines lines
 * without allocating substring arrays in the V8 heap.
 */
export function hasAtLeastLines(text, minLines) {
  if (!text || typeof text !== 'string') return false;
  if (minLines <= 1) return text.length > 0;
  let count = 1;
  let pos = -1;
  while ((pos = text.indexOf('\n', pos + 1)) !== -1) {
    count++;
    if (count >= minLines) return true;
  }
  return false;
}

/** Decide whether auto-compress should trigger for a log blob. */
export function shouldAutoCompress(text, threshold) {
  if (!threshold || threshold <= 0) return false;
  return (text || '').length > threshold || hasAtLeastLines(text, 101);
}

export default { shouldAutoCompress, hasAtLeastLines };
