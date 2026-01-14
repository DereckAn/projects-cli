import { existsSync } from "fs";
import { readFile } from "fs/promises";
import type { Config } from "../types/index.js";
import { getConfigPath } from "../utils/config.js";
import {
  isGitHubSyncConfigured,
  readGitHubSyncConfig,
} from "../utils/github-config.js";
import { downloadFile } from "../utils/github.js";
import { colors, log } from "../utils/logger.js";

export async function syncStatusCommand() {
  log.title("📊 Sync Status");

  // 1. Verificar configuración
  if (!isGitHubSyncConfigured()) {
    log.warn("GitHub sync not configured.");
    console.log(
      `\nRun: ${colors.cyan}da-proj --setup-github-sync${colors.reset} to enable GitHub sync\n`
    );
    return;
  }

  const syncConfig = await readGitHubSyncConfig();
  if (!syncConfig) {
    log.warn("GitHub sync configuration is invalid.");
    console.log(
      `\nRun: ${colors.cyan}da-proj --setup-github-sync${colors.reset} to reconfigure\n`
    );
    return;
  }

  console.log(
    `${colors.bright}Repository:${colors.reset} ${syncConfig.repoUrl}\n`
  );

  // 2. Leer local
  const localConfigPath = getConfigPath();
  if (!existsSync(localConfigPath)) {
    log.warn("No local configuration found.");
    console.log(`\n${colors.yellow}Suggestions:${colors.reset}`);
    console.log(
      `  • ${colors.cyan}da-proj --pull${colors.reset}  - Download configuration from GitHub`
    );
    console.log(
      `  • ${colors.cyan}da-proj --secrets${colors.reset} - Create a new profile\n`
    );
    return;
  }

  const localConfig = await readFile(localConfigPath, "utf-8");
  let localParsed: Config;

  try {
    localParsed = JSON.parse(localConfig);
  } catch (error) {
    log.error("Local configuration is not valid JSON.");
    return;
  }

  // 3. Descargar remoto
  let remoteConfig: string;
  try {
    remoteConfig = await downloadFile(
      syncConfig.repoUrl,
      "da-proj-config.json"
    );
  } catch (error: any) {
    if (error.message.includes("not found")) {
      log.warn("No configuration found in GitHub.");
      console.log(`\n${colors.yellow}Suggestion:${colors.reset}`);
      console.log(
        `  • ${colors.cyan}da-proj --push${colors.reset} - Upload your local configuration to GitHub\n`
      );
    } else {
      log.error(`Failed to check GitHub: ${error.message}`);
    }
    return;
  }

  let remoteParsed: Config;
  try {
    remoteParsed = JSON.parse(remoteConfig);
  } catch (error) {
    log.warn("GitHub configuration is not valid JSON.");
    return;
  }

  // 4. Comparar
  if (localConfig.trim() === remoteConfig.trim()) {
    log.success("✓ Synchronized");
    console.log("\nLocal and GitHub configurations are identical.\n");

    // Mostrar resumen
    const profileCount = localParsed.profiles?.length || 0;
    if (profileCount > 0) {
      console.log(`${colors.bright}Profiles (${profileCount}):${colors.reset}`);
      localParsed.profiles?.forEach((p) => {
        console.log(`  • ${p.name}`);
      });
      console.log("");
    }
  } else {
    log.warn("⚠️  Out of sync");

    const localProfiles = localParsed.profiles || [];
    const remoteProfiles = remoteParsed.profiles || [];

    console.log(
      `\n${colors.bright}Local:${colors.reset}  ${localProfiles.length} profile(s)`
    );
    if (localProfiles.length > 0) {
      localProfiles.forEach((p) => console.log(`  • ${p.name}`));
    }

    console.log(
      `\n${colors.bright}GitHub:${colors.reset} ${remoteProfiles.length} profile(s)`
    );
    if (remoteProfiles.length > 0) {
      remoteProfiles.forEach((p) => console.log(`  • ${p.name}`));
    }

    console.log(`\n${colors.yellow}Suggestions:${colors.reset}`);
    console.log(
      `  • ${colors.cyan}da-proj --push${colors.reset}  - Upload local to GitHub`
    );
    console.log(
      `  • ${colors.cyan}da-proj --pull${colors.reset}  - Download from GitHub (with merge option)\n`
    );
  }
}
