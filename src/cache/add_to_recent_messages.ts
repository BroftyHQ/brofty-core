import redis from "./redis";

export default async function add_to_recent_messages({ user, by, content }) {
  // add to redis recent messages
  await redis.lpush(
    `recent_messages:${user}`,
    JSON.stringify({
      content,
      by,
    })
  );
  // trim the list to 10 messages
  await redis.ltrim(`recent_messages:${user}`, 0, 19);
}
