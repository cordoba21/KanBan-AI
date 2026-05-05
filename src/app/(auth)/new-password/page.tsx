"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MeshBackground from "@/components/layout/MeshBackground";
import GlassButton from "@/components/ui/GlassButton";

export default function NewPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        // Sign out so the user logs in fresh with the new password
        await supabase.auth.signOut();
      }
    } catch {
      setError("Error updating password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <MeshBackground />

      <motion.div
        className="w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          >
            {success ? (
              <CheckCircle2 size={28} className="text-white" />
            ) : (
              <KeyRound size={28} className="text-white" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {success ? "All Done!" : "New Password"}
          </h1>
          <p className="text-white/40 text-sm">
            {success
              ? "Your password has been updated successfully"
              : "Set your new password"}
          </p>
        </div>

        {/* Form Card */}
        <div
          className="glass-strong p-8"
          style={{ borderRadius: "var(--radius-organic-lg)" }}
        >
          {!success ? (
            <form onSubmit={handleSetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                  />
                  <input
                    id="new-password"
                    type="password"
                    className="glass-input glass-input-with-icon"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 mb-2 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 glass-input-icon"
                  />
                  <input
                    id="confirm-password"
                    type="password"
                    className="glass-input glass-input-with-icon"
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => {
                      const strength =
                        (newPassword.length >= 6 ? 1 : 0) +
                        (/[A-Z]/.test(newPassword) ? 1 : 0) +
                        (/[0-9]/.test(newPassword) ? 1 : 0) +
                        (/[^A-Za-z0-9]/.test(newPassword) ? 1 : 0);
                      const colors = [
                        "bg-red-400",
                        "bg-amber-400",
                        "bg-sky-400",
                        "bg-emerald-400",
                      ];
                      return (
                        <motion.div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= strength
                              ? colors[strength - 1]
                              : "bg-white/10"
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: level * 0.1 }}
                        />
                      );
                    })}
                  </div>
                  <p className="text-white/25 text-[10px] ml-1">
                    Use uppercase, numbers and symbols for stronger security
                  </p>
                </div>
              )}

              {error && (
                <motion.div
                  className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <GlassButton
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Update Password
                <ArrowRight size={16} />
              </GlassButton>
            </form>
          ) : (
            <motion.div
              className="text-center space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-400/20 border border-emerald-400/30 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  bounce: 0.5,
                  duration: 0.8,
                }}
              >
                <CheckCircle2 size={36} className="text-emerald-400" />
              </motion.div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Password Updated
                </h2>
                <p className="text-white/40 text-sm">
                  You can now sign in with your new password.
                </p>
              </div>
              <GlassButton
                size="lg"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Go to Sign In
                <ArrowRight size={16} />
              </GlassButton>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
