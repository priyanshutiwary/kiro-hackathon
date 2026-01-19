import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Pass environment variables to the worker
  // This ensures .dev.vars are available in preview mode
});