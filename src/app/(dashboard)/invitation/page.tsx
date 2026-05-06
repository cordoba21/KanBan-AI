"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Link2, CheckCircle, AlertTriangle, UserPlus } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import { useAcceptInvitation } from "@/hooks/useInvitations";

export default function InvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const acceptInvite = useAcceptInvitation();

  const isSuccess = acceptInvite.isSuccess;
  const isError = acceptInvite.isError;
  const isAlreadyMember = acceptInvite.data?.status === "already_member";

  async function handleAccept() {
    try {
      await acceptInvite.mutateAsync(token);
      setTimeout(() => {
        router.push("/kanban");
        router.refresh();
      }, 1500);
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
          className="space-y-5 text-center max-w-sm"
        >
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={`w-14 h-14 rounded flex items-center justify-center ${
                isSuccess
                  ? "bg-[#00FF41]/10 border border-[#00FF41]/20"
                  : isError
                    ? "bg-[#FF3B3B]/10 border border-[#FF3B3B]/20"
                    : "bg-[#00D4FF]/10 border border-[#00D4FF]/20"
              }`}
            >
              {isSuccess ? (
                <CheckCircle size={24} className="text-[#00FF41]" />
              ) : isError ? (
                <AlertTriangle size={24} className="text-[#FF3B3B]" />
              ) : (
                <UserPlus size={24} className="text-[#00D4FF]" />
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-semibold text-white mb-1">
              {isSuccess
                ? isAlreadyMember
                  ? "Already a member"
                  : "You're in!"
                : isError
                  ? "Could not accept invitation"
                  : "Board Invitation"}
            </h1>
            <p className="text-sm text-white/50">
              {isSuccess
                ? isAlreadyMember
                  ? "You are already a member of this board. Redirecting..."
                  : "Invitation accepted successfully. Redirecting to your board..."
                : isError
                  ? (acceptInvite.error as Error)?.message || "Something went wrong"
                  : "Click the button below to join the shared board."}
            </p>
          </div>

          {/* Action */}
          {!isSuccess && (
            <GlassButton
              onClick={handleAccept}
              loading={acceptInvite.isPending}
              disabled={!token || isError}
            >
              <Link2 size={14} />
              Accept Invitation
            </GlassButton>
          )}

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[#00FF41]/50 font-mono"
            >
              Redirecting to kanban board...
            </motion.div>
          )}

          {!token && !isSuccess && !isError && (
            <p className="text-[10px] text-[#FFB800]/60 font-mono">
              [ERR] No invitation token found in URL.
            </p>
          )}
        </motion.div>
      </GlassCard>
    </div>
  );
}
