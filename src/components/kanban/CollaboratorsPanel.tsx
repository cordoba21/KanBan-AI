"use client";

import { useMemo, useState } from "react";
import { Mail, Shield, UserPlus, Trash2, X } from "lucide-react";
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

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const visibleMembers = useMemo(() => {
    return (members || []).filter((member: BoardMemberView) => member.status === "active");
  }, [members]);

  async function handleInvite() {
    if (!email.trim()) return;
    const result = await createInvite.mutateAsync({ email: email.trim(), role, boardId });
    setEmail("");
    setInviteLink(result.inviteUrl);
    try {
      await navigator.clipboard.writeText(result.inviteUrl);
    } catch {
      // noop
    }
  }

  return (
    <GlassCard padding="md" hover={false} className="glass-strong">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#00FF41]/10">
        <h3 className="text-xs font-semibold text-[#00FF41] flex items-center gap-2 uppercase tracking-wider">
          <Shield size={12} />
          {mode === "invite" ? "$ invite --user" : "$ users --list"}
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
        <div className="flex flex-col gap-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_100px] gap-2 w-full">
            <div className="relative min-w-0">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00FF41]/30" />
              <input
                className="glass-input glass-input-with-icon w-full"
                placeholder="email@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                disabled={!canManage}
              />
            </div>
            <select
              className="glass-input w-full appearance-none text-center"
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
          </div>
          <GlassButton
            size="sm"
            onClick={handleInvite}
            disabled={!email.trim() || !canManage}
            loading={createInvite.isPending}
          >
            <UserPlus size={14} />
            send invite
          </GlassButton>
        </div>
      )}

      {mode === "invite" && !canManage && (
        <p className="text-[10px] text-[#FFB800]/60 mb-4 font-mono">
          [ERR] Permission denied. Only root can invite.
        </p>
      )}

      {mode === "invite" && inviteLink && (
        <div className="mb-4 text-[10px] text-[#00FF41]/50 font-mono break-all">
          <span className="text-[#00FF41]/80">LINK:</span> {inviteLink}
        </div>
      )}

      {mode === "manage" && (
        <>
          {isLoading ? (
            <div className="text-xs text-[#00FF41]/40 font-mono">loading processes...</div>
          ) : (
            <div className="space-y-1">
              {visibleMembers.map((member) => {
                const isOwner = member.role === "OWNER";
                const isYou = member.user_id === user?.id;
                const name = member.profiles?.full_name || member.profiles?.email || "unknown";
                const emailStr = member.profiles?.email || "";

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
                            onClick={() => removeMember.mutate({ memberId: member.id })}
                            className="text-[#c8c8c8]/20 hover:text-[#FF3B3B] transition-colors p-1"
                            title="kill -9"
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
  );
}
