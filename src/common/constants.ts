const IS_PRODUCTION = process.env.NODE_ENV === "production";

const REDIS_URI = IS_PRODUCTION
  ? "redis://red-cnvk1vq0si5c73fgq97g:6379"
  : "rediss://red-cnvk1vq0si5c73fgq97g:V1NwQnfQhfFYwqKeZhbPHR4vjS9N9lPH@frankfurt-keyvalue.render.com:6379";

  const OPENAI_KEY = "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";

  const QDRANT_URI = "https://7c098633-72b1-486d-977d-e023664ba885.europe-west3-0.gcp.cloud.qdrant.io";
const QDRANT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.wsCoSjF7JerLmG-6su3rRmxaXtzVpLP_D79HksJGfU4";


export {
  IS_PRODUCTION,
  REDIS_URI,
  OPENAI_KEY,
  QDRANT_URI,
  QDRANT_KEY
};
