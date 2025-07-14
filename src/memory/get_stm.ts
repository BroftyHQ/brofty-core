import getPrisma from "../db/prisma/client.js";

export default async function get_stm(disable = false): Promise<
  {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
> {
  if (disable) {
    return [];
  }
  const prisma = await getPrisma();
  const last_20_messages: any = await prisma.message.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    skip: 2, // Skip the last 2 message which is usually latest user input and uncompleted AI response
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
