/**
 * Collaboration: CRDT Interface Tests
 *
 * Tests the CRDT functionality for the collaboration optional capability.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HostMock, createHostWithCollaboration } from '../../harness/host-mock';

describe('collaboration/crdt', () => {
  let host: HostMock;

  beforeEach(() => {
    host = createHostWithCollaboration();
  });

  afterEach(() => {
    host.dispose();
  });

  describe('permission check', () => {
    it('should have collaboration:crdt permission', () => {
      expect(host.hasPermission('collaboration:crdt')).toBe(true);
    });

    it('should have collaboration:session permission', () => {
      expect(host.hasPermission('collaboration:session')).toBe(true);
    });

    it('should have collaboration:awareness permission', () => {
      expect(host.hasPermission('collaboration:awareness')).toBe(true);
    });

    it('should have network:realtime permission', () => {
      expect(host.hasPermission('network:realtime')).toBe(true);
    });
  });

  // Note: Full CRDT tests would require a real CRDT implementation
  // These tests verify the permission model and basic structure

  describe('integration with editor', () => {
    it('should have editor:read permission for cursor sync', () => {
      expect(host.hasPermission('editor:read')).toBe(true);
    });

    it('should have editor:selection permission for selection sync', () => {
      expect(host.hasPermission('editor:selection')).toBe(true);
    });
  });
});
