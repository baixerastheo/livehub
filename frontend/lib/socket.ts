import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (url?: string): Socket => {
  if (!socket) {
    socket = io(url || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

