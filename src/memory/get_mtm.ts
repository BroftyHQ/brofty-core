import getPrisma from "../db/prisma/client.js";

export default async function get_mtm(): Promise<
  {
    role: "user" | "assistant" | "system";
    content: string;
  }[]
> {
  const prisma = await getPrisma();
  const last_2_sumarized_messages = await prisma.messageSummary.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
    skip: 1, // Skip the most recent summary as it is already in stm
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
