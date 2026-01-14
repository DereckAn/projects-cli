import { colors } from "./logger.js";

const PACKAGE_NAME = "da-proj";

// Obtener la versión actual del paquete
export function getCurrentVersion(): string {
  try {
    // Intentar leer desde package.json en el directorio del paquete
    const packageJson = require("../../package.json");
    return packageJson.version;
  } catch {
    return "unknown";
  }
}

// Verificar si hay una nueva versión disponible en npm
export async function checkForUpdates(): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
}> {
  const currentVersion = getCurrentVersion();

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`
    );
    const data = (await response.json()) as { version: string };
    const latestVersion = data.version;

    return {
      hasUpdate: latestVersion !== currentVersion,
      currentVersion,
      latestVersion,
    };
  } catch (error) {
    // Si falla la verificación, no mostrar error
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
    };
  }
}

// Mostrar banner con versión y verificación de actualizaciones
export async function showVersionBanner() {
  const currentVersion = getCurrentVersion();
  console.log(`${colors.dim}da-proj v${currentVersion}${colors.reset}\n`);

  // Verificar actualizaciones en segundo plano
  checkForUpdates()
    .then(({ hasUpdate, latestVersion }) => {
      if (hasUpdate) {
        console.log(`${colors.yellow}┌${"─".repeat(60)}┐${colors.reset}`);
        console.log(
          `${colors.yellow}│${colors.reset} ${colors.bright}Update available!${
            colors.reset
          } ${colors.dim}${currentVersion}${colors.reset} → ${
            colors.green
          }${latestVersion}${colors.reset}${" ".repeat(
            60 - 35 - currentVersion.length - latestVersion.length
          )}${colors.yellow}│${colors.reset}`
        );
        console.log(
          `${colors.yellow}│${colors.reset}${" ".repeat(60)}${colors.yellow}│${
            colors.reset
          }`
        );
        console.log(
          `${colors.yellow}│${colors.reset} Run: ${
            colors.cyan
          }bunx da-proj@latest${colors.reset}${" ".repeat(60 - 27)}${
            colors.yellow
          }│${colors.reset}`
        );
        console.log(
          `${colors.yellow}│${colors.reset} Or clear cache: ${
            colors.cyan
          }rm -rf ~/.bun/install/cache/da-proj*${colors.reset}${" ".repeat(
            60 - 53
          )}${colors.yellow}│${colors.reset}`
        );
        console.log(`${colors.yellow}└${"─".repeat(60)}┘${colors.reset}\n`);
      }
    })
    .catch(() => {
      // Ignorar errores silenciosamente
    });
}
