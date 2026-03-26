import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

export type WSChannel = "leaderboard" | "monsters";

interface AuthenticatedClient {
  ws: WebSocket;
  userId: string | null;
  subscriptions: Set<WSChannel>;
}

const clients = new Map<WebSocket, AuthenticatedClient>();
let wss: WebSocketServer | null = null;
let leaderboardInterval: NodeJS.Timeout | null = null;

export function setupWebSocket(server: HTTPServer): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    const client: AuthenticatedClient = {
      ws,
      userId: null,
      subscriptions: new Set(),
    };
    clients.set(ws, client);

    console.log(`[WS] Client connected. Total: ${clients.size}`);

    // Send welcome message
    sendToClient(ws, "connected", {
      message: "Connected to GymRPG WebSocket server",
      timestamp: new Date().toISOString(),
    });

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as {
          type: string;
          channel?: WSChannel;
          userId?: string;
          token?: string;
        };

        handleClientMessage(ws, client, message);
      } catch {
        sendToClient(ws, "error", { message: "Invalid JSON message" });
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected. Total: ${clients.size}`);
    });

    ws.on("error", (err: Error) => {
      console.error("[WS] Client error:", err.message);
      clients.delete(ws);
    });
  });

  // Broadcast leaderboard updates every 60 seconds
  leaderboardInterval = setInterval(() => {
    broadcastToChannel("leaderboard", {
      type: "leaderboard_tick",
      timestamp: new Date().toISOString(),
    });
  }, 60_000);

  wss.on("close", () => {
    if (leaderboardInterval) clearInterval(leaderboardInterval);
  });

  console.log("[WS] WebSocket server initialized on path /ws");
  return wss;
}

function handleClientMessage(
  ws: WebSocket,
  client: AuthenticatedClient,
  message: {
    type: string;
    channel?: WSChannel;
    userId?: string;
    token?: string;
  }
): void {
  switch (message.type) {
    case "subscribe": {
      const channel = message.channel;
      if (!channel || !isValidChannel(channel)) {
        sendToClient(ws, "error", {
          message: `Invalid channel: ${String(channel)}`,
        });
        return;
      }
      client.subscriptions.add(channel);
      sendToClient(ws, "subscribed", {
        channel,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    case "unsubscribe": {
      const channel = message.channel;
      if (channel && isValidChannel(channel)) {
        client.subscriptions.delete(channel);
        sendToClient(ws, "unsubscribed", { channel });
      }
      break;
    }

    case "identify": {
      // Client sends userId after login (no server-side JWT verification here for perf)
      if (message.userId) {
        client.userId = message.userId;
        sendToClient(ws, "identified", {
          userId: message.userId,
          timestamp: new Date().toISOString(),
        });
      }
      break;
    }

    case "ping": {
      sendToClient(ws, "pong", { timestamp: new Date().toISOString() });
      break;
    }

    default: {
      sendToClient(ws, "error", {
        message: `Unknown message type: ${message.type}`,
      });
    }
  }
}

function isValidChannel(channel: string): channel is WSChannel {
  return channel === "leaderboard" || channel === "monsters";
}

function sendToClient(ws: WebSocket, event: string, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
    } catch (err) {
      console.error("[WS] Failed to send to client:", err);
    }
  }
}

function broadcastToChannel(channel: WSChannel, data: unknown): void {
  for (const [ws, client] of clients.entries()) {
    if (client.subscriptions.has(channel) && ws.readyState === WebSocket.OPEN) {
      sendToClient(ws, `${channel}_update`, data);
    }
  }
}

export function broadcastLeaderboardUpdate(data: unknown): void {
  broadcastToChannel("leaderboard", data);
}

export function broadcastToUser(
  userId: string,
  event: string,
  data: unknown
): void {
  for (const [ws, client] of clients.entries()) {
    if (client.userId === userId && ws.readyState === WebSocket.OPEN) {
      sendToClient(ws, event, data);
    }
  }
}

export function broadcastMonstersUpdate(data: unknown): void {
  broadcastToChannel("monsters", data);
}

export function getConnectedClientCount(): number {
  return clients.size;
}

export default setupWebSocket;
