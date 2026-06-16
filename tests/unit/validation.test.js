import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateString,
  validateNumber,
  validateDiscordId,
  validateCustomId,
  validateRequiredProps,
  validateUrl,
  validateRange,
  validateEnum
} from '../../src/utils/validation.js';

// --- validateString ---

test('validateString returns valid string', () => {
  assert.equal(validateString('hello'), 'hello');
});

test('validateString returns null for non-string', () => {
  assert.equal(validateString(123), null);
  assert.equal(validateString(null), null);
});

test('validateString returns null for empty string', () => {
  assert.equal(validateString(''), null);
});

test('validateString truncates string exceeding maxLength', () => {
  assert.equal(validateString('abcdef', 'field', 3), 'abc');
});

// --- validateNumber ---

test('validateNumber returns valid non-negative number', () => {
  assert.equal(validateNumber(42), 42);
  assert.equal(validateNumber(0), 0);
});

test('validateNumber returns null for non-number', () => {
  assert.equal(validateNumber('abc'), null);
  assert.equal(validateNumber(NaN), null);
  assert.equal(validateNumber(null), null);
});

test('validateNumber returns null for negative number', () => {
  assert.equal(validateNumber(-1), null);
});

// --- validateDiscordId ---

test('validateDiscordId accepts valid 18-20 digit ID', () => {
  assert.equal(validateDiscordId('123456789012345678'), '123456789012345678');
  assert.equal(validateDiscordId('12345678901234567890'), '12345678901234567890');
});

test('validateDiscordId rejects invalid IDs', () => {
  assert.equal(validateDiscordId('12345'), null);
  assert.equal(validateDiscordId('abc'), null);
  assert.equal(validateDiscordId(123456789012345678), null);
  assert.equal(validateDiscordId(''), null);
});

// --- validateCustomId ---

test('validateCustomId accepts valid alphanumeric custom IDs', () => {
  assert.equal(validateCustomId('my-button_1'), 'my-button_1');
});

test('validateCustomId rejects empty string', () => {
  assert.equal(validateCustomId(''), null);
  assert.equal(validateCustomId(null), null);
});

test('validateCustomId rejects strings over 100 chars', () => {
  assert.equal(validateCustomId('a'.repeat(101)), null);
});

test('validateCustomId rejects strings with invalid characters', () => {
  assert.equal(validateCustomId('hello world'), null);
  assert.equal(validateCustomId('hello!'), null);
});

// --- validateRequiredProps ---

test('validateRequiredProps returns true when all props present', () => {
  assert.equal(validateRequiredProps({ a: 1, b: 2 }, ['a', 'b']), true);
});

test('validateRequiredProps returns false when props missing', () => {
  assert.equal(validateRequiredProps({ a: 1 }, ['a', 'b']), false);
});

test('validateRequiredProps returns false for non-object', () => {
  assert.equal(validateRequiredProps(null, ['a']), false);
  assert.equal(validateRequiredProps('string', ['a']), false);
});

// --- validateUrl ---

test('validateUrl accepts valid URLs', () => {
  assert.equal(validateUrl('https://example.com'), 'https://example.com');
  assert.equal(validateUrl('http://localhost:3000/path'), 'http://localhost:3000/path');
});

test('validateUrl rejects invalid URLs', () => {
  assert.equal(validateUrl('not-a-url'), null);
  assert.equal(validateUrl(''), null);
  assert.equal(validateUrl(null), null);
});

// --- validateRange ---

test('validateRange returns value within range', () => {
  assert.equal(validateRange(5, 1, 10), 5);
  assert.equal(validateRange(1, 1, 10), 1);
  assert.equal(validateRange(10, 1, 10), 10);
});

test('validateRange returns null for value outside range', () => {
  assert.equal(validateRange(0, 1, 10), null);
  assert.equal(validateRange(11, 1, 10), null);
});

test('validateRange returns null for non-number', () => {
  assert.equal(validateRange('abc', 1, 10), null);
  assert.equal(validateRange(NaN, 1, 10), null);
});

// --- validateEnum ---

test('validateEnum returns value if in allowed values', () => {
  assert.equal(validateEnum('a', ['a', 'b', 'c']), 'a');
});

test('validateEnum returns null if not in allowed values', () => {
  assert.equal(validateEnum('d', ['a', 'b', 'c']), null);
});
