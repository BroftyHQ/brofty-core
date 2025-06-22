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

## Server Management

Brofty Core uses PM2 (Process Manager 2) for process management, providing robust server control and monitoring capabilities.

### Starting the Server

```sh
yarn start
```

This command will:
- Check if Docker is running
- Compile TypeScript code to JavaScript
- Start the server using PM2 in production mode

### Stopping the Server

To stop the brofty-core server:

```sh
yarn pm2:stop
```

Or using PM2 directly:
```sh
pm2 stop brofty-core
```

### Restarting the Server

To restart the server (useful after code changes):

```sh
yarn pm2:restart
```

Or using PM2 directly:
```sh
pm2 restart brofty-core
```

### Monitoring the Server

#### Check Server Status
To see if the server is running and view basic information:

```sh
yarn pm2:status
```

#### View Real-time Logs
To monitor server logs in real-time:

```sh
yarn pm2:logs
```

#### Advanced Monitoring
For a comprehensive monitoring dashboard with CPU, memory usage, and more:

```sh
yarn pm2:monit
```

This opens an interactive terminal-based monitoring interface.

### Completely Removing the Process

To completely remove the brofty-core process from PM2:

```sh
yarn pm2:delete
```


### Troubleshooting

- **Server won't start**: Ensure Docker is running (`docker -v` should work)
- **Port conflicts**: The default server runs on the port 4000 make sure it is accessible
- **Permission issues**: Make sure you have necessary permissions to run Docker and PM2
- **Process already running**: Use `yarn pm2:delete` to remove existing processes before starting
