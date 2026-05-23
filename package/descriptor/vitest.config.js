import { defineConfig, mergeConfig } from "vitest/config";

import baseConfig from "../../config/vitest.config.base.js";

export default mergeConfig(baseConfig, defineConfig({}));
