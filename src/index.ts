#!/usr/bin/env bun

import { parseArgs } from "util";
import { colors } from "./utils/logger.js";
import { initCommand } from "./commands/init.js";
import { secretsCommand } from "./commands/secrets.js";

async function main() {
  const args = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      init: { type: "boolean", short: "i" },
      portfolio: { type: "string", short: "p" },
      secrets: { type: "boolean", short: "s" },
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
  -p, --portfolio <url>   Portfolio API URL
  -h, --help              Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  bunx da-proj --init
  bunx da-proj --secrets
  bunx da-proj --init --portfolio https://myportfolio.com
    `);
    process.exit(0);
  }

  // Si se usa --secrets, configurar secrets y salir
  if (args.values.secrets) {
    await secretsCommand();
    process.exit(0);
  }

  // Por defecto o con --init, ejecutar comando init
  await initCommand();
}

main().catch(console.error);
