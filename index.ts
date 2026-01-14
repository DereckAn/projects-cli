#!/usr/bin/env bun

import { parseArgs } from "util";
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { input, select } from "@inquirer/prompts";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Tipos para el proyecto
interface ProjectMetadata {
  title: string;
  category: string;
  type: "featured" | "small";
  status: "active" | "archived" | "in-progress";
  age?: string;
  repository?: string;
  demo?: string;
  technologies: string[];
  images: {
    cover: string;
    gallery: string[];
  };
  industry?: string;
  timeline?: string;
  details?: string[];
}

// Colores para la terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Verificar si GitHub CLI está instalado
async function checkGitHubCLI(): Promise<boolean> {
  try {
    await execAsync('gh --version');
    return true;
  } catch {
    return false;
  }
}

// Verificar si un secret existe en el repositorio
async function checkSecretExists(secretName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('gh secret list');
    return stdout.includes(secretName);
  } catch {
    return false;
  }
}

// Obtener información de los secrets existentes
async function getExistingSecrets(): Promise<{ url: boolean; key: boolean }> {
  const urlExists = await checkSecretExists('PORTFOLIO_API_URL');
  const keyExists = await checkSecretExists('PORTFOLIO_API_KEY');
  return { url: urlExists, key: keyExists };
}

// Obtener ruta del archivo de configuración global
function getConfigPath(): string {
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  return `${homeDir}/.da-proj-config.json`;
}

// Leer configuración global
async function readGlobalConfig(): Promise<{ profiles?: Array<{ name: string; portfolioUrl: string; apiKey: string }> }> {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Si hay error, retornar objeto vacío
  }
  return { profiles: [] };
}

// Guardar configuración global
async function saveGlobalConfig(profile: { name: string; portfolioUrl: string; apiKey: string }) {
  try {
    const configPath = getConfigPath();
    const config = await readGlobalConfig();
    
    if (!config.profiles) {
      config.profiles = [];
    }
    
    // Buscar si ya existe un perfil con ese nombre
    const existingIndex = config.profiles.findIndex(p => p.name === profile.name);
    
    if (existingIndex >= 0) {
      // Actualizar existente
      config.profiles[existingIndex] = profile;
    } else {
      // Agregar nuevo
      config.profiles.push(profile);
    }
    
    await writeFile(configPath, JSON.stringify(config, null, 2));
    log.success(`Configuration saved to ${configPath}`);
  } catch (error: any) {
    log.warn(`Could not save config: ${error.message}`);
  }
}

// Configurar GitHub Secrets
async function setupGitHubSecrets() {
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
        await execAsync(`gh secret set PORTFOLIO_API_URL --body "${selectedProfile.portfolioUrl}"`);
        log.success(existingSecrets.url ? "Updated PORTFOLIO_API_URL" : "Set PORTFOLIO_API_URL");

        if (existingSecrets.key) {
          log.info("Overwriting PORTFOLIO_API_KEY...");
        }
        await execAsync(`gh secret set PORTFOLIO_API_KEY --body "${selectedProfile.apiKey}"`);
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
    // Set PORTFOLIO_API_URL
    if (existingSecrets.url) {
      log.info("Overwriting PORTFOLIO_API_URL...");
    }
    await execAsync(`gh secret set PORTFOLIO_API_URL --body "${portfolioUrl}"`);
    log.success(existingSecrets.url ? "Updated PORTFOLIO_API_URL" : "Set PORTFOLIO_API_URL");

    // Set PORTFOLIO_API_KEY
    if (existingSecrets.key) {
      log.info("Overwriting PORTFOLIO_API_KEY...");
    }
    await execAsync(`gh secret set PORTFOLIO_API_KEY --body "${apiKey}"`);
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

// Generar el contenido del MDX
function generateMDX(metadata: ProjectMetadata, content: string): string {
  const frontmatter = {
    title: metadata.title,
    category: metadata.category,
    type: metadata.type,
    status: metadata.status,
    ...(metadata.age && { age: metadata.age }),
    ...(metadata.repository && { repository: metadata.repository }),
    ...(metadata.demo && { demo: metadata.demo }),
    lastUpdated: new Date().toISOString().split('T')[0],
    technologies: metadata.technologies,
    images: metadata.images,
    ...(metadata.type === "featured" && {
      industry: metadata.industry,
      timeline: metadata.timeline,
      details: metadata.details,
    }),
  };

  return `---
${Object.entries(frontmatter)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
    }
    if (typeof value === 'object') {
      return `${key}:\n${Object.entries(value)
        .map(([k, v]) => {
          if (Array.isArray(v)) {
            return `  ${k}:\n${v.map(item => `    - ${item}`).join('\n')}`;
          }
          return `  ${k}: ${v}`;
        })
        .join('\n')}`;
    }
    return `${key}: "${value}"`;
  })
  .join('\n')}
---

${content}
`;
}

// Generar workflow de GitHub Actions
function generateWorkflow(): string {
  return `name: Sync to Portfolio

on:
  push:
    branches: [main, master]
    paths:
      - '.project-metadata.mdx'
      - 'proj-images/**'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Extract metadata
        id: metadata
        run: |
          bun install gray-matter
          bun run -e "
          import matter from 'gray-matter';
          import { readFileSync } from 'fs';
          
          const content = readFileSync('.project-metadata.mdx', 'utf8');
          const { data, content: markdown } = matter(content);
          
          data.repository = {
            owner: process.env.GITHUB_REPOSITORY.split('/')[0],
            name: process.env.GITHUB_REPOSITORY.split('/')[1],
            url: \`https://github.com/\${process.env.GITHUB_REPOSITORY}\`
          };
          data.lastCommit = process.env.GITHUB_SHA;
          data.lastUpdated = new Date().toISOString();
          
          console.log('METADATA=' + JSON.stringify({ metadata: data, markdown }));
          " > output.txt
          
          METADATA=$(cat output.txt | grep METADATA | cut -d'=' -f2-)
          echo "data<<EOF" >> $GITHUB_OUTPUT
          echo "$METADATA" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
      
      - name: Notify Portfolio
        env:
          PORTFOLIO_API_URL: \${{ secrets.PORTFOLIO_API_URL }}
          PORTFOLIO_API_KEY: \${{ secrets.PORTFOLIO_API_KEY }}
        run: |
          curl -X POST "$PORTFOLIO_API_URL/api/update-project" \\
            -H "Content-Type: application/json" \\
            -H "Authorization: Bearer $PORTFOLIO_API_KEY" \\
            -d '\${{ steps.metadata.outputs.data }}'
      
      - name: Create deployment badge
        if: success()
        run: |
          echo "![Synced to Portfolio](https://img.shields.io/badge/portfolio-synced-success)" >> $GITHUB_STEP_SUMMARY
          echo "Last sync: $(date)" >> $GITHUB_STEP_SUMMARY
`;
}

// Generar README
function generateReadme(metadata: ProjectMetadata): string {
  return `# ${metadata.title}

![Portfolio Status](https://img.shields.io/badge/portfolio-synced-success)
![Type](https://img.shields.io/badge/type-${metadata.type}-blue)
![Status](https://img.shields.io/badge/status-${metadata.status}-yellow)

${metadata.type === "featured" ? "## Featured Project 🌟" : "## Project"}

**Category:** ${metadata.category}  
**Technologies:** ${metadata.technologies.join(", ")}

## Description

[Project description here]

## Portfolio Integration

This project is automatically synced to my portfolio. Any changes to \`.project-metadata.mdx\` will trigger an update.

### Project Metadata

The metadata for this project is defined in [\`.project-metadata.mdx\`](./.project-metadata.mdx).

To update the portfolio:
1. Edit \`.project-metadata.mdx\`
2. Commit and push changes
3. GitHub Actions will automatically sync to the portfolio

## Setup

[Installation and setup instructions]

## Usage

[Usage instructions]

---

💼 [View this project in my portfolio](${metadata.demo || metadata.repository || "#"})
`;
}

// Generar schema JSON
function generateSchema(): string {
  return `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Project Metadata",
  "type": "object",
  "required": ["title", "category", "type", "status", "technologies"],
  "properties": {
    "title": {
      "type": "string",
      "description": "Project title"
    },
    "category": {
      "type": "string",
      "description": "Main category (e.g., Web Development, AI/ML)"
    },
    "type": {
      "enum": ["featured", "small"],
      "description": "Project type for portfolio display"
    },
    "status": {
      "enum": ["active", "archived", "in-progress"],
      "description": "Current project status"
    },
    "age": {
      "type": "string",
      "description": "How old is the project (e.g., +2 months)"
    },
    "repository": {
      "type": "string",
      "format": "uri",
      "description": "GitHub repository URL"
    },
    "demo": {
      "type": "string",
      "format": "uri",
      "description": "Live demo URL"
    },
    "technologies": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of technologies used"
    },
    "images": {
      "type": "object",
      "properties": {
        "cover": { "type": "string" },
        "gallery": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "industry": {
      "type": "string",
      "description": "Industry (for featured projects)"
    },
    "timeline": {
      "type": "string",
      "description": "Project timeline"
    },
    "details": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Additional details (for featured projects)"
    }
  }
}`;
}

// Función principal
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
    await setupGitHubSecrets();
    process.exit(0);
  }

  log.title("🚀 Project Metadata Setup");

  // Verificar que estamos en un repositorio git
  if (!existsSync(".git")) {
    log.error("Not a git repository. Please run this command in a git repository.");
    process.exit(1);
  }

  // Recopilar información del proyecto
  log.info("Let's set up your project metadata...\n");

  const title = await input({ 
    message: "Project title",
    default: "My Awesome Project"
  });
  
  const category = await input({ 
    message: "Category",
    default: "Web Development"
  });
  
  const type = await select({ 
    message: "Project type",
    choices: [
      { value: "small", name: "Small project" },
      { value: "featured", name: "Featured project" }
    ]
  }) as "featured" | "small";
  
  const status = await select({ 
    message: "Project status",
    choices: [
      { value: "in-progress", name: "In Progress" },
      { value: "active", name: "Active" },
      { value: "archived", name: "Archived" }
    ]
  }) as "active" | "archived" | "in-progress";
  
  const age = await input({ 
    message: "Project age (optional)",
    default: "+2 months"
  });
  
  const demo = await input({ 
    message: "Demo URL (optional)",
    default: ""
  });
  
  // Tecnologías - input múltiple
  const techInput = await input({ 
    message: "Technologies (comma separated)",
    default: "React, TypeScript, Node.js"
  });
  const technologies = techInput.split(",").map(t => t.trim()).filter(Boolean);
  
  const coverImage = await input({ 
    message: "Cover image path",
    default: "/proj-images/cover.png"
  });
  
  const galleryInput = await input({ 
    message: "Gallery images (comma separated, optional)",
    default: ""
  });
  const galleryImages = galleryInput ? galleryInput.split(",").map(t => t.trim()).filter(Boolean) : [];

  let industry, timeline, details;
  if (type === "featured") {
    industry = await input({ 
      message: "Industry",
      default: "Technology"
    });
    
    timeline = await input({ 
      message: "Timeline",
      default: "Still Working"
    });
    
    const detailsInput = await input({ 
      message: "Project details (comma separated)",
      default: "Built with modern stack, Scalable architecture, Production ready"
    });
    details = detailsInput.split(",").map(t => t.trim()).filter(Boolean);
  }

  const metadata: ProjectMetadata = {
    title,
    category,
    type,
    status,
    age: age || undefined,
    demo: demo || undefined,
    technologies,
    images: {
      cover: coverImage,
      gallery: galleryImages,
    },
    industry,
    timeline,
    details,
  };

  // Contenido inicial del MDX
  const mdxContent = `# ${title}

## Description

[Add your project description here]

## Key Features

- Feature 1
- Feature 2
- Feature 3

## Challenges

[Describe the technical challenges you faced]

## Outcomes

[What did you learn and achieve?]

## Future Improvements

- [ ] Improvement 1
- [ ] Improvement 2
`;

  // Crear archivos
  log.info("\nCreating files...");

  try {
    // .project-metadata.mdx
    await writeFile(".project-metadata.mdx", generateMDX(metadata, mdxContent));
    log.success("Created .project-metadata.mdx");

    // .github/workflows/sync-portfolio.yml
    await mkdir(".github/workflows", { recursive: true });
    await writeFile(".github/workflows/sync-portfolio.yml", generateWorkflow());
    log.success("Created .github/workflows/sync-portfolio.yml");

    // README.md (solo si no existe)
    if (!existsSync("README.md")) {
      await writeFile("README.md", generateReadme(metadata));
      log.success("Created README.md");
    } else {
      log.warn("README.md already exists, skipping");
    }

    // .project-schema.json
    await writeFile(".project-schema.json", generateSchema());
    log.success("Created .project-schema.json");

    // Crear carpeta de imágenes con README
    await mkdir("proj-images", { recursive: true });
    const imagesReadme = `# Project Images Folder

Place your project images here:

- **cover.png/jpg**: Main cover image for your project
- **screenshot1.png/jpg**: Gallery image 1
- **screenshot2.png/jpg**: Gallery image 2
- **screenshot3.png/jpg**: Gallery image 3

## Recommended sizes:

- Cover image: 1200x630px (or 16:9 ratio)
- Screenshots: 1920x1080px or similar

## Tips:

- Use descriptive filenames
- Optimize images before uploading (use tools like TinyPNG)
- Supported formats: PNG, JPG, WebP
- Keep file sizes under 500KB for better performance

## Current images needed:

${coverImage ? `- [ ] ${coverImage}` : ''}
${galleryImages.map(img => `- [ ] ${img}`).join('\n')}
`;
    await writeFile("proj-images/README.md", imagesReadme);
    await writeFile("proj-images/.gitkeep", ""); // Para que git trackee la carpeta vacía
    log.success("Created proj-images/ folder");

    // .gitignore update
    let gitignore = "";
    if (existsSync(".gitignore")) {
      gitignore = await readFile(".gitignore", "utf-8");
    }
    
    if (!gitignore.includes("node_modules")) {
      gitignore += "\n# Dependencies\nnode_modules/\n";
      await writeFile(".gitignore", gitignore);
      log.success("Updated .gitignore");
    }

    log.title("✨ Setup Complete!");

    console.log(`
${colors.bright}Next steps:${colors.reset}

1. ${colors.cyan}Add images${colors.reset} to the proj-images/ folder:
   - Cover image: ${coverImage}
   ${galleryImages.length > 0 ? galleryImages.map(img => `- Gallery: ${img}`).join('\n   ') : ''}

2. ${colors.cyan}Review and edit${colors.reset} .project-metadata.mdx

3. ${colors.cyan}Set up secrets${colors.reset} in GitHub:
   - PORTFOLIO_API_URL
   - PORTFOLIO_API_KEY
   
4. ${colors.cyan}Commit and push${colors.reset}:
   ${colors.yellow}git add .
   git commit -m "Add portfolio metadata"
   git push${colors.reset}

${colors.bright}Portfolio will auto-sync on push!${colors.reset} 🎉
    `);

  } catch (error) {
    log.error("Failed to create files: " + error);
    process.exit(1);
  }
}

main().catch(console.error);