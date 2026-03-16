import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessingEventEmitter } from '../observers/ProcessingEventEmitter';
import { IProcessingObserver, IProcessingEvent } from '../interfaces/IVideoProcessing';

describe('ProcessingEventEmitter (Observer Pattern)', () => {
  let emitter: ProcessingEventEmitter;

  beforeEach(() => {
    emitter = new ProcessingEventEmitter();
  });

  it('should notify a subscribed observer', () => {
    const handler = vi.fn();
    const observer: IProcessingObserver = { onEvent: handler };
    emitter.subscribe(observer);

    const event: IProcessingEvent = { type: 'started', message: 'Begin' };
    emitter.notify(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should notify multiple observers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.subscribe({ onEvent: h1 });
    emitter.subscribe({ onEvent: h2 });

    emitter.notify({ type: 'progress', progress: 50 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it('should not notify unsubscribed observers', () => {
    const handler = vi.fn();
    const observer: IProcessingObserver = { onEvent: handler };
    emitter.subscribe(observer);
    emitter.unsubscribe(observer);

    emitter.notify({ type: 'complete', message: 'Done' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear all observers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.subscribe({ onEvent: h1 });
    emitter.subscribe({ onEvent: h2 });
    emitter.clear();

    emitter.notify({ type: 'started' });
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('should not crash if an observer throws', () => {
    const badObserver: IProcessingObserver = {
      onEvent: () => { throw new Error('Observer error'); },
    };
    const goodHandler = vi.fn();
    emitter.subscribe(badObserver);
    emitter.subscribe({ onEvent: goodHandler });

    expect(() => emitter.notify({ type: 'started' })).not.toThrow();
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });
});
