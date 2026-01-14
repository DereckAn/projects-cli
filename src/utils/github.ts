import { exec } from "child_process";
import { promisify } from "util";
import type { ExistingSecrets } from "../types/index.js";

const execAsync = promisify(exec);

// Verificar si GitHub CLI está instalado
export async function checkGitHubCLI(): Promise<boolean> {
  try {
    await execAsync('gh --version');
    return true;
  } catch {
    return false;
  }
}

// Verificar si un secret existe en el repositorio
export async function checkSecretExists(secretName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('gh secret list');
    return stdout.includes(secretName);
  } catch {
    return false;
  }
}

// Obtener información de los secrets existentes
export async function getExistingSecrets(): Promise<ExistingSecrets> {
  const urlExists = await checkSecretExists('PORTFOLIO_API_URL');
  const keyExists = await checkSecretExists('PORTFOLIO_API_KEY');
  return { url: urlExists, key: keyExists };
}

// Configurar un secret en GitHub
export async function setGitHubSecret(name: string, value: string): Promise<void> {
  await execAsync(`gh secret set ${name} --body "${value}"`);
}
