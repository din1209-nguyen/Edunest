"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";

const SOCKET_ENDPOINT = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "";

function getSocketTarget() {
  if (typeof window === "undefined") {
    return { url: "", path: "/socket.io" };
  }

  if (!SOCKET_ENDPOINT || SOCKET_ENDPOINT === "/socket.io") {
    return { url: window.location.origin, path: "/socket.io" };
  }

  if (SOCKET_ENDPOINT.startsWith("/")) {
    return { url: window.location.origin, path: SOCKET_ENDPOINT };
  }

  const url = new URL(SOCKET_ENDPOINT);
  const path = url.pathname && url.pathname !== "/" ? url.pathname : "/socket.io";
  return { url: url.origin, path };
}

interface UseSocketOptions {
  enabled?: boolean;
}

export function useSocket({ enabled = true }: UseSocketOptions = {}) {
  const userId = useAuthStore((state) => state.user?._id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId || typeof window === "undefined") {
      socketRef.current?.disconnect();
      socketRef.current = null;
      queueMicrotask(() => {
        setSocket(null);
        setIsConnected(false);
      });
      return;
    }

    const socketTarget = getSocketTarget();
    const nextSocket = io(socketTarget.url, {
      path: socketTarget.path,
      transports: ["websocket", "polling"],
      auth: {},
      withCredentials: true,
    });

    const handleConnect = () => {
      setSocket(nextSocket);
      setIsConnected(true);
    };
    const handleDisconnect = () => setIsConnected(false);

    nextSocket.on("connect", handleConnect);
    nextSocket.on("disconnect", handleDisconnect);

    socketRef.current = nextSocket;

    return () => {
      nextSocket.off("connect", handleConnect);
      nextSocket.off("disconnect", handleDisconnect);
      nextSocket.disconnect();
      if (socketRef.current === nextSocket) {
        socketRef.current = null;
      }
      queueMicrotask(() => {
        setSocket((current) => (current === nextSocket ? null : current));
        setIsConnected(false);
      });
    };
  }, [enabled, isAuthenticated, userId]);

  return { socket, isConnected };
}
