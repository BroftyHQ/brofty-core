import pm2 from "pm2";

export default async function start_pm2_manager() {
    
  pm2.connect((err) => {
    if (err) {
      console.error("PM2 connect error:", err);
      process.exit(1);
    }
  });

  pm2.launchBus((err, bus) => {
    if (err) {
      console.error("PM2 bus error:", err);
      return;
    }

    console.log("PM2 log stream started");

    bus.on("log:out", (packet) => {
      const msg = `[OUT] ${packet.process.name}: ${packet.data}`;
      console.log(msg);
      
    });

    bus.on("log:err", (packet) => {
      const msg = `[ERR] ${packet.process.name}: ${packet.data}`;
        console.error(msg);
    });
  });
}
