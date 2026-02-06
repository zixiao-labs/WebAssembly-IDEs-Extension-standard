/**
 * Level 1: Storage Interface Tests
 *
 * Tests the storage functionality required for Level 1 conformance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostForLevel } from '../../harness/host-mock';

describe('core/storage', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostForLevel(1);
  });

  afterEach(() => {
    host.dispose();
  });

  describe('local storage', () => {
    it('should store and retrieve values', () => {
      host.setLocalStorage('key1', 'value1');
      expect(host.getLocalStorage('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(host.getLocalStorage('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      host.setLocalStorage('key', 'original');
      host.setLocalStorage('key', 'updated');
      expect(host.getLocalStorage('key')).toBe('updated');
    });

    it('should delete values', () => {
      host.setLocalStorage('key', 'value');
      const result = host.deleteLocalStorage('key');
      expect(result).toBe(true);
      expect(host.getLocalStorage('key')).toBeUndefined();
    });

    it('should return false when deleting nonexistent key', () => {
      const result = host.deleteLocalStorage('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('global storage', () => {
    it('should store and retrieve values', () => {
      host.setGlobalStorage('key1', 'value1');
      expect(host.getGlobalStorage('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(host.getGlobalStorage('nonexistent')).toBeUndefined();
    });

    it('should be separate from local storage', () => {
      host.setLocalStorage('key', 'local-value');
      host.setGlobalStorage('key', 'global-value');

      expect(host.getLocalStorage('key')).toBe('local-value');
      expect(host.getGlobalStorage('key')).toBe('global-value');
    });

    it('should delete values', () => {
      host.setGlobalStorage('key', 'value');
      const result = host.deleteGlobalStorage('key');
      expect(result).toBe(true);
      expect(host.getGlobalStorage('key')).toBeUndefined();
    });
  });

  describe('secret storage', () => {
    it('should store and retrieve secrets', () => {
      host.setSecret('api-key', 'secret-value');
      expect(host.getSecret('api-key')).toBe('secret-value');
    });

    it('should return undefined for missing secrets', () => {
      expect(host.getSecret('nonexistent')).toBeUndefined();
    });

    it('should delete secrets', () => {
      host.setSecret('api-key', 'secret-value');
      const result = host.deleteSecret('api-key');
      expect(result).toBe(true);
      expect(host.getSecret('api-key')).toBeUndefined();
    });
  });

  describe('permission check', () => {
    it('should have storage:local permission at Level 1', () => {
      expect(host.hasPermission('storage:local')).toBe(true);
    });

    it('should have storage:global permission at Level 1', () => {
      expect(host.hasPermission('storage:global')).toBe(true);
    });

    it('should not have storage permissions at Level 0', () => {
      const level0Host = createHostForLevel(0);
      expect(level0Host.hasPermission('storage:local')).toBe(false);
      expect(level0Host.hasPermission('storage:global')).toBe(false);
      level0Host.dispose();
    });
  });
});
