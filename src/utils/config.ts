import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import type { Config, Profile } from "../types/index.js";
import { log } from "./logger.js";

// Obtener ruta del archivo de configuración global
export function getConfigPath(): string {
  const homeDir = process.env.USERPROFILE || process.env.HOME || '';
  return `${homeDir}/.da-proj-config.json`;
}

// Leer configuración global
export async function readGlobalConfig(): Promise<Config> {
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
export async function saveGlobalConfig(profile: Profile): Promise<void> {
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
