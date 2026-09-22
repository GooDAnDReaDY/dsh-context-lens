import assert from 'node:assert/strict';
import { test } from 'node:test';
import { skeletonize } from '../lib/ast/skeletonizer.js';
import * as tracker from '../lib/tokens/tracker.js';

test('skeletonizer supports multiline TypeScript signatures', () => {
  const tsCode = `
import { Request, Response } from 'express';

export async function handleUserQuery(
  userId: string,
  queryOptions: { depth?: number; filter?: boolean },
  metadata: Record<string, unknown>
): Promise<Result> {
  const a = 1;
  const b = 2;
  return { ok: true };
}

export class UserService {
  public async getUser(
    id: string
  ): Promise<User> {
    return db.find(id);
  }
}
`;
  const sk = skeletonize(tsCode, { language: 'ts' });
  assert.ok(sk.includes('handleUserQuery('), 'includes handleUserQuery');
  assert.ok(sk.includes('Promise<Result>'), 'accumulated multiline return type');
  assert.ok(!sk.includes('const a = 1;'), 'dropped body statements');
  assert.ok(sk.includes('UserService'), 'kept class name');
  assert.ok(sk.includes('getUser('), 'kept multiline method signature');
  assert.ok(!sk.includes('return db.find(id)'), 'dropped method body');
});

test('skeletonizer supports multiline Rust and Go function signatures', () => {
  const rustCode = `
pub async fn fetch_remote_stats(
    client: &HttpClient,
    endpoint: &str,
    timeout_ms: u64,
) -> Result<StatsResponse, NetworkError> {
    let res = client.get(endpoint).send().await?;
    Ok(res)
}
`;
  const sk = skeletonize(rustCode, { language: 'rust' });
  assert.ok(sk.includes('fetch_remote_stats('), 'kept rust fn start');
  assert.ok(sk.includes('Result<StatsResponse'), 'accumulated return type');
  assert.ok(!sk.includes('client.get(endpoint)'), 'dropped rust fn body');
});

test('tracker reset clears stats, counts, and history', () => {
  tracker.record('const x = 1;', 'x');
  assert.ok(tracker.getHistory().length > 0, 'history has entries');
  assert.ok(tracker.getStats().calls > 0, 'calls > 0');

  tracker.reset();
  assert.equal(tracker.getHistory().length, 0, 'tracker history cleared');
  const stats = tracker.getStats();
  assert.equal(stats.totalOriginal, 0, 'totalOriginal reset');
  assert.equal(stats.calls, 0, 'calls reset');
});
