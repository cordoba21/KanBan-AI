"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useAcceptInvitation } from "@/hooks/useInvitations";

export default function InvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const acceptInvite = useAcceptInvitation();

  const status = acceptInvite.isSuccess
    ? "Invitacion aceptada"
    : acceptInvite.isError
      ? "No se pudo aceptar la invitacion"
      : "Confirmar invitacion";

  async function handleAccept() {
    try {
      await acceptInvite.mutateAsync(token);
      setTimeout(() => {
        router.push("/kanban");
        router.refresh();
      }, 1000);
    } catch {
      // error shown in UI
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <GlassCard padding="lg" hover={false}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-xl font-semibold text-white">{status}</h1>
          <p className="text-sm text-white/60">
            Usa este boton para unirte al tablero compartido.
          </p>
          <GlassButton
            onClick={handleAccept}
            loading={acceptInvite.isPending}
            disabled={!token}
          >
            Aceptar invitacion
          </GlassButton>
          {acceptInvite.isError && (
            <p className="text-xs text-red-300">
              {(acceptInvite.error as Error)?.message || "Error"}
            </p>
          )}
        </motion.div>
      </GlassCard>
    </div>
  );
}
