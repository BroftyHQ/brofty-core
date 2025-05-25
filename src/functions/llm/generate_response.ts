import prisma from "../../db/prisma";
import pubsub from "../../pubsub";

export default async function generate_response(id, text, user) {
  let finalText = ``;
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      pubsub.publish("MESSGAE_STREAM", {
        messageStream: {
          type: "APPEND_MESSAGE",
          by: "AI",
          id: id,
          text: `Message ${i + 1}: Open sesame`,
        },
      });
      finalText += `Message ${i + 1}: Open sesame\n`;
    }, i * 1000);
  }
  // add to db
  const message = await prisma.message.create({
    data: {
      id,
      content: finalText,
      createdAt: +new Date(),
      updatedAt: +new Date(),
      user,
    },
  });
}
