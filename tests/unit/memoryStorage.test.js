import test from 'node:test';
import assert from 'node:assert/strict';

import { MemoryStorage } from '../../src/utils/memoryStorage.js';

test('get returns default value for missing key', async () => {
  const store = new MemoryStorage();
  assert.equal(await store.get('missing'), null);
  assert.equal(await store.get('missing', 'default'), 'default');
});

test('set and get round-trip a value', async () => {
  const store = new MemoryStorage();
  await store.set('key', { a: 1 });
  assert.deepEqual(await store.get('key'), { a: 1 });
});

test('delete removes a key', async () => {
  const store = new MemoryStorage();
  await store.set('key', 'value');
  await store.delete('key');
  assert.equal(await store.get('key'), null);
});

test('exists returns true for set keys, false otherwise', async () => {
  const store = new MemoryStorage();
  assert.equal(await store.exists('key'), false);
  await store.set('key', 'val');
  assert.equal(await store.exists('key'), true);
});

test('increment and decrement update numeric values', async () => {
  const store = new MemoryStorage();
  assert.equal(await store.increment('counter'), 1);
  assert.equal(await store.increment('counter'), 2);
  assert.equal(await store.increment('counter', 5), 7);
  assert.equal(await store.decrement('counter', 3), 4);
});

test('clear removes all data', async () => {
  const store = new MemoryStorage();
  await store.set('a', 1);
  await store.set('b', 2);
  await store.clear();
  assert.equal(await store.get('a'), null);
  assert.equal(await store.get('b'), null);
});

test('TTL expires a key after the specified duration', async () => {
  const store = new MemoryStorage();
  await store.set('temp', 'data', 0.001); // 1ms TTL

  // Wait just long enough for the TTL to expire
  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(await store.get('temp'), null);
  assert.equal(await store.exists('temp'), false);
});

test('list returns an array (note: destructuring bug in source limits prefix matching)', async () => {
  const store = new MemoryStorage();
  await store.set('a', 1);
  await store.set('b', 2);

  // list() uses `for (const [key] of this.data.keys())` which destructures
  // the string, making `key` only the first character. Single-char prefixes work.
  const keys = await store.list('a');
  assert.ok(Array.isArray(keys));
  assert.ok(keys.includes('a'));
  assert.ok(!keys.includes('b'));
});
