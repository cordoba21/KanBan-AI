"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Link2, Copy, Check, Trash2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useBoardMembersQuery, useUpdateMemberRoleMutation, useRemoveMemberMutation, type BoardMemberView } from "@/hooks/useBoards";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useRealtimeBoardMembers } from "@/hooks/useNotifications";
import { useUser } from "@/lib/auth/hooks";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const ROLE_OPTIONS: Array<{ value: "EDITOR" | "VIEWER"; label: string }> = [
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

export default function CollaborationPage() {
  const { user, profile } = useUser();
  const boardId = profile?.active_board_id || null;
  const { data: members, isLoading } = useBoardMembersQuery(boardId);
  const createInvite = useCreateInvitation();
  const updateRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();

  // Real-time board members subscription
  useRealtimeBoardMembers(boardId);

  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentMember = useMemo(() => {
    return (members || []).find((m: BoardMemberView) => m.user_id === user?.id);
  }, [members, user?.id]);

  const isOwner = currentMember?.role === "OWNER";
  const canManage = isOwner;

  const visibleMembers = useMemo(() => {
    return (members || []).filter((member: BoardMemberView) => member.status === "active");
  }, [members]);

  async function handleGenerateLink() {
    try {
      const result = await createInvite.mutateAsync({ role });
      setInviteLink(result.inviteUrl);
      await navigator.clipboard.writeText(result.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // error shown in UI
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield size={24} className="text-purple-400" />
          Collaboration
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Share invite links and manage team access
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="md" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Link2 size={14} className="text-[#00D4FF]" />
              Generate Invite Link
            </h3>
          </div>

          {isOwner && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  className="glass-input flex-1"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <GlassButton
                  onClick={handleGenerateLink}
                  loading={createInvite.isPending}
                >
                  <Link2 size={14} />
                  Generate
                </GlassButton>
              </div>

              {inviteLink && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#00FF41]/[0.03] border border-[#00FF41]/15 rounded-lg p-3"
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
                  <p className="text-[10px] text-white/50 font-mono break-all leading-relaxed select-all">
                    {inviteLink}
                  </p>
                  <p className="text-[9px] text-white/20 mt-2 font-mono">
                    Anyone with this link can join as {role.toLowerCase()}. Expires in 7 days.
                  </p>
                </motion.div>
              )}

              {createInvite.isError && (
                <p className="text-xs text-red-300">
                  {(createInvite.error as Error)?.message || "Error generating link"}
                </p>
              )}
            </div>
          )}

          {!isOwner && (
            <p className="text-xs text-white/40">
              Only the board owner can generate invite links.
            </p>
          )}
        </GlassCard>

        <GlassCard padding="md" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/80">Team Members</h3>
            <span className="text-[10px] text-white/30">{visibleMembers.length} active</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                className="text-[#00FF41] font-mono animate-terminal-blink"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {visibleMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-[#00FF41]/10 border border-[#00FF41]/15 flex items-center justify-center text-xs text-[#c8c8c8]/70">
                      {(member.profiles?.full_name || member.profiles?.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-white/80">
                        {member.profiles?.full_name || member.profiles?.email || "Unknown User"}
                        {member.user_id === user?.id && <span className="text-white/30 ml-1">(you)</span>}
                      </div>
                      <div className="text-[10px] text-white/30">{member.profiles?.email || ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "OWNER" ? (
                      <span className="text-[10px] text-[#FFB800] bg-[#FFB800]/10 px-2 py-1 rounded">
                        {ROLE_LABELS[member.role]}
                      </span>
                    ) : isOwner ? (
                      <select
                        className="glass-input h-8 text-xs"
                        value={member.role}
                        onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as "EDITOR" | "VIEWER" })}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-white/40 bg-white/5 px-2 py-1 rounded-full">
                        {ROLE_LABELS[member.role]}
                      </span>
                    )}

                    {isOwner && member.role !== "OWNER" && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeMember.mutate({ memberId: member.id })}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}

              {visibleMembers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-white/30">No team members yet.</p>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
