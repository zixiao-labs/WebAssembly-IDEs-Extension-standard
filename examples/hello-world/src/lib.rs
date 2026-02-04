//! Hello World Extension
//!
//! A minimal example demonstrating the IDE Extension Standard.
//!
//! This extension registers a command that shows a greeting notification.

// Import the IDE extension bindings (generated from WIT)
use ide_extension::prelude::*;

// Export the required extension interface
#[export]
impl Extension for HelloWorld {
    /// Called when the extension is activated.
    fn activate(event: ActivationEvent) -> Result<(), String> {
        // Log activation
        logging::info("Hello World extension activated!");

        // Register our command handler
        commands::register_command(CommandDefinition {
            id: "helloWorld.sayHello".to_string(),
            title: "Say Hello".to_string(),
            category: Some("Hello World".to_string()),
            icon: None,
        })?;

        Ok(())
    }

    /// Called when the extension is deactivated.
    fn deactivate() {
        logging::info("Hello World extension deactivated.");
    }
}

// Export the command handler interface
#[export]
impl CommandHandler for HelloWorld {
    /// Handle command execution.
    fn handle_command(
        command_id: &str,
        _args: Vec<CommandArg>,
    ) -> Result<Option<CommandArg>, String> {
        match command_id {
            "helloWorld.sayHello" => {
                // Show a notification
                notifications::show_info("Hello from WebAssembly!")?;
                Ok(None)
            }
            _ => Err(format!("Unknown command: {}", command_id)),
        }
    }
}

/// The extension struct (can hold state if needed)
struct HelloWorld;
