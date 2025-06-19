# Brofty Core

brofty-core is the core engine for Brofty AI, an extensible, local-first AI assistant platform. It provides a modular backend for running, managing, and extending AI-powered workflows, with support for LLMs, memory, tools, and more. This project is designed for privacy, hackability, and easy integration with custom tools and models.

## Prerequisites

- **Docker**: You need Docker installed and running before running `yarn start`.

## Features

- Modular architecture for easy extension
- Local-first: runs on your machine, keeps your data private
- Built-in support for LLMs (OpenAI, local models, etc.)
- Memory and context management
- Tooling system for custom functions (calculators, HTTP clients, etc.)
- Electron-based server for desktop integration
- SQLite database for persistent storage

## Getting Started

To run brofty-core locally:

1. **Clone the repository:**
   ```sh
   git clone https://github.com/BroftyHQ/brofty-core.git
   
   cd brofty-core
   ```
2. **Install dependencies:**
   ```sh
   yarn install
   ```
3. **Compile the TypeScript code:**
   ```sh
   yarn compile
   ```
4. **Start the server:**
   ```sh
   yarn start
   ```

Once the server is running, visit [brofty.com](https://www.brofty.com) to use your local brofty core server.
