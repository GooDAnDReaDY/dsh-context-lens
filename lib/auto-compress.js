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

const TEST_BUILD_CMD_RE = /\b(test|pytest|jest|vitest|mocha|ava|tap|build|compile|tsc|cargo|mvn|gradle|make|rake|bundle\s+exec)\b/i;
const TEST_BUILD_SIG_RE = /(TAP version|# Subtest:|tests?\s+(passed|failed|run)|===.*FAILURES.*===|test result:|running \d+ test|BUILD (FAILED|SUCCESS)|npm ERR!|ERR!|error\[E\d+\]|compilation (error|failed)|Traceback \(most recent call last\)|AssertionError|panic:|\bFAIL\b|\bPASS\b|Ran \d+ tests?|modules transformed|built in \d+|ok\s+\d+|not ok\s+\d+)/i;

/** Check whether command or text signatures indicate test or build logs */
export function isTestOrBuildLog(text, command) {
  if (command && typeof command === 'string' && TEST_BUILD_CMD_RE.test(command)) {
    return true;
  }
  if (!text || typeof text !== 'string') return false;
  return TEST_BUILD_SIG_RE.test(text);
}

/**
 * Decide whether auto-compress should trigger.
 * Only triggers if the output is large enough AND matches test/build signatures.
 * Non-test/build outputs are left to DSH core pruner/spill policy.
 */
export function shouldAutoCompress(text, threshold = 4000, command) {
  if (!threshold || threshold <= 0) return false;
  if (!text || typeof text !== 'string') return false;
  const isLarge = text.length > threshold || hasAtLeastLines(text, 101);
  if (!isLarge) return false;
  return isTestOrBuildLog(text, command);
}

export default { shouldAutoCompress, isTestOrBuildLog, hasAtLeastLines };