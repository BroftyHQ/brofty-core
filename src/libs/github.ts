import { execa } from "execa";
import path from "path";
const PROJECT_ROOT = path.resolve(process.cwd());

async function getCurrentBranch() {
  try {
    const result = await execa("git", ["branch", "--show-current"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
    });
    return result.stdout.trim();
  } catch (err) {
    return null;
  }
}

async function getCurrentCommitHash() {
  try {
    // Check if we're on main branch
    const currentBranch = await getCurrentBranch();
    if (currentBranch !== "main") {
      return null;
    }

    const result = await execa("git", ["rev-parse", "HEAD"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe", // Capture output for logging
    });
    return result.stdout.trim();
  } catch (err) {
    return "unknown";
  }
}

export {
  getCurrentCommitHash,
  getCurrentBranch,
  // You can add more functions here if needed
};
