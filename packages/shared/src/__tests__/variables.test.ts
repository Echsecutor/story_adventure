import { describe, it, expect } from 'vitest';
import { replace_variables } from '../variables.js';

describe('replace_variables', () => {
  it('should replace single variable', () => {
    expect(replace_variables('Hello ${name}', { name: 'Alice' })).toBe(
      'Hello Alice'
    );
  });

  it('should replace multiple occurrences of same variable', () => {
    expect(
      replace_variables('${name} says hello to ${name}', { name: 'Bob' })
    ).toBe('Bob says hello to Bob');
  });

  it('should replace multiple different variables', () => {
    expect(
      replace_variables('Hello ${name}, your score is ${score}', {
        name: 'Alice',
        score: '100',
      })
    ).toBe('Hello Alice, your score is 100');
  });

  it('should handle empty string', () => {
    expect(replace_variables('', { name: 'Alice' })).toBe('');
  });

  it('should handle null/undefined text', () => {
    expect(replace_variables(null, { name: 'Alice' })).toBe('');
    expect(replace_variables(undefined, { name: 'Alice' })).toBe('');
  });

  it('should handle null/undefined variables', () => {
    expect(replace_variables('Hello ${name}', null)).toBe('Hello ${name}');
    expect(replace_variables('Hello ${name}', undefined)).toBe('Hello ${name}');
  });

  it('should leave unmatched variables unchanged', () => {
    expect(replace_variables('Hello ${name}', { other: 'value' })).toBe(
      'Hello ${name}'
    );
  });

  it('should handle variables with special characters', () => {
    expect(
      replace_variables('Value: ${var1}', { var1: 'test-value_123' })
    ).toBe('Value: test-value_123');
  });

  it('should handle empty variable values', () => {
    expect(replace_variables('Hello ${name}', { name: '' })).toBe('Hello ');
  });
});
