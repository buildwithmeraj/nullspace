"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { protectedApiRequest } from "@/lib/api";

export type NotificationType =
  | "alliance_request"
  | "alliance_accepted"
  | "comment"
  | "reaction"
  | "profile_incomplete";

export type NotificationItem = {
  _id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt?: string | Date;
  data?: Record<string, unknown>;
};

type ListResponse = {
  success?: boolean;
  data?: { notifications?: NotificationItem[]; unread?: number };
};

type NotificationsContextValue = {
  notifications: NotificationItem[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  pushLocal: (message: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider />");
  return ctx;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken, loading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const isReady = useMemo(() => !loading && Boolean(user) && Boolean(accessToken), [accessToken, loading, user]);

  const refresh = async () => {
    if (!isReady) return;
    const res = await protectedApiRequest<ListResponse>({
      url: "/notifications",
      method: "GET",
    }).catch(() => null);

    const next = res?.data?.notifications ?? [];
    const nextUnread = typeof res?.data?.unread === "number" ? res.data!.unread! : 0;
    setNotifications(next);
    setUnread(nextUnread);
  };

  const markRead = async (id: string) => {
    if (!isReady) return;
    if (!id.startsWith("local:")) {
      await protectedApiRequest({
        url: `/notifications/${encodeURIComponent(id)}/read`,
        method: "PATCH",
      }).catch(() => null);
    }
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    if (!isReady) return;
    await protectedApiRequest({
      url: "/notifications/read-all",
      method: "PATCH",
    }).catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const pushLocal = (message: string) => {
    const payload: NotificationItem = {
      _id: `local:${Date.now()}`,
      type: "profile_incomplete",
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [payload, ...prev].slice(0, 50));
    setUnread((u) => u + 1);
    toast(message);
  };

  useEffect(() => {
    if (!isReady) {
      disconnectSocket();
      setNotifications([]);
      setUnread(0);
      return;
    }

    void refresh();

    const socket = getSocket(accessToken ?? null);
    if (!socket) return;

    const onNotification = (payload: NotificationItem) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 50));
      setUnread((u) => u + 1);
      toast(payload.message);
    };

    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, isReady]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unread, markRead, markAllRead, refresh, pushLocal }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
