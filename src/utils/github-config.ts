import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";

/**
 * Configuration for GitHub sync
 */
export interface GitHubSyncConfig {
  repoUrl: string; // "https://github.com/user/da-proj-secrets"
  repoName: string; // "da-proj-secrets"
  repoOwner: string; // "user"
}

/**
 * Get path to GitHub sync configuration file
 */
export function getGitHubSyncConfigPath(): string {
  const homeDir = process.env.USERPROFILE || process.env.HOME || "";
  return `${homeDir}/.da-proj-github-config`;
}

/**
 * Check if GitHub sync is configured
 */
export function isGitHubSyncConfigured(): boolean {
  const configPath = getGitHubSyncConfigPath();
  return existsSync(configPath);
}

/**
 * Read GitHub sync configuration
 */
export async function readGitHubSyncConfig(): Promise<GitHubSyncConfig | null> {
  try {
    const configPath = getGitHubSyncConfigPath();

    if (!existsSync(configPath)) {
      return null;
    }

    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Save GitHub sync configuration
 */
export async function saveGitHubSyncConfig(
  config: GitHubSyncConfig
): Promise<void> {
  const configPath = getGitHubSyncConfigPath();
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Delete GitHub sync configuration
 */
export async function deleteGitHubSyncConfig(): Promise<void> {
  const configPath = getGitHubSyncConfigPath();

  if (existsSync(configPath)) {
    const fs = await import("fs/promises");
    await fs.unlink(configPath);
  }
}
