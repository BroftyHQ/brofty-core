import Redis from "ioredis";
import { REDIS_URI } from "../common/constants";

const redis = new Redis(
  REDIS_URI
)

export default redis;