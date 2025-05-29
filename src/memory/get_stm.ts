import { message_model } from "../db/sqlite/models.js";

export default async function get_stm(user, disable = false) {
  if (disable) {
    return "";
  }
  const last_20_messages:any = await message_model.findAll({
    where: {
      userId: user.id,
    },
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  let final_stm = "";
  for await (const message of last_20_messages.reverse()) {
    const parsedMessage = JSON.parse(message);
    final_stm += `\n\n${parsedMessage.by}: ${parsedMessage.text}`;
  }
  return final_stm;
}
