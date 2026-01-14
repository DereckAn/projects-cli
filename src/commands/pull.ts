import { select } from "@inquirer/prompts";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import type { Config } from "../types/index.js";
import { getConfigPath } from "../utils/config.js";
import { readGitHubSyncConfig } from "../utils/github-config.js";
import { downloadFile } from "../utils/github.js";
import { colors, log } from "../utils/logger.js";

export async function pullCommand() {
  log.title("📥 Pull from GitHub");

  // 1. Verificar que GitHub sync esté configurado
  const syncConfig = await readGitHubSyncConfig();
  if (!syncConfig) {
    log.error("GitHub sync not configured.");
    console.log(
      `\nRun: ${colors.cyan}da-proj --setup-github-sync${colors.reset}\n`
    );
    process.exit(1);
  }

  // 2. Descargar desde GitHub
  log.info("Downloading configuration from GitHub...");

  let remoteConfig: string;
  try {
    remoteConfig = await downloadFile(
      syncConfig.repoUrl,
      "da-proj-config.json"
    );
  } catch (error: any) {
    if (error.message.includes("not found")) {
      log.error("No configuration found in GitHub.");
      console.log(
        `\nUpload your configuration first with: ${colors.cyan}da-proj --push${colors.reset}\n`
      );
    } else {
      log.error(`Failed to download: ${error.message}`);
    }
    process.exit(1);
  }

  // Validar que sea JSON válido
  let remoteParsed: Config;
  try {
    remoteParsed = JSON.parse(remoteConfig);
  } catch (error) {
    log.error("Downloaded configuration is not valid JSON.");
    process.exit(1);
  }

  // 3. Verificar si existe config local
  const localConfigPath = getConfigPath();

  if (existsSync(localConfigPath)) {
    const localConfig = await readFile(localConfigPath, "utf-8");

    // Comparar
    if (localConfig === remoteConfig) {
      log.success("Already up to date!");
      console.log("\nLocal and GitHub configurations are identical.\n");
      return;
    }

    // Preguntar qué hacer
    const action = await select({
      message: "Local configuration exists. What do you want to do?",
      choices: [
        { value: "replace", name: "Replace local with GitHub version" },
        { value: "merge", name: "Merge (combine profiles from both)" },
        { value: "cancel", name: "Cancel" },
      ],
    });

    if (action === "cancel") {
      log.info("Pull cancelled.");
      return;
    }

    if (action === "merge") {
      // Merge profiles
      const local: Config = JSON.parse(localConfig);
      const remote: Config = remoteParsed;

      const localProfiles = local.profiles || [];
      const remoteProfiles = remote.profiles || [];

      // Combinar: primero los de GitHub, luego los locales que no existan en GitHub
      const merged: Config = {
        profiles: [
          ...remoteProfiles,
          ...localProfiles.filter(
            (lp) => !remoteProfiles.some((rp) => rp.name === lp.name)
          ),
        ],
      };

      remoteConfig = JSON.stringify(merged, null, 2);
      log.info(`Merged: ${merged.profiles?.length || 0} total profiles`);
    }
  }

  // 4. Guardar localmente
  await writeFile(localConfigPath, remoteConfig);
  log.success("Configuration pulled from GitHub!");

  // Mostrar perfiles
  const config: Config = JSON.parse(remoteConfig);
  if (config.profiles && config.profiles.length > 0) {
    console.log(
      `\n${colors.bright}Profiles (${config.profiles.length}):${colors.reset}`
    );
    config.profiles.forEach((p) => {
      console.log(`  • ${p.name} (${p.portfolioUrl})`);
    });
    console.log("");
  }
}
