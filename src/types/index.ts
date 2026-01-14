// Tipos para el proyecto
export interface ProjectMetadata {
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

export interface Profile {
  name: string;
  portfolioUrl: string;
  apiKey: string;
}

export interface Config {
  profiles?: Profile[];
}

export interface ExistingSecrets {
  url: boolean;
  key: boolean;
}
