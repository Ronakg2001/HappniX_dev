const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8085;
const wss = new WebSocketServer({ port: PORT });

console.log(`[Mock WS Server] Started and listening on port ${PORT}`);

// Mock responses for users when messaged
const MOCK_REPLIES = {
  "sarahc": [
    "Hey! Are we going to the gig tonight?",
    "Love the venue choice.",
    "Can you book the tickets or should I?",
    "Let's catch up there!",
  ],
  "ariar": [
    "Yes, I'm down!",
    "That tech-house lineup looks massive.",
    "See you soon!",
    "Just got my ticket!",
  ],
  "shadowmix": [
    "I'll be spinning a set from 10 PM.",
    "Get ready for a crazy night!",
    "Did you see the new visual setup?",
  ],
  "nehak": [
    "I might be running a bit late.",
    "Send me the location card again?",
    "Perfect, see you there!",
  ],
  "rohang": [
    "Let's coordinate the squad. Who's driving?",
    "I'm inviting Vikram too.",
    "Just booked general entry.",
  ]
};

// Keeps track of active connections
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("[Mock WS Server] New client connected");

  ws.on("message", (messageStr) => {
    try {
      const data = JSON.parse(messageStr);
      console.log("[Mock WS Server] Received event:", data.event, data.payload);

      switch (data.event) {
        case "auth":
          const userId = data.payload.userId || "anonymous";
          const username = data.payload.username || "anonymous";
          clients.set(ws, { userId, username });
          ws.send(JSON.stringify({
            event: "auth_success",
            payload: { userId, status: "connected" }
          }));
          break;

        case "send_message":
          const msg = data.payload.message;
          // Echo back confirmation
          ws.send(JSON.stringify({
            event: "message_receipt",
            payload: { messageId: msg.id, status: "sent" }
          }));

          // Simulate delivery status
          setTimeout(() => {
            ws.send(JSON.stringify({
              event: "message_receipt",
              payload: { messageId: msg.id, status: "delivered" }
            }));
          }, 800);

          // Get receiver username
          const toConversationId = msg.conversationId;
          const targetUsername = toConversationId.replace("c_", ""); // Assuming chat id matches user for direct messages

          // If target is in our replies, schedule a typing indicator and then a reply
          const replies = MOCK_REPLIES[targetUsername];
          if (replies) {
            // Typing start
            setTimeout(() => {
              ws.send(JSON.stringify({
                event: "typing_status",
                payload: {
                  conversationId: toConversationId,
                  username: targetUsername,
                  isTyping: true
                }
              }));
            }, 1500);

            // Typing stop and send message
            setTimeout(() => {
              // Typing stop
              ws.send(JSON.stringify({
                event: "typing_status",
                payload: {
                  conversationId: toConversationId,
                  username: targetUsername,
                  isTyping: false
                }
              }));

              const randomReply = replies[Math.floor(Math.random() * replies.length)];
              const newMsg = {
                id: `msg_${Date.now()}`,
                conversationId: toConversationId,
                senderId: targetUsername,
                type: "text",
                content: randomReply,
                status: "sent",
                createdAt: new Date().toISOString()
              };

              ws.send(JSON.stringify({
                event: "new_message",
                payload: { message: newMsg }
              }));
            }, 3500);
          }
          break;

        case "typing":
          // Client broadcasted they are typing to a conversation
          const { conversationId, isTyping } = data.payload;
          console.log(`[Mock WS Server] User typing state in ${conversationId}: ${isTyping}`);
          break;

        default:
          console.warn("[Mock WS Server] Unknown event:", data.event);
      }
    } catch (err) {
      console.error("[Mock WS Server] Failed parsing message", err);
    }
  });

  ws.on("close", () => {
    console.log("[Mock WS Server] Client disconnected");
    clients.delete(ws);
  });
});
