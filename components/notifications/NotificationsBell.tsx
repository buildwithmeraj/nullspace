"use client";

import Link from "next/link";
import React from "react";
import { useNotifications } from "@/contexts/NotificationsContext";

export default function NotificationsBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();

  const getHref = (n: (typeof notifications)[number]) => {
    const fromUsername = String(n.data?.fromUsername ?? "").trim();
    if (fromUsername) return `/d/${encodeURIComponent(fromUsername)}`;
    const postId = String(n.data?.postId ?? "").trim();
    if (postId) return "/";
    return null;
  };

  return (
    <div className="dropdown dropdown-end">
      <button type="button" className="btn btn-ghost btn-circle" aria-label="Notifications">
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

      <div className="dropdown-content z-[1] mt-3 w-80 rounded-box border border-base-200 bg-base-100 shadow">
        <div className="p-3 flex items-center justify-between gap-2">
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
            <div className="p-3 text-sm opacity-70">No notifications yet.</div>
          ) : (
            <ul className="menu menu-sm">
              {notifications.slice(0, 20).map((n) => {
                const href = getHref(n);
                return (
                  <li key={n._id}>
                    <div className={`flex items-start justify-between gap-2 ${n.read ? "opacity-70" : ""}`}>
                      {href ? (
                        <Link
                          className="text-sm flex-1"
                          href={href}
                          onClick={() => void markRead(n._id)}
                        >
                          {n.message}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="text-left text-sm flex-1"
                          onClick={() => void markRead(n._id)}
                        >
                          {n.message}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
