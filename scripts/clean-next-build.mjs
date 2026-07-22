import { rm } from "node:fs/promises";

const managedBuild = Boolean(
  process.env.CI ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_ENVIRONMENT_ID ||
    process.env.VERCEL,
);

if (managedBuild) {
  console.log("Skipping .next cleanup in managed build environment.");
} else {
  await rm(new URL("../.next", import.meta.url), {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 200,
  });
}
