#!/usr/bin/env bun

import { parseArgs } from "util";
import { initCommand } from "./commands/init.js";
import { pullCommand } from "./commands/pull.js";
import { pushCommand } from "./commands/push.js";
import { secretsCommand } from "./commands/secrets.js";
import { setupGitHubSyncCommand } from "./commands/setup-github-sync.js";
import { syncStatusCommand } from "./commands/sync-status.js";
import { syncCommand } from "./commands/sync.js";
import { colors } from "./utils/logger.js";

async function main() {
  const args = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      init: { type: "boolean", short: "i" },
      portfolio: { type: "string", short: "p" },
      secrets: { type: "boolean", short: "s" },
      sync: { type: "boolean" },
      "setup-github-sync": { type: "boolean" },
      push: { type: "boolean" },
      pull: { type: "boolean" },
      "sync-status": { type: "boolean" },
    },
    allowPositionals: true,
  });

  if (args.values.help) {
    console.log(`
${colors.bright}da-proj${colors.reset} - CLI tool to setup portfolio project metadata

${colors.bright}USAGE:${colors.reset}
  bunx da-proj [options]

${colors.bright}OPTIONS:${colors.reset}
  -i, --init              Initialize project metadata
  -s, --secrets           Configure GitHub secrets (requires GitHub CLI)
  --sync                  Sync configuration across computers
  -p, --portfolio <url>   Portfolio API URL
  -h, --help              Show this help message

${colors.bright}GITHUB SYNC:${colors.reset}
  --setup-github-sync     Setup GitHub repository for config sync
  --push                  Upload local configuration to GitHub
  --pull                  Download configuration from GitHub
  --sync-status           Check synchronization status

${colors.bright}EXAMPLES:${colors.reset}
  bunx da-proj --init
  bunx da-proj --secrets
  bunx da-proj --setup-github-sync
  bunx da-proj --push
  bunx da-proj --pull
  bunx da-proj --sync-status
    `);
    process.exit(0);
  }

  // GitHub sync commands
  if (args.values["setup-github-sync"]) {
    await setupGitHubSyncCommand();
    process.exit(0);
  }

  if (args.values.push) {
    await pushCommand();
    process.exit(0);
  }

  if (args.values.pull) {
    await pullCommand();
    process.exit(0);
  }

  if (args.values["sync-status"]) {
    await syncStatusCommand();
    process.exit(0);
  }

  // Si se usa --secrets, configurar secrets y salir
  if (args.values.secrets) {
    await secretsCommand();
    process.exit(0);
  }

  // Si se usa --sync, sincronizar configuración
  if (args.values.sync) {
    await syncCommand();
    process.exit(0);
  }

  // Por defecto o con --init, ejecutar comando init
  await initCommand();
}

main().catch(console.error);
