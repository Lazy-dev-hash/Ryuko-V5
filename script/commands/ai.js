module.exports.config = {
  name: "ai",
  version: "1.1.0",
  permission: 0,
  credits: "ryuko",
  description: "",
  prefix: false,
  premium: true,
  category: "without prefix",
  usage: "ai (question)",
  cooldowns: 3,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const axios = require("axios");

  const message = args.join(" ");
  if (!message) {
    return api.sendMessage("Please provide a question.\n\nExample: ai what is the solar system?", threadID, messageID);
  }

  const queryApiUrl = `https://jonellccprojectapis10.adaptable.app/api/gptconvo?ask=${encodeURIComponent(message)}&id=${senderID}`;

  // Sending initial "searching" message
  const lad = await api.sendMessage("🔎 Searching for an answer. Please wait...", threadID, messageID);

  try {
    // Handle image recognition if the message is a reply to an image
    if (type === "message_reply" && messageReply.attachments && messageReply.attachments[0]) {
      const attachment = messageReply.attachments[0];

      if (attachment.type === "photo") {
        const imageURL = attachment.url;
        const geminiApiUrl = `https://joshweb.click/gemini?prompt=${encodeURIComponent(message)}&url=${encodeURIComponent(imageURL)}`;

        const geminiResponse = await axios.get(geminiApiUrl);
        const caption = geminiResponse.data.gemini;

        if (caption) {
          return api.editMessage(
            `𝗚𝗲𝗺𝗶𝗻𝗶 𝗩𝗶𝘀𝗶𝗼𝗻 𝗣𝗿𝗼 𝗜𝗺𝗮𝗴𝗲 𝗥𝗲𝗰𝗼𝗴𝗻𝗶𝘁𝗶𝗼𝗻\n━━━━━━━━━━━━━━━━━━\n${caption}\n━━━━━━━━━━━━━━━━━━`,
            lad.messageID,
            threadID,
            messageID
          );
        } else {
          return api.sendMessage("🤖 Failed to recognize the image.", threadID, messageID);
        }
      }
    }

    // Handle chat-based questions
    const response = await axios.get(queryApiUrl);
    const { response: reply } = response.data;

    api.editMessage(
      `𝗖𝗛𝗔𝗧𝗚𝗣𝗧\n━━━━━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━━━━━`,
      lad.messageID,
      threadID,
      messageID
    );

    // Add to handleReply for follow-up responses
    global.client.handleReply.push({
      name: this.config.name,
      messageID: lad.messageID,
      author: senderID
    });
  } catch (error) {
    console.error(error);
    api.sendMessage("An error occurred while processing your request.", threadID, messageID);
  }
};
