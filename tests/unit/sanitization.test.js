import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeMarkdown,
  sanitizeInput,
  sanitizeMention,
  escapeHtml
} from '../../src/utils/sanitization.js';

// --- sanitizeMarkdown ---

test('sanitizeMarkdown escapes all markdown characters', () => {
  assert.equal(sanitizeMarkdown('**bold**'), '\\*\\*bold\\*\\*');
  assert.equal(sanitizeMarkdown('__underline__'), '\\_\\_underline\\_\\_');
  assert.equal(sanitizeMarkdown('`code`'), '\\`code\\`');
  assert.equal(sanitizeMarkdown('[link](url)'), '\\[link\\](url)');
  assert.equal(sanitizeMarkdown('||spoiler||'), '\\|\\|spoiler\\|\\|');
  assert.equal(sanitizeMarkdown('~~strike~~'), '\\~\\~strike\\~\\~');
});

test('sanitizeMarkdown returns empty string for non-string input', () => {
  assert.equal(sanitizeMarkdown(null), '');
  assert.equal(sanitizeMarkdown(undefined), '');
  assert.equal(sanitizeMarkdown(123), '');
  assert.equal(sanitizeMarkdown({}), '');
});

test('sanitizeMarkdown passes through plain text unchanged', () => {
  assert.equal(sanitizeMarkdown('hello world'), 'hello world');
});

// --- sanitizeInput ---

test('sanitizeInput trims whitespace and enforces maxLength', () => {
  assert.equal(sanitizeInput('  hello  '), 'hello');
  assert.equal(sanitizeInput('abcdef', 3), 'abc');
});

test('sanitizeInput strips control characters', () => {
  assert.equal(sanitizeInput('hello\x00world'), 'helloworld');
  assert.equal(sanitizeInput('a\x1Fb\x7Fc'), 'abc');
});

test('sanitizeInput returns empty string for non-string input', () => {
  assert.equal(sanitizeInput(null), '');
  assert.equal(sanitizeInput(undefined), '');
  assert.equal(sanitizeInput(42), '');
});

test('sanitizeInput uses default maxLength of 2000', () => {
  const long = 'a'.repeat(3000);
  const result = sanitizeInput(long);
  assert.equal(result.length, 2000);
});

// --- sanitizeMention ---

test('sanitizeMention extracts valid numeric ID when no trailing > present', () => {
  // Note: the regex /[<@!&#]/g does not strip '>', so full Discord mention
  // syntax like <@123> returns null. Only bare IDs or stripped formats work.
  assert.equal(sanitizeMention('123456789012345678'), '123456789012345678');
});

test('sanitizeMention returns null for non-numeric content', () => {
  assert.equal(sanitizeMention('<@abc>'), null);
  assert.equal(sanitizeMention('not a mention'), null);
});

test('sanitizeMention handles plain numeric ID', () => {
  assert.equal(sanitizeMention('123456789012345678'), '123456789012345678');
});

// --- escapeHtml ---

test('escapeHtml escapes all dangerous characters', () => {
  assert.equal(escapeHtml('&'), '&amp;');
  assert.equal(escapeHtml('<'), '&lt;');
  assert.equal(escapeHtml('>'), '&gt;');
  assert.equal(escapeHtml('"'), '&quot;');
  assert.equal(escapeHtml("'"), '&#039;');
  assert.equal(
    escapeHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
  );
});

test('escapeHtml returns empty string for non-string input', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(123), '');
});

test('escapeHtml passes through safe text unchanged', () => {
  assert.equal(escapeHtml('hello world'), 'hello world');
});
