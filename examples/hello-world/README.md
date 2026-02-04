# Hello World Extension

A minimal example extension demonstrating the IDE Extension Standard.

## Overview

This extension registers a single command that displays a greeting notification.

## Features

- Registers the `helloWorld.sayHello` command
- Shows an info notification when the command is executed
- Keyboard shortcut: `Ctrl+Shift+H` (or `Cmd+Shift+H` on macOS)

## Building

```bash
# Install the WASM target
rustup target add wasm32-wasip2

# Build the extension
cargo build --release --target wasm32-wasip2

# The output will be at target/wasm32-wasip2/release/hello_world.wasm
```

## Project Structure

```
hello-world/
├── extension.json     # Extension manifest
├── Cargo.toml         # Rust project configuration
├── src/
│   └── lib.rs         # Extension implementation
└── README.md          # This file
```

## Manifest Breakdown

```json
{
  "name": "hello-world",
  "permissions": [
    "ui:notifications",  // Required to show notifications
    "ui:commands"        // Required to register commands
  ],
  "activationEvents": [
    "onCommand:helloWorld.sayHello"  // Activate when command is invoked
  ]
}
```

## Code Walkthrough

### Activation

```rust
fn activate(event: ActivationEvent) -> Result<(), String> {
    // Register the command
    commands::register_command(CommandDefinition {
        id: "helloWorld.sayHello".to_string(),
        // ...
    })?;
    Ok(())
}
```

### Command Handling

```rust
fn handle_command(command_id: &str, _args: Vec<CommandArg>) -> Result<Option<CommandArg>, String> {
    match command_id {
        "helloWorld.sayHello" => {
            notifications::show_info("Hello from WebAssembly!")?;
            Ok(None)
        }
        _ => Err(format!("Unknown command: {}", command_id)),
    }
}
```

## License

MIT
