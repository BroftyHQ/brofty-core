import { execSync } from "child_process";

function getCurrentCommitHash() {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (err) {
    return "unknown";
  }
}

export {
  getCurrentCommitHash,
  // You can add more functions here if needed
};
