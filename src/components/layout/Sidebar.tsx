"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Columns3,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRightIcon,
  LogOut,
  User,
  Archive,
  FileText,
  CheckSquare,
  Trash2,
  AlertTriangle,
  Plus,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useUser, useSignOut } from "@/lib/auth/hooks";
import { createClient } from "@/lib/supabase/client";
import { useUserBoardsQuery, useSwitchBoardMutation, useCreateBoardMutation, useUpdateBoardMutation, useDeleteBoardMutation } from "@/hooks/useBoards";

const navItems = [
  { href: "/kanban", label: "Kanban Board", icon: Columns3, hasDropdown: true },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
];

const archiveItems = [
  { href: "/archives/tasks", label: "Task Archive", icon: CheckSquare },
  { href: "/archives/reports", label: "Report Archive", icon: FileText },
];


export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [fullNameInput, setFullNameInput] = useState("");
  const [updateNameLoading, setUpdateNameLoading] = useState(false);
  const [updateNameError, setUpdateNameError] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [deleteBoardConfirm, setDeleteBoardConfirm] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { profile, refreshProfile } = useUser();
  const { signOut } = useSignOut();
  const { data: userBoards = [] } = useUserBoardsQuery();
  const switchBoard = useSwitchBoardMutation();
  const createBoard = useCreateBoardMutation();
  const updateBoard = useUpdateBoardMutation();
  const deleteBoard = useDeleteBoardMutation();

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "Delete my account") return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Error deleting account.");
      } else {
        router.push("/login");
      }
    } catch {
      setDeleteError("Connection error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleUpdateFullName() {
    if (!profile) return;
    const nextName = fullNameInput.trim();
    if (!nextName) return;
    setUpdateNameLoading(true);
    setUpdateNameError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: nextName })
        .eq("id", profile.id);

      if (error) throw error;
      await refreshProfile();
      setShowEditNameModal(false);
    } catch (error: any) {
      setUpdateNameError(error?.message || "Error updating name.");
    } finally {
      setUpdateNameLoading(false);
    }
  }

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
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
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
          {navItems.map(({ href, label, icon: Icon, hasDropdown }) => {
            const isActive = pathname === href;
            const isKanban = href === "/kanban";
            const currentBoard = userBoards?.find(b => b.id === profile?.active_board_id);

            if (isKanban && hasDropdown && userBoards) {
              return (
                <div key={href}>
                  <Link href={href} onClick={onNavigate}>
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
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-[#A78BFA] to-[#2DD4BF]"
                        layoutId="activeNav"
                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                      />
                    )}
                    <Icon size={20} className="flex-shrink-0" />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          className="text-sm font-medium whitespace-nowrap flex-1 text-left"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!collapsed && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowBoardSelector((prev) => !prev);
                        }}
                        className="text-white/30 hover:text-white"
                      >
                        {showBoardSelector ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    )}
                  </motion.div>
                </Link>

                {/* Board Dropdown Submenu */}
                <AnimatePresence>
                  {showBoardSelector && !collapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-3"
                    >
                      {userBoards.length > 0 ? (
                        userBoards.map((board) => {
                          const isCurrent = board.id === profile?.active_board_id;
                          return (
                            <div
                              key={board.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                                isCurrent
                                  ? "bg-[#8B5CF6]/20 text-[#A78BFA]"
                                  : "text-white/50 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <button
                                onClick={async () => {
                                  if (!isCurrent) {
                                    await switchBoard.mutateAsync({ boardId: board.id });
                                    await refreshProfile();
                                    window.location.reload();
                                  }
                                  setShowBoardSelector(false);
                                }}
                                className="flex-1 text-left truncate"
                              >
                                {board.name}
                              </button>
                              {board.role === "OWNER" && (
                                <span className="text-[9px] text-white/30">{board.role}</span>
                              )}
                              {board.role === "OWNER" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBoardId(board.id);
                                    setEditingBoardName(board.name);
                                  }}
                                  className="text-white/20 hover:text-white"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                              {board.role === "OWNER" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingBoardId(board.id);
                                    setDeleteBoardConfirm("");
                                  }}
                                  className="text-white/20 hover:text-red-400"
                                  title="Delete board"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-2 py-1.5 text-xs text-white/40">
                          Create your first board to get started.
                        </div>
                      )}

                      {/* Create new board option */}
                      {showCreateBoard ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <input
                            className="glass-input flex-1 text-xs py-1"
                            placeholder="Board name"
                            value={newBoardName}
                            onChange={(e) => setNewBoardName(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && newBoardName.trim()) {
                                const board = await createBoard.mutateAsync({ name: newBoardName.trim() });
                                await switchBoard.mutateAsync({ boardId: board.id });
                                setNewBoardName("");
                                setShowCreateBoard(false);
                              }
                              if (e.key === "Escape") {
                                setShowCreateBoard(false);
                                setNewBoardName("");
                              }
                            }}
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              if (newBoardName.trim()) {
                                const board = await createBoard.mutateAsync({ name: newBoardName.trim() });
                                await switchBoard.mutateAsync({ boardId: board.id });
                                setNewBoardName("");
                                setShowCreateBoard(false);
                              }
                            }}
                            disabled={!newBoardName.trim() || createBoard.isPending}
                            className="text-white/40 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateBoard(false);
                              setNewBoardName("");
                            }}
                            className="text-white/30 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                          <button
                            onClick={() => setShowCreateBoard(true)}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/30 hover:text-white/60 w-full"
                          >
                            <Plus size={12} />
                            Create board
                          </button>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Inline edit for board name */}
                {editingBoardId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 mt-1 px-2 py-1"
                  >
                    <input
                      className="glass-input text-xs py-1 w-full"
                      value={editingBoardName}
                      onChange={(e) => setEditingBoardName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && editingBoardName.trim()) {
                          await updateBoard.mutateAsync({ boardId: editingBoardId, name: editingBoardName.trim() });
                          setEditingBoardId(null);
                          setEditingBoardName("");
                        }
                        if (e.key === "Escape") {
                          setEditingBoardId(null);
                          setEditingBoardName("");
                        }
                      }}
                      onBlur={async () => {
                        if (editingBoardName.trim()) {
                          await updateBoard.mutateAsync({ boardId: editingBoardId, name: editingBoardName.trim() });
                        }
                        setEditingBoardId(null);
                        setEditingBoardName("");
                      }}
                      autoFocus
                    />
                  </motion.div>
                )}
              </div>
            );
          }

          return (
            <Link key={href} href={href} onClick={onNavigate}>
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-[#A78BFA] to-[#2DD4BF]"
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
                  Archives
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-[#A78BFA] to-[#2DD4BF]"
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
      <div className="p-3 border-t border-white/5 relative">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA]/30 to-[#2DD4BF]/30 flex items-center justify-center flex-shrink-0 border border-white/10">
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

        {/* Edit name */}
        <button
          onClick={() => {
            setFullNameInput(profile?.full_name || profile?.email || "");
            setUpdateNameError(null);
            setShowEditNameModal(true);
          }}
          className="flex items-center gap-3 px-3 py-2 w-full text-white/40 hover:text-white rounded-[var(--radius-organic-sm)] hover:bg-white/5 transition-all duration-200"
        >
          <Pencil size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Edit Name
              </motion.span>
            )}
          </AnimatePresence>
        </button>

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
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Delete account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-3 px-3 py-2 w-full text-white/20 hover:text-red-400 rounded-[var(--radius-organic-sm)] hover:bg-red-500/5 transition-all duration-200"
        >
          <Trash2 size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="text-xs font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Delete Account
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

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation("");
                setDeleteError(null);
              }}
            />
            <motion.div
              className="glass-strong relative w-full max-w-md z-10 p-6"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                  <p className="text-xs text-white/40">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-4">
                <p className="text-xs text-red-300/80 leading-relaxed">
                  This will permanently delete your account, all tasks, categories, archives, and activity history. This action is irreversible.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Type <span className="text-red-400 font-semibold">Delete my account</span> to confirm
                </label>
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder="Delete my account"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  autoFocus
                />
              </div>

              {deleteError && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation("");
                    setDeleteError(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== "Delete my account" || deleteLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Board Modal */}
      <AnimatePresence>
        {deletingBoardId && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setDeletingBoardId(null);
                setDeleteBoardConfirm("");
              }}
            />
            <motion.div
              className="glass-strong relative w-full max-w-md z-10 p-6"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Board</h3>
                  <p className="text-xs text-white/40">This action cannot be undone</p>
                </div>
              </div>

                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 mb-4">
                  <p className="text-xs text-red-300/80 leading-relaxed">
                    This will permanently delete the board and all its tasks. Type <span className="text-red-400 font-semibold">Delete board</span> to confirm.
                  </p>
                </div>

              <div className="mb-4">
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder="Delete board"
                  value={deleteBoardConfirm}
                  onChange={(e) => setDeleteBoardConfirm(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeletingBoardId(null);
                    setDeleteBoardConfirm("");
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteBoardConfirm !== "Delete board" || !deletingBoardId) return;
                    await deleteBoard.mutateAsync({ boardId: deletingBoardId });
                    const remaining = (userBoards || []).filter((b) => b.id !== deletingBoardId);
                    if (remaining.length > 0) {
                      await switchBoard.mutateAsync({ boardId: remaining[0].id });
                    } else if (profile?.id) {
                      const supabase = createClient();
                      await supabase
                        .from("profiles")
                        .update({ active_board_id: null })
                        .eq("id", profile.id);
                    }
                    await refreshProfile();
                    window.location.reload();
                    setDeletingBoardId(null);
                    setDeleteBoardConfirm("");
                  }}
                  disabled={deleteBoardConfirm !== "Delete board" || deleteBoard.isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {deleteBoard.isPending ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Delete Board
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {showEditNameModal && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                if (updateNameLoading) return;
                setShowEditNameModal(false);
                setUpdateNameError(null);
              }}
            />
            <motion.div
              className="glass-strong relative w-full max-w-md z-10 p-6"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <User size={18} className="text-white/70" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Edit name</h3>
                  <p className="text-xs text-white/40">Update your full name</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder="Your full name"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  autoFocus
                />
              </div>

              {updateNameError && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                  {updateNameError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (updateNameLoading) return;
                    setShowEditNameModal(false);
                    setUpdateNameError(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFullName}
                  disabled={!fullNameInput.trim() || updateNameLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#8B5CF6]/80 hover:bg-[#8B5CF6] disabled:opacity-30 disabled:cursor-not-allowed rounded-[var(--radius-organic-sm)] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {updateNameLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Save size={14} />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
