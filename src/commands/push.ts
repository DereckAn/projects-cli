import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { getConfigPath } from "../utils/config.js";
import { readGitHubSyncConfig } from "../utils/github-config.js";
import { uploadFile } from "../utils/github.js";
import { colors, log } from "../utils/logger.js";

export async function pushCommand() {
  log.title("📤 Push to GitHub");

  // 1. Verificar que GitHub sync esté configurado
  const syncConfig = await readGitHubSyncConfig();
  if (!syncConfig) {
    log.error("GitHub sync not configured.");
    console.log(
      `\nRun: ${colors.cyan}da-proj --setup-github-sync${colors.reset}\n`
    );
    process.exit(1);
  }

  // 2. Leer configuración local
  const localConfigPath = getConfigPath();
  if (!existsSync(localConfigPath)) {
    log.error("No local configuration found.");
    console.log(
      `\nCreate profiles first with: ${colors.cyan}da-proj --secrets${colors.reset}\n`
    );
    process.exit(1);
  }

  const localConfig = await readFile(localConfigPath, "utf-8");

  // Validar que sea JSON válido
  try {
    JSON.parse(localConfig);
  } catch (error) {
    log.error("Local configuration is not valid JSON.");
    process.exit(1);
  }

  // 3. Subir a GitHub
  log.info("Uploading configuration to GitHub...");

  try {
    await uploadFile(syncConfig.repoUrl, "da-proj-config.json", localConfig);

    log.success("Configuration pushed to GitHub!");
    console.log(
      `\n${colors.bright}Repository:${colors.reset} ${syncConfig.repoUrl}`
    );
    console.log(`${colors.bright}File:${colors.reset} da-proj-config.json\n`);

    // Mostrar resumen
    const config = JSON.parse(localConfig);
    if (config.profiles && config.profiles.length > 0) {
      console.log(
        `${colors.bright}Uploaded ${config.profiles.length} profile(s):${colors.reset}`
      );
      config.profiles.forEach((p: any) => {
        console.log(`  • ${p.name} (${p.portfolioUrl})`);
      });
      console.log("");
    }
  } catch (error: any) {
    log.error(`Failed to push: ${error.message}`);
    process.exit(1);
  }
}
