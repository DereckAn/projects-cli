// Generar schema JSON
export function generateSchema(): string {
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
