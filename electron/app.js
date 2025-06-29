// const { app, BrowserWindow } = require('electron/main')
// const path = require('node:path')
import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: true, // allow resizing
  });

  // Once the content is loaded, resize to fit the content
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(`
      const { width, height } = document.documentElement.getBoundingClientRect();
      ({ width: Math.ceil(width), height: Math.ceil(height) });
    `).then(({ width, height }) => {
      // Add some padding if needed
      win.setContentSize(width, height);
    });
  });
  win.setMenu(null);

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  import("./server/core_server.js").then(async (func) => {
    await func.default();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
