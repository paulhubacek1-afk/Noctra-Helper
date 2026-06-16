import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getErrorMetadata,
  getDefaultErrorCodeByType,
  resolveErrorCode,
  ErrorCodes,
  ErrorCodeRegistry
} from '../../src/utils/errorRegistry.js';

// --- getErrorMetadata ---

test('getErrorMetadata returns metadata for known error code', () => {
  const meta = getErrorMetadata(ErrorCodes.DATABASE_ERROR);
  assert.equal(meta.severity, 'high');
  assert.equal(meta.retryable, true);
  assert.ok(meta.remediation.includes('Postgres'));
});

test('getErrorMetadata returns UNKNOWN_ERROR metadata for null/undefined', () => {
  const meta = getErrorMetadata(null);
  assert.equal(meta.severity, 'high');
  assert.equal(meta.retryable, false);
});

test('getErrorMetadata returns UNKNOWN_ERROR metadata for unrecognized code', () => {
  const meta = getErrorMetadata('DOES_NOT_EXIST');
  assert.equal(meta, ErrorCodeRegistry[ErrorCodes.UNKNOWN_ERROR]);
});

test('getErrorMetadata normalizes case and whitespace', () => {
  const meta = getErrorMetadata('  database_error  ');
  assert.equal(meta.severity, 'high');
});

// --- getDefaultErrorCodeByType ---

test('getDefaultErrorCodeByType maps known types', () => {
  assert.equal(getDefaultErrorCodeByType('validation'), ErrorCodes.VALIDATION_FAILED);
  assert.equal(getDefaultErrorCodeByType('database'), ErrorCodes.DATABASE_ERROR);
  assert.equal(getDefaultErrorCodeByType('permission'), ErrorCodes.PERMISSION_DENIED);
});

test('getDefaultErrorCodeByType returns UNKNOWN_ERROR for unknown type', () => {
  assert.equal(getDefaultErrorCodeByType('nonexistent'), ErrorCodes.UNKNOWN_ERROR);
  assert.equal(getDefaultErrorCodeByType(), ErrorCodes.UNKNOWN_ERROR);
});

// --- resolveErrorCode ---

test('resolveErrorCode prefers context.errorCode', () => {
  assert.equal(
    resolveErrorCode({ error: null, errorType: 'database', context: { errorCode: 'RATE_LIMITED' } }),
    'RATE_LIMITED'
  );
});

test('resolveErrorCode falls back to error.context.errorCode', () => {
  const error = { context: { errorCode: 'NETWORK_ERROR' } };
  assert.equal(resolveErrorCode({ error }), 'NETWORK_ERROR');
});

test('resolveErrorCode falls back to error.code', () => {
  const error = { code: 'DISCORD_API_ERROR' };
  assert.equal(resolveErrorCode({ error }), 'DISCORD_API_ERROR');
});

test('resolveErrorCode falls back to type default', () => {
  assert.equal(resolveErrorCode({ errorType: 'database' }), ErrorCodes.DATABASE_ERROR);
});

test('resolveErrorCode returns UNKNOWN_ERROR with no args', () => {
  assert.equal(resolveErrorCode(), ErrorCodes.UNKNOWN_ERROR);
});
