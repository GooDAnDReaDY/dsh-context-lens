// shared token estimate (~chars/4)
export function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export default { estimateTokens };
