import { input, select } from "@inquirer/prompts";
import { log, colors } from "../utils/logger.js";
import { 
  checkGitHubCLI, 
  getExistingSecrets, 
  setGitHubSecret 
} from "../utils/github.js";
import { 
  readGlobalConfig, 
  saveGlobalConfig, 
  getConfigPath 
} from "../utils/config.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function secretsCommand() {
  log.title("🔐 GitHub Secrets Setup");

  // Verificar GitHub CLI
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

  // Verificar autenticación
  try {
    await execAsync('gh auth status');
  } catch {
    log.error("Not authenticated with GitHub CLI.");
    console.log(`
${colors.yellow}Please authenticate first:${colors.reset}
  gh auth login
    `);
    process.exit(1);
  }

  log.info("GitHub CLI is ready!\n");

  // Verificar si ya existen secrets en este repo
  const existingSecrets = await getExistingSecrets();
  
  if (existingSecrets.url || existingSecrets.key) {
    log.warn("Found existing secrets in this repository:");
    if (existingSecrets.url) console.log(`  ${colors.yellow}✓${colors.reset} PORTFOLIO_API_URL`);
    if (existingSecrets.key) console.log(`  ${colors.yellow}✓${colors.reset} PORTFOLIO_API_KEY`);
    console.log('');
    
    const overwrite = await select({
      message: "Do you want to overwrite them?",
      choices: [
        { value: "yes", name: "Yes, overwrite with new configuration" },
        { value: "no", name: "No, keep existing secrets" }
      ]
    });
    
    if (overwrite === "no") {
      log.info("Keeping existing secrets. No changes made.");
      return;
    }
    
    console.log('');
  }

  // Leer configuración existente
  const config = await readGlobalConfig();
  const profiles = config.profiles || [];
  
  let selectedProfile: { name: string; portfolioUrl: string; apiKey: string } | null = null;
  
  if (profiles.length > 0) {
    log.info(`Found ${profiles.length} saved profile(s):\n`);
    
    const choices = [
      ...profiles.map((p, i) => ({
        value: `profile-${i}`,
        name: `${p.name} (${p.portfolioUrl})`
      })),
      { value: "new", name: "➕ Create new profile" },
      { value: "list", name: "📋 List all profiles" }
    ];
    
    const selection = await select({
      message: "Select a profile or create new:",
      choices
    });
    
    if (selection === "list") {
      // Mostrar todas las configuraciones
      log.title("📋 Saved Profiles");
      profiles.forEach((p, i) => {
        console.log(`\n${colors.bright}${i + 1}. ${p.name}${colors.reset}`);
        console.log(`   URL: ${p.portfolioUrl}`);
        console.log(`   Key: ${p.apiKey.substring(0, 16)}...${p.apiKey.substring(p.apiKey.length - 4)}`);
      });
      console.log('');
      
      const profileIndex = await input({
        message: "Enter profile number to use (or 0 to create new):",
        default: "1"
      });
      
      const idx = parseInt(profileIndex) - 1;
      if (idx >= 0 && idx < profiles.length) {
        selectedProfile = profiles[idx] || null;
      }
    } else if (selection.startsWith("profile-")) {
      const idx = parseInt(selection.replace("profile-", ""));
      selectedProfile = profiles[idx] || null;
    }
    
    if (selectedProfile) {
      log.info(`Using profile: ${selectedProfile.name}`);
      
      // Usar configuración existente
      try {
        if (existingSecrets.url) {
          log.info("Overwriting PORTFOLIO_API_URL...");
        }
        await setGitHubSecret('PORTFOLIO_API_URL', selectedProfile.portfolioUrl);
        log.success(existingSecrets.url ? "Updated PORTFOLIO_API_URL" : "Set PORTFOLIO_API_URL");

        if (existingSecrets.key) {
          log.info("Overwriting PORTFOLIO_API_KEY...");
        }
        await setGitHubSecret('PORTFOLIO_API_KEY', selectedProfile.apiKey);
        log.success(existingSecrets.key ? "Updated PORTFOLIO_API_KEY" : "Set PORTFOLIO_API_KEY");

        log.title("✨ Secrets configured successfully!");
        console.log(`\n${colors.bright}Using profile: ${selectedProfile.name}${colors.reset} 🎉\n`);
        return;
      } catch (error: any) {
        log.error("Failed to set secrets: " + error.message);
        process.exit(1);
      }
    }
  }

  // Crear nuevo perfil
  const profileName = await input({
    message: "Profile name (e.g., 'main', 'personal', 'work')",
    default: profiles.length === 0 ? "main" : "profile-" + (profiles.length + 1)
  });

  const portfolioUrl = await input({
    message: "Portfolio API URL",
    default: "https://your-portfolio.com"
  });

  const portfolioKey = await input({
    message: "Portfolio API Key (leave empty to generate one)",
    default: ""
  });

  let apiKey = portfolioKey;
  
  // Generar API key si está vacía
  if (!apiKey) {
    log.info("Generating API key...");
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    apiKey = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log(`\n${colors.bright}Generated API Key:${colors.reset}`);
    console.log('━'.repeat(70));
    console.log(apiKey);
    console.log('━'.repeat(70));
    console.log(`\n${colors.yellow}⚠️  IMPORTANT: Save this key!${colors.reset}`);
    console.log(`\n${colors.bright}1. Add it to your portfolio as environment variable:${colors.reset}`);
    console.log(`   PORTFOLIO_API_KEY=${apiKey}`);
    console.log(`\n${colors.bright}2. This key will be saved locally and reused for all your projects${colors.reset}\n`);
    
    await input({
      message: "Press Enter to continue and set the secrets in GitHub...",
      default: ""
    });
  }

  // Guardar configuración globalmente
  await saveGlobalConfig({ name: profileName, portfolioUrl, apiKey });

  // Configurar secrets en GitHub
  log.info("Setting GitHub secrets...");

  try {
    if (existingSecrets.url) {
      log.info("Overwriting PORTFOLIO_API_URL...");
    }
    await setGitHubSecret('PORTFOLIO_API_URL', portfolioUrl);
    log.success(existingSecrets.url ? "Updated PORTFOLIO_API_URL" : "Set PORTFOLIO_API_URL");

    if (existingSecrets.key) {
      log.info("Overwriting PORTFOLIO_API_KEY...");
    }
    await setGitHubSecret('PORTFOLIO_API_KEY', apiKey);
    log.success(existingSecrets.key ? "Updated PORTFOLIO_API_KEY" : "Set PORTFOLIO_API_KEY");

    log.title("✨ Secrets configured successfully!");

    console.log(`
${colors.bright}Configuration saved!${colors.reset}

${colors.green}✓${colors.reset} Profile "${profileName}" saved in: ${getConfigPath()}
${colors.green}✓${colors.reset} You can now use this profile in other repos!

${colors.bright}Next steps:${colors.reset}

1. ${colors.cyan}Make sure your portfolio has the API key${colors.reset}:
   PORTFOLIO_API_KEY=${apiKey}

2. ${colors.cyan}Test the workflow${colors.reset}:
   git add .
   git commit -m "Test workflow"
   git push

${colors.bright}All your projects using this profile will sync to the same portfolio!${colors.reset} 🎉
    `);

  } catch (error: any) {
    log.error("Failed to set secrets: " + error.message);
    console.log(`
${colors.yellow}You can set them manually:${colors.reset}

1. Go to your repo on GitHub
2. Settings > Secrets and variables > Actions
3. New repository secret:
   - Name: PORTFOLIO_API_URL
   - Value: ${portfolioUrl}
4. New repository secret:
   - Name: PORTFOLIO_API_KEY
   - Value: ${apiKey}
    `);
    process.exit(1);
  }
}
