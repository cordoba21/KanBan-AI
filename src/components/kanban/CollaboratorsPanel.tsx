"use client";

import { useMemo, useState } from "react";
import { Mail, Shield, UserPlus, Trash2, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useBoardMembersQuery, useUpdateMemberRoleMutation, useRemoveMemberMutation, type BoardMemberView } from "@/hooks/useBoards";
import { useCreateInvitation } from "@/hooks/useInvitations";
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <Shield size={14} />
          {mode === "invite" ? "Invite collaborators" : "Collaborators"}
        </h3>
        <div className="flex items-center gap-3">
          {mode === "manage" && (
            <span className="text-[10px] text-white/30">{visibleMembers.length} activos</span>
          )}
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {mode === "invite" && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px] gap-2 w-full">
            <div className="relative min-w-0">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="glass-input glass-input-with-icon w-full"
                placeholder="email@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                disabled={!canManage}
              />
            </div>
            <div className="relative w-full">
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/40">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <select
                className="glass-input w-full appearance-none pr-9"
                value={role}
                onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={!canManage}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "#0A0A1A", color: "white" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <GlassButton
            size="sm"
            onClick={handleInvite}
            disabled={!email.trim() || !canManage}
            loading={createInvite.isPending}
          >
            <UserPlus size={14} />
            Invite
          </GlassButton>
        </div>
      )}

      {mode === "invite" && !canManage && (
        <p className="text-xs text-white/40 mb-4">
          Only the board owner can invite collaborators.
        </p>
      )}

      {mode === "invite" && inviteLink && (
        <div className="mb-4 text-[11px] text-white/40">
          Invite link generated (copied): <span className="text-white/70">{inviteLink}</span>
        </div>
      )}

      {mode === "manage" && (
        <>
          {isLoading ? (
            <div className="text-xs text-white/40">Loading collaborators...</div>
          ) : (
            <div className="space-y-2">
              {visibleMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 overflow-hidden"
                >
                  {/* Avatar */}
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400/20 to-teal-400/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-white/70">
                      {(member.profiles?.full_name || member.profiles?.email || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 truncate">
                      {member.profiles?.full_name || member.profiles?.email || "User"}
                      {member.user_id === user?.id && <span className="text-white/30"> (you)</span>}
                    </div>
                    <div className="text-[10px] text-white/30 truncate">{member.profiles?.email || ""}</div>
                  </div>

                  {/* Role badge + controls — always inside the row */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.role !== "OWNER" && canManage && (
                      <select
                        className="glass-input h-7 text-[10px] w-[80px] py-0 px-2"
                        style={{ minWidth: "auto" }}
                        value={member.role}
                        onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as "EDITOR" | "VIEWER" })}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ background: "#0A0A1A", color: "white" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {canManage && member.role !== "OWNER" && (
                      <button
                        onClick={() => removeMember.mutate({ memberId: member.id })}
                        className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Revoke"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {visibleMembers.length === 0 && (
                <div className="text-xs text-white/40">No active collaborators.</div>
              )}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
