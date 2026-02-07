# Extension Manifest Specification

**Version:** 0.1.0

## Overview

Every extension must include an `extension.json` manifest file at the package root. This file declares metadata, permissions, activation events, and capabilities.

## Schema

The manifest follows the JSON Schema defined in `/schemas/manifest.schema.json`.

## Required Fields

### `name`

**Type:** `string`
**Pattern:** `^[a-z][a-z0-9-]*$`

Unique identifier for the extension. Must be lowercase, start with a letter, and contain only letters, numbers, and hyphens.

```json
{
  "name": "my-extension"
}
```

### `version`

**Type:** `string`
**Format:** Semantic version (major.minor.patch)

```json
{
  "version": "1.0.0"
}
```

### `runtime`

**Type:** `string`
**Values:** `wasm32-wasi`

The WebAssembly target runtime.

```json
{
  "runtime": "wasm32-wasi"
}
```

### `main`

**Type:** `string`

Path to the main WebAssembly module relative to the package root.

```json
{
  "main": "extension.wasm"
}
```

### `standardVersion`

**Type:** `string`

The minimum version of this standard required.

```json
{
  "standardVersion": "0.1.0"
}
```

## Optional Fields

### `displayName`

**Type:** `string`

Human-readable name for display in the IDE.

```json
{
  "displayName": "My Awesome Extension"
}
```

### `description`

**Type:** `string`

Brief description of the extension.

### `publisher`

**Type:** `string`

Publisher or author identifier.

### `license`

**Type:** `string`

SPDX license identifier.

### `repository`

**Type:** `string` (URL)

Source repository URL.

### `homepage`

**Type:** `string` (URL)

Extension homepage URL.

### `icon`

**Type:** `string`

Path to icon file (PNG, 128x128 or 256x256).

### `permissions`

**Type:** `array<string>`

List of required permissions. See [permissions.md](permissions.md) for valid values.

```json
{
  "permissions": [
    "workspace:read",
    "ui:notifications",
    "network:fetch:*.example.com"
  ]
}
```

### `activationEvents`

**Type:** `array<string>`

Events that trigger extension activation.

| Event | Description | Example |
|-------|-------------|---------|
| `onStartup` | Activate on IDE startup | `"onStartup"` |
| `onLanguage:<id>` | Activate for language | `"onLanguage:rust"` |
| `onCommand:<id>` | Activate on command | `"onCommand:myExt.run"` |
| `workspaceContains:<glob>` | Activate if workspace matches | `"workspaceContains:Cargo.toml"` |
| `onFileOpen:<glob>` | Activate on file open | `"onFileOpen:**/*.rs"` |

```json
{
  "activationEvents": [
    "onLanguage:rust",
    "workspaceContains:Cargo.toml"
  ]
}
```

### `contributes`

**Type:** `object`

Static contributions to the IDE.

#### `contributes.commands`

```json
{
  "contributes": {
    "commands": [
      {
        "id": "myExtension.sayHello",
        "title": "Say Hello",
        "category": "My Extension"
      }
    ]
  }
}
```

#### `contributes.menus`

```json
{
  "contributes": {
    "menus": {
      "editor/context": [
        {
          "command": "myExtension.sayHello",
          "when": "editorTextFocus"
        }
      ]
    }
  }
}
```

#### `contributes.keybindings`

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "myExtension.sayHello",
        "key": "ctrl+shift+h",
        "mac": "cmd+shift+h"
      }
    ]
  }
}
```

#### `contributes.languages`

```json
{
  "contributes": {
    "languages": [
      {
        "id": "mylang",
        "aliases": ["My Language"],
        "extensions": [".ml"],
        "configuration": "./language-configuration.json"
      }
    ]
  }
}
```

### `engines`

**Type:** `object`

Compatibility requirements.

```json
{
  "engines": {
    "ide-extension-standard": ">=0.1.0"
  }
}
```

### `conformanceLevel`

**Type:** `integer` (0-5)

Minimum conformance level required from the host IDE. If the IDE's conformance level is lower, it should warn the user or refuse installation. See [conformance.md](conformance.md) for level definitions.

```json
{
  "conformanceLevel": 3
}
```

| Level | Name | When to Use |
|-------|------|-------------|
| 0 | Minimal | Extension only uses lifecycle/logging |
| 1 | Basic | Extension uses commands, notifications |
| 2 | Editor | Extension manipulates document text |
| 3 | Workspace | Extension accesses file system |
| 4 | Language | Extension provides language features |
| 5 | Full | Extension requires network or webviews |

### `categories`

**Type:** `array<string>`

Extension categories for discovery.

Valid values:
- `Programming Languages`
- `Snippets`
- `Linters`
- `Themes`
- `Debuggers`
- `Formatters`
- `Keymaps`
- `SCM Providers`
- `Other`

## Complete Example

```json
{
  "name": "rust-analyzer-wasm",
  "displayName": "Rust Analyzer (WASM)",
  "description": "Rust language support via WebAssembly",
  "version": "1.0.0",
  "publisher": "rust-lang",
  "license": "MIT",
  "repository": "https://github.com/example/rust-analyzer-wasm",
  "icon": "icon.png",
  "runtime": "wasm32-wasi",
  "main": "rust_analyzer.wasm",
  "standardVersion": "0.1.0",
  "engines": {
    "ide-extension-standard": ">=0.1.0"
  },
  "categories": [
    "Programming Languages",
    "Linters"
  ],
  "activationEvents": [
    "onLanguage:rust",
    "workspaceContains:Cargo.toml"
  ],
  "permissions": [
    "workspace:read",
    "language:completion",
    "language:diagnostics",
    "language:hover",
    "language:definition"
  ],
  "contributes": {
    "commands": [
      {
        "id": "rust-analyzer.reload",
        "title": "Reload Workspace",
        "category": "Rust Analyzer"
      }
    ],
    "languages": [
      {
        "id": "rust",
        "extensions": [".rs"]
      }
    ]
  }
}
```
