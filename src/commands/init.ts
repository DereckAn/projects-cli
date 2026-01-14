import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";
import { input, select } from "@inquirer/prompts";
import type { ProjectMetadata } from "../types/index.js";
import { log, colors } from "../utils/logger.js";
import { generateMDX } from "../generators/mdx.js";
import { generateWorkflow } from "../generators/workflow.js";
import { generateReadme } from "../generators/readme.js";
import { generateSchema } from "../generators/schema.js";

export async function initCommand() {
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
    await writeFile("proj-images/.gitkeep", "");
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
   Run: ${colors.yellow}da-proj --secrets${colors.reset}
   
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
