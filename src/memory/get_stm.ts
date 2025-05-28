import redis from "../cache/redis";

export default async function get_stm(user, disable = false) {
  const last_messages = await redis.lrange(
    `recent_messages:${user}`,
    0,
    disable ? 1 : 19
  );
  if (last_messages.length === 0) {
    return "";
  }
  let final_stm = "";
  for await (const message of last_messages.reverse()) {
    const parsedMessage = JSON.parse(message);
    final_stm += `\n\n${parsedMessage.by}: ${parsedMessage.content}`;
  }
  return final_stm;
}
