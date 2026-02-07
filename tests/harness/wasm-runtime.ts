/**
 * WASM Runtime Wrapper for IDE Extension Standard Tests
 *
 * This module provides utilities for loading and running WASM extensions
 * in a test environment.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HostMock } from './host-mock';

// ============================================================================
// Types
// ============================================================================

export interface LoadOptions {
  /** Host mock to use for imports */
  host: HostMock;
  /** Additional imports to merge */
  additionalImports?: WebAssembly.Imports;
  /** Memory limits */
  memory?: {
    initial?: number;
    maximum?: number;
  };
}

export interface ExtensionInstance {
  /** The WASM instance */
  instance: WebAssembly.Instance;
  /** The WASM module */
  module: WebAssembly.Module;
  /** Memory export */
  memory: WebAssembly.Memory;
  /** Host mock */
  host: HostMock;
}

// ============================================================================
// WASM Loading
// ============================================================================

/**
 * Load a test extension WASM file
 */
export async function loadTestExtension(
  filename: string,
  host: HostMock,
  options?: Partial<LoadOptions>
): Promise<ExtensionInstance> {
  const fixturesDir = path.join(__dirname, '../fixtures/test-extensions');
  const wasmPath = path.join(fixturesDir, filename);

  if (!fs.existsSync(wasmPath)) {
    throw new Error(`Test extension not found: ${wasmPath}`);
  }

  const wasmBytes = fs.readFileSync(wasmPath);
  return loadExtensionFromBytes(wasmBytes, host, options);
}

/**
 * Load an extension from WASM bytes
 */
export async function loadExtensionFromBytes(
  bytes: BufferSource,
  host: HostMock,
  options?: Partial<LoadOptions>
): Promise<ExtensionInstance> {
  const module = await WebAssembly.compile(bytes);

  // Create memory
  const memory = new WebAssembly.Memory({
    initial: options?.memory?.initial ?? 16, // 1 MB default
    maximum: options?.memory?.maximum ?? 256, // 16 MB max
  });

  // Merge imports
  const imports: WebAssembly.Imports = {
    ...host.createImports(),
    ...options?.additionalImports,
    env: {
      memory,
    },
  };

  // Instantiate
  const instance = await WebAssembly.instantiate(module, imports);

  // Set memory on host for string reading
  host.setMemory(memory);

  return {
    instance,
    module,
    memory,
    host,
  };
}

/**
 * Load an extension from a file path
 */
export async function loadExtensionFromPath(
  wasmPath: string,
  host: HostMock,
  options?: Partial<LoadOptions>
): Promise<ExtensionInstance> {
  const bytes = fs.readFileSync(wasmPath);
  return loadExtensionFromBytes(bytes, host, options);
}

// ============================================================================
// Extension Execution Helpers
// ============================================================================

/**
 * Call the activate export on an extension
 */
export async function activateExtension(
  ext: ExtensionInstance
): Promise<{ ok: boolean; error?: string }> {
  try {
    const activate = ext.instance.exports.activate as () => number;
    if (!activate) {
      return { ok: false, error: 'Extension does not export activate function' };
    }
    const result = activate();
    return { ok: result === 0 };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Call the deactivate export on an extension
 */
export async function deactivateExtension(
  ext: ExtensionInstance,
  reason: 'user-disabled' | 'shutdown' | 'uninstalled' | 'error' = 'shutdown'
): Promise<void> {
  const deactivate = ext.instance.exports.deactivate as ((reason: number) => void) | undefined;
  if (!deactivate) {
    return;
  }
  const reasonCode = ['user-disabled', 'shutdown', 'uninstalled', 'error'].indexOf(reason);
  deactivate(reasonCode);
}

/**
 * Check if an extension exports a specific function
 */
export function hasExport(ext: ExtensionInstance, name: string): boolean {
  return typeof ext.instance.exports[name] === 'function';
}

/**
 * Get a list of all function exports
 */
export function getExports(ext: ExtensionInstance): string[] {
  return Object.entries(ext.instance.exports)
    .filter(([, value]) => typeof value === 'function')
    .map(([name]) => name);
}

// ============================================================================
// Memory Helpers
// ============================================================================

/**
 * Read a string from WASM memory
 */
export function readString(ext: ExtensionInstance, ptr: number, len: number): string {
  const view = new Uint8Array(ext.memory.buffer, ptr, len);
  return new TextDecoder().decode(view);
}

/**
 * Write a string to WASM memory (requires malloc export)
 */
export function writeString(
  ext: ExtensionInstance,
  str: string
): { ptr: number; len: number } | null {
  const malloc = ext.instance.exports.malloc as ((size: number) => number) | undefined;
  if (!malloc) {
    return null;
  }

  const encoded = new TextEncoder().encode(str);
  const ptr = malloc(encoded.length);
  const view = new Uint8Array(ext.memory.buffer, ptr, encoded.length);
  view.set(encoded);

  return { ptr, len: encoded.length };
}

/**
 * Free memory (requires free export)
 */
export function freeMemory(ext: ExtensionInstance, ptr: number): void {
  const free = ext.instance.exports.free as ((ptr: number) => void) | undefined;
  if (free) {
    free(ptr);
  }
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a minimal WASM module for testing
 * This creates a simple module that just exports activate/deactivate
 */
export function createMinimalTestModule(): Uint8Array {
  // Minimal WAT:
  // (module
  //   (func (export "activate") (result i32) (i32.const 0))
  //   (func (export "deactivate") (param i32))
  // )
  return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // WASM magic
    0x01, 0x00, 0x00, 0x00, // Version 1

    // Type section
    0x01, 0x0b, 0x02, // section, size, count
    0x60, 0x00, 0x01, 0x7f, // () -> i32
    0x60, 0x01, 0x7f, 0x00, // (i32) -> ()

    // Function section
    0x03, 0x03, 0x02, // section, size, count
    0x00, 0x01, // function indices

    // Export section
    0x07, 0x17, 0x02, // section, size, count
    0x08, // name length
    0x61,
    0x63,
    0x74,
    0x69,
    0x76,
    0x61,
    0x74,
    0x65, // "activate"
    0x00,
    0x00, // func, index 0
    0x0a, // name length
    0x64,
    0x65,
    0x61,
    0x63,
    0x74,
    0x69,
    0x76,
    0x61,
    0x74,
    0x65, // "deactivate"
    0x00,
    0x01, // func, index 1

    // Code section
    0x0a, 0x09, 0x02, // section, size, count
    0x04, 0x00, 0x41, 0x00, 0x0b, // activate: (i32.const 0)
    0x02, 0x00, 0x0b, // deactivate: nop
  ]);
}

/**
 * Verify that a WASM module has the required exports for a conformance level
 */
export function verifyExportsForLevel(ext: ExtensionInstance, level: number): string[] {
  const missing: string[] = [];
  const exports = getExports(ext);

  // Level 0: Must have activate
  if (!exports.includes('activate')) {
    missing.push('activate');
  }

  // Additional level requirements would be checked here
  // based on the WIT interface definitions

  return missing;
}
