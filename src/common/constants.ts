const IS_PRODUCTION = process.env.NODE_ENV === "production";

const REDIS_URI = IS_PRODUCTION
  ? "redis://red-cnvk1vq0si5c73fgq97g:6379"
  : "rediss://red-cnvk1vq0si5c73fgq97g:V1NwQnfQhfFYwqKeZhbPHR4vjS9N9lPH@frankfurt-keyvalue.render.com:6379";

export {
  IS_PRODUCTION,
  REDIS_URI,
};
