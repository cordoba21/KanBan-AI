"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Columns3,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Archive,
  FileText,
  CheckSquare,
} from "lucide-react";
import { useUser, useSignOut } from "@/lib/auth/hooks";

const navItems = [
  { href: "/kanban", label: "Kanban Board", icon: Columns3 },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

const archiveItems = [
  { href: "/archives/tasks", label: "Archivo de Tareas", icon: CheckSquare },
  { href: "/archives/reports", label: "Archivo de Reportes", icon: FileText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile } = useUser();
  const { signOut } = useSignOut();

  const roleBadge = {
    ADMIN: "badge-red",
    MANAGER: "badge-purple",
    USER: "badge-sky",
  };

  const allItems = [...navItems, ...archiveItems];

  return (
    <motion.aside
      className="glass-strong flex flex-col h-screen sticky top-0 z-40"
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        borderRadius: 0,
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-300 to-purple-400 flex items-center justify-center flex-shrink-0">
          <LayoutDashboard size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              className="font-bold text-lg gradient-text whitespace-nowrap"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              KanBan AI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-organic-sm)]
                  transition-colors duration-200 group relative
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }
                `}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-sky-300 to-purple-400"
                    layoutId="activeNav"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="text-sm font-medium whitespace-nowrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}

        {/* Archive Section Divider */}
        <div className="pt-4 pb-2">
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                className="flex items-center gap-2 px-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Archive size={12} className="text-white/20" />
                <span className="text-[10px] uppercase tracking-widest text-white/20 font-semibold">
                  Archivos
                </span>
                <div className="flex-1 h-px bg-white/5" />
              </motion.div>
            ) : (
              <div className="mx-auto w-6 h-px bg-white/10" />
            )}
          </AnimatePresence>
        </div>

        {archiveItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}>
              <motion.div
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-organic-sm)]
                  transition-colors duration-200 group relative
                  ${isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }
                `}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-sky-300 to-purple-400"
                    layoutId="activeNav"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="text-sm font-medium whitespace-nowrap"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-300/30 to-purple-400/30 flex items-center justify-center flex-shrink-0 border border-white/10">
            <User size={14} className="text-white/70" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-xs font-medium text-white/80 truncate">
                  {profile?.full_name || profile?.email || "User"}
                </p>
                {profile?.role && (
                  <span
                    className={`badge ${roleBadge[profile.role]} mt-0.5`}
                    style={{ fontSize: "9px", padding: "1px 6px" }}
                  >
                    {profile.role}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 w-full text-white/40 hover:text-red-400 rounded-[var(--radius-organic-sm)] hover:bg-red-500/5 transition-all duration-200 mt-1"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full glass flex items-center justify-center text-white/50 hover:text-white transition-colors z-50"
        style={{ border: "1px solid rgba(255,255,255,0.15)" }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
