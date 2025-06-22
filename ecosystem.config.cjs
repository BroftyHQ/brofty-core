module.exports = {
  apps: [
    {
      name: "brofty-core",
      script: "electron/server/index.js",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      },
      
      // PM2 graceful shutdown hooks
      pre_stop: "node pm2-graceful-stop.js",
      shutdown_with_message: true,
      
      // Graceful shutdown configuration
      kill_timeout: 180000, // 3 minutes
      kill_retry_time: 2000, // 2 seconds
      restart_delay: 5000, // 5 seconds
      
      // Process management
      autorestart: true,
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G"
    }
  ]
}