"use client";

import { useMemo, useState } from "react";
import { Link2, Shield, Copy, Check, Trash2, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useBoardMembersQuery, useUpdateMemberRoleMutation, useRemoveMemberMutation, type BoardMemberView } from "@/hooks/useBoards";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useUser } from "@/lib/auth/hooks";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "root",
  EDITOR: "editor",
  VIEWER: "viewer",
};

const ROLE_OPTIONS: Array<{ value: "EDITOR" | "VIEWER"; label: string }> = [
  { value: "EDITOR", label: "editor" },
  { value: "VIEWER", label: "viewer" },
];

export default function CollaboratorsPanel({
  boardId,
  canManage,
  mode,
  onClose,
}: {
  boardId: string | null;
  canManage: boolean;
  mode: "invite" | "manage";
  onClose: () => void;
}) {
  const { user } = useUser();
  const { data: members, isLoading } = useBoardMembersQuery(boardId);
  const createInvite = useCreateInvitation();
  const updateRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();

  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Confirmation state for removing a member
  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);

  const visibleMembers = useMemo(() => {
    return (members || []).filter((member: BoardMemberView) => member.status === "active");
  }, [members]);

  async function handleGenerateLink() {
    const result = await createInvite.mutateAsync({ role, boardId });
    setInviteLink(result.inviteUrl);
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // noop
    }
  }

  async function handleCopyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // noop
    }
  }

  return (
    <>
      <GlassCard padding="md" hover={false} className="glass-strong">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#00FF41]/10">
          <h3 className="text-xs font-semibold text-[#00FF41] flex items-center gap-2 uppercase tracking-wider">
            <Shield size={12} />
            {mode === "invite" ? "$ invite --link" : "$ users --list"}
          </h3>
          <div className="flex items-center gap-3">
            {mode === "manage" && (
              <span className="text-[10px] text-[#00FF41]/40 font-mono">[{visibleMembers.length} active]</span>
            )}
            <button
              onClick={onClose}
              className="text-[#00FF41]/30 hover:text-[#FF3B3B] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {mode === "invite" && (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2">
              <select
                className="glass-input flex-1 appearance-none text-center"
                value={role}
                onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={!canManage}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <GlassButton
                size="sm"
                onClick={handleGenerateLink}
                disabled={!canManage}
                loading={createInvite.isPending}
              >
                <Link2 size={14} />
                Generate Link
              </GlassButton>
            </div>

            {inviteLink && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#00FF41]/[0.03] border border-[#00FF41]/15 p-3"
                style={{ borderRadius: "var(--radius-organic-sm)" }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] text-[#00FF41]/60 font-mono uppercase tracking-wider">
                    Invite Link
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-[10px] text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={10} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#00FF41]/40 font-mono break-all leading-relaxed select-all">
                  {inviteLink}
                </p>
                <p className="text-[9px] text-[#c8c8c8]/20 mt-2 font-mono">
                  Anyone with this link can join as {role.toLowerCase()}. Expires in 7 days.
                </p>
              </motion.div>
            )}
          </div>
        )}

        {mode === "invite" && !canManage && (
          <p className="text-[10px] text-[#FFB800]/60 mb-4 font-mono">
            [ERR] Permission denied. Only root can invite.
          </p>
        )}

        {mode === "manage" && (
          <>
            {isLoading ? (
              <div className="text-xs text-[#00FF41]/40 font-mono">loading processes...</div>
            ) : (
              <div className="space-y-1">
                {visibleMembers.map((member) => {
                  const isOwner = member.role === "OWNER";
                  const name = member.profiles?.full_name || member.profiles?.email || "unknown";
                  const emailStr = member.profiles?.email || "";
                  const isYou = member.user_id === user?.id;

                  return (
                    <div
                      key={member.id}
                      className="border border-[#00FF41]/10 bg-[#00FF41]/[0.02] p-3"
                      style={{ borderRadius: "var(--radius-organic-sm)" }}
                    >
                      {/* Row 1: Name + Role on same line */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[#00FF41]/30 text-xs flex-shrink-0">›</span>
                          <span className="text-xs text-[#c8c8c8] truncate">
                            {name}
                            {isYou && <span className="text-[#00FF41]/40"> (you)</span>}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 px-2 py-0.5 ${
                            isOwner
                              ? "text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/20"
                              : "text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/20"
                          }`}
                          style={{ borderRadius: "2px" }}
                        >
                          {ROLE_LABELS[member.role]}
                        </span>
                      </div>

                      {/* Row 2: Email + Controls */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[#c8c8c8]/30 truncate flex-1 pl-4">{emailStr}</span>

                        {!isOwner && canManage && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <select
                              className="bg-transparent border border-[#00FF41]/10 text-[10px] text-[#00FF41]/70 h-6 px-1.5 rounded-sm appearance-none cursor-pointer hover:border-[#00FF41]/30 transition-colors"
                              value={member.role}
                              onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as "EDITOR" | "VIEWER" })}
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setPendingRemove({ id: member.id, name })}
                              className="text-[#FF3B3B] hover:text-[#FF3B3B] hover:bg-[#FF3B3B]/10 transition-colors p-1 rounded-sm"
                              title="Remove collaborator"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {visibleMembers.length === 0 && (
                  <div className="text-[10px] text-[#00FF41]/30 font-mono">no active processes.</div>
                )}
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Remove Collaborator Confirmation Modal */}
      <AnimatePresence>
        {pendingRemove && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70"
              onClick={() => setPendingRemove(null)}
            />
            <motion.div
              className="glass-strong relative w-full max-w-sm z-10 p-5"
              style={{ borderRadius: "var(--radius-organic-lg)" }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-[#FF3B3B]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#c8c8c8]">Remove Collaborator</h3>
                  <p className="text-[10px] text-[#c8c8c8]/40">This action cannot be undone</p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-[#FF3B3B]/5 border border-[#FF3B3B]/15 rounded p-3 mb-4">
                <p className="text-[11px] text-[#FF3B3B]/80 leading-relaxed font-mono">
                  <span className="text-[#FF3B3B]/50">[WARN]</span> Remove{" "}
                  <span className="text-[#FF3B3B] font-semibold">{pendingRemove.name}</span>{" "}
                  from this board? They will lose all access.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingRemove(null)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-[#c8c8c8]/60 hover:text-[#c8c8c8] bg-white/5 hover:bg-white/10 rounded-[var(--radius-organic-sm)] transition-all duration-150 cursor-pointer uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeMember.mutate({ memberId: pendingRemove.id });
                    setPendingRemove(null);
                  }}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-[#FF3B3B] bg-[#FF3B3B]/10 hover:bg-[#FF3B3B]/20 rounded-[var(--radius-organic-sm)] transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider border border-[#FF3B3B]/20 hover:border-[#FF3B3B]/40"
                >
                  <Trash2 size={12} />
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
