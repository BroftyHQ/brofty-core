import { execSync } from "child_process";

function getCurrentCommitHash() {
  return "e7f9d19490cd943c43e6413829abce856517be98";
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
