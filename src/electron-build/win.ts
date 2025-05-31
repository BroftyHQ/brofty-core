import * as builder from "electron-builder";
import builder_configs from "./core.js";

builder.build({
  targets: builder.Platform.WINDOWS.createTarget(),
  config: builder_configs,
});
