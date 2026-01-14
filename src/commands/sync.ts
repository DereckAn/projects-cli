import { input, select } from "@inquirer/prompts";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { getConfigPath, readGlobalConfig } from "../utils/config.js";
import { colors, log } from "../utils/logger.js";

export async function syncCommand() {
  log.title("🔄 Sync Configuration");

  const action = await select({
    message: "What do you want to do?",
    choices: [
      { value: "export", name: "📤 Export configuration to file" },
      { value: "import", name: "📥 Import configuration from file" },
      { value: "show", name: "👁️  Show current configuration" },
    ],
  });

  switch (action) {
    case "export":
      await exportConfig();
      break;
    case "import":
      await importConfig();
      break;
    case "show":
      await showConfig();
      break;
  }
}

async function exportConfig() {
  const config = await readGlobalConfig();

  if (!config.profiles || config.profiles.length === 0) {
    log.warn("No profiles found to export.");
    return;
  }

  const exportPath = await input({
    message: "Export to file path",
    default: "./da-proj-config-backup.json",
  });

  try {
    await writeFile(exportPath, JSON.stringify(config, null, 2));
    log.success(`Configuration exported to: ${exportPath}`);
    console.log(
      `\n${colors.bright}You can now copy this file to another computer!${colors.reset}\n`
    );
  } catch (error: any) {
    log.error(`Failed to export: ${error.message}`);
  }
}

async function importConfig() {
  const importPath = await input({
    message: "Import from file path",
    default: "./da-proj-config-backup.json",
  });

  if (!existsSync(importPath)) {
    log.error(`File not found: ${importPath}`);
    return;
  }

  try {
    const content = await readFile(importPath, "utf-8");
    const importedConfig = JSON.parse(content);

    if (!importedConfig.profiles || !Array.isArray(importedConfig.profiles)) {
      log.error("Invalid configuration file format.");
      return;
    }

    // Leer config actual
    const currentConfig = await readGlobalConfig();

    const mergeStrategy = await select({
      message: "How to merge configurations?",
      choices: [
        { value: "replace", name: "Replace all (overwrite current)" },
        { value: "merge", name: "Merge (keep both, imported takes priority)" },
        { value: "keep", name: "Keep current (only add new profiles)" },
      ],
    });

    let finalConfig = { profiles: [] as any[] };

    switch (mergeStrategy) {
      case "replace":
        finalConfig = importedConfig;
        break;
      case "merge":
        const merged = [...(currentConfig.profiles || [])];
        for (const profile of importedConfig.profiles) {
          const idx = merged.findIndex((p) => p.name === profile.name);
          if (idx >= 0) {
            merged[idx] = profile; // Reemplazar
          } else {
            merged.push(profile); // Agregar
          }
        }
        finalConfig.profiles = merged;
        break;
      case "keep":
        const kept = [...(currentConfig.profiles || [])];
        for (const profile of importedConfig.profiles) {
          const exists = kept.some((p) => p.name === profile.name);
          if (!exists) {
            kept.push(profile);
          }
        }
        finalConfig.profiles = kept;
        break;
    }

    const configPath = getConfigPath();
    await writeFile(configPath, JSON.stringify(finalConfig, null, 2));

    log.success(`Configuration imported successfully!`);
    console.log(
      `\n${colors.bright}Imported ${importedConfig.profiles.length} profile(s)${colors.reset}`
    );
    console.log(
      `${colors.bright}Total profiles: ${finalConfig.profiles.length}${colors.reset}\n`
    );
  } catch (error: any) {
    log.error(`Failed to import: ${error.message}`);
  }
}

async function showConfig() {
  const config = await readGlobalConfig();
  const configPath = getConfigPath();

  console.log(`\n${colors.bright}Configuration Location:${colors.reset}`);
  console.log(`  ${configPath}\n`);

  if (!config.profiles || config.profiles.length === 0) {
    log.warn("No profiles configured.");
    return;
  }

  console.log(
    `${colors.bright}Profiles (${config.profiles.length}):${colors.reset}\n`
  );

  config.profiles.forEach((profile, i) => {
    console.log(`${colors.bright}${i + 1}. ${profile.name}${colors.reset}`);
    console.log(`   URL: ${profile.portfolioUrl}`);
    console.log(
      `   Key: ${profile.apiKey.substring(0, 16)}...${profile.apiKey.substring(
        profile.apiKey.length - 4
      )}`
    );
    console.log("");
  });
}
