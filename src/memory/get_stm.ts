import { message_model } from "../db/sqlite/models.js";

export default async function get_stm(disable = false): Promise<
  {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
> {
  if (disable) {
    return [];
  }
  const last_20_messages: any = await message_model.findAll({
    order: [["created_at", "DESC"]],
    limit: 20,
    offset: 2, // Skip the last 2 message which is usually latest user input and uncompleted AI response
  });
  let final_stm = [];
  for await (const message of last_20_messages.reverse()) {
    final_stm.push({
      role: message.by === "AI" ? "assistant" : "user",
      content: message.text,
    });
  }
  return final_stm;
}
