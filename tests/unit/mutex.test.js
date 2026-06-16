import test from 'node:test';
import assert from 'node:assert/strict';

import { Mutex } from '../../src/utils/mutex.js';

test('Mutex.runExclusive returns the task result', async () => {
  const result = await Mutex.runExclusive('key-1', async () => 42);
  assert.equal(result, 42);
});

test('Mutex.runExclusive serializes concurrent tasks on the same key', async () => {
  const order = [];

  const task1 = Mutex.runExclusive('key-2', async () => {
    await new Promise((r) => setTimeout(r, 30));
    order.push('first');
  });

  const task2 = Mutex.runExclusive('key-2', async () => {
    order.push('second');
  });

  await Promise.all([task1, task2]);
  assert.deepEqual(order, ['first', 'second']);
});

test('Mutex.runExclusive allows parallel execution on different keys', async () => {
  const order = [];

  const task1 = Mutex.runExclusive('key-a', async () => {
    await new Promise((r) => setTimeout(r, 20));
    order.push('a');
  });

  const task2 = Mutex.runExclusive('key-b', async () => {
    order.push('b');
  });

  await Promise.all([task1, task2]);
  assert.deepEqual(order, ['b', 'a']);
});

test('Mutex.runExclusive propagates task errors', async () => {
  await assert.rejects(
    () => Mutex.runExclusive('key-3', async () => { throw new Error('boom'); }),
    { message: 'boom' }
  );
});

test('Mutex.runExclusive continues after a previous task fails', async () => {
  const task1 = Mutex.runExclusive('key-4', async () => { throw new Error('fail'); });
  await task1.catch(() => {});

  const result = await Mutex.runExclusive('key-4', async () => 'recovered');
  assert.equal(result, 'recovered');
});
