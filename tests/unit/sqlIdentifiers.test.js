import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertAllowlistedIdentifier,
  quoteIdentifier
} from '../../src/utils/sqlIdentifiers.js';

const allowlist = new Set(['users', 'guilds', 'economy_data']);

// --- assertAllowlistedIdentifier ---

test('assertAllowlistedIdentifier returns valid identifier in allowlist', () => {
  assert.equal(assertAllowlistedIdentifier('users', allowlist), 'users');
  assert.equal(assertAllowlistedIdentifier('economy_data', allowlist), 'economy_data');
});

test('assertAllowlistedIdentifier throws for non-string input', () => {
  assert.throws(() => assertAllowlistedIdentifier(null, allowlist), /non-empty string/);
  assert.throws(() => assertAllowlistedIdentifier(123, allowlist), /non-empty string/);
  assert.throws(() => assertAllowlistedIdentifier('', allowlist), /non-empty string/);
  assert.throws(() => assertAllowlistedIdentifier('  ', allowlist), /non-empty string/);
});

test('assertAllowlistedIdentifier throws for unsafe characters', () => {
  assert.throws(() => assertAllowlistedIdentifier('DROP TABLE', allowlist), /unsafe characters/);
  assert.throws(() => assertAllowlistedIdentifier('users;--', allowlist), /unsafe characters/);
  assert.throws(() => assertAllowlistedIdentifier('Users', allowlist), /unsafe characters/);
});

test('assertAllowlistedIdentifier throws for identifier not in allowlist', () => {
  assert.throws(() => assertAllowlistedIdentifier('secrets', allowlist), /not in the allowlist/);
});

// --- quoteIdentifier ---

test('quoteIdentifier wraps identifier in double quotes', () => {
  assert.equal(quoteIdentifier('users'), '"users"');
  assert.equal(quoteIdentifier('economy_data'), '"economy_data"');
});
