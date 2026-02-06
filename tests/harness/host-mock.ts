/**
 * Mock Host Implementation for IDE Extension Standard Tests
 *
 * This module provides a mock implementation of the IDE extension host
 * that can be used for testing extensions and verifying conformance.
 */

import type { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LogEntry {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  storagePath: string;
  globalStoragePath: string;
}

export interface DeactivationReason {
  kind: 'user-disabled' | 'shutdown' | 'uninstalled' | 'error';
}

export interface Permission {
  name: string;
  granted: boolean;
}

export interface EventSubscription {
  handle: number;
  kinds: string[];
  pattern?: string;
}

export interface MockFile {
  content: string | Uint8Array;
  mtime: number;
  ctime: number;
  readonly: boolean;
}

export interface MockNotification {
  kind: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export interface MockCommand {
  id: string;
  title: string;
  handler?: () => Promise<void>;
}

// ============================================================================
// Host Mock Implementation
// ============================================================================

export class HostMock {
  // State
  private _activated = false;
  private _deactivateCalled = false;
  private _deactivateReason?: DeactivationReason;

  // Logs
  private _logs: LogEntry[] = [];

  // Permissions
  private _permissions: Map<string, boolean> = new Map();

  // Storage
  private _localStorage: Map<string, string> = new Map();
  private _globalStorage: Map<string, string> = new Map();
  private _secretStorage: Map<string, string> = new Map();

  // Filesystem
  private _files: Map<string, MockFile> = new Map();
  private _watchers: Map<number, { pattern: string; callback: (event: any) => void }> = new Map();
  private _nextWatcherHandle = 1;

  // UI
  private _notifications: MockNotification[] = [];
  private _commands: Map<string, MockCommand> = new Map();

  // Events
  private _eventSubscriptions: Map<number, EventSubscription> = new Map();
  private _pendingEvents: any[] = [];
  private _nextEventHandle = 1;

  // Context
  private _context: ExtensionContext = {
    extensionId: 'test-extension',
    extensionPath: '/test/extensions/test-extension',
    storagePath: '/test/storage/test-extension',
    globalStoragePath: '/test/global-storage',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  async activate(instance: WebAssembly.Instance): Promise<{ ok: boolean; error?: string }> {
    try {
      const activate = instance.exports.activate as () => number;
      const result = activate();
      this._activated = result === 0;
      return { ok: this._activated };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  async deactivate(
    instance: WebAssembly.Instance,
    reason: DeactivationReason['kind']
  ): Promise<void> {
    const deactivate = instance.exports.deactivate as (reason: number) => void;
    const reasonCode = ['user-disabled', 'shutdown', 'uninstalled', 'error'].indexOf(reason);
    deactivate(reasonCode);
    this._deactivateCalled = true;
    this._deactivateReason = { kind: reason };
  }

  get isActive(): boolean {
    return this._activated;
  }

  get deactivateCalled(): boolean {
    return this._deactivateCalled;
  }

  get deactivateReason(): DeactivationReason | undefined {
    return this._deactivateReason;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────────────────

  log(level: LogEntry['level'], message: string): void {
    this._logs.push({ level, message, timestamp: Date.now() });
  }

  get logs(): LogEntry[] {
    return [...this._logs];
  }

  clearLogs(): void {
    this._logs = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Context
  // ─────────────────────────────────────────────────────────────────────────

  getContext(): ExtensionContext {
    return { ...this._context };
  }

  setContext(context: Partial<ExtensionContext>): void {
    this._context = { ...this._context, ...context };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Permissions
  // ─────────────────────────────────────────────────────────────────────────

  grantPermission(permission: string): void {
    this._permissions.set(permission, true);
  }

  revokePermission(permission: string): void {
    this._permissions.set(permission, false);
  }

  hasPermission(permission: string): boolean {
    // Check exact match
    if (this._permissions.get(permission)) return true;

    // Check wildcard (e.g., editor:* grants editor:read)
    const [category] = permission.split(':');
    if (this._permissions.get(`${category}:*`)) return true;

    return false;
  }

  getPermissions(): Permission[] {
    return Array.from(this._permissions.entries()).map(([name, granted]) => ({
      name,
      granted,
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Storage
  // ─────────────────────────────────────────────────────────────────────────

  setLocalStorage(key: string, value: string): void {
    this._localStorage.set(key, value);
  }

  getLocalStorage(key: string): string | undefined {
    return this._localStorage.get(key);
  }

  deleteLocalStorage(key: string): boolean {
    return this._localStorage.delete(key);
  }

  setGlobalStorage(key: string, value: string): void {
    this._globalStorage.set(key, value);
  }

  getGlobalStorage(key: string): string | undefined {
    return this._globalStorage.get(key);
  }

  deleteGlobalStorage(key: string): boolean {
    return this._globalStorage.delete(key);
  }

  setSecret(key: string, value: string): void {
    this._secretStorage.set(key, value);
  }

  getSecret(key: string): string | undefined {
    return this._secretStorage.get(key);
  }

  deleteSecret(key: string): boolean {
    return this._secretStorage.delete(key);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Filesystem
  // ─────────────────────────────────────────────────────────────────────────

  setFile(uri: string, content: string | Uint8Array, options?: Partial<MockFile>): void {
    const now = Date.now();
    this._files.set(uri, {
      content,
      mtime: options?.mtime ?? now,
      ctime: options?.ctime ?? now,
      readonly: options?.readonly ?? false,
    });
  }

  getFile(uri: string): MockFile | undefined {
    return this._files.get(uri);
  }

  deleteFile(uri: string): boolean {
    return this._files.delete(uri);
  }

  fileExists(uri: string): boolean {
    return this._files.has(uri);
  }

  listFiles(pattern?: string): string[] {
    const uris = Array.from(this._files.keys());
    if (!pattern) return uris;

    // Simple glob matching (supports * and **)
    const regex = new RegExp(
      '^' +
        pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          .replace(/\?/g, '.') +
        '$'
    );
    return uris.filter((uri) => regex.test(uri));
  }

  watchFiles(pattern: string, callback: (event: any) => void): number {
    const handle = this._nextWatcherHandle++;
    this._watchers.set(handle, { pattern, callback });
    return handle;
  }

  unwatchFiles(handle: number): boolean {
    return this._watchers.delete(handle);
  }

  // Trigger file change events for testing
  triggerFileChange(uri: string, changeType: 'created' | 'changed' | 'deleted'): void {
    const event = { uri, changeType, timestamp: Date.now() };

    for (const [, watcher] of this._watchers) {
      const regex = new RegExp(
        '^' +
          watcher.pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\?/g, '.') +
          '$'
      );
      if (regex.test(uri)) {
        watcher.callback(event);
      }
    }

    // Also add to pending events
    this._pendingEvents.push({
      kind: `file-${changeType}`,
      timestamp: Date.now(),
      payload: JSON.stringify({ uri }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────────────

  showNotification(kind: MockNotification['kind'], message: string): void {
    this._notifications.push({ kind, message, timestamp: Date.now() });
  }

  get notifications(): MockNotification[] {
    return [...this._notifications];
  }

  clearNotifications(): void {
    this._notifications = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Commands
  // ─────────────────────────────────────────────────────────────────────────

  registerCommand(id: string, title: string, handler?: () => Promise<void>): void {
    this._commands.set(id, { id, title, handler });
  }

  unregisterCommand(id: string): boolean {
    return this._commands.delete(id);
  }

  async executeCommand(id: string): Promise<{ ok: boolean; error?: string }> {
    const command = this._commands.get(id);
    if (!command) {
      return { ok: false, error: `Command not found: ${id}` };
    }
    if (command.handler) {
      try {
        await command.handler();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }
    return { ok: true };
  }

  getCommands(): MockCommand[] {
    return Array.from(this._commands.values());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Events
  // ─────────────────────────────────────────────────────────────────────────

  subscribeEvent(kinds: string[], pattern?: string): number {
    const handle = this._nextEventHandle++;
    this._eventSubscriptions.set(handle, { handle, kinds, pattern });
    return handle;
  }

  unsubscribeEvent(handle: number): boolean {
    return this._eventSubscriptions.delete(handle);
  }

  pollEvents(): any[] {
    const events = [...this._pendingEvents];
    this._pendingEvents = [];
    return events;
  }

  pushEvent(event: any): void {
    this._pendingEvents.push(event);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Host Imports (WASM bindings)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates the import object for WASM instantiation.
   * This maps WIT interface functions to host implementations.
   */
  createImports(): WebAssembly.Imports {
    return {
      'ide-extension:core/logging@0.1.0': {
        'log-trace': (ptr: number, len: number) => {
          this.log('trace', this.readString(ptr, len));
        },
        'log-debug': (ptr: number, len: number) => {
          this.log('debug', this.readString(ptr, len));
        },
        'log-info': (ptr: number, len: number) => {
          this.log('info', this.readString(ptr, len));
        },
        'log-warn': (ptr: number, len: number) => {
          this.log('warn', this.readString(ptr, len));
        },
        'log-error': (ptr: number, len: number) => {
          this.log('error', this.readString(ptr, len));
        },
      },
      'ide-extension:core/context@0.1.0': {
        'get-extension-id': () => this._context.extensionId,
        'get-extension-path': () => this._context.extensionPath,
        'has-permission': (permPtr: number, permLen: number) => {
          const permission = this.readString(permPtr, permLen);
          return this.hasPermission(permission) ? 1 : 0;
        },
      },
      'ide-extension:ui/notifications@0.1.0': {
        'show-info': (ptr: number, len: number) => {
          this.showNotification('info', this.readString(ptr, len));
        },
        'show-warning': (ptr: number, len: number) => {
          this.showNotification('warning', this.readString(ptr, len));
        },
        'show-error': (ptr: number, len: number) => {
          this.showNotification('error', this.readString(ptr, len));
        },
      },
      // Add more interface bindings as needed...
    };
  }

  // Memory helpers (simplified - real implementation needs proper memory management)
  private _memory?: WebAssembly.Memory;

  setMemory(memory: WebAssembly.Memory): void {
    this._memory = memory;
  }

  private readString(_ptr: number, _len: number): string {
    // Simplified - real implementation reads from WASM memory
    return '[mock string]';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────

  dispose(): void {
    this._logs = [];
    this._permissions.clear();
    this._localStorage.clear();
    this._globalStorage.clear();
    this._secretStorage.clear();
    this._files.clear();
    this._watchers.clear();
    this._notifications = [];
    this._commands.clear();
    this._eventSubscriptions.clear();
    this._pendingEvents = [];
    this._activated = false;
    this._deactivateCalled = false;
  }

  /**
   * Reset to initial state (for test isolation)
   */
  reset(): void {
    this.dispose();
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a pre-configured host mock for a specific conformance level
 */
export function createHostForLevel(level: number): HostMock {
  const host = new HostMock();

  // Level 0: Core permissions (always available)
  // No additional permissions needed

  if (level >= 1) {
    // Level 1: Basic
    host.grantPermission('ui:commands');
    host.grantPermission('ui:notifications');
    host.grantPermission('storage:local');
    host.grantPermission('storage:global');
    host.grantPermission('core:events');
  }

  if (level >= 2) {
    // Level 2: Editor
    host.grantPermission('editor:read');
    host.grantPermission('editor:write');
    host.grantPermission('editor:selection');
    host.grantPermission('editor:decorations');
  }

  if (level >= 3) {
    // Level 3: Workspace
    host.grantPermission('workspace:read');
    host.grantPermission('workspace:write');
    host.grantPermission('workspace:config');
    host.grantPermission('ui:quickpick');
    host.grantPermission('ui:menus');
  }

  if (level >= 4) {
    // Level 4: Language
    host.grantPermission('language:completion');
    host.grantPermission('language:diagnostics');
    host.grantPermission('language:hover');
    host.grantPermission('language:definition');
    host.grantPermission('language:symbols');
  }

  if (level >= 5) {
    // Level 5: Full
    host.grantPermission('network:fetch');
    host.grantPermission('network:websocket');
    host.grantPermission('network:realtime');
    host.grantPermission('ui:webview');
    host.grantPermission('storage:secrets');
  }

  return host;
}

/**
 * Create a host mock with collaboration capability
 */
export function createHostWithCollaboration(): HostMock {
  const host = createHostForLevel(2); // Need at least editor access

  host.grantPermission('collaboration:session');
  host.grantPermission('collaboration:crdt');
  host.grantPermission('collaboration:awareness');
  host.grantPermission('network:realtime');
  host.grantPermission('core:events');

  return host;
}
