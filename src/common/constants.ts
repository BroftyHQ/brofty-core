const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BACKEND_URL = IS_PRODUCTION
  ? "https://backend.brofty.com"
  : "http://localhost:1337";
export { IS_PRODUCTION, BACKEND_URL };
