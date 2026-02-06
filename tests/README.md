# IDE Extension Standard Test Suite

This directory contains the conformance test suite for the IDE Extension Standard. IDEs implementing the standard can run these tests to verify their compliance.

## Directory Structure

```
tests/
├── conformance/              # Conformance level tests
│   ├── level-0-minimal/     # Core lifecycle, logging, context
│   ├── level-1-basic/       # Commands, notifications, storage, events
│   ├── level-2-editor/      # Text, selection, decorations
│   ├── level-3-workspace/   # Filesystem, project, menus
│   ├── level-4-language/    # Completion, diagnostics, hover, etc.
│   └── level-5-full/        # Network, webviews
├── optional/                 # Optional capability tests
│   └── collaboration/       # CRDT, awareness, session tests
├── fixtures/                 # Test fixtures
│   └── test-extensions/     # Pre-compiled WASM test modules
├── harness/                  # Test infrastructure
│   ├── host-mock.ts         # Mock host implementation
│   ├── wasm-runtime.ts      # WASM runtime wrapper
│   └── assertions.ts        # Custom test assertions
└── README.md                # This file
```

## Running Tests

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Running All Tests

```bash
npm test
```

### Running Specific Conformance Level

```bash
# Test up to Level 3
npm test -- --level 3

# Test only Level 2
npm test -- --only-level 2
```

### Running Against Your IDE

```bash
# Point to your IDE's extension host
npm test -- --host /path/to/your/ide-extension-host

# Generate conformance report
npm test -- --host /path/to/your/ide-extension-host --report
```

## Test Categories

Each conformance level tests the following aspects:

### Interface Tests
Verify that each WIT function is callable and returns the expected types.

### Permission Tests
Verify that permission enforcement works correctly:
- Granted permissions allow access
- Missing permissions are denied
- Permission escalation prompts work

### Resource Tests
Verify that resource limits are enforced:
- Memory limits
- File handle limits
- Connection limits

### Timeout Tests
Verify that operations respect timeout limits.

### Error Tests
Verify that error handling matches the specification.

## Writing Tests

Tests use Vitest and follow this pattern:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { HostMock } from '../harness/host-mock';
import { loadTestExtension } from '../harness/wasm-runtime';

describe('core/lifecycle', () => {
  let host: HostMock;
  let extension: WebAssembly.Instance;

  beforeAll(async () => {
    host = new HostMock();
    extension = await loadTestExtension('lifecycle-test.wasm', host);
  });

  afterAll(() => {
    host.dispose();
  });

  it('should call activate on startup', async () => {
    const result = await host.activate(extension);
    expect(result.ok).toBe(true);
    expect(host.logs).toContain({ level: 'info', message: 'Extension activated' });
  });

  it('should call deactivate on shutdown', async () => {
    await host.deactivate(extension, 'shutdown');
    expect(host.deactivateCalled).toBe(true);
  });
});
```

## Test Extensions

Pre-compiled test extensions are in `fixtures/test-extensions/`. These are minimal WASM modules that exercise specific interfaces.

To build test extensions:

```bash
cd fixtures/test-extensions
cargo build --target wasm32-wasip2
```

## Conformance Report

After running tests, a conformance report is generated:

```
IDE Extension Standard Conformance Report
=========================================
IDE: Your IDE v1.0.0
Standard Version: 0.1.0
Test Date: 2026-02-06

Level 0 (Minimal): PASS (4/4)
  ✓ core/extension
  ✓ core/lifecycle
  ✓ core/logging
  ✓ core/context

Level 1 (Basic): PASS (4/4)
  ✓ ui/commands
  ✓ ui/notifications
  ✓ core/storage
  ✓ core/events

...

RESULT: Level 3 Conformance (Workspace)

Optional Capabilities:
  ✓ collaboration (PASS)
```

## Contributing

When adding new tests:

1. Place interface tests in the appropriate conformance level directory
2. Follow the naming convention: `<interface>.test.ts`
3. Include both positive and negative test cases
4. Test permission enforcement
5. Document any IDE-specific behavior

## License

Apache 2.0 - See [LICENSE](../LICENSE) for details.
