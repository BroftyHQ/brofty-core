import pubsub from "../../pubsub/index.js";

import si from "systeminformation";

export default async function start_streaming_system_status({
  user_token,
}: {
  user_token: string;
}) {
  // push system status to the pubsub every 5 seconds
  setInterval(async () => {
    try {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      const disk = await si.fsSize();

      const systemStatus = {
        cpu_usage: cpu.currentLoad,
        memory_usage: (mem.used / mem.total) * 100,
        disk_usage: disk[0].use,
      };

      // Assuming pubsub is defined and has a method to publish messages
      pubsub.publish(`SYSTEM_STATUS:${user_token}`, {systemStatus:systemStatus});
      
    } catch (error) {
      console.error("Error fetching system status:", error);
    }
  }, 5000);
}
