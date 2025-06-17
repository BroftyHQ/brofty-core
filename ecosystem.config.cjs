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
      }
    }
  ]
}