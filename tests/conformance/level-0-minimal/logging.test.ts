/**
 * Level 0: Logging Interface Tests
 *
 * Tests the logging functionality required for Level 0 conformance.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostForLevel } from '../../harness/host-mock';

describe('core/logging', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostForLevel(0);
  });

  afterEach(() => {
    host.dispose();
  });

  describe('log levels', () => {
    it('should log trace messages', () => {
      host.log('trace', 'Trace message');

      const logs = host.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('trace');
      expect(logs[0].message).toBe('Trace message');
    });

    it('should log debug messages', () => {
      host.log('debug', 'Debug message');

      const logs = host.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('debug');
      expect(logs[0].message).toBe('Debug message');
    });

    it('should log info messages', () => {
      host.log('info', 'Info message');

      const logs = host.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Info message');
    });

    it('should log warn messages', () => {
      host.log('warn', 'Warning message');

      const logs = host.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
    });

    it('should log error messages', () => {
      host.log('error', 'Error message');

      const logs = host.logs;
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('error');
      expect(logs[0].message).toBe('Error message');
    });
  });

  describe('log collection', () => {
    it('should collect multiple log entries', () => {
      host.log('info', 'First');
      host.log('info', 'Second');
      host.log('error', 'Third');

      const logs = host.logs;
      expect(logs).toHaveLength(3);
    });

    it('should preserve log order', () => {
      host.log('info', 'First');
      host.log('info', 'Second');
      host.log('info', 'Third');

      const logs = host.logs;
      expect(logs[0].message).toBe('First');
      expect(logs[1].message).toBe('Second');
      expect(logs[2].message).toBe('Third');
    });

    it('should include timestamps', () => {
      const before = Date.now();
      host.log('info', 'Message');
      const after = Date.now();

      const logs = host.logs;
      expect(logs[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(logs[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('log management', () => {
    it('should return a copy of logs (immutable)', () => {
      host.log('info', 'Original');

      const logs1 = host.logs;
      const logs2 = host.logs;

      expect(logs1).not.toBe(logs2);
      expect(logs1).toEqual(logs2);
    });

    it('should clear logs', () => {
      host.log('info', 'Message 1');
      host.log('info', 'Message 2');
      expect(host.logs).toHaveLength(2);

      host.clearLogs();
      expect(host.logs).toHaveLength(0);
    });
  });
});
