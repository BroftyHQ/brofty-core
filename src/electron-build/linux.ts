import * as builder from "electron-builder";
import builder_configs from "./core.js";

builder.build({
  targets: builder.Platform.LINUX.createTarget(),
  config: {
    ...builder_configs,
    directories: {
      output: "dist/linux",
    },
  },
});
