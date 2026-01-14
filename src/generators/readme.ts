import type { ProjectMetadata } from "../types/index.js";

// Generar README
export function generateReadme(metadata: ProjectMetadata): string {
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
