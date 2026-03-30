"use client";

import Link from "next/link";
import React from "react";
import { useNotifications } from "@/contexts/NotificationsContext";
import type {
  NotificationItem,
  NotificationType,
} from "@/contexts/NotificationsContext";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";

export default function NotificationsBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();

  const getHref = (n: NotificationItem) => {
    const fromUsername = String(n.data?.fromUsername ?? "").trim();
    const postId = String(n.data?.postId ?? "").trim();
    const postOwnerUsername = String(n.data?.postOwnerUsername ?? "").trim();

    if (postId && postOwnerUsername) {
      return `/d/${encodeURIComponent(postOwnerUsername)}/post/${encodeURIComponent(postId)}`;
    }
    if (postId && fromUsername) {
      return `/d/${encodeURIComponent(fromUsername)}/post/${encodeURIComponent(postId)}`;
    }
    if (fromUsername) return `/d/${encodeURIComponent(fromUsername)}`;
    return null;
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "alliance_request":
        return <UserPlus className="text-primary" />;
      case "alliance_accepted":
        return <CheckCircle2 className="text-success" />;
      case "comment":
        return <MessageCircle className="text-secondary" />;
      case "reaction":
        return <Heart className="text-error" />;
      case "profile_incomplete":
      default:
        return <AlertCircle className="text-warning" />;
    }
  };

  const formatTime = (n: NotificationItem) => {
    const raw = n.createdAt;
    if (!raw) return "";
    const d = raw instanceof Date ? raw : new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-ghost btn-circle"
        aria-label="Notifications"
      >
        <div className="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread ? (
            <span className="badge badge-xs badge-primary indicator-item">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </div>
      </button>

      <div className="dropdown-content z-[1] mt-3 w-96 max-w-[90vw] border border-base-200 bg-base-100 shadow">
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-base-200">
          <div className="font-semibold">Notifications</div>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => void markAllRead()}
            disabled={!unread}
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-96 overflow-auto">
          {!notifications.length ? (
            <div className="px-4 py-6 text-sm opacity-70">
              No notifications yet.
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {notifications.slice(0, 20).map((n) => {
                const href = getHref(n);
                const ts = formatTime(n);
                const icon = getIcon(n.type);
                const unreadDot = !n.read;
                const itemClass =
                  "w-full text-left px-4 py-3 transition-colors rounded-none flex items-center";
                return (
                  <div key={n._id} className={n.read ? "opacity-70" : ""}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={() => void markRead(n._id)}
                        className={itemClass}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm leading-snug break-words">
                                {n.message}
                              </div>
                              {unreadDot ? (
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                              ) : null}
                            </div>
                            {ts ? (
                              <div className="text-xs opacity-60 mt-1">
                                {ts}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void markRead(n._id)}
                        className={itemClass}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{icon}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm leading-snug break-words">
                                {n.message}
                              </div>
                              {unreadDot ? (
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                              ) : null}
                            </div>
                            {ts ? (
                              <div className="text-xs opacity-60 mt-1">
                                {ts}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-base-200 text-xs opacity-40 text-center">
          Showing latest {Math.min(20, notifications.length)} notifications
        </div>
      </div>
    </div>
  );
}
