import pubsub from "../../pubsub/index.js";
import si from "systeminformation";

// Store active intervals to prevent duplicates
const activeIntervals = new Map<string, NodeJS.Timeout>();

// Store cleanup functions for WebSocket connections
const connectionCleanups = new Map<string, () => void>();

export default async function start_streaming_system_status({
  user_token,
  intervalMs = 5000,
}: {
  user_token: string;
  intervalMs?: number;
}) {
  // Clear existing interval for this user if it exists
  if (activeIntervals.has(user_token)) {
    clearInterval(activeIntervals.get(user_token)!);
  }

  const intervalId = setInterval(async () => {
    try {
      const [cpu, mem, disk] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize()
      ]);

      const systemStatus = {
        cpu_usage: cpu.currentLoad,
        memory_usage: (mem.used / mem.total) * 100,
        disk_usage: disk.length > 0 ? disk[0].use : 0,
        timestamp: new Date().toISOString(),
      };

      await pubsub.publish(`SYSTEM_STATUS`, { systemStatus });
      
    } catch (error) {
      console.error("Error fetching or publishing system status:", error);
      // Optionally, you could stop the interval on persistent errors
    }
  }, intervalMs);

  // Store the interval ID for cleanup
  activeIntervals.set(user_token, intervalId);

  // Create cleanup function
  const cleanup = () => {
    if (activeIntervals.has(user_token)) {
      clearInterval(activeIntervals.get(user_token)!);
      activeIntervals.delete(user_token);
    }
  };

  // Store cleanup function for WebSocket connections
  connectionCleanups.set(user_token, cleanup);

  // Return a cleanup function
  return cleanup;
}

// Optional: Export a function to stop monitoring for a specific user
export function stop_streaming_system_status(user_token: string) {
  if (activeIntervals.has(user_token)) {
    clearInterval(activeIntervals.get(user_token)!);
    activeIntervals.delete(user_token);
  }
  // Also remove from connection cleanups
  connectionCleanups.delete(user_token);
}

// Function to cleanup system status streaming for WebSocket disconnections
export function cleanup_system_status_on_disconnect(user_token: string) {
  const cleanup = connectionCleanups.get(user_token);
  if (cleanup) {
    cleanup();
    connectionCleanups.delete(user_token);
  }
}

// Function to cleanup all active intervals (for server shutdown)
export function cleanup_all_system_status_streams() {
  for (const [user_token, intervalId] of activeIntervals) {
    clearInterval(intervalId);
  }
  activeIntervals.clear();
  connectionCleanups.clear();
}
