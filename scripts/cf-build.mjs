import path from "node:path";
import { loadAndParseConfig } from "@cloudflare/config";
import {
  cleanBuildOutputDir,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from "@cloudflare/build-output-utils";

const root = process.cwd();
const ctx = { isPreview: process.env.CLOUDFLARE_PREVIEW_BUILD === "true" };
const { result } = await loadAndParseConfig(
  path.join(root, "cloudflare.config.ts"),
  ctx
);

if (!result.success) {
  console.error("Invalid cloudflare.config.ts:", result.error.issues);
  process.exit(1);
}

const { worker, accountId, complianceRegion } = result.data;
if (!worker) {
  console.error("cloudflare.config.ts must define a worker.");
  process.exit(1);
}

await cleanBuildOutputDir(root);
await writeAssets({ root, sourceDirectory: path.join(root, "out") });
await writeWorkerConfig({ root, config: worker });
await writeRootConfig(root, { accountId, complianceRegion }, ctx);

console.log(
  `Prepared Cloudflare Build Output for worker "${worker.name}" from ./out`
);
