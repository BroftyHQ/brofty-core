// PM2 Graceful Shutdown Hook
// Send shutdown message via PM2 IPC
if (process.send) {
  process.send('shutdown');
}
