"use client";

import { useMemo, useState } from "react";
import { Mail, Shield, UserPlus, Trash2, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useBoardMembersQuery, useUpdateMemberRoleMutation, useRemoveMemberMutation, type BoardMemberView } from "@/hooks/useBoards";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useUser } from "@/lib/auth/hooks";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Administrador",
  EDITOR: "Editor",
  VIEWER: "Lector",
};

const ROLE_OPTIONS: Array<{ value: "EDITOR" | "VIEWER"; label: string }> = [
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Lector" },
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
          {mode === "invite" ? "Invitar colaboradores" : "Colaboradores"}
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
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <div className="relative flex-1 min-w-0">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                className="glass-input glass-input-with-icon w-full"
                placeholder="correo@equipo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                disabled={!canManage}
              />
            </div>
            <div className="w-full sm:w-[120px] shrink-0">
              <select
                className="glass-input w-full"
                value={role}
                onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
                disabled={!canManage}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "#1a1a2e", color: "white" }}>
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
            Invitar
          </GlassButton>
        </div>
      )}

      {mode === "invite" && !canManage && (
        <p className="text-xs text-white/40 mb-4">
          Solo el propietario del tablero puede invitar colaboradores.
        </p>
      )}

      {mode === "invite" && inviteLink && (
        <div className="mb-4 text-[11px] text-white/40">
          Enlace generado (copiado): <span className="text-white/70">{inviteLink}</span>
        </div>
      )}

      {mode === "manage" && (
        <>
          {isLoading ? (
            <div className="text-xs text-white/40">Cargando colaboradores...</div>
          ) : (
            <div className="space-y-2">
              {visibleMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/70">
                      {(member.profiles?.full_name || member.profiles?.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-white/80">
                        {member.profiles?.full_name || member.profiles?.email || "Usuario"}
                        {member.user_id === user?.id && <span className="text-white/30"> (tu)</span>}
                      </div>
                      <div className="text-[10px] text-white/30">{member.profiles?.email || ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                      {ROLE_LABELS[member.role]}
                    </span>
                    {member.role !== "OWNER" && canManage && (
                      <select
                        className="glass-input h-8 text-xs"
                        value={member.role}
                        onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as "EDITOR" | "VIEWER" })}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ background: "#1a1a2e", color: "white" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {canManage && member.role !== "OWNER" && (
                      <button
                        onClick={() => removeMember.mutate({ memberId: member.id })}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        title="Revocar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {visibleMembers.length === 0 && (
                <div className="text-xs text-white/40">No hay colaboradores activos.</div>
              )}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
