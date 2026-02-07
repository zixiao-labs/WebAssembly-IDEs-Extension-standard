/**
 * Level 1: Events Interface Tests
 *
 * Tests the events functionality required for Level 1 conformance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostForLevel } from '../../harness/host-mock';

describe('core/events', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostForLevel(1);
  });

  afterEach(() => {
    host.dispose();
  });

  describe('event subscription', () => {
    it('should subscribe to events', () => {
      const handle = host.subscribeEvent(['file-changed', 'file-created']);
      expect(handle).toBeGreaterThan(0);
    });

    it('should subscribe to single event kind', () => {
      const handle = host.subscribeEvent(['file-changed']);
      expect(handle).toBeGreaterThan(0);
    });

    it('should generate unique handles', () => {
      const handle1 = host.subscribeEvent(['file-changed']);
      const handle2 = host.subscribeEvent(['file-deleted']);
      expect(handle1).not.toBe(handle2);
    });

    it('should unsubscribe from events', () => {
      const handle = host.subscribeEvent(['file-changed']);
      const result = host.unsubscribeEvent(handle);
      expect(result).toBe(true);
    });

    it('should return false when unsubscribing invalid handle', () => {
      const result = host.unsubscribeEvent(9999);
      expect(result).toBe(false);
    });
  });

  describe('event polling', () => {
    it('should return empty array when no events', () => {
      const events = host.pollEvents();
      expect(events).toEqual([]);
    });

    it('should return pending events', () => {
      host.pushEvent({
        kind: 'file-changed',
        timestamp: Date.now(),
        payload: JSON.stringify({ uri: '/test/file.ts' }),
      });

      const events = host.pollEvents();
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('file-changed');
    });

    it('should clear events after polling', () => {
      host.pushEvent({
        kind: 'file-changed',
        timestamp: Date.now(),
        payload: JSON.stringify({ uri: '/test/file.ts' }),
      });

      host.pollEvents();
      const events = host.pollEvents();
      expect(events).toHaveLength(0);
    });

    it('should preserve event order', () => {
      host.pushEvent({ kind: 'file-created', timestamp: 1, payload: '{}' });
      host.pushEvent({ kind: 'file-changed', timestamp: 2, payload: '{}' });
      host.pushEvent({ kind: 'file-deleted', timestamp: 3, payload: '{}' });

      const events = host.pollEvents();
      expect(events[0].kind).toBe('file-created');
      expect(events[1].kind).toBe('file-changed');
      expect(events[2].kind).toBe('file-deleted');
    });
  });

  describe('file change events', () => {
    it('should trigger file created event', () => {
      host.setFile('/test/new-file.ts', 'content');
      host.triggerFileChange('/test/new-file.ts', 'created');

      const events = host.pollEvents();
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('file-created');
    });

    it('should trigger file changed event', () => {
      host.setFile('/test/file.ts', 'content');
      host.triggerFileChange('/test/file.ts', 'changed');

      const events = host.pollEvents();
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('file-changed');
    });

    it('should trigger file deleted event', () => {
      host.triggerFileChange('/test/file.ts', 'deleted');

      const events = host.pollEvents();
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('file-deleted');
    });

    it('should include file URI in payload', () => {
      host.triggerFileChange('/test/file.ts', 'changed');

      const events = host.pollEvents();
      const payload = JSON.parse(events[0].payload);
      expect(payload.uri).toBe('/test/file.ts');
    });
  });

  describe('permission check', () => {
    it('should have core:events permission at Level 1', () => {
      expect(host.hasPermission('core:events')).toBe(true);
    });

    it('should not have core:events at Level 0', () => {
      const level0Host = createHostForLevel(0);
      expect(level0Host.hasPermission('core:events')).toBe(false);
      level0Host.dispose();
    });
  });
});
