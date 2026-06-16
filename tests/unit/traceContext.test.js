import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createTraceId,
  createInteractionTraceContext,
  runWithTraceContext,
  getTraceContext,
  getTraceId
} from '../../src/utils/traceContext.js';

// --- createTraceId ---

test('createTraceId returns a prefixed UUID string', () => {
  const id = createTraceId();
  assert.ok(id.startsWith('trc_'));
  assert.ok(id.length > 10);
  assert.ok(!id.includes('-'));
});

test('createTraceId supports custom prefix', () => {
  const id = createTraceId('evt');
  assert.ok(id.startsWith('evt_'));
});

// --- createInteractionTraceContext ---

test('createInteractionTraceContext extracts fields from interaction', () => {
  const interaction = {
    id: 'int-1',
    type: 2,
    guildId: 'g-1',
    channelId: 'c-1',
    user: { id: 'u-1' },
    isChatInputCommand: () => true,
    commandName: 'ping'
  };

  const ctx = createInteractionTraceContext(interaction);
  assert.ok(ctx.traceId.startsWith('trc_'));
  assert.equal(ctx.interactionId, 'int-1');
  assert.equal(ctx.guildId, 'g-1');
  assert.equal(ctx.channelId, 'c-1');
  assert.equal(ctx.userId, 'u-1');
  assert.equal(ctx.command, 'ping');
});

test('createInteractionTraceContext handles null interaction gracefully', () => {
  const ctx = createInteractionTraceContext(null);
  assert.ok(ctx.traceId);
  assert.equal(ctx.interactionId, null);
  assert.equal(ctx.command, null);
});

test('createInteractionTraceContext applies overrides', () => {
  const ctx = createInteractionTraceContext(null, { guildId: 'override' });
  assert.equal(ctx.guildId, 'override');
});

// --- runWithTraceContext / getTraceContext / getTraceId ---

test('runWithTraceContext makes context available inside callback', () => {
  const ctx = { traceId: 'test-123', command: 'ban' };
  runWithTraceContext(ctx, () => {
    assert.deepEqual(getTraceContext(), ctx);
    assert.equal(getTraceId(), 'test-123');
  });
});

test('getTraceContext returns null outside any context', () => {
  assert.equal(getTraceContext(), null);
  assert.equal(getTraceId(), null);
});
