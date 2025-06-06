import * as builder from "electron-builder";

// do package.json import
import * as fs from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(__dirname, "../../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));


// remove dist directory if it exists
// fs.rmSync(join(__dirname, "../dist"), { recursive: true, force: true });

const name = packageJson.name;
const version = packageJson.version;

const builder_configs: builder.Configuration = {
  appId: "com.brofty.core",
  productName: "brofty-core",
  mac: {
    category: "public.app-category.developer-tools",
    artifactName: "${productName}.${ext}",
    target: [
      {
        target: "dir",
        arch: ["x64", "arm64"] // Intel (x64) and Apple Silicon (arm64)
      },
      {
        target: "zip",
        arch: ["x64", "arm64"]
      }
    ],
    asar: true,
    extraFiles: [],
    extraResources: [],
    files: [
      "**/*"
    ]
  },
  buildVersion: version,
  win: {
    artifactName: "${productName}.${ext}",
    asar: true,
    target: [
      {
        target: "dir",
        arch: ["x64"]
      },
      {
        target: "zip",
        arch: ["x64"]
      }
    ],
    extraFiles: [],
    extraResources: [],
    files: [
      "**/*"
    ]
  },
  linux: {
    artifactName: "${productName}.${ext}",
    asar: true,
    target: [
      {
        target: "dir",
        arch: ["x64"]
      },
      {
        target: "zip",
        arch: ["x64"]
      }
    ],
    extraFiles: [],
    extraResources: [],
    files: [
      "**/*"
    ]
  },
};

export default builder_configs;
