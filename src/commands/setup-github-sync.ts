import { input, select } from "@inquirer/prompts";
import { exec } from "child_process";
import { existsSync } from "fs";
import { promisify } from "util";
import { getConfigPath } from "../utils/config.js";
import {
  isGitHubSyncConfigured,
  readGitHubSyncConfig,
  saveGitHubSyncConfig,
} from "../utils/github-config.js";
import {
  checkGitHubCLI,
  createPrivateRepo,
  generateSecretsRepoReadme,
  getGitHubUsername,
  listPrivateRepos,
  uploadFile,
} from "../utils/github.js";
import { colors, log } from "../utils/logger.js";

const execAsync = promisify(exec);

export async function setupGitHubSyncCommand() {
  log.title("🔐 Setup GitHub Sync");

  // 1. Verificar GitHub CLI
  const hasGH = await checkGitHubCLI();
  if (!hasGH) {
    log.error("GitHub CLI (gh) is not installed.");
    console.log(`
${colors.yellow}To install GitHub CLI:${colors.reset}

${colors.bright}Windows:${colors.reset}
  winget install --id GitHub.cli

${colors.bright}Or download from:${colors.reset}
  https://cli.github.com/

${colors.bright}After installing, authenticate:${colors.reset}
  gh auth login
    `);
    process.exit(1);
  }

  // 2. Verificar autenticación
  try {
    await execAsync("gh auth status");
  } catch {
    log.error("Not authenticated with GitHub CLI.");
    console.log(`
${colors.yellow}Please authenticate first:${colors.reset}
  gh auth login
    `);
    process.exit(1);
  }

  log.info("GitHub CLI is ready!\n");

  // 3. Verificar si ya está configurado
  if (isGitHubSyncConfigured()) {
    const existingConfig = await readGitHubSyncConfig();

    log.warn("GitHub sync is already configured:");
    console.log(`  Repository: ${existingConfig?.repoUrl}\n`);

    const reconfigure = await select({
      message: "Do you want to reconfigure?",
      choices: [
        { value: "no", name: "No, keep current configuration" },
        { value: "yes", name: "Yes, setup a different repository" },
      ],
    });

    if (reconfigure === "no") {
      log.info("Keeping existing configuration.");
      return;
    }

    console.log("");
  }

  // 4. Preguntar: crear nuevo o usar existente
  const choice = await select({
    message: "How do you want to store your configuration?",
    choices: [
      { value: "create", name: "Create new private repo (Recommended)" },
      { value: "existing", name: "Use existing repo" },
    ],
  });

  let repoUrl: string;
  let repoName: string;
  let repoOwner: string;

  if (choice === "create") {
    // 5a. Crear nuevo repo
    repoName = await input({
      message: "Repository name",
      default: "da-proj-secrets",
    });

    log.info("Creating private repository...");

    try {
      repoUrl = await createPrivateRepo(repoName);
      repoOwner = await getGitHubUsername();

      // Crear README.md en el repo
      log.info("Adding README to repository...");
      await uploadFile(repoUrl, "README.md", generateSecretsRepoReadme());
    } catch (error: any) {
      log.error(`Failed to create repository: ${error.message}`);
      process.exit(1);
    }
  } else {
    // 5b. Usar repo existente
    log.info("Fetching your private repositories...");

    let repos;
    try {
      repos = await listPrivateRepos();
    } catch (error: any) {
      log.error(`Failed to list repositories: ${error.message}`);
      process.exit(1);
    }

    if (repos.length === 0) {
      log.warn("No private repositories found.");
      console.log(`\nCreate one first or choose to create a new repo.\n`);
      process.exit(1);
    }

    const selected = await select({
      message: "Select repository",
      choices: repos.map((r) => ({
        value: r.url,
        name: `${r.name}${r.description ? ` - ${r.description}` : ""}`,
      })),
    });

    repoUrl = selected;
    const selectedRepo = repos.find((r) => r.url === selected);
    repoName = selectedRepo?.name || "";
    repoOwner = await getGitHubUsername();
  }

  // 6. Guardar configuración
  await saveGitHubSyncConfig({
    repoUrl,
    repoName,
    repoOwner,
  });

  log.success("GitHub sync configured!");
  console.log(`\n${colors.bright}Repository:${colors.reset} ${repoUrl}\n`);

  // 7. Preguntar si quiere subir config existente
  const localConfigPath = getConfigPath();
  if (existsSync(localConfigPath)) {
    const upload = await select({
      message: "Upload existing configuration to GitHub?",
      choices: [
        { value: "yes", name: "Yes, backup my current config" },
        { value: "no", name: "No, I'll do it later with --push" },
      ],
    });

    if (upload === "yes") {
      console.log("");
      // Import push command dynamically to avoid circular dependency
      const { pushCommand } = await import("../commands/push.ts");
      await pushCommand();
    } else {
      console.log(`\n${colors.bright}Next steps:${colors.reset}`);
      console.log(
        `  1. Run ${colors.cyan}da-proj --push${colors.reset} to upload your configuration`
      );
      console.log(
        `  2. On other devices, run ${colors.cyan}da-proj --pull${colors.reset} to download it\n`
      );
    }
  } else {
    console.log(`\n${colors.bright}Next steps:${colors.reset}`);
    console.log(
      `  1. Create profiles with ${colors.cyan}da-proj --secrets${colors.reset}`
    );
    console.log(
      `  2. Upload to GitHub with ${colors.cyan}da-proj --push${colors.reset}`
    );
    console.log(
      `  3. On other devices, run ${colors.cyan}da-proj --pull${colors.reset}\n`
    );
  }
}
