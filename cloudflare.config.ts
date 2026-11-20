import { defineConfig } from "cf/config";

export default defineConfig({
  accountId: "a8f8d6edb9141e38f4a7c37304ba846b",
  worker: {
    name: "exammom",
    compatibilityDate: "2026-11-20",
    workersDev: true,
    assets: {
      htmlHandling: "auto-trailing-slash",
      notFoundHandling: "404-page",
    },
    observability: {
      enabled: true,
    },
  },
});
