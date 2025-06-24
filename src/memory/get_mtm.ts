import { message_summary_model } from "../db/sqlite/models.js";

export default async function get_mtm(): Promise<
  {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
> {
  const last_2_sumarized_messages = await message_summary_model.findAll({
    order: [["created_at", "DESC"]],
    limit: 2,
    offset: 1, // Skip the most recent summary as it is already in stm
  });
  if (last_2_sumarized_messages.length === 0) {
    return [];
  }
  return [
    {
      role: "system",
      content: `This is a summary of old messages from the chat history.
    ${last_2_sumarized_messages
      .reverse() // Reverse to show the most recent summary first
      .map((msg: any) => msg.summary)
      .join("\n\n")}
    `,
    },
  ];
}
