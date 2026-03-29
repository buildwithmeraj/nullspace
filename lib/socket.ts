"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(accessToken: string | null) {
  if (!accessToken) return null;

  if (socket && socket.connected) return socket;
  if (socket) {
    socket.auth = { token: accessToken };
    socket.connect();
    return socket;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  // Socket.IO server lives on the backend origin (not the `/api/v1` base path).
  let origin = "http://localhost:5000";
  if (apiBase) {
    try {
      origin = new URL(apiBase).origin;
    } catch {
      origin = apiBase;
    }
  }

  socket = io(origin, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    auth: { token: accessToken },
  });

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
}
