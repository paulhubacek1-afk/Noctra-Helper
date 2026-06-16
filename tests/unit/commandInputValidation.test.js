import test from 'node:test';
import assert from 'node:assert/strict';

import { validateChatInputPayloadOrThrow } from '../../src/utils/commandInputValidation.js';

test('accepts a valid command interaction payload', () => {
  const interaction = {
    commandName: 'ping',
    options: {
      data: [
        { name: 'target', type: 6, value: '123456789012345678' }
      ]
    }
  };

  const result = validateChatInputPayloadOrThrow(interaction);
  assert.equal(result.commandName, 'ping');
  assert.equal(result.options.length, 1);
});

test('accepts payload with no options data', () => {
  const interaction = { commandName: 'help', options: {} };
  const result = validateChatInputPayloadOrThrow(interaction);
  assert.equal(result.commandName, 'help');
  assert.deepEqual(result.options, []);
});

test('accepts payload with nested sub-command options', () => {
  const interaction = {
    commandName: 'config',
    options: {
      data: [
        {
          name: 'set',
          type: 1,
          options: [
            { name: 'key', type: 3, value: 'prefix' }
          ]
        }
      ]
    }
  };

  const result = validateChatInputPayloadOrThrow(interaction);
  assert.equal(result.options[0].name, 'set');
  assert.equal(result.options[0].options[0].value, 'prefix');
});

test('throws for missing commandName', () => {
  assert.throws(
    () => validateChatInputPayloadOrThrow({ options: { data: [] } }),
    (err) => err.name === 'TitanBotError' && err.type === 'validation'
  );
});

test('throws for invalid option shape', () => {
  const interaction = {
    commandName: 'test',
    options: {
      data: [{ name: '', type: 0 }]
    }
  };

  assert.throws(
    () => validateChatInputPayloadOrThrow(interaction),
    (err) => err.name === 'TitanBotError'
  );
});

test('throws for overly long commandName', () => {
  assert.throws(
    () => validateChatInputPayloadOrThrow({
      commandName: 'a'.repeat(33),
      options: { data: [] }
    }),
    (err) => err.name === 'TitanBotError'
  );
});
