import test from 'node:test';
import assert from 'node:assert/strict';

import {
  checkRateLimit,
  getRateLimitStatus,
  clearRateLimit,
  clearAllRateLimits
} from '../../src/utils/rateLimiter.js';

test('checkRateLimit allows requests under the limit', async () => {
  clearAllRateLimits();
  assert.equal(await checkRateLimit('test:1', 3, 60000), true);
  assert.equal(await checkRateLimit('test:1', 3, 60000), true);
  assert.equal(await checkRateLimit('test:1', 3, 60000), true);
});

test('checkRateLimit blocks after exceeding the limit', async () => {
  clearAllRateLimits();
  await checkRateLimit('test:2', 2, 60000);
  await checkRateLimit('test:2', 2, 60000);
  assert.equal(await checkRateLimit('test:2', 2, 60000), false);
});

test('checkRateLimit resets after window expires', async () => {
  clearAllRateLimits();
  await checkRateLimit('test:3', 1, 1); // 1ms window
  await new Promise((r) => setTimeout(r, 10));
  assert.equal(await checkRateLimit('test:3', 1, 1), true);
});

test('getRateLimitStatus returns correct info', async () => {
  clearAllRateLimits();
  const fresh = getRateLimitStatus('test:4');
  assert.equal(fresh.limited, false);

  await checkRateLimit('test:4', 5, 60000);
  const status = getRateLimitStatus('test:4', 60000);
  assert.equal(status.attempts, 1);
  assert.ok(status.remaining > 0);
});

test('clearRateLimit removes a single key', async () => {
  clearAllRateLimits();
  await checkRateLimit('test:5', 1, 60000);
  clearRateLimit('test:5');
  assert.equal(await checkRateLimit('test:5', 1, 60000), true);
});

test('clearAllRateLimits resets everything', async () => {
  await checkRateLimit('test:6', 1, 60000);
  await checkRateLimit('test:7', 1, 60000);
  clearAllRateLimits();
  assert.equal(await checkRateLimit('test:6', 1, 60000), true);
  assert.equal(await checkRateLimit('test:7', 1, 60000), true);
});
