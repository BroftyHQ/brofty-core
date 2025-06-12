import { message_model } from "../db/sqlite/models.js";

export default async function get_stm(disable = false) {
  if (disable) {
      return "";
  }
  const last_20_messages:any = await message_model.findAll({
    order: [["createdAt", "DESC"]],
    limit: 20,
  });
  let final_stm = "";
  for await (const message of last_20_messages.reverse()) {
    final_stm += `\n\n${message.by}: ${message.text}`;
  }
  return final_stm;
}
