/**
 * Custom Test Assertions for IDE Extension Standard
 *
 * This module provides custom assertions for testing extension behavior.
 */

import { expect } from 'vitest';
import type { HostMock, LogEntry, MockNotification } from './host-mock';
import type { ExtensionInstance } from './wasm-runtime';

// ============================================================================
// Log Assertions
// ============================================================================

/**
 * Assert that a log entry with the given level and message exists
 */
export function expectLog(host: HostMock, level: LogEntry['level'], message: string): void {
  const logs = host.logs;
  const found = logs.some((log) => log.level === level && log.message.includes(message));
  expect(found, `Expected log [${level}] containing "${message}"`).toBe(true);
}

/**
 * Assert that no error logs exist
 */
export function expectNoErrors(host: HostMock): void {
  const errors = host.logs.filter((log) => log.level === 'error');
  expect(errors, 'Expected no error logs').toHaveLength(0);
}

/**
 * Assert that a specific log message exists at any level
 */
export function expectLogMessage(host: HostMock, message: string): void {
  const logs = host.logs;
  const found = logs.some((log) => log.message.includes(message));
  expect(found, `Expected log containing "${message}"`).toBe(true);
}

/**
 * Assert log count by level
 */
export function expectLogCount(host: HostMock, level: LogEntry['level'], count: number): void {
  const logs = host.logs.filter((log) => log.level === level);
  expect(logs).toHaveLength(count);
}

// ============================================================================
// Notification Assertions
// ============================================================================

/**
 * Assert that a notification was shown
 */
export function expectNotification(
  host: HostMock,
  kind: MockNotification['kind'],
  message: string
): void {
  const notifications = host.notifications;
  const found = notifications.some((n) => n.kind === kind && n.message.includes(message));
  expect(found, `Expected ${kind} notification containing "${message}"`).toBe(true);
}

/**
 * Assert notification count
 */
export function expectNotificationCount(host: HostMock, count: number): void {
  expect(host.notifications).toHaveLength(count);
}

// ============================================================================
// Permission Assertions
// ============================================================================

/**
 * Assert that a permission is granted
 */
export function expectPermissionGranted(host: HostMock, permission: string): void {
  expect(host.hasPermission(permission), `Expected permission "${permission}" to be granted`).toBe(
    true
  );
}

/**
 * Assert that a permission is denied
 */
export function expectPermissionDenied(host: HostMock, permission: string): void {
  expect(host.hasPermission(permission), `Expected permission "${permission}" to be denied`).toBe(
    false
  );
}

// ============================================================================
// Storage Assertions
// ============================================================================

/**
 * Assert that a storage key exists
 */
export function expectStorageKey(
  host: HostMock,
  storage: 'local' | 'global' | 'secret',
  key: string
): void {
  let value: string | undefined;
  switch (storage) {
    case 'local':
      value = host.getLocalStorage(key);
      break;
    case 'global':
      value = host.getGlobalStorage(key);
      break;
    case 'secret':
      value = host.getSecret(key);
      break;
  }
  expect(value, `Expected ${storage} storage key "${key}" to exist`).toBeDefined();
}

/**
 * Assert storage value
 */
export function expectStorageValue(
  host: HostMock,
  storage: 'local' | 'global' | 'secret',
  key: string,
  value: string
): void {
  let actual: string | undefined;
  switch (storage) {
    case 'local':
      actual = host.getLocalStorage(key);
      break;
    case 'global':
      actual = host.getGlobalStorage(key);
      break;
    case 'secret':
      actual = host.getSecret(key);
      break;
  }
  expect(actual).toBe(value);
}

// ============================================================================
// File Assertions
// ============================================================================

/**
 * Assert that a file exists
 */
export function expectFileExists(host: HostMock, uri: string): void {
  expect(host.fileExists(uri), `Expected file "${uri}" to exist`).toBe(true);
}

/**
 * Assert that a file does not exist
 */
export function expectFileNotExists(host: HostMock, uri: string): void {
  expect(host.fileExists(uri), `Expected file "${uri}" to not exist`).toBe(false);
}

/**
 * Assert file content
 */
export function expectFileContent(host: HostMock, uri: string, content: string): void {
  const file = host.getFile(uri);
  expect(file, `Expected file "${uri}" to exist`).toBeDefined();
  expect(file?.content).toBe(content);
}

// ============================================================================
// Command Assertions
// ============================================================================

/**
 * Assert that a command is registered
 */
export function expectCommandRegistered(host: HostMock, commandId: string): void {
  const commands = host.getCommands();
  const found = commands.some((c) => c.id === commandId);
  expect(found, `Expected command "${commandId}" to be registered`).toBe(true);
}

/**
 * Assert command count
 */
export function expectCommandCount(host: HostMock, count: number): void {
  expect(host.getCommands()).toHaveLength(count);
}

// ============================================================================
// Lifecycle Assertions
// ============================================================================

/**
 * Assert that the extension is active
 */
export function expectActive(host: HostMock): void {
  expect(host.isActive, 'Expected extension to be active').toBe(true);
}

/**
 * Assert that the extension is not active
 */
export function expectNotActive(host: HostMock): void {
  expect(host.isActive, 'Expected extension to not be active').toBe(false);
}

/**
 * Assert that deactivate was called
 */
export function expectDeactivated(host: HostMock): void {
  expect(host.deactivateCalled, 'Expected deactivate to be called').toBe(true);
}

/**
 * Assert deactivation reason
 */
export function expectDeactivationReason(
  host: HostMock,
  reason: 'user-disabled' | 'shutdown' | 'uninstalled' | 'error'
): void {
  expect(host.deactivateReason?.kind).toBe(reason);
}

// ============================================================================
// Extension Export Assertions
// ============================================================================

/**
 * Assert that an extension exports a function
 */
export function expectExport(ext: ExtensionInstance, name: string): void {
  const exports = Object.keys(ext.instance.exports);
  expect(exports, `Expected extension to export "${name}"`).toContain(name);
}

/**
 * Assert that an extension exports required functions for a level
 */
export function expectLevelExports(ext: ExtensionInstance, level: number): void {
  // Level 0: Must export activate
  expectExport(ext, 'activate');

  // Additional level-specific exports would be checked here
}

// ============================================================================
// Event Assertions
// ============================================================================

/**
 * Assert that events were received
 */
export function expectEventsReceived(host: HostMock, count: number): void {
  const events = host.pollEvents();
  expect(events).toHaveLength(count);
}

/**
 * Assert that an event of a specific kind was received
 */
export function expectEventKind(host: HostMock, kind: string): void {
  const events = host.pollEvents();
  const found = events.some((e) => e.kind === kind);
  expect(found, `Expected event of kind "${kind}"`).toBe(true);
}

// ============================================================================
// Result Assertions
// ============================================================================

/**
 * Assert that a result is ok
 */
export function expectOk<T>(result: { ok: boolean; error?: string; value?: T }): T | undefined {
  expect(result.ok, `Expected ok but got error: ${result.error}`).toBe(true);
  return result.value;
}

/**
 * Assert that a result is an error
 */
export function expectError(result: { ok: boolean; error?: string }): string {
  expect(result.ok, 'Expected error but got ok').toBe(false);
  return result.error ?? 'Unknown error';
}

/**
 * Assert that a result error contains a message
 */
export function expectErrorContains(result: { ok: boolean; error?: string }, message: string): void {
  expect(result.ok).toBe(false);
  expect(result.error).toContain(message);
}
