"use client";

import { io, type Socket } from "socket.io-client";

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_BACKEND_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4001";

let socket: Socket | null = null;

/**
 * Returns a singleton Socket.IO client connected to the backend.
 * Uses the same origin as the REST API by default (NEXT_PUBLIC_API_URL),
 * or NEXT_PUBLIC_BACKEND_WS_URL if set.
 * Sends cookies (withCredentials) for auth.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(BACKEND_WS_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket = null;
      }
      if (process.env.NODE_ENV === "development") {
        console.debug("[Socket.IO] disconnected:", reason);
      }
    });
    if (process.env.NODE_ENV === "development") {
      socket.on("connect", () => {
        console.debug("[Socket.IO] connected");
      });
    }
  }
  return socket;
}

/**
 * Disconnects the singleton socket and resets it so a new connection
 * will be created on the next getSocket() call (e.g. after login).
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
