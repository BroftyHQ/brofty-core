
import { execa } from "execa";
import path from "path";
const PROJECT_ROOT = path.resolve(process.cwd());

async function getCurrentCommitHash() {
  try {
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
  // You can add more functions here if needed
};
