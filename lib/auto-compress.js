/** Decide whether auto-compress should trigger for a log blob. */
export function shouldAutoCompress(text, threshold) {
  if (!threshold || threshold <= 0) return false;
  return (text || '').length > threshold || (text || '').split('\n').length > 100;
}

export default { shouldAutoCompress };
