import { exec } from "child_process";
import { promisify } from "util";
import type { ExistingSecrets, GitHubRepo } from "../types/index.js";
import { log } from "./logger.js";

const execAsync = promisify(exec);

// ============================================================================
// GitHub CLI Utilities
// ============================================================================

/**
 * Check if GitHub CLI is installed
 */
export async function checkGitHubCLI(): Promise<boolean> {
  try {
    await execAsync("gh --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get GitHub username from authenticated GitHub CLI
 */
export async function getGitHubUsername(): Promise<string> {
  try {
    const { stdout } = await execAsync("gh api user --jq .login");
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`Failed to get GitHub username: ${error.message}`);
  }
}

// ============================================================================
// GitHub Secrets (for repository secrets)
// ============================================================================

/**
 * Check if a secret exists in the repository
 */
export async function checkSecretExists(secretName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync("gh secret list");
    return stdout.includes(secretName);
  } catch {
    return false;
  }
}

/**
 * Get information about existing secrets
 */
export async function getExistingSecrets(): Promise<ExistingSecrets> {
  const urlExists = await checkSecretExists("PORTFOLIO_API_URL");
  const keyExists = await checkSecretExists("PORTFOLIO_API_KEY");
  return { url: urlExists, key: keyExists };
}

/**
 * Set a GitHub secret
 */
export async function setGitHubSecret(
  name: string,
  value: string
): Promise<void> {
  await execAsync(`gh secret set ${name} --body "${value}"`);
}

// ============================================================================
// GitHub Repository Management
// ============================================================================

/**
 * Create a private repository using GitHub CLI
 */
export async function createPrivateRepo(repoName: string): Promise<string> {
  try {
    // Create private repo with description
    await execAsync(
      `gh repo create ${repoName} --private --description "da-proj configuration sync"`
    );

    const username = await getGitHubUsername();
    const repoUrl = `https://github.com/${username}/${repoName}`;

    log.success(`Created private repository: ${repoName}`);
    return repoUrl;
  } catch (error: any) {
    throw new Error(`Failed to create repository: ${error.message}`);
  }
}

/**
 * List all private repositories for the authenticated user
 */
export async function listPrivateRepos(): Promise<GitHubRepo[]> {
  try {
    const { stdout } = await execAsync(
      "gh repo list --json name,url,description,isPrivate --limit 100"
    );

    const repos = JSON.parse(stdout);

    // Filter only private repos
    return repos
      .filter((repo: any) => repo.isPrivate)
      .map((repo: any) => ({
        name: repo.name,
        url: repo.url,
        description: repo.description || undefined,
        private: repo.isPrivate,
      }));
  } catch (error: any) {
    throw new Error(`Failed to list repositories: ${error.message}`);
  }
}

/**
 * Check if a repository exists
 */
export async function checkRepoExists(repoUrl: string): Promise<boolean> {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return false;
    }

    const [, owner, repo] = match;

    await execAsync(`gh api repos/${owner}/${repo}`);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// GitHub API File Operations
// ============================================================================

/**
 * Upload a file to GitHub repository using GitHub API
 */
export async function uploadFile(
  repoUrl: string,
  filePath: string,
  content: string
): Promise<void> {
  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }

    const [, owner, repo] = match;

    // Encode content to base64
    const base64Content = Buffer.from(content).toString("base64");

    // Check if file exists to get SHA (required for updates)
    let sha: string | undefined;
    try {
      const { stdout: existingFile } = await execAsync(
        `gh api repos/${owner}/${repo}/contents/${filePath} --jq .sha`
      );
      sha = existingFile.trim();
    } catch {
      // File doesn't exist, that's okay
    }

    // Upload using GitHub CLI
    await execAsync(
      `gh api repos/${owner}/${repo}/contents/${filePath} -X PUT -f message="Update ${filePath}" -f content="${base64Content}"${
        sha ? ` -f sha="${sha}"` : ""
      }`
    );

    log.success(`Uploaded ${filePath} to ${owner}/${repo}`);
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Download a file from GitHub repository using GitHub API
 */
export async function downloadFile(
  repoUrl: string,
  filePath: string
): Promise<string> {
  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }

    const [, owner, repo] = match;

    // Download file content
    const { stdout } = await execAsync(
      `gh api repos/${owner}/${repo}/contents/${filePath} --jq .content`
    );

    // Decode from base64
    const base64Content = stdout.trim();
    const content = Buffer.from(base64Content, "base64").toString("utf-8");

    return content;
  } catch (error: any) {
    if (error.message.includes("404")) {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

/**
 * Get the SHA of a file in the repository (needed for updates)
 */
export async function getFileSha(
  repoUrl: string,
  filePath: string
): Promise<string | null> {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid repository URL");
    }

    const [, owner, repo] = match;

    const { stdout } = await execAsync(
      `gh api repos/${owner}/${repo}/contents/${filePath} --jq .sha`
    );

    return stdout.trim();
  } catch (error: any) {
    if (error.message.includes("404")) {
      return null; // File doesn't exist
    }
    throw new Error(`Failed to get file SHA: ${error.message}`);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate README.md content for the secrets repository
 */
export function generateSecretsRepoReadme(): string {
  return `# da-proj Configuration Sync

This repository stores your \`da-proj\` configuration for synchronization across devices.

## What's stored here?

- \`da-proj-config.json\` - Your portfolio profiles (API keys and URLs)

## Security

⚠️ **This repository is PRIVATE** - Keep it that way!

This file contains sensitive API keys. Never make this repository public.

## Usage

This repository is managed automatically by \`da-proj\` CLI:

\`\`\`bash
# Upload your local configuration
bunx da-proj --push

# Download configuration to a new device
bunx da-proj --pull

# Check sync status
bunx da-proj --sync-status
\`\`\`

## Manual Access

If you need to manually edit the configuration:

1. Edit \`da-proj-config.json\` in this repository
2. Run \`bunx da-proj --pull\` on your device to download changes

---

🔐 Generated by [da-proj](https://github.com/your-username/da-proj)
`;
}
