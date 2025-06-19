import { execSync } from "child_process";
import { execa } from "execa";

async function getCurrentCommitHash() {
  try {
    return (await execa("git rev-parse HEAD")).stdout.trim();
  } catch (err) {
    return "unknown";
  }
}

export {
  getCurrentCommitHash,
  // You can add more functions here if needed
};
