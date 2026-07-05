import { Conversation, Message, ChatUser, MessageType, EventSharePayload } from "../types";

const MOCK_USERS: Record<string, ChatUser> = {
  "sarahc": { id: "f1", username: "sarahc", avatarUrl: "", presence: "online", isVerified: false },
  "ariar": { id: "f2", username: "ariar", avatarUrl: "", presence: "typing", isVerified: false },
  "shadowmix": { id: "f3", username: "shadowmix", avatarUrl: "", presence: "online", isVerified: true },
  "nehak": { id: "f4", username: "nehak", avatarUrl: "", presence: "away", isVerified: false },
  "vikrams": { id: "f5", username: "vikrams", avatarUrl: "", presence: "offline", isVerified: false },
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c_sarahc",
    type: "direct",
    title: "Sarah Connor",
    avatarUrl: "",
    unreadCount: 2,
    members: [MOCK_USERS.sarahc],
    lastMessage: {
      id: "msg_pre_1",
      conversationId: "c_sarahc",
      senderId: "sarahc",
      type: "text",
      content: "Hey, are you coming to the techno night tonight?",
      status: "sent",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  },
  {
    id: "c_ariar",
    type: "direct",
    title: "Aria Roy",
    avatarUrl: "",
    unreadCount: 0,
    members: [MOCK_USERS.ariar],
    lastMessage: {
      id: "msg_pre_2",
      conversationId: "c_ariar",
      senderId: "ariar",
      type: "text",
      content: "Got the general entry tickets!",
      status: "sent",
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  },
  {
    id: "c_shadowmix",
    type: "direct",
    title: "DJ Shadow",
    avatarUrl: "",
    unreadCount: 0,
    members: [MOCK_USERS.shadowmix],
    lastMessage: {
      id: "msg_pre_3",
      conversationId: "c_shadowmix",
      senderId: "shadowmix",
      type: "text",
      content: "My set starts at 10 PM. Don't be late!",
      status: "sent",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  },
  {
    id: "c_squad1",
    type: "group",
    title: "Weekend Gigs Squad",
    avatarUrl: "",
    unreadCount: 0,
    members: [MOCK_USERS.sarahc, MOCK_USERS.ariar, MOCK_USERS.vikrams],
    lastMessage: {
      id: "msg_pre_4",
      conversationId: "c_squad1",
      senderId: "vikrams",
      type: "text",
      content: "Who is driving to the event?",
      status: "sent",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  }
];

// Seed message threads
const MOCK_THREAD_MESSAGES: Record<string, Message[]> = {
  "c_sarahc": [
    {
      id: "msg_init_1",
      conversationId: "c_sarahc",
      senderId: "me",
      type: "text",
      content: "Hey Sarah! How's it going?",
      status: "sent",
      createdAt: new Date(Date.now() - 18000000).toISOString()
    },
    {
      id: "msg_init_2",
      conversationId: "c_sarahc",
      senderId: "sarahc",
      type: "text",
      content: "All good! Super excited for the weekend gig.",
      status: "sent",
      createdAt: new Date(Date.now() - 17000000).toISOString()
    },
    {
      id: "msg_init_3",
      conversationId: "c_sarahc",
      senderId: "me",
      type: "event_share",
      content: "Check this event out!",
      eventShare: {
        eventId: "evt_1",
        title: "Sub Sonic Techno Session",
        coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500",
        date: "Jun 06, 9:00 PM",
        venue: "Warehouse Club, Sector 5"
      },
      status: "sent",
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: "msg_pre_1",
      conversationId: "c_sarahc",
      senderId: "sarahc",
      type: "text",
      content: "Hey, are you coming to the techno night tonight?",
      status: "sent",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  "c_ariar": [
    {
      id: "msg_pre_2",
      conversationId: "c_ariar",
      senderId: "ariar",
      type: "text",
      content: "Got the general entry tickets!",
      status: "sent",
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  "c_shadowmix": [
    {
      id: "msg_pre_3",
      conversationId: "c_shadowmix",
      senderId: "shadowmix",
      type: "text",
      content: "My set starts at 10 PM. Don't be late!",
      status: "sent",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  "c_squad1": [
    {
      id: "msg_squad_1",
      conversationId: "c_squad1",
      senderId: "sarahc",
      type: "text",
      content: "Hey guys! Who's in for the session?",
      status: "sent",
      createdAt: new Date(Date.now() - 250000000).toISOString()
    },
    {
      id: "msg_squad_2",
      conversationId: "c_squad1",
      senderId: "ariar",
      type: "text",
      content: "Count me in! Already bought tickets.",
      status: "sent",
      createdAt: new Date(Date.now() - 240000000).toISOString()
    },
    {
      id: "msg_pre_4",
      conversationId: "c_squad1",
      senderId: "vikrams",
      type: "text",
      content: "Who is driving to the event?",
      status: "sent",
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ]
};

let wsConnection: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    // Mimic API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_CONVERSATIONS;
  },

  getMessages: async (conversationId: string, cursor?: string): Promise<{ messages: Message[]; nextCursor?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const thread = MOCK_THREAD_MESSAGES[conversationId] || [];
    return {
      messages: [...thread],
      nextCursor: undefined // Single page mock
    };
  },

  sendMessage: async (conversationId: string, text: string, type: MessageType = "text", eventShare?: EventSharePayload, id?: string): Promise<Message> => {
    const newMsg: Message = {
      id: id || `msg_${Date.now()}`,
      conversationId,
      senderId: "me",
      type,
      content: text,
      eventShare,
      status: "sent",
      createdAt: new Date().toISOString()
    };

    // If socket is open, route it through server
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        event: "send_message",
        payload: { message: newMsg }
      }));
    }

    // Save locally
    if (!MOCK_THREAD_MESSAGES[conversationId]) {
      MOCK_THREAD_MESSAGES[conversationId] = [];
    }
    MOCK_THREAD_MESSAGES[conversationId].push(newMsg);

    // Update last message in conversation list
    const conv = MOCK_CONVERSATIONS.find(c => c.id === conversationId);
    if (conv) {
      conv.lastMessage = newMsg;
    }

    return newMsg;
  },

  initWebSocket: (
    userId: string,
    username: string,
    callbacks: {
      onNewMessage: (msg: Message) => void;
      onTypingStatus: (conversationId: string, username: string, isTyping: boolean) => void;
      onStatusUpdate: (messageId: string, status: "sent" | "delivered") => void;
      onConnectionChange: (connected: boolean) => void;
    }
  ) => {
    if (wsConnection) {
      wsConnection.close();
    }

    const connect = () => {
      const wsUrl = "ws://localhost:8085";
      console.log(`[WS Client] Connecting to ${wsUrl}...`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS Client] Connected!");
        wsConnection = ws;
        callbacks.onConnectionChange(true);
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }

        // Authenticate connection
        ws.send(JSON.stringify({
          event: "auth",
          payload: { userId, username }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WS Client] Received event:", data.event, data.payload);

          switch (data.event) {
            case "new_message":
              const msg = data.payload.message;
              if (!MOCK_THREAD_MESSAGES[msg.conversationId]) {
                MOCK_THREAD_MESSAGES[msg.conversationId] = [];
              }
              MOCK_THREAD_MESSAGES[msg.conversationId].push(msg);
              const conv = MOCK_CONVERSATIONS.find(c => c.id === msg.conversationId);
              if (conv) {
                conv.lastMessage = msg;
              }
              callbacks.onNewMessage(msg);
              break;

            case "typing_status":
              const { conversationId, username: typingUser, isTyping } = data.payload;
              callbacks.onTypingStatus(conversationId, typingUser, isTyping);
              break;

            case "message_receipt":
              const { messageId, status } = data.payload;
              callbacks.onStatusUpdate(messageId, status);
              break;
          }
        } catch (err) {
          console.error("[WS Client] Error handling message", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS Client] Disconnected");
        wsConnection = null;
        callbacks.onConnectionChange(false);

        // Schedule reconnection
        if (!reconnectInterval) {
          reconnectInterval = setInterval(() => {
            connect();
          }, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error("[WS Client] WebSocket Error", err);
        ws.close();
      };
    };

    connect();
  },

  sendTyping: (conversationId: string, isTyping: boolean) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        event: "typing",
        payload: { conversationId, isTyping }
      }));
    }
  },

  disconnect: () => {
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  }
};
