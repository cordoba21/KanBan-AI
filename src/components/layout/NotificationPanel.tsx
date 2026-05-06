"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  UserPlus,
  UserCheck,
  UserMinus,
  ClipboardList,
  ArrowRightLeft,
  Link2,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearNotifications,
} from "@/hooks/useNotifications";

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  member_joined: UserCheck,
  member_left: UserMinus,
  task_created: ClipboardList,
  task_moved: ArrowRightLeft,
  task_completed: Check,
  invite_created: Link2,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  member_joined: "#00FF41",
  member_left: "#FF3B3B",
  task_created: "#00D4FF",
  task_moved: "#FFB800",
  task_completed: "#00FF41",
  invite_created: "#00D4FF",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const clearAll = useClearNotifications();

  return (
    <>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-9 h-9 rounded bg-[#00FF41]/10 border border-[#00FF41]/15 text-white/60 hover:text-[#00FF41] hover:border-[#00FF41]/30 transition-all duration-200"
        title="Notifications"
        id="notification-bell"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF3B3B] text-white text-[9px] font-bold flex items-center justify-center px-1 border border-black/50"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[180]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="absolute right-4 top-16 lg:right-8 lg:top-6 w-[380px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col glass-strong z-10"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#00FF41]/10">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-[#00FF41]" />
                  <h3 className="text-xs font-semibold text-[#00FF41] uppercase tracking-wider">
                    $ notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FF3B3B]/15 text-[#FF3B3B] border border-[#FF3B3B]/20 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      className="text-[#00FF41]/40 hover:text-[#00FF41] transition-colors p-1 rounded"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => clearAll.mutate()}
                      className="text-[#FF3B3B]/30 hover:text-[#FF3B3B] transition-colors p-1 rounded"
                      title="Clear all notifications"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-[#00FF41]/30 hover:text-[#FF3B3B] transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="w-12 h-12 rounded bg-[#00FF41]/5 border border-[#00FF41]/10 flex items-center justify-center mb-3">
                      <Bell size={20} className="text-[#00FF41]/20" />
                    </div>
                    <p className="text-[11px] text-[#00FF41]/30 font-mono text-center">
                      No notifications yet.
                    </p>
                    <p className="text-[10px] text-[#00FF41]/15 font-mono text-center mt-1">
                      Events will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.map((notification, index) => {
                      const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                      const color = NOTIFICATION_COLORS[notification.type] || "#00FF41";

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => {
                            if (!notification.read) {
                              markRead.mutate(notification.id);
                            }
                          }}
                          className={`
                            flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150
                            hover:bg-[#00FF41]/[0.03] border-b border-[#00FF41]/[0.05] last:border-b-0
                            ${!notification.read ? "bg-[#00FF41]/[0.02]" : ""}
                          `}
                        >
                          {/* Icon */}
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: `${color}10`,
                              border: `1px solid ${color}25`,
                            }}
                          >
                            <Icon size={13} style={{ color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[11px] leading-snug ${!notification.read ? "text-[#c8c8c8]" : "text-[#c8c8c8]/50"}`}>
                                <span className={`font-semibold ${!notification.read ? "text-white" : "text-[#c8c8c8]/60"}`}>
                                  {notification.title}
                                </span>
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
                              )}
                            </div>
                            {notification.body && (
                              <p className="text-[10px] text-[#c8c8c8]/30 mt-0.5 leading-snug truncate">
                                {notification.body}
                              </p>
                            )}
                            <p className="text-[9px] text-[#00FF41]/25 mt-1 font-mono">
                              {timeAgo(notification.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
