import * as builder from "electron-builder";

// do package.json import
import * as fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const Platform = builder.Platform;

(async () => {
  // remove dist directory if it exists
  fs.rmSync(join(__dirname, "../dist"), { recursive: true, force: true });

  const targets = [
    "win",
    // "mac",
    // "linux"
  ];

  const name = packageJson.name;
  const version = packageJson.version;

  const builder_configs: builder.Configuration = {
    appId: "com.brofty.core",
    mac: { category: "public.app-category.developer-tools" },
  };

  // loop through targets and build for each
  for (const target of targets) {
    const platform =
      target === "win"
        ? Platform.WINDOWS
        : target === "mac"
        ? Platform.MAC
        : Platform.LINUX;
    builder.build({
      targets: platform.createTarget(),
      config: builder_configs,
    });
  }
})();
1;
