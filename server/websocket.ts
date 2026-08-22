import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface WSClient {
  ws: WebSocket;
  userId?: number;
  username?: string;
  topicId?: number;
}

interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

const clients: Map<string, WSClient> = new Map();

export function setupWebSocket(server: Server) {
  // This server shares the HTTP listener with Vite HMR. Keep upgrade routing
  // explicit so /ws is handled here while Vite can handle its root-path socket.
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (pathname !== "/ws") return;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    const clientId = Math.random().toString(36).substring(2, 15);
    clients.set(clientId, { ws });

    ws.on("message", (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch (e) {
        // Ignore malformed messages
      }
    });

    ws.on("close", () => {
      const client = clients.get(clientId);
      if (client?.topicId) {
        broadcastToTopic(client.topicId, {
          type: "user_left",
          payload: {
            userId: client.userId,
            username: client.username,
            onlineCount: getTopicOnlineCount(client.topicId),
          },
        }, clientId);
      }
      clients.delete(clientId);
    });

    // Send welcome
    ws.send(JSON.stringify({ type: "connected", payload: { clientId } }));
  });

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

function handleMessage(clientId: string, message: WSMessage) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case "auth": {
      client.userId = message.payload.userId as number;
      client.username = message.payload.username as string;
      break;
    }

    case "join_topic": {
      const topicId = message.payload.topicId as number;
      // Leave previous topic
      if (client.topicId) {
        broadcastToTopic(client.topicId, {
          type: "user_left",
          payload: {
            userId: client.userId,
            username: client.username,
            onlineCount: getTopicOnlineCount(client.topicId) - 1,
          },
        }, clientId);
      }
      client.topicId = topicId;
      // Notify others
      broadcastToTopic(topicId, {
        type: "user_joined",
        payload: {
          userId: client.userId,
          username: client.username,
          onlineCount: getTopicOnlineCount(topicId),
        },
      }, clientId);
      // Send online users to new joiner
      client.ws.send(JSON.stringify({
        type: "online_users",
        payload: {
          users: getTopicOnlineUsers(topicId),
          onlineCount: getTopicOnlineCount(topicId),
        },
      }));
      break;
    }

    case "leave_topic": {
      if (client.topicId) {
        const topicId = client.topicId;
        client.topicId = undefined;
        broadcastToTopic(topicId, {
          type: "user_left",
          payload: {
            userId: client.userId,
            username: client.username,
            onlineCount: getTopicOnlineCount(topicId),
          },
        }, clientId);
      }
      break;
    }

    case "typing": {
      if (client.topicId) {
        broadcastToTopic(client.topicId, {
          type: "typing",
          payload: {
            userId: client.userId,
            username: client.username,
            isTyping: message.payload.isTyping as boolean,
          },
        }, clientId);
      }
      break;
    }

    case "new_reply": {
      // Broadcast new reply to all users in the topic
      if (client.topicId) {
        broadcastToTopic(client.topicId, {
          type: "new_reply",
          payload: message.payload,
        }, clientId);
      }
      break;
    }

    case "new_topic": {
      // Broadcast to all connected users about new topic
      broadcastToAll({
        type: "new_topic",
        payload: message.payload,
      }, clientId);
      break;
    }
  }
}

function broadcastToTopic(topicId: number, message: WSMessage, excludeClientId?: string) {
  const data = JSON.stringify(message);
  clients.forEach((client, id) => {
    if (client.topicId === topicId && id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function broadcastToAll(message: WSMessage, excludeClientId?: string) {
  const data = JSON.stringify(message);
  clients.forEach((client, id) => {
    if (id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function getTopicOnlineCount(topicId: number): number {
  let count = 0;
  clients.forEach((client) => {
    if (client.topicId === topicId && client.userId) count++;
  });
  return count;
}

function getTopicOnlineUsers(topicId: number): { userId: number; username: string }[] {
  const users: { userId: number; username: string }[] = [];
  clients.forEach((client) => {
    if (client.topicId === topicId && client.userId && client.username) {
      users.push({ userId: client.userId, username: client.username });
    }
  });
  return users;
}

// Export for use in routers to notify about new replies/topics
export function notifyTopicReply(topicId: number, reply: Record<string, unknown>) {
  broadcastToTopic(topicId, {
    type: "new_reply",
    payload: reply,
  });
}

export function notifyNewTopic(topic: Record<string, unknown>) {
  broadcastToAll({
    type: "new_topic",
    payload: topic,
  });
}
