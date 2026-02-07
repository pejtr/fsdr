import { useState, useEffect, useRef, useCallback } from "react";

interface OnlineUser {
  userId: number;
  username: string;
}

interface TypingUser {
  userId: number;
  username: string;
}

interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}

interface UseForumWebSocketOptions {
  topicId?: number;
  userId?: number;
  username?: string;
  onNewReply?: (reply: Record<string, unknown>) => void;
  onNewTopic?: (topic: Record<string, unknown>) => void;
}

export function useForumWebSocket({
  topicId,
  userId,
  username,
  onNewReply,
  onNewTopic,
}: UseForumWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setIsConnected(true);
      // Authenticate
      if (userId && username) {
        ws.send(JSON.stringify({
          type: "auth",
          payload: { userId, username },
        }));
      }
      // Join topic if specified
      if (topicId) {
        ws.send(JSON.stringify({
          type: "join_topic",
          payload: { topicId },
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        // Ignore
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [topicId, userId, username]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case "online_users":
        setOnlineUsers(message.payload.users as OnlineUser[]);
        setOnlineCount(message.payload.onlineCount as number);
        break;

      case "user_joined":
        setOnlineCount(message.payload.onlineCount as number);
        setOnlineUsers((prev) => {
          const newUser = {
            userId: message.payload.userId as number,
            username: message.payload.username as string,
          };
          if (prev.find((u) => u.userId === newUser.userId)) return prev;
          return [...prev, newUser];
        });
        break;

      case "user_left":
        setOnlineCount(message.payload.onlineCount as number);
        setOnlineUsers((prev) =>
          prev.filter((u) => u.userId !== (message.payload.userId as number))
        );
        break;

      case "typing": {
        const typingUserId = message.payload.userId as number;
        const typingUsername = message.payload.username as string;
        const isTyping = message.payload.isTyping as boolean;

        if (isTyping) {
          setTypingUsers((prev) => {
            if (prev.find((u) => u.userId === typingUserId)) return prev;
            return [...prev, { userId: typingUserId, username: typingUsername }];
          });
          // Auto-remove after 5 seconds
          const existing = typingTimeoutRef.current.get(typingUserId);
          if (existing) clearTimeout(existing);
          typingTimeoutRef.current.set(
            typingUserId,
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((u) => u.userId !== typingUserId));
              typingTimeoutRef.current.delete(typingUserId);
            }, 5000)
          );
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== typingUserId));
          const existing = typingTimeoutRef.current.get(typingUserId);
          if (existing) {
            clearTimeout(existing);
            typingTimeoutRef.current.delete(typingUserId);
          }
        }
        break;
      }

      case "new_reply":
        onNewReply?.(message.payload);
        break;

      case "new_topic":
        onNewTopic?.(message.payload);
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      typingTimeoutRef.current.forEach((t) => clearTimeout(t));
      wsRef.current?.close();
    };
  }, [connect]);

  // Re-join topic when topicId changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && topicId) {
      wsRef.current.send(JSON.stringify({
        type: "join_topic",
        payload: { topicId },
      }));
    }
  }, [topicId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        payload: { isTyping },
      }));
    }
  }, []);

  const sendNewReply = useCallback((reply: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "new_reply",
        payload: reply,
      }));
    }
  }, []);

  const sendNewTopic = useCallback((topic: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "new_topic",
        payload: topic,
      }));
    }
  }, []);

  return {
    isConnected,
    onlineUsers,
    onlineCount,
    typingUsers,
    sendTyping,
    sendNewReply,
    sendNewTopic,
  };
}
