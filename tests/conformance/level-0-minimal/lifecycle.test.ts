/**
 * Level 0: Lifecycle Interface Tests
 *
 * Tests the core lifecycle functionality required for Level 0 conformance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostForLevel } from '../../harness/host-mock';

describe('core/lifecycle', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostForLevel(0);
  });

  afterEach(() => {
    host.dispose();
  });

  describe('activate', () => {
    it('should successfully activate an extension', async () => {
      // In a real test, we would load a WASM module
      // For now, we test the host mock behavior
      const mockInstance = {
        exports: {
          activate: () => 0, // 0 = success
        },
      } as unknown as WebAssembly.Instance;

      const result = await host.activate(mockInstance);
      expect(result.ok).toBe(true);
      expect(host.isActive).toBe(true);
    });

    it('should handle activation failure', async () => {
      const mockInstance = {
        exports: {
          activate: () => 1, // non-zero = failure
        },
      } as unknown as WebAssembly.Instance;

      const result = await host.activate(mockInstance);
      expect(result.ok).toBe(false);
      expect(host.isActive).toBe(false);
    });

    it('should handle activation exceptions', async () => {
      const mockInstance = {
        exports: {
          activate: () => {
            throw new Error('Activation error');
          },
        },
      } as unknown as WebAssembly.Instance;

      const result = await host.activate(mockInstance);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Activation error');
    });
  });

  describe('deactivate', () => {
    it('should call deactivate with shutdown reason', async () => {
      let receivedReason = -1;
      const mockInstance = {
        exports: {
          activate: () => 0,
          deactivate: (reason: number) => {
            receivedReason = reason;
          },
        },
      } as unknown as WebAssembly.Instance;

      await host.activate(mockInstance);
      await host.deactivate(mockInstance, 'shutdown');

      expect(host.deactivateCalled).toBe(true);
      expect(host.deactivateReason?.kind).toBe('shutdown');
      expect(receivedReason).toBe(1); // 'shutdown' is index 1
    });

    it('should support user-disabled reason', async () => {
      let receivedReason = -1;
      const mockInstance = {
        exports: {
          activate: () => 0,
          deactivate: (reason: number) => {
            receivedReason = reason;
          },
        },
      } as unknown as WebAssembly.Instance;

      await host.activate(mockInstance);
      await host.deactivate(mockInstance, 'user-disabled');

      expect(host.deactivateReason?.kind).toBe('user-disabled');
      expect(receivedReason).toBe(0); // 'user-disabled' is index 0
    });

    it('should support uninstalled reason', async () => {
      let receivedReason = -1;
      const mockInstance = {
        exports: {
          activate: () => 0,
          deactivate: (reason: number) => {
            receivedReason = reason;
          },
        },
      } as unknown as WebAssembly.Instance;

      await host.activate(mockInstance);
      await host.deactivate(mockInstance, 'uninstalled');

      expect(host.deactivateReason?.kind).toBe('uninstalled');
      expect(receivedReason).toBe(2); // 'uninstalled' is index 2
    });

    it('should support error reason', async () => {
      let receivedReason = -1;
      const mockInstance = {
        exports: {
          activate: () => 0,
          deactivate: (reason: number) => {
            receivedReason = reason;
          },
        },
      } as unknown as WebAssembly.Instance;

      await host.activate(mockInstance);
      await host.deactivate(mockInstance, 'error');

      expect(host.deactivateReason?.kind).toBe('error');
      expect(receivedReason).toBe(3); // 'error' is index 3
    });
  });

  describe('isActive', () => {
    it('should return false before activation', () => {
      expect(host.isActive).toBe(false);
    });

    it('should return true after successful activation', async () => {
      const mockInstance = {
        exports: {
          activate: () => 0,
        },
      } as unknown as WebAssembly.Instance;

      await host.activate(mockInstance);
      expect(host.isActive).toBe(true);
    });
  });
});
