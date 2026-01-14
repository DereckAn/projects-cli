import type { ProjectMetadata } from "../types/index.js";

// Generar el contenido del MDX
export function generateMDX(
  metadata: ProjectMetadata,
  content: string
): string {
  const frontmatter = {
    title: metadata.title,
    category: metadata.category,
    type: metadata.type,
    status: metadata.status,
    ...(metadata.age && { age: metadata.age }),
    ...(metadata.repository && { repository: metadata.repository }),
    ...(metadata.demo && { demo: metadata.demo }),
    lastUpdated: new Date().toISOString().split("T")[0],
    technologies: metadata.technologies,
    images: metadata.images,
    ...(metadata.videos &&
      metadata.videos.length > 0 && { videos: metadata.videos }),
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
      return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
    }
    if (typeof value === "object") {
      return `${key}:\n${Object.entries(value)
        .map(([k, v]) => {
          if (Array.isArray(v)) {
            return `  ${k}:\n${v.map((item) => `    - ${item}`).join("\n")}`;
          }
          return `  ${k}: ${v}`;
        })
        .join("\n")}`;
    }
    return `${key}: "${value}"`;
  })
  .join("\n")}
---

${content}
`;
}
