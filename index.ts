#!/usr/bin/env bun

import { parseArgs } from "util";
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { input, select } from "@inquirer/prompts";

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
  -p, --portfolio <url>   Portfolio API URL
  -h, --help              Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  bunx da-proj --init
  bunx da-proj --init --portfolio https://myportfolio.com
    `);
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