/**
 * Level 0: Context Interface Tests
 *
 * Tests the context functionality required for Level 0 conformance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostForLevel } from '../../harness/host-mock';

describe('core/context', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostForLevel(0);
  });

  afterEach(() => {
    host.dispose();
  });

  describe('extension metadata', () => {
    it('should provide extension ID', () => {
      const ctx = host.getContext();
      expect(ctx.extensionId).toBe('test-extension');
    });

    it('should provide extension path', () => {
      const ctx = host.getContext();
      expect(ctx.extensionPath).toBe('/test/extensions/test-extension');
    });

    it('should provide storage path', () => {
      const ctx = host.getContext();
      expect(ctx.storagePath).toBe('/test/storage/test-extension');
    });

    it('should provide global storage path', () => {
      const ctx = host.getContext();
      expect(ctx.globalStoragePath).toBe('/test/global-storage');
    });

    it('should allow setting custom context', () => {
      host.setContext({
        extensionId: 'custom-extension',
        extensionPath: '/custom/path',
      });

      const ctx = host.getContext();
      expect(ctx.extensionId).toBe('custom-extension');
      expect(ctx.extensionPath).toBe('/custom/path');
      // Unchanged properties remain
      expect(ctx.storagePath).toBe('/test/storage/test-extension');
    });
  });

  describe('context immutability', () => {
    it('should return a copy of context', () => {
      const ctx1 = host.getContext();
      const ctx2 = host.getContext();

      expect(ctx1).not.toBe(ctx2);
      expect(ctx1).toEqual(ctx2);
    });
  });
});
