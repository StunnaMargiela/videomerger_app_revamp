import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from '../container';

describe('Container (DI Container)', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it('should register and resolve a transient service', () => {
    container.register<string>('greeting', () => 'hello');
    const result = container.resolve<string>('greeting');
    expect(result).toBe('hello');
  });

  it('should create a new instance for each transient resolve', () => {
    container.register<object>('obj', () => ({ value: Math.random() }));
    const a = container.resolve<{ value: number }>('obj');
    const b = container.resolve<{ value: number }>('obj');
    expect(a).not.toBe(b);
  });

  it('should register and resolve a singleton service', () => {
    container.register<object>('singleton', () => ({ id: 1 }), true);
    const a = container.resolve<{ id: number }>('singleton');
    const b = container.resolve<{ id: number }>('singleton');
    expect(a).toBe(b);
  });

  it('should throw when resolving an unregistered service', () => {
    expect(() => container.resolve('unknown')).toThrow('Service not found: unknown');
  });

  it('should report whether a key is registered via has()', () => {
    expect(container.has('key')).toBe(false);
    container.register('key', () => 42);
    expect(container.has('key')).toBe(true);
  });

  it('should clear all services', () => {
    container.register('a', () => 1);
    container.register('b', () => 2, true);
    container.clear();
    expect(container.has('a')).toBe(false);
    expect(container.has('b')).toBe(false);
  });
});
